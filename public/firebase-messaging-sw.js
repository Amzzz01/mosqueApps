// public/firebase-messaging-sw.js
// Fallback service worker for Firebase Cloud Messaging.
// The main PWA service worker (sw.js) handles push via worker/index.js.
// This file exists so Firebase SDK doesn't complain about a missing
// firebase-messaging-sw.js at the default path.

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) { /* ignore */ }

  const notif = payload.notification || {};
  const data = payload.data || {};
  const title = data.title || notif.title || 'MASJID AL-FALAH';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || notif.body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: { url: data.link || '/', link: data.link || '/' },
      tag: data.notifId || 'masjid-notification',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = new URL(data.link || data.url || '/', self.location.origin).href;
  event.waitUntil(self.clients.openWindow(url));
});
