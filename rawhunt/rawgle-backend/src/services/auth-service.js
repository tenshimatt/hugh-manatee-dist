/**
 * Authentication Service for Rawgle
 * Handles user registration, login, profile management, and session handling
 * Works with existing Rawgle database structure
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

export class AuthService {
  constructor(db, kv, emailService = null) {
    this.db = db;
    this.kv = kv;
    this.emailService = emailService;
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User and token
   */
  async register(userData) {
    const { email, password, name, location, phone, experience_level = 'beginner', privacy_settings, preferences } = userData;
    
    // Check if user already exists
    const existingUser = await this.db
      .prepare('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL')
      .bind(email.toLowerCase())
      .first();
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter, one uppercase letter, and one number');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Generate user ID
    const userId = nanoid(21);
    
    // Set default privacy settings and preferences
    const defaultPrivacySettings = {
      share_feeding_data: true,
      share_location: false,
      public_profile: true,
      allow_messages: true,
      ...privacy_settings
    };
    
    const defaultPreferences = {
      email_notifications: true,
      push_notifications: true,
      newsletter: true,
      feeding_reminders: true,
      paws_notifications: true,
      ...preferences
    };
    
    try {
      // Create user record
      const now = new Date().toISOString();
      await this.db
        .prepare(`
          INSERT INTO users (
            id, email, password_hash, name, platform, location, phone,
            experience_level, subscription_tier, email_verified, profile_completed,
            onboarding_completed, privacy_settings, preferences, paws_balance,
            paws_lifetime_earned, paws_lifetime_spent, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          userId, email.toLowerCase(), passwordHash, name, 'rawgle', location, phone,
          experience_level, 'free', false, false, false,
          JSON.stringify(defaultPrivacySettings), JSON.stringify(defaultPreferences),
          0, 0, 0, now, now
        )
        .run();
      
      // Send verification email
      if (this.emailService) {
        try {
          await this.sendVerificationEmail(userId, email, name);
        } catch (emailError) {
          console.warn('Failed to send verification email:', emailError);
          // Don't fail registration for email errors
        }
      }
      
      // Award welcome PAWS tokens
      try {
        await this.awardWelcomePAWS(userId);
      } catch (pawsError) {
        console.warn('Failed to award welcome PAWS:', pawsError);
      }
      
      // Generate JWT token
      const token = await this.generateToken(userId, email, name);
      
      // Create session
      await this.createSession(userId, token.token, {
        deviceInfo: { platform: 'web', version: '1.0.0' },
        ipAddress: 'unknown',
        userAgent: 'Rawgle Web App'
      });
      
      const user = {
        id: userId,
        email: email.toLowerCase(),
        name,
        platform: 'rawgle',
        location,
        phone,
        experience_level,
        subscription_tier: 'free',
        email_verified: false,
        profile_completed: false,
        onboarding_completed: false,
        privacy_settings: defaultPrivacySettings,
        preferences: defaultPreferences,
        paws_balance: 50, // Welcome bonus
        avatar_url: null,
        bio: null,
        created_at: now
      };
      
      return {
        user,
        token: token.token,
        refreshToken: token.refreshToken,
        expiresAt: token.expiresAt
      };
    } catch (error) {
      console.error('User registration error:', error);
      throw new Error('Failed to create user account');
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} options - Login options
   * @returns {Promise<Object>} User and token
   */
  async login(email, password, options = {}) {
    const { platform = 'rawgle', rememberMe = false, userAgent, ipAddress } = options;
    
    // Find user
    const user = await this.db
      .prepare(`
        SELECT id, email, password_hash, name, platform, subscription_tier,
               email_verified, profile_completed, onboarding_completed,
               privacy_settings, preferences, paws_balance, avatar_url, bio,
               created_at, last_login
        FROM users 
        WHERE email = ? AND platform = ? AND deleted_at IS NULL
      `)
      .bind(email.toLowerCase(), platform)
      .first();
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw new Error('Invalid credentials');
    }
    
    // Check if email is verified for certain actions
    // Allow login but restrict some features until verified
    
    // Generate token
    const tokenExpiry = rememberMe ? '30d' : '24h';
    const token = await this.generateToken(user.id, user.email, user.name, tokenExpiry);
    
    // Create session
    await this.createSession(user.id, token.token, {
      deviceInfo: { platform: 'web', version: '1.0.0' },
      ipAddress,
      userAgent
    });
    
    // Update last login
    await this.db
      .prepare('UPDATE users SET last_login = ? WHERE id = ?')
      .bind(new Date().toISOString(), user.id)
      .run();
    
    // Award daily login PAWS (with cooldown check)
    try {
      await this.awardDailyLoginPAWS(user.id);
    } catch (pawsError) {
      console.warn('Failed to award daily login PAWS:', pawsError);
    }
    
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      platform: user.platform,
      subscription_tier: user.subscription_tier,
      email_verified: user.email_verified,
      profile_completed: user.profile_completed,
      onboarding_completed: user.onboarding_completed,
      privacy_settings: JSON.parse(user.privacy_settings || '{}'),
      preferences: JSON.parse(user.preferences || '{}'),
      paws_balance: user.paws_balance,
      avatar_url: user.avatar_url,
      bio: user.bio,
      created_at: user.created_at,
      last_login: user.last_login
    };
    
    return {
      user: userResponse,
      token: token.token,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresAt
    };
  }

  /**
   * Logout user
   * @param {string} token - JWT token to invalidate
   * @param {string} userId - User ID
   */
  async logout(token, userId) {
    try {
      // Add token to blacklist
      const decoded = jwt.decode(token);
      const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);
      const ttl = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      
      if (ttl > 0) {
        await this.kv.put(`blacklist:${token}`, 'true', { expirationTtl: ttl });
      }
      
      // Deactivate session
      await this.db
        .prepare('UPDATE user_sessions SET active = FALSE WHERE session_token = ?')
        .bind(token)
        .run();
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile(userId) {
    const user = await this.db
      .prepare(`
        SELECT id, email, name, location, phone, experience_level, subscription_tier,
               subscription_expires, email_verified, profile_completed, onboarding_completed,
               privacy_settings, preferences, paws_balance, paws_lifetime_earned,
               paws_lifetime_spent, avatar_url, bio, social_links, created_at, last_login
        FROM users 
        WHERE id = ? AND deleted_at IS NULL
      `)
      .bind(userId)
      .first();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      location: user.location,
      phone: user.phone,
      experience_level: user.experience_level,
      subscription_tier: user.subscription_tier,
      subscription_expires: user.subscription_expires,
      email_verified: user.email_verified,
      profile_completed: user.profile_completed,
      onboarding_completed: user.onboarding_completed,
      privacy_settings: JSON.parse(user.privacy_settings || '{}'),
      preferences: JSON.parse(user.preferences || '{}'),
      paws_balance: user.paws_balance,
      paws_lifetime_earned: user.paws_lifetime_earned,
      paws_lifetime_spent: user.paws_lifetime_spent,
      avatar_url: user.avatar_url,
      bio: user.bio,
      social_links: JSON.parse(user.social_links || '{}'),
      created_at: user.created_at,
      last_login: user.last_login
    };
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(userId, updates) {
    const allowedFields = [
      'name', 'location', 'phone', 'bio', 'experience_level',
      'privacy_settings', 'preferences', 'social_links'
    ];
    
    const validUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        validUpdates[key] = value;
      }
    }
    
    if (Object.keys(validUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    for (const [key, value] of Object.entries(validUpdates)) {
      if (['privacy_settings', 'preferences', 'social_links'].includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(JSON.stringify(value));
      } else {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }
    
    updateFields.push('updated_at = ?');
    updateValues.push(new Date().toISOString());
    updateValues.push(userId);
    
    // Check if profile completion should be updated
    let profileCompleted = false;
    if (validUpdates.name || validUpdates.location || validUpdates.experience_level) {
      const currentUser = await this.db
        .prepare('SELECT name, location, experience_level FROM users WHERE id = ?')
        .bind(userId)
        .first();
      
      if (currentUser) {
        const finalName = validUpdates.name || currentUser.name;
        const finalLocation = validUpdates.location || currentUser.location;
        const finalExperience = validUpdates.experience_level || currentUser.experience_level;
        
        profileCompleted = !!(finalName && finalLocation && finalExperience);
      }
    }
    
    if (profileCompleted) {
      updateFields.push('profile_completed = ?');
      updateValues[updateValues.length - 1] = true; // Replace the last element before userId
      updateValues.push(new Date().toISOString()); // Add new updated_at
      updateValues.push(userId); // Add userId at the end
    }
    
    await this.db
      .prepare(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`)
      .bind(...updateValues)
      .run();
    
    // Award PAWS for completing profile
    if (profileCompleted) {
      try {
        const PAWSService = (await import('./paws-service.js')).PAWSService;
        const pawsService = new PAWSService(this.db, this.kv);
        await pawsService.awardTokens(userId, 50, 'profile_completed');
      } catch (pawsError) {
        console.warn('Failed to award profile completion PAWS:', pawsError);
      }
    }
    
    return await this.getUserProfile(userId);
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Get current password hash
    const user = await this.db
      .prepare('SELECT password_hash FROM users WHERE id = ? AND deleted_at IS NULL')
      .bind(userId)
      .first();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      throw new Error('Current password is incorrect');
    }
    
    // Validate new password
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters');
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      throw new Error('New password must contain at least one lowercase letter, one uppercase letter, and one number');
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await this.db
      .prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .bind(newPasswordHash, new Date().toISOString(), userId)
      .run();
    
    // Invalidate all existing sessions for this user
    await this.db
      .prepare('UPDATE user_sessions SET active = FALSE WHERE user_id = ?')
      .bind(userId)
      .run();
  }

  /**
   * Generate JWT token
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} expiresIn - Token expiration
   * @returns {Promise<Object>} Token data
   */
  async generateToken(userId, email, name, expiresIn = '24h') {
    const secret = 'rawgle-jwt-secret-change-in-production'; // Should be from environment
    
    const payload = {
      userId,
      email,
      name,
      platform: 'rawgle',
      iat: Math.floor(Date.now() / 1000)
    };
    
    const token = jwt.sign(payload, secret, { expiresIn });
    const refreshToken = nanoid(32);
    
    // Calculate expiration time
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000).toISOString();
    
    // Store refresh token
    await this.kv.put(
      `refresh_token:${refreshToken}`,
      JSON.stringify({ userId, email, name }),
      { expirationTtl: 30 * 24 * 60 * 60 } // 30 days
    );
    
    return {
      token,
      refreshToken,
      expiresAt
    };
  }

  /**
   * Create user session
   * @param {string} userId - User ID
   * @param {string} token - Session token
   * @param {Object} sessionData - Session metadata
   */
  async createSession(userId, token, sessionData = {}) {
    const sessionId = nanoid(21);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    
    await this.db
      .prepare(`
        INSERT INTO user_sessions (
          id, user_id, session_token, device_info, ip_address, user_agent,
          expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        sessionId, userId, token,
        JSON.stringify(sessionData.deviceInfo || {}),
        sessionData.ipAddress || 'unknown',
        sessionData.userAgent || 'unknown',
        expiresAt, new Date().toISOString()
      )
      .run();
  }

  /**
   * Award welcome PAWS tokens
   * @param {string} userId - User ID
   */
  async awardWelcomePAWS(userId) {
    try {
      const PAWSService = (await import('./paws-service.js')).PAWSService;
      const pawsService = new PAWSService(this.db, this.kv);
      await pawsService.awardTokens(userId, 50, 'welcome_bonus', { type: 'new_user_registration' });
    } catch (error) {
      console.warn('Failed to award welcome PAWS:', error);
    }
  }

  /**
   * Award daily login PAWS (with cooldown)
   * @param {string} userId - User ID
   */
  async awardDailyLoginPAWS(userId) {
    try {
      // Check if user already got daily login bonus today
      const today = new Date().toISOString().split('T')[0];
      const loginBonusKey = `daily_login:${userId}:${today}`;
      
      const alreadyAwarded = await this.kv.get(loginBonusKey);
      if (alreadyAwarded) {
        return; // Already awarded today
      }
      
      const PAWSService = (await import('./paws-service.js')).PAWSService;
      const pawsService = new PAWSService(this.db, this.kv);
      await pawsService.awardTokens(userId, 5, 'daily_login');
      
      // Set cooldown until tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const ttl = Math.floor((tomorrow.getTime() - Date.now()) / 1000);
      
      await this.kv.put(loginBonusKey, 'true', { expirationTtl: ttl });
    } catch (error) {
      console.warn('Failed to award daily login PAWS:', error);
    }
  }

  /**
   * Send verification email
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {string} name - User name
   */
  async sendVerificationEmail(userId, email, name) {
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    
    // Store verification token
    const tokenId = nanoid(21);
    await this.db
      .prepare(`
        INSERT INTO email_verification_tokens (id, user_id, token, email, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(tokenId, userId, token, email, expiresAt, new Date().toISOString())
      .run();
    
    // TODO: Send actual email using email service
    console.log(`Verification email would be sent to ${email} with token: ${token}`);
  }

  /**
   * Verify email address
   * @param {string} token - Verification token
   */
  async verifyEmail(token) {
    const verification = await this.db
      .prepare(`
        SELECT user_id, email FROM email_verification_tokens 
        WHERE token = ? AND expires_at > ? AND used = FALSE
      `)
      .bind(token, new Date().toISOString())
      .first();
    
    if (!verification) {
      throw new Error('Invalid or expired verification token');
    }
    
    // Mark email as verified
    await this.db
      .prepare('UPDATE users SET email_verified = TRUE, updated_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), verification.user_id)
      .run();
    
    // Mark token as used
    await this.db
      .prepare('UPDATE email_verification_tokens SET used = TRUE WHERE token = ?')
      .bind(token)
      .run();
    
    // Award PAWS for email verification
    try {
      const PAWSService = (await import('./paws-service.js')).PAWSService;
      const pawsService = new PAWSService(this.db, this.kv);
      await pawsService.awardTokens(verification.user_id, 25, 'email_verified');
    } catch (pawsError) {
      console.warn('Failed to award email verification PAWS:', pawsError);
    }
  }

  /**
   * Delete user account
   * @param {string} userId - User ID
   */
  async deleteAccount(userId) {
    // Soft delete - mark as deleted but keep data for potential recovery
    await this.db
      .prepare('UPDATE users SET deleted_at = ?, updated_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), new Date().toISOString(), userId)
      .run();
    
    // Deactivate all sessions
    await this.db
      .prepare('UPDATE user_sessions SET active = FALSE WHERE user_id = ?')
      .bind(userId)
      .run();
    
    // TODO: Notify about account deletion, handle data retention policies
  }
}