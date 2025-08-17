// Test Script 104: Pet Profile Creation
// Purpose: Tests complete pet profile creation workflow with PAWS rewards
// User Story: User creates detailed pet profile and earns completion rewards

export default {
  id: '104',
  name: 'Pet Profile Creation',
  description: 'Complete pet profile creation workflow with reward validation',
  category: 'Integration',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    // First create a test user to own the pet
    const testUser = {
      email: `pet-owner-${Date.now()}@rawgle.com`,
      password: 'PetOwner123!',
      name: 'Pet Owner Test'
    };
    
    try {
      // Step 1: Create test user account
      results.push({
        step: 1,
        description: 'Create user account for pet ownership',
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
      results[0].status = 'passed';
      results[0].details = `Test user created: ${userData.userId}`;
      
      // Step 2: Login to get session token
      results.push({
        step: 2,
        description: 'Login to get authentication token',
        status: 'running'
      });
      
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
      
      if (!loginResponse.ok) {
        results[1].status = 'failed';
        results[1].details = `Login failed: ${loginResponse.status}`;
        return results;
      }
      
      const loginData = await loginResponse.json();
      const authToken = loginData.sessionToken;
      results[1].status = 'passed';
      results[1].details = 'Authentication successful';
      
      // Step 3: Create pet profile
      results.push({
        step: 3,
        description: 'Create detailed pet profile',
        status: 'running'
      });
      
      const petData = {
        name: 'Test Buddy',
        breed: 'Golden Retriever',
        age: '3',
        weight: '30',
        gender: 'male',
        activityLevel: 'high',
        medicalConditions: 'None',
        allergies: 'None known'
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
        results[2].status = 'passed';
        results[2].details = `Pet profile created: ${petResult.pet.name} (${petResult.pet.id})`;
        
        // Step 4: Verify profile completion percentage
        results.push({
          step: 4,
          description: 'Verify profile completion percentage calculated',
          status: 'running'
        });
        
        if (petResult.pet.profileCompletion !== undefined) {
          results[3].status = 'passed';
          results[3].details = `Profile completion: ${petResult.pet.profileCompletion}%`;
        } else {
          results[3].status = 'failed';
          results[3].details = 'Profile completion not calculated';
        }
        
        // Step 5: Check for PAWS completion rewards
        results.push({
          step: 5,
          description: 'Check PAWS balance increase from profile completion',
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
          // Should have welcome bonus (50) plus any profile completion bonus
          if (balanceData.balance > 50) {
            results[4].status = 'passed';
            results[4].details = `PAWS rewards earned: ${balanceData.balance} total PAWS`;
          } else {
            results[4].status = 'warning';
            results[4].details = `Only welcome bonus detected: ${balanceData.balance} PAWS`;
          }
        } else {
          results[4].status = 'failed';
          results[4].details = `PAWS balance check failed: ${balanceResponse.status}`;
        }
        
        // Step 6: Verify pet data retrieval
        results.push({
          step: 6,
          description: 'Verify pet profile can be retrieved',
          status: 'running'
        });
        
        const getPetResponse = await fetch(`${API_BASE}/api/pets/${petResult.pet.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (getPetResponse.ok) {
          const retrievedPet = await getPetResponse.json();
          if (retrievedPet.pet.name === petData.name) {
            results[5].status = 'passed';
            results[5].details = `Pet profile retrieved successfully: ${retrievedPet.pet.name}`;
          } else {
            results[5].status = 'failed';
            results[5].details = 'Pet data corruption detected';
          }
        } else {
          results[5].status = 'failed';
          results[5].details = `Pet retrieval failed: ${getPetResponse.status}`;
        }
        
      } else {
        results[2].status = 'failed';
        results[2].details = `Pet creation failed: ${petResponse.status}`;
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length - 1 : 0;
      results[currentStep] = results[currentStep] || { step: currentStep + 1, description: 'Pet profile creation test', status: 'failed' };
      results[currentStep].status = 'failed';
      results[currentStep].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};