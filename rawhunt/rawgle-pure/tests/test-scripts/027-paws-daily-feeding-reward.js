// Test Script 027: PAWS Daily Feeding Reward
// Purpose: Test PAWS reward for daily feeding logs
// Expected: HTTP 200 with reward transaction for feeding activity

export default {
  id: '027',
  name: 'PAWS Daily Feeding Reward',
  description: 'Tests PAWS reward system for daily pet feeding log entries',
  category: 'PAWS',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `feeding-reward-${Date.now()}@rawgle.com`;
      
      // Step 1: Create test user
      results.push({
        step: 1,
        description: 'Creating test user for feeding reward',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'FeedingTest123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = 'Test user created successfully';
        
        // Step 2: Award daily feeding reward
        results.push({
          step: 2,
          description: 'Awarding PAWS for daily feeding log',
          status: 'running'
        });
        
        const rewardResponse = await fetch(`${API_BASE}/api/paws/reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.userId,
            type: 'daily_feeding',
            metadata: { 
              petId: 'pet-123',
              logCount: 3,
              feedingTime: new Date().toISOString()
            }
          })
        });
        
        if (rewardResponse.status === 200) {
          const rewardData = await rewardResponse.json();
          results[1].status = 'passed';
          results[1].details = `Daily feeding reward: ${rewardData.amount} PAWS`;
          
          // Step 3: Verify reward amount is correct (1 PAWS)
          results.push({
            step: 3,
            description: 'Verifying daily feeding reward amount',
            status: rewardData.amount === 1 ? 'passed' : 'failed',
            details: `Expected 1 PAWS, received: ${rewardData.amount}`
          });
          
          // Step 4: Test multiple feeding rewards in same day
          results.push({
            step: 4,
            description: 'Testing multiple feeding rewards accumulation',
            status: 'running'
          });
          
          const secondFeedingResponse = await fetch(`${API_BASE}/api/paws/reward`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userData.userId,
              type: 'daily_feeding',
              metadata: { 
                petId: 'pet-123',
                logCount: 1,
                feedingTime: new Date(Date.now() + 3600000).toISOString() // 1 hour later
              }
            })
          });
          
          if (secondFeedingResponse.status === 200) {
            const secondRewardData = await secondFeedingResponse.json();
            results[3].status = 'passed';
            results[3].details = `Second feeding reward: ${secondRewardData.amount} PAWS`;
          } else if (secondFeedingResponse.status === 429) {
            // Daily limit reached
            const limitData = await secondFeedingResponse.json();
            results[3].status = 'passed';
            results[3].details = `Daily limit protection active: ${limitData.error}`;
          } else {
            results[3].status = 'failed';
            results[3].details = `Unexpected response: ${secondFeedingResponse.status}`;
          }
          
        } else {
          const errorData = await rewardResponse.json();
          results[1].status = 'failed';
          results[1].details = `Feeding reward failed: ${errorData.error}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Daily feeding reward test', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};