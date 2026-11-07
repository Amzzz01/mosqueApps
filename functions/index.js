// Cloud Functions for MASJID AL-FALAH notifications.
// Callables are used by the admin panel; schedules run in Malaysia time on Cloud Scheduler.
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { setGlobalOptions } from 'firebase-functions/v2';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import {
  TIME_ZONE,
  addDays,
  buildPrayerSummary,
  buildPushData,
  cleanContent,
  cleanScheduleTime,
  cleanUrl,
  dayOfMonthInMalaysia,
  groupTokens,
  isInQuietHours,
  isValidId,
  malaysiaDayRange,
  monthInMalaysia,
  notificationsEnabled,
  quietHoursEnd,
  todayInMalaysia,
} from './notificationLogic.js';
import {
  APP_BASE_URL,
  createNotification,
  deliverNotification,
  loadAllTokenDocs,
  loadSettings,
  notificationsCol,
  pushToTokens,
  requireNotifAdmin,
} from './push.js';

initializeApp();
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 5 });

const SCHEDULE = { timeZone: TIME_ZONE, timeoutSeconds: 300, memory: '512MiB' };
const SEND_OPTIONS = { timeoutSeconds: 300, memory: '512MiB' };

const loadGroupedTokens = async () => groupTokens(await loadAllTokenDocs());

/** Settings for the automatic reminders, or null when the super admin has switched notifications off. */
const loadSettingsIfEnabled = async () => {
  const settings = await loadSettings();
  if (notificationsEnabled(settings)) return settings;
  logger.info('Notifications are switched off by the super admin; skipping');
  return null;
};

/** Creates and immediately sends an automatic notification (reminders bypass quiet hours by design). */
const sendAutomatic = async ({ title, body, url, source }) => {
  const ref = await createNotification({ title, body, url, createdBy: 'system', source });
  return deliverNotification(ref, await loadGroupedTokens());
};

// ─── Admin callables ───

/**
 * Send now, or schedule. Input: { title, body, url?, scheduleAt? (ISO string) }.
 * A "send now" during quiet hours is scheduled for when quiet hours end instead.
 */
export const sendNotification = onCall(SEND_OPTIONS, async (request) => {
  const admin = await requireNotifAdmin(request);
  const content = cleanContent(request.data);
  if (!content) throw new HttpsError('invalid-argument', 'Tajuk dan kandungan diperlukan.');
  const url = cleanUrl(request.data?.url);

  const now = Date.now();
  const settings = await loadSettings();
  let dueMs = null;
  let deferred = false;

  if (request.data?.scheduleAt) {
    // Scheduling is still allowed while switched off; it waits until notifications are on again
    dueMs = cleanScheduleTime(request.data.scheduleAt, now);
    if (!dueMs) throw new HttpsError('invalid-argument', 'Masa jadual mesti sekurang-kurangnya 1 minit dan tidak lebih 60 hari dari sekarang.');
  } else {
    if (!notificationsEnabled(settings)) {
      throw new HttpsError('failed-precondition', 'Semua notifikasi telah dimatikan oleh Super Admin.');
    }
    if (isInQuietHours(settings, new Date(now))) {
      dueMs = quietHoursEnd(settings, new Date(now));
      deferred = true;
    }
  }

  const ref = await createNotification({
    ...content,
    url,
    createdBy: admin.uid,
    source: 'admin',
    dueAt: dueMs ? Timestamp.fromMillis(dueMs) : null,
  });

  if (dueMs) {
    return { id: ref.id, scheduled: true, deferred, dueAt: new Date(dueMs).toISOString(), sent: 0, failed: 0, cleaned: 0 };
  }

  const result = await deliverNotification(ref, await loadGroupedTokens());
  return { id: ref.id, scheduled: false, deferred: false, ...result };
});

/** Cancel a scheduled notification before it goes out. Input: { id }. */
export const cancelScheduledNotification = onCall(async (request) => {
  await requireNotifAdmin(request);
  const { id } = request.data ?? {};
  if (!isValidId(id)) throw new HttpsError('invalid-argument', 'ID tidak sah.');

  const ref = notificationsCol().doc(id);
  await getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.data()?.status !== 'scheduled') {
      throw new HttpsError('failed-precondition', 'Notifikasi ini tidak lagi dijadualkan.');
    }
    transaction.update(ref, { status: 'cancelled', dueAt: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
  });
  return { ok: true };
});

/** Push a test notification to the calling admin's own devices only (not saved to the list). */
export const sendTestNotification = onCall(async (request) => {
  const admin = await requireNotifAdmin(request);
  const snapshot = await getFirestore().collection(`users/${admin.uid}/fcmTokens`).get();
  const tokens = groupTokens(snapshot.docs.map(doc => ({ token: doc.data().token, ref: doc.ref, source: 'user' })));
  if (tokens.length === 0) {
    throw new HttpsError('failed-precondition', 'Tiada peranti berdaftar untuk akaun anda. Aktifkan notifikasi dahulu.');
  }

  const data = buildPushData('', {
    title: '🔔 Notifikasi Ujian',
    body: 'Jika anda nampak ini, notifikasi berfungsi dengan baik.',
    url: '/admin/settings/notifications',
  }, APP_BASE_URL.value());
  const result = await pushToTokens(tokens, data);
  return { devices: tokens.length, ...result };
});

/** Checks every saved token with a dry-run send and deletes the dead ones. */
export const cleanupTokens = onCall(SEND_OPTIONS, async (request) => {
  await requireNotifAdmin(request);
  const docs = await loadAllTokenDocs();
  const emptyRefs = docs.filter(doc => !doc.token).map(doc => doc.ref);
  const tokens = groupTokens(docs);

  const result = await pushToTokens(tokens, { title: 'check', body: 'check' }, { dryRun: true });
  if (emptyRefs.length > 0) {
    const writer = getFirestore().bulkWriter();
    emptyRefs.forEach(ref => writer.delete(ref));
    await writer.close();
  }

  return {
    totalScanned: docs.length,
    valid: result.sent,
    invalid: result.failed,
    deleted: result.cleaned + emptyRefs.length,
  };
});

// ─── Schedules ───

/** Every 5 minutes: send scheduled notifications (including ones held back by quiet hours). */
export const sendDueNotifications = onSchedule({ ...SCHEDULE, schedule: 'every 5 minutes' }, async () => {
  // While switched off, due notifications stay scheduled and go out once it's switched back on
  if (!(await loadSettingsIfEnabled())) return;
  const snapshot = await notificationsCol().where('dueAt', '<=', Timestamp.now()).get();
  if (snapshot.empty) return;

  const tokens = await loadGroupedTokens();
  for (const doc of snapshot.docs) {
    // One failure is marked failed and must not stop the rest
    await deliverNotification(doc.ref, tokens).catch(error => {
      logger.error('Scheduled send failed', { id: doc.id, error: error.message });
    });
  }
});

/** Marks a key in a settings/{logDoc} map; returns false if it was already marked (already sent). */
const markOnce = async (logDoc, key) => {
  const ref = getFirestore().doc(`settings/${logDoc}`);
  return getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.data()?.[key]) return false;
    transaction.set(ref, { [key]: true }, { merge: true });
    return true;
  });
};

const fetchPrayerTimes = async (zone) => {
  const response = await fetch(
    `https://www.e-solat.gov.my/index.php?r=esolatApi/TakwimSolat&period=today&zone=${encodeURIComponent(zone)}`
  );
  if (!response.ok) throw new Error(`JAKIM API ${response.status}`);
  const data = await response.json();
  return data.status === 'OK!' && data.prayerTime?.length ? data.prayerTime[0] : null;
};

/** 05:00 daily: today's prayer times. */
export const sendPrayerSummary = onSchedule({ ...SCHEDULE, schedule: '0 5 * * *' }, async () => {
  const settings = await loadSettingsIfEnabled();
  if (!settings?.prayerNotifications) return;

  const zone = settings.prayerZone || 'KDH01';
  const times = await fetchPrayerTimes(zone);
  if (!times) {
    logger.warn('Prayer summary skipped: JAKIM API returned no data', { zone });
    return;
  }
  if (!(await markOnce('prayerSentLog', `${todayInMalaysia()}_daily`))) return;

  await sendAutomatic({
    title: '🕌 Waktu Solat Hari Ini',
    body: buildPrayerSummary(times),
    url: '/prayer-times',
    source: 'prayer',
  });
});

/** Published activities on a Malaysian calendar day (published is filtered here to avoid a composite index). */
const activitiesOn = async (isoDate) => {
  const { start, end } = malaysiaDayRange(isoDate);
  const snapshot = await getFirestore().collection('activities')
    .where('tarikh', '>=', Timestamp.fromDate(start))
    .where('tarikh', '<', Timestamp.fromDate(end))
    .get();
  return snapshot.docs.filter(doc => doc.data().published === true);
};

const activityTitle = (doc) => doc.data().tajuk || doc.data().title || 'Aktiviti';

/** 19:00 daily: reminder for tomorrow's activities. */
export const sendActivityReminderDayBefore = onSchedule({ ...SCHEDULE, schedule: '0 19 * * *' }, async () => {
  const settings = await loadSettingsIfEnabled();
  if (!settings?.eventNotifications || !settings.eventReminder1Day) return;

  const tomorrow = addDays(todayInMalaysia(), 1);
  for (const doc of await activitiesOn(tomorrow)) {
    if (!(await markOnce('activitySentLog', `${tomorrow}_dayBefore_${doc.id}`))) continue;
    await sendAutomatic({
      title: `Aktiviti Esok: ${activityTitle(doc)}`,
      body: 'Jangan lupa aktiviti masjid esok. Sila hadir tepat pada masanya.',
      url: '/galeri',
      source: 'activity',
    });
  }
});

/** 08:00 daily: reminder for today's activities. */
export const sendActivityReminderToday = onSchedule({ ...SCHEDULE, schedule: '0 8 * * *' }, async () => {
  const settings = await loadSettingsIfEnabled();
  if (!settings?.eventNotifications) return;

  const today = todayInMalaysia();
  for (const doc of await activitiesOn(today)) {
    if (!(await markOnce('activitySentLog', `${today}_today_${doc.id}`))) continue;
    await sendAutomatic({
      title: `Aktiviti Hari Ini: ${activityTitle(doc)}`,
      body: 'Aktiviti masjid berlangsung hari ini. Sila hadir tepat pada masanya.',
      url: '/galeri',
      source: 'activity',
    });
  }
});

/** 09:00 daily: monthly donation reminder on the chosen day of the month. */
export const sendDonationReminder = onSchedule({ ...SCHEDULE, schedule: '0 9 * * *' }, async () => {
  const settings = await loadSettingsIfEnabled();
  if (!settings?.donationReminder) return;
  if (dayOfMonthInMalaysia() !== Number(settings.donationReminderDay ?? 1)) return;
  if (!(await markOnce('donationSentLog', monthInMalaysia()))) return;

  await sendAutomatic({
    title: 'Peringatan Derma Bulanan',
    body: 'Assalamualaikum. Ini adalah peringatan untuk sumbangan bulanan anda. Semoga Allah memberkati.',
    url: '/derma',
    source: 'donation',
  });
});
