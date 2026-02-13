// lib/firebase-messaging.ts
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import app from '@/lib/firebase/config';
import { db } from '@/lib/firebase/config';

let messaging: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch (err) {
      console.error('[FCM] Failed to initialize messaging:', err);
      return null;
    }
  }
  return messaging;
}

/**
 * Request notification permission and get FCM token.
 * Returns the token string or null if denied/failed.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const msg = getMessagingInstance();
  if (!msg) return null;

  try {
    // Register the FCM service worker
    const swRegistration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    );

    const token = await getToken(msg, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    return token || null;
  } catch (err) {
    console.error('[FCM] Failed to get token:', err);
    return null;
  }
}

/**
 * Save FCM token to Firestore under users/{uid}/fcmTokens subcollection.
 */
export async function saveFCMToken(uid: string, token: string): Promise<void> {
  try {
    const tokenRef = doc(db, 'users', uid, 'fcmTokens', token);
    await setDoc(tokenRef, {
      token,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userAgent: navigator.userAgent,
    }, { merge: true });
  } catch (err) {
    console.error('[FCM] Failed to save token:', err);
  }
}

/**
 * Listen for foreground messages.
 * Returns a cleanup function.
 */
export function onMessageListener(callback: (payload: unknown) => void): (() => void) | null {
  const msg = getMessagingInstance();
  if (!msg) return null;

  const unsubscribe = onMessage(msg, (payload) => {
    callback(payload);
  });

  return unsubscribe;
}
