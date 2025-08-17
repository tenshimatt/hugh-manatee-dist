// Test Script 007: Quick Health Check
// Purpose: Minimal health check to quickly verify critical issues are resolved
// Expected: All core services responding correctly

export default {
  id: '007',
  name: 'Quick Health Check',
  description: 'Minimal script to quickly verify if critical API components are operational',
  category: 'Infrastructure',
  priority: 'Critical',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      // Step 1: Basic connectivity
      results.push({
        step: 1,
        description: 'Testing basic API connectivity',
        status: 'running'
      });
      
      const healthResponse = await fetch(`${API_BASE}/api/health?test=007&timestamp=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        results[0].status = 'passed';
        results[0].details = `API is online: Version ${healthData.version || 'unknown'}, Status: ${healthData.status}`;
      } else {
        results[0].status = 'failed';
        results[0].details = `API health check failed: ${healthResponse.status} ${healthResponse.statusText}`;
        return results; // Stop if basic health fails
      }
      
      // Step 2: Database connectivity
      results.push({
        step: 2,
        description: 'Testing database connectivity',
        status: 'running'
      });
      
      const dbResponse = await fetch(`${API_BASE}/api/health/db?test=007&timestamp=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        if (dbData.database === 'connected') {
          results[1].status = 'passed';
          results[1].details = 'Database is connected and operational';
        } else {
          results[1].status = 'failed';
          results[1].details = 'Database status indicates disconnection';
        }
      } else if (dbResponse.status === 503) {
        results[1].status = 'failed';
        results[1].details = 'Database is disconnected (503 Service Unavailable)';
        return results; // Stop if database is down
      } else {
        results[1].status = 'failed';
        results[1].details = `Database check failed: ${dbResponse.status}`;
        return results;
      }
      
      // Step 3: Test registration endpoint
      results.push({
        step: 3,
        description: 'Testing user registration endpoint',
        status: 'running'
      });
      
      const testEmail = `healthcheck-${Date.now()}@example.com`;
      const regResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'TestPass123!',
          name: 'Health Check User'
        }),
        cache: 'no-store'
      });
      
      if (regResponse.status === 201) {
        results[2].status = 'passed';
        results[2].details = 'User registration is working correctly';
      } else if (regResponse.status === 409) {
        results[2].status = 'passed';
        results[2].details = 'Registration endpoint working (conflict indicates proper validation)';
      } else {
        results[2].status = 'failed';
        results[2].details = `Registration failed: ${regResponse.status} ${regResponse.statusText}`;
      }
      
      // Step 4: Test authentication middleware
      results.push({
        step: 4,
        description: 'Testing authentication middleware',
        status: 'running'
      });
      
      const authResponse = await fetch(`${API_BASE}/api/paws/balance?test=007`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      
      if (authResponse.status === 401) {
        results[3].status = 'passed';
        results[3].details = 'Authentication middleware correctly rejects unauthenticated requests';
      } else {
        results[3].status = 'failed';
        results[3].details = `Auth middleware issue: Expected 401, got ${authResponse.status}`;
      }
      
      // Step 5: Overall health assessment
      results.push({
        step: 5,
        description: 'Overall system health assessment',
        status: 'running'
      });
      
      const allPassed = results.slice(0, 4).every(r => r.status === 'passed');
      if (allPassed) {
        results[4].status = 'passed';
        results[4].details = '🎉 All critical components are operational!';
      } else {
        const failedCount = results.slice(0, 4).filter(r => r.status === 'failed').length;
        results[4].status = 'failed';
        results[4].details = `⚠️ ${failedCount} critical component(s) failed. Review details above.`;
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length - 1 : 0;
      if (results[currentStep]) {
        results[currentStep].status = 'failed';
        results[currentStep].details = `Health check error: ${error.message}`;
      } else {
        results.push({
          step: 1,
          description: 'Health check initialization',
          status: 'failed',
          details: `Failed to start health check: ${error.message}`
        });
      }
    }
    
    return results;
  }
};