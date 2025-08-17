// Test Script 002: CORS Validation
// Purpose: Verify CORS headers are correctly configured for cross-origin requests
// Expected: Proper CORS headers including X-Admin-Token support

export default {
  id: '002',
  name: 'CORS Validation',
  description: 'Tests CORS preflight and header validation for cross-origin requests',
  category: 'Security',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      // Step 1: CORS Preflight Request
      results.push({
        step: 1,
        description: 'Testing CORS preflight (OPTIONS request)',
        status: 'running'
      });
      
      const preflightResponse = await fetch(`${API_BASE}/api/test-management/dashboard`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'X-Admin-Token, Content-Type'
        }
      });
      
      if (preflightResponse.ok) {
        results[0].status = 'passed';
        results[0].details = `OPTIONS request successful: ${preflightResponse.status}`;
        
        // Step 2: Validate CORS headers
        results.push({
          step: 2,
          description: 'Validating CORS headers',
          status: 'running'
        });
        
        const corsHeaders = {};
        preflightResponse.headers.forEach((value, key) => {
          if (key.startsWith('access-control')) {
            corsHeaders[key] = value;
          }
        });
        
        const allowedHeaders = corsHeaders['access-control-allow-headers'] || '';
        const allowedMethods = corsHeaders['access-control-allow-methods'] || '';
        const allowedOrigin = corsHeaders['access-control-allow-origin'] || '';
        
        const hasAdminToken = allowedHeaders.includes('X-Admin-Token');
        const hasContentType = allowedHeaders.includes('Content-Type');
        const allowsGET = allowedMethods.includes('GET');
        
        if (hasAdminToken && hasContentType && allowsGET) {
          results[1].status = 'passed';
          results[1].details = `CORS properly configured: Origin=${allowedOrigin}, Headers=${allowedHeaders}`;
        } else {
          results[1].status = 'failed';
          results[1].details = `CORS issues: Admin-Token=${hasAdminToken}, Content-Type=${hasContentType}, GET=${allowsGET}`;
        }
        
        // Step 3: Test actual CORS request
        results.push({
          step: 3,
          description: 'Testing actual cross-origin request',
          status: 'running'
        });
        
        const corsTestResponse = await fetch(`${API_BASE}/api/health?cors-test=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        });
        
        if (corsTestResponse.ok) {
          results[2].status = 'passed';
          results[2].details = 'Cross-origin request successful';
        } else {
          results[2].status = 'failed';
          results[2].details = `Cross-origin request failed: ${corsTestResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `CORS preflight failed: ${preflightResponse.status}`;
      }
      
    } catch (error) {
      results[0].status = 'failed';
      results[0].details = `CORS test error: ${error.message}`;
    }
    
    return results;
  }
};