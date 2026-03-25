// app/api/notifications/send/route.ts
// DATA-ONLY payload — service worker handles notification display.
// This avoids conflicts with Firebase SDK intercepting the notification key.
import { NextResponse } from 'next/server';
import { getAdminMessaging, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

interface TokenError {
  token: string;
  code: string;
  message: string;
  source: string;
  cleaned: boolean;
}

function isInQuietHours(startHHMM: string, endHHMM: string): boolean {
  // Get current Malaysia time (UTC+8)
  const nowUtc = new Date();
  const myt = new Date(nowUtc.getTime() + 8 * 60 * 60 * 1000);
  const currentMin = myt.getUTCHours() * 60 + myt.getUTCMinutes();

  const [sh, sm] = startHHMM.split(':').map(Number);
  const [eh, em] = endHHMM.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin   = eh * 60 + em;

  if (startMin <= endMin) {
    // Same-day range e.g. 09:00–17:00
    return currentMin >= startMin && currentMin < endMin;
  } else {
    // Overnight range e.g. 22:00–06:00
    return currentMin >= startMin || currentMin < endMin;
  }
}

export async function POST(request: Request) {
  try {
    const reqBody = await request.json();
    const { title, body, recipientType, topic, notifId } = reqBody;
    const url = (reqBody.url as string) || '/';
    console.log('[API/notifications] Request received:', JSON.stringify(reqBody));

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Tajuk dan kandungan diperlukan' },
        { status: 400 }
      );
    }

    // ─── Quiet Hours Check ───
    // Cron routes bypass quiet hours via x-cron-secret header
    const cronSecret = request.headers.get('x-cron-secret');
    const isCronBypass = cronSecret && cronSecret === process.env.CRON_SECRET;

    if (!isCronBypass) {
      const db = getAdminFirestore();
      const settingsSnap = await db.collection('settings').doc('notifications').get();
      const settings = settingsSnap.data() || {};

      if (settings.quietHoursEnabled) {
        const quietStart: string = settings.quietHoursStart || '22:00';
        const quietEnd: string   = settings.quietHoursEnd   || '06:00';

        if (isInQuietHours(quietStart, quietEnd)) {
          console.log(`[API/notifications] Quiet hours active (${quietStart}–${quietEnd}), deferring`);
          if (notifId) {
            await db.collection('notifications').doc(notifId).update({
              status: 'pending',
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
          return NextResponse.json({
            quietHours: true,
            sent: 0,
            failed: 0,
            cleaned: 0,
            message: `Waktu senyap aktif (${quietStart}–${quietEnd}). Notifikasi ditunda.`,
          });
        }
      }
    }

    const messaging = getAdminMessaging();
    const db = getAdminFirestore();

    const origin = request.headers.get('origin');
    const forwardedHost = request.headers.get('x-forwarded-host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = origin || (forwardedHost ? `${proto}://${forwardedHost}` : 'https://mymasjidapp.vercel.app');

    // DATA-ONLY payload — no `notification` key.
    // The service worker's raw `push` handler displays the notification.
    // This avoids Firebase SDK intercepting and suppressing our handler.
    const data: Record<string, string> = {
      title,
      body,
      url,
      notifId: notifId || '',
      icon: baseUrl + '/icons/icon-192x192.png',
      badge: baseUrl + '/icons/badge-72x72.png',
      tag: notifId || 'masjid-notification',
    };

    const webpush = {
      headers: {
        Urgency: 'high',
        TTL: '86400',
        'content-available': '1',
      },
    };

    console.log('[FCM] Payload — data:', JSON.stringify(data));

    let sentCount = 0;
    let failedCount = 0;
    let recipientCount = 0;
    let cleanedCount = 0;
    const errors: TokenError[] = [];

    // ─── Send to topic ───
    if (recipientType === 'topic' && topic) {
      console.log('[FCM] Sending to topic:', topic);
      try {
        const topicResponse = await messaging.send({
          topic,
          data,
          webpush,
        });
        console.log('[FCM] Topic send response:', topicResponse);
        sentCount = 1;
        recipientCount = 1;
      } catch (err) {
        console.error('[FCM] sendToTopic failed:', err);
        failedCount = 1;
        errors.push({
          token: `topic:${topic}`,
          code: err instanceof Error ? err.message : 'unknown',
          message: err instanceof Error ? err.message : 'Topic send failed',
          source: 'topic',
          cleaned: false,
        });
      }
    } else {
      // ─── Collect and deduplicate tokens ───
      console.log('[FCM] Querying fcmTokens from Firestore...');
      const tokensSnap = await db.collectionGroup('fcmTokens').get();

      const tokenSet = new Set<string>();
      const tokenSources: Record<string, string> = {};
      const tokenRefs: Record<string, FirebaseFirestore.DocumentReference> = {};
      const duplicateRefs: FirebaseFirestore.DocumentReference[] = [];

      tokensSnap.forEach((docSnap) => {
        const token = docSnap.data().token;
        const path = docSnap.ref.path;
        if (!token) {
          console.warn(`[FCM]   EMPTY token in ${path} — queued for delete`);
          duplicateRefs.push(docSnap.ref);
          return;
        }
        if (tokenSet.has(token)) {
          console.log(`[FCM]   DUPLICATE token from ${path} — queued for delete`);
          duplicateRefs.push(docSnap.ref);
          return;
        }
        tokenSet.add(token);
        tokenSources[token] = path;
        tokenRefs[token] = docSnap.ref;
        console.log(`[FCM]   token from ${path}`);
      });

      // Clean up empty/duplicate token docs
      if (duplicateRefs.length > 0) {
        console.log(`[FCM] Cleaning ${duplicateRefs.length} empty/duplicate token docs...`);
        for (const ref of duplicateRefs) {
          ref.delete().catch(() => {});
        }
      }

      const tokens = Array.from(tokenSet);
      console.log(`[FCM] ${tokens.length} unique tokens (from ${tokensSnap.size} docs, ${duplicateRefs.length} duplicates removed)`);
      recipientCount = tokens.length;

      if (tokens.length === 0) {
        if (notifId) {
          await db.collection('notifications').doc(notifId).update({
            status: 'failed',
            sentAt: FieldValue.serverTimestamp(),
            recipientCount: 0,
            sentCount: 0,
            failedCount: 0,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        return NextResponse.json({
          success: true,
          sent: 0,
          failed: 0,
          cleaned: duplicateRefs.length,
          total: 0,
          errors: [],
          message: 'Tiada peranti berdaftar',
        });
      }

      // ─── Send in batches of 500 ───
      const batchSize = 500;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        console.log(`[FCM] Sending batch ${batchNum} (${batch.length} tokens)`);

        const response = await messaging.sendEachForMulticast({
          tokens: batch,
          data,
          webpush,
        });

        console.log(`[FCM] Batch ${batchNum}: success=${response.successCount}, failure=${response.failureCount}`);
        sentCount += response.successCount;
        failedCount += response.failureCount;

        for (let idx = 0; idx < response.responses.length; idx++) {
          const resp = response.responses[idx];
          const tokenVal = batch[idx];
          const source = tokenSources[tokenVal] || 'unknown';

          if (resp.error) {
            const errorCode = resp.error.code || 'unknown';
            const errorMsg = resp.error.message || 'Unknown error';
            console.error(`[FCM]   FAILED token[${i + idx}] code=${errorCode} source=${source}`);

            const isInvalid =
              errorCode === 'messaging/registration-token-not-registered' ||
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/invalid-argument';

            let cleaned = false;
            if (isInvalid && tokenRefs[tokenVal]) {
              try {
                await tokenRefs[tokenVal].delete();
                cleaned = true;
                cleanedCount++;
                console.log(`[FCM]     DELETED invalid token: ${source}`);
              } catch (delErr) {
                console.error(`[FCM]     Delete failed: ${delErr}`);
              }
            }

            errors.push({
              token: tokenVal.slice(0, 20) + '...' + tokenVal.slice(-10),
              code: errorCode,
              message: errorMsg,
              source,
              cleaned,
            });
          } else {
            console.log(`[FCM]   OK token[${i + idx}] (${source})`);
          }
        }
      }
    }

    // ─── Save/update notification record ───
    const status = sentCount > 0 ? 'sent' : 'failed';
    console.log(`[API/notifications] Final: sent=${sentCount}, failed=${failedCount}, cleaned=${cleanedCount}, total=${recipientCount}`);

    const updateData = {
      status,
      sentAt: FieldValue.serverTimestamp(),
      recipientCount,
      sentCount,
      failedCount,
      cleanedCount,
      updatedAt: FieldValue.serverTimestamp(),
    };

    let recordId = notifId;

    if (notifId) {
      await db.collection('notifications').doc(notifId).update(updateData);
    } else {
      const newDoc = await db.collection('notifications').add({
        title,
        body,
        recipientType: recipientType || 'all',
        ...(topic ? { topic } : {}),
        url,
        readBy: [],
        ...updateData,
        createdAt: FieldValue.serverTimestamp(),
      });
      recordId = newDoc.id;
    }

    return NextResponse.json({
      success: true,
      id: recordId,
      sent: sentCount,
      failed: failedCount,
      cleaned: cleanedCount,
      total: recipientCount,
      errors,
    });
  } catch (err) {
    console.error('[API/notifications] Error:', err);
    const message = err instanceof Error ? err.message : 'Gagal menghantar notifikasi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
