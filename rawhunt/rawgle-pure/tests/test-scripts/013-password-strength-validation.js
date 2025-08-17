// Test Script 013: Password Strength Validation
// Purpose: Test password strength requirements during registration
// Expected: HTTP 400 error for weak passwords

export default {
  id: '013',
  name: 'Password Strength Validation',
  description: 'Tests password strength validation requirements during user registration',
  category: 'Authentication',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    const weakPasswords = [
      { password: '123', name: 'Too short (3 chars)' },
      { password: 'password', name: 'No uppercase/numbers' },
      { password: 'PASSWORD', name: 'No lowercase/numbers' },
      { password: '12345678', name: 'Only numbers' },
      { password: 'weakpass', name: 'No uppercase/numbers' }
    ];
    
    try {
      for (let i = 0; i < weakPasswords.length; i++) {
        const test = weakPasswords[i];
        
        results.push({
          step: i + 1,
          description: `Testing weak password: ${test.name}`,
          status: 'running'
        });
        
        const response = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `weak-${Date.now()}-${i}@rawgle.com`,
            password: test.password
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
      
      // Step 6: Test valid strong password
      results.push({
        step: 6,
        description: 'Testing valid strong password acceptance',
        status: 'running'
      });
      
      const validResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `strong-${Date.now()}@rawgle.com`,
          password: 'StrongPass123!'
        })
      });
      
      if (validResponse.status === 201) {
        results[5].status = 'passed';
        results[5].details = 'Strong password correctly accepted';
      } else {
        results[5].status = 'failed';
        results[5].details = `Strong password rejected: ${validResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Password validation test', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};