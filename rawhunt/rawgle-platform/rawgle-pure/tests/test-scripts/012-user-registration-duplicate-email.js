// Test Script 012: User Registration - Duplicate Email Prevention
// Purpose: Test prevention of duplicate email registration
// Expected: HTTP 409 error for duplicate email

export default {
  id: '012',
  name: 'User Registration - Duplicate Email Prevention',
  description: 'Tests that the system prevents registration with an existing email address',
  category: 'Authentication',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `duplicate-${Date.now()}@rawgle.com`;
      
      // Step 1: Register first user
      results.push({
        step: 1,
        description: 'Registering first user with test email',
        status: 'running'
      });
      
      const firstRegistration = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'FirstPass123!'
        })
      });
      
      if (firstRegistration.status === 201) {
        results[0].status = 'passed';
        results[0].details = 'First registration successful';
        
        // Step 2: Attempt duplicate registration
        results.push({
          step: 2,
          description: 'Attempting duplicate email registration',
          status: 'running'
        });
        
        const duplicateResponse = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            password: 'DifferentPass123!'
          })
        });
        
        if (duplicateResponse.status === 409) {
          const errorData = await duplicateResponse.json();
          results[1].status = 'passed';
          results[1].details = `Correctly rejected duplicate: ${errorData.error}`;
          
          // Step 3: Verify error message content
          results.push({
            step: 3,
            description: 'Validating duplicate error message',
            status: errorData.error.toLowerCase().includes('already exists') ? 'passed' : 'failed',
            details: `Error message: ${errorData.error}`
          });
        } else {
          results[1].status = 'failed';
          results[1].details = `Expected HTTP 409, got ${duplicateResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `First registration failed: ${firstRegistration.status}`;
      }
      
    } catch (error) {
      results[0].status = 'failed';
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};