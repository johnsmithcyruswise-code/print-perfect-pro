// PWA Service Worker Registration & Offline Support
declare global {
  interface Window {
    deferredPrompt?: any;
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Workers not supported");
    return undefined;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/sw.js",
      { scope: "/" }
    );
    console.log("Service Worker registered:", registration);

    // Check for updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          // New service worker ready
          console.log("New service worker ready to activate");
        }
      });
    });

    // Check for updates every 6 hours
    setInterval(() => {
      registration.update();
    }, 6 * 60 * 60 * 1000);

    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
  }
}

export function setupOfflineDetection(
  onOnline: () => void,
  onOffline: () => void
) {
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}

export function isOnline(): boolean {
  return navigator.onLine;
}

// Request install prompt
export function setupInstallPrompt(
  onPromptAvailable: (prompt: any) => void
) {
  let deferredPrompt: any;

  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    // Stash the event for later use
    deferredPrompt = e;
    onPromptAvailable(deferredPrompt);
  });

  window.addEventListener("appinstalled", () => {
    console.log("PWA was installed");
    deferredPrompt = null;
  });

  return {
    prompt: async () => {
      if (!deferredPrompt) return false;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      return outcome === "accepted";
    },
    canPrompt: () => !!deferredPrompt,
  };
}

// Web Push Notification Setup
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    return subscription;
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    return null;
  }
}

export async function sendPushSubscriptionToServer(
  subscription: PushSubscription,
  userId: string
): Promise<boolean> {
  try {
    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to send subscription to server:", error);
    return false;
  }
}

// Helper: Convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Cache management
export async function getCacheSize(): Promise<number> {
  if (!("storage" in navigator) || !("estimate" in navigator.storage)) {
    return 0;
  }

  const { usage } = await navigator.storage.estimate();
  return usage || 0;
}

export async function clearCache(): Promise<boolean> {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((name) => caches.delete(name))
    );
    return true;
  } catch (error) {
    console.error("Cache clear failed:", error);
    return false;
  }
}
