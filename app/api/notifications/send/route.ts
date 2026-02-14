// app/api/notifications/send/route.ts
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

export async function POST(request: Request) {
  try {
    const reqBody = await request.json();
    const { title, body, recipientType, topic, url, notifId } = reqBody;
    console.log('[API/notifications] Request received:', JSON.stringify(reqBody));

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Tajuk dan kandungan diperlukan' },
        { status: 400 }
      );
    }

    const messaging = getAdminMessaging();
    const db = getAdminFirestore();
    const link = url || '/';

    // Mobile-compatible notification payload
    const notification = { title, body };
    const data: Record<string, string> = {
      title,
      body,
      link,
      notifId: notifId || '',
    };
    const webpush = {
      notification: {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        requireInteraction: false,
        silent: false,
        renotify: true,
        timestamp: Date.now(),
      },
      fcmOptions: { link },
    };
    const android = {
      priority: 'high' as const,
      notification: {
        channelId: 'masjid-notifications',
        priority: 'high' as const,
        defaultSound: true,
        defaultVibrateTimings: true,
        defaultLightSettings: true,
      },
    };

    console.log('[FCM] Payload — notification:', JSON.stringify(notification));
    console.log('[FCM] Payload — data:', JSON.stringify(data));
    console.log('[FCM] Payload — android priority:', android.priority);

    let sentCount = 0;
    let failedCount = 0;
    let recipientCount = 0;
    let cleanedCount = 0;
    const errors: TokenError[] = [];

    // ─── Send to topic ───
    if (recipientType === 'topic' && topic) {
      console.log('[FCM] Sending to topic:', topic);
      try {
        const topicResponse = await messaging.send({ topic, notification, data, webpush, android });
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
        // Update existing doc if notifId provided, otherwise create new
        if (notifId) {
          await db.collection('notifications').doc(notifId).update({
            status: 'sent',
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
          notification,
          data,
          webpush,
          android,
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

    // ─── Save/update notification record (single write) ───
    const status = sentCount > 0 ? 'sent' : failedCount > 0 ? 'failed' : 'sent';
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
      // Update existing doc created by the client
      await db.collection('notifications').doc(notifId).update(updateData);
    } else {
      // No existing doc — create one (direct API call without client)
      const newDoc = await db.collection('notifications').add({
        title,
        body,
        recipientType: recipientType || 'all',
        ...(topic ? { topic } : {}),
        link,
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
