// Test Script 010: Daily Limits and Anti-Bot Protection
// Purpose: Test PAWS daily earning limits and bot detection
// Expected: Proper enforcement of limits and bot pattern detection

export default {
  id: '010',
  name: 'Daily Limits & Anti-Bot Protection',
  description: 'Tests daily PAWS earning limits and anti-bot protection mechanisms',
  category: 'Security',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    let authToken = null;
    
    try {
      // Setup: Create and authenticate user
      const testUser = {
        email: `antibot-test-${Date.now()}@rawgle.com`,
        password: 'AntiBot123!',
        name: 'Anti-Bot Test User'
      };
      
      const setupResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
        cache: 'no-store'
      });
      
      if (setupResponse.ok) {
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testUser.email, password: testUser.password }),
          cache: 'no-store'
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          authToken = loginData.token;
        }
      }
      
      if (!authToken) {
        results.push({
          step: 1,
          description: 'Test setup',
          status: 'failed',
          details: 'Could not create test user or authenticate'
        });
        return results;
      }
      
      // Step 1: Test daily earning limit enforcement
      results.push({
        step: 1,
        description: 'Testing daily PAWS earning limits',
        status: 'running'
      });
      
      // Try to earn PAWS multiple times
      let totalEarned = 0;
      let limitReached = false;
      
      for (let i = 0; i < 10; i++) {
        const rewardResponse = await fetch(`${API_BASE}/api/paws/rewards`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            type: 'daily_feeding',
            data: { 
              petId: `test-pet-${i}`,
              date: new Date().toISOString()
            }
          }),
          cache: 'no-store'
        });
        
        if (rewardResponse.status === 429 || 
            (rewardResponse.ok && (await rewardResponse.json()).dailyLimitReached)) {
          limitReached = true;
          break;
        } else if (rewardResponse.ok) {
          const data = await rewardResponse.json();
          totalEarned += data.amount || 0;
        }
      }
      
      if (limitReached) {
        results[0].status = 'passed';
        results[0].details = `Daily limit enforced after earning ${totalEarned} PAWS`;
      } else {
        results[0].status = 'warning';
        results[0].details = `Earned ${totalEarned} PAWS without hitting limit (may be unlimited or very high)`;
      }
      
      // Step 2: Test rapid request detection (bot-like behavior)
      results.push({
        step: 2,
        description: 'Testing bot-like behavior detection (rapid requests)',
        status: 'running'
      });
      
      let botDetected = false;
      const rapidRequests = [];
      
      // Make 5 rapid requests within 1 second
      for (let i = 0; i < 5; i++) {
        rapidRequests.push(
          fetch(`${API_BASE}/api/paws/rewards`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              type: 'daily_feeding',
              data: { 
                petId: `rapid-test-${i}`,
                date: new Date().toISOString()
              }
            }),
            cache: 'no-store'
          })
        );
      }
      
      const rapidResponses = await Promise.all(rapidRequests);
      
      for (const response of rapidResponses) {
        if (response.status === 429) {
          botDetected = true;
          break;
        }
        if (response.ok) {
          const data = await response.json();
          if (data.warning && data.warning.includes('bot')) {
            botDetected = true;
            break;
          }
        }
      }
      
      if (botDetected) {
        results[1].status = 'passed';
        results[1].details = 'Bot-like behavior correctly detected and flagged';
      } else {
        results[1].status = 'warning';
        results[1].details = 'Rapid requests allowed without bot detection (may have lenient settings)';
      }
      
      // Step 3: Test legitimate rapid actions with low risk
      results.push({
        step: 3,
        description: 'Testing legitimate rapid actions are allowed',
        status: 'running'
      });
      
      // Wait a bit to reset any rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Make 2 legitimate requests with slight delay
      const legitResponse1 = await fetch(`${API_BASE}/api/paws/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        cache: 'no-store'
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const legitResponse2 = await fetch(`${API_BASE}/api/pets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        cache: 'no-store'
      });
      
      if (legitResponse1.ok && legitResponse2.ok) {
        results[2].status = 'passed';
        results[2].details = 'Legitimate spaced requests allowed through';
      } else {
        results[2].status = 'failed';
        results[2].details = 'Legitimate requests were blocked incorrectly';
      }
      
      // Step 4: Test daily limit reset mechanism
      results.push({
        step: 4,
        description: 'Testing daily limit reset information',
        status: 'running'
      });
      
      const limitStatusResponse = await fetch(`${API_BASE}/api/paws/limits`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        cache: 'no-store'
      });
      
      if (limitStatusResponse.ok) {
        const limitData = await limitStatusResponse.json();
        const hasResetTime = limitData.resetTime || limitData.nextReset;
        const hasDailyLimit = limitData.dailyLimit !== undefined;
        const hasRemaining = limitData.remaining !== undefined;
        
        if (hasResetTime && hasDailyLimit && hasRemaining) {
          results[3].status = 'passed';
          results[3].details = `Limit info: ${limitData.remaining}/${limitData.dailyLimit} PAWS remaining`;
        } else {
          results[3].status = 'warning';
          results[3].details = 'Limit status endpoint exists but missing some data';
        }
      } else if (limitStatusResponse.status === 404) {
        results[3].status = 'warning';
        results[3].details = 'Limit status endpoint not implemented';
      } else {
        results[3].status = 'failed';
        results[3].details = `Limit status check failed: ${limitStatusResponse.status}`;
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length : 1;
      results.push({
        step: currentStep,
        description: 'Error during anti-bot testing',
        status: 'failed',
        details: `Anti-bot test error: ${error.message}`
      });
    }
    
    return results;
  }
};