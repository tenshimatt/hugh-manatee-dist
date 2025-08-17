import { describe, it, expect, beforeEach } from 'vitest';
import { Miniflare } from 'miniflare';

describe('Security Tests', () => {
  let mf;
  let env;

  beforeEach(async () => {
    mf = new Miniflare({
      modules: true,
      scriptPath: '../../src/index.js',
      d1Databases: ['DB'],
      kvNamespaces: ['RAWGLE_KV', 'SESSIONS'],
      r2Buckets: ['IMAGES', 'REPORTS'],
      queues: ['RAWGLE_QUEUE'],
      ai: true
    });

    env = await mf.getBindings();
    await setupTestData();
  });

  async function setupTestData() {
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        wallet_address TEXT UNIQUE,
        subscription_tier TEXT DEFAULT 'free',
        paws_balance INTEGER DEFAULT 0,
        nft_holder BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS pet_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        breed TEXT,
        private_bio TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create test user
    await env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, paws_balance)
      VALUES ('test-user', 'security@rawgle.com', '$2b$10$hashedpassword', 1000)
    `).run();

    await env.DB.prepare(`
      INSERT INTO pet_profiles (id, user_id, name, breed, private_bio)
      VALUES ('test-pet', 'test-user', 'Security Pet', 'Test Breed', 'Sensitive information')
    `).run();
  }

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in user queries', async () => {
      const maliciousEmail = "'; DROP TABLE users; --";
      
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: maliciousEmail,
          password: 'password'
        })
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(401);

      // Verify users table still exists
      const users = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
      expect(users.count).toBe(1);
    });

    it('should prevent SQL injection in pet profile searches', async () => {
      const maliciousQuery = "1' OR '1'='1";
      
      const request = new Request(`http://localhost/api/pets/search?breed=${encodeURIComponent(maliciousQuery)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await mf.dispatchFetch(request);
      const data = await response.json();

      // Should not return unauthorized data
      expect(data.pets?.length || 0).toBeLessThan(2);
    });

    it('should sanitize user input in AI consultations', async () => {
      const maliciousSymptoms = "<script>alert('xss')</script>'; DELETE FROM users; --";
      
      const request = new Request('http://localhost/api/ai-medical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: 'test-pet',
          symptoms: maliciousSymptoms
        })
      });

      const response = await mf.dispatchFetch(request);
      
      if (response.status === 200) {
        const data = await response.json();
        // AI response should not contain raw script tags
        expect(data.assessment).not.toContain('<script>');
      }
    });
  });

  describe('Authentication Security', () => {
    it('should reject weak passwords', async () => {
      const weakPasswords = [
        '123',
        'password',
        '12345678',
        'qwerty',
        'abc123'
      ];

      for (const password of weakPasswords) {
        const request = new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `weak${password}@test.com`,
            password: password
          })
        });

        const response = await mf.dispatchFetch(request);
        expect(response.status).toBe(400);
        
        const data = await response.json();
        expect(data.error.toLowerCase()).toContain('password');
      }
    });

    it('should implement rate limiting for login attempts', async () => {
      const loginAttempts = [];
      
      for (let i = 0; i < 10; i++) {
        loginAttempts.push(
          mf.dispatchFetch(new Request('http://localhost/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'security@rawgle.com',
              password: 'wrongpassword'
            })
          }))
        );
      }

      const responses = await Promise.all(loginAttempts);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBe(true);
    });

    it('should validate JWT tokens properly', async () => {
      const invalidTokens = [
        'invalid.token.here',
        'Bearer malicious-token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        ''
      ];

      for (const token of invalidTokens) {
        const request = new Request('http://localhost/api/auth/validate', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const response = await mf.dispatchFetch(request);
        expect(response.status).toBe(401);
      }
    });

    it('should prevent session fixation attacks', async () => {
      // Register user
      const registerRes = await mf.dispatchFetch(new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'fixation@rawgle.com',
          password: 'SecurePass123!'
        })
      }));

      const { sessionToken: token1 } = await registerRes.json();

      // Login should create new session
      const loginRes = await mf.dispatchFetch(new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'fixation@rawgle.com',
          password: 'SecurePass123!'
        })
      }));

      const { sessionToken: token2 } = await loginRes.json();

      // Tokens should be different
      expect(token1).not.toBe(token2);
    });
  });

  describe('Authorization and Access Control', () => {
    it('should prevent access to other users pets', async () => {
      // Create second user
      await env.DB.prepare(`
        INSERT INTO users (id, email, password_hash)
        VALUES ('other-user', 'other@rawgle.com', '$2b$10$hashedpassword')
      `).run();

      await env.DB.prepare(`
        INSERT INTO pet_profiles (id, user_id, name, breed)
        VALUES ('other-pet', 'other-user', 'Other Pet', 'Secret Breed')
      `).run();

      const request = new Request('http://localhost/api/pets/other-pet', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer valid-token-for-test-user' }
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(403);
    });

    it('should prevent unauthorized PAWS transfers', async () => {
      const request = new Request('http://localhost/api/paws/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: 'test-user',
          toUserId: 'other-user',
          amount: 999999,
          reason: 'Unauthorized transfer'
        })
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(401);
    });

    it('should validate admin operations', async () => {
      const request = new Request('http://localhost/api/admin/users', {
        method: 'GET',
        headers: { 
          'Authorization': 'Bearer regular-user-token',
          'X-Admin-Token': 'fake-admin-token'
        }
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(403);
    });

    it('should prevent privilege escalation', async () => {
      const request = new Request('http://localhost/api/paws/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          amount: 1000000,
          bypassLimits: true,
          adminOverride: true
        })
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(403);
    });
  });

  describe('Data Validation and Sanitization', () => {
    it('should validate input data types', async () => {
      const invalidInputs = [
        { petId: 123, symptoms: 'valid' },           // number instead of string
        { petId: 'valid', symptoms: null },          // null symptoms
        { petId: [], symptoms: 'valid' },            // array instead of string
        { petId: 'valid', symptoms: { malicious: true } } // object instead of string
      ];

      for (const input of invalidInputs) {
        const request = new Request('http://localhost/api/ai-medical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input)
        });

        const response = await mf.dispatchFetch(request);
        expect(response.status).toBe(400);
      }
    });

    it('should sanitize file uploads', async () => {
      const maliciousFile = Buffer.from('<?php echo "hello"; ?>');
      
      const request = new Request('http://localhost/api/pets/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: maliciousFile
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('file type');
    });

    it('should limit payload sizes', async () => {
      const largePayload = 'x'.repeat(10 * 1024 * 1024); // 10MB
      
      const request = new Request('http://localhost/api/ai-medical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: 'test-pet',
          symptoms: largePayload
        })
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(413);
    });

    it('should validate email formats', async () => {
      const invalidEmails = [
        'not-an-email',
        '@domain.com',
        'user@',
        'user..user@domain.com',
        'user@domain',
        'user space@domain.com'
      ];

      for (const email of invalidEmails) {
        const request = new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            password: 'ValidPass123!'
          })
        });

        const response = await mf.dispatchFetch(request);
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Cross-Site Scripting (XSS) Prevention', () => {
    it('should escape HTML in user-generated content', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '"><script>alert("xss")</script>'
      ];

      for (const payload of xssPayloads) {
        const request = new Request('http://localhost/api/pets/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: payload,
            breed: 'Test Breed',
            ageCategory: 'adult'
          })
        });

        const response = await mf.dispatchFetch(request);
        
        if (response.status === 201) {
          const data = await response.json();
          // Name should be escaped/sanitized
          expect(data.name).not.toContain('<script>');
          expect(data.name).not.toContain('javascript:');
        }
      }
    });

    it('should sanitize data in API responses', async () => {
      // Create pet with potentially dangerous name
      await env.DB.prepare(`
        UPDATE pet_profiles 
        SET name = '<script>alert("stored xss")</script>' 
        WHERE id = 'test-pet'
      `).run();

      const request = new Request('http://localhost/api/pets/test-pet', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      const response = await mf.dispatchFetch(request);
      
      if (response.status === 200) {
        const data = await response.json();
        const responseText = JSON.stringify(data);
        expect(responseText).not.toContain('<script>');
      }
    });
  });

  describe('CORS and Headers Security', () => {
    it('should set proper CORS headers', async () => {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'OPTIONS',
        headers: { 'Origin': 'https://malicious-site.com' }
      });

      const response = await mf.dispatchFetch(request);
      const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
      
      expect(corsOrigin).not.toBe('https://malicious-site.com');
    });

    it('should include security headers', async () => {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'security@rawgle.com',
          password: 'wrongpass'
        })
      });

      const response = await mf.dispatchFetch(request);
      
      // Check for security headers
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });
  });

  describe('Crypto and Wallet Security', () => {
    it('should validate Solana wallet addresses', async () => {
      const invalidWallets = [
        'invalid-wallet',
        '123',
        'not-base58',
        'toolongaddressthatexceedslimit' + 'x'.repeat(100),
        ''
      ];

      for (const wallet of invalidWallets) {
        const request = new Request('http://localhost/api/auth/link-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: wallet,
            signature: 'fake-signature'
          })
        });

        const response = await mf.dispatchFetch(request);
        expect(response.status).toBe(400);
      }
    });

    it('should prevent wallet signature replay attacks', async () => {
      const request1 = new Request('http://localhost/api/auth/link-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: 'ValidWallet123',
          signature: 'reusable-signature',
          timestamp: Date.now() - 10000 // 10 seconds old
        })
      });

      await mf.dispatchFetch(request1);

      // Try to reuse same signature
      const request2 = new Request('http://localhost/api/auth/link-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: 'ValidWallet123',
          signature: 'reusable-signature',
          timestamp: Date.now()
        })
      });

      const response2 = await mf.dispatchFetch(request2);
      expect(response2.status).toBe(400);
    });
  });

  describe('Resource Protection', () => {
    it('should prevent resource enumeration', async () => {
      const request = new Request('http://localhost/api/pets/non-existent-pet', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(404);
      
      const data = await response.json();
      // Should not reveal whether pet exists for another user
      expect(data.error).not.toContain('belongs to another user');
    });

    it('should implement proper session timeout', async () => {
      // Create expired session
      const expiredToken = 'expired.jwt.token';
      
      const request = new Request('http://localhost/api/auth/validate', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${expiredToken}` }
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(401);
    });

    it('should prevent directory traversal', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '/etc/shadow',
        'file:///etc/passwd'
      ];

      for (const path of maliciousPaths) {
        const request = new Request(`http://localhost/api/files/${encodeURIComponent(path)}`, {
          method: 'GET'
        });

        const response = await mf.dispatchFetch(request);
        expect(response.status).toBe(400);
      }
    });
  });
});