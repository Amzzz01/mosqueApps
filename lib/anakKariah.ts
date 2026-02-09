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
 * Remove undefined values from an object (Firestore rejects undefined)
 */
function stripUndefined(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );
}

/**
 * Get all anak kariah members (excluding soft-deleted)
 */
export async function getAllAnakKariah(): Promise<AnakKariah[]> {
  try {
    const membersRef = collection(db, ANAK_KARIAH_COLLECTION);
    const q = query(membersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as AnakKariah)
      .filter((m) => !m.isDeleted);
  } catch (error) {
    console.error('Error fetching anak kariah:', error);
    throw new Error('Gagal mendapatkan data ahli');
  }
}

/**
 * Get anak kariah by status (excluding soft-deleted)
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

    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as AnakKariah)
      .filter((m) => !m.isDeleted);
  } catch (error) {
    console.error('Error fetching anak kariah by status:', error);
    throw new Error('Gagal mendapatkan data ahli');
  }
}

/**
 * Get anak kariah by kawasan (excluding soft-deleted)
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

    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as AnakKariah)
      .filter((m) => !m.isDeleted);
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
  data: AnakKariahFormData,
  createdBy: string = 'admin'
): Promise<string> {
  try {
    // Check if IC already exists
    const existing = await checkICExists(data.ic);
    if (existing) {
      throw new Error('Nombor IC sudah didaftarkan');
    }

    const isAktif = data.status === 'aktif';

    const membersRef = collection(db, ANAK_KARIAH_COLLECTION);
    const docRef = await addDoc(membersRef, {
      ...stripUndefined(data),
      catatan: data.catatan || '',
      tarikhLahir: Timestamp.fromDate(data.tarikhLahir),
      activatedBy: isAktif ? createdBy : null,
      activatedAt: isAktif ? serverTimestamp() : null,
      deactivatedBy: !isAktif ? createdBy : null,
      deactivatedAt: !isAktif ? serverTimestamp() : null,
      lastModifiedBy: createdBy,
      lastModifiedAt: serverTimestamp(),
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
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
  data: Partial<AnakKariahFormData>,
  modifiedBy: string = 'admin'
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
    const cleaned = stripUndefined(data);

    // Convert Date to Timestamp if tarikhLahir is provided
    if (cleaned.tarikhLahir instanceof Date) {
      cleaned.tarikhLahir = Timestamp.fromDate(cleaned.tarikhLahir);
    }

    // Ensure catatan is never undefined
    if ('catatan' in data) {
      cleaned.catatan = data.catatan || '';
    }

    cleaned.lastModifiedBy = modifiedBy;
    cleaned.lastModifiedAt = serverTimestamp();
    cleaned.updatedAt = serverTimestamp();

    await updateDoc(memberRef, cleaned);
  } catch (error) {
    console.error('Error updating anak kariah:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Gagal mengemas kini ahli');
  }
}

/**
 * Toggle member status (aktif/tidak_aktif)
 */
export async function toggleMemberStatus(
  id: string,
  adminEmail: string = 'admin'
): Promise<StatusType> {
  try {
    const memberRef = doc(db, ANAK_KARIAH_COLLECTION, id);
    const snapshot = await getDoc(memberRef);
    const currentStatus = snapshot.data()?.status || 'aktif';
    const newStatus: StatusType = currentStatus === 'aktif' ? 'tidak_aktif' : 'aktif';

    const auditFields = newStatus === 'aktif'
      ? { activatedBy: adminEmail, activatedAt: serverTimestamp() }
      : { deactivatedBy: adminEmail, deactivatedAt: serverTimestamp() };

    await updateDoc(memberRef, {
      status: newStatus,
      ...auditFields,
      lastModifiedBy: adminEmail,
      lastModifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return newStatus;
  } catch (error) {
    console.error('Error toggling member status:', error);
    throw new Error('Gagal mengemas kini status ahli');
  }
}

/**
 * Soft delete anak kariah
 */
export async function softDeleteAnakKariah(
  id: string,
  deletedBy: string = 'admin'
): Promise<void> {
  try {
    const memberRef = doc(db, ANAK_KARIAH_COLLECTION, id);
    await updateDoc(memberRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error soft deleting anak kariah:', error);
    throw new Error('Gagal memadam ahli');
  }
}

/**
 * Hard delete anak kariah (kept for admin cleanup)
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
 * Check if IC number already exists (excluding soft-deleted)
 */
async function checkICExists(ic: string, excludeId?: string): Promise<boolean> {
  try {
    const membersRef = collection(db, ANAK_KARIAH_COLLECTION);
    const q = query(membersRef, where('ic', '==', ic));
    const snapshot = await getDocs(q);

    const activeDocs = snapshot.docs.filter((d) => {
      const data = d.data();
      if (excludeId && d.id === excludeId) return false;
      return !data.isDeleted;
    });

    return activeDocs.length > 0;
  } catch (error) {
    console.error('Error checking IC:', error);
    return false;
  }
}

/**
 * Get recent registrations (excluding soft-deleted)
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

    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as AnakKariah)
      .filter((m) => !m.isDeleted);
  } catch (error) {
    console.error('Error fetching recent registrations:', error);
    throw new Error('Gagal mendapatkan pendaftaran terkini');
  }
}

/**
 * Get statistics for dashboard (excluding soft-deleted)
 */
export async function getAnakKariahStats() {
  try {
    const membersRef = collection(db, ANAK_KARIAH_COLLECTION);
    const snapshot = await getDocs(membersRef);

    const activeDocs = snapshot.docs.filter((d) => !d.data().isDeleted);

    const total = activeDocs.length;
    const aktif = activeDocs.filter(
      (doc) => doc.data().status === 'aktif'
    ).length;
    const tidakAktif = activeDocs.filter(
      (doc) => doc.data().status === 'tidak_aktif'
    ).length;

    // Get recent registrations count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentQuery = query(
      membersRef,
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    const recentSnapshot = await getDocs(recentQuery);
    const recentCount = recentSnapshot.docs.filter((d) => !d.data().isDeleted).length;

    return {
      total,
      aktif,
      tidakAktif,
      recentRegistrations: recentCount
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      total: 0,
      aktif: 0,
      tidakAktif: 0,
      recentRegistrations: 0
    };
  }
}

/**
 * Search anak kariah by name or IC (excluding soft-deleted)
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
        !member.isDeleted &&
        (member.namaPenuh.toLowerCase().includes(searchLower) ||
        member.ic.includes(searchTerm) ||
        member.telefon.includes(searchTerm))
    );
  } catch (error) {
    console.error('Error searching anak kariah:', error);
    throw new Error('Gagal mencari ahli');
  }
}
