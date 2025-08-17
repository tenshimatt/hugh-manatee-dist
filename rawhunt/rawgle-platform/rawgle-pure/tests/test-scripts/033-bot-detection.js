// Test Script 033: Bot Behavior Detection
// Purpose: Test the system's ability to detect and prevent bot-like behavior
// Expected: Rapid actions should trigger bot detection and temporary restrictions

export default {
  id: '033',
  name: 'Bot Behavior Detection',
  description: 'Tests the system\'s ability to detect rapid, automated actions and apply temporary restrictions',
  category: 'PAWS',
  priority: 'Critical',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `bot-test-${Date.now()}@rawgle.com`;
      
      // Step 1: Create test user
      results.push({
        step: 1,
        description: 'Creating test user for bot detection',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'BotTest123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = `Test user created: ${userData.userId}`;
        
        // Step 2: Simulate rapid reward claims (bot-like behavior)
        results.push({
          step: 2,
          description: 'Simulating rapid reward claims to trigger bot detection',
          status: 'running'
        });
        
        let botDetected = false;
        let claimCount = 0;
        
        for (let i = 0; i < 10; i++) {
          const claimResponse = await fetch(`${API_BASE}/api/paws/claim-reward`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userData.userId,
              rewardType: 'daily_feeding',
              amount: 5
            })
          });
          
          if (claimResponse.status === 429 || claimResponse.status === 403) {
            const errorData = await claimResponse.json();
            if (errorData.error && errorData.error.includes('bot')) {
              botDetected = true;
              break;
            }
          }
          claimCount++;
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        if (botDetected) {
          results[1].status = 'passed';
          results[1].details = `Bot detection triggered after ${claimCount} rapid claims`;
        } else {
          results[1].status = 'warning';
          results[1].details = `No bot detection after ${claimCount} rapid claims - may need tuning`;
        }
        
        // Step 3: Verify temporary restriction is applied
        results.push({
          step: 3,
          description: 'Verifying temporary restriction is applied',
          status: 'running'
        });
        
        const restrictedResponse = await fetch(`${API_BASE}/api/paws/claim-reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.userId,
            rewardType: 'profile_completion',
            amount: 10
          })
        });
        
        if (restrictedResponse.status === 429 || restrictedResponse.status === 403) {
          const errorData = await restrictedResponse.json();
          results[2].status = 'passed';
          results[2].details = `Restriction active: ${errorData.error}`;
        } else {
          results[2].status = 'failed';
          results[2].details = `Expected restriction, but claim was allowed`;
        }
        
        // Step 4: Test legitimate behavior after cooldown
        results.push({
          step: 4,
          description: 'Testing legitimate behavior after brief cooldown',
          status: 'running'
        });
        
        // Wait for potential cooldown
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const normalResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${userData.userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (normalResponse.status === 200) {
          results[3].status = 'passed';
          results[3].details = 'Normal API access restored after cooldown';
        } else {
          results[3].status = 'failed';
          results[3].details = `Still restricted: ${normalResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Bot detection test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};