// app/api/cron/daily/route.ts
// Runs once daily at 06:00 UTC (14:00 MYT) on Vercel Hobby plan.
// Handles: prayer time summary, scheduled notifications,
// activity reminders, and donation reminders.
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { fetchPrayerTimes } from '@/lib/api/jakim';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ─── MYT Helpers ───

interface MYTComponents {
  hour: number;       // 0–23
  minute: number;     // 0–59
  day: number;        // day of month
  month: string;      // "YYYY-MM"
  dateStr: string;    // "YYYY-MM-DD"
  totalMin: number;   // hour * 60 + minute
}

function getMYTComponents(): MYTComponents {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now);

  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '0';
  const rawHour = parseInt(get('hour'));
  const hour    = rawHour === 24 ? 0 : rawHour;
  const minute  = parseInt(get('minute'));
  const year    = get('year');
  const month   = get('month');
  const day     = get('day');

  return {
    hour,
    minute,
    day: parseInt(day),
    month: `${year}-${month}`,
    dateStr: `${year}-${month}-${day}`,
    totalMin: hour * 60 + minute,
  };
}

/**
 * Format "HH:MM" (24h) to Malaysian 12-hour format.
 * PG  = hours 0–11  (12:00am–11:59am)
 * PTG = hours 12–17 (12:00pm–5:59pm)
 * MLM = hours 18–23 (6:00pm–11:59pm)
 */
function formatMYT12h(timeHHMM: string): string {
  const [h, m] = timeHHMM.split(':').map(Number);
  const period = h < 12 ? 'PG' : h < 18 ? 'PTG' : 'MLM';
  const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();

    const settingsSnap = await db.collection('settings').doc('notifications').get();
    const settings = settingsSnap.data() || {};

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const myt = getMYTComponents();
    const { hour: mytHour, day: mytDay, month: mytMonth, dateStr: mytDateStr, totalMin } = myt;

    const results: Record<string, unknown> = {};

    // ─── A. Daily Prayer Times Summary ───
    if (settings.prayerNotifications) {
      const prayerZone: string = settings.prayerZone || 'KDH01';
      const logKey = `${mytDateStr}_daily`;

      const sentLogSnap = await db.collection('settings').doc('prayerSentLog').get();
      const sentLog: Record<string, boolean> = sentLogSnap.exists
        ? (sentLogSnap.data() as Record<string, boolean>)
        : {};

      if (sentLog[logKey]) {
        results.prayerNotifications = { skipped: true, reason: 'already sent today', logKey };
      } else {
        const prayerTimes = await fetchPrayerTimes(prayerZone);

        if (prayerTimes) {
          const prayers = [
            { nameMs: 'Subuh',   time: prayerTimes.fajr },
            { nameMs: 'Zohor',   time: prayerTimes.dhuhr },
            { nameMs: 'Asar',    time: prayerTimes.asr },
            { nameMs: 'Maghrib', time: prayerTimes.maghrib },
            { nameMs: 'Isyak',   time: prayerTimes.isha },
          ];

          const body = prayers
            .map(p => `${p.nameMs} ${formatMYT12h(p.time)}`)
            .join(' | ');

          await fetch(`${baseUrl}/api/notifications/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-cron-secret': process.env.CRON_SECRET || '',
            },
            body: JSON.stringify({
              title: '🕌 Waktu Solat Hari Ini',
              body,
              recipientType: 'all',
              url: '/prayer-times',
            }),
          });

          await db.collection('settings').doc('prayerSentLog').set(
            { [logKey]: true },
            { merge: true }
          );

          results.prayerNotifications = { sent: true, zone: prayerZone, body };
        } else {
          results.prayerNotifications = { skipped: true, reason: 'JAKIM API unavailable' };
        }
      }
    }

    // ─── B. Scheduled Notifications (runs daily, any time) ───
    {
      const now = Timestamp.now();
      const scheduledSnap = await db
        .collection('notifications')
        .where('status', '==', 'scheduled')
        .where('scheduledFor', '<=', now)
        .get();

      let scheduledSent = 0;
      for (const docSnap of scheduledSnap.docs) {
        const notif = docSnap.data();
        const res = await fetch(`${baseUrl}/api/notifications/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-secret': process.env.CRON_SECRET || '',
          },
          body: JSON.stringify({
            title: notif.title,
            body: notif.body,
            recipientType: notif.recipientType || 'all',
            url: notif.url || '/',
            notifId: docSnap.id,
          }),
        });
        const result = await res.json();
        if (result.quietHours) continue;
        scheduledSent++;
      }
      results.scheduledNotifications = { processed: scheduledSnap.size, sent: scheduledSent };
    }

    // ─── C. Activity Reminder — 1 Day Before (fires at 19:00 MYT) ───
    if (mytHour === 19 && settings.eventNotifications && settings.eventReminder1Day) {
      const mytOffset = 8 * 60 * 60 * 1000;
      const nowUtc = new Date();
      const mytNow = new Date(nowUtc.getTime() + mytOffset);

      const tomorrowMyt = new Date(mytNow);
      tomorrowMyt.setUTCDate(tomorrowMyt.getUTCDate() + 1);
      tomorrowMyt.setUTCHours(0, 0, 0, 0);
      const tomorrowEnd = new Date(tomorrowMyt);
      tomorrowEnd.setUTCHours(23, 59, 59, 999);

      const tomorrowStartUtc = new Date(tomorrowMyt.getTime() - mytOffset);
      const tomorrowEndUtc   = new Date(tomorrowEnd.getTime() - mytOffset);

      const activitiesSnap = await db
        .collection('activities')
        .where('tarikh', '>=', Timestamp.fromDate(tomorrowStartUtc))
        .where('tarikh', '<',  Timestamp.fromDate(tomorrowEndUtc))
        .where('published', '==', true)
        .get();

      let sent1Day = 0;
      for (const docSnap of activitiesSnap.docs) {
        const activity = docSnap.data();
        await fetch(`${baseUrl}/api/notifications/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-secret': process.env.CRON_SECRET || '',
          },
          body: JSON.stringify({
            title: `Aktiviti Esok: ${activity.tajuk || activity.title || 'Aktiviti'}`,
            body: `Jangan lupa aktiviti masjid esok. Sila hadir tepat pada masanya.`,
            recipientType: 'all',
            url: '/activities',
          }),
        });
        sent1Day++;
      }
      results.activityReminder1Day = { found: activitiesSnap.size, sent: sent1Day };
    }

    // ─── D. Activity Reminder — Day Of (fires at 08:00 MYT) ───
    if (mytHour === 8 && settings.eventNotifications && settings.eventReminder1Hour) {
      const mytOffset = 8 * 60 * 60 * 1000;
      const nowUtc = new Date();
      const mytNow = new Date(nowUtc.getTime() + mytOffset);

      const todayMytStart = new Date(mytNow);
      todayMytStart.setUTCHours(0, 0, 0, 0);
      const todayMytEnd = new Date(mytNow);
      todayMytEnd.setUTCHours(23, 59, 59, 999);

      const todayStartUtc = new Date(todayMytStart.getTime() - mytOffset);
      const todayEndUtc   = new Date(todayMytEnd.getTime() - mytOffset);

      const activityLogSnap = await db.collection('settings').doc('activitySentLog').get();
      const activityLog: Record<string, string[]> = activityLogSnap.exists
        ? (activityLogSnap.data() as Record<string, string[]>)
        : {};
      const sentTodayIds: string[] = activityLog[mytDateStr] || [];

      const activitiesSnap = await db
        .collection('activities')
        .where('tarikh', '>=', Timestamp.fromDate(todayStartUtc))
        .where('tarikh', '<',  Timestamp.fromDate(todayEndUtc))
        .where('published', '==', true)
        .get();

      let sentToday = 0;
      const newSentIds: string[] = [];
      for (const docSnap of activitiesSnap.docs) {
        if (sentTodayIds.includes(docSnap.id)) continue;
        const activity = docSnap.data();
        await fetch(`${baseUrl}/api/notifications/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-secret': process.env.CRON_SECRET || '',
          },
          body: JSON.stringify({
            title: `Aktiviti Hari Ini: ${activity.tajuk || activity.title || 'Aktiviti'}`,
            body: `Aktiviti masjid berlangsung hari ini. Sila hadir tepat pada masanya.`,
            recipientType: 'all',
            url: '/activities',
          }),
        });
        newSentIds.push(docSnap.id);
        sentToday++;
      }

      if (newSentIds.length > 0) {
        await db.collection('settings').doc('activitySentLog').set(
          { [mytDateStr]: FieldValue.arrayUnion(...newSentIds) },
          { merge: true }
        );
      }
      results.activityReminderDayOf = { found: activitiesSnap.size, sent: sentToday };
    }

    // ─── E. Monthly Donation Reminder (fires at 09:00 MYT) ───
    if (mytHour === 9 && settings.donationReminder) {
      const reminderDay: number = settings.donationReminderDay ?? 1;

      if (mytDay === reminderDay) {
        const donationLogSnap = await db.collection('settings').doc('donationSentLog').get();
        const donationLog: Record<string, boolean> = donationLogSnap.exists
          ? (donationLogSnap.data() as Record<string, boolean>)
          : {};

        if (!donationLog[mytMonth]) {
          await fetch(`${baseUrl}/api/notifications/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-cron-secret': process.env.CRON_SECRET || '',
            },
            body: JSON.stringify({
              title: 'Peringatan Derma Bulanan',
              body: `Assalamualaikum. Ini adalah peringatan untuk sumbangan bulanan anda. Semoga Allah memberkati.`,
              recipientType: 'all',
              url: '/donations',
            }),
          });

          await db.collection('settings').doc('donationSentLog').set(
            { [mytMonth]: true },
            { merge: true }
          );
          results.donationReminder = { sent: true, month: mytMonth };
        } else {
          results.donationReminder = { sent: false, reason: 'already sent this month', month: mytMonth };
        }
      } else {
        results.donationReminder = {
          sent: false,
          reason: `not reminder day (today=${mytDay}, reminderDay=${reminderDay})`,
        };
      }
    }

    return NextResponse.json({
      success: true,
      mytHour,
      mytDateStr,
      mytMonth,
      results,
    });
  } catch (err) {
    console.error('[cron/daily] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
