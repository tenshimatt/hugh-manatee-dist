// Test Script 019: User Logout and Session Invalidation
// Purpose: Test user logout process and session token invalidation
// Expected: Session token should be invalidated after logout

export default {
  id: '019',
  name: 'User Logout and Session Invalidation',
  description: 'Tests user logout process and proper invalidation of session tokens',
  category: 'Authentication',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `logout-test-${Date.now()}@rawgle.com`;
      const testPassword = 'LogoutTest123!';
      
      // Step 1: Register user and get session token
      results.push({
        step: 1,
        description: 'Creating user and obtaining session token',
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
        results[0].details = 'User created and session token obtained';
        
        // Step 2: Verify session is valid before logout
        results.push({
          step: 2,
          description: 'Verifying session is valid before logout',
          status: 'running'
        });
        
        const preLogoutValidation = await fetch(`${API_BASE}/api/auth/validate`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        
        if (preLogoutValidation.status === 200) {
          results[1].status = 'passed';
          results[1].details = 'Session valid before logout';
          
          // Step 3: Perform logout
          results.push({
            step: 3,
            description: 'Performing user logout',
            status: 'running'
          });
          
          const logoutResponse = await fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionToken}`
            }
          });
          
          if (logoutResponse.status === 200) {
            const logoutData = await logoutResponse.json();
            results[2].status = 'passed';
            results[2].details = `Logout successful: ${logoutData.message}`;
            
            // Step 4: Verify session is invalidated after logout
            results.push({
              step: 4,
              description: 'Verifying session invalidation after logout',
              status: 'running'
            });
            
            const postLogoutValidation = await fetch(`${API_BASE}/api/auth/validate`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${sessionToken}`
              }
            });
            
            if (postLogoutValidation.status === 401) {
              const errorData = await postLogoutValidation.json();
              results[3].status = 'passed';
              results[3].details = `Session correctly invalidated: ${errorData.error}`;
            } else {
              results[3].status = 'failed';
              results[3].details = `Session still valid after logout: ${postLogoutValidation.status}`;
            }
            
          } else {
            const errorData = await logoutResponse.json();
            results[2].status = 'failed';
            results[2].details = `Logout failed: ${errorData.error}`;
          }
          
        } else {
          results[1].status = 'failed';
          results[1].details = `Pre-logout session validation failed: ${preLogoutValidation.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Logout test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};