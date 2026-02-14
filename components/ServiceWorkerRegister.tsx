'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[SW] Service workers not supported');
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] Service worker registered, scope:', reg.scope);

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
      })
      .catch((err) => {
        console.error('[SW] Service worker registration failed:', err);
      });
  }, []);

  return null;
}
