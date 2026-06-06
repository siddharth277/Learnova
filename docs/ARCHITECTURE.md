# Architecture

This document explains how Learnova's services connect, how data flows through the system, and why each technology was chosen for its role.

---

## Table of Contents

- [High-Level System Diagram](#high-level-system-diagram)
- [Technology Responsibilities](#technology-responsibilities)
- [Authentication Flow](#authentication-flow)
- [Attendance Data Flow](#attendance-data-flow)
- [Firebase vs MongoDB — Responsibility Split](#firebase-vs-mongodb--responsibility-split)
- [File Storage — Vercel Blob](#file-storage--vercel-blob)
- [Real-Time Notices — Redis + SSE](#real-time-notices--redis--sse)
- [AI Services](#ai-services)
- [Session Management](#session-management)
- [Role-Based Access Control](#role-based-access-control)
- [Cron Jobs](#cron-jobs)
- [Deployment](#deployment)

---

## High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser / PWA                              │
│                                                                     │
│   React 19 + Next.js 15    │   Face API.js (WebGL)                 │
│   Tailwind CSS + Framer    │   Camera stream → face descriptor      │
└──────────────┬─────────────┴──────────────┬────────────────────────┘
               │  HTTPS                      │  face descriptor (128-D)
               ▼                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js API Routes (Vercel)                     │
│                         app/api/**                                  │
│                                                                     │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │   Auth   │  │ Attendance │  │ Notices  │  │   Groq / StudyAI │ │
│  │  /auth/* │  │/attendance │  │/notices  │  │  /groq /StudyAI  │ │
│  └────┬─────┘  └─────┬──────┘  └────┬─────┘  └────────┬─────────┘ │
└───────┼──────────────┼──────────────┼───────────────────┼──────────┘
        │              │              │                   │
   ┌────▼────┐   ┌─────▼──────┐  ┌───▼──────┐    ┌──────▼──────┐
   │Firebase │   │  MongoDB   │  │  Redis   │    │  Groq API   │
   │  Auth + │   │  (Atlas)   │  │(Upstash) │    │  (LLM)      │
   │Firestore│   │            │  │          │    └─────────────┘
   └─────────┘   └─────┬──────┘  └──────────┘
                       │
                 ┌─────▼──────┐
                 │Vercel Blob │
                 │(avatars,   │
                 │ face photos│
                 │ labels/)   │
                 └────────────┘
```

---

## Technology Responsibilities

| Technology | What it owns |
|---|---|
| **Firebase Auth** | User identity, email verification, password reset, custom role claims on JWT |
| **Firestore** | User profiles, notices, attendance records (source of truth for real-time reads), stats |
| **MongoDB Atlas** | Attendance records (operational queries), user registration data, face descriptors, courses, notifications, gamification |
| **Vercel Blob** | Profile avatars, face registration photos (`labels/`), any other uploaded files |
| **Redis (Upstash)** | Rate limiting, session tokens, SSE notice publishing, cron-job deduplication |
| **Face API.js** | Client-side face detection and 128-D descriptor generation — runs entirely in the browser |
| **Groq API** | LLM inference for the AI chatbot, study AI, and productivity recommendations |
| **Vercel** | Hosting, serverless functions, cron job scheduling, edge network |

---

## Authentication Flow

```
User enters credentials
        │
        ▼
Firebase Auth (client SDK)
  - Signs in with email/password
  - Returns Firebase ID token (JWT)
        │
        ▼
Client stores token → sends as:
  Authorization: Bearer <id_token>
        │
        ▼
Next.js API route (server)
  requireAuth(request)
    │
    ├─ Verifies token with Firebase Admin SDK
    ├─ Decodes uid, email, role (custom claim)
    │
    └─ Optional: requireRole(request, ["teacher","admin"])
           │
           └─ Checks decodedToken.role against allowed list
                  │
                  ├─ Allowed → handler runs
                  └─ Denied  → 403 ForbiddenError
```

### Role synchronisation

Firebase custom claims are cached in the JWT for up to 1 hour. After a role change:

1. Admin calls `POST /api/auth/set-role` → Firebase custom claim updated
2. Client polls `GET /api/auth/me` → compares `role` (Firestore, authoritative) vs `jwtRole` (JWT claim)
3. If `rolesInSync: false` → client calls `firebase.auth().currentUser.getIdToken(true)` to force a token refresh
4. New token with updated claim is used for subsequent requests

### Protected routes (middleware)

`middleware.js` runs on every request before the route handler. It:
- Reads the `authToken` cookie
- Verifies it with Firebase Admin
- Redirects unauthenticated users to `/auth`
- Redirects authenticated users to their role-specific dashboard

---

## Attendance Data Flow

```
1. FACE REGISTRATION (one-time, done by student)
───────────────────────────────────────────────
Student opens /register
        │
        ▼
Browser: Face API.js loads models from /public/models/
        │
        ▼
Student's face captured → 128-D descriptor generated (client-side)
        │
        ▼
POST /api/register  (multipart/form-data)
  Fields: name, rollNo, email, photo (file), faceDescriptor (JSON)
        │
        ├─ Validates file magic bytes, size, type
        ├─ Uploads photo → Vercel Blob  (labels/<name>/<uuid>.jpg)
        └─ Writes to MongoDB users collection:
             { name, rollNo, email, image: blobUrl, faceDescriptor, firebaseUid }


2. DAILY ATTENDANCE (face recognition session)
───────────────────────────────────────────────
Teacher starts attendance session
        │
        ▼
Student opens attendance page
        │
        ▼
Browser: webcam stream → Face API.js
  - Detects face in frame (TinyFaceDetector)
  - Maps 68 landmarks (FaceLandmark68)
  - Generates 128-D descriptor (FaceRecognition)
  - Compares against stored descriptors from MongoDB
  - Euclidean distance < threshold → match found
  - Confidence score calculated (0–100)
        │
        ▼
POST /api/attendance/record
  { userId, studentName, email, confidenceScore (≥60), date }
        │
        ├─ requireAuth → student can only submit own record
        ├─ confidenceScore < 60 → 400 rejected
        ├─ AttendanceService.recordAttendance() saga:
        │    Step 1: write to MongoDB attendance_records
        │    Step 2: write to Firestore attendance_records
        │    (compensating rollback on failure)
        └─ Returns { alreadyRecorded: false } 201
           or { alreadyRecorded: true  } 200 if already present today


3. ATTENDANCE QUERIES
───────────────────────────────────────────────
GET /api/attendance/heatmap   → MongoDB  (calendar view)
GET /api/attendance-warnings  → MongoDB  (students below threshold)
GET /api/analytics/attendance-risk → MongoDB aggregation
Cron: /api/cron/attendance-warnings → runs nightly, sends notifications
```

---

## Firebase vs MongoDB — Responsibility Split

Both databases store some overlapping data intentionally. Here is why:

| Data | Firebase Firestore | MongoDB |
|---|---|---|
| User profiles | ✅ Source of truth for auth/role | ✅ Extended profile + face descriptor |
| Attendance records | ✅ Real-time dashboard reads | ✅ Operational queries, aggregations |
| Notices | ✅ Primary store | ✅ Mirror for SSE change stream |
| Stats | ✅ Per-user stat counters | ❌ |
| Gamification | ❌ | ✅ XP, streak, badges |
| Courses / Curriculum | ❌ | ✅ |
| Notifications | ❌ | ✅ |
| Conversations | ❌ | ✅ |

**Why two databases?**

- **Firestore** excels at real-time listeners, role-based security rules, and tight Firebase Auth integration. It is used where the client needs live updates or where data is tightly coupled to auth (user profiles, stats).
- **MongoDB** excels at complex aggregation queries, flexible schemas, and bulk operations. It handles attendance analytics, face descriptors, and all relational-style queries that Firestore's limited query model cannot express efficiently.
- **Reconciliation:** `POST /api/admin/reconcile` and the reconciliation cron job detect and fix inconsistencies between the two stores. The saga pattern (see `lib/transactionCoordinator.js`) ensures writes to both stores are atomic with compensating rollbacks on failure.

---

## File Storage — Vercel Blob

All user-uploaded files go to Vercel Blob. MongoDB stores the public URL returned by the Blob API — never the raw file.

```
Upload flow:
  Client → multipart/form-data → API route
    │
    ├─ Validate file (magic bytes, size, MIME type)
    ├─ put(path, buffer, { access: "public" }) → Vercel Blob
    │    Returns: { url: "https://blob.vercel-storage.com/..." }
    └─ Store url in MongoDB

Delete flow (on saga rollback):
    del(url) → removes blob
    deleteOne({ _id }) → removes MongoDB record
```

**Storage paths**

| Path prefix | Contents |
|---|---|
| `labels/<name>/<uuid>.<ext>` | Face registration photos (used for recognition) |
| `avatars/<uid>/...` | Profile avatars |

---

## Real-Time Notices — Redis + SSE

Notices are delivered in real time to all connected clients without polling.

```
Teacher POSTs /api/notices
        │
        ├─ 1. Write to Firestore (primary store)
        ├─ 2. Mirror to MongoDB (for SSE change stream fallback)
        └─ 3. publishNoticeToRedis(notice)
                  │
                  ▼
           Redis pub/sub channel
                  │
                  ▼
           GET /api/notices/stream  (SSE endpoint)
             - Each connected client holds an open connection
             - Reads from Redis channel
             - Pushes event: data: <json>\n\n
                  │
                  ▼
           Client EventSource receives notice instantly
           → UI updates without page reload
```

Redis also handles:
- **Rate limiting** — sliding window counters per `ip_uid` key
- **Session storage** — `sessionId` → `{ uid, ip, fingerprint, createdAt }`
- **Cron deduplication** — prevents double-firing of scheduled jobs

---

## AI Services

### Groq (chatbot + productivity)
- `POST /api/groq` — passes user messages to Groq LLM, returns streamed response
- `POST /api/ai-productivity` — generates productivity recommendations based on user's study session data
- Model: configured via `GROQ_API_KEY` environment variable

### Study AI (RAG — Retrieval-Augmented Generation)
- `POST /api/StudyAI/embed` — teacher uploads study material → generates embeddings → stored in MongoDB
- `POST /api/StudyAI/retrieve` — student asks a question → semantic search over embeddings → relevant chunks returned → passed to LLM for answer

### Face API.js
- Runs entirely in the browser — no video or image data is sent to any server during recognition
- Only the 128-D face descriptor (a float array) is transmitted to the server for matching and storage
- Models loaded from `/public/models/` — see [FACE_RECOGNITION.md](./FACE_RECOGNITION.md)

---

## Session Management

Learnova uses a two-layer session system:

```
Layer 1 — Firebase ID token (stateless JWT)
  - Short-lived (1 hour)
  - Carries uid, email, role claim
  - Verified server-side on every request via Firebase Admin SDK
  - Stored as httpOnly cookie: authToken

Layer 2 — Redis session (stateful)
  - Created by POST /api/auth/session
  - Stores { uid, ip, userAgent, createdAt }
  - Allows server-side termination (admin can kill sessions)
  - sessionId stored as httpOnly cookie
  - Admin endpoint: DELETE /api/admin/sessions/terminate
```

If the Firebase token is valid but the Redis session is missing or terminated, the user is treated as logged out.

---

## Role-Based Access Control

Five roles are defined in `constants/userRoles.js`:

| Role | Access |
|---|---|
| `student` | Own attendance, own stats, own gamification, courses, notices (read) |
| `teacher` | All student data in their institute, attendance management, notices (write) |
| `staff` | Notices (write), institute management |
| `admin` | Full access to all endpoints, session management, reconciliation |
| `parent` | Read-only access to linked student's attendance, grades, notices |

Role is stored in two places:
- **Firestore** `users/{uid}.role` — authoritative source, always up to date
- **Firebase JWT custom claim** `role` — cached for up to 1 hour, used for fast server-side checks

The `requireRole(request, allowedRoles)` middleware in `lib/rbac.js` checks the JWT claim. For role changes to take effect immediately, the client must force a token refresh (see [Authentication Flow](#authentication-flow)).

---

## Cron Jobs

Scheduled via Vercel Cron (configured in `vercel.json`).

| Job | Schedule | What it does |
|---|---|---|
| `POST /api/cron/attendance-risk` | Nightly | Scans MongoDB for students below attendance threshold, flags them |
| `POST /api/cron/attendance-warnings` | Nightly | Sends warning notifications to at-risk students and their parents |

Both jobs are protected by a Vercel Cron secret header and use Redis to prevent duplicate execution if triggered more than once.

---

## Deployment

```
GitHub (master branch)
        │
        ▼ push / PR merge
Vercel (automatic deployment)
  - Builds Next.js app
  - Deploys serverless functions for each API route
  - Configures cron jobs from vercel.json
  - Environment variables set in Vercel dashboard

External services (always-on, not deployed by Vercel):
  - MongoDB Atlas   — managed cloud cluster
  - Firebase        — managed by Google
  - Upstash Redis   — managed serverless Redis
  - Vercel Blob     — managed by Vercel
  - Groq API        — managed by Groq
```

Live deployment: **https://learnova-web.vercel.app**

For local setup, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).  
For API reference, see [API.md](./API.md).  
For face recognition setup, see [FACE_RECOGNITION.md](./FACE_RECOGNITION.md).
