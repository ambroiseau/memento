// PWA utility functions
import { registerServiceWorker } from './sw-version';

let deferredPrompt: any = null;

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  console.log('PWA install prompt ready');
});

// Handle PWA install
export const installPWA = async () => {
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // Clear the deferredPrompt variable
    deferredPrompt = null;
    return outcome === 'accepted';
  }
  return false;
};

// Check if PWA is installable
export const isPWAInstallable = () => {
  return deferredPrompt !== null;
};

// Check if PWA is installed
export const isPWAInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Register for push notifications
export const registerForPushNotifications = async () => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY' // Replace with your VAPID key
        });
        
        console.log('Push notification subscription:', subscription);
        return subscription;
      }
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
    }
  }
  return null;
};

// Send push notification
export const sendPushNotification = async (title: string, body: string) => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [100, 50, 100]
    });
  }
};

// Check for app updates
export const checkForUpdates = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('New service worker activated - app updated!');
      // You can show a notification to the user here
      if (confirm('A new version is available! Reload to update?')) {
        window.location.reload();
      }
    });
  }
};

// Initialize PWA features
export const initializePWA = async () => {
  // Register service worker with version management
  await registerServiceWorker();
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('App is online');
    // Sync any pending data
  });
  
  window.addEventListener('offline', () => {
    console.log('App is offline');
    // Show offline indicator
  });
  
  // Listen for service worker update events
  window.addEventListener('sw-update-available', (event: any) => {
    console.log(`[PWA] Update available for version ${event.detail.version}`);
    // You can show a notification to the user here
  });
};
