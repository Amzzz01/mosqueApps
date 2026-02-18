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

export async function sendTestNotification(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.error('[Test] Notifications not supported');
    return false;
  }

  if (Notification.permission === 'denied') {
    console.error('[Test] Permission denied by user');
    return false;
  }

  // If permission is 'default', request it first
  if (Notification.permission === 'default') {
    console.log('[Test] Permission is default, requesting...');
    const result = await Notification.requestPermission();
    if (result !== 'granted') {
      console.error('[Test] Permission not granted after request:', result);
      return false;
    }
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification('MASJID AL-FALAH', {
      body: 'Ini adalah notifikasi ujian. Jika anda melihat ini, notifikasi berfungsi dengan baik!',
      icon: window.location.origin + '/icons/icon-192x192.png',
      badge: window.location.origin + '/icons/badge-72x72.png',
      tag: 'test-notification',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false,
      timestamp: Date.now(),
      data: { url: '/', test: true },
      dir: 'ltr',
      lang: 'ms-MY',
    } as NotificationOptions);

    console.log('[Test] Test notification sent');
    return true;
  } catch (err) {
    console.error('[Test] Failed:', err);
    return false;
  }
}
