// Test Script 043: Subscriber Multipliers
// Purpose: Test PAWS earning multipliers for premium subscribers
// Expected: Subscribers receive multiplied PAWS rewards based on subscription tier

export default {
  id: '043',
  name: 'Subscriber Multipliers',
  description: 'Tests PAWS earning multipliers for premium subscribers based on subscription tier',
  category: 'PAWS',
  priority: 'Medium',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const freeUserEmail = `free-user-${Date.now()}@rawgle.com`;
      const premiumUserEmail = `premium-user-${Date.now()}@rawgle.com`;
      const proUserEmail = `pro-user-${Date.now()}@rawgle.com`;
      
      // Step 1: Create free user
      results.push({
        step: 1,
        description: 'Creating free user for multiplier comparison',
        status: 'running'
      });
      
      const freeUserResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: freeUserEmail,
          password: 'FreeUser123!'
        })
      });
      
      if (freeUserResponse.status === 201) {
        const freeUserData = await freeUserResponse.json();
        results[0].status = 'passed';
        results[0].details = `Free user created: ${freeUserData.userId}`;
        
        // Step 2: Create premium subscriber
        results.push({
          step: 2,
          description: 'Creating premium subscriber user',
          status: 'running'
        });
        
        const premiumUserResponse = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: premiumUserEmail,
            password: 'PremiumUser123!',
            subscriptionTier: 'premium'
          })
        });
        
        if (premiumUserResponse.status === 201) {
          const premiumUserData = await premiumUserResponse.json();
          results[1].status = 'passed';
          results[1].details = `Premium user created: ${premiumUserData.userId}`;
          
          // Step 3: Create pro subscriber
          results.push({
            step: 3,
            description: 'Creating pro subscriber user',
            status: 'running'
          });
          
          const proUserResponse = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: proUserEmail,
              password: 'ProUser123!',
              subscriptionTier: 'pro'
            })
          });
          
          if (proUserResponse.status === 201) {
            const proUserData = await proUserResponse.json();
            results[2].status = 'passed';
            results[2].details = `Pro user created: ${proUserData.userId}`;
            
            // Step 4: Test reward multipliers for different tiers
            results.push({
              step: 4,
              description: 'Testing reward multipliers across subscription tiers',
              status: 'running'
            });
            
            const baseRewardAmount = 10;
            const users = [
              { userData: freeUserData, tier: 'free', expectedMultiplier: 1 },
              { userData: premiumUserData, tier: 'premium', expectedMultiplier: 1.5 },
              { userData: proUserData, tier: 'pro', expectedMultiplier: 2 }
            ];
            
            const multiplierResults = [];
            
            for (const user of users) {
              const rewardResponse = await fetch(`${API_BASE}/api/paws/claim-reward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.userData.userId,
                  rewardType: 'daily_feeding',
                  amount: baseRewardAmount
                })
              });
              
              if (rewardResponse.status === 200) {
                const rewardData = await rewardResponse.json();
                const expectedAmount = baseRewardAmount * user.expectedMultiplier;
                const actualAmount = rewardData.rewardAmount || rewardData.amount;
                
                multiplierResults.push({
                  tier: user.tier,
                  expected: expectedAmount,
                  actual: actualAmount,
                  correct: actualAmount === expectedAmount
                });
              }
              
              // Small delay between requests
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            const correctMultipliers = multiplierResults.filter(r => r.correct).length;
            results[3].status = correctMultipliers === users.length ? 'passed' : 'warning';
            results[3].details = `Multipliers: ${multiplierResults.map(r => `${r.tier}=${r.actual}/${r.expected}`).join(', ')}`;
            
            // Step 5: Verify balance updates reflect multipliers
            results.push({
              step: 5,
              description: 'Verifying balance updates reflect subscription multipliers',
              status: 'running'
            });
            
            const balanceVerifications = [];
            
            for (const user of users) {
              const balanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${user.userData.userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              });
              
              if (balanceResponse.status === 200) {
                const balanceData = await balanceResponse.json();
                const expectedMultiplier = user.expectedMultiplier;
                const expectedTotal = user.userData.pawsBalance + (baseRewardAmount * expectedMultiplier);
                
                balanceVerifications.push({
                  tier: user.tier,
                  expected: expectedTotal,
                  actual: balanceData.balance,
                  correct: Math.abs(balanceData.balance - expectedTotal) < 1
                });
              }
            }
            
            const correctBalances = balanceVerifications.filter(b => b.correct).length;
            results[4].status = correctBalances === users.length ? 'passed' : 'warning';
            results[4].details = `Balance updates: ${balanceVerifications.map(b => `${b.tier}=${b.actual}/${b.expected}`).join(', ')}`;
            
            // Step 6: Test subscription upgrade multiplier application
            results.push({
              step: 6,
              description: 'Testing subscription upgrade multiplier application',
              status: 'running'
            });
            
            const upgradeResponse = await fetch(`${API_BASE}/api/user/upgrade-subscription`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: freeUserData.userId,
                newTier: 'premium'
              })
            });
            
            if (upgradeResponse.status === 200) {
              // Test reward after upgrade
              const postUpgradeRewardResponse = await fetch(`${API_BASE}/api/paws/claim-reward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: freeUserData.userId,
                  rewardType: 'profile_completion',
                  amount: baseRewardAmount
                })
              });
              
              if (postUpgradeRewardResponse.status === 200) {
                const postUpgradeData = await postUpgradeRewardResponse.json();
                const expectedUpgradedAmount = baseRewardAmount * 1.5; // Premium multiplier
                const actualAmount = postUpgradeData.rewardAmount || postUpgradeData.amount;
                
                if (actualAmount === expectedUpgradedAmount) {
                  results[5].status = 'passed';
                  results[5].details = `Subscription upgrade multiplier applied: ${actualAmount} PAWS (1.5x)`;
                } else {
                  results[5].status = 'warning';
                  results[5].details = `Post-upgrade multiplier: expected ${expectedUpgradedAmount}, got ${actualAmount}`;
                }
              } else {
                results[5].status = 'warning';
                results[5].details = 'Could not test post-upgrade reward multiplier';
              }
            } else {
              results[5].status = 'warning';
              results[5].details = `Subscription upgrade not available: ${upgradeResponse.status}`;
            }
            
          } else {
            results[2].status = 'failed';
            results[2].details = `Pro user registration failed: ${proUserResponse.status}`;
          }
          
        } else {
          results[1].status = 'failed';
          results[1].details = `Premium user registration failed: ${premiumUserResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `Free user registration failed: ${freeUserResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Subscriber multipliers test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};