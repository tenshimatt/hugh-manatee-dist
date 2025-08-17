// Authentication Service
// Handles user authentication for both platforms

import bcrypt from 'bcryptjs';
import { sign, verify } from '@hono/jwt';

export class AuthService {
  constructor(db, kv) {
    this.db = db;
    this.kv = kv;
    this.jwtSecret = 'your-super-secret-jwt-key'; // Should be from environment
    this.sessionExpiry = 7 * 24 * 60 * 60; // 7 days in seconds
  }

  /**
   * Register a new user
   * @param {Object} userData 
   * @param {'rawgle' | 'gohunta'} platform 
   * @returns {Promise<Object>}
   */
  async register(userData, platform) {
    const { email, password, name, location } = userData;
    
    // Validate input
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }
    
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    if (!this.isValidPassword(password)) {
      throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
    }
    
    // Check if user already exists
    const existingUser = await this.db
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(email.toLowerCase())
      .first();
    
    if (existingUser) {
      throw new Error('User already exists with this email');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Generate user ID
    const userId = crypto.randomUUID();
    
    try {
      // Create user
      await this.db
        .prepare(`
          INSERT INTO users (
            id, email, password_hash, name, location, platform,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          userId,
          email.toLowerCase(),
          passwordHash,
          name,
          location || null,
          platform,
          new Date().toISOString(),
          new Date().toISOString()
        )
        .run();
      
      // Create session
      const session = await this.createSession(userId, platform);
      
      // Return user data (without password)
      return {
        user: {
          id: userId,
          email: email.toLowerCase(),
          name,
          location,
          platform,
          emailVerified: false,
          profileCompleted: false,
          onboardingCompleted: false,
          subscriptionTier: 'free',
          createdAt: new Date().toISOString()
        },
        session
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Failed to create user account');
    }
  }

  /**
   * Authenticate user login
   * @param {string} email 
   * @param {string} password 
   * @param {'rawgle' | 'gohunta'} platform 
   * @returns {Promise<Object>}
   */
  async login(email, password, platform) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    // Check rate limiting
    await this.checkLoginRateLimit(email);
    
    try {
      // Get user
      const user = await this.db
        .prepare(`
          SELECT id, email, password_hash, name, location, platform,
                 subscription_tier, email_verified, profile_completed,
                 onboarding_completed, mfa_enabled, mfa_secret,
                 created_at, last_login
          FROM users 
          WHERE email = ? AND deleted_at IS NULL
        `)
        .bind(email.toLowerCase())
        .first();
      
      if (!user) {
        await this.recordFailedLogin(email);
        throw new Error('Invalid email or password');
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        await this.recordFailedLogin(email);
        throw new Error('Invalid email or password');
      }
      
      // Check if user can access this platform
      if (user.platform !== platform && user.platform !== 'both') {
        throw new Error(`This account is not registered for ${platform}`);
      }
      
      // Handle MFA if enabled
      if (user.mfa_enabled) {
        // For now, skip MFA implementation
        // TODO: Implement TOTP verification
      }
      
      // Update last login
      await this.db
        .prepare('UPDATE users SET last_login = ? WHERE id = ?')
        .bind(new Date().toISOString(), user.id)
        .run();
      
      // Create session
      const session = await this.createSession(user.id, platform);
      
      // Clear failed login attempts
      await this.clearFailedLogins(email);
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          location: user.location,
          platform: user.platform,
          subscriptionTier: user.subscription_tier,
          emailVerified: Boolean(user.email_verified),
          profileCompleted: Boolean(user.profile_completed),
          onboardingCompleted: Boolean(user.onboarding_completed),
          mfaEnabled: Boolean(user.mfa_enabled),
          createdAt: user.created_at,
          lastLogin: user.last_login
        },
        session
      };
    } catch (error) {
      if (error.message.includes('Invalid email or password')) {
        throw error;
      }
      console.error('Login error:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Logout user and invalidate session
   * @param {string} sessionToken 
   * @returns {Promise<void>}
   */
  async logout(sessionToken) {
    if (!sessionToken) {
      return;
    }
    
    try {
      // Remove session from KV
      await this.kv.delete(`session:${sessionToken}`);
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error for logout failures
    }
  }

  /**
   * Verify session token
   * @param {string} sessionToken 
   * @returns {Promise<Object|null>}
   */
  async verifySession(sessionToken) {
    if (!sessionToken) {
      return null;
    }
    
    try {
      // Check session in KV first (faster)
      const sessionData = await this.kv.get(`session:${sessionToken}`, 'json');
      if (!sessionData) {
        return null;
      }
      
      // Verify JWT
      const payload = await verify(sessionToken, this.jwtSecret);
      if (!payload || payload.exp < Date.now() / 1000) {
        // Remove expired session
        await this.kv.delete(`session:${sessionToken}`);
        return null;
      }
      
      // Get fresh user data
      const user = await this.db
        .prepare(`
          SELECT id, email, name, location, platform, subscription_tier,
                 email_verified, profile_completed, onboarding_completed
          FROM users 
          WHERE id = ? AND deleted_at IS NULL
        `)
        .bind(payload.sub)
        .first();
      
      if (!user) {
        await this.kv.delete(`session:${sessionToken}`);
        return null;
      }
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          location: user.location,
          platform: user.platform,
          subscriptionTier: user.subscription_tier,
          emailVerified: Boolean(user.email_verified),
          profileCompleted: Boolean(user.profile_completed),
          onboardingCompleted: Boolean(user.onboarding_completed)
        },
        sessionData
      };
    } catch (error) {
      console.error('Session verification error:', error);
      return null;
    }
  }

  /**
   * Create a new session
   * @param {string} userId 
   * @param {'rawgle' | 'gohunta'} platform 
   * @returns {Promise<Object>}
   */
  async createSession(userId, platform) {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.sessionExpiry;
    
    const payload = {
      sub: userId,
      platform: platform,
      iat: now,
      exp: exp
    };
    
    const token = await sign(payload, this.jwtSecret);
    
    // Store session metadata in KV
    const sessionData = {
      userId,
      platform,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(exp * 1000).toISOString(),
      userAgent: '', // TODO: Extract from request
      ipAddress: '' // TODO: Extract from request
    };
    
    await this.kv.put(`session:${token}`, JSON.stringify(sessionData), {
      expirationTtl: this.sessionExpiry
    });
    
    return {
      token,
      expiresAt: sessionData.expiresAt
    };
  }

  /**
   * Refresh session token
   * @param {string} currentToken 
   * @returns {Promise<Object>}
   */
  async refreshSession(currentToken) {
    const sessionInfo = await this.verifySession(currentToken);
    if (!sessionInfo) {
      throw new Error('Invalid session');
    }
    
    // Create new session
    const newSession = await this.createSession(
      sessionInfo.user.id, 
      sessionInfo.sessionData.platform
    );
    
    // Remove old session
    await this.kv.delete(`session:${currentToken}`);
    
    return newSession;
  }

  /**
   * Check login rate limiting
   * @param {string} email 
   * @returns {Promise<void>}
   */
  async checkLoginRateLimit(email) {
    const key = `login_attempts:${email}`;
    const attempts = await this.kv.get(key);
    
    if (attempts && parseInt(attempts) >= 5) {
      throw new Error('Too many login attempts. Please try again in 15 minutes.');
    }
  }

  /**
   * Record failed login attempt
   * @param {string} email 
   * @returns {Promise<void>}
   */
  async recordFailedLogin(email) {
    const key = `login_attempts:${email}`;
    const attempts = await this.kv.get(key);
    const newAttempts = attempts ? parseInt(attempts) + 1 : 1;
    
    await this.kv.put(key, newAttempts.toString(), {
      expirationTtl: 15 * 60 // 15 minutes
    });
  }

  /**
   * Clear failed login attempts
   * @param {string} email 
   * @returns {Promise<void>}
   */
  async clearFailedLogins(email) {
    await this.kv.delete(`login_attempts:${email}`);
  }

  /**
   * Validate email format
   * @param {string} email 
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * @param {string} password 
   * @returns {boolean}
   */
  isValidPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * Change user password
   * @param {string} userId 
   * @param {string} currentPassword 
   * @param {string} newPassword 
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Get current password hash
    const user = await this.db
      .prepare('SELECT password_hash FROM users WHERE id = ?')
      .bind(userId)
      .first();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Validate new password
    if (!this.isValidPassword(newPassword)) {
      throw new Error('New password must be at least 8 characters with uppercase, lowercase, and number');
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await this.db
      .prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .bind(newPasswordHash, new Date().toISOString(), userId)
      .run();
  }

  /**
   * Request password reset
   * @param {string} email 
   * @param {'rawgle' | 'gohunta'} platform 
   * @returns {Promise<void>}
   */
  async requestPasswordReset(email, platform) {
    const user = await this.db
      .prepare('SELECT id, name FROM users WHERE email = ? AND deleted_at IS NULL')
      .bind(email.toLowerCase())
      .first();
    
    if (!user) {
      // Don't reveal if email exists or not
      return;
    }
    
    // Generate reset token
    const resetToken = crypto.randomUUID();
    
    // Store reset token in KV (expires in 1 hour)
    await this.kv.put(`password_reset:${resetToken}`, JSON.stringify({
      userId: user.id,
      email: email.toLowerCase(),
      platform,
      createdAt: new Date().toISOString()
    }), {
      expirationTtl: 60 * 60 // 1 hour
    });
    
    // TODO: Send password reset email
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  /**
   * Reset password with token
   * @param {string} resetToken 
   * @param {string} newPassword 
   * @returns {Promise<void>}
   */
  async resetPassword(resetToken, newPassword) {
    // Get reset data
    const resetData = await this.kv.get(`password_reset:${resetToken}`, 'json');
    if (!resetData) {
      throw new Error('Invalid or expired reset token');
    }
    
    // Validate new password
    if (!this.isValidPassword(newPassword)) {
      throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await this.db
      .prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .bind(passwordHash, new Date().toISOString(), resetData.userId)
      .run();
    
    // Delete reset token
    await this.kv.delete(`password_reset:${resetToken}`);
  }
}