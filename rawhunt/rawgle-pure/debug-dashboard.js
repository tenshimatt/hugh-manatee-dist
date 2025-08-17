// Debug Dashboard Connection - Run this in browser console
// Copy and paste the output to share with Claude

console.log('🔍 RAWGLE DASHBOARD DEBUG REPORT');
console.log('================================');
console.log('Timestamp:', new Date().toISOString());
console.log('');

// 1. Check current page and API configuration
console.log('📍 CURRENT CONFIGURATION:');
console.log('Current URL:', window.location.href);
console.log('API_BASE should be:', 'https://rawgle-api.findrawdogfood.workers.dev');

// Check if API_BASE is defined
if (typeof API_BASE !== 'undefined') {
    console.log('✅ API_BASE defined as:', API_BASE);
} else {
    console.log('❌ API_BASE not defined');
}

// Check admin token
const storedToken = localStorage.getItem('admin-token');
console.log('Admin token in storage:', storedToken ? '✅ Present' : '❌ Missing');
console.log('');

// 2. Test direct API connection
console.log('🌐 TESTING LIVE API CONNECTION:');

// Test basic health endpoint
async function testAPIConnection() {
    try {
        console.log('Testing health endpoint...');
        const healthResponse = await fetch('https://rawgle-api.findrawdogfood.workers.dev/api/health');
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthResponse.status, healthData);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
    }

    // Test dashboard endpoint with admin token
    try {
        console.log('Testing dashboard endpoint with admin token...');
        const dashResponse = await fetch('https://rawgle-api.findrawdogfood.workers.dev/api/test-management/dashboard', {
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Token': 'rawgle-admin-2025'
            }
        });
        const dashData = await dashResponse.json();
        console.log('✅ Dashboard API:', dashResponse.status, dashData);
    } catch (error) {
        console.log('❌ Dashboard API failed:', error.message);
        console.log('Error details:', error);
    }

    // Test CORS preflight
    try {
        console.log('Testing CORS preflight...');
        const corsResponse = await fetch('https://rawgle-api.findrawdogfood.workers.dev/api/test-management/dashboard', {
            method: 'OPTIONS',
            headers: {
                'Origin': window.location.origin,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'X-Admin-Token'
            }
        });
        console.log('✅ CORS preflight:', corsResponse.status);
        
        // Log response headers
        console.log('Response headers:');
        for (let [key, value] of corsResponse.headers.entries()) {
            if (key.startsWith('access-control')) {
                console.log(`  ${key}: ${value}`);
            }
        }
    } catch (error) {
        console.log('❌ CORS preflight failed:', error.message);
    }
}

// 3. Check browser network logs
console.log('');
console.log('📊 BROWSER ENVIRONMENT:');
console.log('User Agent:', navigator.userAgent);
console.log('Online status:', navigator.onLine);
console.log('Current origin:', window.location.origin);
console.log('Protocol:', window.location.protocol);

// 4. Check for JavaScript errors
console.log('');
console.log('🚨 CHECKING FOR ERRORS:');
console.log('Check Network tab in DevTools for failed requests');
console.log('Check Console tab for any red error messages');

// Run the API tests
console.log('');
console.log('🏃 RUNNING CONNECTION TESTS...');
testAPIConnection();

console.log('');
console.log('📋 INSTRUCTIONS:');
console.log('1. Copy ALL output above');
console.log('2. Open Network tab in DevTools');
console.log('3. Try to load dashboard data');
console.log('4. Look for failed requests (red entries)');
console.log('5. Share both console output AND failed network requests');
console.log('');
console.log('🔧 If you see network errors, right-click the failed request');
console.log('   and select "Copy as cURL" to share the exact request.');