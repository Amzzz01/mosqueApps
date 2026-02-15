// worker/index.js
// PWA service worker extensions for next-pwa.
// next-pwa merges this into the generated public/sw.js on build.
//
// Firebase Cloud Messaging is handled by a separate standalone service worker:
//   public/firebase-messaging-sw.js
// This file only contains PWA-specific logic (offline fallback, caching, etc.).

console.log('[SW] PWA service worker loaded');
