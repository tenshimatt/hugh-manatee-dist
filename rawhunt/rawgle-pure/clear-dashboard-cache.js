// Clear Dashboard Cache - Run this in browser console if needed

console.log('🧹 Clearing Rawgle Dashboard Cache...');

// Clear localStorage admin token
localStorage.removeItem('admin-token');
console.log('✅ Cleared admin token from localStorage');

// Clear any sessionStorage
sessionStorage.clear();
console.log('✅ Cleared sessionStorage');

// Clear any cached API responses
if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
        return Promise.all(
            cacheNames.map(function(cacheName) {
                console.log('🗑️  Deleting cache:', cacheName);
                return caches.delete(cacheName);
            })
        );
    }).then(function() {
        console.log('✅ All caches cleared');
    });
}

console.log('🔄 Please refresh the page and enter admin token: rawgle-admin-2025');
console.log('🔗 Dashboard URL: http://localhost:8080/test-management-ui.html');