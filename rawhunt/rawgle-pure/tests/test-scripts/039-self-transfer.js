// Test Script 039: Self-Transfer Prevention
// Purpose: Test that users cannot transfer PAWS to themselves
// Expected: HTTP 400 with validation error for self-transfer attempts

export default {
  id: '039',
  name: 'Self-Transfer Prevention',
  description: 'Tests that users cannot transfer PAWS to themselves, preventing circular transactions',
  category: 'PAWS',
  priority: 'Low',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `self-transfer-${Date.now()}@rawgle.com`;
      
      // Step 1: Create test user
      results.push({
        step: 1,
        description: 'Creating test user for self-transfer testing',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'SelfTransfer123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = `Test user created: ${userData.userId} with ${userData.pawsBalance} PAWS`;
        
        // Step 2: Attempt self-transfer with same user ID
        results.push({
          step: 2,
          description: 'Attempting self-transfer with same user ID',
          status: 'running'
        });
        
        const selfTransferResponse = await fetch(`${API_BASE}/api/paws/transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromUserId: userData.userId,
            toUserId: userData.userId,
            amount: 10,
            note: 'Self-transfer test'
          })
        });
        
        if (selfTransferResponse.status === 400 || selfTransferResponse.status === 422) {
          const errorData = await selfTransferResponse.json();
          if (errorData.error && (errorData.error.toLowerCase().includes('self') || 
                                  errorData.error.toLowerCase().includes('same'))) {
            results[1].status = 'passed';
            results[1].details = `Self-transfer correctly prevented: ${errorData.error}`;
          } else {
            results[1].status = 'warning';
            results[1].details = `Transfer rejected but error message unclear: ${errorData.error}`;
          }
        } else if (selfTransferResponse.status === 200) {
          results[1].status = 'failed';
          results[1].details = 'Self-transfer succeeded when it should have been prevented';
        } else {
          results[1].status = 'failed';
          results[1].details = `Unexpected response for self-transfer: ${selfTransferResponse.status}`;
        }
        
        // Step 3: Verify balance unchanged after self-transfer attempt
        results.push({
          step: 3,
          description: 'Verifying balance unchanged after self-transfer attempt',
          status: 'running'
        });
        
        const balanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${userData.userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (balanceResponse.status === 200) {
          const balanceData = await balanceResponse.json();
          if (balanceData.balance === userData.pawsBalance) {
            results[2].status = 'passed';
            results[2].details = `Balance unchanged: ${balanceData.balance} PAWS`;
          } else {
            results[2].status = 'failed';
            results[2].details = `Balance changed unexpectedly: ${balanceData.balance} (expected ${userData.pawsBalance})`;
          }
        } else {
          results[2].status = 'failed';
          results[2].details = `Failed to retrieve balance: ${balanceResponse.status}`;
        }
        
        // Step 4: Test with various self-referential edge cases
        results.push({
          step: 4,
          description: 'Testing edge cases for self-transfer detection',
          status: 'running'
        });
        
        const edgeCaseTransfers = [
          { amount: 1, note: 'Minimal self-transfer' },
          { amount: userData.pawsBalance, note: 'Full balance self-transfer' },
          { amount: 0.01, note: 'Fractional self-transfer' }
        ];
        
        let edgeCasesPassed = 0;
        
        for (const testCase of edgeCaseTransfers) {
          const response = await fetch(`${API_BASE}/api/paws/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromUserId: userData.userId,
              toUserId: userData.userId,
              amount: testCase.amount,
              note: testCase.note
            })
          });
          
          if (response.status === 400 || response.status === 422) {
            edgeCasesPassed++;
          }
          
          // Small delay between attempts
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (edgeCasesPassed === edgeCaseTransfers.length) {
          results[3].status = 'passed';
          results[3].details = `All ${edgeCasesPassed}/${edgeCaseTransfers.length} edge cases properly prevented`;
        } else {
          results[3].status = 'warning';
          results[3].details = `${edgeCasesPassed}/${edgeCaseTransfers.length} edge cases prevented - some may have been allowed`;
        }
        
        // Step 5: Final balance verification
        results.push({
          step: 5,
          description: 'Final balance verification after all self-transfer attempts',
          status: 'running'
        });
        
        const finalBalanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${userData.userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (finalBalanceResponse.status === 200) {
          const finalBalanceData = await finalBalanceResponse.json();
          if (finalBalanceData.balance === userData.pawsBalance) {
            results[4].status = 'passed';
            results[4].details = `Final balance confirmed unchanged: ${finalBalanceData.balance} PAWS`;
          } else {
            results[4].status = 'failed';
            results[4].details = `Final balance changed: ${finalBalanceData.balance} (expected ${userData.pawsBalance})`;
          }
        } else {
          results[4].status = 'failed';
          results[4].details = `Failed to retrieve final balance: ${finalBalanceResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Self-transfer test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};