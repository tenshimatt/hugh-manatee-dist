// Test Script 011: User Registration - Basic Registration
// Purpose: Test new user registration with email and password
// Expected: HTTP 201 with user details and session token

export default {
  id: '011',
  name: 'User Registration - Basic Registration',
  description: 'Tests basic user registration with email and password, expecting welcome bonus',
  category: 'Authentication',
  priority: 'Critical',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      // Step 1: Register new user
      results.push({
        step: 1,
        description: 'Registering new user with valid credentials',
        status: 'running'
      });
      
      const registrationData = {
        email: `test-${Date.now()}@rawgle.com`,
        password: 'SecurePass123!',
        walletAddress: 'E9mnWdbp97pGaUTGRP743KhppWkYzkagWo7JM3hRJsHA'
      };
      
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });
      
      if (response.status === 201) {
        const data = await response.json();
        
        results[0].status = 'passed';
        results[0].details = `Registration successful: ${data.email}`;
        
        // Step 2: Validate response structure
        results.push({
          step: 2,
          description: 'Validating registration response structure',
          status: data.userId && data.sessionToken && data.pawsBalance === 50 ? 'passed' : 'failed',
          details: `UserId: ${data.userId}, Balance: ${data.pawsBalance}, HasSession: ${!!data.sessionToken}`
        });
        
        // Step 3: Validate welcome bonus
        results.push({
          step: 3,
          description: 'Verifying welcome bonus PAWS allocation',
          status: data.pawsBalance === 50 ? 'passed' : 'failed',
          details: `Expected 50 PAWS, received: ${data.pawsBalance}`
        });
        
      } else {
        const errorData = await response.json();
        results[0].status = 'failed';
        results[0].details = `HTTP ${response.status}: ${errorData.error || 'Registration failed'}`;
      }
      
    } catch (error) {
      results[0].status = 'failed';
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};