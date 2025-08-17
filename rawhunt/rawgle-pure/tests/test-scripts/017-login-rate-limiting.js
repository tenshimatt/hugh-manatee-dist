// Test Script 017: Login Rate Limiting
// Purpose: Test rate limiting protection for failed login attempts
// Expected: HTTP 429 error after multiple failed attempts

export default {
  id: '017',
  name: 'Login Rate Limiting',
  description: 'Tests rate limiting protection against brute force login attempts',
  category: 'Authentication',
  priority: 'Critical',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `ratelimit-test-${Date.now()}@rawgle.com`;
      const correctPassword = 'CorrectPass123!';
      
      // Step 1: Register test user first
      results.push({
        step: 1,
        description: 'Creating test user for rate limiting test',
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
        
        // Step 2: Make 5 failed login attempts
        results.push({
          step: 2,
          description: 'Making 5 failed login attempts',
          status: 'running'
        });
        
        let failedAttempts = 0;
        for (let i = 0; i < 5; i++) {
          const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: testEmail,
              password: 'WrongPassword123!'
            })
          });
          
          if (response.status === 401) {
            failedAttempts++;
          }
          
          // Small delay between attempts
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        if (failedAttempts === 5) {
          results[1].status = 'passed';
          results[1].details = `All 5 attempts failed as expected`;
        } else {
          results[1].status = 'failed';
          results[1].details = `Expected 5 failed attempts, got ${failedAttempts}`;
        }
        
        // Step 3: Test that 6th attempt triggers rate limiting
        results.push({
          step: 3,
          description: 'Testing rate limiting on 6th attempt',
          status: 'running'
        });
        
        const rateLimitResponse = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            password: 'WrongPassword123!'
          })
        });
        
        if (rateLimitResponse.status === 429) {
          const errorData = await rateLimitResponse.json();
          results[2].status = 'passed';
          results[2].details = `Rate limiting triggered: ${errorData.error}`;
        } else {
          results[2].status = 'failed';
          results[2].details = `Expected HTTP 429, got ${rateLimitResponse.status}`;
        }
        
        // Step 4: Verify that even correct password is now blocked
        results.push({
          step: 4,
          description: 'Verifying correct password is also blocked',
          status: 'running'
        });
        
        const blockedCorrectResponse = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            password: correctPassword
          })
        });
        
        if (blockedCorrectResponse.status === 429) {
          results[3].status = 'passed';
          results[3].details = 'Correct password also blocked by rate limiting';
        } else {
          results[3].status = 'failed';
          results[3].details = `Expected HTTP 429 for correct password, got ${blockedCorrectResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Rate limiting test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};