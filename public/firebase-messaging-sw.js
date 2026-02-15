// firebase-messaging-sw.js
// Redirect to the main PWA service worker which handles FCM.
// Some browsers/Firebase SDK look for this file by convention.
// The actual FCM logic lives in worker/index.js, merged into sw.js by next-pwa.

importScripts('/sw.js');
