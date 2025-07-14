const CACHE_NAME = 'academgrad-v2';
const STATIC_CACHE = 'academgrad-static-v2';
const DYNAMIC_CACHE = 'academgrad-dynamic-v2';
const API_CACHE = 'academgrad-api-v2';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/schedule',
  '/tasks',
  '/subscription',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/offline',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/tasks',
  '/api/progress',
  '/api/subscription',
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(API_CACHE),
      caches.open(DYNAMIC_CACHE)
    ])
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - advanced caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle other requests
  event.respondWith(handleDynamicRequest(request));
});

// Static assets: Cache first strategy
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Static request failed:', error);
    return caches.match('/offline');
  }
}

// API requests: Network first with cache fallback
async function handleApiRequest(request) {
  try {
    const cache = await caches.open(API_CACHE);
    
    // Try network first
    try {
      const networkResponse = await fetch(request, {
        timeout: 5000
      });
      
      if (networkResponse.ok) {
        // Cache successful API responses
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (networkError) {
      // Fallback to cache
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw networkError;
    }
  } catch (error) {
    console.error('API request failed:', error);
    return new Response(JSON.stringify({ 
      error: 'Offline mode', 
      cached: false 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Dynamic requests: Network first, cache fallback
async function handleDynamicRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (networkError) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Return offline page for navigation requests
      if (request.mode === 'navigate') {
        return caches.match('/offline');
      }
      
      throw networkError;
    }
  } catch (error) {
    console.error('Dynamic request failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Push notification event
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Новое уведомление от AcademGrad',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    image: data.image,
    data: data.data,
    actions: [
      {
        action: 'open',
        title: 'Открыть',
        icon: '/icon-192.svg'
      },
      {
        action: 'dismiss',
        title: 'Закрыть',
        icon: '/icon-192.svg'
      }
    ],
    requireInteraction: true,
    tag: data.tag || 'default',
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'AcademGrad', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  console.log('Background sync triggered');
}

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Время решать задачи!',
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  };

  event.waitUntil(
    self.registration.showNotification('EGE Tutor', options)
  );
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});