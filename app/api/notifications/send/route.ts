// app/api/notifications/send/route.ts
import { NextResponse } from 'next/server';
import { getAdminMessaging, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { title, body, recipientType, topic, url } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Tajuk dan kandungan diperlukan' },
        { status: 400 }
      );
    }

    const messaging = getAdminMessaging();
    const db = getAdminFirestore();
    const link = url || '/';

    // Common notification payload
    const notification = { title, body };
    const webpush = {
      notification: {
        icon: '/icons/icon-192x192.png',
      },
      fcmOptions: { link },
    };

    let sentCount = 0;
    let failedCount = 0;
    let recipientCount = 0;

    // ─── Send to topic ───
    if (recipientType === 'topic' && topic) {
      try {
        await messaging.send({
          topic,
          notification,
          webpush,
        });
        sentCount = 1;
        recipientCount = 1;
      } catch (err) {
        console.error('[FCM] sendToTopic failed:', err);
        failedCount = 1;
      }
    } else {
      // ─── Send to all tokens (recipientType: all, members, sponsors, donors) ───
      const tokensSnap = await db.collectionGroup('fcmTokens').get();

      const tokens: string[] = [];
      tokensSnap.forEach((doc) => {
        const token = doc.data().token;
        if (token && !tokens.includes(token)) tokens.push(token);
      });

      recipientCount = tokens.length;

      if (tokens.length === 0) {
        // Save record even if no tokens
        await db.collection('notifications').add({
          title,
          body,
          recipientType: recipientType || 'all',
          topic: topic || null,
          link,
          status: 'sent',
          sentAt: FieldValue.serverTimestamp(),
          recipientCount: 0,
          sentCount: 0,
          failedCount: 0,
          createdAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
          success: true,
          sent: 0,
          failed: 0,
          total: 0,
          message: 'Tiada peranti berdaftar',
        });
      }

      // Send in batches of 500 (FCM limit)
      const batchSize = 500;
      const staleTokens: string[] = [];

      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);

        const response = await messaging.sendEachForMulticast({
          tokens: batch,
          notification,
          webpush,
        });

        sentCount += response.successCount;
        failedCount += response.failureCount;

        // Collect stale/invalid tokens for cleanup
        response.responses.forEach((resp, idx) => {
          if (
            resp.error &&
            (resp.error.code === 'messaging/registration-token-not-registered' ||
              resp.error.code === 'messaging/invalid-registration-token')
          ) {
            staleTokens.push(batch[idx]);
          }
        });
      }

      // Clean up stale tokens in background
      if (staleTokens.length > 0) {
        cleanupStaleTokens(db, staleTokens).catch((err) =>
          console.error('[FCM] Stale token cleanup error:', err)
        );
      }
    }

    // ─── Save notification record ───
    const notifRecord = await db.collection('notifications').add({
      title,
      body,
      recipientType: recipientType || 'all',
      topic: topic || null,
      link,
      status: failedCount > 0 && sentCount === 0 ? 'failed' : 'sent',
      sentAt: FieldValue.serverTimestamp(),
      recipientCount,
      sentCount,
      failedCount,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      id: notifRecord.id,
      sent: sentCount,
      failed: failedCount,
      total: recipientCount,
    });
  } catch (err) {
    console.error('[API/notifications] Error:', err);

    const message =
      err instanceof Error ? err.message : 'Gagal menghantar notifikasi';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Remove stale FCM tokens from Firestore.
 */
async function cleanupStaleTokens(
  db: FirebaseFirestore.Firestore,
  staleTokens: string[]
) {
  const snap = await db.collectionGroup('fcmTokens').get();
  const batch = db.batch();
  let count = 0;

  snap.forEach((doc) => {
    if (staleTokens.includes(doc.data().token)) {
      batch.delete(doc.ref);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`[FCM] Cleaned up ${count} stale tokens`);
  }
}
