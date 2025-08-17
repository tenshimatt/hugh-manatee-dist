// Test Script 110: Subscription Upgrade
// Purpose: Tests subscription upgrade workflow with PAWS payment
// User Story: Free user upgrades to premium subscription for enhanced features

export default {
  id: '110',
  name: 'Subscription Upgrade',
  description: 'Complete subscription upgrade workflow with PAWS payment validation',
  category: 'Integration',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    // Setup test user for subscription upgrade
    const testUser = {
      email: `subscription-user-${Date.now()}@rawgle.com`,
      password: 'SubscriptionUser123!',
      name: 'Subscription Test User'
    };
    
    try {
      // Step 1: Setup free user account
      results.push({
        step: 1,
        description: 'Create free user account for subscription upgrade',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      });
      
      if (!registerResponse.ok) {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
        return results;
      }
      
      const userData = await registerResponse.json();
      
      // Login to get auth token
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
      
      const loginData = await loginResponse.json();
      const authToken = loginData.sessionToken;
      
      results[0].status = 'passed';
      results[0].details = `Free user created: ${userData.userId}`;
      
      // Step 2: Check available subscription tiers
      results.push({
        step: 2,
        description: 'Check available subscription tiers and pricing',
        status: 'running'
      });
      
      const tiersResponse = await fetch(`${API_BASE}/api/subscription/tiers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (tiersResponse.ok) {
        const tiersData = await tiersResponse.json();
        results[1].status = 'passed';
        results[1].details = `Available tiers: ${tiersData.tiers?.length || 0} options`;
        
        // Step 3: Check current PAWS balance
        results.push({
          step: 3,
          description: 'Check PAWS balance for subscription payment',
          status: 'running'
        });
        
        const balanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${userData.userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          results[2].status = 'passed';
          results[2].details = `Current PAWS balance: ${balanceData.balance}`;
          
          // Step 4: Attempt subscription upgrade
          results.push({
            step: 4,
            description: 'Upgrade to premium subscription',
            status: 'running'
          });
          
          const upgradeData = {
            tier: 'premium',
            paymentMethod: 'paws',
            duration: 'monthly'
          };
          
          const upgradeResponse = await fetch(`${API_BASE}/api/subscription/upgrade`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(upgradeData)
          });
          
          if (upgradeResponse.ok) {
            const upgradeResult = await upgradeResponse.json();
            results[3].status = 'passed';
            results[3].details = `Upgrade successful: ${upgradeResult.subscription?.tier || 'premium'} until ${upgradeResult.subscription?.expiresAt || 'N/A'}`;
            
            // Step 5: Verify subscription status
            results.push({
              step: 5,
              description: 'Verify subscription status and benefits',
              status: 'running'
            });
            
            const statusResponse = await fetch(`${API_BASE}/api/subscription/status`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData.tier === 'premium' || statusData.isPremium) {
                results[4].status = 'passed';
                results[4].details = `Premium status confirmed: ${statusData.tier || 'premium'}`;
              } else {
                results[4].status = 'failed';
                results[4].details = `Subscription not activated: ${statusData.tier || 'free'}`;
              }
            } else {
              results[4].status = 'failed';
              results[4].details = `Status check failed: ${statusResponse.status}`;
            }
            
            // Step 6: Verify PAWS deduction
            results.push({
              step: 6,
              description: 'Verify PAWS deducted for subscription payment',
              status: 'running'
            });
            
            const newBalanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${userData.userId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });
            
            if (newBalanceResponse.ok) {
              const newBalanceData = await newBalanceResponse.json();
              const deducted = balanceData.balance - newBalanceData.balance;
              
              if (deducted > 0) {
                results[5].status = 'passed';
                results[5].details = `${deducted} PAWS deducted, ${newBalanceData.balance} remaining`;
              } else {
                results[5].status = 'warning';
                results[5].details = `No PAWS deducted: ${newBalanceData.balance} balance`;
              }
            } else {
              results[5].status = 'failed';
              results[5].details = `Balance check failed: ${newBalanceResponse.status}`;
            }
            
          } else if (upgradeResponse.status === 400) {
            const errorData = await upgradeResponse.json();
            results[3].status = 'warning';
            results[3].details = `Upgrade failed: ${errorData.message || 'Insufficient PAWS or validation error'}`;
          } else {
            results[3].status = 'failed';
            results[3].details = `Upgrade failed: ${upgradeResponse.status}`;
          }
          
        } else {
          results[2].status = 'failed';
          results[2].details = `Balance check failed: ${balanceResponse.status}`;
        }
        
      } else {
        results[1].status = 'failed';
        results[1].details = `Tiers query failed: ${tiersResponse.status}`;
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length - 1 : 0;
      results[currentStep] = results[currentStep] || { step: currentStep + 1, description: 'Subscription upgrade test', status: 'failed' };
      results[currentStep].status = 'failed';
      results[currentStep].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};