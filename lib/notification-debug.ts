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
      const registration = await navigator.serviceWorker.getRegistration();
      serviceWorkerReady = !!registration && !!registration.active;
      details.push(`SW Ready: ${serviceWorkerReady ? '✓' : '✗'}`);
      if (registration) {
        details.push(`SW Scope: ${registration.scope}`);
        details.push(`SW State: ${registration.active?.state || 'none'}`);
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

  if (Notification.permission !== 'granted') {
    console.error('[Test] Permission not granted');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification('MASJID AL-FALAH', {
      body: 'Ini adalah notifikasi ujian. Jika anda melihat ini, notifikasi berfungsi dengan baik!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
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
