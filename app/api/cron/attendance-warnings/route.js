import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/cronAuth';
import { connectDb } from '@/lib/mongodb';
import { getUserProfile } from '@/lib/firebase-admin';
import { evaluateStudentAttendance } from '@/lib/attendanceUtils';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Basic authorization for cron endpoint
    const cronAuth = authorizeCronRequest(request);
    if (!cronAuth.authorized) {
      return cronAuth.response;
    }

    const db = await connectDb();

    // 1. Fetch settings for institutes that enabled automation
    const allSettings = await db.collection('settings').find({
      'institute.enableAttendanceAutomation': true
    }).toArray();

    if (!allSettings || allSettings.length === 0) {
      return NextResponse.json({ message: 'Automation is not enabled for any institute or no settings found.' });
    }

    const now = new Date();
    const cooldownPeriod = 7 * 24 * 60 * 60 * 1000;
    const cooldownDate = new Date(now.getTime() - cooldownPeriod);

    const notificationsToInsert = [];
    const warningLogsToInsert = [];
    const emailsToSend = [];

    for (const settings of allSettings) {
      const threshold = settings.institute.lowAttendanceThreshold || 75;
      const instituteId = settings.userId;
      if (!instituteId) continue;

      // Scope attendance by institute — the settings doc's userId is the institute admin's uid,
      // which matches the instituteId stored on attendance records.
      // Fetch all unique students with attendance in this institute
      const distinctStudentIds = await db.collection('attendance').distinct('userId', { instituteId });

      if (distinctStudentIds.length === 0) continue;

      // Batch-check recent warning logs for all students in this institute
      const recentLogs = await db.collection('warning_logs').find({
        userId: { $in: distinctStudentIds },
        createdAt: { $gte: cooldownDate },
      }).project({ userId: 1 }).toArray();
      const warnedUserIds = new Set(recentLogs.map((l) => l.userId));

      // Batch-fetch attendance for all students in this institute
      const attendanceRecords = await db.collection('attendance').find({
        userId: { $in: distinctStudentIds },
        instituteId,
      }).toArray();

      const attendanceByUser = new Map();
      for (const rec of attendanceRecords) {
        if (!attendanceByUser.has(rec.userId)) {
          attendanceByUser.set(rec.userId, []);
        }
        attendanceByUser.get(rec.userId).push(rec);
      }

      // Batch-fetch user profiles for all students needing evaluation
      const studentsToCheck = distinctStudentIds.filter((id) => !warnedUserIds.has(id));
      if (studentsToCheck.length === 0) continue;

      const studentDocs = await db.collection('users').find({
        $or: [
          { uid: { $in: studentsToCheck } },
          { firebaseUid: { $in: studentsToCheck } },
        ],
      }).project({ uid: 1, firebaseUid: 1, email: 1, name: 1, fullName: 1 }).toArray();

      for (const student of studentDocs) {
        const uid = student.uid || student.firebaseUid;
        if (!uid) continue;

        const studentAttendance = attendanceByUser.get(uid) || [];
        const evaluation = evaluateStudentAttendance(studentAttendance, threshold);

        if (evaluation.isBelowThreshold) {
          const email = student.email;
          const name = student.name || student.fullName || 'Student';

          notificationsToInsert.push({
            userId: uid,
            title: 'Low Attendance Warning',
            message: `Your current attendance is ${evaluation.percentage}%, which is below the required ${threshold}%. Please improve your attendance.`,
            type: 'warning',
            read: false,
            createdAt: now,
          });

          warningLogsToInsert.push({
            userId: uid,
            percentage: evaluation.percentage,
            threshold,
            createdAt: now,
          });

          if (email) {
            emailsToSend.push({
              to_email: email,
              to_name: name,
              attendance_percentage: evaluation.percentage,
              threshold,
            });
          }
        }
      }
    }

    if (notificationsToInsert.length > 0) {
      await db.collection('notifications').insertMany(notificationsToInsert);
      await db.collection('warning_logs').insertMany(warningLogsToInsert);
    }

    // Send emails using EmailJS REST API
    if (emailsToSend.length > 0 && process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY) {
      for (const emailData of emailsToSend) {
        try {
          await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              service_id: process.env.EMAILJS_SERVICE_ID,
              template_id: process.env.EMAILJS_TEMPLATE_ID,
              user_id: process.env.EMAILJS_PUBLIC_KEY,
              template_params: emailData,
            }),
          });
        } catch (error) {
          console.error(`Failed to send email to ${emailData.to_email}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      warningsIssued: notificationsToInsert.length,
      message: `Issued ${notificationsToInsert.length} warnings.`,
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
