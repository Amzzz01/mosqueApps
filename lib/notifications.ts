// lib/notifications.ts
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, orderBy, limit, where, serverTimestamp, Timestamp,
  onSnapshot, Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ─── Types ───
export interface NotificationData {
  id?: string;
  title: string;
  body: string;
  recipientType: 'all' | 'members' | 'sponsors' | 'donors' | 'specific';
  recipientIds?: string[];
  topic?: string;
  url?: string;
  status: 'pending' | 'sent' | 'failed' | 'scheduled';
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
  settings: Partial<NotificationSettings>
): Promise<void> {
  const ref = doc(db, 'settings', 'notifications');
  await updateDoc(ref, { ...settings, updatedAt: serverTimestamp() }).catch(async () => {
    // Doc may not exist yet — create it
    const { setDoc } = await import('firebase/firestore');
    await setDoc(ref, { ...DEFAULT_SETTINGS, ...settings, updatedAt: serverTimestamp() });
  });
}

// ─── Send Notification via API ───
export async function sendNotification(data: {
  title: string;
  body: string;
  recipientType: string;
  recipientIds?: string[];
  topic?: string;
  url?: string;
  createdBy: string;
}): Promise<{ id: string; sent: number; failed: number; cleaned: number }> {
  // Create single notification doc in Firestore (API will update this same doc)
  const notifRef = await addDoc(collection(db, 'notifications'), {
    title: data.title,
    body: data.body,
    recipientType: data.recipientType,
    ...(data.recipientIds ? { recipientIds: [...new Set(data.recipientIds)] } : {}),
    ...(data.topic ? { topic: data.topic } : {}),
    url: data.url || '/',
    createdBy: data.createdBy,
    status: 'pending',
    readBy: [],
    sentCount: 0,
    failedCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Call API to send — pass notifId so API updates this doc instead of creating a new one
  try {
    const res = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        body: data.body,
        recipientType: data.recipientType || 'all',
        url: data.url || '/',
        ...(data.topic ? { topic: data.topic } : {}),
        notifId: notifRef.id,
      }),
    });

    const result = await res.json();

    if (res.ok) {
      // API already updated the doc — just return the result
      return { id: notifRef.id, sent: result.sent || 0, failed: result.failed || 0, cleaned: result.cleaned || 0 };
    } else {
      await updateDoc(doc(db, 'notifications', notifRef.id), {
        status: 'failed',
        updatedAt: serverTimestamp(),
      });
      throw new Error(result.error || 'Gagal menghantar notifikasi');
    }
  } catch (err) {
    await updateDoc(doc(db, 'notifications', notifRef.id), {
      status: 'failed',
      updatedAt: serverTimestamp(),
    });
    throw err;
  }
}

// ─── Schedule Notification ───
export async function scheduleNotification(data: {
  title: string;
  body: string;
  recipientType: string;
  scheduledFor: Date;
  url?: string;
  createdBy: string;
}): Promise<string> {
  const notifRef = await addDoc(collection(db, 'notifications'), {
    title: data.title,
    body: data.body,
    recipientType: data.recipientType,
    url: data.url || '/',
    status: 'scheduled',
    scheduledFor: Timestamp.fromDate(data.scheduledFor),
    readBy: [],
    sentCount: 0,
    failedCount: 0,
    createdBy: data.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return notifRef.id;
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
