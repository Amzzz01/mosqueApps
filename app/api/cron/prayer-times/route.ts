// app/api/cron/prayer-times/route.ts
// Runs every minute (Vercel Pro). Sends prayer time reminders.
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { fetchPrayerTimes } from '@/lib/api/jakim';

export const runtime = 'nodejs';
export const maxDuration = 30;

function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export async function GET(request: Request) {
  // Verify cron secret
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();

    // Read notification settings
    const settingsSnap = await db.collection('settings').doc('notifications').get();
    const settings = settingsSnap.data() || {};

    if (!settings.prayerNotifications) {
      return NextResponse.json({ skipped: true, reason: 'prayerNotifications disabled' });
    }

    const prayerZone: string = settings.prayerZone || 'KDH01';
    const reminderMinutes: number = settings.prayerReminderMinutes ?? 15;

    // Get Malaysia time (UTC+8)
    const nowUtc = new Date();
    const myt = new Date(nowUtc.getTime() + 8 * 60 * 60 * 1000);
    const currentMinutes = myt.getUTCHours() * 60 + myt.getUTCMinutes();
    const dateStr = myt.toISOString().slice(0, 10); // YYYY-MM-DD

    // Check what's already been sent today
    const sentLogSnap = await db.collection('settings').doc('prayerSentLog').get();
    const sentLog: Record<string, string[]> = sentLogSnap.exists ? (sentLogSnap.data() as Record<string, string[]>) : {};
    const sentToday: string[] = sentLog[dateStr] || [];

    // Fetch prayer times
    const prayerTimes = await fetchPrayerTimes(prayerZone);
    if (!prayerTimes) {
      return NextResponse.json({ error: 'Failed to fetch prayer times' }, { status: 502 });
    }

    const prayers: { key: string; nameMs: string; time: string }[] = [
      { key: 'fajr',    nameMs: 'Subuh',   time: prayerTimes.fajr },
      { key: 'dhuhr',   nameMs: 'Zohor',   time: prayerTimes.dhuhr },
      { key: 'asr',     nameMs: 'Asar',    time: prayerTimes.asr },
      { key: 'maghrib', nameMs: 'Maghrib', time: prayerTimes.maghrib },
      { key: 'isha',    nameMs: 'Isyak',   time: prayerTimes.isha },
    ];

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    for (const prayer of prayers) {
      if (sentToday.includes(prayer.key)) continue;

      const prayerMin = toMinutes(prayer.time);
      const reminderAt = prayerMin - reminderMinutes;

      // Fire within ±1 minute window
      if (currentMinutes >= reminderAt - 1 && currentMinutes <= reminderAt + 1) {
        // Send notification
        const res = await fetch(`${baseUrl}/api/notifications/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-secret': process.env.CRON_SECRET || '',
          },
          body: JSON.stringify({
            title: `Waktu ${prayer.nameMs}`,
            body: `${prayer.nameMs} pada ${prayer.time}. Masih ada ${reminderMinutes} minit lagi.`,
            recipientType: 'all',
            url: '/prayer-times',
          }),
        });

        const result = await res.json();

        // Record as sent
        await db.collection('settings').doc('prayerSentLog').set(
          { [dateStr]: FieldValue.arrayUnion(prayer.key) },
          { merge: true }
        );

        return NextResponse.json({
          sent: true,
          prayer: prayer.key,
          at: prayer.time,
          currentMinutes,
          reminderAt,
          result,
        });
      }
    }

    return NextResponse.json({
      sent: false,
      currentMinutes,
      dateStr,
      sentToday,
      message: 'No prayer reminder due right now',
    });
  } catch (err) {
    console.error('[cron/prayer-times] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
