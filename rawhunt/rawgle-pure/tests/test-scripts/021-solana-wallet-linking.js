// Test Script 021: Solana Wallet Linking
// Purpose: Test linking Solana wallet addresses to user accounts
// Expected: Valid Solana wallet should link successfully to user account

export default {
  id: '021',
  name: 'Solana Wallet Linking',
  description: 'Tests linking of Solana wallet addresses to user accounts',
  category: 'Authentication',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `wallet-test-${Date.now()}@rawgle.com`;
      const testPassword = 'WalletTest123!';
      const testWalletAddress = '7xKXtg2CW87d7TXQ5xjBR3Eqm3kqPgFNkpHBgzXPMwQf';
      
      // Step 1: Register user and get session token
      results.push({
        step: 1,
        description: 'Creating user account',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });
      
      if (registerResponse.status === 201) {
        const registerData = await registerResponse.json();
        const sessionToken = registerData.sessionToken;
        
        results[0].status = 'passed';
        results[0].details = 'User account created successfully';
        
        // Step 2: Link Solana wallet to account
        results.push({
          step: 2,
          description: 'Linking Solana wallet to account',
          status: 'running'
        });
        
        const linkWalletResponse = await fetch(`${API_BASE}/api/auth/link-wallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({
            walletAddress: testWalletAddress,
            signature: 'mock-signature-for-testing'
          })
        });
        
        if (linkWalletResponse.status === 200) {
          const linkData = await linkWalletResponse.json();
          results[1].status = 'passed';
          results[1].details = `Wallet linked successfully: ${linkData.walletAddress}`;
          
          // Step 3: Verify NFT holder status is checked
          results.push({
            step: 3,
            description: 'Verifying NFT holder status detection',
            status: linkData.nftHolderStatus !== undefined ? 'passed' : 'failed',
            details: `NFT holder status: ${JSON.stringify(linkData.nftHolderStatus)}`
          });
          
        } else {
          const errorData = await linkWalletResponse.json();
          results[1].status = 'failed';
          results[1].details = `Wallet linking failed: ${errorData.error}`;
        }
        
        // Step 4: Test linking invalid wallet address
        results.push({
          step: 4,
          description: 'Testing invalid wallet address rejection',
          status: 'running'
        });
        
        const invalidWalletResponse = await fetch(`${API_BASE}/api/auth/link-wallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({
            walletAddress: 'invalid-wallet-address',
            signature: 'mock-signature'
          })
        });
        
        if (invalidWalletResponse.status === 400) {
          const errorData = await invalidWalletResponse.json();
          results[3].status = 'passed';
          results[3].details = `Invalid wallet correctly rejected: ${errorData.error}`;
        } else {
          results[3].status = 'failed';
          results[3].details = `Expected HTTP 400, got ${invalidWalletResponse.status}`;
        }
        
        // Step 5: Test wallet linking without authentication
        results.push({
          step: 5,
          description: 'Testing wallet linking without authentication',
          status: 'running'
        });
        
        const unauthWalletResponse = await fetch(`${API_BASE}/api/auth/link-wallet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: testWalletAddress,
            signature: 'mock-signature'
          })
        });
        
        if (unauthWalletResponse.status === 401) {
          const errorData = await unauthWalletResponse.json();
          results[4].status = 'passed';
          results[4].details = `Unauthenticated request correctly rejected: ${errorData.error}`;
        } else {
          results[4].status = 'failed';
          results[4].details = `Expected HTTP 401, got ${unauthWalletResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Wallet linking test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};