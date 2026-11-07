// components/FCMProvider.tsx
// Shared FCM token registration and foreground message listener.
// Mount this in BOTH public and admin layouts so push notifications
// work regardless of which section the user is viewing.
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import {
  requestNotificationPermission,
  saveFCMToken,
  saveGuestFCMToken,
  onMessageListener,
} from '@/lib/firebase-messaging';
import { Bell, X } from 'lucide-react';
import toast from 'react-hot-toast';

// Remembers which owner (admin uid or guest) this browser's token was saved under,
// so the token is only written when it or the owner changes (same idea as MyMotoLog).
const REGISTERED_KEY = 'masjid_pushTokenRegistered';

const readRegistered = (): string | null => {
  try { return localStorage.getItem(REGISTERED_KEY); } catch { return null; }
};
const writeRegistered = (value: string) => {
  try { localStorage.setItem(REGISTERED_KEY, value); } catch { /* storage blocked: re-saved next visit */ }
};

const isPushSupported = () =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window;

export default function FCMProvider() {
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Track permission changes (e.g. granted from a banner or the admin page)
  useEffect(() => {
    if (!isPushSupported()) return;

    const check = () => setPermissionGranted(Notification.permission === 'granted');
    check();

    let status: PermissionStatus | null = null;
    navigator.permissions?.query({ name: 'notifications' as PermissionName })
      .then((s) => { status = s; s.onchange = check; })
      .catch(() => { /* Safari: fall back to focus checks below */ });

    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      if (status) status.onchange = null;
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  // Register this device once permission is granted: under the admin's uid when
  // signed in, otherwise as a guest so public visitors receive pushes too.
  useEffect(() => {
    if (!permissionGranted) return;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      try {
        const token = await requestNotificationPermission();
        if (!token) return;

        const owner = user ? user.uid : 'guest';
        const signature = `${owner}|${token}`;
        if (readRegistered() === signature) return;

        if (user) await saveFCMToken(user.uid, token);
        else await saveGuestFCMToken(token);
        writeRegistered(signature);
      } catch (err) {
        console.warn('[FCMProvider] Token registration failed:', err);
      }
    });

    return () => unsubAuth();
  }, [permissionGranted]);

  // Foreground messages → in-app toast. The service worker shows the system
  // notification itself, so we don't show a second one here.
  useEffect(() => {
    if (!permissionGranted) return;

    const unsubscribe = onMessageListener((payload: unknown) => {
      const msg = payload as {
        notification?: { title?: string; body?: string };
        data?: { title?: string; body?: string; url?: string; link?: string };
      };
      const title = msg?.data?.title || msg?.notification?.title || 'Notifikasi Baru';
      const body = msg?.data?.body || msg?.notification?.body || '';
      const url = msg?.data?.url || msg?.data?.link || '/';

      toast(
        (t) => (
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <a href={url} className="flex-1 min-w-0" onClick={() => toast.dismiss(t.id)}>
              <p className="font-semibold text-sm text-gray-900">{title}</p>
              {body && <p className="text-sm text-gray-600 mt-0.5">{body}</p>}
            </a>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ),
        { duration: 6000 }
      );
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [permissionGranted]);

  return null;
}
