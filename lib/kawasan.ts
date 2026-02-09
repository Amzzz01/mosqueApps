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
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Kawasan, KawasanFormData, GeoJSONPolygon } from '@/types/kariah';

const KAWASAN_COLLECTION = 'kawasan';

/**
 * Convert GeoJSONPolygon (number[][][]) to Firestore-safe format.
 * Firestore does NOT support nested arrays at any depth, so we flatten
 * the outer ring to a single array of { lng, lat } objects.
 */
function boundariesToFirestore(
  boundaries: GeoJSONPolygon | null
): { type: string; coordinates: Array<{ lng: number; lat: number }> } | null {
  if (!boundaries || !boundaries.coordinates || boundaries.coordinates.length === 0) return null;
  const ring = boundaries.coordinates[0]; // outer ring only
  return {
    type: boundaries.type,
    coordinates: ring.map((coord) => ({ lng: coord[0], lat: coord[1] }))
  };
}

/**
 * Convert Firestore-stored boundaries back to GeoJSONPolygon (number[][][]).
 * Handles both flat format [{lng,lat}] and legacy nested [[lng,lat]] arrays.
 */
function boundariesFromFirestore(
  raw: any
): GeoJSONPolygon | null {
  if (!raw || !raw.coordinates || raw.coordinates.length === 0) return null;

  const first = raw.coordinates[0];

  // Legacy format: coordinates is already number[][][] (nested arrays)
  if (Array.isArray(first) && Array.isArray(first[0])) {
    return { type: 'Polygon', coordinates: raw.coordinates };
  }

  // Legacy format: coordinates is number[][] (single ring of [lng, lat] pairs)
  if (Array.isArray(first) && typeof first[0] === 'number') {
    return { type: 'Polygon', coordinates: [raw.coordinates] };
  }

  // New format: coordinates is [{lng, lat}, ...] (flat array of objects)
  return {
    type: 'Polygon',
    coordinates: [
      raw.coordinates.map((coord: { lng: number; lat: number }) => [coord.lng, coord.lat])
    ]
  };
}

/**
 * Get all kawasan (active and inactive)
 */
export async function getAllKawasan(): Promise<Kawasan[]> {
  try {
    const kawasanRef = collection(db, KAWASAN_COLLECTION);
    const q = query(kawasanRef, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        boundaries: boundariesFromFirestore(data.boundaries)
      } as Kawasan;
    });
  } catch (error) {
    console.error('Error fetching kawasan:', error);
    throw new Error('Gagal mendapatkan data kawasan');
  }
}

/**
 * Get only active kawasan
 */
export async function getActiveKawasan(): Promise<Kawasan[]> {
  try {
    const kawasanRef = collection(db, KAWASAN_COLLECTION);
    const q = query(
      kawasanRef,
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        boundaries: boundariesFromFirestore(data.boundaries)
      } as Kawasan;
    });
  } catch (error) {
    console.error('Error fetching active kawasan:', error);
    throw new Error('Gagal mendapatkan data kawasan aktif');
  }
}

/**
 * Get kawasan by ID
 */
export async function getKawasanById(id: string): Promise<Kawasan | null> {
  try {
    const kawasanRef = doc(db, KAWASAN_COLLECTION, id);
    const snapshot = await getDoc(kawasanRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id,
      boundaries: boundariesFromFirestore(data.boundaries)
    } as Kawasan;
  } catch (error) {
    console.error('Error fetching kawasan by ID:', error);
    throw new Error('Gagal mendapatkan data kawasan');
  }
}

/**
 * Create new kawasan
 */
export async function createKawasan(
  data: KawasanFormData
): Promise<string> {
  try {
    // Check if kawasan name already exists
    const existing = await checkKawasanNameExists(data.name);
    if (existing) {
      throw new Error('Nama kawasan sudah wujud');
    }

    const kawasanRef = collection(db, KAWASAN_COLLECTION);
    const docRef = await addDoc(kawasanRef, {
      ...data,
      boundaries: boundariesToFirestore(data.boundaries),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating kawasan:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Gagal menambah kawasan');
  }
}

/**
 * Update existing kawasan
 */
export async function updateKawasan(
  id: string,
  data: Partial<KawasanFormData>
): Promise<void> {
  try {
    // If updating name, check if new name already exists
    if (data.name) {
      const existing = await checkKawasanNameExists(data.name, id);
      if (existing) {
        throw new Error('Nama kawasan sudah wujud');
      }
    }

    const kawasanRef = doc(db, KAWASAN_COLLECTION, id);
    const updateData: any = { ...data, updatedAt: serverTimestamp() };
    if (data.boundaries !== undefined) {
      updateData.boundaries = boundariesToFirestore(data.boundaries ?? null);
    }
    await updateDoc(kawasanRef, updateData);
  } catch (error) {
    console.error('Error updating kawasan:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Gagal mengemas kini kawasan');
  }
}

/**
 * Delete kawasan
 */
export async function deleteKawasan(id: string): Promise<void> {
  try {
    // Check if kawasan has members
    const hasMembers = await checkKawasanHasMembers(id);
    if (hasMembers) {
      throw new Error('Kawasan tidak boleh dipadam kerana masih mempunyai ahli');
    }

    const kawasanRef = doc(db, KAWASAN_COLLECTION, id);
    await deleteDoc(kawasanRef);
  } catch (error) {
    console.error('Error deleting kawasan:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Gagal memadam kawasan');
  }
}

/**
 * Toggle kawasan active status
 */
export async function toggleKawasanStatus(
  id: string,
  isActive: boolean
): Promise<void> {
  try {
    const kawasanRef = doc(db, KAWASAN_COLLECTION, id);
    await updateDoc(kawasanRef, {
      isActive,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error toggling kawasan status:', error);
    throw new Error('Gagal mengemas kini status kawasan');
  }
}

/**
 * Check if kawasan name already exists
 */
async function checkKawasanNameExists(
  name: string,
  excludeId?: string
): Promise<boolean> {
  try {
    const kawasanRef = collection(db, KAWASAN_COLLECTION);
    const q = query(kawasanRef, where('name', '==', name));
    const snapshot = await getDocs(q);

    if (excludeId) {
      return snapshot.docs.some((doc) => doc.id !== excludeId);
    }

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking kawasan name:', error);
    return false;
  }
}

/**
 * Check if kawasan has members
 */
async function checkKawasanHasMembers(kawasanId: string): Promise<boolean> {
  try {
    const membersRef = collection(db, 'anakKariah');
    const q = query(membersRef, where('kawasanId', '==', kawasanId));
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking kawasan members:', error);
    return false;
  }
}

/**
 * Get kawasan statistics
 */
export async function getKawasanStats(kawasanId: string) {
  try {
    const membersRef = collection(db, 'anakKariah');
    const q = query(membersRef, where('kawasanId', '==', kawasanId));
    const snapshot = await getDocs(q);

    const total = snapshot.size;
    const aktif = snapshot.docs.filter(
      (doc) => doc.data().status === 'aktif'
    ).length;
    const tidakAktif = snapshot.docs.filter(
      (doc) => doc.data().status === 'tidak_aktif'
    ).length;

    return {
      total,
      aktif,
      tidakAktif
    };
  } catch (error) {
    console.error('Error getting kawasan stats:', error);
    return {
      total: 0,
      aktif: 0,
      tidakAktif: 0
    };
  }
}