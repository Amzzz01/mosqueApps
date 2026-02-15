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

// Track whether onBackgroundMessage handled the push, so the raw push
// listener below can act as a fallback without showing duplicates.
let bgMessageHandled = false;

// Handle background messages — onBackgroundMessage is the correct API for compat SDK v10+
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] onBackgroundMessage fired:', JSON.stringify(payload));
  bgMessageHandled = true;

  const data = payload.data || {};
  const notif = payload.notification || {};
  const title = data.title || notif.title || 'MASJID AL-FALAH';
  const body = data.body || notif.body || '';
  const link = data.link || data.url || '/';
  const notifId = data.notifId || '';

  console.log('[SW] Showing notification:', title, body, link);

  // iOS/Android native-style notification options
  const options = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { url: link, link, notifId },
    tag: notifId || 'masjid-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    // Mobile optimization
    silent: false,
    timestamp: Date.now(),
    dir: 'ltr',
    lang: 'ms-MY',
  };

  return self.registration.showNotification(title, options);
});

// Fallback push listener — catches messages that onBackgroundMessage misses
// (common on Android PWA where Firebase compat SDK may not intercept the push)
self.addEventListener('push', (event) => {
  // Reset the flag — give onBackgroundMessage a moment to claim it
  bgMessageHandled = false;

  const handlePush = async () => {
    // Small delay to let onBackgroundMessage fire first if it will
    await new Promise((r) => setTimeout(r, 200));
    if (bgMessageHandled) {
      console.log('[SW] push event — already handled by onBackgroundMessage, skipping');
      return;
    }

    console.log('[SW] push event — fallback handler firing');
    let data = {};
    try {
      const json = event.data && event.data.json();
      // FCM wraps data in .data for data-only messages
      data = (json && json.data) || json || {};
    } catch (e) {
      console.warn('[SW] push event — could not parse payload:', e);
    }

    const title = data.title || 'MASJID AL-FALAH';
    const body = data.body || '';
    const link = data.link || data.url || '/';
    const notifId = data.notifId || '';

    const options = {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: { url: link, link, notifId },
      tag: notifId || 'masjid-notification-fallback',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      silent: false,
      renotify: true,
      timestamp: Date.now(),
    };

    return self.registration.showNotification(title, options);
  };

  event.waitUntil(handlePush());
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
