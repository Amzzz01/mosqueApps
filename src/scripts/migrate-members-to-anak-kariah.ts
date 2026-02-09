/**
 * Migration Script: `members` → `anakKariah` Collection
 *
 * Reads all documents from the legacy `members` Firestore collection
 * and writes them into `anakKariah` with the correct Malay field names.
 *
 * Usage:
 *   npm run migrate:members              # dry-run (default)
 *   npm run migrate:members -- --execute # actually write
 *
 * Prerequisites:
 *   - .env.local with FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL,
 *     and FIREBASE_ADMIN_PRIVATE_KEY
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// ─── Load .env.local ────────────────────────────────────────────────────────
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// ─── Initialise Firebase Admin ──────────────────────────────────────────────

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    'ERROR: Missing Firebase Admin credentials in .env.local.\n' +
      'Required: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY'
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const db = admin.firestore();

// ─── Field mapping helpers ──────────────────────────────────────────────────

function mapGender(gender: string): 'Lelaki' | 'Perempuan' {
  switch (gender?.toLowerCase()) {
    case 'male':
      return 'Lelaki';
    case 'female':
      return 'Perempuan';
    default:
      console.warn(`  ⚠ Unknown gender value "${gender}", defaulting to "Lelaki"`);
      return 'Lelaki';
  }
}

function mapStatus(status: string): 'aktif' | 'tidak_aktif' {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'aktif';
    case 'inactive':
      return 'tidak_aktif';
    default:
      console.warn(`  ⚠ Unknown membershipStatus "${status}", defaulting to "aktif"`);
      return 'aktif';
  }
}

interface LegacyMember {
  fullName?: string;
  icNumber?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  kariahArea?: string;
  dateOfBirth?: admin.firestore.Timestamp;
  gender?: string;
  membershipStatus?: string;
  registrationDate?: admin.firestore.Timestamp;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

function mapMemberToAnakKariah(data: LegacyMember) {
  const now = admin.firestore.Timestamp.now();

  return {
    namaPenuh: data.fullName || '',
    ic: data.icNumber || '',
    telefon: data.phoneNumber || '',
    email: data.email || '',
    alamat: data.address || '',
    kawasanId: '',
    kawasanName: data.kariahArea || '',
    jantina: mapGender(data.gender || ''),
    tarikhLahir: data.dateOfBirth || now,
    status: mapStatus(data.membershipStatus || ''),
    coordinates: null,
    detectionMethod: 'manual' as const,
    autoDetectedKawasan: null,
    isDeleted: false,
    createdAt: data.createdAt || data.registrationDate || now,
    updatedAt: data.updatedAt || now,
  };
}

// ─── Main migration ─────────────────────────────────────────────────────────

async function migrate() {
  const dryRun = !process.argv.includes('--execute');

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  members → anakKariah Migration`);
  console.log(`  Mode: ${dryRun ? 'DRY RUN (pass --execute to write)' : 'EXECUTE'}`);
  console.log(`${'='.repeat(60)}\n`);

  // 1. Read all members
  const membersSnapshot = await db.collection('members').get();
  console.log(`Found ${membersSnapshot.size} document(s) in "members" collection.\n`);

  if (membersSnapshot.empty) {
    console.log('Nothing to migrate. Exiting.');
    return;
  }

  // 2. Read existing anakKariah ICs to detect duplicates
  const existingICs = new Set<string>();
  const akSnapshot = await db.collection('anakKariah').get();
  akSnapshot.forEach((doc) => {
    const ic = doc.data().ic;
    if (ic) existingICs.add(ic);
  });
  console.log(`Found ${existingICs.size} existing IC(s) in "anakKariah" collection.\n`);

  // 3. Process in batches of 500
  const BATCH_SIZE = 500;
  let batch = db.batch();
  let batchCount = 0;
  let totalWritten = 0;
  let totalSkipped = 0;

  for (const doc of membersSnapshot.docs) {
    const data = doc.data() as LegacyMember;
    const mapped = mapMemberToAnakKariah(data);

    // Duplicate check by IC
    if (mapped.ic && existingICs.has(mapped.ic)) {
      console.log(`  SKIP (duplicate IC): ${mapped.ic} – ${mapped.namaPenuh}`);
      totalSkipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  [DRY RUN] Would write: ${mapped.ic || doc.id} – ${mapped.namaPenuh}`);
      console.log(`            Fields: jantina=${mapped.jantina}, status=${mapped.status}, kawasan=${mapped.kawasanName || '(none)'}`);
    } else {
      const newRef = db.collection('anakKariah').doc();
      batch.set(newRef, mapped);
      batchCount++;

      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`  Committed batch of ${batchCount} documents.`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (mapped.ic) existingICs.add(mapped.ic);
    totalWritten++;
  }

  // Commit remaining batch
  if (!dryRun && batchCount > 0) {
    await batch.commit();
    console.log(`  Committed final batch of ${batchCount} documents.`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Migration ${dryRun ? '(DRY RUN) ' : ''}complete!`);
  console.log(`  Written: ${totalWritten}`);
  console.log(`  Skipped (duplicates): ${totalSkipped}`);
  console.log(`${'='.repeat(60)}\n`);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
