// app/api/notifications/cleanup/route.ts
import { NextResponse } from 'next/server';
import { getAdminMessaging, getAdminFirestore, getAdminAuth } from '@/lib/firebase-admin';

interface TokenResult {
  path: string;
  token: string;
  status: 'valid' | 'invalid' | 'error';
  errorCode?: string;
  deleted: boolean;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Pengesahan diperlukan (Authentication required)' }, { status: 401 });
    }

    const tokenHeader = authHeader.split('Bearer ')[1];
    try {
      await getAdminAuth().verifyIdToken(tokenHeader);
    } catch (err) {
      return NextResponse.json({ error: 'Token pengesahan tidak sah (Invalid token)' }, { status: 403 });
    }

    const messaging = getAdminMessaging();
    const db = getAdminFirestore();

    console.log('[Cleanup] Starting token validation scan...');

    // Get all FCM tokens
    const tokensSnap = await db.collectionGroup('fcmTokens').get();
    console.log(`[Cleanup] Found ${tokensSnap.size} token documents`);

    const results: TokenResult[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let deletedCount = 0;
    let errorCount = 0;
    let emptyCount = 0;

    for (const tokenDoc of tokensSnap.docs) {
      const data = tokenDoc.data();
      const token = data.token;
      const path = tokenDoc.ref.path;

      // Handle empty/missing token
      if (!token) {
        console.warn(`[Cleanup] EMPTY token at ${path} — deleting`);
        await tokenDoc.ref.delete();
        emptyCount++;
        deletedCount++;
        results.push({
          path,
          token: '(empty)',
          status: 'invalid',
          errorCode: 'empty-token',
          deleted: true,
        });
        continue;
      }

      // Dry-run send to test token validity
      try {
        await messaging.send(
          {
            token,
            notification: {
              title: 'Token Validation',
              body: 'This is a dry-run test',
            },
          },
          true // dryRun = true — does NOT actually send
        );

        console.log(`[Cleanup] VALID: ${path}`);
        validCount++;
        results.push({
          path,
          token: token.slice(0, 20) + '...' + token.slice(-10),
          status: 'valid',
          deleted: false,
        });
      } catch (err) {
        const error = err as { code?: string; message?: string };
        const code = error.code || 'unknown';

        const isInvalid =
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/invalid-argument';

        if (isInvalid) {
          console.warn(`[Cleanup] INVALID: ${path} (${code}) — deleting`);
          try {
            await tokenDoc.ref.delete();
            deletedCount++;
            invalidCount++;
            results.push({
              path,
              token: token.slice(0, 20) + '...' + token.slice(-10),
              status: 'invalid',
              errorCode: code,
              deleted: true,
            });
          } catch (delErr) {
            console.error(`[Cleanup] Failed to delete ${path}:`, delErr);
            invalidCount++;
            results.push({
              path,
              token: token.slice(0, 20) + '...' + token.slice(-10),
              status: 'invalid',
              errorCode: code,
              deleted: false,
            });
          }
        } else {
          // Other errors (rate limit, server error, etc.) — don't delete
          console.error(`[Cleanup] ERROR: ${path} (${code})`);
          errorCount++;
          results.push({
            path,
            token: token.slice(0, 20) + '...' + token.slice(-10),
            status: 'error',
            errorCode: code,
            deleted: false,
          });
        }
      }
    }

    console.log(`[Cleanup] Done: valid=${validCount}, invalid=${invalidCount}, errors=${errorCount}, empty=${emptyCount}, deleted=${deletedCount}`);

    return NextResponse.json({
      success: true,
      totalScanned: tokensSnap.size,
      valid: validCount,
      invalid: invalidCount,
      errors: errorCount,
      empty: emptyCount,
      deleted: deletedCount,
      results,
    });
  } catch (err) {
    console.error('[Cleanup] Error:', err);
    const message =
      err instanceof Error ? err.message : 'Gagal membersihkan token';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
