// User Service
// Comprehensive user management for both Rawgle and GoHunta platforms

export class UserService {
  constructor(db, kv, r2 = null) {
    this.db = db;
    this.kv = kv;
    this.r2 = r2; // For avatar uploads
  }

  /**
   * Get user profile by ID
   * @param {string} userId 
   * @param {string} requestingUserId - For privacy checks
   * @returns {Promise<Object>}
   */
  async getUserProfile(userId, requestingUserId = null) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const user = await this.db
        .prepare(`
          SELECT id, email, name, platform, location, phone, experience_level,
                 subscription_tier, subscription_expires, email_verified,
                 profile_completed, onboarding_completed, avatar_url, bio,
                 social_links, preferences, privacy_settings,
                 created_at, last_login
          FROM users 
          WHERE id = ? AND deleted_at IS NULL
        `)
        .bind(userId)
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      // Parse JSON fields
      const profile = {
        id: user.id,
        email: user.email,
        name: user.name,
        platform: user.platform,
        location: user.location,
        phone: user.phone,
        experienceLevel: user.experience_level,
        subscriptionTier: user.subscription_tier,
        subscriptionExpires: user.subscription_expires,
        emailVerified: Boolean(user.email_verified),
        profileCompleted: Boolean(user.profile_completed),
        onboardingCompleted: Boolean(user.onboarding_completed),
        avatarUrl: user.avatar_url,
        bio: user.bio,
        socialLinks: user.social_links ? JSON.parse(user.social_links) : {},
        preferences: user.preferences ? JSON.parse(user.preferences) : {},
        privacySettings: user.privacy_settings ? JSON.parse(user.privacy_settings) : {},
        createdAt: user.created_at,
        lastLogin: user.last_login
      };

      // Apply privacy filters if not self-viewing
      if (requestingUserId !== userId) {
        profile.email = this.shouldHideEmail(profile.privacySettings) ? null : profile.email;
        profile.phone = this.shouldHidePhone(profile.privacySettings) ? null : profile.phone;
        profile.location = this.shouldHideLocation(profile.privacySettings) ? null : profile.location;
        profile.lastLogin = null; // Never expose last login to others
      }

      return profile;
    } catch (error) {
      if (error.message === 'User not found') {
        throw error;
      }
      console.error('Get user profile error:', error);
      throw new Error('Failed to retrieve user profile');
    }
  }

  /**
   * Update user profile
   * @param {string} userId 
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  async updateProfile(userId, updates) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Validate updates
    const allowedFields = [
      'name', 'location', 'phone', 'bio', 'experience_level',
      'social_links', 'preferences', 'privacy_settings'
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

    // Validate specific fields
    if (validUpdates.name && (validUpdates.name.length < 2 || validUpdates.name.length > 100)) {
      throw new Error('Name must be between 2 and 100 characters');
    }

    if (validUpdates.bio && validUpdates.bio.length > 500) {
      throw new Error('Bio must be 500 characters or less');
    }

    if (validUpdates.phone && !this.isValidPhone(validUpdates.phone)) {
      throw new Error('Invalid phone number format');
    }

    try {
      // Check if user exists
      const existingUser = await this.db
        .prepare('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL')
        .bind(userId)
        .first();

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];

      for (const [key, value] of Object.entries(validUpdates)) {
        if (['social_links', 'preferences', 'privacy_settings'].includes(key)) {
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

      await this.db
        .prepare(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`)
        .bind(...updateValues)
        .run();

      // Check if profile is now completed
      const updatedUser = await this.getUserProfile(userId, userId);
      const profileCompleted = this.checkProfileCompletion(updatedUser);

      if (profileCompleted !== updatedUser.profileCompleted) {
        await this.db
          .prepare('UPDATE users SET profile_completed = ? WHERE id = ?')
          .bind(profileCompleted ? 1 : 0, userId)
          .run();
        updatedUser.profileCompleted = profileCompleted;
      }

      return updatedUser;
    } catch (error) {
      if (error.message === 'User not found' || error.message.includes('must be')) {
        throw error;
      }
      console.error('Update profile error:', error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Upload user avatar
   * @param {string} userId 
   * @param {File|Buffer} imageFile 
   * @param {string} contentType 
   * @returns {Promise<Object>}
   */
  async uploadAvatar(userId, imageFile, contentType) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!imageFile) {
      throw new Error('Image file is required');
    }

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      throw new Error('Invalid image format. Allowed: JPEG, PNG, WEBP');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (imageFile.size && imageFile.size > maxSize) {
      throw new Error('Image file too large. Maximum size: 5MB');
    }

    try {
      // Check if user exists
      const user = await this.db
        .prepare('SELECT id, avatar_url FROM users WHERE id = ? AND deleted_at IS NULL')
        .bind(userId)
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      let avatarUrl = null;

      // Upload to R2 if available
      if (this.r2) {
        const fileName = `avatars/${userId}/${Date.now()}.${this.getFileExtension(contentType)}`;
        
        await this.r2.put(fileName, imageFile, {
          httpMetadata: {
            contentType: contentType
          }
        });

        avatarUrl = `https://your-r2-domain.com/${fileName}`;
      } else {
        // For testing, create a mock URL
        avatarUrl = `mock://avatar/${userId}.${this.getFileExtension(contentType)}`;
      }

      // Update user avatar URL
      await this.db
        .prepare('UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?')
        .bind(avatarUrl, new Date().toISOString(), userId)
        .run();

      // Delete old avatar if exists and R2 is available
      if (user.avatar_url && this.r2 && user.avatar_url.includes('avatars/')) {
        try {
          const oldFileName = user.avatar_url.split('/').pop();
          await this.r2.delete(`avatars/${userId}/${oldFileName}`);
        } catch (error) {
          console.warn('Failed to delete old avatar:', error);
        }
      }

      return {
        avatarUrl,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      if (error.message === 'User not found' || error.message.includes('Invalid image')) {
        throw error;
      }
      console.error('Upload avatar error:', error);
      throw new Error('Failed to upload avatar');
    }
  }

  /**
   * Delete user avatar
   * @param {string} userId 
   * @returns {Promise<void>}
   */
  async deleteAvatar(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const user = await this.db
        .prepare('SELECT avatar_url FROM users WHERE id = ? AND deleted_at IS NULL')
        .bind(userId)
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      // Delete from R2 if exists
      if (user.avatar_url && this.r2 && user.avatar_url.includes('avatars/')) {
        try {
          const fileName = user.avatar_url.split('/').pop();
          await this.r2.delete(`avatars/${userId}/${fileName}`);
        } catch (error) {
          console.warn('Failed to delete avatar from R2:', error);
        }
      }

      // Update user record
      await this.db
        .prepare('UPDATE users SET avatar_url = NULL, updated_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), userId)
        .run();
    } catch (error) {
      if (error.message === 'User not found') {
        throw error;
      }
      console.error('Delete avatar error:', error);
      throw new Error('Failed to delete avatar');
    }
  }

  /**
   * Update user preferences
   * @param {string} userId 
   * @param {Object} preferences 
   * @returns {Promise<Object>}
   */
  async updatePreferences(userId, preferences) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!preferences || typeof preferences !== 'object') {
      throw new Error('Valid preferences object is required');
    }

    try {
      const user = await this.db
        .prepare('SELECT preferences FROM users WHERE id = ? AND deleted_at IS NULL')
        .bind(userId)
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      const currentPreferences = user.preferences ? JSON.parse(user.preferences) : {};
      const updatedPreferences = { ...currentPreferences, ...preferences };

      await this.db
        .prepare('UPDATE users SET preferences = ?, updated_at = ? WHERE id = ?')
        .bind(JSON.stringify(updatedPreferences), new Date().toISOString(), userId)
        .run();

      return updatedPreferences;
    } catch (error) {
      if (error.message === 'User not found') {
        throw error;
      }
      console.error('Update preferences error:', error);
      throw new Error('Failed to update preferences');
    }
  }

  /**
   * Update privacy settings
   * @param {string} userId 
   * @param {Object} privacySettings 
   * @returns {Promise<Object>}
   */
  async updatePrivacySettings(userId, privacySettings) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!privacySettings || typeof privacySettings !== 'object') {
      throw new Error('Valid privacy settings object is required');
    }

    // Validate privacy settings
    const allowedSettings = {
      hideEmail: 'boolean',
      hidePhone: 'boolean',
      hideLocation: 'boolean',
      publicProfile: 'boolean',
      allowMessages: 'boolean',
      showOnline: 'boolean'
    };

    for (const [key, value] of Object.entries(privacySettings)) {
      if (key in allowedSettings) {
        const expectedType = allowedSettings[key];
        if (typeof value !== expectedType) {
          throw new Error(`${key} must be a ${expectedType}`);
        }
      }
    }

    try {
      const user = await this.db
        .prepare('SELECT privacy_settings FROM users WHERE id = ? AND deleted_at IS NULL')
        .bind(userId)
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      const currentSettings = user.privacy_settings ? JSON.parse(user.privacy_settings) : {};
      const updatedSettings = { ...currentSettings, ...privacySettings };

      await this.db
        .prepare('UPDATE users SET privacy_settings = ?, updated_at = ? WHERE id = ?')
        .bind(JSON.stringify(updatedSettings), new Date().toISOString(), userId)
        .run();

      return updatedSettings;
    } catch (error) {
      if (error.message === 'User not found' || error.message.includes('must be a')) {
        throw error;
      }
      console.error('Update privacy settings error:', error);
      throw new Error('Failed to update privacy settings');
    }
  }

  /**
   * Manage subscription
   * @param {string} userId 
   * @param {string} tier 
   * @param {Date|null} expiresAt 
   * @returns {Promise<Object>}
   */
  async updateSubscription(userId, tier, expiresAt = null) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const validTiers = ['free', 'premium', 'pro', 'business'];
    if (!validTiers.includes(tier)) {
      throw new Error('Invalid subscription tier');
    }

    try {
      const user = await this.db
        .prepare('SELECT id, subscription_tier FROM users WHERE id = ? AND deleted_at IS NULL')
        .bind(userId)
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      const expiresAtString = expiresAt ? expiresAt.toISOString() : null;

      await this.db
        .prepare('UPDATE users SET subscription_tier = ?, subscription_expires = ?, updated_at = ? WHERE id = ?')
        .bind(tier, expiresAtString, new Date().toISOString(), userId)
        .run();

      // Log subscription change
      await this.logUserAction(userId, 'subscription_updated', {
        oldTier: user.subscription_tier,
        newTier: tier,
        expiresAt: expiresAtString
      });

      return {
        subscriptionTier: tier,
        subscriptionExpires: expiresAtString,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      if (error.message === 'User not found' || error.message === 'Invalid subscription tier') {
        throw error;
      }
      console.error('Update subscription error:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Search users
   * @param {Object} criteria 
   * @param {Object} options 
   * @returns {Promise<Array>}
   */
  async searchUsers(criteria, options = {}) {
    const { name, location, platform, experienceLevel } = criteria;
    const { limit = 20, offset = 0, requestingUserId } = options;

    if (limit > 100) {
      throw new Error('Limit cannot exceed 100');
    }

    try {
      let query = `
        SELECT id, name, location, experience_level, platform, avatar_url, bio,
               privacy_settings, created_at
        FROM users 
        WHERE deleted_at IS NULL
      `;
      const params = [];

      if (name) {
        query += ' AND name LIKE ?';
        params.push(`%${name}%`);
      }

      if (location) {
        query += ' AND location LIKE ?';
        params.push(`%${location}%`);
      }

      if (platform) {
        query += ' AND (platform = ? OR platform = "both")';
        params.push(platform);
      }

      if (experienceLevel) {
        query += ' AND experience_level = ?';
        params.push(experienceLevel);
      }

      // Only include users with public profiles
      query += ' AND JSON_EXTRACT(privacy_settings, "$.publicProfile") IS NOT FALSE';

      query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const users = await this.db
        .prepare(query)
        .bind(...params)
        .all();

      // Apply privacy filters
      return users.results.map(user => {
        const privacySettings = user.privacy_settings ? JSON.parse(user.privacy_settings) : {};
        
        return {
          id: user.id,
          name: user.name,
          location: this.shouldHideLocation(privacySettings) ? null : user.location,
          experienceLevel: user.experience_level,
          platform: user.platform,
          avatarUrl: user.avatar_url,
          bio: user.bio,
          createdAt: user.created_at
        };
      });
    } catch (error) {
      console.error('Search users error:', error);
      throw new Error('Failed to search users');
    }
  }

  /**
   * Soft delete user account
   * @param {string} userId 
   * @param {string} reason 
   * @returns {Promise<void>}
   */
  async deleteAccount(userId, reason = 'user_requested') {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const user = await this.db
        .prepare('SELECT email FROM users WHERE id = ? AND deleted_at IS NULL')
        .bind(userId)
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      // Soft delete user
      await this.db
        .prepare('UPDATE users SET deleted_at = ?, updated_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), new Date().toISOString(), userId)
        .run();

      // Log deletion
      await this.logUserAction(userId, 'account_deleted', { reason });

      // TODO: Schedule cleanup of related data (pets, posts, etc.)
      // This would be handled by a background job

    } catch (error) {
      if (error.message === 'User not found') {
        throw error;
      }
      console.error('Delete account error:', error);
      throw new Error('Failed to delete account');
    }
  }

  /**
   * Get user statistics
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async getUserStats(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const user = await this.db
        .prepare('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL')
        .bind(userId)
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      // Get pets count
      const petsResult = await this.db
        .prepare('SELECT COUNT(*) as count FROM pets WHERE user_id = ? AND active = 1')
        .bind(userId)
        .first();

      // Get posts count
      const postsResult = await this.db
        .prepare('SELECT COUNT(*) as count FROM community_posts WHERE user_id = ?')
        .bind(userId)
        .first();

      // TODO: Add more statistics based on platform
      // For Rawgle: feeding logs, PAWS tokens
      // For GoHunta: hunt logs, training sessions

      return {
        petsCount: petsResult?.count || 0,
        postsCount: postsResult?.count || 0,
        // Add more stats here
      };
    } catch (error) {
      if (error.message === 'User not found') {
        throw error;
      }
      console.error('Get user stats error:', error);
      throw new Error('Failed to get user statistics');
    }
  }

  // Helper methods

  /**
   * Check if profile is completed
   * @param {Object} user 
   * @returns {boolean}
   */
  checkProfileCompletion(user) {
    const requiredFields = ['name', 'location'];
    return requiredFields.every(field => user[field] && user[field].trim().length > 0);
  }

  /**
   * Validate phone number format
   * @param {string} phone 
   * @returns {boolean}
   */
  isValidPhone(phone) {
    // Basic phone validation - can be enhanced based on requirements
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Get file extension from content type
   * @param {string} contentType 
   * @returns {string}
   */
  getFileExtension(contentType) {
    const extensions = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    };
    return extensions[contentType] || 'jpg';
  }

  /**
   * Check if email should be hidden based on privacy settings
   * @param {Object} privacySettings 
   * @returns {boolean}
   */
  shouldHideEmail(privacySettings) {
    return privacySettings?.hideEmail === true;
  }

  /**
   * Check if phone should be hidden based on privacy settings
   * @param {Object} privacySettings 
   * @returns {boolean}
   */
  shouldHidePhone(privacySettings) {
    return privacySettings?.hidePhone === true;
  }

  /**
   * Check if location should be hidden based on privacy settings
   * @param {Object} privacySettings 
   * @returns {boolean}
   */
  shouldHideLocation(privacySettings) {
    return privacySettings?.hideLocation === true;
  }

  /**
   * Log user action for analytics
   * @param {string} userId 
   * @param {string} action 
   * @param {Object} details 
   * @returns {Promise<void>}
   */
  async logUserAction(userId, action, details = {}) {
    try {
      const logEntry = {
        userId,
        action,
        details,
        timestamp: new Date().toISOString()
      };

      // Store in KV for short-term access, or send to analytics service
      await this.kv.put(
        `user_action:${userId}:${Date.now()}`,
        JSON.stringify(logEntry),
        { expirationTtl: 24 * 60 * 60 } // 24 hours
      );
    } catch (error) {
      console.warn('Failed to log user action:', error);
      // Don't throw error for logging failures
    }
  }
}