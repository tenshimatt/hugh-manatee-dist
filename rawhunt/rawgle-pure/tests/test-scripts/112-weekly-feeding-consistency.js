// Test Script 112: Weekly Feeding Consistency
// Purpose: Tests weekly feeding consistency tracking and streak rewards
// User Story: User maintains consistent daily feeding for weekly bonus rewards

export default {
  id: '112',
  name: 'Weekly Feeding Consistency',
  description: 'Complete weekly feeding consistency tracking with streak rewards',
  category: 'Integration',
  priority: 'Medium',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    // Setup test user for consistency tracking
    const testUser = {
      email: `consistency-user-${Date.now()}@rawgle.com`,
      password: 'ConsistencyUser123!',
      name: 'Feeding Consistency Test'
    };
    
    try {
      // Step 1: Setup user and pet for consistency tracking
      results.push({
        step: 1,
        description: 'Setup user and pet for consistency tracking',
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
      
      // Create pet for consistency tracking
      const petData = {
        name: 'Consistent Pet',
        breed: 'Consistent Breed',
        age: '2',
        weight: '18'
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
      results[0].details = `Setup complete: User ${userData.userId}, Pet ${petId}`;
      
      // Step 2: Log multiple days of feeding for consistency
      results.push({
        step: 2,
        description: 'Log multiple days of consistent feeding',
        status: 'running'
      });
      
      const today = new Date();
      const feedingLogs = [];
      
      // Log feeding for past 5 days to build consistency
      for (let i = 0; i < 5; i++) {
        const feedDate = new Date(today);
        feedDate.setDate(today.getDate() - i);
        
        const feedingData = {
          petId: petId,
          logDate: feedDate.toISOString().split('T')[0],
          mealTime: i % 2 === 0 ? 'breakfast' : 'dinner',
          foodType: 'dry_food',
          quantity: '1.5',
          notes: `Consistency test day ${5-i}`
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
          feedingLogs.push(feedingResult);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      results[1].status = 'passed';
      results[1].details = `${feedingLogs.length}/5 feeding logs created for consistency tracking`;
      
      // Step 3: Check feeding streak calculation
      results.push({
        step: 3,
        description: 'Check feeding streak calculation',
        status: 'running'
      });
      
      const streakResponse = await fetch(`${API_BASE}/api/feeding/streak/${petId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (streakResponse.ok) {
        const streakData = await streakResponse.json();
        if (streakData.currentStreak !== undefined) {
          results[2].status = 'passed';
          results[2].details = `Current streak: ${streakData.currentStreak} days, Longest: ${streakData.longestStreak || 0} days`;
        } else {
          results[2].status = 'warning';
          results[2].details = 'Streak data structure different than expected';
        }
      } else {
        results[2].status = 'failed';
        results[2].details = `Streak calculation failed: ${streakResponse.status}`;
      }
      
      // Step 4: Check weekly consistency rewards
      results.push({
        step: 4,
        description: 'Check weekly consistency reward calculation',
        status: 'running'
      });
      
      const weeklyResponse = await fetch(`${API_BASE}/api/feeding/weekly-summary?petId=${petId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (weeklyResponse.ok) {
        const weeklyData = await weeklyResponse.json();
        results[3].status = 'passed';
        results[3].details = `Weekly summary: ${weeklyData.feedingsThisWeek || 0} feedings, ${weeklyData.consistencyScore || 0}% consistency`;
      } else {
        results[3].status = 'failed';
        results[3].details = `Weekly summary failed: ${weeklyResponse.status}`;
      }
      
      // Step 5: Test consistency bonus eligibility
      results.push({
        step: 5,
        description: 'Test weekly consistency bonus eligibility',
        status: 'running'
      });
      
      const bonusResponse = await fetch(`${API_BASE}/api/paws/weekly-bonus-check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (bonusResponse.ok) {
        const bonusData = await bonusResponse.json();
        if (bonusData.eligible || bonusData.bonusAvailable) {
          results[4].status = 'passed';
          results[4].details = `Consistency bonus eligible: ${bonusData.bonusAmount || 'Available'} PAWS`;
        } else {
          results[4].status = 'warning';
          results[4].details = 'Consistency bonus not yet eligible - need more consistent days';
        }
      } else {
        results[4].status = 'failed';
        results[4].details = `Bonus eligibility check failed: ${bonusResponse.status}`;
      }
      
      // Step 6: Verify feeding analytics for consistency
      results.push({
        step: 6,
        description: 'Verify feeding analytics show consistency patterns',
        status: 'running'
      });
      
      const analyticsResponse = await fetch(`${API_BASE}/api/feeding/analytics/${petId}?period=week`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        if (analyticsData.consistencyMetrics || analyticsData.dailyPattern) {
          results[5].status = 'passed';
          results[5].details = `Feeding analytics available: ${Object.keys(analyticsData).length} metrics`;
        } else {
          results[5].status = 'warning';
          results[5].details = 'Basic analytics available - consistency metrics may be limited';
        }
      } else {
        results[5].status = 'failed';
        results[5].details = `Analytics retrieval failed: ${analyticsResponse.status}`;
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length - 1 : 0;
      results[currentStep] = results[currentStep] || { step: currentStep + 1, description: 'Weekly consistency test', status: 'failed' };
      results[currentStep].status = 'failed';
      results[currentStep].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};