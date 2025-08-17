// Test Script 034: Legitimate Rapid Actions
// Purpose: Test that legitimate rapid actions are allowed while bot behavior is blocked
// Expected: Normal user behavior should not trigger bot detection

export default {
  id: '034',
  name: 'Legitimate Rapid Actions',
  description: 'Tests that legitimate rapid user actions are properly distinguished from bot behavior',
  category: 'PAWS',
  priority: 'Medium',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `legit-user-${Date.now()}@rawgle.com`;
      
      // Step 1: Create test user
      results.push({
        step: 1,
        description: 'Creating test user for legitimate action testing',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'LegitUser123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = `Test user created: ${userData.userId}`;
        
        // Step 2: Simulate legitimate varied actions
        results.push({
          step: 2,
          description: 'Performing varied legitimate actions',
          status: 'running'
        });
        
        const legitActions = [
          { endpoint: '/api/paws/balance', method: 'GET' },
          { endpoint: '/api/user/profile', method: 'GET' },
          { endpoint: '/api/pets/list', method: 'GET' },
          { endpoint: '/api/paws/balance', method: 'GET' }
        ];
        
        let successfulActions = 0;
        
        for (let i = 0; i < legitActions.length; i++) {
          const action = legitActions[i];
          const url = `${API_BASE}${action.endpoint}${action.method === 'GET' ? `?userId=${userData.userId}` : ''}`;
          
          const response = await fetch(url, {
            method: action.method,
            headers: { 'Content-Type': 'application/json' },
            body: action.method === 'POST' ? JSON.stringify({ userId: userData.userId }) : undefined
          });
          
          if (response.status < 400) {
            successfulActions++;
          }
          
          // Natural user-like delay
          await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
        }
        
        results[1].status = successfulActions === legitActions.length ? 'passed' : 'partial';
        results[1].details = `${successfulActions}/${legitActions.length} legitimate actions successful`;
        
        // Step 3: Test legitimate reward claim with proper intervals
        results.push({
          step: 3,
          description: 'Testing legitimate reward claim with proper intervals',
          status: 'running'
        });
        
        const rewardResponse = await fetch(`${API_BASE}/api/paws/claim-reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.userId,
            rewardType: 'daily_feeding',
            amount: 5
          })
        });
        
        if (rewardResponse.status === 200) {
          const rewardData = await rewardResponse.json();
          results[2].status = 'passed';
          results[2].details = `Reward claim successful: ${rewardData.newBalance} PAWS`;
        } else if (rewardResponse.status === 429) {
          results[2].status = 'warning';
          results[2].details = 'Rate limited - may indicate over-sensitive bot detection';
        } else {
          const errorData = await rewardResponse.json();
          results[2].status = 'failed';
          results[2].details = `Reward claim failed: ${errorData.error}`;
        }
        
        // Step 4: Verify continued normal access
        results.push({
          step: 4,
          description: 'Verifying continued normal API access',
          status: 'running'
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const balanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${userData.userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (balanceResponse.status === 200) {
          const balanceData = await balanceResponse.json();
          results[3].status = 'passed';
          results[3].details = `Normal access maintained: ${balanceData.balance} PAWS`;
        } else {
          results[3].status = 'failed';
          results[3].details = `Access restricted unexpectedly: ${balanceResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Legitimate actions test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};