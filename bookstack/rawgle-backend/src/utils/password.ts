import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config/env';
import { logger } from '../config/logger';

export class PasswordService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(plainPassword: string): Promise<string> {
    try {
      const saltRounds = config.BCRYPT_ROUNDS || 12;
      const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
      
      logger.debug('Password hashed successfully');
      return hashedPassword;
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare plain password with hashed password
   */
  static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      
      logger.debug('Password comparison completed', { match: isMatch });
      return isMatch;
    } catch (error) {
      logger.error('Error comparing password:', error);
      throw new Error('Failed to compare password');
    }
  }

  /**
   * Generate a secure random token for email verification, password reset, etc.
   */
  static generateSecureToken(): string {
    try {
      // Generate 32 bytes of random data and convert to hex
      const token = crypto.randomBytes(32).toString('hex');
      
      logger.debug('Secure token generated');
      return token;
    } catch (error) {
      logger.error('Error generating secure token:', error);
      throw new Error('Failed to generate secure token');
    }
  }

  /**
   * Generate a random password (useful for temporary passwords)
   */
  static generateRandomPassword(length: number = 12): string {
    try {
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      
      // Ensure at least one character from each category
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*';
      
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      password += symbols[Math.floor(Math.random() * symbols.length)];
      
      // Fill the rest with random characters
      for (let i = 4; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
      }
      
      // Shuffle the password
      password = password.split('').sort(() => Math.random() - 0.5).join('');
      
      logger.debug('Random password generated');
      return password;
    } catch (error) {
      logger.error('Error generating random password:', error);
      throw new Error('Failed to generate random password');
    }
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Check minimum length
    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    // Check for numbers
    if (!/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    // Check for special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Password should not contain repeated characters');
      score -= 1;
    }

    // Check for sequential characters
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)/i.test(password)) {
      feedback.push('Password should not contain sequential characters');
      score -= 1;
    }

    // Ensure minimum score
    score = Math.max(0, score);

    const isValid = password.length >= 8 && 
                   /[A-Z]/.test(password) && 
                   /[a-z]/.test(password) && 
                   /\d/.test(password);

    return {
      isValid,
      score: Math.min(5, score), // Cap at 5
      feedback
    };
  }

  /**
   * Generate password reset token with expiration
   */
  static generatePasswordResetToken(): {
    token: string;
    hashedToken: string;
    expiresAt: Date;
  } {
    try {
      const token = this.generateSecureToken();
      // Hash the token for storage (adds extra security layer)
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      logger.debug('Password reset token generated');
      return {
        token,
        hashedToken,
        expiresAt
      };
    } catch (error) {
      logger.error('Error generating password reset token:', error);
      throw new Error('Failed to generate password reset token');
    }
  }

  /**
   * Hash a token for comparison (used for password reset tokens)
   */
  static hashToken(token: string): string {
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      logger.debug('Token hashed successfully');
      return hashedToken;
    } catch (error) {
      logger.error('Error hashing token:', error);
      throw new Error('Failed to hash token');
    }
  }

  /**
   * Generate email verification token
   */
  static generateEmailVerificationToken(): {
    token: string;
    expiresAt: Date;
  } {
    try {
      const token = this.generateSecureToken();
      
      // Token expires in 24 hours
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      logger.debug('Email verification token generated');
      return {
        token,
        expiresAt
      };
    } catch (error) {
      logger.error('Error generating email verification token:', error);
      throw new Error('Failed to generate email verification token');
    }
  }
}