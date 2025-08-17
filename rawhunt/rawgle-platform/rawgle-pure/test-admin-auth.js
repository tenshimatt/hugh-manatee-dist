// Test Admin Authentication 
// Run: node test-admin-auth.js

const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
const ADMIN_TOKEN = 'rawgle-admin-2025';

async function testAuth() {
    console.log('🔐 Testing Admin Authentication');
    console.log('===============================');
    console.log('API Base:', API_BASE);
    console.log('Admin Token:', ADMIN_TOKEN);
    console.log('');

    // Test 1: Basic health check
    try {
        console.log('1️⃣ Testing basic health endpoint...');
        const healthResponse = await fetch(`${API_BASE}/api/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health Status:', healthResponse.status, healthData.status);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        return;
    }

    // Test 2: Test management endpoint without token
    try {
        console.log('\n2️⃣ Testing dashboard without admin token...');
        const noAuthResponse = await fetch(`${API_BASE}/api/test-management/dashboard`);
        const noAuthData = await noAuthResponse.json();
        console.log('Response:', noAuthResponse.status, noAuthData);
        
        if (noAuthResponse.status === 403 && noAuthData.error === 'Unauthorized') {
            console.log('✅ Correctly blocking requests without admin token');
        } else {
            console.log('❌ Should have blocked request without admin token');
        }
    } catch (error) {
        console.log('❌ No auth test failed:', error.message);
    }

    // Test 3: Test with incorrect token
    try {
        console.log('\n3️⃣ Testing dashboard with wrong admin token...');
        const wrongAuthResponse = await fetch(`${API_BASE}/api/test-management/dashboard`, {
            headers: {
                'X-Admin-Token': 'wrong-token'
            }
        });
        const wrongAuthData = await wrongAuthResponse.json();
        console.log('Response:', wrongAuthResponse.status, wrongAuthData);
        
        if (wrongAuthResponse.status === 403) {
            console.log('✅ Correctly blocking requests with wrong token');
        } else {
            console.log('❌ Should have blocked request with wrong token');
        }
    } catch (error) {
        console.log('❌ Wrong auth test failed:', error.message);
    }

    // Test 4: Test with correct token
    try {
        console.log('\n4️⃣ Testing dashboard with correct admin token...');
        const correctAuthResponse = await fetch(`${API_BASE}/api/test-management/dashboard`, {
            headers: {
                'X-Admin-Token': ADMIN_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', correctAuthResponse.status);
        console.log('Response headers:');
        for (let [key, value] of correctAuthResponse.headers.entries()) {
            if (key.startsWith('access-control') || key === 'content-type') {
                console.log(`  ${key}: ${value}`);
            }
        }
        
        if (correctAuthResponse.ok) {
            const correctAuthData = await correctAuthResponse.json();
            console.log('✅ Dashboard data received successfully');
            console.log('Data overview:', {
                timeframe: correctAuthData.timeframe,
                totalRuns: correctAuthData.overview.totalRuns,
                successRate: correctAuthData.overview.successRate,
                trendsLength: correctAuthData.trends.length
            });
        } else {
            const errorData = await correctAuthResponse.json();
            console.log('❌ Dashboard request failed:', errorData);
        }
    } catch (error) {
        console.log('❌ Correct auth test failed:', error.message);
    }

    // Test 5: OPTIONS preflight request
    try {
        console.log('\n5️⃣ Testing CORS preflight request...');
        const preflightResponse = await fetch(`${API_BASE}/api/test-management/dashboard`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:8080',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'X-Admin-Token'
            }
        });
        
        console.log('Preflight status:', preflightResponse.status);
        console.log('Preflight headers:');
        for (let [key, value] of preflightResponse.headers.entries()) {
            if (key.startsWith('access-control')) {
                console.log(`  ${key}: ${value}`);
            }
        }
        
        if (preflightResponse.ok) {
            console.log('✅ CORS preflight working');
        } else {
            console.log('❌ CORS preflight failed');
        }
    } catch (error) {
        console.log('❌ CORS test failed:', error.message);
    }

    console.log('\n📋 Summary');
    console.log('==========');
    console.log('If test 4 passes, the dashboard should work with:');
    console.log(`Token: ${ADMIN_TOKEN}`);
    console.log('Make sure to enter this exact token in the browser dashboard');
}

testAuth().catch(console.error);