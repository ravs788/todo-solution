// Push Notification Service for frontend
class PushNotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.isSupported = this.checkSupport();
  }

  // Check if push notifications are supported
  checkSupport() {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  // Initialize service worker and push manager
  async init() {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully');

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      // Check for existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();

      if (this.subscription) {
        console.log('Existing push subscription found');
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Request notification permission from user
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    return permission;
  }

  // Subscribe to push notifications
  async subscribe(vapidPublicKey) {
    if (!this.registration) {
      throw new Error('Service worker not initialized');
    }

    try {
      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlB64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      console.log('Push subscription created:', this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    if (!this.subscription) {
      return true;
    }

    try {
      const result = await this.subscription.unsubscribe();
      this.subscription = null;
      console.log('Successfully unsubscribed from push notifications');
      return result;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  // Get current subscription
  getSubscription() {
    return this.subscription;
  }

  // Check if user is subscribed
  isSubscribed() {
    return this.subscription !== null;
  }

  // Get notification permission status
  getPermissionStatus() {
    return Notification.permission;
  }

  // Send subscription to backend
  async registerWithBackend() {
    if (!this.subscription) {
      throw new Error('No active subscription');
    }

    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.subscription.toJSON())
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to register subscription');
      }

      const result = await response.json();
      console.log('Subscription registered with backend:', result);
      return result;
    } catch (error) {
      console.error('Failed to register subscription with backend:', error);
      throw error;
    }
  }

  // Remove subscription from backend
  async unregisterFromBackend() {
    if (!this.subscription) {
      return;
    }

    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: this.subscription.endpoint
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.warn('Failed to unregister from backend:', error.error);
      } else {
        console.log('Subscription unregistered from backend');
      }
    } catch (error) {
      console.error('Failed to unregister from backend:', error);
    }
  }

  // Utility function to convert VAPID key
  urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get VAPID public key from backend (for development, we'll use a hardcoded key)
  async getVapidPublicKey() {
    // In production, you might want to fetch this from the backend
    // For now, we'll use the development key from application.properties
    return 'BKxY5F8q6tK7q6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y6y';
  }
}

// Export singleton instance
export default new PushNotificationService();
