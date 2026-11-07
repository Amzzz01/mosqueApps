// Firebase side of notifications: loading tokens, pushing, and delivering a notification doc.
import { HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { defineString } from 'firebase-functions/params';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import {
  DEAD_TOKEN_CODES,
  buildPushData,
  canSendNotifications,
  finalStatus,
} from './notificationLogic.js';

// Public site address, used for notification icons. Set with `firebase functions:config` prompts on deploy.
export const APP_BASE_URL = defineString('APP_BASE_URL', { default: 'https://mosque-apps.vercel.app' });

const FCM_BATCH_SIZE = 500;
const PUSH_TTL_SECONDS = String(24 * 60 * 60);

export const notificationsCol = () => getFirestore().collection('notifications');
export const settingsRef = () => getFirestore().doc('settings/notifications');

export const loadSettings = async () => (await settingsRef().get()).data() ?? {};

/** Every registered device: signed-in admins (users/{uid}/fcmTokens) and guests (guestTokens). */
export const loadAllTokenDocs = async () => {
  const db = getFirestore();
  const [userSnap, guestSnap] = await Promise.all([
    db.collectionGroup('fcmTokens').get(),
    db.collection('guestTokens').get(),
  ]);
  return [
    ...userSnap.docs.map(doc => ({ token: doc.data().token, ref: doc.ref, source: 'user' })),
    ...guestSnap.docs.map(doc => ({ token: doc.data().token, ref: doc.ref, source: 'guest' })),
  ];
};

/** Removes every saved copy of the given tokens. */
const deleteRefs = async (refs) => {
  if (refs.length === 0) return;
  const writer = getFirestore().bulkWriter();
  refs.forEach(ref => writer.delete(ref));
  await writer.close();
};

/**
 * Sends a data-only push to every grouped token ({ token, refs }).
 * Dead tokens are deleted. With dryRun, nothing is shown on any device (used to validate tokens).
 */
export const pushToTokens = async (tokens, data, { dryRun = false } = {}) => {
  let sent = 0;
  let failed = 0;
  const deadRefs = [];

  for (let i = 0; i < tokens.length; i += FCM_BATCH_SIZE) {
    const batch = tokens.slice(i, i + FCM_BATCH_SIZE);
    const { responses } = await getMessaging().sendEach(
      batch.map(({ token }) => ({
        token,
        data,
        webpush: { headers: { Urgency: 'high', TTL: PUSH_TTL_SECONDS } },
      })),
      dryRun
    );

    responses.forEach((response, index) => {
      if (response.success) {
        sent += 1;
        return;
      }
      failed += 1;
      if (DEAD_TOKEN_CODES.has(response.error?.code)) {
        deadRefs.push(...batch[index].refs);
      } else {
        logger.warn('Push failed', { code: response.error?.code });
      }
    });
  }

  await deleteRefs(deadRefs);
  return { sent, failed, cleaned: deadRefs.length };
};

/**
 * Delivers one notification doc exactly once. The doc is claimed in a transaction, so the
 * scheduler and a cancel (or two scheduler runs) can never both act on it.
 * Returns the result, or null if the doc was not waiting to be sent.
 */
export const deliverNotification = async (ref, groupedTokens) => {
  const db = getFirestore();
  const notif = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    if (!data || !['scheduled', 'queued'].includes(data.status)) return null;
    transaction.update(ref, { status: 'sending', dueAt: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
    return data;
  });
  if (!notif) return null;

  try {
    const data = buildPushData(ref.id, notif, APP_BASE_URL.value());
    const result = await pushToTokens(groupedTokens, data);
    const attempted = groupedTokens.length;
    await ref.update({
      status: finalStatus({ attempted, sent: result.sent }),
      recipientCount: attempted,
      sentCount: result.sent,
      failedCount: result.failed,
      cleanedCount: result.cleaned,
      sentAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    logger.info('Notification delivered', { id: ref.id, attempted, ...result });
    return { id: ref.id, attempted, ...result };
  } catch (error) {
    logger.error('Notification delivery failed', { id: ref.id, error: error.message });
    await ref.update({ status: 'failed', updatedAt: FieldValue.serverTimestamp() }).catch(() => undefined);
    throw error;
  }
};

/**
 * Creates a notification doc (so it appears in the in-app list) and, unless dueAt is given,
 * sends it right away. Used by admin sends and by the automatic reminders.
 */
export const createNotification = async ({ title, body, url, createdBy, source, dueAt = null }) => {
  const ref = notificationsCol().doc();
  await ref.set({
    title,
    body,
    url,
    recipientType: 'all',
    status: dueAt ? 'scheduled' : 'queued',
    ...(dueAt ? { dueAt, scheduledFor: dueAt } : {}),
    source,
    createdBy,
    readBy: [],
    sentCount: 0,
    failedCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref;
};

/** Throws unless the caller is an active admin allowed to send notifications. Returns the admin data. */
export const requireNotifAdmin = async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sila log masuk sebagai admin.');
  const snapshot = await getFirestore().doc(`adminUsers/${request.auth.uid}`).get();
  const admin = snapshot.data();
  if (!canSendNotifications(admin)) {
    throw new HttpsError('permission-denied', 'Anda tidak mempunyai kebenaran untuk menghantar notifikasi.');
  }
  return { uid: request.auth.uid, ...admin };
};
