// Test Script 003: Authentication System
// Purpose: Test admin token authentication and authorization
// Expected: Proper rejection of unauthorized requests, acceptance of valid tokens

export default {
  id: '003',
  name: 'Authentication System',
  description: 'Tests admin token authentication and validates security measures',
  category: 'Security',
  priority: 'Critical',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    const VALID_TOKEN = 'rawgle-admin-2025';
    const INVALID_TOKEN = 'invalid-token-123';
    
    try {
      // Step 1: Test without authentication token
      results.push({
        step: 1,
        description: 'Testing request without admin token (should be rejected)',
        status: 'running'
      });
      
      const noAuthResponse = await fetch(`${API_BASE}/api/test-management/dashboard?auth-test=no-token&timestamp=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      if (noAuthResponse.status === 403) {
        results[0].status = 'passed';
        results[0].details = 'Correctly rejected request without admin token (403 Forbidden)';
      } else {
        results[0].status = 'failed';
        results[0].details = `Expected 403, got ${noAuthResponse.status}. Security vulnerability detected!`;
      }
      
      // Step 2: Test with invalid token
      results.push({
        step: 2,
        description: 'Testing request with invalid admin token (should be rejected)',
        status: 'running'
      });
      
      const invalidAuthResponse = await fetch(`${API_BASE}/api/test-management/dashboard?auth-test=invalid-token&timestamp=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': INVALID_TOKEN
        },
        cache: 'no-store'
      });
      
      if (invalidAuthResponse.status === 403) {
        results[1].status = 'passed';
        results[1].details = 'Correctly rejected request with invalid admin token (403 Forbidden)';
      } else {
        results[1].status = 'failed';
        results[1].details = `Expected 403, got ${invalidAuthResponse.status}. Authentication bypass detected!`;
      }
      
      // Step 3: Test with valid token
      results.push({
        step: 3,
        description: 'Testing request with valid admin token (should be accepted)',
        status: 'running'
      });
      
      const validAuthResponse = await fetch(`${API_BASE}/api/test-management/dashboard?auth-test=valid-token&timestamp=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': VALID_TOKEN
        },
        cache: 'no-store'
      });
      
      if (validAuthResponse.ok) {
        const data = await validAuthResponse.json();
        results[2].status = 'passed';
        results[2].details = `Authentication successful: ${validAuthResponse.status}, received dashboard data`;
      } else {
        results[2].status = 'failed';
        results[2].details = `Valid token rejected: ${validAuthResponse.status} ${validAuthResponse.statusText}`;
      }
      
      // Step 4: Test token case sensitivity
      results.push({
        step: 4,
        description: 'Testing token case sensitivity',
        status: 'running'
      });
      
      const caseTestResponse = await fetch(`${API_BASE}/api/test-management/dashboard?auth-test=case-test&timestamp=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': VALID_TOKEN.toUpperCase()
        },
        cache: 'no-store'
      });
      
      if (caseTestResponse.status === 403) {
        results[3].status = 'passed';
        results[3].details = 'Token is case-sensitive (security best practice)';
      } else {
        results[3].status = 'warning';
        results[3].details = 'Token appears to be case-insensitive';
      }
      
    } catch (error) {
      results[results.length - 1].status = 'failed';
      results[results.length - 1].details = `Authentication test error: ${error.message}`;
      
      // Add network error analysis
      if (error.message.includes('Failed to fetch')) {
        results.push({
          step: results.length + 1,
          description: 'Network Error Analysis',
          status: 'failed',
          details: 'Cannot complete authentication tests due to network connectivity issues'
        });
      }
    }
    
    return results;
  }
};