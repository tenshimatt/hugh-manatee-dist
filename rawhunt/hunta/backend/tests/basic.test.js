import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Basic test suite for Hunta Backend
describe('Hunta Backend Tests', () => {
  let serverUrl = 'http://localhost:8787';

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await fetch(`${serverUrl}/health`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.version).toBe('1.0.0');
      expect(data.environment).toBe('development');
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS request', async () => {
      const response = await fetch(`${serverUrl}/api/users`, {
        method: 'OPTIONS'
      });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });
  });

  describe('Public Endpoints', () => {
    it('should get routes without authentication', async () => {
      const response = await fetch(`${serverUrl}/api/routes`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.routes)).toBe(true);
    });

    it('should get events without authentication', async () => {
      const response = await fetch(`${serverUrl}/api/events`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.events)).toBe(true);
    });

    it('should get gear items without authentication', async () => {
      const response = await fetch(`${serverUrl}/api/gear`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.gear)).toBe(true);
    });

    it('should get ethics articles without authentication', async () => {
      const response = await fetch(`${serverUrl}/api/ethics`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.articles)).toBe(true);
    });

    it('should get posts without authentication', async () => {
      const response = await fetch(`${serverUrl}/api/posts`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.posts)).toBe(true);
    });
  });

  describe('Protected Endpoints', () => {
    it('should require authentication for user profile', async () => {
      const response = await fetch(`${serverUrl}/api/users/me`);
      
      expect(response.status).toBe(401);
    });

    it('should require authentication for creating dogs', async () => {
      const response = await fetch(`${serverUrl}/api/dogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Dog' })
      });
      
      expect(response.status).toBe(401);
    });

    it('should require authentication for training logs', async () => {
      const response = await fetch(`${serverUrl}/api/training`);
      
      expect(response.status).toBe(401);
    });
  });

  describe('Authentication Endpoints', () => {
    it('should handle registration endpoint', async () => {
      const response = await fetch(`${serverUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          username: 'testuser',
          password: 'testpassword123',
          firstName: 'Test',
          lastName: 'User'
        })
      });
      
      // Should not be 500 (server error)
      expect(response.status).not.toBe(500);
      // Could be 200 (created) or 409 (conflict if user exists)
      expect([200, 409]).toContain(response.status);
    });

    it('should handle login endpoint', async () => {
      const response = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword123'
        })
      });
      
      // Should not be 500 (server error)
      expect(response.status).not.toBe(500);
      // Could be 200 (success) or 401 (invalid credentials)
      expect([200, 401]).toContain(response.status);
    });
  });
});