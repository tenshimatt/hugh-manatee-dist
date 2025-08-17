// Test Script 106: Daily Feeding Logging
// Purpose: Tests complete daily feeding workflow with PAWS rewards and streak tracking
// User Story: User logs daily pet feeding and earns consistency rewards

export default {
  id: '106',
  name: 'Daily Feeding Logging',
  description: 'Complete daily feeding workflow with rewards and streak validation',
  category: 'Integration',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    // Setup test user and pet for feeding
    const testUser = {
      email: `feeder-${Date.now()}@rawgle.com`,
      password: 'Feeder123!',
      name: 'Pet Feeder Test'
    };
    
    try {
      // Step 1: Create test user and pet
      results.push({
        step: 1,
        description: 'Setup user and pet for feeding test',
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
        results[0].details = `User setup failed: ${registerResponse.status}`;
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
      
      // Create pet to feed
      const petData = {
        name: 'Hungry Pet',
        breed: 'Labrador',
        age: '2',
        weight: '25'
      };
      
      const petResponse = await fetch(`${API_BASE}/api/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(petData)
      });
      
      const petResult = await petResponse.json();
      const petId = petResult.pet.id;
      
      results[0].status = 'passed';
      results[0].details = `Test setup complete: User ${userData.userId}, Pet ${petId}`;
      
      // Step 2: Log first feeding
      results.push({
        step: 2,
        description: 'Log daily feeding entry',
        status: 'running'
      });
      
      const feedingData = {
        petId: petId,
        logDate: new Date().toISOString().split('T')[0],
        mealTime: 'breakfast',
        foodType: 'dry_food',
        quantity: '1.5',
        notes: 'Ate well, finished bowl'
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
        results[1].status = 'passed';
        results[1].details = `Feeding logged: ${feedingResult.log.food_type} at ${feedingResult.log.feeding_time}`;
        
        // Step 3: Verify PAWS reward earned
        results.push({
          step: 3,
          description: 'Verify PAWS earned from feeding',
          status: 'running'
        });
        
        if (feedingResult.dailyReward && feedingResult.dailyReward > 0) {
          results[2].status = 'passed';
          results[2].details = `Daily feeding reward: ${feedingResult.dailyReward} PAWS`;
        } else {
          results[2].status = 'warning';
          results[2].details = 'No daily feeding reward detected';
        }
        
        // Step 4: Verify feeding streak tracking
        results.push({
          step: 4,
          description: 'Check feeding streak calculation',
          status: 'running'
        });
        
        if (feedingResult.streakData) {
          results[3].status = 'passed';
          results[3].details = `Streak data: Current ${feedingResult.streakData.currentStreak}, Longest ${feedingResult.streakData.longestStreak}`;
        } else {
          results[3].status = 'failed';
          results[3].details = 'Feeding streak tracking not working';
        }
        
        // Step 5: Test feeding log retrieval
        results.push({
          step: 5,
          description: 'Retrieve feeding logs for pet',
          status: 'running'
        });
        
        const logsResponse = await fetch(`${API_BASE}/api/feeding/${petId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          if (logsData.logs && logsData.logs.length > 0) {
            results[4].status = 'passed';
            results[4].details = `Retrieved ${logsData.logs.length} feeding log(s)`;
          } else {
            results[4].status = 'failed';
            results[4].details = 'No feeding logs retrieved';
          }
        } else {
          results[4].status = 'failed';
          results[4].details = `Log retrieval failed: ${logsResponse.status}`;
        }
        
        // Step 6: Test feeding overview
        results.push({
          step: 6,
          description: 'Get user feeding overview',
          status: 'running'
        });
        
        const overviewResponse = await fetch(`${API_BASE}/api/feeding/overview?timeframe=7d`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (overviewResponse.ok) {
          const overviewData = await overviewResponse.json();
          results[5].status = 'passed';
          results[5].details = `Overview: ${overviewData.overview.totalLogs} logs, ${overviewData.pets.length} pets`;
        } else {
          results[5].status = 'failed';
          results[5].details = `Overview failed: ${overviewResponse.status}`;
        }
        
      } else {
        results[1].status = 'failed';
        results[1].details = `Feeding log failed: ${feedingResponse.status}`;
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length - 1 : 0;
      results[currentStep] = results[currentStep] || { step: currentStep + 1, description: 'Daily feeding test', status: 'failed' };
      results[currentStep].status = 'failed';
      results[currentStep].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};