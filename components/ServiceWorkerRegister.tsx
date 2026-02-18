'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[SW] Service workers not supported');
      return;
    }

    // Try PWA service worker first, fall back to Firebase messaging SW
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] Service worker registered (sw.js), scope:', reg.scope);
        onRegistered(reg);
      })
      .catch((err) => {
        console.warn('[SW] sw.js registration failed, trying fallback:', err.message);
        navigator.serviceWorker
          .register('/firebase-messaging-sw.js', { scope: '/' })
          .then((reg) => {
            console.log('[SW] Fallback service worker registered, scope:', reg.scope);
            onRegistered(reg);
          })
          .catch((err2) => {
            console.error('[SW] All service worker registrations failed:', err2);
          });
      });

    function onRegistered(reg: ServiceWorkerRegistration) {
      reg.onupdatefound = () => {
        const installing = reg.installing;
        if (installing) {
          installing.onstatechange = () => {
            if (installing.state === 'activated') {
              console.log('[SW] New service worker activated');
            }
          };
        }
      };
    }
  }, []);

  return null;
}
