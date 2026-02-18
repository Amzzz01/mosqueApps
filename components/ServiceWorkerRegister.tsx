'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // next-pwa auto-registers sw.js — we just log the status here
    navigator.serviceWorker.ready
      .then((reg) => {
        console.log('[SW] Service worker ready, scope:', reg.scope);
        console.log('[SW] Active SW state:', reg.active?.state);
      })
      .catch((err) => {
        console.error('[SW] Service worker ready failed:', err);
      });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed — new SW activated');
    });
  }, []);

  return null;
}
