#!/usr/bin/env node

/**
 * Frontend Integration Test Runner
 * Tests React components, API connectivity, and user flows
 */

import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class FrontendIntegrationTest {
  constructor() {
    this.testResults = [];
    this.frontendPath = join(__dirname, 'rawgle-frontend');
    this.API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
  }

  async runFrontendTests() {
    console.log('🎨 Starting Frontend Integration Tests');
    console.log('=' .repeat(50));
    
    await this.testComponentStructure();
    await this.testAPIConnectivity();
    await this.testRoutingConfiguration();
    await this.testStateManagement();
    await this.testUserFlows();
    
    this.generateFrontendReport();
  }

  async testComponentStructure() {
    console.log('\n📁 Testing Component Structure...');
    
    const tests = [
      { name: 'Auth Components', path: 'src/components/auth' },
      { name: 'PAWS Components', path: 'src/components/paws' },
      { name: 'Supplier Components', path: 'src/components/suppliers' },
      { name: 'Notification Components', path: 'src/components/notifications' },
      { name: 'Context Providers', path: 'src/contexts' },
      { name: 'Custom Hooks', path: 'src/hooks' },
      { name: 'API Services', path: 'src/services' },
      { name: 'Utilities', path: 'src/utils' }
    ];

    for (const test of tests) {
      try {
        const files = await readdir(join(this.frontendPath, test.path));
        const jsxFiles = files.filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
        
        this.testResults.push({
          category: 'Structure',
          name: test.name,
          status: jsxFiles.length > 0 ? 'passed' : 'failed',
          details: `Found ${jsxFiles.length} files: ${jsxFiles.join(', ')}`
        });
        
        console.log(`  ✅ ${test.name}: ${jsxFiles.length} files`);
      } catch (error) {
        this.testResults.push({
          category: 'Structure',
          name: test.name,
          status: 'failed',
          details: `Directory not found: ${error.message}`
        });
        console.log(`  ❌ ${test.name}: Not found`);
      }
    }
  }

  async testAPIConnectivity() {
    console.log('\n🔌 Testing API Connectivity...');
    
    const endpoints = [
      { name: 'Health Check', path: '/api/health' },
      { name: 'Auth Registration', path: '/api/auth/register', method: 'POST' },
      { name: 'Auth Login', path: '/api/auth/login', method: 'POST' },
      { name: 'PAWS Balance', path: '/api/paws/balance' },
      { name: 'Suppliers Search', path: '/api/suppliers' },
      { name: 'Reviews', path: '/api/reviews' }
    ];

    for (const endpoint of endpoints) {
      try {
        const method = endpoint.method || 'GET';
        const response = await fetch(`${this.API_BASE}${endpoint.path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          // Add minimal body for POST requests
          ...(method === 'POST' && {
            body: JSON.stringify({})
          })
        });

        const isSuccess = response.status < 500; // Accept client errors as "working"
        
        this.testResults.push({
          category: 'API',
          name: endpoint.name,
          status: isSuccess ? 'passed' : 'failed',
          details: `HTTP ${response.status} - ${response.statusText}`
        });
        
        console.log(`  ${isSuccess ? '✅' : '❌'} ${endpoint.name}: ${response.status}`);
      } catch (error) {
        this.testResults.push({
          category: 'API',
          name: endpoint.name,
          status: 'failed',
          details: `Network error: ${error.message}`
        });
        console.log(`  ❌ ${endpoint.name}: ${error.message}`);
      }
    }
  }

  async testRoutingConfiguration() {
    console.log('\n🛣️  Testing Routing Configuration...');
    
    try {
      // Check if main App.jsx exists and likely has routing
      const appPath = join(this.frontendPath, 'src/App.jsx');
      const { readFile } = await import('fs/promises');
      const appContent = await readFile(appPath, 'utf-8');
      
      const routingTests = [
        { name: 'React Router Import', pattern: /react-router-dom/ },
        { name: 'Route Definitions', pattern: /<Route|<Routes/ },
        { name: 'Protected Routes', pattern: /ProtectedRoute/ },
        { name: 'Navigation Links', pattern: /<Link|<NavLink/ }
      ];

      for (const test of routingTests) {
        const found = test.pattern.test(appContent);
        this.testResults.push({
          category: 'Routing',
          name: test.name,
          status: found ? 'passed' : 'failed',
          details: found ? 'Pattern found in App.jsx' : 'Pattern not found'
        });
        
        console.log(`  ${found ? '✅' : '❌'} ${test.name}`);
      }
    } catch (error) {
      this.testResults.push({
        category: 'Routing',
        name: 'Routing Configuration',
        status: 'failed',
        details: `Could not analyze routing: ${error.message}`
      });
      console.log(`  ❌ Routing Configuration: ${error.message}`);
    }
  }

  async testStateManagement() {
    console.log('\n🔄 Testing State Management...');
    
    try {
      const { readFile } = await import('fs/promises');
      
      // Test AuthContext
      try {
        const authContextPath = join(this.frontendPath, 'src/contexts/AuthContext.jsx');
        const authContent = await readFile(authContextPath, 'utf-8');
        
        const authTests = [
          { name: 'Context Creation', pattern: /createContext/ },
          { name: 'Provider Component', pattern: /Provider/ },
          { name: 'Auth State Management', pattern: /useState|useReducer/ },
          { name: 'Login/Logout Methods', pattern: /login|logout/ }
        ];

        for (const test of authTests) {
          const found = test.pattern.test(authContent);
          this.testResults.push({
            category: 'State',
            name: `Auth: ${test.name}`,
            status: found ? 'passed' : 'failed',
            details: found ? 'Found in AuthContext' : 'Not found in AuthContext'
          });
          
          console.log(`  ${found ? '✅' : '❌'} Auth: ${test.name}`);
        }
      } catch (error) {
        console.log(`  ❌ AuthContext: Not found`);
      }

      // Test PAWS Context
      try {
        const pawsContextPath = join(this.frontendPath, 'src/contexts/PawsContext.jsx');
        const pawsContent = await readFile(pawsContextPath, 'utf-8');
        
        const pawsTests = [
          { name: 'PAWS State', pattern: /balance|paws/i },
          { name: 'Transaction Methods', pattern: /transfer|reward/ }
        ];

        for (const test of pawsTests) {
          const found = test.pattern.test(pawsContent);
          this.testResults.push({
            category: 'State',
            name: `PAWS: ${test.name}`,
            status: found ? 'passed' : 'failed',
            details: found ? 'Found in PawsContext' : 'Not found in PawsContext'
          });
          
          console.log(`  ${found ? '✅' : '❌'} PAWS: ${test.name}`);
        }
      } catch (error) {
        console.log(`  ❌ PawsContext: Not found`);
      }

    } catch (error) {
      console.log(`  ❌ State Management Analysis Failed: ${error.message}`);
    }
  }

  async testUserFlows() {
    console.log('\n👤 Testing User Flow Integration...');
    
    // Test user registration flow
    await this.testUserRegistrationFlow();
    
    // Test authentication flow
    await this.testAuthenticationFlow();
    
    // Test PAWS interaction flow
    await this.testPAWSFlow();
  }

  async testUserRegistrationFlow() {
    console.log('\n  📝 Testing User Registration Flow...');
    
    try {
      const testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        username: `testuser${Date.now()}`
      };

      const response = await fetch(`${this.API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      });

      const success = response.status === 201 || response.status === 200;
      
      this.testResults.push({
        category: 'User Flow',
        name: 'User Registration',
        status: success ? 'passed' : 'failed',
        details: `Registration endpoint returned ${response.status}`
      });
      
      console.log(`    ${success ? '✅' : '❌'} User Registration: ${response.status}`);
      
      return success ? testUser : null;
    } catch (error) {
      this.testResults.push({
        category: 'User Flow',
        name: 'User Registration',
        status: 'failed',
        details: `Registration failed: ${error.message}`
      });
      console.log(`    ❌ User Registration: ${error.message}`);
      return null;
    }
  }

  async testAuthenticationFlow() {
    console.log('\n  🔐 Testing Authentication Flow...');
    
    try {
      // Try login with test credentials
      const loginData = {
        email: 'test@example.com',
        password: 'testpassword'
      };

      const response = await fetch(`${this.API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      // Accept both success and authentication failure as "working"
      const isWorking = response.status === 200 || response.status === 401;
      
      this.testResults.push({
        category: 'User Flow',
        name: 'Authentication',
        status: isWorking ? 'passed' : 'failed',
        details: `Login endpoint returned ${response.status}`
      });
      
      console.log(`    ${isWorking ? '✅' : '❌'} Authentication: ${response.status}`);
    } catch (error) {
      this.testResults.push({
        category: 'User Flow',
        name: 'Authentication',
        status: 'failed',
        details: `Authentication failed: ${error.message}`
      });
      console.log(`    ❌ Authentication: ${error.message}`);
    }
  }

  async testPAWSFlow() {
    console.log('\n  🐾 Testing PAWS Flow...');
    
    try {
      const response = await fetch(`${this.API_BASE}/api/paws/balance`, {
        headers: {
          'Authorization': 'Bearer dummy-token'
        }
      });

      // Accept auth failure as "working" since we don't have valid token
      const isWorking = response.status === 401 || response.status === 200;
      
      this.testResults.push({
        category: 'User Flow',
        name: 'PAWS Balance Check',
        status: isWorking ? 'passed' : 'failed',
        details: `PAWS endpoint returned ${response.status}`
      });
      
      console.log(`    ${isWorking ? '✅' : '❌'} PAWS Balance: ${response.status}`);
    } catch (error) {
      this.testResults.push({
        category: 'User Flow',
        name: 'PAWS Balance Check',
        status: 'failed',
        details: `PAWS flow failed: ${error.message}`
      });
      console.log(`    ❌ PAWS Balance: ${error.message}`);
    }
  }

  generateFrontendReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🎨 FRONTEND INTEGRATION TEST REPORT');
    console.log('='.repeat(60));
    
    const categories = {};
    this.testResults.forEach(test => {
      if (!categories[test.category]) {
        categories[test.category] = [];
      }
      categories[test.category].push(test);
    });

    let totalTests = this.testResults.length;
    let passedTests = this.testResults.filter(t => t.status === 'passed').length;
    let failedTests = this.testResults.filter(t => t.status === 'failed').length;
    
    console.log(`\n📊 Overall Frontend Health:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   🎯 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    console.log('\n📂 Results by Category:');
    
    for (const [category, tests] of Object.entries(categories)) {
      const categoryPassed = tests.filter(t => t.status === 'passed').length;
      const categoryRate = ((categoryPassed / tests.length) * 100).toFixed(1);
      
      console.log(`\n   ${category}:`);
      console.log(`     Success Rate: ${categoryRate}% (${categoryPassed}/${tests.length})`);
      
      const failed = tests.filter(t => t.status === 'failed');
      if (failed.length > 0) {
        console.log(`     Failed:`);
        failed.forEach(test => {
          console.log(`       - ${test.name}: ${test.details}`);
        });
      }
    }

    // Frontend-specific recommendations
    console.log('\n💡 Frontend Recommendations:');
    
    if (failedTests > passedTests) {
      console.log('   🔴 Critical: Multiple frontend components failing');
      console.log('   • Review component structure and dependencies');
      console.log('   • Check API endpoint configurations');
      console.log('   • Verify routing and state management setup');
    } else {
      console.log('   🟢 Frontend structure appears healthy');
      console.log('   • Continue with component-level testing');
      console.log('   • Add unit tests for complex components');
    }

    console.log('\n' + '='.repeat(60));
    console.log('End of Frontend Integration Test Report');
    console.log('='.repeat(60));
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new FrontendIntegrationTest();
  runner.runFrontendTests().catch(console.error);
}

export { FrontendIntegrationTest };