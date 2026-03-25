// lib/notification-debug.ts
// Mobile notification debugging utilities

export async function testNotificationPermissions(): Promise<{
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  serviceWorkerReady: boolean;
  pushManagerAvailable: boolean;
  details: string[];
}> {
  const details: string[] = [];

  if (typeof window === 'undefined') {
    return {
      supported: false,
      permission: 'unsupported',
      serviceWorkerReady: false,
      pushManagerAvailable: false,
      details: ['Running on server side'],
    };
  }

  const notificationSupported = 'Notification' in window;
  details.push(`Notification API: ${notificationSupported ? '✓' : '✗'}`);

  const swSupported = 'serviceWorker' in navigator;
  details.push(`Service Worker: ${swSupported ? '✓' : '✗'}`);

  const pushSupported = 'PushManager' in window;
  details.push(`Push Manager: ${pushSupported ? '✓' : '✗'}`);

  let permission: NotificationPermission | 'unsupported' = 'unsupported';
  if (notificationSupported) {
    permission = Notification.permission;
    details.push(`Permission: ${permission}`);
  }

  let serviceWorkerReady = false;
  if (swSupported) {
    try {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);

      if (registration && 'active' in registration) {
        const reg = registration as ServiceWorkerRegistration;
        serviceWorkerReady = !!reg.active;
        details.push(`SW Ready: ${serviceWorkerReady ? '✓' : '✗'}`);
        details.push(`SW Scope: ${reg.scope}`);
        details.push(`SW State: ${reg.active?.state || 'none'}`);
        details.push(`SW Script: ${reg.active?.scriptURL || 'none'}`);

        // Also report installing/waiting SW if present
        if (reg.installing) {
          details.push(`SW Installing: ${reg.installing.state}`);
        }
        if (reg.waiting) {
          details.push(`SW Waiting: ${reg.waiting.state}`);
        }

        // Check push subscription
        try {
          const pushSub = await reg.pushManager.getSubscription();
          details.push(`Push Subscription: ${pushSub ? '✓' : '✗'}`);
          if (pushSub) {
            details.push(`Push Endpoint: ${pushSub.endpoint.slice(0, 50)}...`);
          }
        } catch (pushErr) {
          details.push(`Push Sub Error: ${pushErr}`);
        }
      } else {
        details.push('SW Ready: ✗ (timeout after 5s — SW not activated)');
        // Fallback: check getRegistration for more info
        const fallbackReg = await navigator.serviceWorker.getRegistration();
        if (fallbackReg) {
          details.push(`SW Scope: ${fallbackReg.scope}`);
          details.push(`SW Active: ${fallbackReg.active?.state || 'none'}`);
          if (fallbackReg.installing) details.push(`SW Installing: ${fallbackReg.installing.state}`);
          if (fallbackReg.waiting) details.push(`SW Waiting: ${fallbackReg.waiting.state}`);
        } else {
          details.push('SW Registration: none found');
        }
      }
    } catch (err) {
      details.push(`SW Error: ${err}`);
    }
  }

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  details.push(`Mobile: ${isMobile ? '✓' : '✗'}`);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    details.push('⚠️ iOS: Limited PWA notification support');
  }

  return {
    supported: notificationSupported && swSupported && pushSupported,
    permission,
    serviceWorkerReady,
    pushManagerAvailable: pushSupported,
    details,
  };
}

export async function sendTestNotification(): Promise<{ success: boolean; logs: string[] }> {
  const logs: string[] = [];

  try {
    // Step 1: check permission
    if (typeof window === 'undefined' || !('Notification' in window)) {
      logs.push('✗ Notification API tidak disokong dalam pelayar ini');
      return { success: false, logs };
    }
    const perm = Notification.permission;
    logs.push(`Permission semasa: ${perm}`);

    if (perm === 'denied') {
      logs.push('✗ Permission disekat — pengguna perlu benarkan notifikasi di tetapan pelayar');
      return { success: false, logs };
    }

    // Step 2: get real FCM token via the standard permission + getToken flow
    const { requestNotificationPermission } = await import('@/lib/firebase-messaging');
    logs.push('Mendapatkan FCM token...');
    const token = await requestNotificationPermission();
    if (token) {
      logs.push(`✓ Token diperoleh: ${token.slice(0, 20)}...${token.slice(-8)}`);
    } else {
      logs.push('✗ Token tidak diperoleh (null)');
    }

    // Step 3: no token — explain likely causes
    if (!token) {
      logs.push('Kemungkinan punca: VAPID key hilang atau tidak betul, SW tidak bersedia / stuck, atau permission disekat');
      return { success: false, logs };
    }

    // Step 4: send via FCM API (same path as real notifications)
    logs.push('Menghantar ke /api/notifications/send...');
    const res = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Notifikasi Ujian',
        body: 'Ini ujian melalui FCM — sama seperti notifikasi sebenar',
        recipientType: 'all',
        url: '/',
      }),
    });

    // Step 5: parse and log API response
    const result = await res.json();
    logs.push(`Status API: ${res.status}`);
    logs.push(`Dihantar: ${result.sent ?? '?'}, Gagal: ${result.failed ?? '?'}, Jumlah: ${result.total ?? '?'}`);
    if (result.message) {
      logs.push(`Mesej: ${result.message}`);
    }
    if (result.errors?.length) {
      for (const e of result.errors) {
        logs.push(`Ralat token: code=${e.code} source=${e.source} cleaned=${e.cleaned}`);
      }
    }

    // Step 6: return based on sent count
    return { success: (result.sent ?? 0) > 0, logs };

  } catch (err) {
    logs.push(`✗ Ralat tidak dijangka: ${err instanceof Error ? err.message : String(err)}`);
    return { success: false, logs };
  }
}
