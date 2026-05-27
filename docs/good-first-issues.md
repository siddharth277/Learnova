# 🌱 Good First Issues — Learnova

This document lists 10 pre-written, beginner-friendly GitHub issues ready to be created on the [Learnova repository](https://github.com/Premshaw23/Learnova).

## How to create these issues

### Option A — Automated script (recommended)

```bash
GITHUB_TOKEN=<your_pat_with_repo_scope> node .github/scripts/create-good-first-issues.mjs
```

> Requires Node.js 18+ and a GitHub Personal Access Token with `repo` scope.

### Option B — Manual creation

Copy each issue below and create it via **GitHub → Issues → New Issue**.

---

## Issue 1: UI — Add loading skeleton for dashboard cards

**Labels:** `good first issue`, `enhancement`, `UI`

**Title:** `UI: Add loading skeleton for dashboard cards`

**Body:**

Currently, when dashboard data is loading, users see a plain spinner or blank space. Adding skeleton loaders will make the UI feel faster and more polished.

**Relevant files:** `components/StudentDashboard.js`, `components/TeacherDashboardComponent .js`, `components/AdminDashboard.js`, `components/InstituteDashboard.js`

**Expected solution:** Create a reusable `SkeletonCard` component in `components/ui/` using Tailwind `animate-pulse`. Replace loading spinners in dashboard components.

**Acceptance criteria:**
- [ ] Reusable `SkeletonCard` component in `components/ui/`
- [ ] At least one dashboard uses the skeleton during loading
- [ ] Animation uses Tailwind `animate-pulse`
- [ ] No existing functionality broken

**Estimated effort:** 1–2 hours

---

## Issue 2: UI — Improve mobile responsiveness of the Navbar

**Labels:** `good first issue`, `UI`, `mobile`

**Title:** `UI: Improve mobile responsiveness of the Navbar`

**Body:**

The Navbar does not fully adapt to small-screen viewports. Links may overflow on screens smaller than 640px.

**Relevant files:** `components/Navbar.js`, `app/globals.css`

**Expected solution:** Add a hamburger menu that toggles a dropdown on mobile. Use `hidden sm:flex` Tailwind classes to hide desktop nav on mobile.

**Acceptance criteria:**
- [ ] Nav links hidden on mobile, shown via hamburger toggle
- [ ] Clicking a link closes the mobile menu
- [ ] No overflow on screens ≥ 320px wide
- [ ] Desktop layout unchanged

**Estimated effort:** 1–2 hours

---

## Issue 3: Validation — Add password strength indicator to the sign-up form

**Labels:** `good first issue`, `enhancement`, `validation`

**Title:** `Validation: Add password strength indicator to the sign-up form`

**Body:**

The sign-up form gives no feedback about password strength, which may lead to weak passwords.

**Relevant files:** `components/AuthForm.js`

**Expected solution:** Below the password input (sign-up only), add a 3–4 level strength bar using Tailwind colour utilities. No external libraries needed.

**Acceptance criteria:**
- [ ] Indicator visible in sign-up mode only
- [ ] Updates dynamically as the user types
- [ ] At least 3 strength levels with distinct colours
- [ ] Includes a text label alongside the colour bar

**Estimated effort:** 1–2 hours

---

## Issue 4: API — Return consistent error responses in all API route handlers

**Labels:** `good first issue`, `bug`, `API`

**Title:** `API: Return consistent error responses in all API route handlers`

**Body:**

Several API routes in `app/api/` return different error shapes, making client-side handling inconsistent.

**Relevant files:** `app/api/exceptions/*/route.js`, `app/api/register/route.js`, `app/api/labels/`

**Expected solution:** Standardise all errors to `{ error: "..." }` and successes to `{ success: true, data: ... }` with correct HTTP status codes.

**Acceptance criteria:**
- [ ] All API routes use `{ error: "..." }` for errors
- [ ] Correct HTTP status codes used
- [ ] No existing API behaviour changed (shape only)

**Estimated effort:** 1–3 hours

---

## Issue 5: UI — Add an empty-state message to the Notice Board

**Labels:** `good first issue`, `enhancement`, `UI`

**Title:** `UI: Add an empty-state message to the Notice Board`

**Body:**

When there are no notices, the Notice Board shows a blank area, which may confuse users.

**Relevant files:** `components/noticeBoard.js`, `app/notices/`

**Expected solution:** When notices list is empty and loading is complete, show a centred block with a `BellOff` icon (lucide-react) and message "No notices yet. Check back later."

**Acceptance criteria:**
- [ ] Empty state shown only when list is empty and not loading
- [ ] Uses an icon from `lucide-react`
- [ ] Consistent with dark-theme design

**Estimated effort:** 1 hour

---

## Issue 6: Docs — Add JSDoc comments to utility and helper functions

**Labels:** `good first issue`, `documentation`

**Title:** `Docs: Add JSDoc comments to utility and helper functions`

**Body:**

Utility functions in `lib/` and `utils/` have no documentation, making it harder for new contributors.

**Relevant files:** `lib/utils.js`, `utils/authUtils.js`, `services/authService.js`, `hooks/useAuth.js`

**Expected solution:** Add JSDoc comments (`@param`, `@returns`, description) to all exported functions in the listed files.

**Acceptance criteria:**
- [ ] All exported functions have JSDoc comments
- [ ] Comments include description, `@param`, and `@returns`
- [ ] No logic changes — documentation only

**Estimated effort:** 1–2 hours

---

## Issue 7: Test — Write basic unit tests for the AuthForm component

**Labels:** `good first issue`, `testing`

**Title:** `Test: Write basic unit tests for the AuthForm component`

**Body:**

The `AuthForm` component has no tests. Adding a few basic tests helps catch regressions.

**Relevant files:** `components/AuthForm.js`, `package.json`

**Expected solution:** Create `components/__tests__/AuthForm.test.js` with at least 5 test cases using Jest and React Testing Library.

**Acceptance criteria:**
- [ ] Test file at `components/__tests__/AuthForm.test.js`
- [ ] At least 5 test cases
- [ ] All tests pass (`npm test`)
- [ ] No production code changed

**Estimated effort:** 2–3 hours

---

## Issue 8: Fix — Improve 404 not-found page with navigation back to home

**Labels:** `good first issue`, `bug`, `UI`

**Title:** `Fix: Improve 404 not-found page with navigation back to home`

**Body:**

The current `app/not-found.js` is minimal and may not match the design system.

**Relevant files:** `app/not-found.js`

**Expected solution:** Update to show a large "404" heading, friendly message, and a "Go back home" `<Link>` button styled with the dark theme.

**Acceptance criteria:**
- [ ] Shows 404 heading and friendly message
- [ ] "Go back home" button navigates to `/`
- [ ] Consistent dark-theme styling
- [ ] Responsive on mobile and desktop

**Estimated effort:** 1 hour

---

## Issue 9: Validation — Add client-side validation to the Contact form

**Labels:** `good first issue`, `enhancement`, `validation`

**Title:** `Validation: Add client-side validation to the Contact form`

**Body:**

The contact form may not validate inputs before submitting, leading to unnecessary API calls or poor UX.

**Relevant files:** `app/contact/page.js`

**Expected solution:** Add validation for Name (required, ≥ 2 chars), Email (valid format), and Message (required, ≥ 10 chars). Show inline errors and block submission if invalid.

**Acceptance criteria:**
- [ ] All three fields validated before submit
- [ ] Inline error messages shown below invalid fields
- [ ] Form does not call EmailJS when validation fails
- [ ] Errors clear when user corrects the field

**Estimated effort:** 1–2 hours

---

## Issue 10: UI — Make Role Selection accessible with keyboard navigation

**Labels:** `good first issue`, `accessibility`, `UI`

**Title:** `UI: Make the Role Selection screen accessible with keyboard navigation`

**Body:**

Role selection cards in `RoleSelection.js` may not be keyboard-navigable, preventing access for users who rely on keyboards.

**Relevant files:** `components/RoleSelection.js`

**Expected solution:** Add `role="button"`, `tabIndex={0}`, `onKeyDown` handler for Enter/Space, and a visible focus ring (`focus:ring-2 focus:ring-indigo-500`).

**Acceptance criteria:**
- [ ] All role cards focusable via Tab
- [ ] Enter/Space selects the focused card
- [ ] Visible focus ring shown on active card
- [ ] Mouse interaction unchanged

**Estimated effort:** 1 hour
