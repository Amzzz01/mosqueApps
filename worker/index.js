// worker/index.js
// Firebase Cloud Messaging support for the PWA service worker.
// next-pwa merges this into the generated public/sw.js on build.
// Firebase compat scripts are loaded via importScripts in next.config.js.

console.log('[SW] Firebase messaging worker loading...');

try {
  firebase.initializeApp({
    apiKey: 'AIzaSyA1tqrXxikBdRbzz1wFIjiPkD9E9Qwomd8',
    authDomain: 'mymosqueapps.firebaseapp.com',
    projectId: 'mymosqueapps',
    storageBucket: 'mymosqueapps.firebasestorage.app',
    messagingSenderId: '459715855904',
    appId: '1:459715855904:web:c86195995c76c9e64a9e45',
  });
  console.log('[SW] Firebase initialized OK');
} catch (e) {
  console.log('[SW] Firebase already initialized or error:', e.message);
}

const messaging = firebase.messaging();
console.log('[SW] Firebase messaging instance ready');

// Handle background messages — onBackgroundMessage is the correct API for compat SDK v10+
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] onBackgroundMessage fired:', JSON.stringify(payload));

  // Read from data payload first (strings), fallback to notification payload
  const data = payload.data || {};
  const notif = payload.notification || {};
  const title = data.title || notif.title || 'Masjid Al-Falah';
  const body = data.body || notif.body || '';
  const link = data.link || data.url || '/';
  const notifId = data.notifId || '';

  console.log('[SW] Showing notification:', title, body, link);

  const options = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { url: link, link, notifId },
    tag: notifId || 'masjid-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  return self.registration.showNotification(title, options);
});

// Handle notification click — open app and navigate to URL
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  const data = event.notification.data || {};
  const link = data.link || data.url || '/';
  const urlToOpen = new URL(link, self.location.origin).href;
  console.log('[SW] Opening URL:', urlToOpen);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      console.log('[SW] Found', clients.length, 'open client(s)');
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          console.log('[SW] Focusing existing tab');
          return client.focus();
        }
      }
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'navigate' in client) {
          console.log('[SW] Navigating existing tab to:', urlToOpen);
          return client.navigate(urlToOpen).then(() => client.focus());
        }
      }
      console.log('[SW] Opening new window:', urlToOpen);
      return self.clients.openWindow(urlToOpen);
    })
  );
});

console.log('[SW] All handlers registered OK');
