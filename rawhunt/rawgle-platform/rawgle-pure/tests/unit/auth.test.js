import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Miniflare } from 'miniflare';

describe('Authentication Routes', () => {
  let mf;
  let env;

  beforeEach(async () => {
    mf = new Miniflare({
      modules: false,
      script: `
        // Auth handler implementation
        const validateEmail = (email) => {
          const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
          return emailRegex.test(email);
        };

        const validatePassword = (password) => {
          const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$/;
          return passwordRegex.test(password);
        };

        const validateSolanaAddress = (address) => {
          const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
          return solanaRegex.test(address);
        };

        const sanitizeInput = (input) => {
          if (typeof input !== 'string') return input;
          return input
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\\w+=/gi, '')
            .trim();
        };

        // BCrypt-like implementation for Cloudflare Workers
        async function hashPassword(password) {
          const encoder = new TextEncoder();
          const data = encoder.encode(password + 'rawgle_salt_2024');
          const hash = await crypto.subtle.digest('SHA-256', data);
          return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        }

        async function verifyPassword(password, hash) {
          const passwordHash = await hashPassword(password);
          return passwordHash === hash;
        }

        // Constants
        const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const RATE_LIMIT_ATTEMPTS = 5;
        const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

        // Rate limiting functions
        async function checkRateLimit(email, env) {
          const key = \`auth_attempts:\${email}\`;
          const attempts = await env.SESSIONS.get(key);
          
          if (!attempts) return { allowed: true, remaining: RATE_LIMIT_ATTEMPTS };
          
          const attemptData = JSON.parse(attempts);
          const now = Date.now();
          
          if (now - attemptData.firstAttempt > RATE_LIMIT_WINDOW) {
            await env.SESSIONS.delete(key);
            return { allowed: true, remaining: RATE_LIMIT_ATTEMPTS };
          }
          
          if (attemptData.count >= RATE_LIMIT_ATTEMPTS) {
            return { 
              allowed: false, 
              remaining: 0,
              resetTime: attemptData.firstAttempt + RATE_LIMIT_WINDOW
            };
          }
          
          return { allowed: true, remaining: RATE_LIMIT_ATTEMPTS - attemptData.count };
        }

        async function recordFailedAttempt(email, env) {
          const key = \`auth_attempts:\${email}\`;
          const existing = await env.SESSIONS.get(key);
          const now = Date.now();
          
          let attemptData;
          if (existing) {
            attemptData = JSON.parse(existing);
            if (now - attemptData.firstAttempt > RATE_LIMIT_WINDOW) {
              attemptData = { count: 1, firstAttempt: now };
            } else {
              attemptData.count += 1;
            }
          } else {
            attemptData = { count: 1, firstAttempt: now };
          }
          
          await env.SESSIONS.put(key, JSON.stringify(attemptData), {
            expirationTtl: Math.floor(RATE_LIMIT_WINDOW / 1000)
          });
        }

        async function clearFailedAttempts(email, env) {
          const key = \`auth_attempts:\${email}\`;
          await env.SESSIONS.delete(key);
        }

        function generateUUID() {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }

        // Main auth handler
        async function handleAuth(request, env) {
          const url = new URL(request.url);
          const path = url.pathname;
          
          const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          };
          
          if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
          }
          
          try {
            let response;
            
            if (path.endsWith('/register') && request.method === 'POST') {
              response = await registerUser(request, env);
            } else if (path.endsWith('/login') && request.method === 'POST') {
              response = await loginUser(request, env);
            } else if (path.endsWith('/validate') && request.method === 'GET') {
              response = await validateSession(request, env);
            } else if (path.endsWith('/logout') && request.method === 'POST') {
              response = await logoutUser(request, env);
            } else if (path.endsWith('/link-wallet') && request.method === 'POST') {
              response = await linkWallet(request, env);
            } else {
              response = new Response(JSON.stringify({ 
                error: 'Not found' 
              }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            Object.entries(corsHeaders).forEach(([key, value]) => {
              response.headers.set(key, value);
            });
            
            return response;
            
          } catch (error) {
            console.error('Auth handler error:', error);
            const response = new Response(JSON.stringify({ 
              error: 'Internal server error' 
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
            
            Object.entries(corsHeaders).forEach(([key, value]) => {
              response.headers.set(key, value);
            });
            
            return response;
          }
        }

        // Registration function
        async function registerUser(request, env) {
          try {
            const body = await request.json();
            const { email, password, walletAddress } = body;
            
            if (!email || !password) {
              return new Response(JSON.stringify({ 
                error: 'Email and password are required' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const sanitizedEmail = sanitizeInput(email.toLowerCase());
            
            if (!validateEmail(sanitizedEmail)) {
              return new Response(JSON.stringify({ 
                error: 'Invalid email format' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            if (!validatePassword(password)) {
              return new Response(JSON.stringify({ 
                error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            if (walletAddress && !validateSolanaAddress(walletAddress)) {
              return new Response(JSON.stringify({ 
                error: 'Invalid Solana wallet address' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const existingUser = await env.DB.prepare(
              'SELECT id FROM users WHERE email = ? OR wallet_address = ?'
            ).bind(sanitizedEmail, walletAddress || null).first();
            
            if (existingUser) {
              return new Response(JSON.stringify({ 
                error: 'User with this email or wallet already exists' 
              }), { 
                status: 409,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const passwordHash = await hashPassword(password);
            const userId = generateUUID();
            const welcomeBonus = 50;
            
            await env.DB.prepare(\`
              INSERT INTO users (id, email, password_hash, wallet_address, paws_balance) 
              VALUES (?, ?, ?, ?, ?)
            \`).bind(userId, sanitizedEmail, passwordHash, walletAddress || null, welcomeBonus).run();
            
            const sessionToken = generateUUID();
            const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
            
            await env.SESSIONS.put(sessionToken, JSON.stringify({
              userId,
              email: sanitizedEmail,
              createdAt: new Date().toISOString(),
              expiresAt
            }), {
              expirationTtl: Math.floor(SESSION_DURATION / 1000)
            });
            
            await env.DB.prepare(\`
              INSERT INTO paws_transactions (id, user_id, amount, transaction_type, description, status) 
              VALUES (?, ?, ?, 'reward', 'Welcome bonus', 'completed')
            \`).bind(generateUUID(), userId, welcomeBonus).run();
            
            return new Response(JSON.stringify({
              userId,
              email: sanitizedEmail,
              sessionToken,
              pawsBalance: welcomeBonus,
              walletAddress: walletAddress || null
            }), { 
              status: 201,
              headers: { 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error('Registration error:', error);
            return new Response(JSON.stringify({ 
              error: 'Internal server error' 
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        // Login function
        async function loginUser(request, env) {
          try {
            const body = await request.json();
            const { email, password } = body;
            
            if (!email || !password) {
              return new Response(JSON.stringify({ 
                error: 'Email and password are required' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const sanitizedEmail = sanitizeInput(email.toLowerCase());
            
            const rateLimitCheck = await checkRateLimit(sanitizedEmail, env);
            if (!rateLimitCheck.allowed) {
              return new Response(JSON.stringify({ 
                error: 'Too many attempts. Please try again later.' 
              }), { 
                status: 429,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const user = await env.DB.prepare(
              'SELECT id, email, password_hash, paws_balance FROM users WHERE email = ?'
            ).bind(sanitizedEmail).first();
            
            if (!user || !(await verifyPassword(password, user.password_hash))) {
              await recordFailedAttempt(sanitizedEmail, env);
              return new Response(JSON.stringify({ 
                error: 'Invalid credentials' 
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            await clearFailedAttempts(sanitizedEmail, env);
            
            const sessionToken = generateUUID();
            const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
            
            await env.SESSIONS.put(sessionToken, JSON.stringify({
              userId: user.id,
              email: user.email,
              createdAt: new Date().toISOString(),
              expiresAt
            }), {
              expirationTtl: Math.floor(SESSION_DURATION / 1000)
            });
            
            return new Response(JSON.stringify({
              userId: user.id,
              email: user.email,
              sessionToken,
              pawsBalance: user.paws_balance
            }), { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error('Login error:', error);
            return new Response(JSON.stringify({ 
              error: 'Internal server error' 
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        // Session validation function
        async function validateSession(request, env) {
          try {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              return new Response(JSON.stringify({ 
                error: 'Missing or invalid authorization header' 
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const token = authHeader.substring(7);
            const sessionData = await env.SESSIONS.get(token);
            
            if (!sessionData) {
              return new Response(JSON.stringify({ 
                error: 'Invalid or expired session' 
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const session = JSON.parse(sessionData);
            
            if (new Date() > new Date(session.expiresAt)) {
              await env.SESSIONS.delete(token);
              return new Response(JSON.stringify({ 
                error: 'Session expired' 
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            return new Response(JSON.stringify({
              valid: true,
              userId: session.userId,
              email: session.email
            }), { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error('Session validation error:', error);
            return new Response(JSON.stringify({ 
              error: 'Internal server error' 
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        // Logout function
        async function logoutUser(request, env) {
          try {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              return new Response(JSON.stringify({ 
                error: 'Missing or invalid authorization header' 
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const token = authHeader.substring(7);
            await env.SESSIONS.delete(token);
            
            return new Response(JSON.stringify({
              message: 'Successfully logged out'
            }), { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error('Logout error:', error);
            return new Response(JSON.stringify({ 
              error: 'Internal server error' 
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        // Wallet linking function
        async function linkWallet(request, env) {
          try {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              return new Response(JSON.stringify({ 
                error: 'Missing or invalid authorization header' 
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const token = authHeader.substring(7);
            const sessionData = await env.SESSIONS.get(token);
            
            if (!sessionData) {
              return new Response(JSON.stringify({ 
                error: 'Invalid or expired session' 
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const session = JSON.parse(sessionData);
            const body = await request.json();
            const { walletAddress, signature } = body;
            
            if (!walletAddress || !signature) {
              return new Response(JSON.stringify({ 
                error: 'Wallet address and signature are required' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            if (!validateSolanaAddress(walletAddress)) {
              return new Response(JSON.stringify({ 
                error: 'Invalid Solana wallet address' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const existingWallet = await env.DB.prepare(
              'SELECT id FROM users WHERE wallet_address = ? AND id != ?'
            ).bind(walletAddress, session.userId).first();
            
            if (existingWallet) {
              return new Response(JSON.stringify({ 
                error: 'Wallet already linked to another account' 
              }), { 
                status: 409,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            await env.DB.prepare(
              'UPDATE users SET wallet_address = ? WHERE id = ?'
            ).bind(walletAddress, session.userId).run();
            
            const nftHolderStatus = {
              hasNFTs: Math.random() > 0.5,
              nftCount: Math.floor(Math.random() * 10)
            };
            
            return new Response(JSON.stringify({
              walletLinked: true,
              walletAddress,
              nftHolderStatus
            }), { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error('Wallet linking error:', error);
            return new Response(JSON.stringify({ 
              error: 'Internal server error' 
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        addEventListener('fetch', event => {
          event.respondWith(handleAuth(event.request, event.env || env));
        });
      `,
      d1Databases: ['DB'],
      kvNamespaces: ['SESSIONS'],
    });
    
    env = await mf.getBindings();
    
    // Setup test database
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        wallet_address TEXT UNIQUE,
        subscription_tier TEXT DEFAULT 'free',
        paws_balance INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  describe('User Registration', () => {
    it('should register a new user with email and password', async () => {
      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@rawgle.com',
          password: 'SecurePass123!',
          walletAddress: 'E9mnWdbp97pGaUTGRP743KhppWkYzkagWo7JM3hRJsHA'
        })
      });

      const response = await mf.dispatchFetch(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('sessionToken');
      expect(data.email).toBe('test@rawgle.com');
      expect(data.pawsBalance).toBe(50); // Welcome bonus
    });

    it('should prevent duplicate email registration', async () => {
      // First registration
      await mf.dispatchFetch(new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'duplicate@rawgle.com',
          password: 'Pass123!'
        })
      }));

      // Duplicate attempt
      const response = await mf.dispatchFetch(new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'duplicate@rawgle.com',
          password: 'DifferentPass123!'
        })
      }));

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('already exists');
    });

    it('should validate password strength', async () => {
      const weakPasswordRequest = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'weak@rawgle.com',
          password: '123'
        })
      });

      const response = await mf.dispatchFetch(weakPasswordRequest);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('password');
    });

    it('should validate email format', async () => {
      const invalidEmailRequest = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'ValidPass123!'
        })
      });

      const response = await mf.dispatchFetch(invalidEmailRequest);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('email');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Create test user with correct password hash for 'CorrectPassword123!'
      await env.DB.prepare(`
        INSERT INTO users (id, email, password_hash, paws_balance)
        VALUES ('test-user-id', 'existing@rawgle.com', '42feda94c33d267af9c250bce24115120156525e8caae9e8504d0552d6321083', 100)
      `).run();
    });

    it('should login with valid credentials', async () => {
      const loginRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'existing@rawgle.com',
          password: 'CorrectPassword123!'
        })
      });

      const response = await mf.dispatchFetch(loginRequest);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('sessionToken');
      expect(data.userId).toBe('test-user-id');
      expect(data.pawsBalance).toBe(100);
    });

    it('should reject invalid credentials', async () => {
      const loginRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'existing@rawgle.com',
          password: 'WrongPassword!'
        })
      });

      const response = await mf.dispatchFetch(loginRequest);
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.error).toContain('Invalid credentials');
    });

    it('should rate limit login attempts', async () => {
      const loginRequest = () => new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'existing@rawgle.com',
          password: 'WrongPassword!'
        })
      });

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await mf.dispatchFetch(loginRequest());
      }

      // 6th attempt should be rate limited
      const response = await mf.dispatchFetch(loginRequest());
      expect(response.status).toBe(429);
      
      const data = await response.json();
      expect(data.error).toContain('Too many attempts');
    });
  });

  describe('Session Management', () => {
    it('should create and validate session tokens', async () => {
      const registerResponse = await mf.dispatchFetch(new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'session@rawgle.com',
          password: 'ValidPass123!'
        })
      }));

      const { sessionToken } = await registerResponse.json();
      expect(sessionToken).toBeDefined();

      // Validate session
      const validateRequest = new Request('http://localhost/api/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      const validateResponse = await mf.dispatchFetch(validateRequest);
      expect(validateResponse.status).toBe(200);
      
      const validationData = await validateResponse.json();
      expect(validationData.valid).toBe(true);
      expect(validationData.email).toBe('session@rawgle.com');
    });

    it('should logout and invalidate session', async () => {
      const registerResponse = await mf.dispatchFetch(new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'logout@rawgle.com',
          password: 'ValidPass123!'
        })
      }));

      const { sessionToken } = await registerResponse.json();

      // Logout
      const logoutRequest = new Request('http://localhost/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      const logoutResponse = await mf.dispatchFetch(logoutRequest);
      expect(logoutResponse.status).toBe(200);

      // Try to use invalidated session
      const validateRequest = new Request('http://localhost/api/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      const validateResponse = await mf.dispatchFetch(validateRequest);
      expect(validateResponse.status).toBe(401);
    });

    it('should expire sessions after timeout', async () => {
      vi.useFakeTimers();

      const registerResponse = await mf.dispatchFetch(new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'expire@rawgle.com',
          password: 'ValidPass123!'
        })
      }));

      const { sessionToken } = await registerResponse.json();

      // Fast-forward time beyond session timeout (24 hours)
      vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);

      const validateRequest = new Request('http://localhost/api/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      const validateResponse = await mf.dispatchFetch(validateRequest);
      expect(validateResponse.status).toBe(401);

      vi.useRealTimers();
    });
  });

  describe('Wallet Integration', () => {
    it('should link Solana wallet to user account', async () => {
      const registerResponse = await mf.dispatchFetch(new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'wallet@rawgle.com',
          password: 'ValidPass123!'
        })
      }));

      const { sessionToken, userId } = await registerResponse.json();

      const linkWalletRequest = new Request('http://localhost/api/auth/link-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          walletAddress: '7xKXtg2CW87d7TXQ5xjBR3Eqm3kqPgFNkpHBgzXPMwQf',
          signature: 'mock-signature'
        })
      });

      const linkResponse = await mf.dispatchFetch(linkWalletRequest);
      expect(linkResponse.status).toBe(200);

      const linkData = await linkResponse.json();
      expect(linkData.walletLinked).toBe(true);
      expect(linkData.nftHolderStatus).toBeDefined();
    });

    it('should prevent duplicate wallet linking', async () => {
      // Create two users
      const user1 = await mf.dispatchFetch(new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user1@rawgle.com',
          password: 'Pass123!',
          walletAddress: 'SameWalletAddress123'
        })
      }));

      const user2Response = await mf.dispatchFetch(new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user2@rawgle.com',
          password: 'Pass123!'
        })
      }));

      const { sessionToken } = await user2Response.json();

      // Try to link same wallet to user2
      const linkRequest = new Request('http://localhost/api/auth/link-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          walletAddress: 'SameWalletAddress123',
          signature: 'mock-signature'
        })
      });

      const response = await mf.dispatchFetch(linkRequest);
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('already linked');
    });
  });
});