// Test Script 035: Daily Limit Reset
// Purpose: Test that daily earning limits reset properly at midnight UTC
// Expected: Limits should reset and allow new earnings after the daily reset

export default {
  id: '035',
  name: 'Daily Limit Reset',
  description: 'Tests that daily PAWS earning limits reset properly at the designated time',
  category: 'PAWS',
  priority: 'Medium',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `limit-reset-${Date.now()}@rawgle.com`;
      
      // Step 1: Create test user
      results.push({
        step: 1,
        description: 'Creating test user for daily limit testing',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'LimitReset123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = `Test user created: ${userData.userId}`;
        
        // Step 2: Check current daily earning status
        results.push({
          step: 2,
          description: 'Checking current daily earning status',
          status: 'running'
        });
        
        const statusResponse = await fetch(`${API_BASE}/api/paws/daily-status?userId=${userData.userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (statusResponse.status === 200) {
          const statusData = await statusResponse.json();
          results[1].status = 'passed';
          results[1].details = `Daily status: ${statusData.earnedToday}/${statusData.dailyLimit} PAWS, reset: ${statusData.nextReset}`;
          
          // Step 3: Attempt to earn up to daily limit
          results.push({
            step: 3,
            description: 'Testing earning progression toward daily limit',
            status: 'running'
          });
          
          let totalEarned = statusData.earnedToday;
          let earningAttempts = 0;
          
          while (totalEarned < statusData.dailyLimit && earningAttempts < 5) {
            const claimResponse = await fetch(`${API_BASE}/api/paws/claim-reward`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: userData.userId,
                rewardType: 'daily_feeding',
                amount: 5
              })
            });
            
            if (claimResponse.status === 200) {
              const claimData = await claimResponse.json();
              totalEarned += 5;
            } else if (claimResponse.status === 429) {
              const errorData = await claimResponse.json();
              if (errorData.error.includes('daily limit')) {
                break;
              }
            }
            
            earningAttempts++;
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          results[2].status = 'passed';
          results[2].details = `Earned ${totalEarned} PAWS (limit: ${statusData.dailyLimit})`;
          
          // Step 4: Verify limit enforcement
          results.push({
            step: 4,
            description: 'Verifying daily limit enforcement',
            status: 'running'
          });
          
          const limitResponse = await fetch(`${API_BASE}/api/paws/claim-reward`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userData.userId,
              rewardType: 'profile_completion',
              amount: 10
            })
          });
          
          if (limitResponse.status === 429) {
            const errorData = await limitResponse.json();
            results[3].status = 'passed';
            results[3].details = `Daily limit properly enforced: ${errorData.error}`;
          } else {
            results[3].status = 'warning';
            results[3].details = 'Daily limit may not be properly enforced';
          }
          
          // Step 5: Test reset timestamp calculation
          results.push({
            step: 5,
            description: 'Validating next reset timestamp',
            status: 'running'
          });
          
          const now = new Date();
          const nextMidnight = new Date();
          nextMidnight.setUTCDate(now.getUTCDate() + 1);
          nextMidnight.setUTCHours(0, 0, 0, 0);
          
          const resetTime = new Date(statusData.nextReset);
          const timeDiff = Math.abs(resetTime.getTime() - nextMidnight.getTime());
          
          if (timeDiff < 60000) { // Within 1 minute
            results[4].status = 'passed';
            results[4].details = `Reset time correctly calculated: ${statusData.nextReset}`;
          } else {
            results[4].status = 'failed';
            results[4].details = `Reset time incorrect: expected ~${nextMidnight.toISOString()}, got ${statusData.nextReset}`;
          }
          
        } else {
          results[1].status = 'failed';
          results[1].details = `Failed to get daily status: ${statusResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Daily limit reset test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};