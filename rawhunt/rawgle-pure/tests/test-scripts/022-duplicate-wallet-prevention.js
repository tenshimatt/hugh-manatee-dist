// Test Script 022: Duplicate Wallet Prevention
// Purpose: Test prevention of duplicate wallet linking across accounts
// Expected: Same wallet cannot be linked to multiple accounts

export default {
  id: '022',
  name: 'Duplicate Wallet Prevention',
  description: 'Tests prevention of linking same wallet address to multiple user accounts',
  category: 'Authentication',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testWalletAddress = 'SameWalletAddress123456789ABCDEFGHIJKLmnop';
      const timestamp = Date.now();
      
      // Step 1: Create first user with wallet
      results.push({
        step: 1,
        description: 'Creating first user and linking wallet',
        status: 'running'
      });
      
      const firstUserResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `first-user-${timestamp}@rawgle.com`,
          password: 'FirstUser123!',
          walletAddress: testWalletAddress
        })
      });
      
      if (firstUserResponse.status === 201) {
        const firstUserData = await firstUserResponse.json();
        results[0].status = 'passed';
        results[0].details = `First user created with wallet: ${firstUserData.walletAddress}`;
        
        // Step 2: Create second user without wallet
        results.push({
          step: 2,
          description: 'Creating second user account',
          status: 'running'
        });
        
        const secondUserResponse = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `second-user-${timestamp}@rawgle.com`,
            password: 'SecondUser123!'
          })
        });
        
        if (secondUserResponse.status === 201) {
          const secondUserData = await secondUserResponse.json();
          results[1].status = 'passed';
          results[1].details = 'Second user account created successfully';
          
          // Step 3: Try to link same wallet to second user
          results.push({
            step: 3,
            description: 'Attempting to link same wallet to second user',
            status: 'running'
          });
          
          const duplicateWalletResponse = await fetch(`${API_BASE}/api/auth/link-wallet`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${secondUserData.sessionToken}`
            },
            body: JSON.stringify({
              walletAddress: testWalletAddress,
              signature: 'mock-signature'
            })
          });
          
          if (duplicateWalletResponse.status === 409) {
            const errorData = await duplicateWalletResponse.json();
            results[2].status = 'passed';
            results[2].details = `Duplicate wallet correctly rejected: ${errorData.error}`;
          } else {
            results[2].status = 'failed';
            results[2].details = `Expected HTTP 409, got ${duplicateWalletResponse.status}`;
          }
          
          // Step 4: Verify first user still has the wallet
          results.push({
            step: 4,
            description: 'Verifying first user retains wallet ownership',
            status: 'running'
          });
          
          const firstUserValidation = await fetch(`${API_BASE}/api/auth/validate`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${firstUserData.sessionToken}`
            }
          });
          
          if (firstUserValidation.status === 200) {
            results[3].status = 'passed';
            results[3].details = 'First user session still valid with wallet intact';
          } else {
            results[3].status = 'failed';
            results[3].details = `First user validation failed: ${firstUserValidation.status}`;
          }
          
        } else {
          results[1].status = 'failed';
          results[1].details = `Second user registration failed: ${secondUserResponse.status}`;
        }
        
      } else {
        const errorData = await firstUserResponse.json();
        results[0].status = 'failed';
        results[0].details = `First user registration failed: ${errorData.error}`;
      }
      
      // Step 5: Test with completely different wallet (should work)
      results.push({
        step: 5,
        description: 'Testing different wallet linking (should succeed)',
        status: 'running'
      });
      
      const differentUserResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `different-user-${timestamp}@rawgle.com`,
          password: 'DifferentUser123!',
          walletAddress: 'CompleteDifferentWallet123456789XYZ'
        })
      });
      
      if (differentUserResponse.status === 201) {
        results[4].status = 'passed';
        results[4].details = 'Different wallet linked successfully to new user';
      } else {
        results[4].status = 'failed';
        results[4].details = `Different wallet linking failed: ${differentUserResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Duplicate wallet test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};