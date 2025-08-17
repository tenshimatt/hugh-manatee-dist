// Test Script 015: User Login - Valid Credentials
// Purpose: Test user login with correct email and password
// Expected: HTTP 200 with session token and user data

export default {
  id: '015',
  name: 'User Login - Valid Credentials',
  description: 'Tests user login with valid email and password credentials',
  category: 'Authentication',
  priority: 'Critical',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `login-test-${Date.now()}@rawgle.com`;
      const testPassword = 'LoginTest123!';
      
      // Step 1: Register test user first
      results.push({
        step: 1,
        description: 'Creating test user for login test',
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
        results[0].status = 'passed';
        results[0].details = 'Test user created successfully';
        
        // Step 2: Attempt login with valid credentials
        results.push({
          step: 2,
          description: 'Logging in with valid credentials',
          status: 'running'
        });
        
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            password: testPassword
          })
        });
        
        if (loginResponse.status === 200) {
          const loginData = await loginResponse.json();
          results[1].status = 'passed';
          results[1].details = `Login successful for ${loginData.email}`;
          
          // Step 3: Validate login response structure
          results.push({
            step: 3,
            description: 'Validating login response structure',
            status: loginData.userId && loginData.sessionToken && loginData.pawsBalance !== undefined ? 'passed' : 'failed',
            details: `HasUserId: ${!!loginData.userId}, HasSession: ${!!loginData.sessionToken}, Balance: ${loginData.pawsBalance}`
          });
          
          // Step 4: Verify session token format
          results.push({
            step: 4,
            description: 'Verifying session token format',
            status: loginData.sessionToken && loginData.sessionToken.length > 20 ? 'passed' : 'failed',
            details: `Session token length: ${loginData.sessionToken ? loginData.sessionToken.length : 0}`
          });
          
        } else {
          const errorData = await loginResponse.json();
          results[1].status = 'failed';
          results[1].details = `Login failed: HTTP ${loginResponse.status} - ${errorData.error}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Login test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};