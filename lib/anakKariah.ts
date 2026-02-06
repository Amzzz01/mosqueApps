import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AnakKariah, AnakKariahFormData, StatusType } from '@/types/kariah';

const ANAK_KARIAH_COLLECTION = 'anakKariah';

/**
 * Get all anak kariah members
 */
export async function getAllAnakKariah(): Promise<AnakKariah[]> {
  try {
    const membersRef = collection(db, ANAK_KARIAH_COLLECTION);
    const q = query(membersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as AnakKariah[];
  } catch (error) {
    console.error('Error fetching anak kariah:', error);
    throw new Error('Gagal mendapatkan data ahli');
  }
}

/**
 * Get anak kariah by status
 */
export async function getAnakKariahByStatus(
  status: StatusType
): Promise<AnakKariah[]> {
  try {
    const membersRef = collection(db, ANAK_KARIAH_COLLECTION);
    const q = query(
      membersRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as AnakKariah[];
  } catch (error) {
    console.error('Error fetching anak kariah by status:', error);
    throw new Error('Gagal mendapatkan data ahli');
  }
}

/**
 * Get anak kariah by kawasan
 */
export async function getAnakKariahByKawasan(
  kawasanId: string
): Promise<AnakKariah[]> {
  try {
    const membersRef = collection(db, ANAK_KARIAH_COLLECTION);
    const q = query(
      membersRef,
      where('kawasanId', '==', kawasanId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as AnakKariah[];
  } catch (error) {
    console.error('Error fetching anak kariah by kawasan:', error);
    throw new Error('Gagal mendapatkan data ahli');
  }
}

/**
 * Get anak kariah by ID
 */
export async function getAnakKariahById(id: string): Promise<AnakKariah | null> {
  try {
    const memberRef = doc(db, ANAK_KARIAH_COLLECTION, id);
    const snapshot = await getDoc(memberRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data()
    } as AnakKariah;
  } catch (error) {
    console.error('Error fetching anak kariah by ID:', error);
    throw new Error('Gagal mendapatkan data ahli');
  }
}

/**
 * Create new anak kariah registration
 */
export async function createAnakKariah(
  data: AnakKariahFormData
): Promise<string> {
  try {
    // Check if IC already exists
    const existing = await checkICExists(data.ic);
    if (existing) {
      throw new Error('Nombor IC sudah didaftarkan');
    }

    const membersRef = collection(db, ANAK_KARIAH_COLLECTION);
    const docRef = await addDoc(membersRef, {
      ...data,
      tarikhLahir: Timestamp.fromDate(data.tarikhLahir),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating anak kariah:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Gagal mendaftar ahli');
  }
}

/**
 * Update existing anak kariah
 */
export async function updateAnakKariah(
  id: string,
  data: Partial<AnakKariahFormData>
): Promise<void> {
  try {
    // If updating IC, check if new IC already exists
    if (data.ic) {
      const existing = await checkICExists(data.ic, id);
      if (existing) {
        throw new Error('Nombor IC sudah didaftarkan');
      }
    }

    const memberRef = doc(db, ANAK_KARIAH_COLLECTION, id);
    const updateData: any = {
      ...data,
      updatedAt: serverTimestamp()
    };

    // Convert Date to Timestamp if tarikhLahir is provided
    if (data.tarikhLahir) {
      updateData.tarikhLahir = Timestamp.fromDate(data.tarikhLahir);
    }

    await updateDoc(memberRef, updateData);
  } catch (error) {
    console.error('Error updating anak kariah:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Gagal mengemas kini ahli');
  }
}

/**
 * Update member status (approve/reject)
 */
export async function updateMemberStatus(
  id: string,
  status: StatusType
): Promise<void> {
  try {
    const memberRef = doc(db, ANAK_KARIAH_COLLECTION, id);
    await updateDoc(memberRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating member status:', error);
    throw new Error('Gagal mengemas kini status ahli');
  }
}

/**
 * Delete anak kariah
 */
export async function deleteAnakKariah(id: string): Promise<void> {
  try {
    const memberRef = doc(db, ANAK_KARIAH_COLLECTION, id);
    await deleteDoc(memberRef);
  } catch (error) {
    console.error('Error deleting anak kariah:', error);
    throw new Error('Gagal memadam ahli');
  }
}

/**
 * Check if IC number already exists
 */
async function checkICExists(ic: string, excludeId?: string): Promise<boolean> {
  try {
    const membersRef = collection(db, ANAK_KARIAH_COLLECTION);
    const q = query(membersRef, where('ic', '==', ic));
    const snapshot = await getDocs(q);

    if (excludeId) {
      return snapshot.docs.some((doc) => doc.id !== excludeId);
    }

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking IC:', error);
    return false;
  }
}

/**
 * Get recent registrations
 */
export async function getRecentRegistrations(
  limitCount: number = 10
): Promise<AnakKariah[]> {
  try {
    const membersRef = collection(db, ANAK_KARIAH_COLLECTION);
    const q = query(
      membersRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as AnakKariah[];
  } catch (error) {
    console.error('Error fetching recent registrations:', error);
    throw new Error('Gagal mendapatkan pendaftaran terkini');
  }
}

/**
 * Get statistics for dashboard
 */
export async function getAnakKariahStats() {
  try {
    const membersRef = collection(db, ANAK_KARIAH_COLLECTION);
    const snapshot = await getDocs(membersRef);

    const total = snapshot.size;
    const approved = snapshot.docs.filter(
      (doc) => doc.data().status === 'approved'
    ).length;
    const pending = snapshot.docs.filter(
      (doc) => doc.data().status === 'pending'
    ).length;
    const rejected = snapshot.docs.filter(
      (doc) => doc.data().status === 'rejected'
    ).length;

    // Get recent registrations count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentQuery = query(
      membersRef,
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    const recentSnapshot = await getDocs(recentQuery);

    return {
      total,
      approved,
      pending,
      rejected,
      recentRegistrations: recentSnapshot.size
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      recentRegistrations: 0
    };
  }
}

/**
 * Search anak kariah by name or IC
 */
export async function searchAnakKariah(
  searchTerm: string
): Promise<AnakKariah[]> {
  try {
    const membersRef = collection(db, ANAK_KARIAH_COLLECTION);
    const snapshot = await getDocs(membersRef);

    const searchLower = searchTerm.toLowerCase();
    
    const results = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as AnakKariah[];

    return results.filter(
      (member) =>
        member.namaPenuh.toLowerCase().includes(searchLower) ||
        member.ic.includes(searchTerm) ||
        member.telefon.includes(searchTerm)
    );
  } catch (error) {
    console.error('Error searching anak kariah:', error);
    throw new Error('Gagal mencari ahli');
  }
}