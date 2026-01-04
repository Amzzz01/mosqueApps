// Database Operations Utilities
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
  startAfter,
  DocumentSnapshot,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Generic CRUD Operations

/**
 * Get a single document by ID
 */
export async function getDocument<T>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get all documents from a collection
 */
export async function getAllDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Add a new document
 */
export async function addDocument<T>(
  collectionName: string,
  data: Omit<T, 'id'>
): Promise<string> {
  try {
    const collectionRef = collection(db, collectionName);
    const timestamp = Timestamp.now();

    const docData = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const docRef = await addDoc(collectionRef, docData);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Update an existing document
 */
export async function updateDocument<T>(
  collectionName: string,
  documentId: string,
  data: Partial<T>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const timestamp = Timestamp.now();

    const updateData = {
      ...data,
      updatedAt: timestamp,
    };

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Query documents with filters
 */
export async function queryDocuments<T>(
  collectionName: string,
  filters: {
    field: string;
    operator: any;
    value: any;
  }[],
  sortField?: string,
  sortDirection: 'asc' | 'desc' = 'desc',
  limitCount?: number
): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName);
    const constraints: QueryConstraint[] = [];

    // Add where clauses
    filters.forEach(filter => {
      constraints.push(where(filter.field, filter.operator, filter.value));
    });

    // Add sorting
    if (sortField) {
      constraints.push(orderBy(sortField, sortDirection));
    }

    // Add limit
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error querying documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get paginated documents
 */
export async function getPaginatedDocuments<T>(
  collectionName: string,
  pageSize: number,
  lastDoc?: DocumentSnapshot,
  constraints: QueryConstraint[] = []
): Promise<{
  documents: T[];
  lastDocument: DocumentSnapshot | null;
  hasMore: boolean;
}> {
  try {
    const collectionRef = collection(db, collectionName);
    const queryConstraints = [...constraints, limit(pageSize + 1)];

    if (lastDoc) {
      queryConstraints.push(startAfter(lastDoc));
    }

    const q = query(collectionRef, ...queryConstraints);
    const snapshot = await getDocs(q);

    const documents = snapshot.docs.slice(0, pageSize).map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];

    const hasMore = snapshot.docs.length > pageSize;
    const lastDocument = hasMore ? snapshot.docs[pageSize - 1] : null;

    return { documents, lastDocument, hasMore };
  } catch (error) {
    console.error(`Error getting paginated documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Count documents in a collection
 */
export async function countDocuments(
  collectionName: string,
  filters?: {
    field: string;
    operator: any;
    value: any;
  }[]
): Promise<number> {
  try {
    const collectionRef = collection(db, collectionName);
    let q = query(collectionRef);

    if (filters && filters.length > 0) {
      const constraints: QueryConstraint[] = filters.map(filter =>
        where(filter.field, filter.operator, filter.value)
      );
      q = query(collectionRef, ...constraints);
    }

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error(`Error counting documents in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Search documents by field (case-insensitive partial match)
 */
export async function searchDocuments<T>(
  collectionName: string,
  searchField: string,
  searchTerm: string
): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);

    const searchTermLower = searchTerm.toLowerCase();

    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((doc: any) => {
        const fieldValue = doc[searchField];
        if (typeof fieldValue === 'string') {
          return fieldValue.toLowerCase().includes(searchTermLower);
        }
        return false;
      }) as T[];
  } catch (error) {
    console.error(`Error searching documents in ${collectionName}:`, error);
    throw error;
  }
}

// Utility: Convert Firestore Timestamp to Date
export function timestampToDate(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
}

// Utility: Convert Date to Firestore Timestamp
export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}