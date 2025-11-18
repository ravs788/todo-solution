import { useState, useEffect, useCallback } from 'react';
import pushService from '../services/pushService';

const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize push notifications on mount
  useEffect(() => {
    const initPushNotifications = async () => {
      setIsSupported(pushService.isSupported);

      if (!pushService.isSupported) {
        return;
      }

      try {
        // Initialize service worker
        const initialized = await pushService.init();
        if (!initialized) {
          setError('Failed to initialize push notifications');
          return;
        }

        // Check current subscription status
        setIsSubscribed(pushService.isSubscribed());
        setPermission(pushService.getPermissionStatus());

      } catch (err) {
        console.error('Error initializing push notifications:', err);
        setError(err.message);
      }
    };

    initPushNotifications();
  }, []);

  // Enable push notifications
  const enableNotifications = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported in this browser');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission if not granted
      if (permission !== 'granted') {
        await pushService.requestPermission();
        setPermission('granted');
      }

      // Get VAPID public key and subscribe
      const vapidKey = await pushService.getVapidPublicKey();
      await pushService.subscribe(vapidKey);

      // Register with backend
      await pushService.registerWithBackend();

      setIsSubscribed(true);
      console.log('Push notifications enabled successfully');

    } catch (err) {
      console.error('Failed to enable push notifications:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission]);

  // Disable push notifications
  const disableNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Unregister from backend first
      await pushService.unregisterFromBackend();

      // Unsubscribe from push manager
      await pushService.unsubscribe();

      setIsSubscribed(false);
      console.log('Push notifications disabled successfully');

    } catch (err) {
      console.error('Failed to disable push notifications:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check subscription status
  const checkStatus = useCallback(async () => {
    try {
      const subscription = pushService.getSubscription();
      setIsSubscribed(subscription !== null);
      setPermission(pushService.getPermissionStatus());
    } catch (err) {
      console.error('Error checking subscription status:', err);
      setError(err.message);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    enableNotifications,
    disableNotifications,
    checkStatus
  };
};

export default usePushNotifications;
