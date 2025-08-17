/**
 * Enhanced Authentication Handler Unit Tests
 * Fixed version using enhanced test setup
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import authHandler from '../../src/handlers/auth.js';
import { 
  EnhancedTestHelpers, 
  createEnhancedMockEnv,
  ServiceMockFactory 
} from '../helpers/enhanced-test-setup.js';

// Mock service with the enhanced factory
const mockAuthService = ServiceMockFactory.createMockAuthService();

// Mock the auth service module
jest.mock('../../src/services/auth-service.js', () => ({
  AuthService: jest.fn().mockImplementation(() => mockAuthService)
}));

describe('Enhanced Authentication Handler', () => {
  let mockEnv;

  beforeEach(() => {
    mockEnv = createEnhancedMockEnv();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /register - User Registration', () => {
    test('should register new user successfully', async () => {
      const userData = {
        email: 'newuser@rawgle.com',
        password: 'SecurePass123!',
        name: 'New User',
        location: 'Test City'
      };

      const mockUser = EnhancedTestHelpers.createTestUser(userData);
      const mockToken = await EnhancedTestHelpers.createEnhancedJWT({ userId: mockUser.id });

      mockAuthService.register.mockResolvedValueOnce({
        user: mockUser,
        token: mockToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      const context = EnhancedTestHelpers.createEnhancedMockContext(mockEnv, {
        req: EnhancedTestHelpers.createEnhancedMockRequest('/register', {
          method: 'POST',
          body: userData
        })
      });

      context.set('validatedData', userData);

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Account created successfully');
      expect(data.data.user).toMatchObject({
        email: userData.email,
        name: userData.name,
        location: userData.location
      });
      expect(data.data.user.id).toBeDefined();
      expect(data.data.user.created_at).toBeDefined();
      expect(data.data.token).toBeDefined();
      expect(data.data.expires_at).toBeDefined();
    });

    test('should reject registration with existing email', async () => {
      const userData = {
        email: 'existing@rawgle.com', // This email is set up to exist in mock DB
        password: 'SecurePass123!',
        name: 'Existing User'
      };

      mockAuthService.register.mockRejectedValueOnce(
        new Error('An account with this email already exists')
      );

      const context = EnhancedTestHelpers.createEnhancedMockContext(mockEnv, {
        req: EnhancedTestHelpers.createEnhancedMockRequest('/register', {
          method: 'POST',
          body: userData
        })
      });

      context.set('validatedData', userData);

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('EMAIL_EXISTS');
      expect(data.message).toBe('An account with this email already exists');
    });

    test('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@rawgle.com',
        password: '123',
        name: 'Test User'
      };

      mockAuthService.register.mockRejectedValueOnce(
        new Error('Password must be at least 8 characters')
      );

      const context = EnhancedTestHelpers.createEnhancedMockContext(mockEnv, {
        req: EnhancedTestHelpers.createEnhancedMockRequest('/register', {
          method: 'POST',
          body: userData
        })
      });

      context.set('validatedData', userData);

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('Password must be at least 8 characters');
    });

    test('should handle server error during registration', async () => {
      const userData = {
        email: 'test@rawgle.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };

      mockAuthService.register.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const context = EnhancedTestHelpers.createEnhancedMockContext(mockEnv, {
        req: EnhancedTestHelpers.createEnhancedMockRequest('/register', {
          method: 'POST',
          body: userData
        })
      });

      context.set('validatedData', userData);

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('REGISTRATION_FAILED');
      expect(data.message).toBe('Failed to create account. Please try again.');
    });
  });

  describe('POST /login - User Login', () => {
    test('should login user successfully', async () => {
      const loginData = {
        email: 'existing@rawgle.com',
        password: 'SecurePass123!',
        remember_me: false
      };

      const mockUser = EnhancedTestHelpers.createTestUser({ email: loginData.email });
      const mockToken = await EnhancedTestHelpers.createEnhancedJWT({ userId: mockUser.id });

      mockAuthService.login.mockResolvedValueOnce({
        user: mockUser,
        token: mockToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      const context = EnhancedTestHelpers.createEnhancedMockContext(mockEnv, {
        req: EnhancedTestHelpers.createEnhancedMockRequest('/login', {
          method: 'POST',
          body: loginData
        })
      });

      context.set('validatedData', loginData);

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Login successful');
      expect(data.data.user).toEqual(mockUser);
      expect(data.data.token).toBe(mockToken);
      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginData.email,
        loginData.password,
        expect.objectContaining({
          platform: 'rawgle',
          rememberMe: loginData.remember_me
        })
      );
    });

    test('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'user@rawgle.com',
        password: 'wrongpassword',
        remember_me: false
      };

      mockAuthService.login.mockRejectedValueOnce(
        new Error('Invalid credentials')
      );

      const context = EnhancedTestHelpers.createEnhancedMockContext(mockEnv, {
        req: EnhancedTestHelpers.createEnhancedMockRequest('/login', {
          method: 'POST',
          body: loginData
        })
      });

      context.set('validatedData', loginData);

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_CREDENTIALS');
      expect(data.message).toBe('Invalid email or password');
    });

    test('should reject login for unverified email', async () => {
      const loginData = {
        email: 'unverified@rawgle.com',
        password: 'SecurePass123!',
        remember_me: false
      };

      mockAuthService.login.mockRejectedValueOnce(
        new Error('Email not verified')
      );

      const context = EnhancedTestHelpers.createEnhancedMockContext(mockEnv, {
        req: EnhancedTestHelpers.createEnhancedMockRequest('/login', {
          method: 'POST',
          body: loginData
        })
      });

      context.set('validatedData', loginData);

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('EMAIL_NOT_VERIFIED');
      expect(data.message).toBe('Please verify your email address before logging in');
    });
  });

  describe('POST /logout - User Logout', () => {
    test('should logout user successfully', async () => {
      const { context, testUser, authToken } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/logout',
        method: 'POST'
      });

      mockAuthService.logout.mockResolvedValueOnce(true);

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Logged out successfully');
      expect(mockAuthService.logout).toHaveBeenCalledWith(authToken, testUser.id);
    });

    test('should handle logout error gracefully', async () => {
      const { context, testUser, authToken } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/logout',
        method: 'POST'
      });

      mockAuthService.logout.mockRejectedValueOnce(
        new Error('Token invalidation failed')
      );

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('LOGOUT_FAILED');
    });
  });

  describe('POST /refresh - Token Refresh', () => {
    test('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const newToken = await EnhancedTestHelpers.createEnhancedJWT({ userId: 'user-123' });

      mockAuthService.refreshToken.mockResolvedValueOnce({
        token: newToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      const context = EnhancedTestHelpers.createEnhancedMockContext(mockEnv, {
        req: EnhancedTestHelpers.createEnhancedMockRequest('/refresh', {
          method: 'POST',
          headers: { 'x-refresh-token': refreshToken }
        })
      });

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Token refreshed successfully');
      expect(data.data.token).toBe(newToken);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshToken);
    });

    test('should reject refresh without refresh token', async () => {
      const context = EnhancedTestHelpers.createEnhancedMockContext(mockEnv, {
        req: EnhancedTestHelpers.createEnhancedMockRequest('/refresh', {
          method: 'POST'
        })
      });

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('REFRESH_TOKEN_REQUIRED');
      expect(data.message).toBe('Refresh token is required');
    });

    test('should reject invalid refresh token', async () => {
      const invalidToken = 'invalid-refresh-token';

      mockAuthService.refreshToken.mockRejectedValueOnce(
        new Error('Invalid refresh token')
      );

      const context = EnhancedTestHelpers.createEnhancedMockContext(mockEnv, {
        req: EnhancedTestHelpers.createEnhancedMockRequest('/refresh', {
          method: 'POST',
          headers: { 'x-refresh-token': invalidToken }
        })
      });

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('TOKEN_REFRESH_FAILED');
    });
  });

  describe('GET /profile - Get User Profile', () => {
    test('should get user profile successfully', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/profile',
        method: 'GET'
      });

      const mockProfile = { ...testUser, stats: { pets: 2, posts: 5 } };
      mockAuthService.getUserProfile.mockResolvedValueOnce(mockProfile);

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user).toEqual(mockProfile);
      expect(mockAuthService.getUserProfile).toHaveBeenCalledWith(testUser.id);
    });

    test('should handle profile fetch error', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/profile',
        method: 'GET'
      });

      mockAuthService.getUserProfile.mockRejectedValueOnce(
        new Error('User not found')
      );

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PROFILE_FETCH_FAILED');
    });
  });

  describe('PUT /profile - Update User Profile', () => {
    test('should update user profile successfully', async () => {
      const updates = {
        bio: 'Raw feeding enthusiast',
        experience_level: 'intermediate'
      };

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/profile',
        method: 'PUT',
        body: updates
      });

      const updatedProfile = { ...testUser, ...updates };
      context.set('validatedData', updates);

      mockAuthService.updateProfile.mockResolvedValueOnce(updatedProfile);

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Profile updated successfully');
      expect(data.data.user).toEqual(updatedProfile);
      expect(mockAuthService.updateProfile).toHaveBeenCalledWith(testUser.id, updates);
    });

    test('should reject invalid profile updates', async () => {
      const invalidUpdates = { experience_level: 'invalid_level' };

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/profile',
        method: 'PUT',
        body: invalidUpdates
      });

      context.set('validatedData', invalidUpdates);
      mockAuthService.updateProfile.mockRejectedValueOnce(
        new Error('Invalid experience level')
      );

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /change-password - Change Password', () => {
    test('should change password successfully', async () => {
      const passwordData = {
        current_password: 'OldPass123!',
        new_password: 'NewPass123!',
        confirm_password: 'NewPass123!'
      };

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/change-password',
        method: 'POST',
        body: passwordData
      });

      context.set('validatedData', passwordData);
      mockAuthService.changePassword.mockResolvedValueOnce(true);

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Password changed successfully');
      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        testUser.id,
        passwordData.current_password,
        passwordData.new_password
      );
    });

    test('should reject incorrect current password', async () => {
      const passwordData = {
        current_password: 'WrongPass123!',
        new_password: 'NewPass123!',
        confirm_password: 'NewPass123!'
      };

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/change-password',
        method: 'POST',
        body: passwordData
      });

      context.set('validatedData', passwordData);
      mockAuthService.changePassword.mockRejectedValueOnce(
        new Error('Current password is incorrect')
      );

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_CURRENT_PASSWORD');
    });
  });

  describe('DELETE /account - Delete Account', () => {
    test('should delete account successfully', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/account',
        method: 'DELETE',
        body: { confirm_deletion: true }
      });

      mockAuthService.deleteAccount.mockResolvedValueOnce(true);

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Account deleted successfully');
      expect(mockAuthService.deleteAccount).toHaveBeenCalledWith(testUser.id);
    });

    test('should require deletion confirmation', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/account',
        method: 'DELETE',
        body: { confirm_deletion: false }
      });

      const response = await authHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('CONFIRMATION_REQUIRED');
      expect(data.message).toBe('Account deletion must be confirmed');
    });
  });
});