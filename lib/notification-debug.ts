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
      const reg = await navigator.serviceWorker.getRegistration();
      serviceWorkerReady = !!reg && !!reg.active;
      details.push(`SW Ready: ${serviceWorkerReady ? '✓' : '✗'}`);
      if (reg) {
        details.push(`SW Scope: ${reg.scope}`);
        details.push(`SW Active: ${reg.active ? '✓' : '✗'}`);
        details.push(`SW Installing: ${reg.installing ? '✓' : '✗'}`);
        details.push(`SW Waiting: ${reg.waiting ? '✓' : '✗'}`);
      }
    } catch (err) {
      details.push(`SW Check Error: ${err}`);
    }
  }

  details.push(`User Agent: ${navigator.userAgent}`);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  details.push(`Mobile Device: ${isMobile ? '✓' : '✗'}`);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    details.push('⚠️ iOS has limited PWA notification support');
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
    console.error('[Test] Notification permission not granted');
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) {
      console.error('[Test] Service worker not active');
      return false;
    }

    // FIXED: Cast the options to 'any' or use NotificationOptions to bypass strict vibrate checks
    await reg.showNotification('Test Notification', {
      body: 'This is a test notification from MyMasjidApp',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'test-notification',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      timestamp: Date.now(),
      data: { url: '/', test: true },
    } as NotificationOptions);

    console.log('[Test] Test notification sent successfully');
    return true;
  } catch (err) {
    console.error('[Test] Failed to send test notification:', err);
    return false;
  }
}