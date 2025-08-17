// Comprehensive User Service Tests
// Tests user management functionality for both platforms

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserService } from '../src/services/user-service.js';
import { AuthService } from '../src/services/auth-service.js';
import { TestDatabase } from './helpers/test-database.js';
import { TestKV } from './helpers/test-kv.js';

describe('UserService - Comprehensive Tests', () => {
  let userService;
  let authService;
  let testDb;
  let testKv;
  let testUser;

  beforeEach(async () => {
    testDb = new TestDatabase();
    testKv = new TestKV();
    await testDb.setup();
    
    userService = new UserService(testDb.db, testKv);
    authService = new AuthService(testDb.db, testKv);

    // Create a test user for most tests
    const registerResult = await authService.register({
      email: 'testuser@example.com',
      password: 'TestPass123!',
      name: 'Test User',
      location: 'California, USA'
    }, 'rawgle');
    
    testUser = registerResult.user;
  });

  afterEach(async () => {
    await testDb.cleanup();
    await testKv.cleanup();
  });

  describe('Get User Profile - Positive Test Cases', () => {
    it('should retrieve complete user profile for self', async () => {
      const profile = await userService.getUserProfile(testUser.id, testUser.id);

      expect(profile).toBeDefined();
      expect(profile.id).toBe(testUser.id);
      expect(profile.email).toBe(testUser.email);
      expect(profile.name).toBe(testUser.name);
      expect(profile.platform).toBe('rawgle');
      expect(profile.subscriptionTier).toBe('free');
      expect(profile.emailVerified).toBe(false);
      expect(profile.socialLinks).toEqual({});
      expect(profile.preferences).toEqual({});
      expect(profile.privacySettings).toEqual({});
    });

    it('should apply privacy filters when viewing others profile', async () => {
      // Create second user
      const otherUser = await authService.register({
        email: 'other@example.com',
        password: 'OtherPass123!',
        name: 'Other User'
      }, 'gohunta');

      // Set privacy settings to hide email and phone
      await userService.updatePrivacySettings(testUser.id, {
        hideEmail: true,
        hidePhone: true
      });

      const profile = await userService.getUserProfile(testUser.id, otherUser.user.id);

      expect(profile.email).toBeNull();
      expect(profile.lastLogin).toBeNull();
      expect(profile.name).toBe(testUser.name); // Name should still be visible
    });

    it('should handle user with complete profile data', async () => {
      // Update user with complete data
      await userService.updateProfile(testUser.id, {
        bio: 'Test bio',
        social_links: { twitter: '@testuser' },
        preferences: { theme: 'dark' }
      });

      const profile = await userService.getUserProfile(testUser.id, testUser.id);

      expect(profile.bio).toBe('Test bio');
      expect(profile.socialLinks.twitter).toBe('@testuser');
      expect(profile.preferences.theme).toBe('dark');
    });
  });

  describe('Get User Profile - Negative Test Cases', () => {
    it('should throw error for missing user ID', async () => {
      await expect(userService.getUserProfile(null))
        .rejects.toThrow('User ID is required');
    });

    it('should throw error for non-existent user', async () => {
      await expect(userService.getUserProfile('non-existent-id'))
        .rejects.toThrow('User not found');
    });

    it('should handle deleted user gracefully', async () => {
      // Soft delete the user
      await userService.deleteAccount(testUser.id);

      await expect(userService.getUserProfile(testUser.id))
        .rejects.toThrow('User not found');
    });
  });

  describe('Update Profile - Positive Test Cases', () => {
    it('should update basic profile information', async () => {
      const updates = {
        name: 'Updated Name',
        location: 'Montana, USA',
        bio: 'Updated bio'
      };

      const updatedProfile = await userService.updateProfile(testUser.id, updates);

      expect(updatedProfile.name).toBe('Updated Name');
      expect(updatedProfile.location).toBe('Montana, USA');
      expect(updatedProfile.bio).toBe('Updated bio');
    });

    it('should update social links', async () => {
      const updates = {
        social_links: {
          twitter: '@updated',
          instagram: '@updated_ig'
        }
      };

      const updatedProfile = await userService.updateProfile(testUser.id, updates);

      expect(updatedProfile.socialLinks.twitter).toBe('@updated');
      expect(updatedProfile.socialLinks.instagram).toBe('@updated_ig');
    });

    it('should update preferences', async () => {
      const updates = {
        preferences: {
          theme: 'dark',
          notifications: true,
          language: 'en'
        }
      };

      const updatedProfile = await userService.updateProfile(testUser.id, updates);

      expect(updatedProfile.preferences.theme).toBe('dark');
      expect(updatedProfile.preferences.notifications).toBe(true);
      expect(updatedProfile.preferences.language).toBe('en');
    });

    it('should update profile completion status', async () => {
      // Initially profile should not be complete
      let profile = await userService.getUserProfile(testUser.id, testUser.id);
      expect(profile.profileCompleted).toBe(false);

      // Update with required fields
      await userService.updateProfile(testUser.id, {
        name: 'Complete User',
        location: 'Complete Location'
      });

      profile = await userService.getUserProfile(testUser.id, testUser.id);
      expect(profile.profileCompleted).toBe(true);
    });

    it('should validate and accept valid phone number', async () => {
      const updates = {
        phone: '+1-555-123-4567'
      };

      const updatedProfile = await userService.updateProfile(testUser.id, updates);
      expect(updatedProfile.phone).toBe('+1-555-123-4567');
    });

    it('should ignore non-allowed fields', async () => {
      const updates = {
        name: 'Valid Update',
        email: 'hacker@evil.com', // Not allowed
        password: 'newpass123', // Not allowed
        id: 'new-id' // Not allowed
      };

      const updatedProfile = await userService.updateProfile(testUser.id, updates);

      expect(updatedProfile.name).toBe('Valid Update');
      expect(updatedProfile.email).toBe(testUser.email); // Unchanged
    });
  });

  describe('Update Profile - Negative Test Cases', () => {
    it('should reject update with missing user ID', async () => {
      await expect(userService.updateProfile(null, { name: 'Test' }))
        .rejects.toThrow('User ID is required');
    });

    it('should reject update for non-existent user', async () => {
      await expect(userService.updateProfile('non-existent', { name: 'Test' }))
        .rejects.toThrow('User not found');
    });

    it('should reject name that is too short', async () => {
      await expect(userService.updateProfile(testUser.id, { name: 'A' }))
        .rejects.toThrow('Name must be between 2 and 100 characters');
    });

    it('should reject name that is too long', async () => {
      const longName = 'A'.repeat(101);
      await expect(userService.updateProfile(testUser.id, { name: longName }))
        .rejects.toThrow('Name must be between 2 and 100 characters');
    });

    it('should reject bio that is too long', async () => {
      const longBio = 'A'.repeat(501);
      await expect(userService.updateProfile(testUser.id, { bio: longBio }))
        .rejects.toThrow('Bio must be 500 characters or less');
    });

    it('should reject invalid phone number', async () => {
      await expect(userService.updateProfile(testUser.id, { phone: 'not-a-phone' }))
        .rejects.toThrow('Invalid phone number format');
    });

    it('should reject empty updates', async () => {
      await expect(userService.updateProfile(testUser.id, {}))
        .rejects.toThrow('No valid fields to update');

      await expect(userService.updateProfile(testUser.id, { invalidField: 'value' }))
        .rejects.toThrow('No valid fields to update');
    });
  });

  describe('Avatar Management - Positive Test Cases', () => {
    it('should upload avatar successfully', async () => {
      const mockFile = {
        size: 1024 * 1024, // 1MB
        name: 'avatar.jpg'
      };

      const result = await userService.uploadAvatar(testUser.id, mockFile, 'image/jpeg');

      expect(result.avatarUrl).toBeDefined();
      expect(result.avatarUrl).toContain(testUser.id);
      expect(result.uploadedAt).toBeDefined();
    });

    it('should handle multiple image formats', async () => {
      const formats = [
        { file: { size: 1024 }, type: 'image/jpeg', ext: 'jpg' },
        { file: { size: 2048 }, type: 'image/png', ext: 'png' },
        { file: { size: 3072 }, type: 'image/webp', ext: 'webp' }
      ];

      for (const format of formats) {
        const result = await userService.uploadAvatar(testUser.id, format.file, format.type);
        expect(result.avatarUrl).toContain(format.ext);
      }
    });

    it('should delete avatar successfully', async () => {
      // First upload an avatar
      const mockFile = { size: 1024, name: 'avatar.jpg' };
      await userService.uploadAvatar(testUser.id, mockFile, 'image/jpeg');

      // Then delete it
      await userService.deleteAvatar(testUser.id);

      // Verify it was removed from user profile
      const profile = await userService.getUserProfile(testUser.id, testUser.id);
      expect(profile.avatarUrl).toBeNull();
    });
  });

  describe('Avatar Management - Negative Test Cases', () => {
    it('should reject upload without user ID', async () => {
      const mockFile = { size: 1024 };
      await expect(userService.uploadAvatar(null, mockFile, 'image/jpeg'))
        .rejects.toThrow('User ID is required');
    });

    it('should reject upload without file', async () => {
      await expect(userService.uploadAvatar(testUser.id, null, 'image/jpeg'))
        .rejects.toThrow('Image file is required');
    });

    it('should reject unsupported file types', async () => {
      const mockFile = { size: 1024 };
      await expect(userService.uploadAvatar(testUser.id, mockFile, 'image/gif'))
        .rejects.toThrow('Invalid image format');
    });

    it('should reject files that are too large', async () => {
      const largeFile = { size: 6 * 1024 * 1024 }; // 6MB
      await expect(userService.uploadAvatar(testUser.id, largeFile, 'image/jpeg'))
        .rejects.toThrow('Image file too large');
    });

    it('should reject upload for non-existent user', async () => {
      const mockFile = { size: 1024 };
      await expect(userService.uploadAvatar('non-existent', mockFile, 'image/jpeg'))
        .rejects.toThrow('User not found');
    });
  });

  describe('Preferences Management - Positive Test Cases', () => {
    it('should update user preferences', async () => {
      const preferences = {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: true,
          push: false
        }
      };

      const result = await userService.updatePreferences(testUser.id, preferences);

      expect(result.theme).toBe('dark');
      expect(result.language).toBe('en');
      expect(result.notifications.email).toBe(true);
      expect(result.notifications.push).toBe(false);
    });

    it('should merge with existing preferences', async () => {
      // Set initial preferences
      await userService.updatePreferences(testUser.id, {
        theme: 'light',
        language: 'en'
      });

      // Update with partial preferences
      const result = await userService.updatePreferences(testUser.id, {
        notifications: { email: true }
      });

      expect(result.theme).toBe('light'); // Should be preserved
      expect(result.language).toBe('en'); // Should be preserved
      expect(result.notifications.email).toBe(true); // Should be added
    });
  });

  describe('Preferences Management - Negative Test Cases', () => {
    it('should reject invalid user ID', async () => {
      await expect(userService.updatePreferences(null, { theme: 'dark' }))
        .rejects.toThrow('User ID is required');
    });

    it('should reject invalid preferences object', async () => {
      await expect(userService.updatePreferences(testUser.id, null))
        .rejects.toThrow('Valid preferences object is required');

      await expect(userService.updatePreferences(testUser.id, 'not-an-object'))
        .rejects.toThrow('Valid preferences object is required');
    });

    it('should reject for non-existent user', async () => {
      await expect(userService.updatePreferences('non-existent', { theme: 'dark' }))
        .rejects.toThrow('User not found');
    });
  });

  describe('Privacy Settings - Positive Test Cases', () => {
    it('should update privacy settings', async () => {
      const privacySettings = {
        hideEmail: true,
        hidePhone: false,
        publicProfile: true,
        allowMessages: false
      };

      const result = await userService.updatePrivacySettings(testUser.id, privacySettings);

      expect(result.hideEmail).toBe(true);
      expect(result.hidePhone).toBe(false);
      expect(result.publicProfile).toBe(true);
      expect(result.allowMessages).toBe(false);
    });

    it('should merge with existing privacy settings', async () => {
      // Set initial settings
      await userService.updatePrivacySettings(testUser.id, {
        hideEmail: true,
        publicProfile: true
      });

      // Update partial settings
      const result = await userService.updatePrivacySettings(testUser.id, {
        hidePhone: true
      });

      expect(result.hideEmail).toBe(true); // Preserved
      expect(result.publicProfile).toBe(true); // Preserved
      expect(result.hidePhone).toBe(true); // Added
    });
  });

  describe('Privacy Settings - Negative Test Cases', () => {
    it('should reject invalid privacy setting types', async () => {
      await expect(userService.updatePrivacySettings(testUser.id, {
        hideEmail: 'not-boolean'
      })).rejects.toThrow('hideEmail must be a boolean');
    });

    it('should reject invalid user ID', async () => {
      await expect(userService.updatePrivacySettings(null, { hideEmail: true }))
        .rejects.toThrow('User ID is required');
    });

    it('should reject invalid settings object', async () => {
      await expect(userService.updatePrivacySettings(testUser.id, null))
        .rejects.toThrow('Valid privacy settings object is required');
    });
  });

  describe('Subscription Management - Positive Test Cases', () => {
    it('should update subscription tier', async () => {
      const result = await userService.updateSubscription(testUser.id, 'premium');

      expect(result.subscriptionTier).toBe('premium');
      expect(result.subscriptionExpires).toBeNull();
      expect(result.updatedAt).toBeDefined();
    });

    it('should update subscription with expiration', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const result = await userService.updateSubscription(testUser.id, 'pro', expiresAt);

      expect(result.subscriptionTier).toBe('pro');
      expect(result.subscriptionExpires).toBe(expiresAt.toISOString());
    });

    it('should handle all valid subscription tiers', async () => {
      const tiers = ['free', 'premium', 'pro', 'business'];

      for (const tier of tiers) {
        const result = await userService.updateSubscription(testUser.id, tier);
        expect(result.subscriptionTier).toBe(tier);
      }
    });
  });

  describe('Subscription Management - Negative Test Cases', () => {
    it('should reject invalid subscription tier', async () => {
      await expect(userService.updateSubscription(testUser.id, 'invalid-tier'))
        .rejects.toThrow('Invalid subscription tier');
    });

    it('should reject missing user ID', async () => {
      await expect(userService.updateSubscription(null, 'premium'))
        .rejects.toThrow('User ID is required');
    });

    it('should reject for non-existent user', async () => {
      await expect(userService.updateSubscription('non-existent', 'premium'))
        .rejects.toThrow('User not found');
    });
  });

  describe('User Search - Positive Test Cases', () => {
    beforeEach(async () => {
      // Create additional users for search testing
      await authService.register({
        email: 'hunter1@example.com',
        password: 'Hunt123!',
        name: 'John Hunter',
        location: 'Montana, USA'
      }, 'gohunta');

      await authService.register({
        email: 'feeder1@example.com',
        password: 'Feed123!',
        name: 'Jane Feeder',
        location: 'California, USA'
      }, 'rawgle');
    });

    it('should search users by name', async () => {
      const results = await userService.searchUsers({ name: 'John' });

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('John');
    });

    it('should search users by location', async () => {
      const results = await userService.searchUsers({ location: 'Montana' });

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].location).toContain('Montana');
    });

    it('should search users by platform', async () => {
      const results = await userService.searchUsers({ platform: 'gohunta' });

      expect(results).toBeDefined();
      // Should include users with 'gohunta' or 'both' platforms
    });

    it('should respect search limit', async () => {
      const results = await userService.searchUsers({}, { limit: 1 });

      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('should apply privacy filters in search results', async () => {
      // Set privacy settings for a user
      await userService.updatePrivacySettings(testUser.id, {
        hideLocation: true
      });

      const results = await userService.searchUsers({ name: 'Test' });
      const userResult = results.find(u => u.id === testUser.id);

      if (userResult) {
        expect(userResult.location).toBeNull();
      }
    });
  });

  describe('User Search - Negative Test Cases', () => {
    it('should reject excessive limit', async () => {
      await expect(userService.searchUsers({}, { limit: 200 }))
        .rejects.toThrow('Limit cannot exceed 100');
    });

    it('should handle search with no results gracefully', async () => {
      const results = await userService.searchUsers({ name: 'NonExistentUser12345' });
      expect(results).toBeDefined();
      expect(results.length).toBe(0);
    });
  });

  describe('Account Deletion - Positive Test Cases', () => {
    it('should soft delete user account', async () => {
      await userService.deleteAccount(testUser.id, 'user_requested');

      // User should no longer be found
      await expect(userService.getUserProfile(testUser.id))
        .rejects.toThrow('User not found');
    });

    it('should handle deletion with custom reason', async () => {
      await userService.deleteAccount(testUser.id, 'policy_violation');

      // Verify deletion was logged (check KV store)
      const logKeys = await testKv.list({ prefix: 'user_action:' });
      expect(logKeys.keys.length).toBeGreaterThan(0);
    });
  });

  describe('Account Deletion - Negative Test Cases', () => {
    it('should reject deletion without user ID', async () => {
      await expect(userService.deleteAccount(null))
        .rejects.toThrow('User ID is required');
    });

    it('should reject deletion for non-existent user', async () => {
      await expect(userService.deleteAccount('non-existent'))
        .rejects.toThrow('User not found');
    });
  });

  describe('User Statistics - Positive Test Cases', () => {
    it('should retrieve user statistics', async () => {
      const stats = await userService.getUserStats(testUser.id);

      expect(stats).toBeDefined();
      expect(stats.petsCount).toBeDefined();
      expect(stats.postsCount).toBeDefined();
      expect(typeof stats.petsCount).toBe('number');
      expect(typeof stats.postsCount).toBe('number');
    });

    it('should return zero counts for new user', async () => {
      const stats = await userService.getUserStats(testUser.id);

      expect(stats.petsCount).toBe(0);
      expect(stats.postsCount).toBe(0);
    });
  });

  describe('User Statistics - Negative Test Cases', () => {
    it('should reject stats request without user ID', async () => {
      await expect(userService.getUserStats(null))
        .rejects.toThrow('User ID is required');
    });

    it('should reject stats for non-existent user', async () => {
      await expect(userService.getUserStats('non-existent'))
        .rejects.toThrow('User not found');
    });
  });

  describe('Helper Methods Tests', () => {
    it('should validate profile completion correctly', async () => {
      const incompleteUser = {
        name: 'Test',
        location: '' // Missing location
      };
      expect(userService.checkProfileCompletion(incompleteUser)).toBe(false);

      const completeUser = {
        name: 'Test User',
        location: 'Test Location'
      };
      expect(userService.checkProfileCompletion(completeUser)).toBe(true);
    });

    it('should validate phone numbers correctly', async () => {
      expect(userService.isValidPhone('+1234567890')).toBe(true);
      expect(userService.isValidPhone('+1-555-123-4567')).toBe(true);
      expect(userService.isValidPhone('555 123 4567')).toBe(true);
      
      expect(userService.isValidPhone('not-a-phone')).toBe(false);
      expect(userService.isValidPhone('123')).toBe(false);
      expect(userService.isValidPhone('')).toBe(false);
    });

    it('should get correct file extensions', async () => {
      expect(userService.getFileExtension('image/jpeg')).toBe('jpg');
      expect(userService.getFileExtension('image/png')).toBe('png');
      expect(userService.getFileExtension('image/webp')).toBe('webp');
      expect(userService.getFileExtension('unknown')).toBe('jpg'); // Default
    });

    it('should apply privacy settings correctly', async () => {
      expect(userService.shouldHideEmail({ hideEmail: true })).toBe(true);
      expect(userService.shouldHideEmail({ hideEmail: false })).toBe(false);
      expect(userService.shouldHideEmail({})).toBe(false);

      expect(userService.shouldHidePhone({ hidePhone: true })).toBe(true);
      expect(userService.shouldHideLocation({ hideLocation: true })).toBe(true);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle database errors gracefully', async () => {
      const invalidUserService = new UserService(null, testKv);

      await expect(invalidUserService.getUserProfile('test-id'))
        .rejects.toThrow();
    });

    it('should handle KV errors gracefully', async () => {
      const invalidUserService = new UserService(testDb.db, null);

      // Most operations should still work, but logging might fail silently
      const profile = await invalidUserService.getUserProfile(testUser.id, testUser.id);
      expect(profile).toBeDefined();
    });

    it('should not throw errors for failed action logging', async () => {
      // Action logging failures should not break the main functionality
      const mockUserService = new UserService(testDb.db, testKv);
      
      // Mock KV to fail
      const restore = testKv.simulateError('put', new Error('KV Error'));
      
      try {
        // This should still work despite KV error
        const result = await mockUserService.updateProfile(testUser.id, {
          name: 'New Name'
        });
        expect(result.name).toBe('New Name');
      } finally {
        restore();
      }
    });
  });
});