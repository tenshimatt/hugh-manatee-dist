// Service worker unregistration script
// This removes any existing service worker registrations

self.addEventListener('install', function(event) {
  // Skip waiting to become active immediately
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    // Clear all caches
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      // Unregister this service worker
      return self.registration.unregister();
    }).then(function() {
      // Force reload all clients
      return clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
          client.navigate(client.url);
        });
      });
    })
  );
});

// Don't intercept any fetch requests - let them go through normally
self.addEventListener('fetch', function(event) {
  // Do nothing - let requests go through to the network
});