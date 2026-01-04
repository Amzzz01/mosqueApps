// lib/auth.ts
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
  displayName: string;
  role: string;
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
      
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: userData.displayName || userData.name || 'Admin',
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