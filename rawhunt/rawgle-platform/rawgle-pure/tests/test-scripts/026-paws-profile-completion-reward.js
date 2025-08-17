// Test Script 026: PAWS Profile Completion Reward
// Purpose: Test PAWS reward for completing user profile
// Expected: HTTP 200 with reward transaction for profile completion

export default {
  id: '026',
  name: 'PAWS Profile Completion Reward',
  description: 'Tests PAWS reward system for profile completion milestone',
  category: 'PAWS',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `profile-reward-${Date.now()}@rawgle.com`;
      
      // Step 1: Create test user
      results.push({
        step: 1,
        description: 'Creating test user for profile completion reward',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'ProfileTest123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = 'Test user created successfully';
        
        // Step 2: Award profile completion reward
        results.push({
          step: 2,
          description: 'Awarding PAWS for profile completion',
          status: 'running'
        });
        
        const rewardResponse = await fetch(`${API_BASE}/api/paws/reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.userId,
            type: 'profile_completion',
            metadata: { 
              walletAddress: 'TestWallet123',
              profileFields: ['name', 'email', 'wallet']
            }
          })
        });
        
        if (rewardResponse.status === 200) {
          const rewardData = await rewardResponse.json();
          results[1].status = 'passed';
          results[1].details = `Profile completion reward: ${rewardData.amount} PAWS`;
          
          // Step 3: Verify reward amount is correct (50 PAWS)
          results.push({
            step: 3,
            description: 'Verifying profile completion reward amount',
            status: rewardData.amount === 50 ? 'passed' : 'failed',
            details: `Expected 50 PAWS, received: ${rewardData.amount}`
          });
          
          // Step 4: Verify transaction has proper status
          results.push({
            step: 4,
            description: 'Verifying reward transaction status',
            status: rewardData.status === 'pending' ? 'passed' : 'failed',
            details: `Transaction status: ${rewardData.status}, ID: ${rewardData.transactionId}`
          });
          
          // Step 5: Check if subscriber bonus applies
          if (rewardData.subscriberBonus) {
            results.push({
              step: 5,
              description: 'Verifying subscriber bonus application',
              status: rewardData.multiplier > 1 ? 'passed' : 'failed',
              details: `Subscriber bonus: ${rewardData.multiplier}x, Total: ${rewardData.totalAwarded} PAWS`
            });
          } else {
            results.push({
              step: 5,
              description: 'Confirming no subscriber bonus for free user',
              status: 'passed',
              details: 'No subscriber bonus applied (free user)'
            });
          }
          
        } else {
          const errorData = await rewardResponse.json();
          results[1].status = 'failed';
          results[1].details = `Reward request failed: ${errorData.error}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Profile completion reward test', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};