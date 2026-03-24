// lib/uploadHelpers.ts
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export interface UploadError {
  fileName: string;
  message: string;
}

/**
 * Validate a file before upload (size + type).
 * Returns an error message or null if valid.
 */
export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `Fail "${file.name}" (${sizeMB}MB) melebihi had saiz 5MB.`;
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Jenis fail "${file.name}" tidak disokong. Hanya JPG, PNG, GIF, WEBP.`;
  }
  return null;
}

/**
 * Validate multiple files. Returns array of errors (empty if all valid).
 */
export function validateFiles(files: File[]): UploadError[] {
  const errors: UploadError[] = [];
  for (const file of files) {
    const msg = validateFile(file);
    if (msg) errors.push({ fileName: file.name, message: msg });
  }
  return errors;
}

/**
 * Upload a single file to Firebase Storage.
 * Uses uploadBytesResumable to avoid CORS issues with the REST API.
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  // Client-side validation
  const validationError = validateFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${path}/${Date.now()}_${sanitizedName}`;
  const storageRef = ref(storage, filename);

  return new Promise<string>((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          onProgress(percent);
        }
      },
      (error) => {
        const msg = getStorageErrorMessage(error.code, file.name);
        reject(new Error(msg));
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        } catch (error) {
          reject(new Error(`Gagal mendapatkan URL untuk "${file.name}".`));
        }
      }
    );
  });
}

/**
 * Upload multiple files to Firebase Storage.
 * Returns an array of download URLs.
 */
export async function uploadFiles(
  files: File[],
  path: string,
  onProgress?: (fileIndex: number, percent: number) => void
): Promise<string[]> {
  // Validate all files first
  const errors = validateFiles(files);
  if (errors.length > 0) {
    throw new Error(errors.map(e => e.message).join('\n'));
  }

  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const url = await uploadFile(files[i], path, (percent) => {
      onProgress?.(i, percent);
    });
    urls.push(url);
  }
  return urls;
}

/**
 * Delete a file from Firebase Storage by its download URL.
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error: unknown) {
    // Ignore "object-not-found" — file may already be deleted
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'storage/object-not-found'
    ) {
      return;
    }
    console.error('Error deleting file:', error);
  }
}

/**
 * Map Firebase Storage error codes to user-friendly Malay messages.
 */
function getStorageErrorMessage(code: string, fileName: string): string {
  switch (code) {
    case 'storage/unauthorized':
      return `Tiada kebenaran untuk memuat naik "${fileName}". Sila log masuk semula.`;
    case 'storage/canceled':
      return `Muat naik "${fileName}" telah dibatalkan.`;
    case 'storage/retry-limit-exceeded':
      return `Muat naik "${fileName}" gagal selepas beberapa percubaan. Sila cuba lagi.`;
    case 'storage/invalid-checksum':
      return `Fail "${fileName}" rosak semasa muat naik. Sila cuba lagi.`;
    case 'storage/server-file-wrong-size':
      return `Saiz fail "${fileName}" tidak sepadan. Sila cuba lagi.`;
    case 'storage/quota-exceeded':
      return 'Storan penuh. Sila hubungi pentadbir.';
    default:
      return `Gagal memuat naik "${fileName}". Sila cuba lagi.`;
  }
}
