// Test Script 004: Dashboard Functionality
// Purpose: Test the complete dashboard endpoint functionality
// Expected: Full dashboard data with metrics, trends, and analytics

export default {
  id: '004',
  name: 'Dashboard Functionality',
  description: 'Tests the complete dashboard endpoint with data validation and user experience',
  category: 'Functionality',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    const ADMIN_TOKEN = 'rawgle-admin-2025';
    
    try {
      // Step 1: Request dashboard data
      results.push({
        step: 1,
        description: 'Requesting dashboard data with valid authentication',
        status: 'running'
      });
      
      const startTime = Date.now();
      const dashboardResponse = await fetch(`${API_BASE}/api/test-management/dashboard?test-script=004&timestamp=${startTime}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': ADMIN_TOKEN
        },
        cache: 'no-store'
      });
      
      const responseTime = Date.now() - startTime;
      
      if (dashboardResponse.ok) {
        results[0].status = 'passed';
        results[0].details = `Dashboard request successful: ${dashboardResponse.status} (${responseTime}ms)`;
        
        // Step 2: Validate response data structure
        results.push({
          step: 2,
          description: 'Validating dashboard data structure',
          status: 'running'
        });
        
        const dashboardData = await dashboardResponse.json();
        
        // Check required fields
        const hasOverview = dashboardData.overview && typeof dashboardData.overview === 'object';
        const hasTrends = Array.isArray(dashboardData.trends);
        const hasTimeframe = dashboardData.timeframe;
        
        if (hasOverview && hasTrends && hasTimeframe) {
          results[1].status = 'passed';
          results[1].details = `Data structure valid: Overview=${hasOverview}, Trends=${hasTrends}, Timeframe=${hasTimeframe}`;
        } else {
          results[1].status = 'failed';
          results[1].details = `Invalid data structure: Overview=${hasOverview}, Trends=${hasTrends}, Timeframe=${hasTimeframe}`;
        }
        
        // Step 3: Validate overview metrics
        results.push({
          step: 3,
          description: 'Validating overview metrics',
          status: 'running'
        });
        
        const overview = dashboardData.overview;
        const hasValidMetrics = overview.totalTests && overview.passRate !== undefined && overview.activeUsers !== undefined;
        
        if (hasValidMetrics) {
          results[2].status = 'passed';
          results[2].details = `Metrics valid: Tests=${overview.totalTests}, Pass Rate=${overview.passRate}%, Users=${overview.activeUsers}`;
        } else {
          results[2].status = 'failed';
          results[2].details = 'Missing or invalid overview metrics';
        }
        
        // Step 4: Validate trends data
        results.push({
          step: 4,
          description: 'Validating trends data',
          status: 'running'
        });
        
        const trends = dashboardData.trends;
        const validTrends = trends.length > 0 && trends.every(trend => 
          trend.date && trend.tests !== undefined && trend.passed !== undefined
        );
        
        if (validTrends) {
          results[3].status = 'passed';
          results[3].details = `Trends valid: ${trends.length} data points with complete metrics`;
        } else {
          results[3].status = 'failed';
          results[3].details = `Trends invalid: ${trends.length} data points, structure check failed`;
        }
        
        // Step 5: Response time validation
        results.push({
          step: 5,
          description: 'Response time performance',
          status: responseTime < 2000 ? 'passed' : 'warning',
          details: `Response time: ${responseTime}ms ${responseTime < 1000 ? '(excellent)' : responseTime < 2000 ? '(good)' : '(slow)'}`
        });
        
      } else {
        results[0].status = 'failed';
        results[0].details = `Dashboard request failed: ${dashboardResponse.status} ${dashboardResponse.statusText}`;
        
        // Try to get error details
        try {
          const errorText = await dashboardResponse.text();
          results.push({
            step: 2,
            description: 'Error Analysis',
            status: 'failed',
            details: `Server error: ${errorText}`
          });
        } catch (e) {
          results.push({
            step: 2,
            description: 'Error Analysis',
            status: 'failed',
            details: 'Could not retrieve error details from server'
          });
        }
      }
      
    } catch (error) {
      results[0].status = 'failed';
      results[0].details = `Dashboard test error: ${error.message}`;
      
      // Detailed error analysis
      if (error.message.includes('Failed to fetch')) {
        results.push({
          step: 2,
          description: 'Network Connectivity Analysis',
          status: 'failed',
          details: 'Network-level error preventing dashboard access. Check browser security settings, firewall, or network connection.'
        });
      }
    }
    
    return results;
  }
};