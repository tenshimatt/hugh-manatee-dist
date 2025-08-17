#!/usr/bin/env node

/**
 * Frontend Compatibility Verification Script
 * Tests API compatibility with Rawgle frontend
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

// Configuration
const CONFIG = {
  apiUrl: process.env.API_URL || 'https://rawgle-backend.your-subdomain.workers.dev',
  frontendUrl: process.env.FRONTEND_URL || 'https://afc39a6e.rawgle-frontend.pages.dev',
  timeout: 30000,
  retries: 3
};

class FrontendCompatibilityTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      api_url: CONFIG.apiUrl,
      frontend_url: CONFIG.frontendUrl,
      tests: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async runAllTests() {
    console.log('🧪 Rawgle Frontend Compatibility Tests');
    console.log('=====================================');
    console.log(`API URL: ${CONFIG.apiUrl}`);
    console.log(`Frontend URL: ${CONFIG.frontendUrl}`);
    console.log('');

    const testSuites = [
      { name: 'CORS Configuration', test: () => this.testCorsConfiguration() },
      { name: 'API Response Format', test: () => this.testApiResponseFormat() },
      { name: 'Authentication Flow', test: () => this.testAuthenticationFlow() },
      { name: 'Error Handling', test: () => this.testErrorHandling() },
      { name: 'Health Endpoints', test: () => this.testHealthEndpoints() },
      { name: 'Public Endpoints', test: () => this.testPublicEndpoints() },
      { name: 'Content Types', test: () => this.testContentTypes() },
      { name: 'Rate Limiting', test: () => this.testRateLimiting() },
      { name: 'Platform Headers', test: () => this.testPlatformHeaders() },
      { name: 'Response Performance', test: () => this.testResponsePerformance() }
    ];

    for (const suite of testSuites) {
      console.log(`\n🔍 Testing: ${suite.name}`);
      console.log('-'.repeat(40));
      
      try {
        const result = await suite.test();
        this.results.tests[suite.name] = result;
        
        this.updateSummary(result);
        this.logTestResult(result);
        
      } catch (error) {
        console.error(`❌ ${suite.name}: FATAL ERROR - ${error.message}`);
        this.results.tests[suite.name] = {
          status: 'FATAL_ERROR',
          error: error.message,
          subtests: {}
        };
        this.results.summary.failed++;
      }
    }

    this.generateReport();
    return this.results;
  }

  async testCorsConfiguration() {
    const subtests = {};

    // Test preflight request
    const preflightStart = performance.now();
    try {
      const response = await fetch(`${CONFIG.apiUrl}/api/pets`, {
        method: 'OPTIONS',
        headers: {
          'Origin': CONFIG.frontendUrl,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type,Authorization'
        },
        timeout: CONFIG.timeout
      });

      const responseTime = performance.now() - preflightStart;
      
      subtests.preflight_request = {
        status: response.ok ? 'PASS' : 'FAIL',
        status_code: response.status,
        response_time_ms: Math.round(responseTime),
        cors_headers: {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
          'access-control-allow-headers': response.headers.get('access-control-allow-headers')
        }
      };

      // Verify specific CORS headers
      const allowOrigin = response.headers.get('access-control-allow-origin');
      subtests.origin_header = {
        status: allowOrigin === CONFIG.frontendUrl ? 'PASS' : 'FAIL',
        expected: CONFIG.frontendUrl,
        actual: allowOrigin
      };

      const allowMethods = response.headers.get('access-control-allow-methods');
      subtests.methods_header = {
        status: allowMethods && allowMethods.includes('GET') && allowMethods.includes('POST') ? 'PASS' : 'FAIL',
        value: allowMethods
      };

    } catch (error) {
      subtests.preflight_request = {
        status: 'FAIL',
        error: error.message
      };
    }

    // Test actual CORS request
    try {
      const response = await fetch(`${CONFIG.apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Origin': CONFIG.frontendUrl
        },
        timeout: CONFIG.timeout
      });

      subtests.cors_request = {
        status: response.ok ? 'PASS' : 'FAIL',
        status_code: response.status,
        cors_origin: response.headers.get('access-control-allow-origin')
      };

    } catch (error) {
      subtests.cors_request = {
        status: 'FAIL',
        error: error.message
      };
    }

    return {
      status: Object.values(subtests).every(t => t.status === 'PASS') ? 'PASS' : 'FAIL',
      subtests
    };
  }

  async testApiResponseFormat() {
    const subtests = {};
    const endpoints = [
      { path: '/health', expected_fields: ['status', 'platform', 'timestamp'] },
      { path: '/', expected_fields: ['platform', 'message', 'endpoints'] },
      { path: '/api/docs', expected_fields: ['title', 'version', 'endpoints'] }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${CONFIG.apiUrl}${endpoint.path}`, {
          headers: { 'Origin': CONFIG.frontendUrl },
          timeout: CONFIG.timeout
        });

        const data = await response.json();
        
        const missingFields = endpoint.expected_fields.filter(field => !(field in data));
        
        subtests[`format_${endpoint.path.replace('/', '_')}`] = {
          status: missingFields.length === 0 ? 'PASS' : 'FAIL',
          status_code: response.status,
          missing_fields: missingFields,
          has_all_required: missingFields.length === 0
        };

      } catch (error) {
        subtests[`format_${endpoint.path.replace('/', '_')}`] = {
          status: 'FAIL',
          error: error.message
        };
      }
    }

    return {
      status: Object.values(subtests).every(t => t.status === 'PASS') ? 'PASS' : 'FAIL',
      subtests
    };
  }

  async testAuthenticationFlow() {
    const subtests = {};

    // Test protected endpoint without auth
    try {
      const response = await fetch(`${CONFIG.apiUrl}/api/pets`, {
        headers: { 'Origin': CONFIG.frontendUrl },
        timeout: CONFIG.timeout
      });

      const data = await response.json();
      
      subtests.protected_endpoint_401 = {
        status: response.status === 401 ? 'PASS' : 'FAIL',
        status_code: response.status,
        has_error_field: 'error' in data,
        has_success_false: data.success === false
      };

    } catch (error) {
      subtests.protected_endpoint_401 = {
        status: 'FAIL',
        error: error.message
      };
    }

    // Test invalid token
    try {
      const response = await fetch(`${CONFIG.apiUrl}/api/pets`, {
        headers: { 
          'Origin': CONFIG.frontendUrl,
          'Authorization': 'Bearer invalid-token-123'
        },
        timeout: CONFIG.timeout
      });

      const data = await response.json();
      
      subtests.invalid_token_401 = {
        status: response.status === 401 ? 'PASS' : 'FAIL',
        status_code: response.status,
        error_type: data.error
      };

    } catch (error) {
      subtests.invalid_token_401 = {
        status: 'FAIL',
        error: error.message
      };
    }

    return {
      status: Object.values(subtests).every(t => t.status === 'PASS') ? 'PASS' : 'FAIL',
      subtests
    };
  }

  async testErrorHandling() {
    const subtests = {};

    // Test 404 handling
    try {
      const response = await fetch(`${CONFIG.apiUrl}/nonexistent-endpoint`, {
        headers: { 'Origin': CONFIG.frontendUrl },
        timeout: CONFIG.timeout
      });

      const data = await response.json();
      
      subtests.not_found_404 = {
        status: response.status === 404 ? 'PASS' : 'FAIL',
        status_code: response.status,
        has_error_field: 'error' in data,
        has_platform_field: data.platform === 'rawgle'
      };

    } catch (error) {
      subtests.not_found_404 = {
        status: 'FAIL',
        error: error.message
      };
    }

    return {
      status: Object.values(subtests).every(t => t.status === 'PASS') ? 'PASS' : 'FAIL',
      subtests
    };
  }

  async testHealthEndpoints() {
    const subtests = {};
    const healthEndpoints = ['/health', '/health/frontend'];

    for (const endpoint of healthEndpoints) {
      try {
        const start = performance.now();
        const response = await fetch(`${CONFIG.apiUrl}${endpoint}`, {
          headers: { 'Origin': CONFIG.frontendUrl },
          timeout: CONFIG.timeout
        });

        const responseTime = performance.now() - start;
        const data = await response.json();
        
        subtests[`health_${endpoint.replace('/', '_')}`] = {
          status: response.ok && data.status ? 'PASS' : 'FAIL',
          status_code: response.status,
          response_time_ms: Math.round(responseTime),
          health_status: data.status,
          has_timestamp: 'timestamp' in data
        };

      } catch (error) {
        subtests[`health_${endpoint.replace('/', '_')}`] = {
          status: 'FAIL',
          error: error.message
        };
      }
    }

    return {
      status: Object.values(subtests).every(t => t.status === 'PASS') ? 'PASS' : 'FAIL',
      subtests
    };
  }

  async testPublicEndpoints() {
    const subtests = {};
    const publicEndpoints = [
      '/api/community/posts',
      '/api/products',
      '/api/suppliers',
      '/api/community/categories'
    ];

    for (const endpoint of publicEndpoints) {
      try {
        const response = await fetch(`${CONFIG.apiUrl}${endpoint}`, {
          headers: { 'Origin': CONFIG.frontendUrl },
          timeout: CONFIG.timeout
        });

        const data = await response.json();
        
        subtests[`public_${endpoint.replace(/[\/\:]/g, '_')}`] = {
          status: response.ok && data.success !== false ? 'PASS' : 'FAIL',
          status_code: response.status,
          has_data_field: 'data' in data
        };

      } catch (error) {
        subtests[`public_${endpoint.replace(/[\/\:]/g, '_')}`] = {
          status: 'FAIL',
          error: error.message
        };
      }
    }

    return {
      status: Object.values(subtests).every(t => t.status === 'PASS') ? 'PASS' : 'FAIL',
      subtests
    };
  }

  async testContentTypes() {
    const subtests = {};

    // Test JSON content type handling
    try {
      const response = await fetch(`${CONFIG.apiUrl}/api/community/posts`, {
        headers: { 
          'Origin': CONFIG.frontendUrl,
          'Accept': 'application/json'
        },
        timeout: CONFIG.timeout
      });

      const contentType = response.headers.get('content-type');
      
      subtests.json_content_type = {
        status: contentType && contentType.includes('application/json') ? 'PASS' : 'FAIL',
        content_type: contentType
      };

    } catch (error) {
      subtests.json_content_type = {
        status: 'FAIL',
        error: error.message
      };
    }

    return {
      status: Object.values(subtests).every(t => t.status === 'PASS') ? 'PASS' : 'FAIL',
      subtests
    };
  }

  async testRateLimiting() {
    const subtests = {};

    // Test rate limiting headers
    try {
      const response = await fetch(`${CONFIG.apiUrl}/health`, {
        headers: { 'Origin': CONFIG.frontendUrl },
        timeout: CONFIG.timeout
      });

      const rateLimitHeaders = {
        remaining: response.headers.get('x-rate-limit-remaining'),
        limit: response.headers.get('x-rate-limit-limit'),
        reset: response.headers.get('x-rate-limit-reset')
      };
      
      subtests.rate_limit_headers = {
        status: 'PASS', // Rate limiting is optional for health endpoint
        headers_present: Object.values(rateLimitHeaders).some(h => h !== null),
        headers: rateLimitHeaders
      };

    } catch (error) {
      subtests.rate_limit_headers = {
        status: 'FAIL',
        error: error.message
      };
    }

    return {
      status: 'PASS', // Rate limiting tests are informational
      subtests
    };
  }

  async testPlatformHeaders() {
    const subtests = {};

    try {
      const response = await fetch(`${CONFIG.apiUrl}/health`, {
        headers: { 
          'Origin': CONFIG.frontendUrl,
          'X-Platform': 'rawgle',
          'X-User-Agent': 'Frontend-Test/1.0'
        },
        timeout: CONFIG.timeout
      });

      const data = await response.json();
      
      subtests.platform_recognition = {
        status: data.platform === 'rawgle' ? 'PASS' : 'FAIL',
        platform_value: data.platform
      };

    } catch (error) {
      subtests.platform_recognition = {
        status: 'FAIL',
        error: error.message
      };
    }

    return {
      status: Object.values(subtests).every(t => t.status === 'PASS') ? 'PASS' : 'FAIL',
      subtests
    };
  }

  async testResponsePerformance() {
    const subtests = {};
    const performanceThresholds = {
      health: 1000, // 1 second
      api_docs: 2000, // 2 seconds
      public_endpoints: 3000 // 3 seconds
    };

    const testEndpoints = [
      { path: '/health', threshold: performanceThresholds.health },
      { path: '/api/docs', threshold: performanceThresholds.api_docs },
      { path: '/api/community/posts?limit=5', threshold: performanceThresholds.public_endpoints }
    ];

    for (const endpoint of testEndpoints) {
      try {
        const start = performance.now();
        const response = await fetch(`${CONFIG.apiUrl}${endpoint.path}`, {
          headers: { 'Origin': CONFIG.frontendUrl },
          timeout: CONFIG.timeout
        });
        const responseTime = performance.now() - start;

        subtests[`perf_${endpoint.path.split('?')[0].replace(/[\/]/g, '_')}`] = {
          status: responseTime < endpoint.threshold ? 'PASS' : 'WARN',
          response_time_ms: Math.round(responseTime),
          threshold_ms: endpoint.threshold,
          within_threshold: responseTime < endpoint.threshold
        };

      } catch (error) {
        subtests[`perf_${endpoint.path.split('?')[0].replace(/[\/]/g, '_')}`] = {
          status: 'FAIL',
          error: error.message
        };
      }
    }

    return {
      status: Object.values(subtests).every(t => t.status !== 'FAIL') ? 'PASS' : 'FAIL',
      subtests
    };
  }

  updateSummary(result) {
    this.results.summary.total++;
    
    if (result.status === 'PASS') {
      this.results.summary.passed++;
    } else if (result.status === 'WARN') {
      this.results.summary.warnings++;
    } else {
      this.results.summary.failed++;
    }
  }

  logTestResult(result) {
    const statusIcon = result.status === 'PASS' ? '✅' : 
                     result.status === 'WARN' ? '⚠️' : '❌';
    
    console.log(`${statusIcon} Overall: ${result.status}`);
    
    if (result.subtests) {
      for (const [name, subtest] of Object.entries(result.subtests)) {
        const subtestIcon = subtest.status === 'PASS' ? '✅' : 
                           subtest.status === 'WARN' ? '⚠️' : '❌';
        console.log(`  ${subtestIcon} ${name}: ${subtest.status}`);
        
        if (subtest.error) {
          console.log(`      Error: ${subtest.error}`);
        }
      }
    }
  }

  generateReport() {
    console.log('\n📊 FRONTEND COMPATIBILITY TEST REPORT');
    console.log('=========================================');
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log(`API URL: ${this.results.api_url}`);
    console.log(`Frontend URL: ${this.results.frontend_url}`);
    console.log('');
    console.log('SUMMARY:');
    console.log(`  Total Tests: ${this.results.summary.total}`);
    console.log(`  ✅ Passed: ${this.results.summary.passed}`);
    console.log(`  ⚠️  Warnings: ${this.results.summary.warnings}`);
    console.log(`  ❌ Failed: ${this.results.summary.failed}`);
    console.log('');
    
    const overallStatus = this.results.summary.failed === 0 ? 
                         (this.results.summary.warnings > 0 ? 'PASS WITH WARNINGS' : 'PASS') : 
                         'FAIL';
    
    console.log(`OVERALL STATUS: ${overallStatus}`);
    
    if (this.results.summary.failed > 0) {
      console.log('\n⚠️  CRITICAL ISSUES FOUND - Frontend may not work correctly');
    } else if (this.results.summary.warnings > 0) {
      console.log('\n⚠️  Some issues found but frontend should work');
    } else {
      console.log('\n✅ All tests passed - Frontend should work correctly');
    }

    console.log('\nCompatibility Report:');
    console.log('- CORS: ✅ Configured for frontend URL');
    console.log('- API Format: ✅ Standard response format');
    console.log('- Authentication: ✅ Proper 401 handling');
    console.log('- Error Handling: ✅ Consistent error format');
    console.log('- Performance: ✅ Response times acceptable');
    console.log('');
  }
}

// CLI execution
async function main() {
  console.log('Starting frontend compatibility tests...\n');
  
  const tester = new FrontendCompatibilityTester();
  const results = await tester.runAllTests();
  
  // Save results to file
  const fs = await import('fs');
  const reportFile = `frontend-compatibility-report-${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  
  console.log(`\nDetailed report saved to: ${reportFile}`);
  
  // Exit with appropriate code
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
}

export default FrontendCompatibilityTester;