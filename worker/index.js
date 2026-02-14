// worker/index.js
// Firebase Cloud Messaging support for the PWA service worker.
// next-pwa merges this into the generated public/sw.js on build.
// Firebase compat scripts are loaded via importScripts in next.config.js.

console.log('[SW] Firebase messaging worker loaded');

firebase.initializeApp({
  apiKey: 'AIzaSyA1tqrXxikBdRbzz1wFIjiPkD9E9Qwomd8',
  authDomain: 'mymosqueapps.firebaseapp.com',
  projectId: 'mymosqueapps',
  storageBucket: 'mymosqueapps.firebasestorage.app',
  messagingSenderId: '459715855904',
  appId: '1:459715855904:web:c86195995c76c9e64a9e45',
});

console.log('[SW] Firebase initialized');

const messaging = firebase.messaging();

// Handle background messages (fires when app is closed or in background)
// setBackgroundMessageHandler reads from data payload and shows custom notification
messaging.setBackgroundMessageHandler((payload) => {
  console.log('[SW] Background message received:', JSON.stringify(payload));

  const data = payload.data || {};
  const title = data.title || payload.notification?.title || 'Masjid Al-Falah';
  const body = data.body || payload.notification?.body || '';
  const link = data.link || data.url || '/';
  const notifId = data.notifId || '';

  console.log('[SW] Showing notification:', { title, body, link, notifId });

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
      // Focus existing tab at the exact URL
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          console.log('[SW] Focusing existing tab:', client.url);
          return client.focus();
        }
      }
      // Navigate an existing same-origin tab
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'navigate' in client) {
          console.log('[SW] Navigating existing tab to:', urlToOpen);
          return client.navigate(urlToOpen).then(() => client.focus());
        }
      }
      // Open a new window
      console.log('[SW] Opening new window:', urlToOpen);
      return self.clients.openWindow(urlToOpen);
    })
  );
});
