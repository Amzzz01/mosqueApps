// components/FCMProvider.tsx
// Shared FCM token registration and foreground message listener.
// Mount this in BOTH public and admin layouts so push notifications
// work regardless of which section the user is viewing.
'use client';

import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import {
  refreshFCMToken,
  getPermissionStatus,
  onMessageListener,
} from '@/lib/firebase-messaging';
import { Bell, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FCMProvider() {
  const registered = useRef(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Poll for permission changes (covers case where permission is granted
  // after component mounts, e.g. via admin "Hantar" button)
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const check = () => {
      const granted = Notification.permission === 'granted';
      setPermissionGranted(granted);
    };

    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-register / refresh FCM token when user is logged in + permission granted
  useEffect(() => {
    if (!permissionGranted) return;

    const isSupported =
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;
    if (!isSupported) return;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      if (registered.current) return;
      registered.current = true;

      console.log('[FCMProvider] Refreshing FCM token for uid:', user.uid);
      refreshFCMToken(user.uid).then((token) => {
        if (token) {
          console.log('[FCMProvider] Token registered OK');
        } else {
          console.warn('[FCMProvider] Failed to get token');
          registered.current = false;
        }
      });
    });

    return () => unsubAuth();
  }, [permissionGranted]);

  // Listen for foreground FCM messages → show system notification + toast
  useEffect(() => {
    if (!permissionGranted) return;

    console.log('[FCMProvider] Setting up onMessage listener');
    const unsubscribe = onMessageListener((payload: unknown) => {
      const msg = payload as {
        notification?: { title?: string; body?: string };
        data?: { title?: string; body?: string; link?: string };
      };
      const title = msg?.data?.title || msg?.notification?.title || 'Notifikasi Baru';
      const body = msg?.data?.body || msg?.notification?.body || '';

      console.log('[FCMProvider] Foreground message:', title, body);

      // Show system notification (same as background behavior)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: msg?.data?.link || 'foreground-notification',
            data: { url: msg?.data?.link || '/', link: msg?.data?.link || '/' },
          } as NotificationOptions);
        }).catch((err) => {
          console.error('[FCMProvider] showNotification failed:', err);
        });
      }

      // Also show in-app toast
      toast(
        (t) => (
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900">{title}</p>
              {body && <p className="text-sm text-gray-600 mt-0.5">{body}</p>}
            </div>
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
