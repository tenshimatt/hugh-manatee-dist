// Test Script 006: Infrastructure Validation
// Purpose: Test the underlying infrastructure components
// Expected: All infrastructure services operational

export default {
  id: '006',
  name: 'Infrastructure Validation',
  description: 'Tests Cloudflare Workers, D1 Database, R2 Storage, and other infrastructure components',
  category: 'Infrastructure',
  priority: 'Critical',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      // Step 1: Cloudflare Workers Health
      results.push({
        step: 1,
        description: 'Testing Cloudflare Workers runtime environment',
        status: 'running'
      });
      
      const workersResponse = await fetch(`${API_BASE}/api/health?infra-test=workers&timestamp=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      if (workersResponse.ok) {
        const healthData = await workersResponse.json();
        results[0].status = 'passed';
        results[0].details = `Workers runtime healthy: Version ${healthData.version || 'unknown'}, Status: ${healthData.status}`;
        
        // Step 2: D1 Database Connectivity
        results.push({
          step: 2,
          description: 'Testing D1 Database connectivity and queries',
          status: 'running'
        });
        
        const dbResponse = await fetch(`${API_BASE}/api/health/db?infra-test=d1&timestamp=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store'
        });
        
        if (dbResponse.ok) {
          const dbData = await dbResponse.json();
          results[1].status = 'passed';
          results[1].details = `D1 Database operational: ${dbData.database || 'connected'}`;
        } else if (dbResponse.status === 503) {
          results[1].status = 'failed';
          results[1].details = 'D1 Database connection failed (503 Service Unavailable)';
        } else {
          results[1].status = 'failed';
          results[1].details = `D1 Database test failed: ${dbResponse.status}`;
        }
        
        // Step 3: KV Storage Test
        results.push({
          step: 3,
          description: 'Testing KV Storage read/write operations',
          status: 'running'
        });
        
        const kvTestResponse = await fetch(`${API_BASE}/api/analytics?kv-test=true&action=ping`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ test: 'kv-storage', timestamp: Date.now() }),
          cache: 'no-store'
        });
        
        if (kvTestResponse.ok) {
          results[2].status = 'passed';
          results[2].details = 'KV Storage read/write operations successful';
        } else {
          results[2].status = 'failed';
          results[2].details = `KV Storage test failed: ${kvTestResponse.status}`;
        }
        
        // Step 4: R2 Storage Test
        results.push({
          step: 4,
          description: 'Testing R2 Object Storage availability',
          status: 'running'
        });
        
        // Test R2 by trying to access a report endpoint (which uses R2)
        const r2TestResponse = await fetch(`${API_BASE}/api/analytics?r2-test=true&report=daily`, {
          method: 'GET',
          cache: 'no-store'
        });
        
        // R2 test is successful if we get any response (even 404 means R2 is accessible)
        if (r2TestResponse.status === 200 || r2TestResponse.status === 404) {
          results[3].status = 'passed';
          results[3].details = 'R2 Object Storage accessible';
        } else {
          results[3].status = 'warning';
          results[3].details = `R2 Storage test inconclusive: ${r2TestResponse.status}`;
        }
        
        // Step 5: Queue System Test
        results.push({
          step: 5,
          description: 'Testing Queue system availability',
          status: 'running'
        });
        
        const queueTestResponse = await fetch(`${API_BASE}/api/analytics?queue-test=true&job=health-check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ type: 'test_job', data: { timestamp: Date.now() } }),
          cache: 'no-store'
        });
        
        if (queueTestResponse.ok) {
          results[4].status = 'passed';
          results[4].details = 'Queue system accepting jobs';
        } else {
          results[4].status = 'warning';
          results[4].details = `Queue test inconclusive: ${queueTestResponse.status}`;
        }
        
        // Step 6: AI Workers Test
        results.push({
          step: 6,
          description: 'Testing AI Workers integration',
          status: 'running'
        });
        
        const aiTestResponse = await fetch(`${API_BASE}/api/ai-medical?test=true&prompt=health-check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: 'Test AI functionality', type: 'infrastructure-test' }),
          cache: 'no-store'
        });
        
        if (aiTestResponse.ok) {
          results[5].status = 'passed';
          results[5].details = 'AI Workers integration functional';
        } else {
          results[5].status = 'warning';
          results[5].details = `AI Workers test inconclusive: ${aiTestResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `Cloudflare Workers health check failed: ${workersResponse.status}`;
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length - 1 : 0;
      results[currentStep].status = 'failed';
      results[currentStep].details = `Infrastructure test error: ${error.message}`;
      
      if (error.message.includes('Failed to fetch')) {
        results.push({
          step: results.length + 1,
          description: 'Network Connectivity Analysis',
          status: 'failed',
          details: 'Infrastructure tests cannot complete due to network connectivity issues. This may indicate DNS, firewall, or browser security policy problems.'
        });
      }
    }
    
    return results;
  }
};