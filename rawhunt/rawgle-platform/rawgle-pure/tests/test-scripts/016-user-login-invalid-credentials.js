// Test Script 016: User Login - Invalid Credentials
// Purpose: Test user login rejection with incorrect credentials
// Expected: HTTP 401 error for invalid credentials

export default {
  id: '016',
  name: 'User Login - Invalid Credentials',
  description: 'Tests user login rejection with incorrect email or password',
  category: 'Authentication',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `invalid-test-${Date.now()}@rawgle.com`;
      const correctPassword = 'CorrectPass123!';
      
      // Step 1: Register test user first
      results.push({
        step: 1,
        description: 'Creating test user for invalid login test',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: correctPassword
        })
      });
      
      if (registerResponse.status === 201) {
        results[0].status = 'passed';
        results[0].details = 'Test user created successfully';
        
        // Step 2: Try login with wrong password
        results.push({
          step: 2,
          description: 'Testing login with wrong password',
          status: 'running'
        });
        
        const wrongPasswordResponse = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            password: 'WrongPassword123!'
          })
        });
        
        if (wrongPasswordResponse.status === 401) {
          const errorData = await wrongPasswordResponse.json();
          results[1].status = 'passed';
          results[1].details = `Correctly rejected wrong password: ${errorData.error}`;
        } else {
          results[1].status = 'failed';
          results[1].details = `Expected HTTP 401, got ${wrongPasswordResponse.status}`;
        }
        
        // Step 3: Try login with non-existent email
        results.push({
          step: 3,
          description: 'Testing login with non-existent email',
          status: 'running'
        });
        
        const wrongEmailResponse = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `nonexistent-${Date.now()}@rawgle.com`,
            password: correctPassword
          })
        });
        
        if (wrongEmailResponse.status === 401) {
          const errorData = await wrongEmailResponse.json();
          results[2].status = 'passed';
          results[2].details = `Correctly rejected non-existent email: ${errorData.error}`;
        } else {
          results[2].status = 'failed';
          results[2].details = `Expected HTTP 401, got ${wrongEmailResponse.status}`;
        }
        
        // Step 4: Try login with empty credentials
        results.push({
          step: 4,
          description: 'Testing login with empty credentials',
          status: 'running'
        });
        
        const emptyCredsResponse = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: '',
            password: ''
          })
        });
        
        if (emptyCredsResponse.status === 400) {
          const errorData = await emptyCredsResponse.json();
          results[3].status = 'passed';
          results[3].details = `Correctly rejected empty credentials: ${errorData.error}`;
        } else {
          results[3].status = 'failed';
          results[3].details = `Expected HTTP 400, got ${emptyCredsResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Invalid login test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};