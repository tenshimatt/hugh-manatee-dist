const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock app - this would import your actual Express app
const app = require('../../src/app');

describe('Authentication API Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();
  });

  describe('POST /api/auth/register', () => {
    test('should register new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
        acceptTerms: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeValidJWT();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.password).toBeUndefined(); // Should not expose password
    });

    test('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePassword123!',
          name: 'Test User',
          acceptTerms: true
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Valid email is required');
    });

    test('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          name: 'Test User',
          acceptTerms: true
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('Password must be at least 8 characters');
    });

    test('should reject registration with duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'SecurePassword123!',
          name: 'First User',
          acceptTerms: true
        });

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'AnotherPassword123!',
          name: 'Second User',
          acceptTerms: true
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Email already registered');
    });

    test('should reject registration without accepting terms', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123!',
          name: 'Test User',
          acceptTerms: false
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('You must accept the terms');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeValidJWT();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.expiresIn).toBe(3600);
    });

    test('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    test('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid credentials');
    });

    test('should handle rate limiting for failed login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make 6 failed attempts (rate limit is 5)
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        if (i < 5) {
          expect(response.status).toBe(401);
        } else {
          expect(response.status).toBe(429);
          expect(response.body.error).toContain('Too many attempts');
        }
      }
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should refresh valid token', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.token;

      // Refresh token
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeValidJWT();
      expect(response.body.token).not.toBe(token); // Should be new token
    });

    test('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Invalid or expired token');
    });

    test('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Access token required');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout and invalidate token', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.token;

      // Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);

      // Try to use invalidated token
      const protectedResponse = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(protectedResponse.status).toBe(403);
      expect(protectedResponse.body.error).toContain('Token has been invalidated');
    });
  });

  describe('Protected Routes', () => {
    let validToken;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      validToken = response.body.token;
    });

    test('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('test@example.com');
    });

    test('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/user/profile');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Access token required');
    });

    test('should reject access with malformed token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer malformed.token.here');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Invalid or expired token');
    });

    test('should reject access with expired token', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { id: 1, email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Invalid or expired token');
    });
  });

  describe('Security Headers', () => {
    test('should include security headers in auth responses', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('CORS Configuration', () => {
    test('should handle CORS for auth endpoints', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'https://rawgle.com')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('https://rawgle.com');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
  });
});