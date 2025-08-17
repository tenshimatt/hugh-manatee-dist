/**
 * API Diagnostics Script
 * Deep dive into specific API issues to understand what's failing
 */

const API_BASE_URL = 'https://rawgle-api.findrawdogfood.workers.dev';

async function makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Rawgle-Diagnostics/1.0',
            ...options.headers
        },
        ...options
    };

    console.log(`\n🔍 Testing: ${config.method} ${url}`);
    
    try {
        const response = await fetch(url, config);
        const responseText = await response.text();
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
            console.log(`Response:`, JSON.stringify(responseData, null, 2));
        } catch {
            console.log(`Raw Response:`, responseText);
        }
        
        return { response, data: responseData || { rawResponse: responseText } };
    } catch (error) {
        console.log(`❌ Request failed:`, error.message);
        return { error };
    }
}

async function runDiagnostics() {
    console.log('🔧 Running API Diagnostics\n');
    
    // Test 1: Database Health Check
    console.log('=' .repeat(60));
    console.log('DIAGNOSTIC 1: Database Health Check');
    console.log('=' .repeat(60));
    await makeRequest('/api/health/db');
    
    // Test 2: Registration with detailed error
    console.log('=' .repeat(60));
    console.log('DIAGNOSTIC 2: User Registration');
    console.log('=' .repeat(60));
    await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            email: `test-${Date.now()}@example.com`,
            password: 'TestPass123!'
        })
    });
    
    // Test 3: Authentication with missing auth header
    console.log('=' .repeat(60));
    console.log('DIAGNOSTIC 3: Protected Endpoint without Auth');
    console.log('=' .repeat(60));
    await makeRequest('/api/paws/balance');
    
    // Test 4: Test a simpler endpoint to see overall API status
    console.log('=' .repeat(60));
    console.log('DIAGNOSTIC 4: Basic Health Check');
    console.log('=' .repeat(60));
    await makeRequest('/api/health');
    
    // Test 5: Test with invalid JSON
    console.log('=' .repeat(60));
    console.log('DIAGNOSTIC 5: Invalid JSON Body');
    console.log('=' .repeat(60));
    await makeRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
    });
    
    // Test 6: Check if API exists at all with a 404 test
    console.log('=' .repeat(60));
    console.log('DIAGNOSTIC 6: Non-existent Endpoint');
    console.log('=' .repeat(60));
    await makeRequest('/api/nonexistent');
    
    console.log('\n✅ Diagnostics complete');
}

// Run diagnostics
runDiagnostics().catch(console.error);