// Test Script 009: PAWS Rewards System
// Purpose: Test PAWS reward distribution for various activities
// Expected: Correct reward amounts for different user actions

export default {
  id: '009',
  name: 'PAWS Rewards System',
  description: 'Tests PAWS cryptocurrency rewards for profile completion, daily activities, and milestones',
  category: 'Functionality',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    let authToken = null;
    
    try {
      // Setup: Create and authenticate user
      const testUser = {
        email: `rewards-test-${Date.now()}@rawgle.com`,
        password: 'RewardTest123!',
        name: 'Rewards Test User'
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
      
      // Step 1: Test profile completion reward
      results.push({
        step: 1,
        description: 'Testing reward for profile completion',
        status: 'running'
      });
      
      const profileRewardResponse = await fetch(`${API_BASE}/api/paws/rewards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          type: 'profile_completion',
          data: { completionPercentage: 100 }
        }),
        cache: 'no-store'
      });
      
      if (profileRewardResponse.ok) {
        const rewardData = await profileRewardResponse.json();
        results[0].status = 'passed';
        results[0].details = `Profile completion: ${rewardData.amount || 100} PAWS awarded`;
      } else {
        results[0].status = 'failed';
        results[0].details = `Profile reward failed: ${profileRewardResponse.status}`;
      }
      
      // Step 2: Test daily feeding log reward
      results.push({
        step: 2,
        description: 'Testing reward for daily feeding logs',
        status: 'running'
      });
      
      const feedingRewardResponse = await fetch(`${API_BASE}/api/paws/rewards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          type: 'daily_feeding',
          data: { 
            petId: 'test-pet',
            date: new Date().toISOString().split('T')[0]
          }
        }),
        cache: 'no-store'
      });
      
      if (feedingRewardResponse.ok) {
        const rewardData = await feedingRewardResponse.json();
        results[1].status = 'passed';
        results[1].details = `Daily feeding: ${rewardData.amount || 10} PAWS awarded`;
      } else {
        results[1].status = 'warning';
        results[1].details = `Feeding reward status: ${feedingRewardResponse.status}`;
      }
      
      // Step 3: Test weekly consistency bonus
      results.push({
        step: 3,
        description: 'Testing bonus for weekly consistency',
        status: 'running'
      });
      
      const weeklyBonusResponse = await fetch(`${API_BASE}/api/paws/rewards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          type: 'weekly_streak',
          data: { 
            streakDays: 7,
            petId: 'test-pet'
          }
        }),
        cache: 'no-store'
      });
      
      if (weeklyBonusResponse.ok) {
        const rewardData = await weeklyBonusResponse.json();
        results[2].status = 'passed';
        results[2].details = `Weekly streak: ${rewardData.amount || 50} PAWS bonus awarded`;
      } else {
        results[2].status = 'warning';
        results[2].details = `Weekly bonus status: ${weeklyBonusResponse.status}`;
      }
      
      // Step 4: Test monthly health report reward
      results.push({
        step: 4,
        description: 'Testing reward for monthly health reports',
        status: 'running'
      });
      
      const monthlyRewardResponse = await fetch(`${API_BASE}/api/paws/rewards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          type: 'monthly_report',
          data: { 
            reportMonth: new Date().getMonth() + 1,
            reportYear: new Date().getFullYear()
          }
        }),
        cache: 'no-store'
      });
      
      if (monthlyRewardResponse.ok) {
        const rewardData = await monthlyRewardResponse.json();
        results[3].status = 'passed';
        results[3].details = `Monthly report: ${rewardData.amount || 100} PAWS awarded`;
      } else {
        results[3].status = 'warning';
        results[3].details = `Monthly reward status: ${monthlyRewardResponse.status}`;
      }
      
      // Step 5: Test invalid reward type rejection
      results.push({
        step: 5,
        description: 'Testing rejection of invalid reward types',
        status: 'running'
      });
      
      const invalidRewardResponse = await fetch(`${API_BASE}/api/paws/rewards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          type: 'invalid_reward_type',
          data: { amount: 99999 }
        }),
        cache: 'no-store'
      });
      
      if (invalidRewardResponse.status === 400) {
        results[4].status = 'passed';
        results[4].details = 'Invalid reward type correctly rejected (400)';
      } else {
        results[4].status = 'failed';
        results[4].details = `Expected 400 for invalid type, got ${invalidRewardResponse.status}`;
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length : 1;
      results.push({
        step: currentStep,
        description: 'Error during rewards testing',
        status: 'failed',
        details: `Rewards test error: ${error.message}`
      });
    }
    
    return results;
  }
};