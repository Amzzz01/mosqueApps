// worker/index.js
// Push notification handler for PWA service worker.
// next-pwa merges this into the generated public/sw.js on build.
//
// Uses raw `push` and `notificationclick` event listeners.
// No Firebase SDK dependency — works regardless of import order.

console.log('[SW] Push notification worker loading...');

// ─── Push event handler ───
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');

  if (!event.data) {
    console.warn('[SW] Push event has no data');
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch (e) {
    console.error('[SW] Failed to parse push data:', e);
    // Try as text
    try {
      payload = JSON.parse(event.data.text());
    } catch (e2) {
      console.error('[SW] Failed to parse push text:', e2);
    }
  }

  console.log('[SW] Push payload:', JSON.stringify(payload));

  // FCM data-only messages: fields are nested under `data` key
  // FCM notification messages: `notification` + `data` at top level
  // Handle both formats
  const fcmData = payload.data || {};
  const fcmNotif = payload.notification || {};

  const title = fcmData.title || fcmNotif.title || payload.title || 'MASJID AL-FALAH';
  const body = fcmData.body || fcmNotif.body || payload.body || '';
  const icon = fcmData.icon || fcmNotif.icon || (self.location.origin + '/icons/icon-192x192.png');
  const badge = fcmData.badge || fcmNotif.badge || (self.location.origin + '/icons/badge-72x72.png');
  const link = fcmData.link || fcmData.url || payload.fcmOptions?.link || '/';
  const tag = fcmData.tag || fcmData.notifId || fcmNotif.tag || 'masjid-notification';

  console.log('[SW] Showing notification:', title, '|', body);

  // Android already shows the app icon on the left; adding `icon` repeats it on the right.
  // Desktop browsers still need it, otherwise they show the browser logo.
  const isAndroid = /Android/i.test(self.navigator.userAgent);

  const options = {
    body,
    ...(isAndroid ? {} : { icon }),
    badge,
    data: { url: link, link, notifId: fcmData.notifId || '' },
    tag,
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    dir: 'ltr',
    lang: 'ms-MY',
    // Main button depends on the type (Baca, Lihat waktu, Derma sekarang…); Tutup just closes
    actions: [
      { action: 'open', title: fcmData.action || 'Buka' },
      { action: 'close', title: 'Tutup' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ─── Notification click → open / focus app ───
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag, event.action);
  event.notification.close();
  if (event.action === 'close') return;

  const data = event.notification.data || {};
  const urlToOpen = new URL(data.link || data.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) return client.focus();
      }
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'navigate' in client) {
          return client.navigate(urlToOpen).then(() => client.focus());
        }
      }
      return self.clients.openWindow(urlToOpen);
    })
  );
});

console.log('[SW] Push handlers registered OK');
