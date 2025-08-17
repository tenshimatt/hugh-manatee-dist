// Test Script 008: PAWS Balance Management
// Purpose: Test PAWS cryptocurrency balance operations
// Expected: Correct balance tracking and retrieval

export default {
  id: '008',
  name: 'PAWS Balance Management',
  description: 'Tests PAWS cryptocurrency balance retrieval and management operations',
  category: 'Functionality',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      // Step 1: Create test user and get auth token
      results.push({
        step: 1,
        description: 'Creating test user for PAWS balance testing',
        status: 'running'
      });
      
      const testUser = {
        email: `paws-test-${Date.now()}@rawgle.com`,
        password: 'TestPaws123!',
        name: 'PAWS Test User'
      };
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
        cache: 'no-store'
      });
      
      if (!registerResponse.ok) {
        results[0].status = 'failed';
        results[0].details = `Failed to create test user: ${registerResponse.status}`;
        return results;
      }
      
      const registerData = await registerResponse.json();
      results[0].status = 'passed';
      results[0].details = `Test user created: ${testUser.email}`;
      
      // Step 2: Login to get auth token
      results.push({
        step: 2,
        description: 'Authenticating test user',
        status: 'running'
      });
      
      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        }),
        cache: 'no-store'
      });
      
      if (!loginResponse.ok) {
        results[1].status = 'failed';
        results[1].details = `Login failed: ${loginResponse.status}`;
        return results;
      }
      
      const loginData = await loginResponse.json();
      const authToken = loginData.token;
      results[1].status = 'passed';
      results[1].details = 'Authentication successful, token received';
      
      // Step 3: Check initial balance (should be welcome bonus)
      results.push({
        step: 3,
        description: 'Checking initial PAWS balance (welcome bonus)',
        status: 'running'
      });
      
      const balanceResponse = await fetch(`${API_BASE}/api/paws/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        cache: 'no-store'
      });
      
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        const balance = balanceData.balance || 0;
        results[2].status = balance > 0 ? 'passed' : 'warning';
        results[2].details = `Initial balance: ${balance} PAWS ${balance > 0 ? '(welcome bonus received)' : '(no welcome bonus)'}`;
      } else {
        results[2].status = 'failed';
        results[2].details = `Balance check failed: ${balanceResponse.status}`;
      }
      
      // Step 4: Test balance retrieval for non-existent user
      results.push({
        step: 4,
        description: 'Testing balance query for non-existent user',
        status: 'running'
      });
      
      const invalidBalanceResponse = await fetch(`${API_BASE}/api/paws/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token-123'
        },
        cache: 'no-store'
      });
      
      if (invalidBalanceResponse.status === 401) {
        results[3].status = 'passed';
        results[3].details = 'Correctly rejected invalid authentication (401)';
      } else {
        results[3].status = 'failed';
        results[3].details = `Expected 401, got ${invalidBalanceResponse.status}`;
      }
      
      // Step 5: Test earning PAWS through profile completion
      results.push({
        step: 5,
        description: 'Testing PAWS rewards for profile completion',
        status: 'running'
      });
      
      // First create a pet profile
      const petResponse = await fetch(`${API_BASE}/api/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Test Pet',
          species: 'dog',
          breed: 'Labrador',
          age: 3,
          weight: 30
        }),
        cache: 'no-store'
      });
      
      if (petResponse.ok) {
        // Now check for profile completion reward
        const rewardResponse = await fetch(`${API_BASE}/api/paws/rewards`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            type: 'profile_completion',
            data: { petId: 'test-pet-id' }
          }),
          cache: 'no-store'
        });
        
        if (rewardResponse.ok) {
          const rewardData = await rewardResponse.json();
          results[4].status = 'passed';
          results[4].details = `Profile completion reward: ${rewardData.amount || 0} PAWS earned`;
        } else {
          results[4].status = 'warning';
          results[4].details = `Reward system response: ${rewardResponse.status}`;
        }
      } else {
        results[4].status = 'warning';
        results[4].details = `Could not test rewards: Pet creation returned ${petResponse.status}`;
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length - 1 : 0;
      if (results[currentStep]) {
        results[currentStep].status = 'failed';
        results[currentStep].details = `PAWS balance test error: ${error.message}`;
      } else {
        results.push({
          step: 1,
          description: 'PAWS balance test initialization',
          status: 'failed',
          details: `Failed to start test: ${error.message}`
        });
      }
    }
    
    return results;
  }
};