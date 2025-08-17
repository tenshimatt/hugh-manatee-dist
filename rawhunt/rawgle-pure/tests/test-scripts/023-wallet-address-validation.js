// Test Script 023: Wallet Address Validation
// Purpose: Test validation of Solana wallet address formats
// Expected: Only valid Solana addresses should be accepted

export default {
  id: '023',
  name: 'Wallet Address Validation',
  description: 'Tests validation of Solana wallet address formats during registration and linking',
  category: 'Authentication',
  priority: 'Medium',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    const invalidWallets = [
      { address: 'too-short', name: 'Too short address' },
      { address: '0x1234567890abcdef1234567890abcdef12345678', name: 'Ethereum format' },
      { address: 'invalid-characters-!@#$%^&*()', name: 'Invalid characters' },
      { address: '1234567890123456789012345678901234567890123456789012345678901234', name: 'Too long address' },
      { address: '', name: 'Empty address' }
    ];
    
    const validWallet = 'E9mnWdbp97pGaUTGRP743KhppWkYzkagWo7JM3hRJsHA';
    
    try {
      // Test invalid wallet addresses during registration
      for (let i = 0; i < invalidWallets.length; i++) {
        const test = invalidWallets[i];
        
        results.push({
          step: i + 1,
          description: `Testing invalid wallet during registration: ${test.name}`,
          status: 'running'
        });
        
        const response = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `wallet-test-${Date.now()}-${i}@rawgle.com`,
            password: 'ValidPass123!',
            walletAddress: test.address
          })
        });
        
        if (response.status === 400) {
          const errorData = await response.json();
          results[i].status = 'passed';
          results[i].details = `Correctly rejected: ${errorData.error}`;
        } else {
          results[i].status = 'failed';
          results[i].details = `Expected HTTP 400, got ${response.status}`;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Step 6: Test valid wallet address during registration
      results.push({
        step: 6,
        description: 'Testing valid wallet address during registration',
        status: 'running'
      });
      
      const validWalletResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `valid-wallet-${Date.now()}@rawgle.com`,
          password: 'ValidPass123!',
          walletAddress: validWallet
        })
      });
      
      if (validWalletResponse.status === 201) {
        const data = await validWalletResponse.json();
        results[5].status = 'passed';
        results[5].details = `Valid wallet accepted: ${data.walletAddress}`;
      } else {
        results[5].status = 'failed';
        results[5].details = `Valid wallet rejected: ${validWalletResponse.status}`;
      }
      
      // Step 7: Test wallet validation during linking
      results.push({
        step: 7,
        description: 'Testing wallet validation during linking',
        status: 'running'
      });
      
      // Create user without wallet first
      const userResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `linking-test-${Date.now()}@rawgle.com`,
          password: 'LinkingTest123!'
        })
      });
      
      if (userResponse.status === 201) {
        const userData = await userResponse.json();
        
        // Try to link invalid wallet
        const linkInvalidResponse = await fetch(`${API_BASE}/api/auth/link-wallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.sessionToken}`
          },
          body: JSON.stringify({
            walletAddress: 'invalid-wallet-format',
            signature: 'mock-signature'
          })
        });
        
        if (linkInvalidResponse.status === 400) {
          const errorData = await linkInvalidResponse.json();
          results[6].status = 'passed';
          results[6].details = `Invalid wallet linking correctly rejected: ${errorData.error}`;
        } else {
          results[6].status = 'failed';
          results[6].details = `Expected HTTP 400, got ${linkInvalidResponse.status}`;
        }
      } else {
        results[6].status = 'failed';
        results[6].details = `User creation for linking test failed: ${userResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Wallet validation test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};