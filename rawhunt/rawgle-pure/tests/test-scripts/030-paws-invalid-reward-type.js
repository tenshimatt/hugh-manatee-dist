// Test Script 030: PAWS Invalid Reward Type Rejection
// Purpose: Test rejection of invalid reward types
// Expected: HTTP 400 error for invalid reward types

export default {
  id: '030',
  name: 'PAWS Invalid Reward Type Rejection',
  description: 'Tests rejection of invalid reward types in PAWS reward system',
  category: 'PAWS',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `invalid-reward-${Date.now()}@rawgle.com`;
      
      // Step 1: Create test user
      results.push({
        step: 1,
        description: 'Creating test user',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'InvalidTest123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = 'Test user created successfully';
        
        // Step 2: Test invalid reward type
        results.push({
          step: 2,
          description: 'Testing invalid reward type rejection',
          status: 'running'
        });
        
        const invalidRewardResponse = await fetch(`${API_BASE}/api/paws/reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.userId,
            type: 'invalid_reward_type',
            metadata: {}
          })
        });
        
        if (invalidRewardResponse.status === 400) {
          const errorData = await invalidRewardResponse.json();
          results[1].status = 'passed';
          results[1].details = `Invalid reward type correctly rejected: ${errorData.error}`;
        } else {
          results[1].status = 'failed';
          results[1].details = `Expected HTTP 400, got ${invalidRewardResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Invalid reward type test', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};