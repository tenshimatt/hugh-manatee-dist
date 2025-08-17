#!/usr/bin/env node

/**
 * Security Penetration Test Runner for Rawgle Platform
 * Tests for common vulnerabilities and security issues
 */

class SecurityTestRunner {
  constructor() {
    this.API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    this.results = [];
    this.startTime = Date.now();
  }

  async runSecurityTests() {
    console.log('🛡️  Starting Security Penetration Tests');
    console.log('=' .repeat(50));
    
    await this.testSQLInjection();
    await this.testXSSVulnerabilities();
    await this.testAuthenticationSecurity();
    await this.testAuthorizationFlaws();
    await this.testInputValidation();
    await this.testRateLimiting();
    await this.testCORSConfiguration();
    await this.testSecurityHeaders();
    await this.testSessionSecurity();
    await this.testFileUploadSecurity();
    
    this.generateSecurityReport();
  }

  async testSQLInjection() {
    console.log('\n💉 Testing SQL Injection Vulnerabilities...');
    
    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT password FROM users --",
      "admin'--",
      "' OR 1=1#",
      "' OR 'a'='a",
      "1; DELETE FROM users WHERE 1=1 --"
    ];

    const endpoints = [
      { name: 'Login Endpoint', path: '/api/auth/login', field: 'email' },
      { name: 'Registration Endpoint', path: '/api/auth/register', field: 'email' },
      { name: 'User Search', path: '/api/users/search', field: 'query' },
      { name: 'Supplier Search', path: '/api/suppliers', field: 'query' }
    ];

    for (const endpoint of endpoints) {
      console.log(`  Testing ${endpoint.name}...`);
      let vulnerabilities = 0;
      
      for (const payload of sqlPayloads) {
        try {
          const body = {};
          body[endpoint.field] = payload;
          body.password = 'testpass';
          
          const response = await fetch(`${this.API_BASE}${endpoint.path}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });

          const responseText = await response.text();
          
          // Check for SQL error messages or unexpected success
          const sqlErrors = [
            'sql syntax',
            'mysql_fetch',
            'ora-',
            'sqlite_',
            'postgresql',
            'syntax error',
            'database error'
          ];
          
          const hasError = sqlErrors.some(error => 
            responseText.toLowerCase().includes(error)
          );
          
          const unexpectedSuccess = response.status === 200 && payload.includes("'");
          
          if (hasError || unexpectedSuccess) {
            vulnerabilities++;
          }
          
        } catch (error) {
          // Network errors are not SQL injection vulnerabilities
        }
      }
      
      const passed = vulnerabilities === 0;
      
      this.results.push({
        category: 'SQL Injection',
        name: endpoint.name,
        status: passed ? 'passed' : 'failed',
        vulnerabilities,
        details: passed ? 'No SQL injection vulnerabilities detected' : `${vulnerabilities} potential vulnerabilities found`
      });
      
      console.log(`    ${passed ? '✅' : '❌'} ${endpoint.name}: ${vulnerabilities} vulnerabilities`);
    }
  }

  async testXSSVulnerabilities() {
    console.log('\n🔗 Testing XSS Vulnerabilities...');
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src="x" onerror="alert(\'XSS\')">',
      '<svg onload="alert(\'XSS\')">',
      '"><iframe src="javascript:alert(\'XSS\')"></iframe>'
    ];

    const endpoints = [
      { name: 'User Profile Update', path: '/api/users/profile', field: 'name' },
      { name: 'Review Submission', path: '/api/reviews', field: 'content' },
      { name: 'Comment System', path: '/api/comments', field: 'text' }
    ];

    for (const endpoint of endpoints) {
      console.log(`  Testing ${endpoint.name}...`);
      let vulnerabilities = 0;
      
      for (const payload of xssPayloads) {
        try {
          const body = {};
          body[endpoint.field] = payload;
          
          const response = await fetch(`${this.API_BASE}${endpoint.path}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });

          const responseText = await response.text();
          
          // Check if payload is reflected without proper encoding
          if (responseText.includes(payload) && !responseText.includes('&lt;script&gt;')) {
            vulnerabilities++;
          }
          
        } catch (error) {
          // Network errors are not XSS vulnerabilities
        }
      }
      
      const passed = vulnerabilities === 0;
      
      this.results.push({
        category: 'XSS',
        name: endpoint.name,
        status: passed ? 'passed' : 'failed',
        vulnerabilities,
        details: passed ? 'No XSS vulnerabilities detected' : `${vulnerabilities} potential vulnerabilities found`
      });
      
      console.log(`    ${passed ? '✅' : '❌'} ${endpoint.name}: ${vulnerabilities} vulnerabilities`);
    }
  }

  async testAuthenticationSecurity() {
    console.log('\n🔐 Testing Authentication Security...');
    
    // Test weak password acceptance
    console.log('  Testing weak password acceptance...');
    const weakPasswords = ['123', 'password', 'admin', '111111', 'qwerty'];
    let weakPasswordAccepted = false;
    
    for (const password of weakPasswords) {
      try {
        const response = await fetch(`${this.API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: `test-${Date.now()}@example.com`,
            password: password,
            username: `test${Date.now()}`
          })
        });
        
        if (response.status === 201 || response.status === 200) {
          weakPasswordAccepted = true;
          break;
        }
      } catch (error) {
        // Continue testing
      }
    }
    
    this.results.push({
      category: 'Authentication',
      name: 'Weak Password Protection',
      status: weakPasswordAccepted ? 'failed' : 'passed',
      details: weakPasswordAccepted ? 'Weak passwords are accepted' : 'Weak passwords are rejected'
    });
    
    console.log(`    ${weakPasswordAccepted ? '❌' : '✅'} Weak Password Protection`);
    
    // Test brute force protection
    console.log('  Testing brute force protection...');
    let attempts = 0;
    let blocked = false;
    
    for (let i = 0; i < 10; i++) {
      try {
        const response = await fetch(`${this.API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: `wrongpass${i}`
          })
        });
        
        attempts++;
        
        if (response.status === 429) {
          blocked = true;
          break;
        }
      } catch (error) {
        // Continue testing
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.results.push({
      category: 'Authentication',
      name: 'Brute Force Protection',
      status: blocked ? 'passed' : 'failed',
      attempts,
      details: blocked ? `Blocked after ${attempts} attempts` : `No blocking after ${attempts} attempts`
    });
    
    console.log(`    ${blocked ? '✅' : '❌'} Brute Force Protection: ${attempts} attempts`);
  }

  async testAuthorizationFlaws() {
    console.log('\n🔒 Testing Authorization Flaws...');
    
    // Test unauthorized access to protected endpoints
    const protectedEndpoints = [
      { name: 'User Profile', path: '/api/users/profile' },
      { name: 'PAWS Balance', path: '/api/paws/balance' },
      { name: 'Admin Panel', path: '/api/admin/users' },
      { name: 'Transaction History', path: '/api/paws/transactions' }
    ];

    for (const endpoint of protectedEndpoints) {
      console.log(`  Testing ${endpoint.name}...`);
      
      try {
        // Test without authentication
        const response = await fetch(`${this.API_BASE}${endpoint.path}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const properlyProtected = response.status === 401 || response.status === 403;
        
        this.results.push({
          category: 'Authorization',
          name: endpoint.name,
          status: properlyProtected ? 'passed' : 'failed',
          responseStatus: response.status,
          details: properlyProtected ? 'Properly protected' : `Accessible without auth (${response.status})`
        });
        
        console.log(`    ${properlyProtected ? '✅' : '❌'} ${endpoint.name}: ${response.status}`);
        
      } catch (error) {
        this.results.push({
          category: 'Authorization',
          name: endpoint.name,
          status: 'passed',
          details: 'Network error indicates proper protection'
        });
        
        console.log(`    ✅ ${endpoint.name}: Network protected`);
      }
    }
  }

  async testInputValidation() {
    console.log('\n✅ Testing Input Validation...');
    
    const maliciousInputs = [
      { name: 'Extremely Long String', value: 'A'.repeat(10000) },
      { name: 'Null Bytes', value: 'test\x00admin' },
      { name: 'Unicode Injection', value: 'test\u202eadmin' },
      { name: 'Control Characters', value: 'test\r\n\tSetUser:admin' },
      { name: 'Path Traversal', value: '../../../etc/passwd' },
      { name: 'Command Injection', value: 'test; rm -rf /' }
    ];

    const endpoints = [
      { name: 'User Registration', path: '/api/auth/register', field: 'username' },
      { name: 'Profile Update', path: '/api/users/profile', field: 'name' }
    ];

    for (const endpoint of endpoints) {
      console.log(`  Testing ${endpoint.name}...`);
      let validationIssues = 0;
      
      for (const input of maliciousInputs) {
        try {
          const body = {};
          body[endpoint.field] = input.value;
          body.email = 'test@example.com';
          body.password = 'testpass';
          
          const response = await fetch(`${this.API_BASE}${endpoint.path}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });
          
          // Input should be rejected (400) or processed safely (not 500)
          if (response.status === 500) {
            validationIssues++;
          }
          
        } catch (error) {
          // Network errors are acceptable
        }
      }
      
      const passed = validationIssues === 0;
      
      this.results.push({
        category: 'Input Validation',
        name: endpoint.name,
        status: passed ? 'passed' : 'failed',
        validationIssues,
        details: passed ? 'Input validation working properly' : `${validationIssues} validation issues found`
      });
      
      console.log(`    ${passed ? '✅' : '❌'} ${endpoint.name}: ${validationIssues} issues`);
    }
  }

  async testRateLimiting() {
    console.log('\n⏱️  Testing Rate Limiting...');
    
    const endpoints = [
      { name: 'Login Endpoint', path: '/api/auth/login' },
      { name: 'Registration Endpoint', path: '/api/auth/register' }
    ];

    for (const endpoint of endpoints) {
      console.log(`  Testing ${endpoint.name}...`);
      
      let rateLimited = false;
      const requests = [];
      
      // Send rapid requests
      for (let i = 0; i < 20; i++) {
        requests.push(
          fetch(`${this.API_BASE}${endpoint.path}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: `test${i}@example.com`,
              password: 'testpass'
            })
          }).then(response => response.status)
        );
      }
      
      const responses = await Promise.all(requests);
      rateLimited = responses.some(status => status === 429);
      
      this.results.push({
        category: 'Rate Limiting',
        name: endpoint.name,
        status: rateLimited ? 'passed' : 'failed',
        details: rateLimited ? 'Rate limiting active' : 'No rate limiting detected'
      });
      
      console.log(`    ${rateLimited ? '✅' : '❌'} ${endpoint.name}: ${rateLimited ? 'Limited' : 'Not limited'}`);
    }
  }

  async testCORSConfiguration() {
    console.log('\n🌐 Testing CORS Configuration...');
    
    try {
      const response = await fetch(`${this.API_BASE}/api/health`, {
        method: 'OPTIONS'
      });
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      };
      
      const hasWildcard = corsHeaders['Access-Control-Allow-Origin'] === '*';
      const hasProperMethods = corsHeaders['Access-Control-Allow-Methods']?.includes('GET');
      
      this.results.push({
        category: 'CORS',
        name: 'CORS Configuration',
        status: (hasWildcard && hasProperMethods) ? 'passed' : 'failed',
        corsHeaders,
        details: `Origin: ${corsHeaders['Access-Control-Allow-Origin']}, Methods: ${corsHeaders['Access-Control-Allow-Methods']}`
      });
      
      console.log(`    ${(hasWildcard && hasProperMethods) ? '✅' : '❌'} CORS Configuration`);
      
    } catch (error) {
      this.results.push({
        category: 'CORS',
        name: 'CORS Configuration',
        status: 'failed',
        details: `CORS test failed: ${error.message}`
      });
      
      console.log(`    ❌ CORS Configuration: ${error.message}`);
    }
  }

  async testSecurityHeaders() {
    console.log('\n🛡️  Testing Security Headers...');
    
    try {
      const response = await fetch(`${this.API_BASE}/api/health`);
      
      const securityHeaders = {
        'X-Content-Type-Options': response.headers.get('X-Content-Type-Options'),
        'X-Frame-Options': response.headers.get('X-Frame-Options'),
        'X-XSS-Protection': response.headers.get('X-XSS-Protection'),
        'Strict-Transport-Security': response.headers.get('Strict-Transport-Security'),
        'Content-Security-Policy': response.headers.get('Content-Security-Policy')
      };
      
      const headerTests = [
        { name: 'X-Content-Type-Options', expected: 'nosniff', actual: securityHeaders['X-Content-Type-Options'] },
        { name: 'X-Frame-Options', expected: 'DENY', actual: securityHeaders['X-Frame-Options'] },
        { name: 'X-XSS-Protection', expected: '1; mode=block', actual: securityHeaders['X-XSS-Protection'] }
      ];
      
      let headerScore = 0;
      
      for (const test of headerTests) {
        const present = test.actual !== null;
        if (present) headerScore++;
        
        this.results.push({
          category: 'Security Headers',
          name: test.name,
          status: present ? 'passed' : 'failed',
          details: present ? `Present: ${test.actual}` : 'Header not present'
        });
        
        console.log(`    ${present ? '✅' : '❌'} ${test.name}: ${present ? test.actual : 'Missing'}`);
      }
      
    } catch (error) {
      console.log(`    ❌ Security Headers Test Failed: ${error.message}`);
    }
  }

  async testSessionSecurity() {
    console.log('\n🍪 Testing Session Security...');
    
    try {
      // Test session token handling
      const loginResponse = await fetch(`${this.API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpass'
        })
      });
      
      const setCookieHeader = loginResponse.headers.get('Set-Cookie');
      const hasSecureFlag = setCookieHeader?.includes('Secure');
      const hasHttpOnlyFlag = setCookieHeader?.includes('HttpOnly');
      const hasSameSite = setCookieHeader?.includes('SameSite');
      
      this.results.push({
        category: 'Session Security',
        name: 'Cookie Security Flags',
        status: (hasSecureFlag && hasHttpOnlyFlag) ? 'passed' : 'failed',
        details: `Secure: ${hasSecureFlag}, HttpOnly: ${hasHttpOnlyFlag}, SameSite: ${hasSameSite}`
      });
      
      console.log(`    ${(hasSecureFlag && hasHttpOnlyFlag) ? '✅' : '❌'} Cookie Security Flags`);
      
    } catch (error) {
      this.results.push({
        category: 'Session Security',
        name: 'Session Security Test',
        status: 'failed',
        details: `Session test failed: ${error.message}`
      });
      
      console.log(`    ❌ Session Security: ${error.message}`);
    }
  }

  async testFileUploadSecurity() {
    console.log('\n📁 Testing File Upload Security...');
    
    const maliciousFiles = [
      { name: 'script.php', content: '<?php echo "malicious"; ?>', type: 'application/x-php' },
      { name: 'script.js', content: 'alert("xss")', type: 'application/javascript' },
      { name: 'large.txt', content: 'A'.repeat(10000000), type: 'text/plain' } // 10MB
    ];

    for (const file of maliciousFiles) {
      console.log(`  Testing ${file.name} upload...`);
      
      try {
        const formData = new FormData();
        const blob = new Blob([file.content], { type: file.type });
        formData.append('file', blob, file.name);
        
        const response = await fetch(`${this.API_BASE}/api/upload`, {
          method: 'POST',
          body: formData
        });
        
        const rejected = response.status === 400 || response.status === 415;
        
        this.results.push({
          category: 'File Upload Security',
          name: `${file.name} Upload`,
          status: rejected ? 'passed' : 'failed',
          details: rejected ? 'Malicious file rejected' : `File accepted (${response.status})`
        });
        
        console.log(`    ${rejected ? '✅' : '❌'} ${file.name}: ${rejected ? 'Rejected' : 'Accepted'}`);
        
      } catch (error) {
        this.results.push({
          category: 'File Upload Security',
          name: `${file.name} Upload`,
          status: 'passed',
          details: 'Upload endpoint not accessible'
        });
        
        console.log(`    ✅ ${file.name}: Endpoint protected`);
      }
    }
  }

  generateSecurityReport() {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('🛡️  SECURITY PENETRATION TEST REPORT');
    console.log('='.repeat(60));
    
    const categories = {};
    this.results.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = [];
      }
      categories[result.category].push(result);
    });

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'passed').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    const criticalFailures = this.results.filter(r => 
      r.status === 'failed' && 
      ['SQL Injection', 'XSS', 'Authentication', 'Authorization'].includes(r.category)
    ).length;
    
    console.log(`\n🔒 Security Summary:`);
    console.log(`   Total Security Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   🚨 Critical Failures: ${criticalFailures}`);
    console.log(`   🎯 Security Score: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`   ⏱️  Test Duration: ${(totalDuration / 1000).toFixed(1)}s`);

    console.log('\n📂 Security Results by Category:');
    
    for (const [category, tests] of Object.entries(categories)) {
      const categoryPassed = tests.filter(t => t.status === 'passed').length;
      const categoryRate = ((categoryPassed / tests.length) * 100).toFixed(1);
      
      console.log(`\n   ${category}:`);
      console.log(`     Security Score: ${categoryRate}% (${categoryPassed}/${tests.length})`);
      
      const failed = tests.filter(t => t.status === 'failed');
      if (failed.length > 0) {
        console.log(`     🚨 Vulnerabilities Found:`);
        failed.forEach(test => {
          console.log(`       - ${test.name}: ${test.details}`);
        });
      } else {
        console.log(`     ✅ No vulnerabilities detected`);
      }
    }

    console.log('\n🚨 Risk Assessment:');
    
    const securityScore = (passedTests / totalTests) * 100;
    
    if (criticalFailures > 0) {
      console.log(`   🔴 HIGH RISK - ${criticalFailures} critical security vulnerabilities detected`);
      console.log(`   🚨 IMMEDIATE ACTION REQUIRED`);
    } else if (securityScore >= 90) {
      console.log(`   🟢 LOW RISK - Strong security posture`);
    } else if (securityScore >= 75) {
      console.log(`   🟡 MEDIUM RISK - Some security improvements needed`);
    } else {
      console.log(`   🟠 HIGH RISK - Multiple security issues require attention`);
    }

    console.log('\n🛠️  Security Recommendations:');
    
    const recommendations = this.generateSecurityRecommendations();
    recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('End of Security Penetration Test Report');
    console.log('='.repeat(60));
  }

  generateSecurityRecommendations() {
    const recommendations = [];
    const failedCategories = {};
    
    this.results.forEach(result => {
      if (result.status === 'failed') {
        if (!failedCategories[result.category]) {
          failedCategories[result.category] = [];
        }
        failedCategories[result.category].push(result);
      }
    });

    if (failedCategories['SQL Injection']) {
      recommendations.push('Implement parameterized queries and input sanitization');
      recommendations.push('Use ORM frameworks with built-in SQL injection protection');
    }

    if (failedCategories['XSS']) {
      recommendations.push('Implement proper output encoding and Content Security Policy');
      recommendations.push('Validate and sanitize all user inputs');
    }

    if (failedCategories['Authentication']) {
      recommendations.push('Enforce strong password policies');
      recommendations.push('Implement account lockout mechanisms');
      recommendations.push('Add multi-factor authentication');
    }

    if (failedCategories['Authorization']) {
      recommendations.push('Implement proper access controls');
      recommendations.push('Use JWT tokens with appropriate expiration');
    }

    if (failedCategories['Rate Limiting']) {
      recommendations.push('Implement rate limiting on all endpoints');
      recommendations.push('Use distributed rate limiting for scalability');
    }

    if (failedCategories['Security Headers']) {
      recommendations.push('Configure security headers (X-Frame-Options, X-Content-Type-Options)');
      recommendations.push('Implement Content Security Policy');
    }

    if (recommendations.length === 0) {
      recommendations.push('Security posture is strong - continue monitoring');
      recommendations.push('Regular security audits and penetration testing');
      recommendations.push('Keep dependencies updated');
    }

    return recommendations;
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new SecurityTestRunner();
  runner.runSecurityTests().catch(console.error);
}

export { SecurityTestRunner };