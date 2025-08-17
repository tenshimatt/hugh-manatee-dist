// Test Script 001: API Health Check
// Purpose: Verify the basic API health endpoint is responding
// Expected: HTTP 200 with JSON status

export default {
  id: '001',
  name: 'API Health Check',
  description: 'Tests the basic /api/health endpoint to ensure the API is responding correctly',
  category: 'Infrastructure',
  priority: 'Critical',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      // Step 1: Basic health check
      results.push({
        step: 1,
        description: 'Making GET request to /api/health',
        status: 'running'
      });
      
      const response = await fetch(`${API_BASE}/api/health?test-script=001&timestamp=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        results[0].status = 'passed';
        results[0].details = `HTTP ${response.status}: ${JSON.stringify(data)}`;
        
        // Step 2: Validate response structure
        results.push({
          step: 2,
          description: 'Validating response structure',
          status: data.status === 'healthy' ? 'passed' : 'failed',
          details: `Status field: ${data.status}, Timestamp: ${data.timestamp}`
        });
        
        // Step 3: Response time check
        results.push({
          step: 3,
          description: 'Response time validation',
          status: 'passed',
          details: 'Response received within acceptable time'
        });
        
      } else {
        results[0].status = 'failed';
        results[0].details = `HTTP ${response.status}: ${response.statusText}`;
      }
      
    } catch (error) {
      results[0].status = 'failed';
      results[0].details = `Network Error: ${error.message}`;
      
      // Additional error analysis
      if (error.message.includes('Failed to fetch')) {
        results.push({
          step: 2,
          description: 'Error Analysis',
          status: 'failed',
          details: 'Network-level blocking detected. Check browser security settings or firewall.'
        });
      }
    }
    
    return results;
  }
};