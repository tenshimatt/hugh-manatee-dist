import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Crypto utilities for password hashing and JWT operations
 */

export class CryptoUtils {
  static async hashPassword(password, rounds = 12) {
    try {
      return await bcrypt.hash(password, rounds);
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  }

  static async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }

  static generateJWT(payload, secret, expiresIn = '24h') {
    try {
      return jwt.sign(payload, secret, { expiresIn });
    } catch (error) {
      throw new Error('JWT generation failed');
    }
  }

  static verifyJWT(token, secret) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('JWT verification failed');
    }
  }

  static generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `RWG-${timestamp}-${random}`;
  }

  static generateTokenHash(token) {
    // Simple hash for token blacklisting
    return btoa(token).slice(0, 32);
  }
}