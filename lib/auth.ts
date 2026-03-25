// lib/auth.ts
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase/config';

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  createdAt: Date;
  permissions?: Record<string, { view: boolean; edit: boolean; delete: boolean }>;
}

/**
 * Sign in admin with email and password
 */
export async function signInAdmin(email: string, password: string): Promise<AdminUser> {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Verify user has admin role in Firestore - CHECK adminUsers collection
    const userDoc = await getDoc(doc(db, 'adminUsers', user.uid));
    
    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error('User tidak dijumpai dalam sistem');
    }

    const userData = userDoc.data();
    
    // Check if user is active
    if (!userData.active) {
      await signOut(auth);
      throw new Error('Akaun tidak aktif. Sila hubungi pentadbir.');
    }

    return {
      uid: user.uid,
      email: user.email!,
      displayName: userData.displayName || userData.name || 'Admin',
      role: userData.role,
      createdAt: userData.createdAt?.toDate() || new Date(),
      permissions: userData.permissions,
    };
  } catch (error: any) {
    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found') {
      throw new Error('Email tidak dijumpai');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Kata laluan salah');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Format email tidak sah');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Terlalu banyak cubaan. Sila cuba sebentar lagi.');
    } else if (error.code === 'auth/invalid-credential') {
      throw new Error('Email atau kata laluan salah');
    }
    
    throw error;
  }
}

/**
 * Sign out current admin
 */
export async function signOutAdmin(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw new Error('Gagal log keluar');
  }
}

/**
 * Get current admin user
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const user = auth.currentUser;
  
  if (!user) {
    return null;
  }

  try {
    const userDoc = await getDoc(doc(db, 'adminUsers', user.uid));
    
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    
    // Check if user is active
    if (!userData.active) {
      return null;
    }
    
    return {
      uid: user.uid,
      email: user.email!,
      displayName: userData.displayName || userData.name || 'Admin',
      role: userData.role,
      createdAt: userData.createdAt?.toDate() || new Date(),
      permissions: userData.permissions,
    };
  } catch (error) {
    console.error('Error getting current admin:', error);
    return null;
  }
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuthChanges(
  callback: (user: AdminUser | null) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'adminUsers', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        callback(null);
        return;
      }

      const userData = userDoc.data();
      
      // Check if user is active
      if (!userData.active) {
        callback(null);
        return;
      }
      
      console.log('[AuthContext] userData.permissions on login:', userData.permissions);
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: userData.displayName || userData.name || 'Admin',
        photoURL: userData.photoURL || firebaseUser.photoURL || undefined,
        role: userData.role,
        createdAt: userData.createdAt?.toDate() || new Date(),
        permissions: userData.permissions,
      });
    } catch (error) {
      console.error('Error in auth state change:', error);
      callback(null);
    }
  });
}

/**
 * Register a new admin user
 */
export async function registerAdmin(
  email: string,
  password: string,
  displayName: string,
  registrationKey: string
): Promise<void> {
  // Verify registration key server-side
  const res = await fetch('/api/admin/verify-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: registrationKey }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Pengesahan kunci gagal');
  }

  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create admin record in Firestore
    await setDoc(doc(db, 'adminUsers', user.uid), {
      email: user.email,
      displayName,
      role: 'admin',
      active: true,
      createdAt: serverTimestamp(),
    });

    // Sign out after registration - user should log in manually
    await signOut(auth);
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email ini sudah didaftarkan');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Format email tidak sah');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Kata laluan terlalu lemah. Minimum 6 aksara.');
    }
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('Email tidak dijumpai dalam sistem');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Format email tidak sah');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Terlalu banyak cubaan. Sila cuba sebentar lagi.');
    }
    throw new Error('Gagal menghantar email. Sila cuba lagi.');
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}