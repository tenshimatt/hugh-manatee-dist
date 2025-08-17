/**
 * GoHunta.com API Security Test Suite
 * Comprehensive testing for SQL injection, XSS, CORS, input validation, and API security
 */

import fetch from 'node-fetch';
import { expect } from 'chai';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
global.DOMPurify = DOMPurify(window);

export class APISecurityTests {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://api.gohunta.com';
    this.authToken = config.authToken;
    this.adminToken = config.adminToken;
    this.results = {
      passed: 0,
      failed: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      sqlInjectionTests: [],
      xssTests: [],
      corsTests: [],
      inputValidationTests: []
    };
  }

  async runAllAPISecurityTests() {
    console.log('🔐 Starting API Security Tests...\n');
    
    try {
      // Critical Security Tests
      await this.testSQLInjectionPrevention();
      await this.testXSSPrevention();
      await this.testInputValidation();
      
      // High Priority Tests
      await this.testCORSConfiguration();
      await this.testAPIAuthenticationBypass();
      await this.testParameterTampering();
      
      // Medium Priority Tests
      await this.testHTTPMethodSecurity();
      await this.testAPIRateLimiting();
      await this.testErrorHandlingSecurity();
      
      this.generateAPISecurityReport();
      
    } catch (error) {
      console.error('❌ API security test suite failed:', error);
      throw error;
    }
  }

  /**
   * SQL Injection Prevention Testing
   * Tests various SQL injection attack vectors and prevention mechanisms
   */
  async testSQLInjectionPrevention() {
    console.log('💉 Testing SQL Injection Prevention...');
    
    const sqlInjectionPayloads = [
      // Classic SQL injection
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' OR 1=1 --",
      
      // Union-based injection
      "' UNION SELECT username, password FROM users --",
      "' UNION ALL SELECT NULL, version() --",
      
      // Boolean-based blind injection
      "' AND (SELECT COUNT(*) FROM users) > 0 --",
      "' OR (SELECT SUBSTRING(version(),1,1))='5' --",
      
      // Time-based blind injection
      "'; WAITFOR DELAY '00:00:05' --",
      "' OR IF(1=1, SLEEP(5), 0) --",
      
      // Error-based injection
      "' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a) --",
      
      // Second-order injection
      "admin'/**/UNION/**/SELECT/**/password/**/FROM/**/users/**/WHERE/**/username='admin'--",
      
      // NoSQL injection (for potential MongoDB usage)
      "'; return '1'=='1'; var dummy='",
      "'; return true; var dummy='"
    ];

    const testEndpoints = [
      { endpoint: '/api/dogs/search', method: 'POST', param: 'name' },
      { endpoint: '/api/hunts/search', method: 'POST', param: 'location' },
      { endpoint: '/api/users/search', method: 'GET', param: 'q' },
      { endpoint: '/api/events/search', method: 'POST', param: 'title' },
      { endpoint: '/api/gear/search', method: 'POST', param: 'description' }
    ];

    for (const testEndpoint of testEndpoints) {
      for (const payload of sqlInjectionPayloads) {
        try {
          const testResult = await this.testSQLInjectionOnEndpoint(
            testEndpoint, 
            payload
          );
          
          this.results.sqlInjectionTests.push({
            endpoint: testEndpoint.endpoint,
            payload: payload.substring(0, 50) + '...',
            blocked: testResult.blocked,
            responseTime: testResult.responseTime,
            statusCode: testResult.statusCode
          });
          
          this.assert(
            testResult.blocked,
            `SQL injection should be blocked on ${testEndpoint.endpoint}`,
            'CRITICAL'
          );
          
        } catch (error) {
          this.logFailure(`SQL Injection test on ${testEndpoint.endpoint}`, error, 'CRITICAL');
        }
      }
    }

    // Test parameterized query usage
    await this.testParameterizedQueries();
    
    console.log('✅ SQL Injection Prevention tests completed\n');
  }

  /**
   * XSS Prevention Testing
   * Tests cross-site scripting prevention and content sanitization
   */
  async testXSSPrevention() {
    console.log('🎭 Testing XSS Prevention...');
    
    const xssPayloads = [
      // Basic XSS
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      
      // Advanced XSS
      '"><script>alert("XSS")</script>',
      "'><script>alert('XSS')</script>",
      'javascript:alert("XSS")',
      
      // Event handler XSS
      '<input onfocus=alert("XSS") autofocus>',
      '<select onfocus=alert("XSS") autofocus>',
      '<textarea onfocus=alert("XSS") autofocus>',
      
      // CSS-based XSS
      '<style>@import"javascript:alert(\'XSS\')";</style>',
      '<link rel=stylesheet href="javascript:alert(\'XSS\')">',
      
      // DOM-based XSS
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<object data="javascript:alert(\'XSS\')">',
      
      // Filter evasion
      '<ScRiPt>alert("XSS")</ScRiPt>',
      '<script>alert(String.fromCharCode(88,83,83))</script>',
      '<img src="javascript:alert(\'XSS\')" />',
      
      // Unicode and encoding
      '<script>\\u0061lert("XSS")</script>',
      '<script>alert(\\x22XSS\\x22)</script>'
    ];

    const xssEndpoints = [
      { endpoint: '/api/community/posts', method: 'POST', fields: ['title', 'content'] },
      { endpoint: '/api/dogs/profile', method: 'PUT', fields: ['name', 'description'] },
      { endpoint: '/api/users/profile', method: 'PUT', fields: ['displayName', 'bio'] },
      { endpoint: '/api/events', method: 'POST', fields: ['title', 'description'] },
      { endpoint: '/api/gear/reviews', method: 'POST', fields: ['title', 'review'] }
    ];

    for (const endpoint of xssEndpoints) {
      for (const field of endpoint.fields) {
        for (const payload of xssPayloads) {
          try {
            const testResult = await this.testXSSOnEndpoint(
              endpoint, 
              field, 
              payload
            );
            
            this.results.xssTests.push({
              endpoint: endpoint.endpoint,
              field: field,
              payload: payload.substring(0, 50) + '...',
              sanitized: testResult.sanitized,
              outputSafe: testResult.outputSafe
            });
            
            this.assert(
              testResult.sanitized && testResult.outputSafe,
              `XSS should be prevented on ${endpoint.endpoint}:${field}`,
              'HIGH'
            );
            
          } catch (error) {
            this.logFailure(`XSS test on ${endpoint.endpoint}:${field}`, error, 'HIGH');
          }
        }
      }
    }

    // Test Content Security Policy
    await this.testCSPImplementation();
    
    console.log('✅ XSS Prevention tests completed\n');
  }

  /**
   * Input Validation Testing
   * Tests input validation, sanitization, and data type enforcement
   */
  async testInputValidation() {
    console.log('✅ Testing Input Validation...');
    
    const inputValidationTests = [
      // Email validation
      {
        endpoint: '/api/auth/register',
        field: 'email',
        invalidValues: ['invalid-email', '@domain.com', 'user@', 'user@domain'],
        validValue: 'test@gohunta.com'
      },
      
      // Phone number validation
      {
        endpoint: '/api/users/profile',
        field: 'phone',
        invalidValues: ['123', '123-45-6789', 'abcd', '++1234567890'],
        validValue: '+1234567890'
      },
      
      // Date validation
      {
        endpoint: '/api/hunts',
        field: 'huntDate',
        invalidValues: ['2023-13-01', '2023-02-30', 'invalid-date', '99/99/9999'],
        validValue: '2025-08-15'
      },
      
      // Numeric validation
      {
        endpoint: '/api/dogs',
        field: 'age',
        invalidValues: ['-1', '999', 'abc', '1.5.5', 'NaN'],
        validValue: '5'
      },
      
      // GPS coordinates
      {
        endpoint: '/api/hunts/location',
        field: 'latitude',
        invalidValues: ['91', '-91', 'abc', '45.123.456'],
        validValue: '45.123456'
      },
      
      // URL validation
      {
        endpoint: '/api/gear/reviews',
        field: 'productUrl',
        invalidValues: ['not-a-url', 'javascript:alert()', 'ftp://example.com'],
        validValue: 'https://example.com/product'
      }
    ];

    for (const test of inputValidationTests) {
      // Test invalid values are rejected
      for (const invalidValue of test.invalidValues) {
        try {
          const response = await this.testInputValidationOnEndpoint(
            test.endpoint,
            test.field,
            invalidValue
          );
          
          this.results.inputValidationTests.push({
            endpoint: test.endpoint,
            field: test.field,
            value: invalidValue,
            rejected: response.status >= 400,
            statusCode: response.status
          });
          
          this.assert(
            response.status >= 400,
            `Invalid ${test.field} "${invalidValue}" should be rejected`,
            'MEDIUM'
          );
          
        } catch (error) {
          this.logFailure(`Input validation test for ${test.field}`, error, 'MEDIUM');
        }
      }
      
      // Test valid value is accepted
      try {
        const validResponse = await this.testInputValidationOnEndpoint(
          test.endpoint,
          test.field,
          test.validValue
        );
        
        this.assert(
          validResponse.status < 400,
          `Valid ${test.field} "${test.validValue}" should be accepted`,
          'MEDIUM'
        );
        
      } catch (error) {
        this.logFailure(`Valid input test for ${test.field}`, error, 'MEDIUM');
      }
    }

    // Test file upload validation
    await this.testFileUploadValidation();
    
    console.log('✅ Input Validation tests completed\n');
  }

  /**
   * CORS Configuration Testing
   * Tests cross-origin resource sharing security configuration
   */
  async testCORSConfiguration() {
    console.log('🌐 Testing CORS Configuration...');
    
    try {
      // Test CORS preflight request
      const preflightResponse = await fetch(`${this.baseUrl}/api/dogs`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://malicious-site.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });

      const corsHeaders = Object.fromEntries(preflightResponse.headers.entries());
      
      // Test that malicious origins are rejected
      this.assert(
        !corsHeaders['access-control-allow-origin'] || 
        corsHeaders['access-control-allow-origin'] !== 'https://malicious-site.com',
        'Malicious origins should not be allowed',
        'HIGH'
      );

      // Test legitimate origin
      const legitimateResponse = await fetch(`${this.baseUrl}/api/dogs`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://gohunta.com',
          'Access-Control-Request-Method': 'GET'
        }
      });

      const legitimateCorsHeaders = Object.fromEntries(legitimateResponse.headers.entries());
      
      this.assert(
        legitimateCorsHeaders['access-control-allow-origin'] === 'https://gohunta.com' ||
        legitimateCorsHeaders['access-control-allow-origin'] === '*',
        'Legitimate origins should be allowed',
        'MEDIUM'
      );

      // Test credentials handling
      if (legitimateCorsHeaders['access-control-allow-credentials'] === 'true') {
        this.assert(
          legitimateCorsHeaders['access-control-allow-origin'] !== '*',
          'When credentials are allowed, origin should not be wildcard',
          'HIGH'
        );
      }

      this.results.corsTests.push({
        maliciousOriginBlocked: !corsHeaders['access-control-allow-origin'],
        legitimateOriginAllowed: !!legitimateCorsHeaders['access-control-allow-origin'],
        credentialsSecure: legitimateCorsHeaders['access-control-allow-credentials'] !== 'true' ||
                          legitimateCorsHeaders['access-control-allow-origin'] !== '*'
      });

      console.log('✅ CORS Configuration tests completed\n');
      
    } catch (error) {
      this.logFailure('CORS Configuration', error, 'HIGH');
    }
  }

  /**
   * API Authentication Bypass Testing
   * Tests for authentication bypass vulnerabilities in API endpoints
   */
  async testAPIAuthenticationBypass() {
    console.log('🔓 Testing API Authentication Bypass...');
    
    const protectedEndpoints = [
      '/api/users/profile',
      '/api/dogs',
      '/api/hunts',
      '/api/admin/users',
      '/api/admin/system'
    ];

    for (const endpoint of protectedEndpoints) {
      try {
        // Test without authentication
        const noAuthResponse = await fetch(`${this.baseUrl}${endpoint}`);
        
        this.assert(
          noAuthResponse.status === 401 || noAuthResponse.status === 403,
          `Protected endpoint ${endpoint} should require authentication`,
          'CRITICAL'
        );

        // Test with invalid token
        const invalidAuthResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: { 'Authorization': 'Bearer invalid_token_12345' }
        });
        
        this.assert(
          invalidAuthResponse.status === 401,
          `Invalid token should be rejected on ${endpoint}`,
          'CRITICAL'
        );

        // Test with expired token
        const expiredToken = this.createExpiredToken();
        const expiredAuthResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${expiredToken}` }
        });
        
        this.assert(
          expiredAuthResponse.status === 401,
          `Expired token should be rejected on ${endpoint}`,
          'HIGH'
        );

      } catch (error) {
        this.logFailure(`Authentication bypass test on ${endpoint}`, error, 'CRITICAL');
      }
    }

    console.log('✅ API Authentication Bypass tests completed\n');
  }

  /**
   * Parameter Tampering Testing
   * Tests for parameter manipulation and privilege escalation
   */
  async testParameterTampering() {
    console.log('🔧 Testing Parameter Tampering...');
    
    try {
      // Test user ID tampering
      const tamperingTests = [
        {
          endpoint: '/api/users/123/profile',
          tampered: '/api/users/../admin/profile',
          description: 'Path traversal attempt'
        },
        {
          endpoint: '/api/dogs/456',
          tampered: '/api/dogs/456?admin=true',
          description: 'Parameter injection'
        },
        {
          endpoint: '/api/hunts/789/details',
          tampered: '/api/hunts/*/details',
          description: 'Wildcard injection'
        }
      ];

      for (const test of tamperingTests) {
        const response = await fetch(`${this.baseUrl}${test.tampered}`, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        });

        this.assert(
          response.status >= 400,
          `Parameter tampering should be blocked: ${test.description}`,
          'HIGH'
        );
      }

      // Test JSON parameter manipulation
      const jsonTamperingResponse = await fetch(`${this.baseUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: 'Test User',
          role: 'admin', // Attempt privilege escalation
          isVerified: true
        })
      });

      this.assert(
        jsonTamperingResponse.status >= 400,
        'Role escalation via JSON parameter should be blocked',
        'HIGH'
      );

      console.log('✅ Parameter Tampering tests completed\n');
      
    } catch (error) {
      this.logFailure('Parameter Tampering', error, 'HIGH');
    }
  }

  /**
   * HTTP Method Security Testing
   * Tests for improper HTTP method handling
   */
  async testHTTPMethodSecurity() {
    console.log('🌐 Testing HTTP Method Security...');
    
    const endpoints = ['/api/users', '/api/dogs', '/api/hunts'];
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE'];

    for (const endpoint of endpoints) {
      for (const method of methods) {
        try {
          const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: method,
            headers: { 'Authorization': `Bearer ${this.authToken}` }
          });

          // TRACE method should be disabled
          if (method === 'TRACE') {
            this.assert(
              response.status === 405 || response.status === 501,
              `TRACE method should be disabled on ${endpoint}`,
              'MEDIUM'
            );
          }

          // HEAD should work where GET works
          if (method === 'HEAD') {
            const getResponse = await fetch(`${this.baseUrl}${endpoint}`, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            
            if (getResponse.status === 200) {
              this.assert(
                response.status === 200,
                `HEAD should work where GET works on ${endpoint}`,
                'LOW'
              );
            }
          }

        } catch (error) {
          // Method might not be implemented, which is fine
          continue;
        }
      }
    }

    console.log('✅ HTTP Method Security tests completed\n');
  }

  /**
   * API Rate Limiting Testing
   * Tests API-specific rate limiting and throttling
   */
  async testAPIRateLimiting() {
    console.log('⏱️ Testing API Rate Limiting...');
    
    const rateLimitEndpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/users/search',
      '/api/community/posts'
    ];

    for (const endpoint of rateLimitEndpoints) {
      try {
        const requests = [];
        const startTime = Date.now();
        
        // Make 20 rapid requests
        for (let i = 0; i < 20; i++) {
          requests.push(
            fetch(`${this.baseUrl}${endpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Test-Rate-Limit': `test-${i}`
              },
              body: JSON.stringify({ test: true })
            })
          );
        }

        const responses = await Promise.all(requests);
        const endTime = Date.now();
        const rateLimited = responses.filter(r => r.status === 429);

        this.assert(
          rateLimited.length > 0 || (endTime - startTime) > 5000,
          `Rate limiting should be active on ${endpoint}`,
          'MEDIUM'
        );

      } catch (error) {
        this.logFailure(`API Rate Limiting test on ${endpoint}`, error, 'MEDIUM');
      }
    }

    console.log('✅ API Rate Limiting tests completed\n');
  }

  /**
   * Error Handling Security Testing
   * Tests for information disclosure in error messages
   */
  async testErrorHandlingSecurity() {
    console.log('⚠️ Testing Error Handling Security...');
    
    const errorTests = [
      {
        endpoint: '/api/nonexistent',
        expectedStatus: 404,
        description: 'Non-existent endpoint'
      },
      {
        endpoint: '/api/users/99999999',
        expectedStatus: 404,
        description: 'Non-existent resource'
      },
      {
        endpoint: '/api/dogs',
        method: 'POST',
        body: '{"invalid": "json",,}',
        expectedStatus: 400,
        description: 'Malformed JSON'
      }
    ];

    for (const test of errorTests) {
      try {
        const response = await fetch(`${this.baseUrl}${test.endpoint}`, {
          method: test.method || 'GET',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          },
          body: test.body
        });

        this.assert(
          response.status === test.expectedStatus,
          `${test.description} should return ${test.expectedStatus}`,
          'LOW'
        );

        // Check error message doesn't leak sensitive info
        const errorText = await response.text();
        const sensitivePatterns = [
          /database/i,
          /sql/i,
          /table/i,
          /column/i,
          /stack trace/i,
          /internal error/i
        ];

        const leaksSensitiveInfo = sensitivePatterns.some(pattern => pattern.test(errorText));
        
        this.assert(
          !leaksSensitiveInfo,
          `Error message should not leak sensitive information for ${test.description}`,
          'MEDIUM'
        );

      } catch (error) {
        this.logFailure(`Error handling test: ${test.description}`, error, 'LOW');
      }
    }

    console.log('✅ Error Handling Security tests completed\n');
  }

  // Helper Methods

  async testSQLInjectionOnEndpoint(endpoint, payload) {
    const startTime = Date.now();
    let response;

    if (endpoint.method === 'GET') {
      response = await fetch(`${this.baseUrl}${endpoint.endpoint}?${endpoint.param}=${encodeURIComponent(payload)}`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
    } else {
      const body = {};
      body[endpoint.param] = payload;
      
      response = await fetch(`${this.baseUrl}${endpoint.endpoint}`, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    }

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();
    
    // Check if SQL injection was blocked (should not return database errors or data dumps)
    const sqlErrorPatterns = [
      /sql/i,
      /mysql/i,
      /postgresql/i,
      /sqlite/i,
      /syntax error/i,
      /column.*unknown/i,
      /table.*doesn't exist/i,
      /duplicate entry/i
    ];

    const blocked = !sqlErrorPatterns.some(pattern => pattern.test(responseText)) &&
                   response.status !== 500 && // Internal server error often indicates injection
                   responseTime < 10000; // Time-based injection detection

    return {
      blocked,
      responseTime,
      statusCode: response.status,
      hasErrorPatterns: sqlErrorPatterns.some(pattern => pattern.test(responseText))
    };
  }

  async testXSSOnEndpoint(endpoint, field, payload) {
    const body = {};
    body[field] = payload;

    const response = await fetch(`${this.baseUrl}${endpoint.endpoint}`, {
      method: endpoint.method,
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (response.status >= 400) {
      return { sanitized: true, outputSafe: true }; // Rejected input
    }

    const responseText = await response.text();
    const sanitized = !responseText.includes(payload);
    
    // Check if dangerous HTML tags are present
    const dangerousPatterns = [
      /<script.*?>.*?<\/script>/gi,
      /<iframe.*?>/gi,
      /<object.*?>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    const outputSafe = !dangerousPatterns.some(pattern => pattern.test(responseText));

    return { sanitized, outputSafe };
  }

  async testInputValidationOnEndpoint(endpoint, field, value) {
    const body = {};
    body[field] = value;

    return fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }

  assert(condition, message, severity) {
    if (condition) {
      this.results.passed++;
      console.log(`✅ ${message}`);
    } else {
      this.results.failed++;
      this.results[severity.toLowerCase()]++;
      console.log(`❌ ${message} (${severity})`);
    }
  }

  logFailure(testName, error, severity) {
    this.results.failed++;
    this.results[severity.toLowerCase()]++;
    console.error(`❌ ${testName} failed:`, error.message);
  }

  generateAPISecurityReport() {
    console.log('\n📊 API Security Test Results:');
    console.log('=' .repeat(50));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`🔴 Critical: ${this.results.critical}`);
    console.log(`🟠 High: ${this.results.high}`);
    console.log(`🟡 Medium: ${this.results.medium}`);
    console.log(`🟢 Low: ${this.results.low}`);
    
    console.log(`\n💉 SQL Injection Tests: ${this.results.sqlInjectionTests.length}`);
    console.log(`🎭 XSS Tests: ${this.results.xssTests.length}`);
    console.log(`✅ Input Validation Tests: ${this.results.inputValidationTests.length}`);
    console.log(`🌐 CORS Tests: ${this.results.corsTests.length}`);
    
    const totalTests = this.results.passed + this.results.failed;
    const passRate = ((this.results.passed / totalTests) * 100).toFixed(2);
    console.log(`📈 Pass Rate: ${passRate}%`);
    
    if (this.results.critical > 0) {
      console.log('\n🚨 CRITICAL API VULNERABILITIES DETECTED');
    }
    
    return this.results;
  }
}

export default APISecurityTests;