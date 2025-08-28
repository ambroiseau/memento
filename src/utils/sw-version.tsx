// Service Worker Version Management
// This utility helps manage service worker versions and updates

export const SW_VERSION = '1.0.2';

// Version history for cache management
export const VERSION_HISTORY = {
  '1.0.0': '2024-01-01',
  '1.0.1': '2024-01-15',
  '1.0.2': '2025-08-28'
};

// Check if service worker is supported
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

// Register service worker with version management
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) {
    console.warn('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none' // Always check for updates
    });

    console.log(`[SW] Service Worker registered with version ${SW_VERSION}`);

    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is installed and ready
            showUpdateNotification();
          }
        });
      }
    });

    // Handle service worker controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] New service worker activated');
      // Optionally reload the page to use the new service worker
      // window.location.reload();
    });

    return registration;
  } catch (error) {
    console.error('[SW] Service Worker registration failed:', error);
    return null;
  }
};

// Show update notification to user
const showUpdateNotification = () => {
  // You can customize this to show a notification in your app
  console.log('[SW] New version available');
  
  // Example: Show a toast notification
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('sw-update-available', {
      detail: { version: SW_VERSION }
    });
    window.dispatchEvent(event);
  }
};

// Force service worker update
export const forceUpdate = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) return;

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.update();
    console.log('[SW] Forced update check');
  }
};

// Unregister service worker (for testing)
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!isServiceWorkerSupported()) return false;

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.unregister();
    console.log('[SW] Service Worker unregistered');
    return true;
  }
  return false;
};

// Clear all caches
export const clearAllCaches = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) return;

  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('[SW] All caches cleared');
};

// Get cache information
export const getCacheInfo = async (): Promise<{
  cacheNames: string[];
  totalSize: number;
}> => {
  if (!isServiceWorkerSupported()) {
    return { cacheNames: [], totalSize: 0 };
  }

  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    totalSize += keys.length;
  }

  return { cacheNames, totalSize };
};
