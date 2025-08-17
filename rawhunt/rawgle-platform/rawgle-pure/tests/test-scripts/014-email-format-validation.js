// Test Script 014: Email Format Validation
// Purpose: Test email format validation during registration
// Expected: HTTP 400 error for invalid email formats

export default {
  id: '014',
  name: 'Email Format Validation',
  description: 'Tests email format validation during user registration',
  category: 'Authentication',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    const invalidEmails = [
      { email: 'not-an-email', name: 'No @ symbol' },
      { email: '@rawgle.com', name: 'Missing local part' },
      { email: 'test@', name: 'Missing domain' },
      { email: 'test@rawgle', name: 'Missing TLD' },
      { email: 'test..test@rawgle.com', name: 'Double dots' },
      { email: 'test@rawgle..com', name: 'Double dots in domain' }
    ];
    
    try {
      for (let i = 0; i < invalidEmails.length; i++) {
        const test = invalidEmails[i];
        
        results.push({
          step: i + 1,
          description: `Testing invalid email: ${test.name}`,
          status: 'running'
        });
        
        const response = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: test.email,
            password: 'ValidPass123!'
          })
        });
        
        if (response.status === 400) {
          const errorData = await response.json();
          results[i].status = 'passed';
          results[i].details = `Correctly rejected: ${errorData.error}`;
        } else {
          results[i].status = 'failed';
          results[i].details = `Expected HTTP 400, got ${response.status}`;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Step 7: Test valid email format
      results.push({
        step: 7,
        description: 'Testing valid email format acceptance',
        status: 'running'
      });
      
      const validResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `valid-${Date.now()}@rawgle.com`,
          password: 'ValidPass123!'
        })
      });
      
      if (validResponse.status === 201) {
        results[6].status = 'passed';
        results[6].details = 'Valid email format correctly accepted';
      } else {
        results[6].status = 'failed';
        results[6].details = `Valid email rejected: ${validResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Email validation test', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};