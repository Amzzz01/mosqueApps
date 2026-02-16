// public/firebase-worker.js
// Standalone push notification handler (fallback for non-PWA contexts).
// Uses raw push event listener — no Firebase SDK dependency.

console.log('[SW] Firebase worker loading...');

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

self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');

  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('[SW] Failed to parse push data:', e);
  }

  const notif = payload.notification || {};
  const data = payload.data || {};
  const title = data.title || notif.title || 'MASJID AL-FALAH';

  event.waitUntil(
    self.registration.showNotification(title, buildNotificationOptions(data, notif))
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

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

console.log('[SW] Firebase worker handlers registered OK');
