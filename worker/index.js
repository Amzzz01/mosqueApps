// worker/index.js
// Firebase Cloud Messaging + PWA service worker.
// next-pwa merges this into the generated public/sw.js on build.
//
// IMPORTANT: next-pwa loads this file BEFORE the Firebase compat scripts
// (importScripts order: worker → firebase-app-compat → firebase-messaging-compat).
// Therefore we CANNOT use firebase.messaging().onBackgroundMessage() —
// firebase is undefined when this code first executes.
//
// Instead, we use raw `push` and `notificationclick` event listeners
// which register synchronously and work regardless of import order.

console.log('[SW] Push notification worker loading...');

// ─── Build notification options from push data ───
function buildNotificationOptions(data, notif) {
  return {
    body: data.body || notif.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      url: data.link || '/',
      link: data.link || '/',
      notifId: data.notifId || '',
    },
    tag: data.notifId || 'masjid-notification',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    silent: false,
    timestamp: Date.now(),
    dir: 'ltr',
    lang: 'ms-MY',
  };
}

// ─── Push event handler (raw — no Firebase dependency) ───
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');

  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('[SW] Failed to parse push data:', e);
  }

  console.log('[SW] Push payload:', JSON.stringify(payload));

  // FCM payloads have `notification` and/or `data` at the top level
  const notif = payload.notification || {};
  const data = payload.data || {};
  const title = data.title || notif.title || 'MASJID AL-FALAH';

  event.waitUntil(
    self.registration.showNotification(title, buildNotificationOptions(data, notif))
  );
});

// ─── Notification click → open / focus app ───
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = new URL(data.link || data.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Try to focus an existing tab with the same URL
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) return client.focus();
      }
      // Try to navigate an existing tab from our origin
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'navigate' in client) {
          return client.navigate(urlToOpen).then(() => client.focus());
        }
      }
      // Open a new window
      return self.clients.openWindow(urlToOpen);
    })
  );
});

console.log('[SW] Push handlers registered OK');
