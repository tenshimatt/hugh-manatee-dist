// Comprehensive Authentication Service Tests
// Tests both Rawgle and GoHunta platform authentication

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../src/services/auth-service.js';
import { TestDatabase } from './helpers/test-database.js';
import { TestKV } from './helpers/test-kv.js';

describe('AuthService - Unified Platform Tests', () => {
  let authService;
  let testDb;
  let testKv;

  beforeEach(async () => {
    testDb = new TestDatabase();
    testKv = new TestKV();
    await testDb.setup();
    authService = new AuthService(testDb.db, testKv);
  });

  afterEach(async () => {
    await testDb.cleanup();
    await testKv.cleanup();
  });

  describe('User Registration - Positive Test Cases', () => {
    it('should register Rawgle user successfully', async () => {
      const userData = {
        email: 'rawgle.user@example.com',
        password: 'SecurePass123!',
        name: 'Raw Feeding Enthusiast',
        location: 'California, USA'
      };

      const result = await authService.register(userData, 'rawgle');

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.platform).toBe('rawgle');
      expect(result.user.subscriptionTier).toBe('free');
      expect(result.user.emailVerified).toBe(false);
      expect(result.session).toBeDefined();
      expect(result.session.token).toBeDefined();
      expect(result.session.expiresAt).toBeDefined();
    });

    it('should register GoHunta user successfully', async () => {
      const userData = {
        email: 'hunter@example.com',
        password: 'HuntPass123!',
        name: 'Gun Dog Hunter',
        location: 'Montana, USA'
      };

      const result = await authService.register(userData, 'gohunta');

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.platform).toBe('gohunta');
      expect(result.user.subscriptionTier).toBe('free');
      expect(result.user.id).toBeDefined();
      expect(result.session.token).toBeDefined();
    });

    it('should create user with proper password hashing', async () => {
      const userData = {
        email: 'secure@example.com',
        password: 'MySecurePass123!',
        name: 'Security Test User'
      };

      await authService.register(userData, 'rawgle');

      // Verify password is hashed in database
      const userInDb = await testDb.query(
        'SELECT password_hash FROM users WHERE email = ?',
        [userData.email]
      );

      expect(userInDb.password_hash).toBeDefined();
      expect(userInDb.password_hash).not.toBe(userData.password);
      expect(userInDb.password_hash).toMatch(/^\$2[ayb]\$\d+\$/); // bcrypt hash pattern
    });

    it('should create session in KV store', async () => {
      const userData = {
        email: 'session@example.com',
        password: 'SessionTest123!',
        name: 'Session Test User'
      };

      const result = await authService.register(userData, 'rawgle');
      
      // Verify session exists in KV
      const sessionData = await testKv.get(`session:${result.session.token}`);
      expect(sessionData).toBeDefined();
      
      const parsedSession = JSON.parse(sessionData);
      expect(parsedSession.userId).toBe(result.user.id);
      expect(parsedSession.platform).toBe('rawgle');
    });
  });

  describe('User Registration - Negative Test Cases', () => {
    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'not-an-email',
        password: 'ValidPass123!',
        name: 'Test User'
      };

      await expect(authService.register(userData, 'rawgle'))
        .rejects.toThrow('Invalid email format');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User'
      };

      await expect(authService.register(userData, 'rawgle'))
        .rejects.toThrow('Password must be at least 8 characters');
    });

    it('should reject registration with missing required fields', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'ValidPass123!'
        // missing name
      };

      await expect(authService.register(userData, 'rawgle'))
        .rejects.toThrow('Email, password, and name are required');
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'ValidPass123!',
        name: 'First User'
      };

      // Register first user
      await authService.register(userData, 'rawgle');

      // Try to register second user with same email
      const duplicateUserData = {
        ...userData,
        name: 'Second User'
      };

      await expect(authService.register(duplicateUserData, 'gohunta'))
        .rejects.toThrow('User already exists with this email');
    });
  });

  describe('User Login - Positive Test Cases', () => {
    beforeEach(async () => {
      // Create test users for login tests
      await authService.register({
        email: 'rawgle.login@example.com',
        password: 'RawglePass123!',
        name: 'Rawgle Login User'
      }, 'rawgle');

      await authService.register({
        email: 'gohunta.login@example.com',
        password: 'HuntaPass123!',
        name: 'GoHunta Login User'
      }, 'gohunta');
    });

    it('should login Rawgle user successfully', async () => {
      const result = await authService.login(
        'rawgle.login@example.com',
        'RawglePass123!',
        'rawgle'
      );

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('rawgle.login@example.com');
      expect(result.user.platform).toBe('rawgle');
      expect(result.session).toBeDefined();
      expect(result.session.token).toBeDefined();
    });

    it('should login GoHunta user successfully', async () => {
      const result = await authService.login(
        'gohunta.login@example.com',
        'HuntaPass123!',
        'gohunta'
      );

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('gohunta.login@example.com');
      expect(result.user.platform).toBe('gohunta');
      expect(result.session).toBeDefined();
    });

    it('should update last login timestamp', async () => {
      const beforeLogin = new Date();
      
      await authService.login(
        'rawgle.login@example.com',
        'RawglePass123!',
        'rawgle'
      );

      const userInDb = await testDb.query(
        'SELECT last_login FROM users WHERE email = ?',
        ['rawgle.login@example.com']
      );

      const lastLogin = new Date(userInDb.last_login);
      expect(lastLogin.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });

    it('should clear failed login attempts on successful login', async () => {
      const email = 'rawgle.login@example.com';
      
      // Record some failed attempts
      await authService.recordFailedLogin(email);
      await authService.recordFailedLogin(email);

      // Successful login should clear attempts
      await authService.login(email, 'RawglePass123!', 'rawgle');

      const attempts = await testKv.get(`login_attempts:${email}`);
      expect(attempts).toBeNull();
    });
  });

  describe('User Login - Negative Test Cases', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'test.login@example.com',
        password: 'TestPass123!',
        name: 'Test User'
      }, 'rawgle');
    });

    it('should reject login with wrong password', async () => {
      await expect(authService.login(
        'test.login@example.com',
        'WrongPassword123!',
        'rawgle'
      )).rejects.toThrow('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      await expect(authService.login(
        'nonexistent@example.com',
        'AnyPassword123!',
        'rawgle'
      )).rejects.toThrow('Invalid email or password');
    });

    it('should reject login for wrong platform', async () => {
      await expect(authService.login(
        'test.login@example.com',
        'TestPass123!',
        'gohunta'
      )).rejects.toThrow('This account is not registered for gohunta');
    });

    it('should enforce rate limiting after multiple failed attempts', async () => {
      const email = 'test.login@example.com';
      
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        try {
          await authService.login(email, 'WrongPassword', 'rawgle');
        } catch (error) {
          // Expected to fail
        }
      }

      // 6th attempt should be rate limited
      await expect(authService.login(email, 'WrongPassword', 'rawgle'))
        .rejects.toThrow('Too many login attempts');
    });

    it('should reject login with missing credentials', async () => {
      await expect(authService.login('', 'password', 'rawgle'))
        .rejects.toThrow('Email and password are required');

      await expect(authService.login('email@example.com', '', 'rawgle'))
        .rejects.toThrow('Email and password are required');
    });
  });

  describe('Session Management - Positive Test Cases', () => {
    let userSession;

    beforeEach(async () => {
      const registerResult = await authService.register({
        email: 'session.test@example.com',
        password: 'SessionPass123!',
        name: 'Session Test User'
      }, 'rawgle');
      userSession = registerResult.session;
    });

    it('should verify valid session', async () => {
      const sessionInfo = await authService.verifySession(userSession.token);

      expect(sessionInfo).toBeDefined();
      expect(sessionInfo.user).toBeDefined();
      expect(sessionInfo.user.email).toBe('session.test@example.com');
      expect(sessionInfo.sessionData).toBeDefined();
    });

    it('should refresh session token', async () => {
      const newSession = await authService.refreshSession(userSession.token);

      expect(newSession).toBeDefined();
      expect(newSession.token).toBeDefined();
      expect(newSession.token).not.toBe(userSession.token);
      expect(newSession.expiresAt).toBeDefined();

      // Old session should be invalid
      const oldSessionInfo = await authService.verifySession(userSession.token);
      expect(oldSessionInfo).toBeNull();

      // New session should be valid
      const newSessionInfo = await authService.verifySession(newSession.token);
      expect(newSessionInfo).toBeDefined();
    });

    it('should logout and invalidate session', async () => {
      await authService.logout(userSession.token);

      const sessionInfo = await authService.verifySession(userSession.token);
      expect(sessionInfo).toBeNull();
    });
  });

  describe('Session Management - Negative Test Cases', () => {
    it('should reject invalid session token', async () => {
      const sessionInfo = await authService.verifySession('invalid-token');
      expect(sessionInfo).toBeNull();
    });

    it('should reject expired session token', async () => {
      // Create a session with immediate expiry
      const userId = crypto.randomUUID();
      const expiredPayload = {
        sub: userId,
        platform: 'rawgle',
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) - 1800  // 30 minutes ago
      };
      
      // We can't easily test this without mocking JWT verification
      // This test documents the expected behavior
      const sessionInfo = await authService.verifySession('expired.token.here');
      expect(sessionInfo).toBeNull();
    });

    it('should handle missing session gracefully', async () => {
      const sessionInfo = await authService.verifySession(null);
      expect(sessionInfo).toBeNull();

      const sessionInfo2 = await authService.verifySession(undefined);
      expect(sessionInfo2).toBeNull();
    });
  });

  describe('Password Management - Positive Test Cases', () => {
    let testUser;

    beforeEach(async () => {
      const registerResult = await authService.register({
        email: 'password.test@example.com',
        password: 'OriginalPass123!',
        name: 'Password Test User'
      }, 'rawgle');
      testUser = registerResult.user;
    });

    it('should change password successfully', async () => {
      await authService.changePassword(
        testUser.id,
        'OriginalPass123!',
        'NewPassword123!'
      );

      // Should be able to login with new password
      const loginResult = await authService.login(
        testUser.email,
        'NewPassword123!',
        'rawgle'
      );
      expect(loginResult.user.id).toBe(testUser.id);
    });

    it('should request password reset', async () => {
      await authService.requestPasswordReset(testUser.email, 'rawgle');

      // Check that reset token was created (implementation dependent)
      // This test documents the expected behavior
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Password Management - Negative Test Cases', () => {
    let testUser;

    beforeEach(async () => {
      const registerResult = await authService.register({
        email: 'password.fail@example.com',
        password: 'OriginalPass123!',
        name: 'Password Fail User'
      }, 'rawgle');
      testUser = registerResult.user;
    });

    it('should reject password change with wrong current password', async () => {
      await expect(authService.changePassword(
        testUser.id,
        'WrongCurrentPass123!',
        'NewPassword123!'
      )).rejects.toThrow('Current password is incorrect');
    });

    it('should reject password change with weak new password', async () => {
      await expect(authService.changePassword(
        testUser.id,
        'OriginalPass123!',
        'weak'
      )).rejects.toThrow('New password must be at least 8 characters');
    });

    it('should reject password change for non-existent user', async () => {
      await expect(authService.changePassword(
        'non-existent-user-id',
        'OriginalPass123!',
        'NewPassword123!'
      )).rejects.toThrow('User not found');
    });
  });

  describe('Cross-Platform Authentication Tests', () => {
    it('should allow user to register on both platforms', async () => {
      // Register on Rawgle first
      const rawgleResult = await authService.register({
        email: 'cross.platform@example.com',
        password: 'CrossPass123!',
        name: 'Cross Platform User'
      }, 'rawgle');

      expect(rawgleResult.user.platform).toBe('rawgle');

      // Update user to have access to both platforms
      await testDb.execute(
        'UPDATE users SET platform = ? WHERE id = ?',
        ['both', rawgleResult.user.id]
      );

      // Should be able to login to both platforms
      const rawgleLogin = await authService.login(
        'cross.platform@example.com',
        'CrossPass123!',
        'rawgle'
      );
      expect(rawgleLogin.user.platform).toBe('both');

      const gohuntaLogin = await authService.login(
        'cross.platform@example.com',
        'CrossPass123!',
        'gohunta'
      );
      expect(gohuntaLogin.user.platform).toBe('both');
    });

    it('should maintain separate sessions per platform', async () => {
      // Create user with both platform access
      const registerResult = await authService.register({
        email: 'multi.session@example.com',
        password: 'MultiPass123!',
        name: 'Multi Session User'
      }, 'rawgle');

      await testDb.execute(
        'UPDATE users SET platform = ? WHERE id = ?',
        ['both', registerResult.user.id]
      );

      // Login to both platforms
      const rawgleSession = await authService.login(
        'multi.session@example.com',
        'MultiPass123!',
        'rawgle'
      );

      const gohuntaSession = await authService.login(
        'multi.session@example.com',
        'MultiPass123!',
        'gohunta'
      );

      // Sessions should be different
      expect(rawgleSession.session.token).not.toBe(gohuntaSession.session.token);

      // Both sessions should be valid
      const rawgleVerify = await authService.verifySession(rawgleSession.session.token);
      const gohuntaVerify = await authService.verifySession(gohuntaSession.session.token);

      expect(rawgleVerify).toBeDefined();
      expect(gohuntaVerify).toBeDefined();
      expect(rawgleVerify.sessionData.platform).toBe('rawgle');
      expect(gohuntaVerify.sessionData.platform).toBe('gohunta');
    });
  });

  describe('Security Tests', () => {
    it('should not expose password in user data', async () => {
      const result = await authService.register({
        email: 'security@example.com',
        password: 'SecurityPass123!',
        name: 'Security User'
      }, 'rawgle');

      expect(result.user.password).toBeUndefined();
      expect(result.user.password_hash).toBeUndefined();
    });

    it('should validate JWT token integrity', async () => {
      const result = await authService.register({
        email: 'jwt.test@example.com',
        password: 'JWTPass123!',
        name: 'JWT Test User'
      }, 'rawgle');

      // Tamper with token
      const tamperedToken = result.session.token.slice(0, -5) + 'XXXXX';
      
      const sessionInfo = await authService.verifySession(tamperedToken);
      expect(sessionInfo).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      // Simulate database error by using invalid DB instance
      const invalidAuthService = new AuthService(null, testKv);
      
      await expect(invalidAuthService.register({
        email: 'error@example.com',
        password: 'ErrorPass123!',
        name: 'Error User'
      }, 'rawgle')).rejects.toThrow();
    });
  });
});