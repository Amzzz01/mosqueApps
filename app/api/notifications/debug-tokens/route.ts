import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminFirestore();
    const tokensSnap = await db.collectionGroup('fcmTokens').get();

    const tokens: {
      path: string;
      token: string;
      platform: string;
      updatedAt: string;
    }[] = [];

    tokensSnap.forEach((docSnap) => {
      const data = docSnap.data();
      tokens.push({
        path: docSnap.ref.path,
        token: data.token
          ? data.token.slice(0, 20) + '...' + data.token.slice(-10)
          : 'EMPTY',
        platform: data.platform || 'unknown',
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || 'unknown',
      });
    });

    return NextResponse.json({
      total: tokens.length,
      tokens,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
