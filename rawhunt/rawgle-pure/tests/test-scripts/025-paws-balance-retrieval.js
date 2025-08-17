// Test Script 025: PAWS Balance Retrieval
// Purpose: Test retrieval of user PAWS balance with exchange rate
// Expected: HTTP 200 with balance, exchange rate, and USD value

export default {
  id: '025',
  name: 'PAWS Balance Retrieval',
  description: 'Tests retrieval of user PAWS balance with exchange rate and USD conversion',
  category: 'PAWS',
  priority: 'Critical',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `balance-test-${Date.now()}@rawgle.com`;
      
      // Step 1: Create user to get balance for
      results.push({
        step: 1,
        description: 'Creating test user with initial PAWS balance',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'BalanceTest123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = `User created with ${userData.pawsBalance} PAWS`;
        
        // Step 2: Retrieve PAWS balance
        results.push({
          step: 2,
          description: 'Retrieving user PAWS balance',
          status: 'running'
        });
        
        const balanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${userData.userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (balanceResponse.status === 200) {
          const balanceData = await balanceResponse.json();
          results[1].status = 'passed';
          results[1].details = `Balance: ${balanceData.balance} PAWS, USD: $${balanceData.usdValue}`;
          
          // Step 3: Validate response structure
          results.push({
            step: 3,
            description: 'Validating balance response structure',
            status: 'running'
          });
          
          const hasRequiredFields = balanceData.userId && 
                                   balanceData.balance !== undefined && 
                                   balanceData.exchangeRate && 
                                   balanceData.usdValue !== undefined;
          
          if (hasRequiredFields) {
            results[2].status = 'passed';
            results[2].details = `All required fields present: userId, balance, exchangeRate, usdValue`;
          } else {
            results[2].status = 'failed';
            results[2].details = `Missing fields in response: ${JSON.stringify(balanceData)}`;
          }
          
          // Step 4: Verify exchange rate calculation
          results.push({
            step: 4,
            description: 'Verifying USD value calculation',
            status: 'running'
          });
          
          const expectedUsdValue = balanceData.balance / parseFloat(balanceData.exchangeRate);
          const calculatedUsdValue = parseFloat(expectedUsdValue.toFixed(2));
          
          if (Math.abs(balanceData.usdValue - calculatedUsdValue) < 0.01) {
            results[3].status = 'passed';
            results[3].details = `USD calculation correct: ${balanceData.usdValue}`;
          } else {
            results[3].status = 'failed';
            results[3].details = `USD calculation incorrect: expected ${calculatedUsdValue}, got ${balanceData.usdValue}`;
          }
          
        } else {
          const errorData = await balanceResponse.json();
          results[1].status = 'failed';
          results[1].details = `Balance retrieval failed: ${errorData.error}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
      // Step 5: Test balance query for non-existent user
      results.push({
        step: 5,
        description: 'Testing balance query for non-existent user',
        status: 'running'
      });
      
      const nonExistentResponse = await fetch(`${API_BASE}/api/paws/balance?userId=non-existent-user`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (nonExistentResponse.status === 404) {
        const errorData = await nonExistentResponse.json();
        results[4].status = 'passed';
        results[4].details = `Non-existent user correctly handled: ${errorData.error}`;
      } else {
        results[4].status = 'failed';
        results[4].details = `Expected HTTP 404, got ${nonExistentResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'PAWS balance test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};