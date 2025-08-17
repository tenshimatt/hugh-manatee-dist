// Enhanced PWA Service Worker for GoHunta
// Optimized for offline-first field usage

const CACHE_NAME = 'gohunta-v2.0.0';
const OFFLINE_URL = '/offline.html';

// Critical resources for offline functionality
const CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/assets/index.js',
  '/assets/index.css',
  // Core pages that should work offline
  '/dashboard',
  '/packs',
  '/routes',
  '/training',
  '/gear',
  '/ethics',
  '/bragboard'
];

// Runtime caching strategies
const RUNTIME_CACHE = {
  // API responses cached for 5 minutes
  api: {
    pattern: /^https:\/\/.*\.workers\.dev\/api\//,
    strategy: 'networkFirst',
    maxAge: 300000, // 5 minutes
    maxEntries: 100
  },
  // Images cached for 1 week
  images: {
    pattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    strategy: 'cacheFirst',
    maxAge: 604800000, // 1 week
    maxEntries: 200
  },
  // Fonts cached indefinitely
  fonts: {
    pattern: /\.(?:woff|woff2|ttf|eot)$/,
    strategy: 'cacheFirst',
    maxAge: 31536000000, // 1 year
    maxEntries: 30
  }
};

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Cache installation failed:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle API requests
  if (RUNTIME_CACHE.api.pattern.test(request.url)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle image requests
  if (RUNTIME_CACHE.images.pattern.test(request.url)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle font requests
  if (RUNTIME_CACHE.fonts.pattern.test(request.url)) {
    event.respondWith(handleFontRequest(request));
    return;
  }

  // Default caching strategy
  event.respondWith(handleDefaultRequest(request));
});

// Navigation request handler
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Ultimate fallback to offline page
    const offlineResponse = await caches.match(OFFLINE_URL);
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

// API request handler - Network first with offline support
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Add header to indicate cached response
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'sw-cache');
      return response;
    }
    
    // Return offline indicator for failed API calls
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This data is not available offline',
        offline: true 
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Image request handler - Cache first
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return placeholder image for failed image requests
    return new Response(
      '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">Image unavailable offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Font request handler - Cache first
async function handleFontRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Fonts will fallback to system fonts
    return new Response('', { status: 404 });
  }
}

// Default request handler
async function handleDefaultRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Not found', { status: 404 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'hunt-log-sync') {
    event.waitUntil(syncHuntLogs());
  } else if (event.tag === 'photo-upload-sync') {
    event.waitUntil(syncPhotoUploads());
  } else if (event.tag === 'training-log-sync') {
    event.waitUntil(syncTrainingLogs());
  }
});

// Sync hunt logs when back online
async function syncHuntLogs() {
  try {
    const db = await openDB();
    const pendingLogs = await db.getAll('pendingHuntLogs');
    
    for (const log of pendingLogs) {
      try {
        const response = await fetch('/api/hunt-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(log.data)
        });
        
        if (response.ok) {
          await db.delete('pendingHuntLogs', log.id);
          console.log('[SW] Hunt log synced:', log.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync hunt log:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Hunt log sync failed:', error);
  }
}

// Sync photo uploads when back online
async function syncPhotoUploads() {
  try {
    const db = await openDB();
    const pendingPhotos = await db.getAll('pendingPhotos');
    
    for (const photo of pendingPhotos) {
      try {
        const formData = new FormData();
        formData.append('photo', photo.blob);
        formData.append('metadata', JSON.stringify(photo.metadata));
        
        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          await db.delete('pendingPhotos', photo.id);
          console.log('[SW] Photo synced:', photo.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync photo:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Photo sync failed:', error);
  }
}

// Sync training logs when back online
async function syncTrainingLogs() {
  try {
    const db = await openDB();
    const pendingLogs = await db.getAll('pendingTrainingLogs');
    
    for (const log of pendingLogs) {
      try {
        const response = await fetch('/api/training-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(log.data)
        });
        
        if (response.ok) {
          await db.delete('pendingTrainingLogs', log.id);
          console.log('[SW] Training log synced:', log.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync training log:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Training log sync failed:', error);
  }
}

// IndexedDB helper for offline storage
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HuntaOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores for offline data
      if (!db.objectStoreNames.contains('pendingHuntLogs')) {
        db.createObjectStore('pendingHuntLogs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingPhotos')) {
        db.createObjectStore('pendingPhotos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingTrainingLogs')) {
        db.createObjectStore('pendingTrainingLogs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cachedData')) {
        db.createObjectStore('cachedData', { keyPath: 'key' });
      }
    };
  });
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_HUNT_LOG':
      cacheHuntLogOffline(data);
      break;
      
    case 'CACHE_PHOTO':
      cachePhotoOffline(data);
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
  }
});

// Cache hunt log for offline sync
async function cacheHuntLogOffline(logData) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['pendingHuntLogs'], 'readwrite');
    const store = transaction.objectStore('pendingHuntLogs');
    
    await store.put({
      id: Date.now().toString(),
      data: logData,
      timestamp: new Date().toISOString()
    });
    
    // Register for background sync
    await self.registration.sync.register('hunt-log-sync');
  } catch (error) {
    console.error('[SW] Failed to cache hunt log offline:', error);
  }
}

// Cache photo for offline sync
async function cachePhotoOffline(photoData) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['pendingPhotos'], 'readwrite');
    const store = transaction.objectStore('pendingPhotos');
    
    await store.put({
      id: Date.now().toString(),
      blob: photoData.blob,
      metadata: photoData.metadata,
      timestamp: new Date().toISOString()
    });
    
    // Register for background sync
    await self.registration.sync.register('photo-upload-sync');
  } catch (error) {
    console.error('[SW] Failed to cache photo offline:', error);
  }
}

// Get cache status for UI
async function getCacheStatus() {
  try {
    const db = await openDB();
    const pendingHuntLogs = await db.getAll('pendingHuntLogs');
    const pendingPhotos = await db.getAll('pendingPhotos');
    const pendingTrainingLogs = await db.getAll('pendingTrainingLogs');
    
    return {
      pendingHuntLogs: pendingHuntLogs.length,
      pendingPhotos: pendingPhotos.length,
      pendingTrainingLogs: pendingTrainingLogs.length,
      lastSync: new Date().toISOString()
    };
  } catch (error) {
    console.error('[SW] Failed to get cache status:', error);
    return {
      pendingHuntLogs: 0,
      pendingPhotos: 0,
      pendingTrainingLogs: 0,
      lastSync: null
    };
  }
}