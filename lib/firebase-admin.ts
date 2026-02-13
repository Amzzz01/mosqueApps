// lib/firebase-admin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;

function getAdminApp(): App {
  if (!adminApp) {
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      adminApp = getApps()[0];
    }
  }
  return adminApp;
}

export function getAdminMessaging(): Messaging {
  return getMessaging(getAdminApp());
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}

export default getAdminApp;
