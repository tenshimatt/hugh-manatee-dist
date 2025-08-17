// Test Script 028: PAWS Weekly Consistency Reward
// Purpose: Test PAWS reward for weekly feeding consistency
// Expected: HTTP 200 with bonus reward for consistent feeding

export default {
  id: '028',
  name: 'PAWS Weekly Consistency Reward',
  description: 'Tests PAWS bonus reward system for weekly feeding consistency',
  category: 'PAWS',
  priority: 'Medium',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `consistency-${Date.now()}@rawgle.com`;
      
      // Step 1: Create test user
      results.push({
        step: 1,
        description: 'Creating test user for consistency reward',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'ConsistencyTest123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = 'Test user created successfully';
        
        // Step 2: Award weekly consistency bonus
        results.push({
          step: 2,
          description: 'Awarding PAWS for weekly consistency',
          status: 'running'
        });
        
        const rewardResponse = await fetch(`${API_BASE}/api/paws/reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.userId,
            type: 'weekly_consistency',
            metadata: { 
              daysLogged: 7,
              weekStartDate: new Date(Date.now() - 7*24*60*60*1000).toISOString()
            }
          })
        });
        
        if (rewardResponse.status === 200) {
          const rewardData = await rewardResponse.json();
          results[1].status = 'passed';
          results[1].details = `Weekly consistency reward: ${rewardData.amount} PAWS`;
          
          // Step 3: Verify reward amount (10 PAWS)
          results.push({
            step: 3,
            description: 'Verifying weekly consistency reward amount',
            status: rewardData.amount === 10 ? 'passed' : 'failed',
            details: `Expected 10 PAWS, received: ${rewardData.amount}`
          });
          
        } else {
          const errorData = await rewardResponse.json();
          results[1].status = 'failed';
          results[1].details = `Consistency reward failed: ${errorData.error}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Weekly consistency test', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};