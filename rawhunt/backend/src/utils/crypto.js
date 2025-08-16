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
      return jwt.sign(payload, secret, { 
        expiresIn,
        algorithm: 'HS256',
        issuer: 'rawgle-api',
        audience: 'rawgle-platform'
      });
    } catch (error) {
      throw new Error('JWT generation failed');
    }
  }

  static verifyJWT(token, secret) {
    try {
      // Prevent algorithm confusion attacks by explicitly specifying allowed algorithms
      return jwt.verify(token, secret, { 
        algorithms: ['HS256'],
        maxAge: '24h',
        issuer: 'rawgle-api',
        audience: 'rawgle-platform'
      });
    } catch (error) {
      // Log security-relevant errors without exposing details
      console.error('JWT verification failed:', error.name);
      throw new Error('Invalid or expired token');
    }
  }

  static generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `RWG-${timestamp}-${random}`;
  }

  static generateTokenHash(token) {
    // Secure hash for token blacklisting using crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
      const hashArray = new Uint8Array(hashBuffer);
      return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
    });
  }

  static generateSecureRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);
    for (let i = 0; i < length; i++) {
      result += chars[randomArray[i] % chars.length];
    }
    return result;
  }
}