import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface Quote {
  id?: string;
  text: string;
  source: string;
  category: 'Al-Quran' | 'Hadis' | 'Ulama' | 'Umum';
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  sequence: number;
}

export const QUOTE_CATEGORIES = ['Al-Quran', 'Hadis', 'Ulama', 'Umum'] as const;

export async function getAllQuotes(): Promise<Quote[]> {
  const q = query(
    collection(db, 'quotes'),
    orderBy('sequence', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Quote));
}

export async function createQuote(
  data: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'sequence'>
): Promise<void> {
  const all = await getDocs(collection(db, 'quotes'));
  const maxSeq = all.docs.reduce((max, d) => {
    const seq = (d.data().sequence as number) ?? 0;
    return seq > max ? seq : max;
  }, 0);
  await addDoc(collection(db, 'quotes'), {
    ...data,
    sequence: maxSeq + 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateQuote(id: string, data: Partial<Quote>): Promise<void> {
  await updateDoc(doc(db, 'quotes', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteQuote(id: string): Promise<void> {
  await deleteDoc(doc(db, 'quotes', id));
}

export async function toggleQuoteStatus(id: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, 'quotes', id), { isActive: !isActive, updatedAt: serverTimestamp() });
}

export function subscribeToQuotes(callback: (quotes: Quote[]) => void): () => void {
  const q = query(collection(db, 'quotes'), orderBy('sequence', 'asc'));
  return onSnapshot(q, snapshot => {
    const quotes = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Quote));
    callback(quotes);
  });
}
