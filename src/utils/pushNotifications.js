// Push notificatie utilities

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

// Check of push notifications ondersteund zijn
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Check huidige permissie status
export function getPermissionStatus() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'default', 'granted', 'denied'
}

// Service worker registreren
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers niet ondersteund');
  }

  const registration = await navigator.serviceWorker.register('/service-worker.js');
  await navigator.serviceWorker.ready;
  return registration;
}

// Push toestemming vragen en subscription aanmaken
export async function subscribeToPush(userId) {
  if (!isPushSupported()) {
    return { error: 'Push notificaties worden niet ondersteund op dit apparaat.' };
  }

  // Vraag toestemming
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { error: 'Notificaties zijn geweigerd. Pas dit aan in je browserinstellingen.' };
  }

  try {
    // Registreer service worker
    const registration = await registerServiceWorker();

    // Maak push subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Sla op in de database via API
    const response = await fetch('/api/save-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON(),
      }),
    });

    if (!response.ok) {
      throw new Error('Kon subscription niet opslaan');
    }

    return { error: null, subscription };
  } catch (err) {
    return { error: err.message };
  }
}

// Push subscription verwijderen
export async function unsubscribeFromPush(userId) {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
    }

    // Verwijder uit database
    await fetch('/api/save-subscription', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

// Check of gebruiker al gesubscribed is
export async function isSubscribed() {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

// Helper: VAPID key converteren
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
