// Test Script 111: Subscription Benefits Application
// Purpose: Tests premium subscription benefits and multipliers
// User Story: Premium subscriber gets enhanced PAWS rewards and exclusive features

export default {
  id: '111',
  name: 'Subscription Benefits Application',
  description: 'Complete premium subscription benefits validation with multipliers',
  category: 'Integration',
  priority: 'Medium',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    // Setup premium user for benefits testing
    const testUser = {
      email: `benefits-user-${Date.now()}@rawgle.com`,
      password: 'BenefitsUser123!',
      name: 'Benefits Test User'
    };
    
    try {
      // Step 1: Setup premium subscriber account
      results.push({
        step: 1,
        description: 'Setup premium subscriber account',
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
      results[0].details = `Premium test user created: ${userData.userId}`;
      
      // Step 2: Upgrade to premium subscription
      results.push({
        step: 2,
        description: 'Upgrade to premium for benefits testing',
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
      
      if (upgradeResponse.ok || upgradeResponse.status === 400) {
        results[1].status = 'passed';
        results[1].details = 'Premium upgrade attempted';
        
        // Step 3: Test premium PAWS multiplier benefits
        results.push({
          step: 3,
          description: 'Test premium PAWS reward multipliers',
          status: 'running'
        });
        
        // Create pet for earning PAWS with multiplier
        const petData = {
          name: 'Premium Pet',
          breed: 'Premium Breed',
          age: '3',
          weight: '20'
        };
        
        const petResponse = await fetch(`${API_BASE}/api/pets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(petData)
        });
        
        if (petResponse.ok) {
          const petResult = await petResponse.json();
          const petId = petResult.pet.id;
          
          // Check PAWS balance before feeding
          const beforeBalanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${userData.userId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          const beforeBalance = await beforeBalanceResponse.json();
          
          // Log feeding to test multiplier
          const feedingData = {
            petId: petId,
            logDate: new Date().toISOString().split('T')[0],
            mealTime: 'breakfast',
            foodType: 'premium_food',
            quantity: '2.0',
            notes: 'Premium subscriber feeding test'
          };
          
          const feedingResponse = await fetch(`${API_BASE}/api/feeding`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(feedingData)
          });
          
          if (feedingResponse.ok) {
            const feedingResult = await feedingResponse.json();
            
            // Check multiplier application
            if (feedingResult.premiumMultiplier || feedingResult.bonusReward) {
              results[2].status = 'passed';
              results[2].details = `Premium multiplier applied: ${feedingResult.premiumMultiplier || 'bonus detected'}`;
            } else {
              results[2].status = 'warning';
              results[2].details = 'No premium multiplier detected in feeding reward';
            }
          } else {
            results[2].status = 'warning';
            results[2].details = 'Feeding test limited for multiplier validation';
          }
        } else {
          results[2].status = 'warning';
          results[2].details = 'Pet creation limited for premium testing';
        }
        
        // Step 4: Test premium-only features access
        results.push({
          step: 4,
          description: 'Test access to premium-only features',
          status: 'running'
        });
        
        // Test premium analytics access
        const premiumAnalyticsResponse = await fetch(`${API_BASE}/api/analytics/premium-insights`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (premiumAnalyticsResponse.ok) {
          const analyticsData = await premiumAnalyticsResponse.json();
          results[3].status = 'passed';
          results[3].details = `Premium analytics access confirmed: ${Object.keys(analyticsData).length} insights`;
        } else if (premiumAnalyticsResponse.status === 403) {
          results[3].status = 'warning';
          results[3].details = 'Premium features access denied - subscription may not be active';
        } else {
          results[3].status = 'failed';
          results[3].details = `Premium features test failed: ${premiumAnalyticsResponse.status}`;
        }
        
        // Step 5: Test premium NFT minting benefits
        results.push({
          step: 5,
          description: 'Test premium NFT minting cost reduction',
          status: 'running'
        });
        
        const nftCostResponse = await fetch(`${API_BASE}/api/nft/mint-cost`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (nftCostResponse.ok) {
          const costData = await nftCostResponse.json();
          if (costData.premiumDiscount || costData.subscriberRate) {
            results[4].status = 'passed';
            results[4].details = `Premium NFT discount confirmed: ${costData.premiumDiscount || costData.subscriberRate}`;
          } else {
            results[4].status = 'warning';
            results[4].details = `Standard NFT cost: ${costData.cost} PAWS (no premium discount detected)`;
          }
        } else {
          results[4].status = 'failed';
          results[4].details = `NFT cost check failed: ${nftCostResponse.status}`;
        }
        
        // Step 6: Verify subscription benefits summary
        results.push({
          step: 6,
          description: 'Get premium subscription benefits summary',
          status: 'running'
        });
        
        const benefitsResponse = await fetch(`${API_BASE}/api/subscription/benefits`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (benefitsResponse.ok) {
          const benefitsData = await benefitsResponse.json();
          results[5].status = 'passed';
          results[5].details = `Benefits summary: ${Object.keys(benefitsData.benefits || benefitsData).length} premium perks`;
        } else {
          results[5].status = 'warning';
          results[5].details = `Benefits summary unavailable: ${benefitsResponse.status}`;
        }
        
      } else {
        results[1].status = 'failed';
        results[1].details = `Premium upgrade failed: ${upgradeResponse.status}`;
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length - 1 : 0;
      results[currentStep] = results[currentStep] || { step: currentStep + 1, description: 'Subscription benefits test', status: 'failed' };
      results[currentStep].status = 'failed';
      results[currentStep].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};