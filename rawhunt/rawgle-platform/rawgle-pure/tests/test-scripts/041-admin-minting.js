// Test Script 041: Admin Minting Privileges
// Purpose: Test admin-only PAWS minting capabilities and access control
// Expected: Only admin users can mint PAWS directly, regular users are denied

export default {
  id: '041',
  name: 'Admin Minting Privileges',
  description: 'Tests admin-only PAWS minting capabilities and proper access control enforcement',
  category: 'PAWS',
  priority: 'Critical',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const adminEmail = `admin-minting-${Date.now()}@rawgle.com`;
      const userEmail = `user-minting-${Date.now()}@rawgle.com`;
      
      // Step 1: Create admin user
      results.push({
        step: 1,
        description: 'Creating admin user for minting privileges test',
        status: 'running'
      });
      
      const adminRegisterResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: 'AdminMinting123!',
          role: 'admin'
        })
      });
      
      if (adminRegisterResponse.status === 201) {
        const adminData = await adminRegisterResponse.json();
        results[0].status = 'passed';
        results[0].details = `Admin user created: ${adminData.userId}`;
        
        // Step 2: Create regular user
        results.push({
          step: 2,
          description: 'Creating regular user for access control test',
          status: 'running'
        });
        
        const userRegisterResponse = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            password: 'UserMinting123!'
          })
        });
        
        if (userRegisterResponse.status === 201) {
          const userData = await userRegisterResponse.json();
          results[1].status = 'passed';
          results[1].details = `Regular user created: ${userData.userId}`;
          
          // Step 3: Test admin PAWS minting
          results.push({
            step: 3,
            description: 'Testing admin PAWS minting capabilities',
            status: 'running'
          });
          
          const adminMintResponse = await fetch(`${API_BASE}/api/paws/admin/mint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              adminUserId: adminData.userId,
              targetUserId: userData.userId,
              amount: 100,
              reason: 'Admin minting test'
            })
          });
          
          if (adminMintResponse.status === 200) {
            const mintData = await adminMintResponse.json();
            results[2].status = 'passed';
            results[2].details = `Admin minting successful: ${mintData.amount} PAWS minted`;
            
            // Step 4: Verify target user balance increased
            results.push({
              step: 4,
              description: 'Verifying target user balance increased',
              status: 'running'
            });
            
            const balanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${userData.userId}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (balanceResponse.status === 200) {
              const balanceData = await balanceResponse.json();
              const expectedBalance = userData.pawsBalance + 100;
              
              if (balanceData.balance === expectedBalance) {
                results[3].status = 'passed';
                results[3].details = `Target user balance correctly increased to ${balanceData.balance} PAWS`;
              } else {
                results[3].status = 'failed';
                results[3].details = `Balance incorrect: expected ${expectedBalance}, got ${balanceData.balance}`;
              }
            } else {
              results[3].status = 'failed';
              results[3].details = `Failed to retrieve target user balance: ${balanceResponse.status}`;
            }
            
          } else {
            const errorData = await adminMintResponse.json();
            results[2].status = 'failed';
            results[2].details = `Admin minting failed: ${errorData.error}`;
          }
          
          // Step 5: Test regular user cannot mint
          results.push({
            step: 5,
            description: 'Testing regular user minting prevention',
            status: 'running'
          });
          
          const userMintResponse = await fetch(`${API_BASE}/api/paws/admin/mint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              adminUserId: userData.userId, // Regular user trying to mint
              targetUserId: userData.userId,
              amount: 50,
              reason: 'Unauthorized minting attempt'
            })
          });
          
          if (userMintResponse.status === 403 || userMintResponse.status === 401) {
            const errorData = await userMintResponse.json();
            results[4].status = 'passed';
            results[4].details = `Regular user minting correctly prevented: ${errorData.error}`;
          } else if (userMintResponse.status === 200) {
            results[4].status = 'failed';
            results[4].details = 'Regular user was allowed to mint PAWS - security breach!';
          } else {
            results[4].status = 'warning';
            results[4].details = `Unexpected response for user minting: ${userMintResponse.status}`;
          }
          
          // Step 6: Test admin minting with invalid parameters
          results.push({
            step: 6,
            description: 'Testing admin minting parameter validation',
            status: 'running'
          });
          
          const invalidMintResponse = await fetch(`${API_BASE}/api/paws/admin/mint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              adminUserId: adminData.userId,
              targetUserId: 'nonexistent-user',
              amount: -50, // Negative amount
              reason: 'Invalid parameter test'
            })
          });
          
          if (invalidMintResponse.status === 400 || invalidMintResponse.status === 422 || invalidMintResponse.status === 404) {
            const errorData = await invalidMintResponse.json();
            results[5].status = 'passed';
            results[5].details = `Invalid parameters correctly rejected: ${errorData.error}`;
          } else {
            results[5].status = 'failed';
            results[5].details = `Invalid parameters not properly validated: ${invalidMintResponse.status}`;
          }
          
          // Step 7: Test admin minting audit trail
          results.push({
            step: 7,
            description: 'Checking admin minting audit trail',
            status: 'running'
          });
          
          const auditResponse = await fetch(`${API_BASE}/api/paws/admin/mint-history?adminUserId=${adminData.userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (auditResponse.status === 200) {
            const auditData = await auditResponse.json();
            if (auditData.mintHistory && auditData.mintHistory.length > 0) {
              results[6].status = 'passed';
              results[6].details = `Audit trail present: ${auditData.mintHistory.length} minting records`;
            } else {
              results[6].status = 'warning';
              results[6].details = 'Audit trail endpoint exists but no records found';
            }
          } else if (auditResponse.status === 403) {
            results[6].status = 'warning';
            results[6].details = 'Audit trail endpoint requires higher privileges - good security practice';
          } else {
            results[6].status = 'warning';
            results[6].details = `Audit trail endpoint not available: ${auditResponse.status}`;
          }
          
        } else {
          results[1].status = 'failed';
          results[1].details = `Regular user registration failed: ${userRegisterResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `Admin user registration failed: ${adminRegisterResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Admin minting test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};