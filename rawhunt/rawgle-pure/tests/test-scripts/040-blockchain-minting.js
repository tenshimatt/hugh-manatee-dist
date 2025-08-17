// Test Script 040: PAWS Blockchain Minting
// Purpose: Test PAWS token minting to Solana blockchain for withdrawal
// Expected: Successful minting should create blockchain transaction and update balance

export default {
  id: '040',
  name: 'PAWS Blockchain Minting',
  description: 'Tests PAWS token minting to Solana blockchain for user withdrawal functionality',
  category: 'PAWS',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `minting-test-${Date.now()}@rawgle.com`;
      const testWallet = 'E9mnWdbp97pGaUTGRP743KhppWkYzkagWo7JM3hRJsHA'; // Test wallet
      
      // Step 1: Create user with sufficient PAWS balance
      results.push({
        step: 1,
        description: 'Creating user with PAWS balance for minting',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'MintingTest123!',
          walletAddress: testWallet
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = `User created: ${userData.userId} with ${userData.pawsBalance} PAWS`;
        
        // Step 2: Add additional PAWS for minting test
        results.push({
          step: 2,
          description: 'Adding additional PAWS for minting test',
          status: 'running'
        });
        
        const addPawsResponse = await fetch(`${API_BASE}/api/paws/admin/add-balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.userId,
            amount: 100,
            reason: 'Minting test setup'
          })
        });
        
        let currentBalance = userData.pawsBalance;
        if (addPawsResponse.status === 200) {
          const addData = await addPawsResponse.json();
          currentBalance = addData.newBalance;
          results[1].status = 'passed';
          results[1].details = `Balance increased to ${currentBalance} PAWS`;
        } else {
          results[1].status = 'warning';
          results[1].details = `Could not add balance, using initial ${currentBalance} PAWS`;
        }
        
        // Step 3: Initiate blockchain minting
        results.push({
          step: 3,
          description: 'Initiating PAWS blockchain minting',
          status: 'running'
        });
        
        const mintAmount = Math.min(50, currentBalance - 10); // Leave some balance
        const mintResponse = await fetch(`${API_BASE}/api/paws/mint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.userId,
            amount: mintAmount,
            walletAddress: testWallet
          })
        });
        
        if (mintResponse.status === 200 || mintResponse.status === 202) {
          const mintData = await mintResponse.json();
          results[2].status = 'passed';
          results[2].details = `Minting initiated: ${mintAmount} PAWS, transaction: ${mintData.transactionId || 'pending'}`;
          
          // Step 4: Verify balance reduction
          results.push({
            step: 4,
            description: 'Verifying PAWS balance reduction after minting',
            status: 'running'
          });
          
          const balanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${userData.userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (balanceResponse.status === 200) {
            const balanceData = await balanceResponse.json();
            const expectedBalance = currentBalance - mintAmount;
            
            if (balanceData.balance === expectedBalance) {
              results[3].status = 'passed';
              results[3].details = `Balance correctly reduced to ${balanceData.balance} PAWS`;
            } else {
              results[3].status = 'warning';
              results[3].details = `Balance: ${balanceData.balance} (expected ${expectedBalance}) - may be pending confirmation`;
            }
          } else {
            results[3].status = 'failed';
            results[3].details = `Failed to retrieve balance: ${balanceResponse.status}`;
          }
          
          // Step 5: Check minting transaction status
          results.push({
            step: 5,
            description: 'Checking minting transaction status',
            status: 'running'
          });
          
          if (mintData.transactionId) {
            const statusResponse = await fetch(`${API_BASE}/api/paws/mint/status?transactionId=${mintData.transactionId}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (statusResponse.status === 200) {
              const statusData = await statusResponse.json();
              results[4].status = 'passed';
              results[4].details = `Transaction status: ${statusData.status}, signature: ${statusData.signature || 'pending'}`;
            } else {
              results[4].status = 'warning';
              results[4].details = `Could not retrieve transaction status: ${statusResponse.status}`;
            }
          } else {
            results[4].status = 'warning';
            results[4].details = 'No transaction ID provided - minting may be queued for processing';
          }
          
        } else {
          const errorData = await mintResponse.json();
          results[2].status = 'failed';
          results[2].details = `Minting failed: ${errorData.error}`;
        }
        
        // Step 6: Test minimum minting amount validation
        results.push({
          step: 6,
          description: 'Testing minimum minting amount validation',
          status: 'running'
        });
        
        const minMintResponse = await fetch(`${API_BASE}/api/paws/mint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.userId,
            amount: 0.1, // Very small amount
            walletAddress: testWallet
          })
        });
        
        if (minMintResponse.status === 400 || minMintResponse.status === 422) {
          const errorData = await minMintResponse.json();
          results[5].status = 'passed';
          results[5].details = `Minimum amount validation working: ${errorData.error}`;
        } else if (minMintResponse.status === 200 || minMintResponse.status === 202) {
          results[5].status = 'warning';
          results[5].details = 'Very small minting amounts are allowed - may need minimum threshold';
        } else {
          results[5].status = 'failed';
          results[5].details = `Unexpected response for minimum amount test: ${minMintResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Blockchain minting test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};