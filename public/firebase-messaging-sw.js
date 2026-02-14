// public/firebase-messaging-sw.js
// Firebase Cloud Messaging background message handler

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA1tqrXxikBdRbzz1wFIjiPkD9E9Qwomd8',
  authDomain: 'mymosqueapps.firebaseapp.com',
  projectId: 'mymosqueapps',
  storageBucket: 'mymosqueapps.firebasestorage.app',
  messagingSenderId: '459715855904',
  appId: '1:459715855904:web:c86195995c76c9e64a9e45',
});

const messaging = firebase.messaging();

// Handle background messages
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

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = event.notification.data?.link || event.notification.data?.url || '/';
  const urlToOpen = new URL(link, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
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
