// lib/kuliah.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Kuliah } from '@/types';

const COLLECTION = 'kuliah';

/**
 * Map Firestore error codes to Malay messages.
 */
function getFirestoreErrorMessage(code: string): string {
  switch (code) {
    case 'permission-denied':
      return 'Tiada kebenaran untuk mengakses pangkalan data. Sila log masuk semula atau hubungi pentadbir.';
    case 'not-found':
      return 'Dokumen tidak dijumpai dalam pangkalan data.';
    case 'already-exists':
      return 'Dokumen sudah wujud dalam pangkalan data.';
    case 'resource-exhausted':
      return 'Had kuota pangkalan data telah dicapai. Sila hubungi pentadbir.';
    case 'unavailable':
      return 'Pangkalan data tidak tersedia buat masa ini. Sila cuba lagi.';
    default:
      return `Ralat pangkalan data: ${code}`;
  }
}

export async function getAllKuliah(): Promise<Kuliah[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Kuliah));
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[kuliah] getAllKuliah failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function getActiveKuliah(): Promise<Kuliah[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('aktif', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Kuliah));
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[kuliah] getActiveKuliah failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function getKuliahById(id: string): Promise<Kuliah | null> {
  try {
    const docRef = doc(db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Kuliah;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[kuliah] getKuliahById(${id}) failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function createKuliah(data: Omit<Kuliah, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      keterangan: data.keterangan || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`[kuliah] Created document: ${docRef.id}`);
    return docRef;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[kuliah] createKuliah failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function updateKuliah(id: string, data: Partial<Kuliah>) {
  try {
    const docRef = doc(db, COLLECTION, id);
    const { id: _id, createdAt, ...rest } = data as Record<string, unknown>;
    await updateDoc(docRef, { ...rest, updatedAt: serverTimestamp() });
    console.log(`[kuliah] Updated document: ${id}`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[kuliah] updateKuliah(${id}) failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function deleteKuliah(id: string) {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
    console.log(`[kuliah] Deleted document: ${id}`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[kuliah] deleteKuliah(${id}) failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function toggleKuliahStatus(id: string, aktif: boolean) {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      aktif,
      updatedAt: serverTimestamp(),
    });
    console.log(`[kuliah] Toggled document ${id} aktif=${aktif}`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[kuliah] toggleKuliahStatus(${id}) failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}
