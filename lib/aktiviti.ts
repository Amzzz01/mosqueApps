// lib/aktiviti.ts
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
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { uploadFiles, deleteFile } from '@/lib/uploadHelpers';
import { Aktiviti } from '@/types';

const COLLECTION = 'activities';

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

export async function getAllAktiviti(): Promise<Aktiviti[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('tarikh', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Aktiviti));
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[aktiviti] getAllAktiviti failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function getPublishedAktiviti(): Promise<Aktiviti[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('published', '==', true),
      orderBy('tarikh', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Aktiviti));
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[aktiviti] getPublishedAktiviti failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function getAktivitiById(id: string): Promise<Aktiviti | null> {
  try {
    const docRef = doc(db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Aktiviti;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[aktiviti] getAktivitiById(${id}) failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function createAktiviti(data: Omit<Aktiviti, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    // Convert Date to Firestore Timestamp for reliability
    const tarikh = data.tarikh instanceof Date
      ? Timestamp.fromDate(data.tarikh)
      : data.tarikh;

    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      tarikh,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`[aktiviti] Created document: ${docRef.id}`);
    return docRef;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[aktiviti] createAktiviti failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function updateAktiviti(id: string, data: Partial<Aktiviti>) {
  try {
    const docRef = doc(db, COLLECTION, id);
    const { id: _id, createdAt, ...rest } = data as Record<string, unknown>;

    // Convert Date to Firestore Timestamp if present
    if (rest.tarikh instanceof Date) {
      rest.tarikh = Timestamp.fromDate(rest.tarikh);
    }

    await updateDoc(docRef, { ...rest, updatedAt: serverTimestamp() });
    console.log(`[aktiviti] Updated document: ${id}`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[aktiviti] updateAktiviti(${id}) failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function deleteAktiviti(id: string) {
  // Fetch activity to get image URLs before deleting
  const aktiviti = await getAktivitiById(id);
  if (aktiviti && aktiviti.gambarUrls?.length) {
    await Promise.all(aktiviti.gambarUrls.map(url => deleteFile(url)));
  }
  return deleteDoc(doc(db, COLLECTION, id));
}

export async function uploadActivityImages(files: File[]): Promise<string[]> {
  return uploadFiles(files, 'aktiviti');
}

export async function deleteActivityImage(url: string) {
  return deleteFile(url);
}
