// worker/index.js
// Firebase Cloud Messaging support for the PWA service worker.
// next-pwa merges this into the generated public/sw.js on build.
// Firebase compat scripts are loaded via importScripts in next.config.js.

firebase.initializeApp({
  apiKey: 'AIzaSyA1tqrXxikBdRbzz1wFIjiPkD9E9Qwomd8',
  authDomain: 'mymosqueapps.firebaseapp.com',
  projectId: 'mymosqueapps',
  storageBucket: 'mymosqueapps.firebasestorage.app',
  messagingSenderId: '459715855904',
  appId: '1:459715855904:web:c86195995c76c9e64a9e45',
});

const messaging = firebase.messaging();

// Show notification when app is closed or in background
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Masjid Al-Falah';
  const options = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data || {},
    tag: payload.data?.notifId || 'masjid-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  self.registration.showNotification(title, options);
});

// Open app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = event.notification.data?.link || event.notification.data?.url || '/';
  const urlToOpen = new URL(link, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab at the exact URL
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Navigate an existing same-origin tab
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
