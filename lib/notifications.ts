// lib/notifications.ts
import {
  collection, doc, getDoc, getDocs, updateDoc, deleteDoc,
  query, orderBy, limit, serverTimestamp, Timestamp,
  onSnapshot, Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { callFunction } from '@/lib/firebase/functions';

// ─── Types ───
export interface NotificationData {
  id?: string;
  title: string;
  body: string;
  recipientType: 'all' | 'members' | 'sponsors' | 'donors' | 'specific';
  recipientIds?: string[];
  topic?: string;
  url?: string;
  status: 'pending' | 'queued' | 'sending' | 'sent' | 'failed' | 'scheduled' | 'cancelled';
  scheduledFor?: Date | Timestamp | null;
  sentAt?: Date | Timestamp | null;
  sentCount?: number;
  failedCount?: number;
  createdBy: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface NotificationSettings {
  prayerNotifications: boolean;
  prayerReminderMinutes: number;
  prayerZone?: string;
  eventNotifications: boolean;
  eventReminder1Day: boolean;
  donationReminder: boolean;
  donationReminderDay: number; // day of month 1-28
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM
  quietHoursEnd: string;   // HH:MM
  /** Master switch, super admin only. Missing/true = on. Saved only via setNotificationsEnabled. */
  notificationsEnabled?: boolean;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  prayerNotifications: false,
  prayerReminderMinutes: 15,
  prayerZone: 'KDH01',
  eventNotifications: true,
  eventReminder1Day: true,
  donationReminder: false,
  donationReminderDay: 1,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '06:00',
};

// ─── Settings ───
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const ref = doc(db, 'settings', 'notifications');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { ...DEFAULT_SETTINGS, ...snap.data() } as NotificationSettings;
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveNotificationSettings(
  allSettings: Partial<NotificationSettings>
): Promise<void> {
  // The master switch is never saved from here, so a stale page can't undo the super admin's choice
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { notificationsEnabled, ...settings } = allSettings;
  const ref = doc(db, 'settings', 'notifications');
  await updateDoc(ref, { ...settings, updatedAt: serverTimestamp() }).catch(async () => {
    // Doc may not exist yet — create it
    const { setDoc } = await import('firebase/firestore');
    await setDoc(ref, { ...DEFAULT_SETTINGS, ...settings, updatedAt: serverTimestamp() });
  });
}

/** Super admin only (enforced by Firestore rules). Turns every notification on or off. */
export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  const { setDoc } = await import('firebase/firestore');
  await setDoc(
    doc(db, 'settings', 'notifications'),
    { notificationsEnabled: enabled, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// ─── Send / schedule via Cloud Functions (functions/index.js) ───
// The server creates the notification doc, checks the admin role and applies quiet hours.

export interface SendResult {
  id: string;
  /** True when it was scheduled, either by the admin or because quiet hours are on. */
  scheduled: boolean;
  /** True when a "send now" was held back until quiet hours end. */
  deferred: boolean;
  dueAt?: string;
  sent: number;
  failed: number;
  cleaned: number;
  attempted?: number;
}

export async function sendNotification(data: {
  title: string;
  body: string;
  url?: string;
  /** Kept for existing callers; every notification goes to all registered devices. */
  recipientType?: string;
  createdBy?: string;
}): Promise<SendResult> {
  return callFunction<object, SendResult>('sendNotification', {
    title: data.title,
    body: data.body,
    url: data.url || '/',
  });
}

export async function scheduleNotification(data: {
  title: string;
  body: string;
  scheduledFor: Date;
  url?: string;
  recipientType?: string;
  createdBy?: string;
}): Promise<string> {
  const result = await callFunction<object, SendResult>('sendNotification', {
    title: data.title,
    body: data.body,
    url: data.url || '/',
    scheduleAt: data.scheduledFor.toISOString(),
  });
  return result.id;
}

export async function cancelScheduledNotification(id: string): Promise<void> {
  await callFunction('cancelScheduledNotification', { id });
}

/** Pushes a test notification to the signed-in admin's own devices. */
export async function sendTestPush(): Promise<{ devices: number; sent: number; failed: number }> {
  return callFunction('sendTestNotification');
}

/** Validates every saved device token and deletes dead ones. */
export async function cleanupTokens(): Promise<{ totalScanned: number; valid: number; invalid: number; deleted: number }> {
  return callFunction('cleanupTokens');
}

export function subscribeToNotifications(
  callback: (list: NotificationData[]) => void,
  maxResults = 50
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificationData)));
  });
}

export async function deleteNotification(id: string): Promise<void> {
  await deleteDoc(doc(db, 'notifications', id));
}

// ─── Stats ───
export async function getNotificationStats(): Promise<{
  total: number;
  sent: number;
  failed: number;
  scheduled: number;
  totalDelivered: number;
}> {
  const snap = await getDocs(query(collection(db, 'notifications'), limit(200)));
  let sent = 0, failed = 0, scheduled = 0, totalDelivered = 0;

  snap.forEach(d => {
    const data = d.data();
    if (data.status === 'sent') {
      sent++;
      totalDelivered += data.sentCount || 0;
    }
    if (data.status === 'failed') failed++;
    if (data.status === 'scheduled') scheduled++;
  });

  return { total: snap.size, sent, failed, scheduled, totalDelivered };
}
