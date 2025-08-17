// Test Script 024: Missing Required Fields Validation
// Purpose: Test validation of required fields in authentication requests
// Expected: HTTP 400 error when required fields are missing

export default {
  id: '024',
  name: 'Missing Required Fields Validation',
  description: 'Tests validation of required fields in authentication and wallet linking requests',
  category: 'Authentication',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      // Step 1: Test registration with missing email
      results.push({
        step: 1,
        description: 'Testing registration with missing email',
        status: 'running'
      });
      
      const missingEmailResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'ValidPass123!'
        })
      });
      
      if (missingEmailResponse.status === 400) {
        const errorData = await missingEmailResponse.json();
        results[0].status = 'passed';
        results[0].details = `Missing email correctly rejected: ${errorData.error}`;
      } else {
        results[0].status = 'failed';
        results[0].details = `Expected HTTP 400, got ${missingEmailResponse.status}`;
      }
      
      // Step 2: Test registration with missing password
      results.push({
        step: 2,
        description: 'Testing registration with missing password',
        status: 'running'
      });
      
      const missingPasswordResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `missing-pass-${Date.now()}@rawgle.com`
        })
      });
      
      if (missingPasswordResponse.status === 400) {
        const errorData = await missingPasswordResponse.json();
        results[1].status = 'passed';
        results[1].details = `Missing password correctly rejected: ${errorData.error}`;
      } else {
        results[1].status = 'failed';
        results[1].details = `Expected HTTP 400, got ${missingPasswordResponse.status}`;
      }
      
      // Step 3: Test login with missing email
      results.push({
        step: 3,
        description: 'Testing login with missing email',
        status: 'running'
      });
      
      const loginMissingEmailResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'SomePassword123!'
        })
      });
      
      if (loginMissingEmailResponse.status === 400) {
        const errorData = await loginMissingEmailResponse.json();
        results[2].status = 'passed';
        results[2].details = `Login missing email correctly rejected: ${errorData.error}`;
      } else {
        results[2].status = 'failed';
        results[2].details = `Expected HTTP 400, got ${loginMissingEmailResponse.status}`;
      }
      
      // Step 4: Test login with missing password
      results.push({
        step: 4,
        description: 'Testing login with missing password',
        status: 'running'
      });
      
      const loginMissingPasswordResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `login-test-${Date.now()}@rawgle.com`
        })
      });
      
      if (loginMissingPasswordResponse.status === 400) {
        const errorData = await loginMissingPasswordResponse.json();
        results[3].status = 'passed';
        results[3].details = `Login missing password correctly rejected: ${errorData.error}`;
      } else {
        results[3].status = 'failed';
        results[3].details = `Expected HTTP 400, got ${loginMissingPasswordResponse.status}`;
      }
      
      // Step 5: Test wallet linking with missing fields
      const userResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `wallet-link-test-${Date.now()}@rawgle.com`,
          password: 'WalletLinkTest123!'
        })
      });
      
      if (userResponse.status === 201) {
        const userData = await userResponse.json();
        
        results.push({
          step: 5,
          description: 'Testing wallet linking with missing wallet address',
          status: 'running'
        });
        
        const missingWalletResponse = await fetch(`${API_BASE}/api/auth/link-wallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.sessionToken}`
          },
          body: JSON.stringify({
            signature: 'mock-signature'
          })
        });
        
        if (missingWalletResponse.status === 400) {
          const errorData = await missingWalletResponse.json();
          results[4].status = 'passed';
          results[4].details = `Missing wallet address correctly rejected: ${errorData.error}`;
        } else {
          results[4].status = 'failed';
          results[4].details = `Expected HTTP 400, got ${missingWalletResponse.status}`;
        }
        
        // Step 6: Test wallet linking with missing signature
        results.push({
          step: 6,
          description: 'Testing wallet linking with missing signature',
          status: 'running'
        });
        
        const missingSignatureResponse = await fetch(`${API_BASE}/api/auth/link-wallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.sessionToken}`
          },
          body: JSON.stringify({
            walletAddress: 'E9mnWdbp97pGaUTGRP743KhppWkYzkagWo7JM3hRJsHA'
          })
        });
        
        if (missingSignatureResponse.status === 400) {
          const errorData = await missingSignatureResponse.json();
          results[5].status = 'passed';
          results[5].details = `Missing signature correctly rejected: ${errorData.error}`;
        } else {
          results[5].status = 'failed';
          results[5].details = `Expected HTTP 400, got ${missingSignatureResponse.status}`;
        }
      } else {
        results.push({
          step: 5,
          description: 'Creating user for wallet linking tests',
          status: 'failed',
          details: `User creation failed: ${userResponse.status}`
        });
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Required fields validation test', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};