import request from 'supertest';
import { Express } from 'express';
import { TestEnvironment } from '../setup/testEnvironment';
import { TestFixtures } from '../fixtures/testFixtures';
import jwt from 'jsonwebtoken';

describe('Authentication API Integration Tests', () => {
  let app: Express;
  let fixtures: TestFixtures;

  beforeAll(async () => {
    // Dynamically import the app to ensure test environment is set up first
    const appModule = await import('../../src/server');
    app = appModule.app;
    fixtures = new TestFixtures(TestEnvironment.getTestDatabase().getPool());
  });

  beforeEach(async () => {
    await fixtures.seedAllTestData();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('registered successfully'),
        data: {
          user: {
            name: userData.name,
            email: userData.email,
            emailVerified: false,
            accountType: 'user',
            pawsTokens: 100
          },
          token: expect.any(String)
        }
      });

      // Verify JWT token is valid
      const decoded = jwt.verify(response.body.data.token, process.env.JWT_SECRET!) as any;
      expect(decoded.email).toBe(userData.email);
      expect(decoded.userId).toBeDefined();
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        confirmPassword: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('email'),
      });
    });

    it('should reject registration with mismatched passwords', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('password'),
      });
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
        confirmPassword: '123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('password'),
      });
    });

    it('should reject registration with existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'john@example.com', // Existing test user
        password: 'password123',
        confirmPassword: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('already exists'),
      });
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('logged in'),
        data: {
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            accountType: 'user',
            pawsTokens: 100
          },
          token: expect.any(String)
        }
      });

      // Verify JWT token
      const decoded = jwt.verify(response.body.data.token, process.env.JWT_SECRET!) as any;
      expect(decoded.email).toBe('john@example.com');
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid'),
      });
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid'),
      });
    });

    it('should reject login with malformed email', async () => {
      const loginData = {
        email: 'not-an-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('email'),
      });
    });

    it('should include proper headers and security measures', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      // Check security headers
      expect(response.headers).toHaveProperty('content-type', expect.stringMatching(/application\/json/));
      
      // Verify no sensitive data in response
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
      expect(response.body.data.user).not.toHaveProperty('password');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let validToken: string;

    beforeEach(async () => {
      // Get a valid token first
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123'
        });
      
      validToken = loginResponse.body.data.token;
    });

    it('should refresh token with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          token: expect.any(String)
        }
      });

      // Verify new token is different and valid
      expect(response.body.data.token).not.toBe(validToken);
      const decoded = jwt.verify(response.body.data.token, process.env.JWT_SECRET!) as any;
      expect(decoded.email).toBe('john@example.com');
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid')
      });
    });

    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('token')
      });
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let validToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123'
        });
      
      validToken = loginResponse.body.data.token;
    });

    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('logged out')
      });
    });

    it('should handle logout without token gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('logged out')
      });
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should handle forgot password for existing user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'john@example.com' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset')
      });
    });

    it('should handle forgot password for non-existing user (security)', async () => {
      // Should return success even for non-existing users (security best practice)
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset')
      });
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('email')
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      const promises = Array(6).fill(null).map(() =>
        request(app)
          .post('/api/v1/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);
      
      // Should have some rate limiting after multiple attempts
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 10000);

    it('should rate limit registration attempts', async () => {
      const registrationPromises = Array(6).fill(null).map((_, index) =>
        request(app)
          .post('/api/v1/auth/register')
          .send({
            name: `Test User ${index}`,
            email: `test${index}@example.com`,
            password: 'password123',
            confirmPassword: 'password123'
          })
      );

      const responses = await Promise.all(registrationPromises);
      
      // Should have some rate limiting
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Security Headers', () => {
    it('should include proper security headers in all responses', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123'
        });

      // Check for security headers (these should be set by helmet middleware)
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });
});