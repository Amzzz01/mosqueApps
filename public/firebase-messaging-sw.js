// public/firebase-messaging-sw.js
// Standalone FCM service worker fallback

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

console.log('[FCM-SW] Loading...');

try {
  firebase.initializeApp({
    apiKey: 'AIzaSyA1tqrXxikBdRbzz1wFIjiPkD9E9Qwomd8',
    authDomain: 'mymosqueapps.firebaseapp.com',
    projectId: 'mymosqueapps',
    storageBucket: 'mymosqueapps.firebasestorage.app',
    messagingSenderId: '459715855904',
    appId: '1:459715855904:web:c86195995c76c9e64a9e45',
  });
  console.log('[FCM-SW] Firebase initialized OK');
} catch (e) {
  console.log('[FCM-SW] Firebase already initialized or error:', e.message);
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM-SW] onBackgroundMessage fired:', JSON.stringify(payload));

  const data = payload.data || {};
  const notif = payload.notification || {};
  const title = data.title || notif.title || 'Masjid Al-Falah';
  const body = data.body || notif.body || '';
  const link = data.link || data.url || '/';
  const notifId = data.notifId || '';

  console.log('[FCM-SW] Showing notification:', title, body, link);

  return self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { url: link, link, notifId },
    tag: notifId || 'masjid-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
  });
});

self.addEventListener('notificationclick', (event) => {
  console.log('[FCM-SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  const data = event.notification.data || {};
  const link = data.link || data.url || '/';
  const urlToOpen = new URL(link, self.location.origin).href;

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

console.log('[FCM-SW] All handlers registered OK');
