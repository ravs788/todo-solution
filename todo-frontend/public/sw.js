// Service Worker for Push Notifications
/* eslint-disable no-restricted-globals, no-undef */
const CACHE_NAME = 'todo-app-v1';

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', event => {
  console.log('Push received:', event);

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body || 'You have a new reminder',
    icon: data.icon || '/logo192.png',
    badge: data.badge || '/logo192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Todo'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Todo Reminder', options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', event => {
  console.log('Notification click received:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    // Just dismiss, no navigation
    return;
  }

  // Default action or 'view' action - navigate to the app
  const urlToOpen = new URL('/', self.location.origin).href;

  event.waitUntil(
    // eslint-disable-next-line no-undef
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // If not, open a new window/tab with the target URL
      // eslint-disable-next-line no-undef
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', event => {
  console.log('Service Worker message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
