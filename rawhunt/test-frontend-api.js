#!/usr/bin/env node

/**
 * Test API calls exactly like the frontend would make them
 */

import fetch from 'node-fetch';

const FRONTEND_URL = 'https://2c4665bc.rawgle-frontend.pages.dev';
const BACKEND_URL = 'https://rawgle-backend-nodatabase.findrawdogfood.workers.dev';

async function testFrontendAPI() {
  console.log('🧪 Testing Frontend-to-Backend API Calls');
  console.log('=========================================');
  
  try {
    // Test 1: Direct API call with CORS headers
    console.log('\n1. Testing direct API call with Origin header...');
    const directResponse = await fetch(`${BACKEND_URL}/api/suppliers`, {
      method: 'GET',
      headers: {
        'Origin': FRONTEND_URL,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('   Status:', directResponse.status);
    console.log('   CORS Headers:');
    console.log('   - Allow-Origin:', directResponse.headers.get('Access-Control-Allow-Origin'));
    console.log('   - Allow-Methods:', directResponse.headers.get('Access-Control-Allow-Methods'));
    console.log('   - Allow-Headers:', directResponse.headers.get('Access-Control-Allow-Headers'));
    
    if (directResponse.ok) {
      const data = await directResponse.json();
      console.log('   ✅ SUCCESS: Got', data.data?.suppliers?.length || 0, 'suppliers');
    } else {
      console.log('   ❌ FAILED: Status', directResponse.status);
    }
    
    // Test 2: CORS Preflight
    console.log('\n2. Testing CORS preflight request...');
    const preflightResponse = await fetch(`${BACKEND_URL}/api/suppliers`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('   Status:', preflightResponse.status);
    console.log('   CORS Headers:');
    console.log('   - Allow-Origin:', preflightResponse.headers.get('Access-Control-Allow-Origin'));
    console.log('   - Allow-Methods:', preflightResponse.headers.get('Access-Control-Allow-Methods'));
    
    if (preflightResponse.status === 204 || preflightResponse.status === 200) {
      console.log('   ✅ SUCCESS: CORS preflight passed');
    } else {
      const errorText = await preflightResponse.text();
      console.log('   ❌ FAILED: CORS preflight rejected -', errorText);
    }
    
    // Test 3: Simulate what axios would do
    console.log('\n3. Testing axios-style request...');
    try {
      const axiosStyleResponse = await fetch(`${BACKEND_URL}/api/suppliers`, {
        method: 'GET',
        headers: {
          'Origin': FRONTEND_URL,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (similar to browser)',
          'Referer': FRONTEND_URL
        }
      });
      
      console.log('   Status:', axiosStyleResponse.status);
      
      if (axiosStyleResponse.ok) {
        const data = await axiosStyleResponse.json();
        console.log('   ✅ SUCCESS: Axios-style request worked');
        console.log('   Data received:', !!data.success);
      } else {
        console.log('   ❌ FAILED: Axios-style request failed');
      }
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
    }
    
    // Test 4: Check if the issue is specific to the frontend URL
    console.log('\n4. Testing with localhost origin...');
    const localhostResponse = await fetch(`${BACKEND_URL}/api/suppliers`, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5173',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', localhostResponse.status);
    console.log('   Allow-Origin:', localhostResponse.headers.get('Access-Control-Allow-Origin'));
    
    if (localhostResponse.ok) {
      console.log('   ✅ SUCCESS: localhost origin works');
    } else {
      console.log('   ❌ FAILED: localhost origin failed');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testFrontendAPI();