/**
 * GoHunta.com Authentication Security Test Suite
 * Comprehensive testing for JWT security, MFA, session management, and brute force protection
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { expect } from 'chai';
import fetch from 'node-fetch';
import speakeasy from 'speakeasy';

export class AuthSecurityTests {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://api.gohunta.com';
    this.testUsers = config.testUsers || [];
    this.adminToken = config.adminToken;
    this.jwtSecret = config.jwtSecret;
    this.results = {
      passed: 0,
      failed: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
  }

  async runAllAuthTests() {
    console.log('🔒 Starting Authentication Security Tests...\n');
    
    try {
      // Critical Security Tests
      await this.testJWTSecurity();
      await this.testBruteForceProtection();
      await this.testSessionSecurity();
      await this.testMFASecurity();
      
      // High Priority Tests
      await this.testPasswordSecurity();
      await this.testAuthorizationBypass();
      await this.testSessionFixation();
      
      // Medium Priority Tests
      await this.testRateLimiting();
      await this.testSecurityHeaders();
      
      this.generateSecurityReport();
      
    } catch (error) {
      console.error('❌ Authentication security test suite failed:', error);
      throw error;
    }
  }

  /**
   * JWT Security Testing
   * Tests token validation, tampering detection, and expiration handling
   */
  async testJWTSecurity() {
    console.log('🔐 Testing JWT Security...');
    
    try {
      // Test 1: Valid JWT Token Validation
      const validToken = await this.createValidJWT();
      const validationResponse = await this.validateToken(validToken);
      
      this.assert(
        validationResponse.status === 200,
        'Valid JWT token should be accepted',
        'CRITICAL'
      );

      // Test 2: Tampered Token Detection
      const tamperedToken = this.tamperJWTToken(validToken);
      const tamperedResponse = await this.validateToken(tamperedToken);
      
      this.assert(
        tamperedResponse.status === 401,
        'Tampered JWT token should be rejected',
        'CRITICAL'
      );

      // Test 3: Expired Token Handling
      const expiredToken = await this.createExpiredJWT();
      const expiredResponse = await this.validateToken(expiredToken);
      
      this.assert(
        expiredResponse.status === 401,
        'Expired JWT token should be rejected',
        'CRITICAL'
      );

      // Test 4: Token Algorithm Confusion
      const noneAlgToken = this.createNoneAlgorithmToken();
      const noneAlgResponse = await this.validateToken(noneAlgToken);
      
      this.assert(
        noneAlgResponse.status === 401,
        'None algorithm JWT should be rejected',
        'CRITICAL'
      );

      // Test 5: JWT Claims Validation
      const invalidClaimsToken = this.createInvalidClaimsToken();
      const claimsResponse = await this.validateToken(invalidClaimsToken);
      
      this.assert(
        claimsResponse.status === 401,
        'Invalid claims should be rejected',
        'HIGH'
      );

      console.log('✅ JWT Security tests completed\n');
      
    } catch (error) {
      this.logFailure('JWT Security', error, 'CRITICAL');
    }
  }

  /**
   * Brute Force Protection Testing
   * Tests account lockout and rate limiting mechanisms
   */
  async testBruteForceProtection() {
    console.log('🛡️ Testing Brute Force Protection...');
    
    try {
      const testEmail = 'security-test@gohunta.com';
      const attempts = [];
      
      // Attempt multiple failed logins
      for (let i = 0; i < 7; i++) {
        const response = await fetch(`${this.baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            password: `wrong_password_${i}`
          })
        });
        
        attempts.push({
          attempt: i + 1,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Test rate limiting kicks in
      this.assert(
        attempts.slice(0, 5).every(a => a.status === 401),
        'First 5 failed attempts should return 401',
        'HIGH'
      );

      this.assert(
        attempts.slice(5).some(a => a.status === 429),
        'Subsequent attempts should be rate limited (429)',
        'HIGH'
      );

      // Test Retry-After header presence
      const rateLimitedAttempt = attempts.find(a => a.status === 429);
      if (rateLimitedAttempt) {
        this.assert(
          rateLimitedAttempt.headers['retry-after'],
          'Rate limited response should include Retry-After header',
          'MEDIUM'
        );
      }

      // Test account lockout notification
      const lockoutCheck = await this.checkAccountLockout(testEmail);
      this.assert(
        lockoutCheck.locked === true,
        'Account should be locked after failed attempts',
        'HIGH'
      );

      console.log('✅ Brute Force Protection tests completed\n');
      
    } catch (error) {
      this.logFailure('Brute Force Protection', error, 'HIGH');
    }
  }

  /**
   * Session Security Testing
   * Tests session management, fixation, and hijacking prevention
   */
  async testSessionSecurity() {
    console.log('🔒 Testing Session Security...');
    
    try {
      // Test 1: Session Regeneration on Login
      const loginResponse = await this.performLogin('test@gohunta.com', 'testpass123');
      const sessionId1 = this.extractSessionId(loginResponse);
      
      // Logout and login again
      await this.performLogout(loginResponse.headers.get('Authorization'));
      const loginResponse2 = await this.performLogin('test@gohunta.com', 'testpass123');
      const sessionId2 = this.extractSessionId(loginResponse2);
      
      this.assert(
        sessionId1 !== sessionId2,
        'Session ID should regenerate on new login',
        'HIGH'
      );

      // Test 2: Session Cookie Security
      const cookies = loginResponse.headers.get('Set-Cookie') || '';
      
      this.assert(
        cookies.includes('HttpOnly'),
        'Session cookies should be HttpOnly',
        'HIGH'
      );

      this.assert(
        cookies.includes('Secure'),
        'Session cookies should be Secure',
        'HIGH'
      );

      this.assert(
        cookies.includes('SameSite'),
        'Session cookies should have SameSite attribute',
        'MEDIUM'
      );

      // Test 3: Concurrent Session Handling
      const concurrentLogin = await this.performLogin('test@gohunta.com', 'testpass123');
      const originalSessionValid = await this.validateSession(loginResponse2.headers.get('Authorization'));
      
      this.assert(
        originalSessionValid.status === 401,
        'Original session should be invalidated on concurrent login',
        'MEDIUM'
      );

      // Test 4: Session Timeout
      const sessionTimeout = await this.testSessionTimeout();
      this.assert(
        sessionTimeout.timedOut === true,
        'Sessions should timeout after inactivity',
        'MEDIUM'
      );

      console.log('✅ Session Security tests completed\n');
      
    } catch (error) {
      this.logFailure('Session Security', error, 'HIGH');
    }
  }

  /**
   * Multi-Factor Authentication Security Testing
   * Tests TOTP setup, validation, and backup codes
   */
  async testMFASecurity() {
    console.log('🔐 Testing MFA Security...');
    
    try {
      const userToken = await this.createValidJWT();
      
      // Test 1: MFA Setup
      const mfaSetup = await fetch(`${this.baseUrl}/api/auth/mfa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      this.assert(
        mfaSetup.status === 200,
        'MFA setup should succeed for authenticated user',
        'HIGH'
      );

      const mfaData = await mfaSetup.json();
      
      this.assert(
        mfaData.secret && mfaData.qrCode && mfaData.backupCodes,
        'MFA setup should provide secret, QR code, and backup codes',
        'HIGH'
      );

      this.assert(
        mfaData.backupCodes.length === 10,
        'Should provide exactly 10 backup codes',
        'MEDIUM'
      );

      // Test 2: TOTP Validation
      const totpToken = speakeasy.totp({
        secret: mfaData.secret,
        encoding: 'base32'
      });

      const mfaValidation = await fetch(`${this.baseUrl}/api/auth/mfa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: totpToken })
      });

      this.assert(
        mfaValidation.status === 200,
        'Valid TOTP token should be accepted',
        'HIGH'
      );

      // Test 3: Invalid TOTP Rejection
      const invalidMFA = await fetch(`${this.baseUrl}/api/auth/mfa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: '123456' })
      });

      this.assert(
        invalidMFA.status === 401,
        'Invalid TOTP token should be rejected',
        'HIGH'
      );

      // Test 4: Backup Code Usage
      const backupCodeAuth = await fetch(`${this.baseUrl}/api/auth/mfa/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ backupCode: mfaData.backupCodes[0] })
      });

      this.assert(
        backupCodeAuth.status === 200,
        'Valid backup code should be accepted',
        'HIGH'
      );

      // Test 5: Backup Code Single Use
      const duplicateBackupCode = await fetch(`${this.baseUrl}/api/auth/mfa/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ backupCode: mfaData.backupCodes[0] })
      });

      this.assert(
        duplicateBackupCode.status === 401,
        'Used backup code should be rejected on reuse',
        'HIGH'
      );

      console.log('✅ MFA Security tests completed\n');
      
    } catch (error) {
      this.logFailure('MFA Security', error, 'HIGH');
    }
  }

  /**
   * Password Security Testing
   * Tests password strength, hashing, and reset functionality
   */
  async testPasswordSecurity() {
    console.log('🔐 Testing Password Security...');
    
    try {
      // Test 1: Password Strength Requirements
      const weakPasswords = [
        '123456',
        'password',
        'qwerty',
        'abc123',
        '1234567890',
        'password123'
      ];

      for (const weakPassword of weakPasswords) {
        const response = await this.attemptRegistration({
          email: 'test@example.com',
          password: weakPassword
        });

        this.assert(
          response.status === 400,
          `Weak password "${weakPassword}" should be rejected`,
          'HIGH'
        );
      }

      // Test 2: Strong Password Acceptance
      const strongPassword = 'HuntingLife2025!@#';
      const strongPassResponse = await this.attemptRegistration({
        email: 'strongpass@example.com',
        password: strongPassword
      });

      this.assert(
        strongPassResponse.status === 201,
        'Strong password should be accepted',
        'MEDIUM'
      );

      // Test 3: Password Reset Security
      const resetRequest = await fetch(`${this.baseUrl}/api/auth/reset-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@gohunta.com' })
      });

      this.assert(
        resetRequest.status === 200,
        'Password reset request should succeed',
        'MEDIUM'
      );

      // Test 4: Password Reset Token Security
      const resetTokenResponse = await resetRequest.json();
      const isSecureToken = this.validateResetToken(resetTokenResponse.resetToken);
      
      this.assert(
        isSecureToken,
        'Password reset token should be cryptographically secure',
        'HIGH'
      );

      console.log('✅ Password Security tests completed\n');
      
    } catch (error) {
      this.logFailure('Password Security', error, 'HIGH');
    }
  }

  /**
   * Authorization Bypass Testing
   * Tests for privilege escalation and unauthorized access
   */
  async testAuthorizationBypass() {
    console.log('🔒 Testing Authorization Bypass...');
    
    try {
      const regularUserToken = await this.createRegularUserJWT();
      
      // Test 1: Admin Endpoint Access
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/system',
        '/api/admin/reports',
        '/api/admin/security-logs'
      ];

      for (const endpoint of adminEndpoints) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${regularUserToken}` }
        });

        this.assert(
          response.status === 403,
          `Regular user should not access admin endpoint: ${endpoint}`,
          'CRITICAL'
        );
      }

      // Test 2: Other User's Data Access
      const userDataResponse = await fetch(`${this.baseUrl}/api/users/other-user-id/profile`, {
        headers: { 'Authorization': `Bearer ${regularUserToken}` }
      });

      this.assert(
        userDataResponse.status === 403,
        'User should not access other users\' private data',
        'HIGH'
      );

      // Test 3: Direct Object Reference
      const huntDataResponse = await fetch(`${this.baseUrl}/api/hunts/999999`, {
        headers: { 'Authorization': `Bearer ${regularUserToken}` }
      });

      this.assert(
        huntDataResponse.status === 403 || huntDataResponse.status === 404,
        'Should not access unauthorized hunt data',
        'HIGH'
      );

      console.log('✅ Authorization Bypass tests completed\n');
      
    } catch (error) {
      this.logFailure('Authorization Bypass', error, 'CRITICAL');
    }
  }

  /**
   * Rate Limiting Testing
   * Tests API rate limits and abuse prevention
   */
  async testRateLimiting() {
    console.log('⏱️ Testing Rate Limiting...');
    
    try {
      const rateLimitEndpoint = `${this.baseUrl}/api/public/search`;
      const requests = [];
      
      // Make 50 rapid requests
      for (let i = 0; i < 50; i++) {
        const promise = fetch(rateLimitEndpoint, {
          method: 'GET',
          headers: { 'X-Test-Request': `rate-limit-test-${i}` }
        });
        requests.push(promise);
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      this.assert(
        rateLimited.length > 0,
        'Rate limiting should activate under rapid requests',
        'MEDIUM'
      );

      // Check for rate limit headers
      const rateLimitResponse = rateLimited[0];
      if (rateLimitResponse) {
        const headers = Object.fromEntries(rateLimitResponse.headers.entries());
        
        this.assert(
          headers['x-ratelimit-limit'] || headers['retry-after'],
          'Rate limited response should include rate limit headers',
          'MEDIUM'
        );
      }

      console.log('✅ Rate Limiting tests completed\n');
      
    } catch (error) {
      this.logFailure('Rate Limiting', error, 'MEDIUM');
    }
  }

  /**
   * Security Headers Testing
   * Tests for proper security headers implementation
   */
  async testSecurityHeaders() {
    console.log('🛡️ Testing Security Headers...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      const headers = Object.fromEntries(response.headers.entries());
      
      const securityHeaders = {
        'strict-transport-security': 'HSTS header missing',
        'x-content-type-options': 'X-Content-Type-Options header missing',
        'x-frame-options': 'X-Frame-Options header missing',
        'content-security-policy': 'CSP header missing',
        'referrer-policy': 'Referrer-Policy header missing',
        'x-xss-protection': 'X-XSS-Protection header missing'
      };

      Object.entries(securityHeaders).forEach(([header, message]) => {
        this.assert(
          headers[header],
          message,
          'MEDIUM'
        );
      });

      // Test CSP header strength
      const csp = headers['content-security-policy'];
      if (csp) {
        this.assert(
          csp.includes("default-src 'self'"),
          'CSP should include restrictive default-src policy',
          'MEDIUM'
        );
      }

      console.log('✅ Security Headers tests completed\n');
      
    } catch (error) {
      this.logFailure('Security Headers', error, 'MEDIUM');
    }
  }

  // Helper Methods

  async createValidJWT() {
    const payload = {
      sub: 'test-user-123',
      email: 'test@gohunta.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 15) // 15 minutes
    };

    return jwt.sign(payload, this.jwtSecret || 'test-secret', { algorithm: 'HS256' });
  }

  async createExpiredJWT() {
    const payload = {
      sub: 'test-user-123',
      email: 'test@gohunta.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000) - 3600,
      exp: Math.floor(Date.now() / 1000) - 1800 // Expired 30 minutes ago
    };

    return jwt.sign(payload, this.jwtSecret || 'test-secret', { algorithm: 'HS256' });
  }

  tamperJWTToken(token) {
    const parts = token.split('.');
    if (parts.length !== 3) return token;
    
    // Tamper with the payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    payload.role = 'admin';
    
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64');
    return parts.join('.');
  }

  createNoneAlgorithmToken() {
    const header = { alg: 'none', typ: 'JWT' };
    const payload = {
      sub: 'test-user-123',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
    
    return `${encodedHeader}.${encodedPayload}.`;
  }

  async validateToken(token) {
    return fetch(`${this.baseUrl}/api/auth/validate`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
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

  generateSecurityReport() {
    console.log('\n📊 Authentication Security Test Results:');
    console.log('=' .repeat(50));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`🔴 Critical: ${this.results.critical}`);
    console.log(`🟠 High: ${this.results.high}`);
    console.log(`🟡 Medium: ${this.results.medium}`);
    console.log(`🟢 Low: ${this.results.low}`);
    
    const totalTests = this.results.passed + this.results.failed;
    const passRate = ((this.results.passed / totalTests) * 100).toFixed(2);
    console.log(`📈 Pass Rate: ${passRate}%`);
    
    if (this.results.critical > 0) {
      console.log('\n🚨 CRITICAL ISSUES DETECTED - IMMEDIATE ACTION REQUIRED');
    }
    
    return this.results;
  }
}

// Export for use in test runner
export default AuthSecurityTests;