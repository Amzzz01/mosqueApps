// public/firebase-worker.js
// Standalone push notification handler (same as firebase-messaging-sw.js).

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (e) {
    try { payload = JSON.parse(event.data.text()); } catch (e2) { /* ignore */ }
  }

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
      data: { url: link, link },
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
