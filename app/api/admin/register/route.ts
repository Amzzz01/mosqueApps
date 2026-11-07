// app/api/admin/register/route.ts
// Creates the adminUsers/{uid} record on the server. Firestore rules no longer let the
// browser create admin records, so nobody can make themselves an admin without the key.
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Pengesahan diperlukan' }, { status: 401 });
    }

    const { key, displayName } = await request.json();
    const registrationKey = process.env.ADMIN_REGISTRATION_KEY;
    if (!registrationKey) {
      return NextResponse.json({ error: 'Sistem pendaftaran tidak dikonfigurasi. Hubungi pentadbir.' }, { status: 500 });
    }
    if (typeof key !== 'string' || key !== registrationKey) {
      return NextResponse.json({ error: 'Kunci pendaftaran tidak sah' }, { status: 403 });
    }

    let decoded;
    try {
      decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length));
    } catch {
      return NextResponse.json({ error: 'Token pengesahan tidak sah' }, { status: 403 });
    }

    const name = typeof displayName === 'string' && displayName.trim()
      ? displayName.trim().slice(0, 80)
      : 'Admin';

    // create() fails if the record already exists, so an existing admin's role is never overwritten
    await getAdminFirestore().doc(`adminUsers/${decoded.uid}`).create({
      email: decoded.email ?? '',
      displayName: name,
      role: 'admin',
      active: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 6) {
      // ALREADY_EXISTS
      return NextResponse.json({ error: 'Akaun admin ini sudah wujud' }, { status: 409 });
    }
    console.error('[api/admin/register] Error:', err);
    return NextResponse.json({ error: 'Ralat pelayan. Sila cuba lagi.' }, { status: 500 });
  }
}
