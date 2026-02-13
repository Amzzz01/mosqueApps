// lib/firebase-messaging.ts
import { getMessaging, getToken, onMessage, deleteToken, Messaging } from 'firebase/messaging';
import { doc, setDoc, getDocs, deleteDoc, collection, serverTimestamp } from 'firebase/firestore';
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
 * Check current notification permission status.
 */
export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission and get FCM token.
 * Returns the token string or null if denied/failed.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) {
    console.warn('[FCM] Notification API not supported in this browser');
    return null;
  }

  // Log current permission state
  console.log('[FCM] Current permission state:', Notification.permission);

  if (Notification.permission === 'denied') {
    console.warn('[FCM] Notification permission is DENIED. User must enable it in browser settings.');
    return null;
  }

  console.log('[FCM] Requesting notification permission...');
  const permission = await Notification.requestPermission();
  console.log('[FCM] Permission result:', permission);
  if (permission !== 'granted') return null;

  const msg = getMessagingInstance();
  if (!msg) {
    console.error('[FCM] Messaging instance is null');
    return null;
  }

  try {
    // Register the FCM service worker
    console.log('[FCM] Registering service worker...');
    const swRegistration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    );
    console.log('[FCM] Service worker registered:', swRegistration.scope);

    // Wait for SW to be ready
    await navigator.serviceWorker.ready;
    console.log('[FCM] Service worker is ready');

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    console.log('[FCM] VAPID key present:', !!vapidKey, vapidKey ? `(${vapidKey.slice(0, 10)}...)` : '');

    if (!vapidKey) {
      console.error('[FCM] VAPID key is missing! Check NEXT_PUBLIC_FIREBASE_VAPID_KEY in .env.local');
      return null;
    }

    console.log('[FCM] Calling getToken...');
    const token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      console.log('[FCM] Token obtained successfully');
      console.log('[FCM]   Token:', token.slice(0, 30) + '...' + token.slice(-10));
      console.log('[FCM]   Token length:', token.length);
    } else {
      console.warn('[FCM] getToken returned empty — this usually means:');
      console.warn('[FCM]   1. VAPID key mismatch');
      console.warn('[FCM]   2. Service worker not properly registered');
      console.warn('[FCM]   3. Browser blocked push subscription');
    }

    return token || null;
  } catch (err) {
    console.error('[FCM] Failed to get token:', err);
    if (err instanceof Error) {
      console.error('[FCM]   Error name:', err.name);
      console.error('[FCM]   Error message:', err.message);
      if (err.message.includes('push service')) {
        console.error('[FCM]   → Push service error. Try clearing browser data or using a different browser.');
      }
      if (err.message.includes('permission')) {
        console.error('[FCM]   → Permission issue. Check browser notification settings.');
      }
    }
    return null;
  }
}

/**
 * Delete current FCM token from Firebase and unregister.
 * Useful for forcing a fresh token.
 */
export async function deleteFCMToken(): Promise<boolean> {
  const msg = getMessagingInstance();
  if (!msg) return false;

  try {
    await deleteToken(msg);
    console.log('[FCM] Token deleted from Firebase');
    return true;
  } catch (err) {
    console.error('[FCM] Failed to delete token:', err);
    return false;
  }
}

/**
 * Delete all FCM tokens for a user from Firestore.
 */
export async function clearUserTokens(uid: string): Promise<number> {
  console.log('[FCM] Clearing all tokens for uid:', uid);
  try {
    const tokensRef = collection(db, 'users', uid, 'fcmTokens');
    const snap = await getDocs(tokensRef);

    let count = 0;
    for (const tokenDoc of snap.docs) {
      await deleteDoc(tokenDoc.ref);
      count++;
      console.log('[FCM]   Deleted token doc:', tokenDoc.id.slice(0, 20) + '...');
    }

    console.log(`[FCM] Cleared ${count} tokens for uid: ${uid}`);
    return count;
  } catch (err) {
    console.error('[FCM] Failed to clear user tokens:', err);
    return 0;
  }
}

/**
 * Force refresh: delete old token, get fresh one, save it.
 */
export async function refreshFCMToken(uid: string): Promise<string | null> {
  console.log('[FCM] === Starting token refresh for uid:', uid, '===');

  // Step 1: Delete current token from Firebase
  await deleteFCMToken();

  // Step 2: Clear old tokens from Firestore
  await clearUserTokens(uid);

  // Step 3: Request fresh token
  const newToken = await requestNotificationPermission();

  if (newToken) {
    // Step 4: Save fresh token
    await saveFCMToken(uid, newToken);
    console.log('[FCM] === Token refresh complete ===');
  } else {
    console.error('[FCM] === Token refresh FAILED — no new token obtained ===');
  }

  return newToken;
}

/**
 * Save FCM token to Firestore under users/{uid}/fcmTokens subcollection.
 * Deletes all old tokens for this user first, then saves only if not already present.
 * This ensures one token per user session — no duplicates.
 */
export async function saveFCMToken(uid: string, token: string): Promise<void> {
  console.log('[FCM] Saving token for uid:', uid);
  console.log('[FCM]   New token:', token.slice(0, 30) + '...' + token.slice(-10));

  try {
    const tokensRef = collection(db, 'users', uid, 'fcmTokens');
    const existingSnap = await getDocs(tokensRef);

    let alreadyExists = false;
    const staleRefs: { ref: typeof doc extends (...args: infer R) => infer T ? T : never; id: string }[] = [];

    existingSnap.forEach((tokenDoc) => {
      const existingToken = tokenDoc.data().token;
      if (existingToken === token) {
        alreadyExists = true;
        console.log('[FCM]   Token already exists — will update timestamp only');
      } else {
        // Different token (old session) — mark for deletion
        staleRefs.push({ ref: tokenDoc.ref, id: tokenDoc.id });
      }
    });

    // Delete old/stale tokens for this user
    if (staleRefs.length > 0) {
      console.log(`[FCM]   Deleting ${staleRefs.length} old token(s) for user...`);
      for (const { ref, id } of staleRefs) {
        await deleteDoc(ref);
        console.log(`[FCM]     Deleted old token: ${id.slice(0, 20)}...`);
      }
    }

    // Save (or update) the current token
    const tokenDocRef = doc(db, 'users', uid, 'fcmTokens', token);
    await setDoc(tokenDocRef, {
      token,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userAgent: navigator.userAgent,
      platform: navigator.platform || 'unknown',
    }, { merge: true });

    console.log(`[FCM] Token saved. Old removed: ${staleRefs.length}, was existing: ${alreadyExists}`);
  } catch (err) {
    console.error('[FCM] Failed to save token:', err);
    if (err instanceof Error && (err.message.includes('permission-denied') || err.message.includes('PERMISSION_DENIED'))) {
      console.error('[FCM]   → Check Firestore rules for: users/' + uid + '/fcmTokens/{tokenId}');
    }
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
    console.log('[FCM] Foreground message received:', JSON.stringify(payload));
    callback(payload);
  });

  return unsubscribe;
}
