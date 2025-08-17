// Test Script 105: Profile Completion PAWS Earning
// Purpose: Tests PAWS earning through gradual profile completion
// User Story: User earns PAWS by completing different sections of their profile

export default {
  id: '105',
  name: 'Profile Completion PAWS Earning',
  description: 'Complete profile completion workflow with incremental PAWS rewards',
  category: 'Integration',
  priority: 'Medium',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    // Setup test user for profile completion
    const testUser = {
      email: `profile-completer-${Date.now()}@rawgle.com`,
      password: 'ProfileCompleter123!',
      name: 'Profile Completion Test'
    };
    
    try {
      // Step 1: Create user and check initial profile state
      results.push({
        step: 1,
        description: 'Create user and check initial profile completion',
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
      
      // Check initial PAWS balance (should be welcome bonus)
      const initialBalanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${userData.userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const initialBalance = await initialBalanceResponse.json();
      
      results[0].status = 'passed';
      results[0].details = `User created with ${initialBalance.balance} PAWS welcome bonus`;
      
      // Step 2: Update profile with additional information
      results.push({
        step: 2,
        description: 'Update user profile with additional details',
        status: 'running'
      });
      
      const profileUpdate = {
        phone: '+1234567890',
        address: '123 Pet Street, Dog City, PC 12345',
        emergencyContact: 'Emergency Contact Name',
        emergencyPhone: '+0987654321',
        preferences: {
          notifications: true,
          newsletter: true
        }
      };
      
      const updateResponse = await fetch(`${API_BASE}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(profileUpdate)
      });
      
      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        results[1].status = 'passed';
        results[1].details = `Profile updated, completion: ${updateResult.profileCompletion}%`;
        
        // Step 3: Check PAWS earned from profile completion
        results.push({
          step: 3,
          description: 'Check PAWS earned from profile completion',
          status: 'running'
        });
        
        const newBalanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${userData.userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (newBalanceResponse.ok) {
          const newBalance = await newBalanceResponse.json();
          const earnedPAWS = newBalance.balance - initialBalance.balance;
          
          if (earnedPAWS > 0) {
            results[2].status = 'passed';
            results[2].details = `Profile completion earned ${earnedPAWS} PAWS (${newBalance.balance} total)`;
          } else {
            results[2].status = 'warning';
            results[2].details = `No PAWS earned from profile completion: ${newBalance.balance} total`;
          }
        } else {
          results[2].status = 'failed';
          results[2].details = `Balance check failed: ${newBalanceResponse.status}`;
        }
        
        // Step 4: Add pet and check additional completion rewards
        results.push({
          step: 4,
          description: 'Add pet profile to increase completion percentage',
          status: 'running'
        });
        
        const petData = {
          name: 'Profile Pet',
          breed: 'Mixed Breed',
          age: '2',
          weight: '15',
          gender: 'female',
          activityLevel: 'medium',
          medicalConditions: 'Healthy',
          allergies: 'None',
          dietaryRequirements: 'Standard dry food'
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
          results[3].status = 'passed';
          results[3].details = `Pet added: ${petResult.pet.name}, Profile completion: ${petResult.pet.profileCompletion || 'N/A'}%`;
          
          // Step 5: Check final PAWS balance after all completion
          results.push({
            step: 5,
            description: 'Check total PAWS earned from complete profile',
            status: 'running'
          });
          
          const finalBalanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${userData.userId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (finalBalanceResponse.ok) {
            const finalBalance = await finalBalanceResponse.json();
            const totalEarned = finalBalance.balance - initialBalance.balance;
            
            results[4].status = 'passed';
            results[4].details = `Total completion rewards: ${totalEarned} PAWS (Final balance: ${finalBalance.balance})`;
          } else {
            results[4].status = 'failed';
            results[4].details = `Final balance check failed: ${finalBalanceResponse.status}`;
          }
          
          // Step 6: Verify completion percentage tracking
          results.push({
            step: 6,
            description: 'Verify profile completion percentage calculation',
            status: 'running'
          });
          
          const profileResponse = await fetch(`${API_BASE}/api/user/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.profileCompletion !== undefined) {
              results[5].status = 'passed';
              results[5].details = `Profile completion tracking: ${profileData.profileCompletion}%`;
            } else {
              results[5].status = 'warning';
              results[5].details = 'Profile completion percentage not tracked';
            }
          } else {
            results[5].status = 'failed';
            results[5].details = `Profile retrieval failed: ${profileResponse.status}`;
          }
          
        } else {
          results[3].status = 'failed';
          results[3].details = `Pet creation failed: ${petResponse.status}`;
        }
        
      } else {
        results[1].status = 'failed';
        results[1].details = `Profile update failed: ${updateResponse.status}`;
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length - 1 : 0;
      results[currentStep] = results[currentStep] || { step: currentStep + 1, description: 'Profile completion test', status: 'failed' };
      results[currentStep].status = 'failed';
      results[currentStep].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};