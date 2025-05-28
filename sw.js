const CACHE_NAME = 'agtroute-v1.0.0';
const STATIC_CACHE = 'agtroute-static-v1';
const DYNAMIC_CACHE = 'agtroute-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/main.css',
  './assets/css/mobile.css',
  './assets/css/components.css',
  './assets/css/animations.css',
  './assets/css/navigationUI.css',
  './assets/js/app.js',
  './assets/js/mapManager.js',
  './assets/js/dataManager.js',
  './assets/js/routeManager.js',
  './assets/js/utils.js',
  './assets/js/googleMapsIntegration.js',
  './assets/js/navigationUI.js',
  './assets/data/clients.json',
  './assets/data/routes.json',
  './assets/data/clusters.json'
];

// Essential Google Maps scripts and tiles to cache
const MAPS_CACHE_PATTERNS = [
  /^https:\/\/maps\.googleapis\.com\/maps\/api\/js/,
  /^https:\/\/maps\.gstatic\.com\//,
  /^https:\/\/maps\.google\.com\/maps/
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Static files cached successfully');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Failed to cache static files:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Old caches cleaned up');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip cross-origin requests and non-GET requests
  if (url.origin !== location.origin && !isMapsRequest(request.url)) {
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    handleFetchRequest(request)
  );
});

// Handle different types of fetch requests
async function handleFetchRequest(request) {
  const url = request.url;
  
  try {
    // Static files - cache first strategy
    if (STATIC_FILES.some(file => url.includes(file))) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // Google Maps requests - network first with cache fallback
    if (isMapsRequest(url)) {
      return await networkFirstWithCache(request, DYNAMIC_CACHE);
    }
    
    // API calls and dynamic content - network first
    if (url.includes('/api/') || url.includes('googleapis.com')) {
      return await networkFirst(request, DYNAMIC_CACHE);
    }
    
    // Default: network first with cache fallback
    return await networkFirstWithCache(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return await caches.match('/index.html');
    }
    
    // Return empty response for other requests
    return new Response('', { status: 204 });
  }
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName);
    await cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Network first with cache fallback
async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && networkResponse.status < 400) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    return cachedResponse || networkResponse;
    
  } catch (error) {
    // Network completely failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Check if request is for Google Maps
function isMapsRequest(url) {
  return MAPS_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// Background sync for offline data
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'route-progress-sync') {
    event.waitUntil(syncRouteProgress());
  }
});

// Sync route progress when back online
async function syncRouteProgress() {
  try {
    console.log('[SW] Syncing route progress...');
    
    // Get pending data from IndexedDB or localStorage
    const pendingData = await getPendingData();
    
    if (pendingData && pendingData.length > 0) {
      // Send data to server or cloud storage
      await sendProgressData(pendingData);
      
      // Clear pending data after successful sync
      await clearPendingData();
      
      console.log('[SW] Route progress synced successfully');
    }
  } catch (error) {
    console.error('[SW] Failed to sync route progress:', error);
    throw error;
  }
}

// Mock functions for data sync (implement based on your storage solution)
async function getPendingData() {
  // Implement: retrieve pending progress data from local storage
  return [];
}

async function sendProgressData(data) {
  // Implement: send data to your backend or cloud storage
  console.log('[SW] Sending progress data:', data);
}

async function clearPendingData() {
  // Implement: clear pending data after successful sync
  console.log('[SW] Pending data cleared');
}

// Push notification handling (optional)
self.addEventListener('push', event => {
  console.log('[SW] Push received:', event.data?.text());
  
  const options = {
    body: event.data?.text() || 'עדכון חדש במערכת המסלולים',
    icon: './assets/icons/icon-192x192.png',
    badge: './assets/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'route-update',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'צפה במפה',
        icon: '/assets/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'בטל',
        icon: '/assets/icons/action-dismiss.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('AgtRoute', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Service Worker registered successfully');