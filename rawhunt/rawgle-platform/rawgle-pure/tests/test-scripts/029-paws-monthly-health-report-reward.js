// Test Script 029: PAWS Monthly Health Report Reward
// Purpose: Test PAWS reward for monthly health report submission
// Expected: HTTP 200 with substantial reward for health report

export default {
  id: '029',
  name: 'PAWS Monthly Health Report Reward',
  description: 'Tests PAWS reward system for monthly pet health report submissions',
  category: 'PAWS',
  priority: 'Medium',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `health-report-${Date.now()}@rawgle.com`;
      
      // Step 1: Create test user
      results.push({
        step: 1,
        description: 'Creating test user for health report reward',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'HealthReport123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = 'Test user created successfully';
        
        // Step 2: Award monthly health report reward
        results.push({
          step: 2,
          description: 'Awarding PAWS for monthly health report',
          status: 'running'
        });
        
        const rewardResponse = await fetch(`${API_BASE}/api/paws/reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.userId,
            type: 'monthly_health_report',
            metadata: { 
              reportId: 'report-456',
              monthYear: '2024-01',
              completionDate: new Date().toISOString()
            }
          })
        });
        
        if (rewardResponse.status === 200) {
          const rewardData = await rewardResponse.json();
          results[1].status = 'passed';
          results[1].details = `Monthly health report reward: ${rewardData.amount} PAWS`;
          
          // Step 3: Verify reward amount (100 PAWS)
          results.push({
            step: 3,
            description: 'Verifying monthly health report reward amount',
            status: rewardData.amount === 100 ? 'passed' : 'failed',
            details: `Expected 100 PAWS, received: ${rewardData.amount}`
          });
          
        } else {
          const errorData = await rewardResponse.json();
          results[1].status = 'failed';
          results[1].details = `Health report reward failed: ${errorData.error}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Monthly health report test', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};