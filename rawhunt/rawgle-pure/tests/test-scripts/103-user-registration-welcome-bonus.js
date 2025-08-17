// Test Script 103: User Registration & Welcome Bonus
// Purpose: Tests complete user registration workflow with PAWS welcome bonus
// User Story: New user registers and receives 50 PAWS welcome bonus

export default {
  id: '103',
  name: 'User Registration & Welcome Bonus',
  description: 'Complete user registration flow with welcome bonus validation',
  category: 'Integration',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    const testUser = {
      email: `welcome-test-${Date.now()}@rawgle.com`,
      password: 'WelcomeTest123!',
      name: 'Welcome Test User'
    };
    
    try {
      // Step 1: Register new user
      results.push({
        step: 1,
        description: 'User registers new account',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      });
      
      if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = `Registration successful: User ID ${registerData.userId}`;
        
        // Step 2: Verify welcome bonus PAWS
        results.push({
          step: 2,
          description: 'Verify 50 PAWS welcome bonus credited',
          status: 'running'
        });
        
        if (registerData.pawsBalance && registerData.pawsBalance >= 50) {
          results[1].status = 'passed';
          results[1].details = `Welcome bonus confirmed: ${registerData.pawsBalance} PAWS`;
        } else {
          results[1].status = 'failed';
          results[1].details = `Welcome bonus missing: Expected 50+ PAWS, got ${registerData.pawsBalance}`;
        }
        
        // Step 3: Login to verify account activation
        results.push({
          step: 3,
          description: 'Login with new account to verify activation',
          status: 'running'
        });
        
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: testUser.email,
            password: testUser.password
          })
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          results[2].status = 'passed';
          results[2].details = `Account activation confirmed: Session token received`;
          
          // Step 4: Verify PAWS balance via API
          results.push({
            step: 4,
            description: 'Query PAWS balance via API to confirm bonus',
            status: 'running'
          });
          
          const balanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${loginData.userId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${loginData.sessionToken}`
            }
          });
          
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            if (balanceData.balance >= 50) {
              results[3].status = 'passed';
              results[3].details = `PAWS balance verified: ${balanceData.balance} PAWS`;
            } else {
              results[3].status = 'failed';
              results[3].details = `PAWS balance incorrect: ${balanceData.balance}`;
            }
          } else {
            results[3].status = 'failed';
            results[3].details = `Balance API failed: ${balanceResponse.status}`;
          }
          
        } else {
          results[2].status = 'failed';
          results[2].details = `Login failed: ${loginResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `Registration failed: ${registerResponse.status} - ${registerResponse.statusText}`;
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length - 1 : 0;
      results[currentStep] = results[currentStep] || { step: currentStep + 1, description: 'User registration test', status: 'failed' };
      results[currentStep].status = 'failed';
      results[currentStep].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};