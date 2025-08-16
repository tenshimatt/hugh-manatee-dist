#!/usr/bin/env node

/**
 * Simple API validation script
 */

import { promises as fs } from 'fs';
import path from 'path';

// Mock environment for testing
const testEnv = {
  DB: {
    prepare: (query) => ({
      bind: (...params) => ({
        first: async () => ({ count: 0, test: 1 }),
        all: async () => ({ results: [] }),
        run: async () => ({ meta: { last_row_id: 1, changes: 1 } })
      }),
      first: async () => ({ count: 0, test: 1 }),
      all: async () => ({ results: [] }),
      run: async () => ({ meta: { last_row_id: 1, changes: 1 } })
    }),
    batch: async (operations) => operations.map(() => ({ meta: { last_row_id: 1, changes: 1 } }))
  },
  JWT_SECRET: 'test-secret-key',
  BCRYPT_ROUNDS: '10',
  RATE_LIMIT_WINDOW: '60',
  RATE_LIMIT_MAX_REQUESTS: '100',
  PAWS_EARNING_RATES: '{"order_completion": 10, "review_submission": 5, "referral": 25}',
  API_VERSION: 'v1',
  ENVIRONMENT: 'test'
};

// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = { passed: 0, failed: 0, total: 0 };
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('🚀 Running API validation tests...\n');
    
    for (const { name, testFn } of this.tests) {
      try {
        await testFn();
        console.log(`✅ ${name}`);
        this.results.passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}\n`);
        this.results.failed++;
      }
      this.results.total++;
    }

    console.log(`\n📊 Test Results:`);
    console.log(`   Total: ${this.results.total}`);
    console.log(`   Passed: ${this.results.passed}`);
    console.log(`   Failed: ${this.results.failed}`);
    console.log(`   Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%\n`);

    return this.results.failed === 0;
  }
}

const runner = new TestRunner();

// Test authentication utilities
runner.test('CryptoUtils - JWT generation and verification', async () => {
  const { CryptoUtils } = await import('./src/utils/crypto.js');
  
  const payload = { userId: 1, email: 'test@example.com' };
  const token = CryptoUtils.generateJWT(payload, testEnv.JWT_SECRET);
  
  if (!token || typeof token !== 'string') {
    throw new Error('JWT generation failed');
  }

  const verified = CryptoUtils.verifyJWT(token, testEnv.JWT_SECRET);
  if (verified.userId !== payload.userId) {
    throw new Error('JWT verification failed');
  }
});

runner.test('CryptoUtils - Password hashing and verification', async () => {
  const { CryptoUtils } = await import('./src/utils/crypto.js');
  
  const password = 'testPassword123!';
  const hash = await CryptoUtils.hashPassword(password);
  
  if (!hash || typeof hash !== 'string') {
    throw new Error('Password hashing failed');
  }

  const isValid = await CryptoUtils.verifyPassword(password, hash);
  if (!isValid) {
    throw new Error('Password verification failed');
  }

  const isInvalid = await CryptoUtils.verifyPassword('wrongPassword', hash);
  if (isInvalid) {
    throw new Error('Password verification should have failed');
  }
});

runner.test('ValidationUtils - Input sanitization', async () => {
  const { ValidationUtils } = await import('./src/utils/validation.js');
  
  const maliciousInput = '<script>alert("xss")</script><p>test</p>';
  const sanitized = ValidationUtils.sanitizeInput(maliciousInput);
  
  if (sanitized.includes('<script>') || sanitized.includes('alert')) {
    throw new Error('XSS sanitization failed');
  }

  const sqlInjection = "'; DROP TABLE users; --";
  const sanitizedSql = ValidationUtils.sanitizeInput(sqlInjection);
  
  if (sanitizedSql.includes('DROP TABLE') || sanitizedSql.includes('--')) {
    throw new Error('SQL injection sanitization failed');
  }
});

runner.test('ValidationUtils - User registration schema', async () => {
  const { ValidationUtils, userRegistrationSchema } = await import('./src/utils/validation.js');
  
  const validData = {
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'John',
    lastName: 'Doe'
  };

  const result = ValidationUtils.validateRequest(userRegistrationSchema, validData);
  if (!result || result.email !== validData.email) {
    throw new Error('Valid data validation failed');
  }

  try {
    ValidationUtils.validateRequest(userRegistrationSchema, {
      email: 'invalid-email',
      password: 'weak',
      firstName: '',
      lastName: ''
    });
    throw new Error('Invalid data should have been rejected');
  } catch (error) {
    if (!error.message.includes('Invalid email') && !error.message.startsWith('[')) {
      throw error;
    }
  }
});

runner.test('DatabaseUtils - Query preparation', async () => {
  const { DatabaseUtils } = await import('./src/utils/database.js');
  
  const result = await DatabaseUtils.executeQueryFirst(
    testEnv.DB, 
    'SELECT COUNT(*) as count FROM users WHERE id = ?', 
    [1]
  );
  
  if (!result || typeof result.count === 'undefined') {
    throw new Error('Database query failed');
  }
});

runner.test('Security middleware - Request validation', async () => {
  const { validateRequestOrigin, detectSuspiciousActivity } = await import('./src/middleware/security.js');
  
  // Test valid origin
  const validRequest = new Request('https://example.com/api/test', {
    headers: { 'Origin': 'https://rawgle.com' }
  });
  
  const originResult = validateRequestOrigin(validRequest, { FRONTEND_URL: 'https://rawgle.com' });
  if (originResult) {
    throw new Error('Valid origin should be allowed');
  }

  // Test suspicious activity detection
  const suspiciousRequest = new Request('https://example.com/api/test', {
    headers: { 'User-Agent': 'sqlmap/1.0' }
  });
  
  const suspiciousResult = detectSuspiciousActivity(suspiciousRequest);
  if (!suspiciousResult || suspiciousResult.status !== 403) {
    throw new Error('Suspicious activity should be blocked');
  }
});

runner.test('Performance monitoring', async () => {
  const { PerformanceMonitor } = await import('./src/middleware/performance.js');
  
  const monitor = new PerformanceMonitor();
  
  // Record some test metrics
  monitor.recordRequest('GET', '/api/test', 150, 200);
  monitor.recordRequest('GET', '/api/test', 200, 200);
  monitor.recordRequest('POST', '/api/test', 300, 400);
  
  const metrics = monitor.getMetrics();
  
  if (!metrics['GET_/api/test'] || metrics['GET_/api/test'].requests !== 2) {
    throw new Error('Performance metrics recording failed');
  }

  if (parseFloat(metrics['GET_/api/test'].avgResponseTime) !== 175) {
    throw new Error('Average response time calculation failed');
  }
});

runner.test('Route structure validation', async () => {
  // Check if all route files exist and export routers
  const routes = [
    './src/routes/auth.js',
    './src/routes/suppliers.js', 
    './src/routes/paws.js',
    './src/routes/reviews.js',
    './src/routes/orders.js',
    './src/routes/notifications.js',
    './src/routes/ai-medical.js'
  ];

  for (const routePath of routes) {
    try {
      const routeModule = await import(routePath);
      const routerName = path.basename(routePath, '.js');
      const expectedExport = `${routerName === 'ai-medical' ? 'aiMedical' : routerName}Router`;
      
      if (!routeModule[expectedExport]) {
        throw new Error(`Router export ${expectedExport} not found in ${routePath}`);
      }
    } catch (error) {
      throw new Error(`Failed to load route ${routePath}: ${error.message}`);
    }
  }
});

runner.test('Environment configuration', async () => {
  // Test that all required environment variables are defined
  const requiredEnvVars = [
    'JWT_SECRET',
    'BCRYPT_ROUNDS', 
    'RATE_LIMIT_WINDOW',
    'RATE_LIMIT_MAX_REQUESTS',
    'PAWS_EARNING_RATES',
    'API_VERSION'
  ];

  for (const envVar of requiredEnvVars) {
    if (!testEnv[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set`);
    }
  }

  // Test that PAWS_EARNING_RATES is valid JSON
  try {
    JSON.parse(testEnv.PAWS_EARNING_RATES);
  } catch (error) {
    throw new Error('PAWS_EARNING_RATES is not valid JSON');
  }
});

// Run the tests
runner.run().then(success => {
  if (success) {
    console.log('🎉 All tests passed! API implementation looks good.');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed. Please review the implementation.');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});