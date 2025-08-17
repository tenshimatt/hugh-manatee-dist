// Test Script 005: User Story - Authentication Flow
// Purpose: Test complete user authentication user story
// Expected: Complete auth flow from registration to authenticated API access

export default {
  id: '005',
  name: 'User Story: Authentication Flow',
  description: 'End-to-end test of user authentication including registration, login, and API access',
  category: 'User Stories',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    const testUser = {
      email: `test-${Date.now()}@rawgle.com`,
      password: 'TestPassword123!',
      name: 'Test User'
    };
    
    try {
      // Step 1: User Registration
      results.push({
        step: 1,
        description: 'User attempts to register new account',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser),
        cache: 'no-store'
      });
      
      if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = `Registration successful: User ID ${registerData.user?.id || 'generated'}`;
        
        // Step 2: User Login
        results.push({
          step: 2,
          description: 'User attempts to login with registered credentials',
          status: 'running'
        });
        
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: testUser.email,
            password: testUser.password
          }),
          cache: 'no-store'
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          const authToken = loginData.token;
          
          results[1].status = 'passed';
          results[1].details = `Login successful: JWT token received (${authToken ? 'valid' : 'missing'})`;
          
          // Step 3: Access protected resource
          results.push({
            step: 3,
            description: 'Access protected API endpoint with JWT token',
            status: 'running'
          });
          
          if (authToken) {
            const protectedResponse = await fetch(`${API_BASE}/api/pets?user-story-test=true`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              cache: 'no-store'
            });
            
            if (protectedResponse.ok) {
              const petsData = await protectedResponse.json();
              results[2].status = 'passed';
              results[2].details = `Protected endpoint accessible: Retrieved ${petsData.pets?.length || 0} pets`;
            } else {
              results[2].status = 'failed';
              results[2].details = `Protected endpoint failed: ${protectedResponse.status}`;
            }
          } else {
            results[2].status = 'failed';
            results[2].details = 'No JWT token received from login';
          }
          
          // Step 4: Test token expiration handling
          results.push({
            step: 4,
            description: 'Test access with invalid/expired token',
            status: 'running'
          });
          
          const invalidTokenResponse = await fetch(`${API_BASE}/api/pets?token-test=invalid`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer invalid-token-123'
            },
            cache: 'no-store'
          });
          
          if (invalidTokenResponse.status === 401) {
            results[3].status = 'passed';
            results[3].details = 'Invalid token correctly rejected (401 Unauthorized)';
          } else {
            results[3].status = 'failed';
            results[3].details = `Invalid token handling issue: Got ${invalidTokenResponse.status} instead of 401`;
          }
          
        } else {
          results[1].status = 'failed';
          results[1].details = `Login failed: ${loginResponse.status} ${loginResponse.statusText}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `Registration failed: ${registerResponse.status} ${registerResponse.statusText}`;
      }
      
      // Step 5: Password validation (additional security test)
      results.push({
        step: 5,
        description: 'Test password security requirements',
        status: 'running'
      });
      
      const weakPasswordResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: `weak-${Date.now()}@rawgle.com`,
          password: '123',
          name: 'Weak Password User'
        }),
        cache: 'no-store'
      });
      
      if (weakPasswordResponse.status === 400) {
        results[4].status = 'passed';
        results[4].details = 'Weak password correctly rejected (400 Bad Request)';
      } else {
        results[4].status = 'warning';
        results[4].details = 'Password security validation may be insufficient';
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length - 1 : 0;
      results[currentStep].status = 'failed';
      results[currentStep].details = `User story test error: ${error.message}`;
      
      if (error.message.includes('Failed to fetch')) {
        results.push({
          step: results.length + 1,
          description: 'Network Error Analysis',
          status: 'failed',
          details: 'Cannot complete user story due to network connectivity issues'
        });
      }
    }
    
    return results;
  }
};