import { Request, Response, NextFunction } from 'express';
import { JWTService, JWTPayload } from '../utils/jwt';
import { createError } from './errorHandler';
import { logger } from '../config/logger';
import { redis } from '../config/redis';
import crypto from 'crypto';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      deviceId?: string;
      sessionId?: string;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
  deviceId: string;
  sessionId: string;
}

export class AuthMiddleware {
  /**
   * Extract and validate JWT token from request
   * Supports both Authorization header (Bearer token) and HTTP-only cookies
   */
  static async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let token: string | null = null;

      // Try to extract token from Authorization header first
      const authHeader = req.headers.authorization;
      if (authHeader) {
        token = JWTService.extractTokenFromHeader(authHeader);
      }

      // Fallback to HTTP-only cookie if no Authorization header
      if (!token && req.cookies?.accessToken) {
        token = req.cookies.accessToken;
      }

      if (!token) {
        throw createError.unauthorized('Authentication required - no token provided');
      }

      // Verify token signature and expiration
      const decoded = JWTService.verifyAccessToken(token);

      // Check if token is blacklisted (logout/compromise)
      const isBlacklisted = await AuthMiddleware.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw createError.unauthorized('Token has been invalidated');
      }

      // Generate device/session identifiers for tracking
      const deviceId = AuthMiddleware.generateDeviceId(req);
      const sessionId = AuthMiddleware.generateSessionId(decoded.userId, deviceId);

      // Attach user info to request
      req.user = decoded;
      req.deviceId = deviceId;
      req.sessionId = sessionId;

      // Log successful authentication for audit
      logger.info('User authenticated successfully', {
        userId: decoded.userId,
        email: decoded.email,
        accountType: decoded.accountType,
        deviceId: deviceId.substring(0, 8) + '...',
        sessionId: sessionId.substring(0, 8) + '...',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      next();
    } catch (error) {
      // Log failed authentication attempts for security monitoring
      logger.warn('Authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });

      if (error instanceof Error && error.message.includes('expired')) {
        return next(createError.unauthorized('Token expired - please refresh your session'));
      } else if (error instanceof Error && error.message.includes('invalid')) {
        return next(createError.unauthorized('Invalid authentication token'));
      } else if (error.statusCode) {
        return next(error);
      }

      next(createError.unauthorized('Authentication failed'));
    }
  }

  /**
   * Require specific account types for access
   */
  static requireAccountType(...allowedTypes: ('user' | 'business' | 'admin')[]): 
    (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = req.user;
      
      if (!user) {
        return next(createError.unauthorized('Authentication required'));
      }

      if (!allowedTypes.includes(user.accountType)) {
        logger.warn('Access denied - insufficient permissions', {
          userId: user.userId,
          userType: user.accountType,
          requiredTypes: allowedTypes,
          path: req.path,
          method: req.method
        });
        
        return next(createError.forbidden('Insufficient permissions for this resource'));
      }

      next();
    };
  }

  /**
   * Optional authentication - doesn't fail if no token provided
   * Useful for public endpoints that offer additional features for authenticated users
   */
  static async optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let token: string | null = null;

      // Try Authorization header first
      const authHeader = req.headers.authorization;
      if (authHeader) {
        token = JWTService.extractTokenFromHeader(authHeader);
      }

      // Try cookies
      if (!token && req.cookies?.accessToken) {
        token = req.cookies.accessToken;
      }

      if (token) {
        const decoded = JWTService.verifyAccessToken(token);
        
        // Check blacklist
        const isBlacklisted = await AuthMiddleware.isTokenBlacklisted(token);
        if (!isBlacklisted) {
          req.user = decoded;
          req.deviceId = AuthMiddleware.generateDeviceId(req);
          req.sessionId = AuthMiddleware.generateSessionId(decoded.userId, req.deviceId);
          
          logger.debug('Optional authentication successful', {
            userId: decoded.userId
          });
        }
      }

      next();
    } catch (error) {
      // For optional auth, log but don't fail the request
      logger.debug('Optional authentication failed, continuing without auth', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      next();
    }
  }

  /**
   * Check if a token has been blacklisted
   */
  private static async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const result = await redis.get(`blacklist:${tokenHash}`);
      return result !== null;
    } catch (error) {
      logger.error('Error checking token blacklist:', error);
      // Fail secure - if we can't check blacklist, assume it's valid
      // but log this for investigation
      return false;
    }
  }

  /**
   * Add token to blacklist (for logout, security breach, etc.)
   */
  static async blacklistToken(token: string, expirationTime?: Date): Promise<void> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const ttl = expirationTime 
        ? Math.max(0, Math.floor((expirationTime.getTime() - Date.now()) / 1000))
        : 24 * 60 * 60; // 24 hours default

      await redis.setex(`blacklist:${tokenHash}`, ttl, '1');
      
      logger.info('Token blacklisted successfully', {
        tokenHash: tokenHash.substring(0, 16) + '...',
        ttl
      });
    } catch (error) {
      logger.error('Error blacklisting token:', error);
      throw new Error('Failed to blacklist token');
    }
  }

  /**
   * Blacklist all tokens for a user (e.g., password change, security breach)
   */
  static async blacklistAllUserTokens(userId: string): Promise<void> {
    try {
      // Use a user-specific blacklist key
      const key = `user_blacklist:${userId}`;
      const timestamp = Date.now();
      
      // Set with 30 day expiration (longer than max token lifetime)
      await redis.setex(key, 30 * 24 * 60 * 60, timestamp.toString());
      
      logger.info('All user tokens blacklisted', { userId });
    } catch (error) {
      logger.error('Error blacklisting all user tokens:', error);
      throw new Error('Failed to blacklist user tokens');
    }
  }

  /**
   * Check if all user tokens have been blacklisted
   */
  private static async areAllUserTokensBlacklisted(userId: string, tokenIssuedAt: number): Promise<boolean> {
    try {
      const key = `user_blacklist:${userId}`;
      const blacklistTime = await redis.get(key);
      
      if (!blacklistTime) return false;
      
      // If token was issued before the blacklist time, it's invalid
      return parseInt(blacklistTime) > (tokenIssuedAt * 1000);
    } catch (error) {
      logger.error('Error checking user token blacklist:', error);
      return false;
    }
  }

  /**
   * Generate consistent device ID based on user agent and IP
   * Used for session tracking and anomaly detection
   */
  private static generateDeviceId(req: Request): string {
    const userAgent = req.get('User-Agent') || '';
    const ip = req.ip || req.socket.remoteAddress || '';
    
    // Create hash from stable device characteristics
    const deviceString = `${userAgent}:${ip}`;
    return crypto.createHash('sha256').update(deviceString).digest('hex');
  }

  /**
   * Generate session ID for tracking user sessions across devices
   */
  private static generateSessionId(userId: string, deviceId: string): string {
    const sessionString = `${userId}:${deviceId}:${Date.now()}`;
    return crypto.createHash('sha256').update(sessionString).digest('hex');
  }

  /**
   * Validate CSRF token for cookie-based authentication
   * Implements double-submit cookie pattern
   */
  static validateCSRF(req: Request, res: Response, next: NextFunction): void {
    // Skip CSRF for GET requests (read-only operations)
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }

    // Skip if using Authorization header (not cookie-based)
    if (req.headers.authorization) {
      return next();
    }

    const csrfToken = req.headers['x-csrf-token'] as string;
    const csrfCookie = req.cookies?.csrfToken;

    if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
      logger.warn('CSRF validation failed', {
        hasToken: !!csrfToken,
        hasCookie: !!csrfCookie,
        ip: req.ip,
        path: req.path
      });
      
      return next(createError.forbidden('Invalid CSRF token'));
    }

    next();
  }

  /**
   * Rate limiting specifically for authentication-related requests
   * More restrictive than general API rate limiting
   */
  static createAuthRateLimit() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const key = `auth_rate_limit:${req.ip}`;
        const windowMs = 60 * 1000; // 1 minute
        const maxAttempts = 5; // 5 attempts per minute
        
        const current = await redis.get(key);
        const attempts = current ? parseInt(current) : 0;
        
        if (attempts >= maxAttempts) {
          logger.warn('Authentication rate limit exceeded', {
            ip: req.ip,
            attempts,
            path: req.path
          });
          
          throw createError.tooManyRequests('Too many authentication attempts. Please try again later.');
        }
        
        // Increment counter
        await redis.incr(key);
        await redis.expire(key, Math.ceil(windowMs / 1000));
        
        next();
      } catch (error) {
        if (error.statusCode) {
          return next(error);
        }
        
        logger.error('Error in auth rate limiting:', error);
        // Don't fail request if rate limiting is unavailable
        next();
      }
    };
  }
}

// Export middleware functions for easier use
export const authenticate = AuthMiddleware.authenticate;
export const requireAdmin = AuthMiddleware.requireAccountType('admin');
export const requireBusiness = AuthMiddleware.requireAccountType('business', 'admin');
export const requireUser = AuthMiddleware.requireAccountType('user', 'business', 'admin');
export const optionalAuth = AuthMiddleware.optionalAuth;
export const validateCSRF = AuthMiddleware.validateCSRF;
export const authRateLimit = AuthMiddleware.createAuthRateLimit();