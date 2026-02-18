'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        console.log('[SW] Attempting explicit SW registration...');

        // Explicitly register sw.js — don't rely solely on next-pwa auto-register
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        console.log('[SW] Registration successful, scope:', registration.scope);
        console.log('[SW] SW installing:', !!registration.installing);
        console.log('[SW] SW waiting:', !!registration.waiting);
        console.log('[SW] SW active:', !!registration.active);

        // Wait for SW to activate
        if (!registration.active) {
          await new Promise<void>((resolve) => {
            const sw = registration.installing || registration.waiting;
            if (!sw) { resolve(); return; }
            sw.addEventListener('statechange', function handler() {
              console.log('[SW] State changed to:', sw.state);
              if (sw.state === 'activated') {
                sw.removeEventListener('statechange', handler);
                resolve();
              }
            });
            // Safety timeout — don't hang forever
            setTimeout(resolve, 10000);
          });
        }

        console.log('[SW] Service worker fully activated');

        // Force update check
        await registration.update();

      } catch (err) {
        console.error('[SW] Registration failed:', err);

        // Fallback: try firebase-messaging-sw.js
        try {
          console.log('[SW] Trying fallback firebase-messaging-sw.js...');
          const fallbackReg = await navigator.serviceWorker.register(
            '/firebase-messaging-sw.js',
            { scope: '/' }
          );
          console.log('[SW] Fallback registration successful, scope:', fallbackReg.scope);
        } catch (fallbackErr) {
          console.error('[SW] All SW registrations failed:', fallbackErr);
        }
      }
    };

    registerSW();

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed — new SW activated');
    });
  }, []);

  return null;
}
