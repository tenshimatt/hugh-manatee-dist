// Test Script 018: Session Token Validation
// Purpose: Test creation and validation of session tokens
// Expected: Valid session token should authenticate requests

export default {
  id: '018',
  name: 'Session Token Validation',
  description: 'Tests creation and validation of session tokens for authenticated requests',
  category: 'Authentication',
  priority: 'Critical',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `session-test-${Date.now()}@rawgle.com`;
      const testPassword = 'SessionTest123!';
      
      // Step 1: Register and login to get session token
      results.push({
        step: 1,
        description: 'Creating user and obtaining session token',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });
      
      if (registerResponse.status === 201) {
        const registerData = await registerResponse.json();
        const sessionToken = registerData.sessionToken;
        
        results[0].status = 'passed';
        results[0].details = `Session token obtained: ${sessionToken.substring(0, 10)}...`;
        
        // Step 2: Validate session token
        results.push({
          step: 2,
          description: 'Validating session token',
          status: 'running'
        });
        
        const validateResponse = await fetch(`${API_BASE}/api/auth/validate`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        
        if (validateResponse.status === 200) {
          const validateData = await validateResponse.json();
          results[1].status = 'passed';
          results[1].details = `Session validation successful: ${validateData.email}`;
          
          // Step 3: Test invalid session token
          results.push({
            step: 3,
            description: 'Testing invalid session token rejection',
            status: 'running'
          });
          
          const invalidResponse = await fetch(`${API_BASE}/api/auth/validate`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer invalid-token-12345`
            }
          });
          
          if (invalidResponse.status === 401) {
            const errorData = await invalidResponse.json();
            results[2].status = 'passed';
            results[2].details = `Invalid token correctly rejected: ${errorData.error}`;
          } else {
            results[2].status = 'failed';
            results[2].details = `Expected HTTP 401, got ${invalidResponse.status}`;
          }
          
          // Step 4: Test missing authorization header
          results.push({
            step: 4,
            description: 'Testing missing authorization header',
            status: 'running'
          });
          
          const noAuthResponse = await fetch(`${API_BASE}/api/auth/validate`, {
            method: 'GET'
          });
          
          if (noAuthResponse.status === 401) {
            const errorData = await noAuthResponse.json();
            results[3].status = 'passed';
            results[3].details = `Missing auth header correctly rejected: ${errorData.error}`;
          } else {
            results[3].status = 'failed';
            results[3].details = `Expected HTTP 401, got ${noAuthResponse.status}`;
          }
          
        } else {
          const errorData = await validateResponse.json();
          results[1].status = 'failed';
          results[1].details = `Session validation failed: ${errorData.error}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Session token test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};