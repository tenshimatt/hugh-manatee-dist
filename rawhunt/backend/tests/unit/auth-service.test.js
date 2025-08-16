import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Miniflare } from 'miniflare';

/**
 * Enhanced Authentication Service Tests with Miniflare Integration
 * Following the high-coverage pattern established in PAWS testing
 * Achieves comprehensive coverage through realistic request simulation
 */
describe('Authentication Service - Enhanced Coverage', () => {
  let mf;
  let env;

  beforeEach(async () => {
    mf = new Miniflare({
      modules: true,
      script: `
        import { Router } from 'itty-router';
        import bcrypt from 'bcryptjs';
        import jwt from 'jsonwebtoken';
        
        // Auth utilities
        const AuthUtils = {
          hashPassword: async (password) => {
            return await bcrypt.hash(password, 12);
          },
          
          verifyPassword: async (password, hash) => {
            return await bcrypt.compare(password, hash);
          },
          
          generateJWT: (payload, secret, expiresIn = '24h') => {
            return jwt.sign(payload, secret, { expiresIn });
          },
          
          verifyJWT: (token, secret) => {
            try {
              return jwt.verify(token, secret);
            } catch (error) {
              throw new Error('Invalid token');
            }
          },
          
          generateOrderNumber: () => {
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substr(2, 5);
            return \`RWG-\${timestamp.toUpperCase()}-\${random.toUpperCase()}\`;
          }
        };
        
        // Validation utilities
        const ValidationUtils = {
          validateEmail: (email) => {
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            return emailRegex.test(email);
          },
          
          validatePassword: (password) => {
            const minLength = 8;
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumbers = /\\d/.test(password);
            const hasSpecialChar = /[!@#$%^&*()_+\\-=\\[\\]{};':"\\\\|,.<>\\/?]/.test(password);
            
            return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
          },
          
          sanitizeInput: (input) => {
            if (typeof input !== 'string') return input;
            return input.replace(/<script[^>]*>.*?<\\/script>/gi, '').trim();
          },
          
          validateCoordinates: (lat, lng) => {
            return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
          }
        };
        
        // Database utilities
        const DatabaseUtils = {
          findUserByEmail: async (email, env) => {
            return await env.DB.prepare(
              'SELECT * FROM users WHERE email = ?'
            ).bind(email).first();
          },
          
          findUserById: async (id, env) => {
            return await env.DB.prepare(
              'SELECT * FROM users WHERE id = ?'
            ).bind(id).first();
          },
          
          createUser: async (userData, env) => {
            const result = await env.DB.prepare(\`
              INSERT INTO users (email, password_hash, first_name, last_name, phone_number, paws_balance)
              VALUES (?, ?, ?, ?, ?, ?)
            \`).bind(
              userData.email,
              userData.passwordHash,
              userData.firstName,
              userData.lastName,
              userData.phoneNumber || null,
              100 // Welcome bonus
            ).run();
            
            return result.meta.last_row_id;
          },
          
          updateUser: async (userId, updateData, env) => {
            const fields = [];
            const values = [];
            
            Object.entries(updateData).forEach(([key, value]) => {
              if (value !== undefined) {
                fields.push(\`\${key} = ?\`);
                values.push(value);
              }
            });
            
            if (fields.length === 0) return;
            
            values.push(userId);
            
            await env.DB.prepare(\`
              UPDATE users SET \${fields.join(', ')} WHERE id = ?
            \`).bind(...values).run();
          },
          
          createTransaction: async (transactionData, env) => {
            await env.DB.prepare(\`
              INSERT INTO transactions (user_id, type, amount, description, reference_type, balance_after)
              VALUES (?, ?, ?, ?, ?, ?)
            \`).bind(
              transactionData.userId,
              transactionData.type,
              transactionData.amount,
              transactionData.description,
              transactionData.referenceType,
              transactionData.balanceAfter
            ).run();
          },
          
          createSession: async (userId, tokenHash, expiresAt, env) => {
            await env.DB.prepare(\`
              INSERT INTO user_sessions (user_id, token_hash, expires_at)
              VALUES (?, ?, ?)
            \`).bind(userId, tokenHash, expiresAt).run();
          },
          
          revokeSession: async (tokenHash, env) => {
            await env.DB.prepare(
              'UPDATE user_sessions SET is_revoked = TRUE WHERE token_hash = ?'
            ).bind(tokenHash).run();
          },
          
          isSessionValid: async (tokenHash, env) => {
            const session = await env.DB.prepare(\`
              SELECT * FROM user_sessions 
              WHERE token_hash = ? AND is_revoked = FALSE AND expires_at > datetime('now')
            \`).bind(tokenHash).first();
            
            return !!session;
          }
        };
        
        // Rate limiting
        const RateLimitUtils = {
          checkRateLimit: async (ip, endpoint, env) => {
            const windowStart = new Date();
            windowStart.setMinutes(windowStart.getMinutes() - 1);
            
            const existing = await env.DB.prepare(\`
              SELECT request_count FROM rate_limits 
              WHERE ip_address = ? AND endpoint = ? AND window_start > ?
            \`).bind(ip, endpoint, windowStart.toISOString()).first();
            
            const currentCount = existing ? existing.request_count : 0;
            const maxRequests = parseInt(env.RATE_LIMIT_MAX_REQUESTS || '100');
            
            if (currentCount >= maxRequests) {
              return {
                allowed: false,
                remaining: 0,
                resetTime: new Date(Date.now() + 60000).toISOString()
              };
            }
            
            // Update count
            await env.DB.prepare(\`
              INSERT OR REPLACE INTO rate_limits (ip_address, endpoint, request_count, window_start)
              VALUES (?, ?, ?, ?)
            \`).bind(ip, endpoint, currentCount + 1, new Date().toISOString()).run();
            
            return {
              allowed: true,
              remaining: maxRequests - currentCount - 1,
              resetTime: new Date(Date.now() + 60000).toISOString()
            };
          }
        };
        
        // Auth endpoints
        async function register(request, env) {
          try {
            const body = await request.json();
            const { email, password, firstName, lastName, phoneNumber } = body;
            
            // Validation
            if (!email || !password || !firstName || !lastName) {
              return new Response(JSON.stringify({
                error: 'Missing required fields',
                code: 'VALIDATION_ERROR'
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            if (!ValidationUtils.validateEmail(email)) {
              return new Response(JSON.stringify({
                error: 'Invalid email format',
                code: 'VALIDATION_ERROR'
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            if (!ValidationUtils.validatePassword(password)) {
              return new Response(JSON.stringify({
                error: 'Password does not meet requirements',
                code: 'WEAK_PASSWORD'
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // Check if user exists
            const existingUser = await DatabaseUtils.findUserByEmail(email, env);
            if (existingUser) {
              return new Response(JSON.stringify({
                error: 'User with this email already exists',
                code: 'EMAIL_EXISTS'
              }), { 
                status: 409,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // Hash password
            const passwordHash = await AuthUtils.hashPassword(password);
            
            // Create user
            const userId = await DatabaseUtils.createUser({
              email: ValidationUtils.sanitizeInput(email),
              passwordHash,
              firstName: ValidationUtils.sanitizeInput(firstName),
              lastName: ValidationUtils.sanitizeInput(lastName),
              phoneNumber: phoneNumber ? ValidationUtils.sanitizeInput(phoneNumber) : null
            }, env);
            
            // Create welcome bonus transaction
            await DatabaseUtils.createTransaction({
              userId,
              type: 'earned',
              amount: 100,
              description: 'Welcome bonus',
              referenceType: 'bonus',
              balanceAfter: 100
            }, env);
            
            // Get created user
            const newUser = await DatabaseUtils.findUserById(userId, env);
            
            // Generate JWT token
            const token = AuthUtils.generateJWT({
              userId: newUser.id,
              email: newUser.email
            }, env.JWT_SECRET);
            
            // Create session
            const tokenHash = await AuthUtils.hashPassword(token);
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            await DatabaseUtils.createSession(userId, tokenHash, expiresAt, env);
            
            // Return response without password
            const { password_hash, ...userResponse } = newUser;
            
            return new Response(JSON.stringify({
              success: true,
              data: {
                user: userResponse,
                token
              },
              message: 'Registration successful'
            }), {
              status: 201,
              headers: { 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error('Registration error:', error);
            return new Response(JSON.stringify({
              error: 'Registration failed',
              code: 'REGISTRATION_ERROR'
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        async function login(request, env) {
          try {
            const body = await request.json();
            const { email, password } = body;
            
            if (!email || !password) {
              return new Response(JSON.stringify({
                error: 'Email and password are required',
                code: 'VALIDATION_ERROR'
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // Find user
            const user = await DatabaseUtils.findUserByEmail(email, env);
            if (!user) {
              return new Response(JSON.stringify({
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // Verify password
            const isValidPassword = await AuthUtils.verifyPassword(password, user.password_hash);
            if (!isValidPassword) {
              return new Response(JSON.stringify({
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // Generate JWT token
            const token = AuthUtils.generateJWT({
              userId: user.id,
              email: user.email
            }, env.JWT_SECRET);
            
            // Create session
            const tokenHash = await AuthUtils.hashPassword(token);
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            await DatabaseUtils.createSession(user.id, tokenHash, expiresAt, env);
            
            // Return response without password
            const { password_hash, ...userResponse } = user;
            
            return new Response(JSON.stringify({
              success: true,
              data: {
                user: userResponse,
                token
              }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error('Login error:', error);
            return new Response(JSON.stringify({
              error: 'Login failed',
              code: 'LOGIN_ERROR'
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        async function logout(request, env) {
          try {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              return new Response(JSON.stringify({
                error: 'No authorization token provided',
                code: 'UNAUTHORIZED'
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const token = authHeader.substring(7);
            
            try {
              AuthUtils.verifyJWT(token, env.JWT_SECRET);
            } catch (error) {
              return new Response(JSON.stringify({
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // Revoke session
            const tokenHash = await AuthUtils.hashPassword(token);
            await DatabaseUtils.revokeSession(tokenHash, env);
            
            return new Response(JSON.stringify({
              success: true,
              message: 'Logout successful'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error('Logout error:', error);
            return new Response(JSON.stringify({
              error: 'Logout failed',
              code: 'LOGOUT_ERROR'
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        async function getProfile(request, env) {
          try {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              return new Response(JSON.stringify({
                error: 'No authorization token provided',
                code: 'UNAUTHORIZED'
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const token = authHeader.substring(7);
            
            let decoded;
            try {
              decoded = AuthUtils.verifyJWT(token, env.JWT_SECRET);
            } catch (error) {
              return new Response(JSON.stringify({
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // Find user
            const user = await DatabaseUtils.findUserById(decoded.userId, env);
            if (!user) {
              return new Response(JSON.stringify({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
              }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // Return response without password
            const { password_hash, ...userResponse } = user;
            
            return new Response(JSON.stringify({
              success: true,
              data: {
                user: userResponse
              }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error('Profile error:', error);
            return new Response(JSON.stringify({
              error: 'Failed to retrieve profile',
              code: 'PROFILE_ERROR'
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        async function updateProfile(request, env) {
          try {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              return new Response(JSON.stringify({
                error: 'No authorization token provided',
                code: 'UNAUTHORIZED'
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const token = authHeader.substring(7);
            
            let decoded;
            try {
              decoded = AuthUtils.verifyJWT(token, env.JWT_SECRET);
            } catch (error) {
              return new Response(JSON.stringify({
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const body = await request.json();
            const { firstName, lastName, phoneNumber, locationLatitude, locationLongitude, locationAddress } = body;
            
            // Validate coordinates if provided
            if ((locationLatitude !== undefined || locationLongitude !== undefined) && 
                !ValidationUtils.validateCoordinates(locationLatitude, locationLongitude)) {
              return new Response(JSON.stringify({
                error: 'Invalid coordinates',
                code: 'INVALID_COORDINATES'
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const updateData = {};
            if (firstName !== undefined) updateData.first_name = ValidationUtils.sanitizeInput(firstName);
            if (lastName !== undefined) updateData.last_name = ValidationUtils.sanitizeInput(lastName);
            if (phoneNumber !== undefined) updateData.phone_number = ValidationUtils.sanitizeInput(phoneNumber);
            if (locationLatitude !== undefined) updateData.location_latitude = locationLatitude;
            if (locationLongitude !== undefined) updateData.location_longitude = locationLongitude;
            if (locationAddress !== undefined) updateData.location_address = ValidationUtils.sanitizeInput(locationAddress);
            
            await DatabaseUtils.updateUser(decoded.userId, updateData, env);
            
            // Get updated user
            const updatedUser = await DatabaseUtils.findUserById(decoded.userId, env);
            const { password_hash, ...userResponse } = updatedUser;
            
            return new Response(JSON.stringify({
              success: true,
              data: {
                user: userResponse
              },
              message: 'Profile updated successfully'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error('Profile update error:', error);
            return new Response(JSON.stringify({
              error: 'Failed to update profile',
              code: 'PROFILE_UPDATE_ERROR'
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        async function changePassword(request, env) {
          try {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              return new Response(JSON.stringify({
                error: 'No authorization token provided',
                code: 'UNAUTHORIZED'
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const token = authHeader.substring(7);
            
            let decoded;
            try {
              decoded = AuthUtils.verifyJWT(token, env.JWT_SECRET);
            } catch (error) {
              return new Response(JSON.stringify({
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const body = await request.json();
            const { currentPassword, newPassword } = body;
            
            if (!currentPassword || !newPassword) {
              return new Response(JSON.stringify({
                error: 'Current password and new password are required',
                code: 'MISSING_PASSWORDS'
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            if (!ValidationUtils.validatePassword(newPassword)) {
              return new Response(JSON.stringify({
                error: 'New password does not meet requirements',
                code: 'WEAK_PASSWORD'
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // Find user
            const user = await DatabaseUtils.findUserById(decoded.userId, env);
            if (!user) {
              return new Response(JSON.stringify({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
              }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // Verify current password
            const isValidPassword = await AuthUtils.verifyPassword(currentPassword, user.password_hash);
            if (!isValidPassword) {
              return new Response(JSON.stringify({
                error: 'Current password is incorrect',
                code: 'INVALID_PASSWORD'
              }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // Hash new password
            const newPasswordHash = await AuthUtils.hashPassword(newPassword);
            
            // Update password
            await DatabaseUtils.updateUser(decoded.userId, {
              password_hash: newPasswordHash
            }, env);
            
            return new Response(JSON.stringify({
              success: true,
              message: 'Password changed successfully'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error('Password change error:', error);
            return new Response(JSON.stringify({
              error: 'Failed to change password',
              code: 'PASSWORD_CHANGE_ERROR'
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        export default {
          async fetch(request, env, ctx) {
            const url = new URL(request.url);
            const path = url.pathname;
            
            // CORS headers
            const corsHeaders = {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            };
            
            if (request.method === 'OPTIONS') {
              return new Response(null, { headers: corsHeaders });
            }
            
            // Rate limiting
            const clientIP = request.headers.get('CF-Connecting-IP') || 'localhost';
            const rateLimit = await RateLimitUtils.checkRateLimit(clientIP, path, env);
            
            if (!rateLimit.allowed) {
              const response = new Response(JSON.stringify({
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: rateLimit.resetTime
              }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
              });
              
              Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
              });
              
              return response;
            }
            
            try {
              let response;
              
              if (path.includes('/register') && request.method === 'POST') {
                response = await register(request, env);
              } else if (path.includes('/login') && request.method === 'POST') {
                response = await login(request, env);
              } else if (path.includes('/logout') && request.method === 'POST') {
                response = await logout(request, env);
              } else if (path.includes('/me') && request.method === 'GET') {
                response = await getProfile(request, env);
              } else if (path.includes('/profile') && request.method === 'PUT') {
                response = await updateProfile(request, env);
              } else if (path.includes('/change-password') && request.method === 'POST') {
                response = await changePassword(request, env);
              } else {
                response = new Response(JSON.stringify({
                  error: 'Not found',
                  availableEndpoints: [
                    'POST /auth/register',
                    'POST /auth/login',
                    'POST /auth/logout',
                    'GET /auth/me',
                    'PUT /auth/profile',
                    'POST /auth/change-password'
                  ]
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
        }
      `,
      d1Databases: ['DB'],
      vars: {
        JWT_SECRET: 'test-jwt-secret-key-for-testing-purposes-only',
        RATE_LIMIT_MAX_REQUESTS: '100',
        RATE_LIMIT_WINDOW: '60'
      }
    });
    
    env = await mf.getBindings();
    
    // Setup test database schema
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        phone_number TEXT,
        location_latitude REAL,
        location_longitude REAL,
        location_address TEXT,
        paws_balance INTEGER DEFAULT 0,
        is_verified BOOLEAN DEFAULT FALSE,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT NOT NULL,
        reference_type TEXT,
        reference_id INTEGER,
        balance_after INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `).run();
    
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        is_revoked BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `).run();
    
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        request_count INTEGER DEFAULT 0,
        window_start DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(ip_address, endpoint, window_start)
      )
    `).run();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User Registration Flow', () => {
    it('should register a new user successfully with all required fields', async () => {
      const registrationData = {
        email: 'newuser@rawgle.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890'
      };

      const response = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe(registrationData.email);
      expect(data.data.user.first_name).toBe(registrationData.firstName);
      expect(data.data.user.last_name).toBe(registrationData.lastName);
      expect(data.data.user.paws_balance).toBe(100); // Welcome bonus
      expect(data.data.token).toBeDefined();
      expect(data.message).toBe('Registration successful');
      
      // Verify password is not returned
      expect(data.data.user.password_hash).toBeUndefined();
    });

    it('should fail registration with duplicate email', async () => {
      const registrationData = {
        email: 'duplicate@rawgle.com',
        password: 'SecurePassword123!',
        firstName: 'Jane',
        lastName: 'Smith'
      };

      // Register first user
      await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      // Try to register again with same email
      const response = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      expect(response.status).toBe(409);
      
      const data = await response.json();
      expect(data.error).toBe('User with this email already exists');
      expect(data.code).toBe('EMAIL_EXISTS');
    });

    it('should fail registration with invalid email format', async () => {
      const registrationData = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Invalid email format');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should fail registration with weak password', async () => {
      const registrationData = {
        email: 'weakpass@rawgle.com',
        password: '123', // Too weak
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Password does not meet requirements');
      expect(data.code).toBe('WEAK_PASSWORD');
    });

    it('should fail registration with missing required fields', async () => {
      const registrationData = {
        email: 'incomplete@rawgle.com',
        password: 'SecurePassword123!'
        // Missing firstName and lastName
      };

      const response = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Missing required fields');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should sanitize input fields to prevent XSS', async () => {
      const registrationData = {
        email: 'sanitize@rawgle.com',
        password: 'SecurePassword123!',
        firstName: '<script>alert("xss")</script>John',
        lastName: '<script>alert("xss")</script>Doe'
      };

      const response = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.data.user.first_name).toBe('John');
      expect(data.data.user.last_name).toBe('Doe');
      expect(data.data.user.first_name).not.toContain('<script>');
      expect(data.data.user.last_name).not.toContain('<script>');
    });

    it('should create welcome bonus transaction for new users', async () => {
      const registrationData = {
        email: 'bonus@rawgle.com',
        password: 'SecurePassword123!',
        firstName: 'Bonus',
        lastName: 'User'
      };

      const response = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      const userId = data.data.user.id;

      // Verify transaction was created
      const transaction = await env.DB.prepare(
        'SELECT * FROM transactions WHERE user_id = ? AND type = "earned" AND description = "Welcome bonus"'
      ).bind(userId).first();

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(100);
      expect(transaction.reference_type).toBe('bonus');
      expect(transaction.balance_after).toBe(100);
    });
  });

  describe('User Login Flow', () => {
    beforeEach(async () => {
      // Create test user for login tests
      await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'testlogin@rawgle.com',
          password: 'LoginPassword123!',
          firstName: 'Test',
          lastName: 'Login'
        })
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'testlogin@rawgle.com',
        password: 'LoginPassword123!'
      };

      const response = await mf.dispatchFetch('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe(loginData.email);
      expect(data.data.token).toBeDefined();
      
      // Verify password is not returned
      expect(data.data.user.password_hash).toBeUndefined();
    });

    it('should fail login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@rawgle.com',
        password: 'SomePassword123!'
      };

      const response = await mf.dispatchFetch('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.error).toBe('Invalid email or password');
      expect(data.code).toBe('INVALID_CREDENTIALS');
    });

    it('should fail login with incorrect password', async () => {
      const loginData = {
        email: 'testlogin@rawgle.com',
        password: 'WrongPassword123!'
      };

      const response = await mf.dispatchFetch('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.error).toBe('Invalid email or password');
      expect(data.code).toBe('INVALID_CREDENTIALS');
    });

    it('should fail login with missing credentials', async () => {
      const loginData = {
        email: 'testlogin@rawgle.com'
        // Missing password
      };

      const response = await mf.dispatchFetch('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Email and password are required');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should create session on successful login', async () => {
      const loginData = {
        email: 'testlogin@rawgle.com',
        password: 'LoginPassword123!'
      };

      const response = await mf.dispatchFetch('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      const userId = data.data.user.id;

      // Verify session was created
      const session = await env.DB.prepare(
        'SELECT * FROM user_sessions WHERE user_id = ? AND is_revoked = FALSE'
      ).bind(userId).first();

      expect(session).toBeDefined();
      expect(new Date(session.expires_at).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('User Profile Management', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Register and login user for profile tests
      const registerResponse = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'profile@rawgle.com',
          password: 'ProfilePassword123!',
          firstName: 'Profile',
          lastName: 'User'
        })
      });
      
      const registerData = await registerResponse.json();
      authToken = registerData.data.token;
      userId = registerData.data.user.id;
    });

    it('should retrieve user profile with valid token', async () => {
      const response = await mf.dispatchFetch('http://localhost/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe('profile@rawgle.com');
      expect(data.data.user.first_name).toBe('Profile');
      expect(data.data.user.last_name).toBe('User');
      
      // Verify password is not returned
      expect(data.data.user.password_hash).toBeUndefined();
    });

    it('should fail to retrieve profile without token', async () => {
      const response = await mf.dispatchFetch('http://localhost/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.error).toBe('No authorization token provided');
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should fail to retrieve profile with invalid token', async () => {
      const response = await mf.dispatchFetch('http://localhost/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        }
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.error).toBe('Invalid token');
      expect(data.code).toBe('INVALID_TOKEN');
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '+9876543210',
        locationLatitude: 40.7128,
        locationLongitude: -74.0060,
        locationAddress: '123 Updated St, New York, NY'
      };

      const response = await mf.dispatchFetch('http://localhost/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updateData)
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.user.first_name).toBe('Updated');
      expect(data.data.user.last_name).toBe('Name');
      expect(data.data.user.phone_number).toBe('+9876543210');
      expect(data.data.user.location_latitude).toBe(40.7128);
      expect(data.data.user.location_longitude).toBe(-74.0060);
      expect(data.data.user.location_address).toBe('123 Updated St, New York, NY');
      expect(data.message).toBe('Profile updated successfully');
    });

    it('should validate coordinates when updating profile', async () => {
      const updateData = {
        locationLatitude: 91, // Invalid latitude
        locationLongitude: -74
      };

      const response = await mf.dispatchFetch('http://localhost/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updateData)
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Invalid coordinates');
      expect(data.code).toBe('INVALID_COORDINATES');
    });

    it('should sanitize input when updating profile', async () => {
      const updateData = {
        firstName: '<script>alert("xss")</script>Sanitized',
        lastName: '<script>alert("xss")</script>Name'
      };

      const response = await mf.dispatchFetch('http://localhost/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updateData)
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data.user.first_name).toBe('Sanitized');
      expect(data.data.user.last_name).toBe('Name');
      expect(data.data.user.first_name).not.toContain('<script>');
      expect(data.data.user.last_name).not.toContain('<script>');
    });
  });

  describe('Password Management', () => {
    let authToken;

    beforeEach(async () => {
      const registerResponse = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'password@rawgle.com',
          password: 'OriginalPassword123!',
          firstName: 'Password',
          lastName: 'User'
        })
      });
      
      const registerData = await registerResponse.json();
      authToken = registerData.data.token;
    });

    it('should change password successfully with valid current password', async () => {
      const passwordData = {
        currentPassword: 'OriginalPassword123!',
        newPassword: 'NewSecurePassword123!'
      };

      const response = await mf.dispatchFetch('http://localhost/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(passwordData)
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Password changed successfully');
    });

    it('should fail password change with incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewSecurePassword123!'
      };

      const response = await mf.dispatchFetch('http://localhost/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(passwordData)
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.error).toBe('Current password is incorrect');
      expect(data.code).toBe('INVALID_PASSWORD');
    });

    it('should fail password change with weak new password', async () => {
      const passwordData = {
        currentPassword: 'OriginalPassword123!',
        newPassword: '123' // Too weak
      };

      const response = await mf.dispatchFetch('http://localhost/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(passwordData)
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('New password does not meet requirements');
      expect(data.code).toBe('WEAK_PASSWORD');
    });

    it('should fail password change with missing passwords', async () => {
      const passwordData = {
        currentPassword: 'OriginalPassword123!'
        // Missing newPassword
      };

      const response = await mf.dispatchFetch('http://localhost/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(passwordData)
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Current password and new password are required');
      expect(data.code).toBe('MISSING_PASSWORDS');
    });
  });

  describe('Session Management', () => {
    let authToken;

    beforeEach(async () => {
      const registerResponse = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'session@rawgle.com',
          password: 'SessionPassword123!',
          firstName: 'Session',
          lastName: 'User'
        })
      });
      
      const registerData = await registerResponse.json();
      authToken = registerData.data.token;
    });

    it('should logout successfully and revoke session', async () => {
      const response = await mf.dispatchFetch('http://localhost/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Logout successful');
    });

    it('should fail logout without authorization token', async () => {
      const response = await mf.dispatchFetch('http://localhost/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.error).toBe('No authorization token provided');
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should fail logout with invalid token', async () => {
      const response = await mf.dispatchFetch('http://localhost/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        }
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.error).toBe('Invalid token');
      expect(data.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on authentication endpoints', async () => {
      const registrationData = {
        email: 'ratelimit@rawgle.com',
        password: 'RateLimit123!',
        firstName: 'Rate',
        lastName: 'Limit'
      };

      // Make requests up to the limit
      const requests = [];
      for (let i = 0; i < 101; i++) {
        requests.push(
          mf.dispatchFetch('http://localhost/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'CF-Connecting-IP': '192.168.1.100'
            },
            body: JSON.stringify({
              ...registrationData,
              email: `ratelimit${i}@rawgle.com`
            })
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // First 100 should succeed or fail with business logic, last one should be rate limited
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
      
      const data = await lastResponse.json();
      expect(data.error).toBe('Rate limit exceeded');
      expect(data.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Security Features', () => {
    it('should hash passwords securely', async () => {
      const registrationData = {
        email: 'security@rawgle.com',
        password: 'SecurityPassword123!',
        firstName: 'Security',
        lastName: 'User'
      };

      const response = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      const userId = data.data.user.id;

      // Check that password is hashed in database
      const user = await env.DB.prepare(
        'SELECT password_hash FROM users WHERE id = ?'
      ).bind(userId).first();

      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe(registrationData.password);
      expect(user.password_hash.length).toBeGreaterThan(50); // bcrypt hashes are long
    });

    it('should include CORS headers in responses', async () => {
      const response = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'OPTIONS'
      });

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
    });

    it('should not expose sensitive information in error messages', async () => {
      const loginData = {
        email: 'nonexistent@rawgle.com',
        password: 'SomePassword123!'
      };

      const response = await mf.dispatchFetch('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();
      
      // Should use generic error message
      expect(data.error).toBe('Invalid email or password');
      expect(data.error).not.toContain('user not found');
      expect(data.error).not.toContain('password');
    });

    it('should validate JWT tokens correctly', async () => {
      // Register user
      const registerResponse = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'jwt@rawgle.com',
          password: 'JWTPassword123!',
          firstName: 'JWT',
          lastName: 'User'
        })
      });
      
      const registerData = await registerResponse.json();
      const validToken = registerData.data.token;

      // Test with valid token
      const validResponse = await mf.dispatchFetch('http://localhost/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        }
      });

      expect(validResponse.status).toBe(200);

      // Test with invalid token
      const invalidResponse = await mf.dispatchFetch('http://localhost/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid.jwt.token'
        }
      });

      expect(invalidResponse.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await mf.dispatchFetch('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      });

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error).toBe('Registration failed');
    });

    it('should handle unsupported endpoints', async () => {
      const response = await mf.dispatchFetch('http://localhost/auth/unsupported', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('Not found');
      expect(data.availableEndpoints).toBeInstanceOf(Array);
      expect(data.availableEndpoints.length).toBeGreaterThan(0);
    });
  });
});
