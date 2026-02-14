// public/firebase-messaging-sw.js
// Standalone fallback — main FCM handling is in worker/index.js (merged into sw.js)

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

console.log('[FCM-SW] Firebase messaging SW loaded');

firebase.initializeApp({
  apiKey: 'AIzaSyA1tqrXxikBdRbzz1wFIjiPkD9E9Qwomd8',
  authDomain: 'mymosqueapps.firebaseapp.com',
  projectId: 'mymosqueapps',
  storageBucket: 'mymosqueapps.firebasestorage.app',
  messagingSenderId: '459715855904',
  appId: '1:459715855904:web:c86195995c76c9e64a9e45',
});

console.log('[FCM-SW] Firebase initialized');

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler((payload) => {
  console.log('[FCM-SW] Background message received:', JSON.stringify(payload));

  const data = payload.data || {};
  const title = data.title || payload.notification?.title || 'Masjid Al-Falah';
  const body = data.body || payload.notification?.body || '';
  const link = data.link || data.url || '/';
  const notifId = data.notifId || '';

  console.log('[FCM-SW] Showing notification:', { title, body, link, notifId });

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

self.addEventListener('notificationclick', (event) => {
  console.log('[FCM-SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  const data = event.notification.data || {};
  const link = data.link || data.url || '/';
  const urlToOpen = new URL(link, self.location.origin).href;
  console.log('[FCM-SW] Opening URL:', urlToOpen);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      console.log('[FCM-SW] Found', clients.length, 'open client(s)');
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
