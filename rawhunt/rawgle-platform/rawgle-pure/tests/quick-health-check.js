#!/usr/bin/env node
/**
 * Quick Health Check Script
 * A minimal script to quickly verify if critical issues have been resolved
 */

const API_BASE_URL = 'https://rawgle-api.findrawdogfood.workers.dev';

async function quickCheck() {
    console.log('🩺 Rawgle API Quick Health Check\n');
    
    try {
        // Basic connectivity
        console.log('1. Testing basic connectivity...');
        const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
        const healthData = await healthResponse.json();
        
        if (healthResponse.ok) {
            console.log(`   ✅ API is online (${healthData.version})`);
        } else {
            console.log(`   ❌ API health check failed: ${healthResponse.status}`);
            return;
        }

        // Database connectivity
        console.log('2. Testing database connectivity...');
        const dbResponse = await fetch(`${API_BASE_URL}/api/health/db`);
        const dbData = await dbResponse.json();
        
        if (dbResponse.ok && dbData.database === 'connected') {
            console.log('   ✅ Database is connected');
        } else {
            console.log(`   ❌ Database is disconnected (${dbResponse.status})`);
            console.log('   💡 Fix database connectivity before testing other features');
            return;
        }

        // Test registration (if database is working)
        console.log('3. Testing user registration...');
        const regResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `healthcheck-${Date.now()}@example.com`,
                password: 'TestPass123!'
            })
        });

        if (regResponse.status === 201) {
            console.log('   ✅ User registration is working');
        } else if (regResponse.status === 409) {
            console.log('   ✅ Registration endpoint working (user already exists)');
        } else {
            console.log(`   ❌ Registration failed: ${regResponse.status}`);
        }

        // Test authentication middleware
        console.log('4. Testing authentication middleware...');
        const authResponse = await fetch(`${API_BASE_URL}/api/paws/balance`);
        
        if (authResponse.status === 401) {
            console.log('   ✅ Authentication middleware is working correctly');
        } else {
            console.log(`   ❌ Auth middleware issue: Expected 401, got ${authResponse.status}`);
        }

        console.log('\n🎉 Quick health check complete!');
        console.log('\n💡 Run full test suite with: node tests/live-api-test.js');

    } catch (error) {
        console.log(`❌ Health check failed: ${error.message}`);
    }
}

// Run if called directly
if (require.main === module) {
    quickCheck();
}

module.exports = { quickCheck };