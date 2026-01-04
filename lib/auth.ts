// src/lib/auth.ts
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: 'admin';
  createdAt: Date;
}

/**
 * Sign in admin with email and password
 */
export async function signInAdmin(email: string, password: string): Promise<AdminUser> {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Verify user has admin role in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error('User tidak dijumpai dalam sistem');
    }

    const userData = userDoc.data();
    
    if (userData.role !== 'admin') {
      await signOut(auth);
      throw new Error('Akses ditolak. Anda bukan pentadbir.');
    }

    return {
      uid: user.uid,
      email: user.email!,
      name: userData.name,
      role: userData.role,
      createdAt: userData.createdAt?.toDate() || new Date(),
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
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      return null;
    }

    const userData = userDoc.data();
    
    return {
      uid: user.uid,
      email: user.email!,
      name: userData.name,
      role: userData.role,
      createdAt: userData.createdAt?.toDate() || new Date(),
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
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        callback(null);
        return;
      }

      const userData = userDoc.data();
      
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        name: userData.name,
        role: userData.role,
        createdAt: userData.createdAt?.toDate() || new Date(),
      });
    } catch (error) {
      console.error('Error in auth state change:', error);
      callback(null);
    }
  });
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}