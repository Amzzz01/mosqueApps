// public/firebase-messaging-sw.js
// Fallback push notification service worker.
// Used when the main PWA sw.js is not available (e.g., dev mode).
// Also serves as the default Firebase messaging SW path.

console.log('[SW-fallback] Loading...');

self.addEventListener('push', (event) => {
  console.log('[SW-fallback] Push event received');

  if (!event.data) {
    console.warn('[SW-fallback] Push event has no data');
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch (e) {
    try { payload = JSON.parse(event.data.text()); } catch (e2) { /* ignore */ }
  }

  console.log('[SW-fallback] Payload:', JSON.stringify(payload));

  const fcmData = payload.data || {};
  const fcmNotif = payload.notification || {};

  const title = fcmData.title || fcmNotif.title || payload.title || 'MASJID AL-FALAH';
  const body = fcmData.body || fcmNotif.body || payload.body || '';
  const link = fcmData.link || fcmData.url || '/';
  const tag = fcmData.tag || fcmData.notifId || 'masjid-notification';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: fcmData.icon || '/icons/icon-192x192.png',
      badge: fcmData.badge || '/icons/badge-72x72.png',
      data: { url: link, link, notifId: fcmData.notifId || '' },
      tag,
      renotify: true,
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = new URL(data.link || data.url || '/', self.location.origin).href;
  event.waitUntil(self.clients.openWindow(url));
});

console.log('[SW-fallback] Handlers registered OK');
