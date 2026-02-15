// components/NotificationPermission.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import {
  requestNotificationPermission,
  saveFCMToken,
  refreshFCMToken,
  getPermissionStatus,
  onMessageListener,
} from '@/lib/firebase-messaging';
import toast from 'react-hot-toast';

export default function NotificationPermission() {
  const [user, setUser] = useState<User | null>(null);
  const [supported, setSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | ''>('');
  const [showPrompt, setShowPrompt] = useState(false);

  // Check auth state and notification support
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isSupported =
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;
    setSupported(isSupported);

    if (isSupported) {
      setPermissionState(Notification.permission);
    }

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubAuth();
  }, []);

  // Auto-register token if user is authenticated and permission already granted
  useEffect(() => {
    if (!user || !supported || permissionState !== 'granted') return;

    console.log('[NotifPermission] Permission granted + user logged in — refreshing FCM token...');
    refreshFCMToken(user.uid).then((token) => {
      if (token) {
        console.log('[NotifPermission] Fresh token registered successfully');
      } else {
        console.warn('[NotifPermission] Failed to get fresh token — try checking browser settings');
      }
    });
  }, [user, supported, permissionState]);

  // Listen for foreground messages
  useEffect(() => {
    if (!supported || permissionState !== 'granted') return;

    const unsubscribe = onMessageListener((payload: unknown) => {
      const msg = payload as {
        notification?: { title?: string; body?: string };
        data?: { title?: string; body?: string; link?: string };
      };
      // Data-only messages: title/body come from data field
      const title = msg?.data?.title || msg?.notification?.title || 'Notifikasi Baru';
      const body = msg?.data?.body || msg?.notification?.body || '';

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
  }, [supported, permissionState]);

  const handleRequest = useCallback(async () => {
    setShowPrompt(false);

    const token = await requestNotificationPermission();
    setPermissionState(Notification.permission);

    if (token) {
      if (user) {
        await saveFCMToken(user.uid, token);
      }
      toast.success('Notifikasi diaktifkan');
    } else if (Notification.permission === 'denied') {
      toast.error('Notifikasi disekat. Sila benarkan di tetapan pelayar.');
    }
  }, [user]);

  // Don't render if not supported or already granted
  if (!supported) return null;
  if (permissionState === 'granted') return null;
  if (permissionState === 'denied') return null;

  return (
    <>
      {/* Bell button - bottom right */}
      <button
        onClick={() => setShowPrompt(!showPrompt)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Aktifkan notifikasi"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
      </button>

      {/* Prompt popup */}
      {showPrompt && (
        <div className="fixed bottom-20 right-6 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-72 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">Aktifkan Notifikasi</h3>
              <p className="text-xs text-gray-500 mt-1">
                Terima pemberitahuan mengenai pengumuman dan aktiviti masjid.
              </p>
            </div>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowPrompt(false)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
            >
              Nanti
            </button>
            <button
              onClick={handleRequest}
              className="flex-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Aktifkan
            </button>
          </div>
        </div>
      )}
    </>
  );
}
