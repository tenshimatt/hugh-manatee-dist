/**
 * Comprehensive unit tests for authentication endpoints
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authRouter } from '../../src/routes/auth.js';
import { 
  UserFactory, 
  TestEnvironmentFactory, 
  RequestFactory,
  DatabaseMock 
} from '../fixtures/index.js';

// Mock external dependencies
vi.mock('../../src/utils/crypto.js', () => ({
  CryptoUtils: {
    hashPassword: vi.fn().mockResolvedValue('hashed_password'),
    verifyPassword: vi.fn(),
    generateJWT: vi.fn().mockReturnValue('mock_jwt_token')
  }
}));

vi.mock('../../src/middleware/rateLimit.js', () => ({
  authRateLimit: vi.fn().mockResolvedValue(null)
}));

vi.mock('../../src/middleware/auth.js', () => ({
  requireAuth: vi.fn(),
  createUserSession: vi.fn().mockResolvedValue(),
  revokeUserSession: vi.fn().mockResolvedValue()
}));

vi.mock('../../src/utils/database.js', () => ({
  UserQueries: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn().mockResolvedValue('mock_user_id'),
    update: vi.fn().mockResolvedValue(),
    updatePawsBalance: vi.fn().mockResolvedValue()
  },
  TransactionQueries: {
    create: vi.fn().mockResolvedValue()
  }
}));

describe('Auth Router - POST /register', () => {
  let env;
  let mockDB;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    mockDB = new DatabaseMock();
    env.DB = mockDB;
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should successfully register a new user with valid data', async () => {
      const registrationData = UserFactory.createRegistrationData();
      const request = RequestFactory.create('POST', '/api/auth/register', {
        body: registrationData
      });

      // Mock user doesn't exist
      const { UserQueries } = await import('../../src/utils/database.js');
      UserQueries.findByEmail.mockResolvedValue(null);
      UserQueries.findById.mockResolvedValue({
        id: 'mock_user_id',
        email: registrationData.email,
        first_name: registrationData.firstName,
        last_name: registrationData.lastName,
        paws_balance: 100
      });

      const response = await authRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.user).toBeDefined();
      expect(responseData.data.token).toBe('mock_jwt_token');
      expect(responseData.data.message).toBe('Registration successful');
      
      // Verify password was hashed
      const { CryptoUtils } = await import('../../src/utils/crypto.js');
      expect(CryptoUtils.hashPassword).toHaveBeenCalledWith(registrationData.password);
      
      // Verify user creation
      expect(UserQueries.create).toHaveBeenCalled();
      
      // Verify welcome bonus
      expect(UserQueries.updatePawsBalance).toHaveBeenCalledWith(env.DB, 'mock_user_id', 100);
    });

    it('should create welcome bonus transaction', async () => {
      const registrationData = UserFactory.createRegistrationData();
      const request = RequestFactory.create('POST', '/api/auth/register', {
        body: registrationData
      });

      const { UserQueries, TransactionQueries } = await import('../../src/utils/database.js');
      UserQueries.findByEmail.mockResolvedValue(null);
      UserQueries.findById.mockResolvedValue({
        id: 'mock_user_id',
        email: registrationData.email
      });

      await authRouter.handle(request, env);

      expect(TransactionQueries.create).toHaveBeenCalledWith(env.DB, {
        userId: 'mock_user_id',
        type: 'earned',
        amount: 100,
        description: 'Welcome bonus',
        referenceType: 'bonus',
        balanceAfter: 100
      });
    });
  });

  describe('Negative Test Cases', () => {
    it('should fail when user already exists', async () => {
      const registrationData = UserFactory.createRegistrationData();
      const request = RequestFactory.create('POST', '/api/auth/register', {
        body: registrationData
      });

      // Mock user exists
      const { UserQueries } = await import('../../src/utils/database.js');
      UserQueries.findByEmail.mockResolvedValue({
        id: 'existing_user_id',
        email: registrationData.email
      });

      const response = await authRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.error).toBe('User with this email already exists');
      expect(responseData.code).toBe('EMAIL_EXISTS');
    });

    it('should fail with invalid email format', async () => {
      const registrationData = UserFactory.createRegistrationData({
        email: 'invalid-email'
      });
      const request = RequestFactory.create('POST', '/api/auth/register', {
        body: registrationData
      });

      const response = await authRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with weak password', async () => {
      const registrationData = UserFactory.createRegistrationData({
        password: '123'
      });
      const request = RequestFactory.create('POST', '/api/auth/register', {
        body: registrationData
      });

      const response = await authRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Validation failed');
    });

    it('should fail with missing required fields', async () => {
      const request = RequestFactory.create('POST', '/api/auth/register', {
        body: { email: 'test@example.com' } // Missing other required fields
      });

      const response = await authRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Validation failed');
    });

    it('should handle database errors gracefully', async () => {
      const registrationData = UserFactory.createRegistrationData();
      const request = RequestFactory.create('POST', '/api/auth/register', {
        body: registrationData
      });

      const { UserQueries } = await import('../../src/utils/database.js');
      UserQueries.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      const response = await authRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Registration failed');
      expect(responseData.code).toBe('REGISTRATION_ERROR');
    });
  });

  describe('Security Test Cases', () => {
    it('should respect rate limiting', async () => {
      const registrationData = UserFactory.createRegistrationData();
      const request = RequestFactory.create('POST', '/api/auth/register', {
        body: registrationData
      });

      // Mock rate limit exceeded
      const { authRateLimit } = await import('../../src/middleware/rateLimit.js');
      authRateLimit.mockResolvedValue(new Response('Rate limit exceeded', { status: 429 }));

      const response = await authRouter.handle(request, env);

      expect(response.status).toBe(429);
      expect(authRateLimit).toHaveBeenCalledWith(request, env);
    });

    it('should not expose sensitive information in error responses', async () => {
      const registrationData = UserFactory.createRegistrationData();
      const request = RequestFactory.create('POST', '/api/auth/register', {
        body: registrationData
      });

      const { UserQueries } = await import('../../src/utils/database.js');
      UserQueries.findByEmail.mockRejectedValue(new Error('Database password: secret123'));

      const response = await authRouter.handle(request, env);
      const responseData = await response.json();

      expect(responseData.error).not.toContain('password');
      expect(responseData.error).not.toContain('secret');
    });
  });
});

describe('Auth Router - POST /login', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should successfully login with valid credentials', async () => {
      const loginData = UserFactory.createLoginData();
      const mockUser = UserFactory.create({
        email: loginData.email,
        password_hash: 'hashed_password'
      });
      const request = RequestFactory.create('POST', '/api/auth/login', {
        body: loginData
      });

      const { UserQueries } = await import('../../src/utils/database.js');
      const { CryptoUtils } = await import('../../src/utils/crypto.js');
      
      UserQueries.findByEmail.mockResolvedValue(mockUser);
      CryptoUtils.verifyPassword.mockResolvedValue(true);

      const response = await authRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.user).toBeDefined();
      expect(responseData.data.user.password_hash).toBeUndefined();
      expect(responseData.data.token).toBe('mock_jwt_token');
    });
  });

  describe('Negative Test Cases', () => {
    it('should fail with non-existent user', async () => {
      const loginData = UserFactory.createLoginData();
      const request = RequestFactory.create('POST', '/api/auth/login', {
        body: loginData
      });

      const { UserQueries } = await import('../../src/utils/database.js');
      UserQueries.findByEmail.mockResolvedValue(null);

      const response = await authRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Invalid email or password');
      expect(responseData.code).toBe('INVALID_CREDENTIALS');
    });

    it('should fail with incorrect password', async () => {
      const loginData = UserFactory.createLoginData();
      const mockUser = UserFactory.create({
        email: loginData.email,
        password_hash: 'hashed_password'
      });
      const request = RequestFactory.create('POST', '/api/auth/login', {
        body: loginData
      });

      const { UserQueries } = await import('../../src/utils/database.js');
      const { CryptoUtils } = await import('../../src/utils/crypto.js');
      
      UserQueries.findByEmail.mockResolvedValue(mockUser);
      CryptoUtils.verifyPassword.mockResolvedValue(false);

      const response = await authRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Invalid email or password');
      expect(responseData.code).toBe('INVALID_CREDENTIALS');
    });

    it('should not reveal whether email exists or password is wrong', async () => {
      // Test with non-existent user
      const loginData1 = UserFactory.createLoginData();
      const request1 = RequestFactory.create('POST', '/api/auth/login', {
        body: loginData1
      });

      // Test with wrong password
      const loginData2 = UserFactory.createLoginData();
      const request2 = RequestFactory.create('POST', '/api/auth/login', {
        body: loginData2
      });

      const { UserQueries } = await import('../../src/utils/database.js');
      const { CryptoUtils } = await import('../../src/utils/crypto.js');

      // First test - user doesn't exist
      UserQueries.findByEmail.mockResolvedValueOnce(null);
      const response1 = await authRouter.handle(request1, env);
      const responseData1 = await response1.json();

      // Second test - wrong password
      UserQueries.findByEmail.mockResolvedValueOnce({ email: loginData2.email });
      CryptoUtils.verifyPassword.mockResolvedValue(false);
      const response2 = await authRouter.handle(request2, env);
      const responseData2 = await response2.json();

      // Both should return the same generic error message
      expect(responseData1.error).toBe(responseData2.error);
      expect(responseData1.code).toBe(responseData2.code);
    });
  });
});

describe('Auth Router - POST /logout', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should successfully logout authenticated user', async () => {
    const request = RequestFactory.createAuthenticatedRequest('POST', '/api/auth/logout', 'valid_token');

    const { requireAuth } = await import('../../src/middleware/auth.js');
    requireAuth.mockResolvedValue({
      user: { id: 'user_id' },
      token: 'valid_token'
    });

    const response = await authRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.message).toBe('Logout successful');
  });

  it('should fail for unauthenticated user', async () => {
    const request = RequestFactory.create('POST', '/api/auth/logout');

    const { requireAuth } = await import('../../src/middleware/auth.js');
    requireAuth.mockResolvedValue(new Response('Unauthorized', { status: 401 }));

    const response = await authRouter.handle(request, env);

    expect(response.status).toBe(401);
  });
});

describe('Auth Router - GET /me', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should return user profile for authenticated user', async () => {
    const mockUser = UserFactory.create();
    const request = RequestFactory.createAuthenticatedRequest('GET', '/api/auth/me', 'valid_token');

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { UserQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({
      user: { id: mockUser.id }
    });
    UserQueries.findById.mockResolvedValue(mockUser);

    const response = await authRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.user).toBeDefined();
    expect(responseData.data.user.password_hash).toBeUndefined();
  });

  it('should fail for non-existent user', async () => {
    const request = RequestFactory.createAuthenticatedRequest('GET', '/api/auth/me', 'valid_token');

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { UserQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({
      user: { id: 'non_existent_user_id' }
    });
    UserQueries.findById.mockResolvedValue(null);

    const response = await authRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(404);
    expect(responseData.error).toBe('User not found');
    expect(responseData.code).toBe('USER_NOT_FOUND');
  });
});

describe('Auth Router - PUT /profile', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should successfully update user profile', async () => {
    const mockUser = UserFactory.create();
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      phoneNumber: '+1234567890'
    };
    const request = RequestFactory.createAuthenticatedRequest('PUT', '/api/auth/profile', 'valid_token', {
      body: updateData
    });

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { UserQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({
      user: { id: mockUser.id }
    });
    UserQueries.findById.mockResolvedValue({
      ...mockUser,
      first_name: updateData.firstName,
      last_name: updateData.lastName,
      phone_number: updateData.phoneNumber
    });

    const response = await authRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.user).toBeDefined();
    expect(responseData.message).toBe('Profile updated successfully');
    
    expect(UserQueries.update).toHaveBeenCalledWith(env.DB, mockUser.id, {
      first_name: updateData.firstName,
      last_name: updateData.lastName,
      phone_number: updateData.phoneNumber
    });
  });

  it('should validate coordinates when provided', async () => {
    const mockUser = UserFactory.create();
    const updateData = {
      locationLatitude: 91, // Invalid latitude
      locationLongitude: -74
    };
    const request = RequestFactory.createAuthenticatedRequest('PUT', '/api/auth/profile', 'valid_token', {
      body: updateData
    });

    const { requireAuth } = await import('../../src/middleware/auth.js');
    requireAuth.mockResolvedValue({
      user: { id: mockUser.id }
    });

    const response = await authRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Invalid coordinates');
    expect(responseData.code).toBe('INVALID_COORDINATES');
  });
});

describe('Auth Router - POST /change-password', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should successfully change password with valid current password', async () => {
    const mockUser = UserFactory.create();
    const passwordData = {
      currentPassword: 'CurrentPassword123!',
      newPassword: 'NewPassword123!'
    };
    const request = RequestFactory.createAuthenticatedRequest('POST', '/api/auth/change-password', 'valid_token', {
      body: passwordData
    });

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { UserQueries } = await import('../../src/utils/database.js');
    const { CryptoUtils } = await import('../../src/utils/crypto.js');
    
    requireAuth.mockResolvedValue({
      user: { id: mockUser.id }
    });
    UserQueries.findById.mockResolvedValue(mockUser);
    CryptoUtils.verifyPassword.mockResolvedValue(true);

    const response = await authRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.message).toBe('Password changed successfully');
    
    expect(CryptoUtils.hashPassword).toHaveBeenCalledWith(passwordData.newPassword);
    expect(UserQueries.update).toHaveBeenCalled();
  });

  it('should fail with incorrect current password', async () => {
    const mockUser = UserFactory.create();
    const passwordData = {
      currentPassword: 'WrongPassword',
      newPassword: 'NewPassword123!'
    };
    const request = RequestFactory.createAuthenticatedRequest('POST', '/api/auth/change-password', 'valid_token', {
      body: passwordData
    });

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { UserQueries } = await import('../../src/utils/database.js');
    const { CryptoUtils } = await import('../../src/utils/crypto.js');
    
    requireAuth.mockResolvedValue({
      user: { id: mockUser.id }
    });
    UserQueries.findById.mockResolvedValue(mockUser);
    CryptoUtils.verifyPassword.mockResolvedValue(false);

    const response = await authRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(401);
    expect(responseData.error).toBe('Current password is incorrect');
    expect(responseData.code).toBe('INVALID_PASSWORD');
  });

  it('should fail with weak new password', async () => {
    const mockUser = UserFactory.create();
    const passwordData = {
      currentPassword: 'CurrentPassword123!',
      newPassword: '123' // Weak password
    };
    const request = RequestFactory.createAuthenticatedRequest('POST', '/api/auth/change-password', 'valid_token', {
      body: passwordData
    });

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { UserQueries } = await import('../../src/utils/database.js');
    const { CryptoUtils } = await import('../../src/utils/crypto.js');
    
    requireAuth.mockResolvedValue({
      user: { id: mockUser.id }
    });
    UserQueries.findById.mockResolvedValue(mockUser);
    CryptoUtils.verifyPassword.mockResolvedValue(true);

    const response = await authRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error).toBe('New password does not meet requirements');
    expect(responseData.code).toBe('WEAK_PASSWORD');
  });

  it('should fail with missing passwords', async () => {
    const request = RequestFactory.createAuthenticatedRequest('POST', '/api/auth/change-password', 'valid_token', {
      body: {} // Missing passwords
    });

    const { requireAuth } = await import('../../src/middleware/auth.js');
    requireAuth.mockResolvedValue({
      user: { id: 'user_id' }
    });

    const response = await authRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Current password and new password are required');
    expect(responseData.code).toBe('MISSING_PASSWORDS');
  });
});