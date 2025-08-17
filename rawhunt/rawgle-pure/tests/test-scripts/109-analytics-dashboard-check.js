// Test Script 109: Analytics Dashboard Check
// Purpose: Tests analytics dashboard data aggregation and display
// User Story: User accesses analytics dashboard to view pet care statistics

export default {
  id: '109',
  name: 'Analytics Dashboard Check',
  description: 'Complete analytics dashboard data validation with user statistics',
  category: 'Integration',
  priority: 'Medium',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    // Setup test user with activity for analytics
    const testUser = {
      email: `analytics-user-${Date.now()}@rawgle.com`,
      password: 'AnalyticsUser123!',
      name: 'Analytics Test User'
    };
    
    try {
      // Step 1: Setup user with pets and activities for analytics
      results.push({
        step: 1,
        description: 'Setup user with pets and activities for analytics',
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
      
      // Create pets for analytics data
      const pet1Response = await fetch(`${API_BASE}/api/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Analytics Pet 1',
          breed: 'Labrador',
          age: '3',
          weight: '25'
        })
      });
      
      const pet1Data = await pet1Response.json();
      const pet1Id = pet1Data.pet.id;
      
      results[0].status = 'passed';
      results[0].details = `Setup complete: User ${userData.userId}, Pet ${pet1Id}`;
      
      // Step 2: Generate activity data for analytics
      results.push({
        step: 2,
        description: 'Generate feeding and activity data',
        status: 'running'
      });
      
      // Create some feeding logs
      const feedingData = {
        petId: pet1Id,
        logDate: new Date().toISOString().split('T')[0],
        mealTime: 'breakfast',
        foodType: 'dry_food',
        quantity: '1.5',
        notes: 'Analytics test feeding'
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
        results[1].status = 'passed';
        results[1].details = 'Test activity data generated';
      } else {
        results[1].status = 'warning';
        results[1].details = 'Activity generation limited';
      }
      
      // Step 3: Check user analytics dashboard
      results.push({
        step: 3,
        description: 'Retrieve user analytics dashboard data',
        status: 'running'
      });
      
      const analyticsResponse = await fetch(`${API_BASE}/api/analytics/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        results[2].status = 'passed';
        results[2].details = `Dashboard data retrieved: ${Object.keys(analyticsData).length} metrics`;
        
        // Step 4: Verify key analytics metrics
        results.push({
          step: 4,
          description: 'Verify key analytics metrics present',
          status: 'running'
        });
        
        const expectedMetrics = ['totalPets', 'totalFeedings', 'pawsBalance', 'weeklyActivity'];
        const foundMetrics = expectedMetrics.filter(metric => analyticsData[metric] !== undefined);
        
        if (foundMetrics.length > 0) {
          results[3].status = 'passed';
          results[3].details = `Found ${foundMetrics.length}/${expectedMetrics.length} expected metrics`;
        } else {
          results[3].status = 'warning';
          results[3].details = 'No standard analytics metrics found';
        }
        
        // Step 5: Check pet-specific analytics
        results.push({
          step: 5,
          description: 'Check pet-specific analytics data',
          status: 'running'
        });
        
        const petAnalyticsResponse = await fetch(`${API_BASE}/api/analytics/pet/${pet1Id}?timeframe=30d`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (petAnalyticsResponse.ok) {
          const petAnalytics = await petAnalyticsResponse.json();
          results[4].status = 'passed';
          results[4].details = `Pet analytics retrieved: ${Object.keys(petAnalytics).length} data points`;
        } else {
          results[4].status = 'failed';
          results[4].details = `Pet analytics failed: ${petAnalyticsResponse.status}`;
        }
        
        // Step 6: Check PAWS analytics integration
        results.push({
          step: 6,
          description: 'Check PAWS analytics and earning trends',
          status: 'running'
        });
        
        const pawsAnalyticsResponse = await fetch(`${API_BASE}/api/analytics/paws?timeframe=30d`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (pawsAnalyticsResponse.ok) {
          const pawsAnalytics = await pawsAnalyticsResponse.json();
          results[5].status = 'passed';
          results[5].details = `PAWS analytics: ${pawsAnalytics.totalEarned || 0} earned, ${pawsAnalytics.transactions?.length || 0} transactions`;
        } else {
          results[5].status = 'warning';
          results[5].details = `PAWS analytics limited: ${pawsAnalyticsResponse.status}`;
        }
        
      } else {
        results[2].status = 'failed';
        results[2].details = `Dashboard retrieval failed: ${analyticsResponse.status}`;
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length - 1 : 0;
      results[currentStep] = results[currentStep] || { step: currentStep + 1, description: 'Analytics dashboard test', status: 'failed' };
      results[currentStep].status = 'failed';
      results[currentStep].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};