// lib/jadualKuliah.ts
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
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { JadualKuliah, KategoriKuliah } from '@/types';

const JADUAL_COLLECTION = 'jadualKuliah';
const KATEGORI_COLLECTION = 'kategoriKuliah';

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

// ─── Jadual Kuliah CRUD ───

export async function getAllJadualKuliah(): Promise<JadualKuliah[]> {
  try {
    const q = query(collection(db, JADUAL_COLLECTION), orderBy('sequence', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JadualKuliah));
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[jadualKuliah] getAllJadualKuliah failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function getActiveJadualKuliah(): Promise<JadualKuliah[]> {
  try {
    const q = query(
      collection(db, JADUAL_COLLECTION),
      where('isActive', '==', true),
      orderBy('sequence', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JadualKuliah));
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    // Fallback without orderBy if index is missing
    if (code === 'failed-precondition') {
      try {
        const fallbackQ = query(
          collection(db, JADUAL_COLLECTION),
          where('isActive', '==', true)
        );
        const snapshot = await getDocs(fallbackQ);
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JadualKuliah));
        return docs.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
      } catch (fallbackErr) {
        console.error('[jadualKuliah] Fallback query failed:', fallbackErr);
        return [];
      }
    }
    console.error(`[jadualKuliah] getActiveJadualKuliah failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function getJadualKuliahById(id: string): Promise<JadualKuliah | null> {
  try {
    const snapshot = await getDoc(doc(db, JADUAL_COLLECTION, id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as JadualKuliah;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[jadualKuliah] getById(${id}) failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function createJadualKuliah(
  data: Omit<JadualKuliah, 'id' | 'createdAt' | 'updatedAt'>
) {
  try {
    const docRef = await addDoc(collection(db, JADUAL_COLLECTION), {
      ...data,
      description: data.description || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`[jadualKuliah] Created: ${docRef.id}`);
    return docRef;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[jadualKuliah] create failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function updateJadualKuliah(id: string, data: Partial<JadualKuliah>) {
  try {
    const docRef = doc(db, JADUAL_COLLECTION, id);
    const { id: _id, createdAt, ...rest } = data as Record<string, unknown>;
    await updateDoc(docRef, { ...rest, updatedAt: serverTimestamp() });
    console.log(`[jadualKuliah] Updated: ${id}`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[jadualKuliah] update(${id}) failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function deleteJadualKuliah(id: string) {
  try {
    await deleteDoc(doc(db, JADUAL_COLLECTION, id));
    console.log(`[jadualKuliah] Deleted: ${id}`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[jadualKuliah] delete(${id}) failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function toggleJadualKuliahStatus(id: string, isActive: boolean) {
  try {
    await updateDoc(doc(db, JADUAL_COLLECTION, id), {
      isActive,
      updatedAt: serverTimestamp(),
    });
    console.log(`[jadualKuliah] Toggled ${id} isActive=${isActive}`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[jadualKuliah] toggle(${id}) failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function updateJadualSequences(items: { id: string; sequence: number }[]) {
  try {
    const batch = writeBatch(db);
    items.forEach(({ id, sequence }) => {
      batch.update(doc(db, JADUAL_COLLECTION, id), { sequence, updatedAt: serverTimestamp() });
    });
    await batch.commit();
    console.log(`[jadualKuliah] Updated ${items.length} sequences`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[jadualKuliah] updateSequences failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

// ─── Kategori Kuliah CRUD ───

export async function getAllKategori(): Promise<KategoriKuliah[]> {
  try {
    const q = query(collection(db, KATEGORI_COLLECTION), orderBy('sequence', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as KategoriKuliah));
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    // Fallback without orderBy if index is missing
    if (code === 'failed-precondition') {
      try {
        const snapshot = await getDocs(collection(db, KATEGORI_COLLECTION));
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as KategoriKuliah));
        return docs.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
      } catch (fallbackErr) {
        console.error('[kategoriKuliah] Fallback query failed:', fallbackErr);
        return [];
      }
    }
    console.error(`[kategoriKuliah] getAllKategori failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function getActiveKategori(): Promise<KategoriKuliah[]> {
  try {
    const q = query(
      collection(db, KATEGORI_COLLECTION),
      where('isActive', '==', true),
      orderBy('sequence', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as KategoriKuliah));
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    if (code === 'failed-precondition') {
      try {
        const fallbackQ = query(
          collection(db, KATEGORI_COLLECTION),
          where('isActive', '==', true)
        );
        const snapshot = await getDocs(fallbackQ);
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as KategoriKuliah));
        return docs.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
      } catch (fallbackErr) {
        console.error('[kategoriKuliah] Fallback active query failed:', fallbackErr);
        return [];
      }
    }
    console.error(`[kategoriKuliah] getActiveKategori failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function createKategori(
  data: Omit<KategoriKuliah, 'id' | 'createdAt'>
) {
  try {
    const docRef = await addDoc(collection(db, KATEGORI_COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
    });
    console.log(`[kategoriKuliah] Created: ${docRef.id}`);
    return docRef;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[kategoriKuliah] create failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function updateKategori(id: string, data: Partial<KategoriKuliah>) {
  try {
    const docRef = doc(db, KATEGORI_COLLECTION, id);
    const { id: _id, createdAt, ...rest } = data as Record<string, unknown>;
    await updateDoc(docRef, rest);
    console.log(`[kategoriKuliah] Updated: ${id}`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[kategoriKuliah] update(${id}) failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function deleteKategori(id: string) {
  try {
    await deleteDoc(doc(db, KATEGORI_COLLECTION, id));
    console.log(`[kategoriKuliah] Deleted: ${id}`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[kategoriKuliah] delete(${id}) failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}

export async function updateKategoriSequences(items: { id: string; sequence: number }[]) {
  try {
    const batch = writeBatch(db);
    items.forEach(({ id, sequence }) => {
      batch.update(doc(db, KATEGORI_COLLECTION, id), { sequence });
    });
    await batch.commit();
    console.log(`[kategoriKuliah] Updated ${items.length} sequences`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown';
    console.error(`[kategoriKuliah] updateSequences failed (${code}):`, err);
    throw new Error(getFirestoreErrorMessage(code));
  }
}
