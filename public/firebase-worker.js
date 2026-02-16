// public/firebase-worker.js
// Firebase Cloud Messaging handlers
// Loaded via importScripts in next.config.js

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

// ─── Build notification options ───
function buildOptions(data, notif) {
  return {
    body: data.body || notif.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: { 
      url: data.link || '/', 
      link: data.link || '/', 
      notifId: data.notifId || '' 
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

// ─── Background message handler ───
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] onBackgroundMessage:', JSON.stringify(payload));

  const data = payload.data || {};
  const notif = payload.notification || {};
  const title = data.title || notif.title || 'MASJID AL-FALAH';

  return self.registration.showNotification(title, buildOptions(data, notif));
});

// ─── Notification click → open / focus app ───
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

console.log('[SW] All handlers registered OK');