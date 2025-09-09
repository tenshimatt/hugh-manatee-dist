import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../utils/jwt';
import { PasswordService } from '../utils/password';
import { createError } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  account_type: 'user' | 'business' | 'admin';
  email_verified: boolean;
  email_verification_token?: string;
  email_verification_expires?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  failed_login_attempts: number;
  account_locked_until?: Date;
  token_version: number;
  created_at: Date;
  updated_at: Date;
}

export class AuthController {
  /**
   * Register a new user account
   * POST /api/v1/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName, accountType = 'user' } = req.body;

      // Check if user already exists
      const existingUser = await db.query(
        'SELECT id, email FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.length > 0) {
        // Implement consistent timing to prevent user enumeration
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        
        throw createError.conflict('An account with this email already exists');
      }

      // Validate password strength
      const passwordValidation = PasswordService.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw createError.validation('Password does not meet security requirements', {
          feedback: passwordValidation.feedback,
          score: passwordValidation.score
        });
      }

      // Hash password with secure parameters
      const passwordHash = await PasswordService.hashPassword(password);

      // Generate email verification token
      const { token: emailToken, expiresAt: emailTokenExpires } = 
        PasswordService.generateEmailVerificationToken();

      // Create user record using existing table structure
      const userResult = await db.query(`
        INSERT INTO users (
          name, email, password_hash, account_type
        ) VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, account_type, created_at
      `, [
        `${firstName} ${lastName}`,
        email.toLowerCase(),
        passwordHash,
        accountType
      ]);

      const user = userResult[0];

      // Log successful registration for audit
      logger.info('User registration successful', {
        userId: user.id,
        email: user.email,
        accountType: user.account_type,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        event: 'user_registration'
      });

      // TODO: Send verification email here
      logger.info('Email verification token generated', {
        userId: user.id,
        email: user.email,
        tokenLength: emailToken.length
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            accountType: user.account_type,
            createdAt: user.created_at
          }
        }
      });

    } catch (error) {
      if (error.statusCode) {
        return next(error);
      }
      
      logger.error('Registration error:', error);
      next(createError.internal('Registration failed'));
    }
  }

  /**
   * Login user and generate JWT tokens
   * POST /api/v1/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const clientIp = req.ip;
      const userAgent = req.get('User-Agent') || '';

      // Fetch user with consistent timing to prevent enumeration
      const userResult = await db.query(`
        SELECT id, email, password_hash, name, account_type,
               email_verified, created_at
        FROM users 
        WHERE email = $1
      `, [email.toLowerCase()]);

      // Always check password even if user doesn't exist (timing attack prevention)
      const user = userResult.rows[0];
      const dummyHash = '$2a$12$dummy.hash.to.prevent.timing.attacks.dummy.hash.value';
      const passwordToCheck = user?.password_hash || dummyHash;
      
      const isValidPassword = await PasswordService.comparePassword(password, passwordToCheck);

      // Check if user exists and password is valid
      if (!user || !isValidPassword) {
        // Log failed attempt for security monitoring
        logger.warn('Failed login attempt', {
          email: email.toLowerCase(),
          ip: clientIp,
          userAgent,
          reason: !user ? 'user_not_found' : 'invalid_password'
        });

        // Note: Failed login attempt tracking temporarily disabled

        throw createError.unauthorized('Invalid email or password');
      }

      // Note: Account locking temporarily disabled for basic implementation
      // This can be re-enabled once the database schema includes these fields

      // Note: Email verification temporarily disabled for basic implementation
      // if (!user.email_verified) {
      //   throw createError.forbidden('Please verify your email address before logging in');
      // }

      // Note: Failed login attempts tracking temporarily disabled for basic implementation

      // Generate JWT tokens
      const accessToken = JWTService.generateAccessToken({
        userId: user.id,
        email: user.email,
        accountType: user.account_type
      });

      const refreshToken = JWTService.generateRefreshToken({
        userId: user.id,
        tokenVersion: 1 // Default version for basic implementation
      });

      // Store refresh token hash in Redis for validation
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await redis.setex(
        `refresh_token:${user.id}:${refreshTokenHash}`,
        7 * 24 * 60 * 60, // 7 days
        JSON.stringify({
          userId: user.id,
          deviceId: AuthController.generateDeviceId(req),
          createdAt: new Date().toISOString(),
          ip: clientIp,
          userAgent
        })
      );

      // Generate CSRF token for cookie-based auth
      const csrfToken = crypto.randomBytes(32).toString('hex');

      // Set HTTP-only cookies for secure token storage
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      };

      res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 30 * 60 * 1000 // 30 minutes for access token
      });
      
      res.cookie('refreshToken', refreshToken, cookieOptions);
      res.cookie('csrfToken', csrfToken, {
        ...cookieOptions,
        httpOnly: false // CSRF token needs to be accessible to JavaScript
      });

      // Log successful login for audit
      logger.info('User login successful', {
        userId: user.id,
        email: user.email,
        accountType: user.account_type,
        ip: clientIp,
        userAgent,
        deviceId: AuthController.generateDeviceId(req)
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            accountType: user.account_type,
            emailVerified: user.email_verified,
            createdAt: user.created_at
          },
          tokens: {
            accessToken, // Also provide in response for Authorization header usage
            expiresIn: 30 * 60, // 30 minutes in seconds
            tokenType: 'Bearer'
          },
          csrfToken // Provide CSRF token for header usage
        }
      });

    } catch (error) {
      if (error.statusCode) {
        return next(error);
      }
      
      logger.error('Login error:', error);
      next(createError.internal('Login failed'));
    }
  }

  /**
   * Refresh access token using refresh token
   * POST /api/v1/auth/refresh
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let refreshToken: string | null = null;

      // Try to get refresh token from cookie or request body
      if (req.cookies?.refreshToken) {
        refreshToken = req.cookies.refreshToken;
      } else if (req.body.refreshToken) {
        refreshToken = req.body.refreshToken;
      }

      if (!refreshToken) {
        throw createError.unauthorized('Refresh token required');
      }

      // Verify refresh token
      const decoded = JWTService.verifyRefreshToken(refreshToken);
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Check if refresh token exists in Redis
      const storedToken = await redis.get(`refresh_token:${decoded.userId}:${refreshTokenHash}`);
      if (!storedToken) {
        throw createError.unauthorized('Invalid or expired refresh token');
      }

      // Get current user data
      const userResult = await db.query(`
        SELECT id, email, account_type, email_verified
        FROM users 
        WHERE id = $1
      `, [decoded.userId]);

      const user = userResult.rows[0];
      if (!user) {
        throw createError.unauthorized('User not found');
      }

      // Note: Token version checking temporarily disabled for basic implementation

      // Note: Email verification temporarily disabled for basic implementation
      // if (!user.email_verified) {
      //   throw createError.forbidden('Email verification required');
      // }

      // Generate new access token
      const newAccessToken = JWTService.generateAccessToken({
        userId: user.id,
        email: user.email,
        accountType: user.account_type
      });

      // Rotate refresh token for enhanced security
      const newRefreshToken = JWTService.generateRefreshToken({
        userId: user.id,
        tokenVersion: 1 // Default version for basic implementation
      });

      // Remove old refresh token
      await redis.del(`refresh_token:${decoded.userId}:${refreshTokenHash}`);

      // Store new refresh token
      const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
      await redis.setex(
        `refresh_token:${user.id}:${newRefreshTokenHash}`,
        7 * 24 * 60 * 60, // 7 days
        JSON.stringify({
          userId: user.id,
          deviceId: AuthController.generateDeviceId(req),
          createdAt: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent') || ''
        })
      );

      // Update cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      };

      res.cookie('accessToken', newAccessToken, {
        ...cookieOptions,
        maxAge: 30 * 60 * 1000 // 30 minutes for access token
      });
      
      res.cookie('refreshToken', newRefreshToken, cookieOptions);

      // Log token refresh for audit
      logger.info('Token refreshed successfully', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            accessToken: newAccessToken,
            expiresIn: 30 * 60, // 30 minutes in seconds
            tokenType: 'Bearer'
          }
        }
      });

    } catch (error) {
      if (error.statusCode) {
        return next(error);
      }
      
      logger.error('Token refresh error:', error);
      next(createError.unauthorized('Token refresh failed'));
    }
  }

  /**
   * Logout user and invalidate tokens
   * POST /api/v1/auth/logout
   */
  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.userId;
      
      // Get tokens from cookies and headers
      const accessToken = req.cookies?.accessToken || 
                         JWTService.extractTokenFromHeader(req.headers.authorization);
      const refreshToken = req.cookies?.refreshToken;

      // Blacklist access token
      if (accessToken) {
        const tokenExpiry = JWTService.getTokenExpiration(accessToken);
        await AuthMiddleware.blacklistToken(accessToken, tokenExpiry || undefined);
      }

      // Remove refresh token from Redis
      if (refreshToken) {
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await redis.del(`refresh_token:${userId}:${refreshTokenHash}`);
      }

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.clearCookie('csrfToken');

      // Log logout for audit
      logger.info('User logout successful', {
        userId: userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        deviceId: req.deviceId
      });

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      next(createError.internal('Logout failed'));
    }
  }

  /**
   * Verify email address using verification token
   * GET /api/v1/auth/verify-email/:token
   */
  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        throw createError.validation('Verification token is required');
      }

      // Note: Email verification temporarily simplified for basic implementation
      // In production, this would use separate email_verification_tokens table
      res.json({
        success: false,
        message: 'Email verification not yet implemented in basic version'
      });

    } catch (error) {
      if (error.statusCode) {
        return next(error);
      }
      
      logger.error('Email verification error:', error);
      next(createError.internal('Email verification failed'));
    }
  }

  /**
   * Request password reset
   * POST /api/v1/auth/reset-password
   */
  static async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      // Always provide consistent response time to prevent user enumeration
      const startTime = Date.now();
      
      // Note: Password reset temporarily simplified for basic implementation
      logger.info('Password reset request received', {
        email: email.toLowerCase(),
        ip: req.ip
      });

      // Ensure consistent response time
      const elapsed = Date.now() - startTime;
      if (elapsed < 100) {
        await new Promise(resolve => setTimeout(resolve, 100 - elapsed));
      }

      // Always return success to prevent user enumeration
      res.json({
        success: true,
        message: 'If an account with that email exists, you will receive password reset instructions.'
      });

    } catch (error) {
      logger.error('Password reset request error:', error);
      next(createError.internal('Password reset request failed'));
    }
  }

  /**
   * Reset password using reset token
   * POST /api/v1/auth/reset-password/confirm
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        throw createError.validation('Reset token and new password are required');
      }

      // Validate new password strength
      const passwordValidation = PasswordService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw createError.validation('Password does not meet security requirements', {
          feedback: passwordValidation.feedback,
          score: passwordValidation.score
        });
      }

      // Note: Password reset confirmation temporarily simplified for basic implementation
      res.json({
        success: false,
        message: 'Password reset confirmation not yet implemented in basic version'
      });

    } catch (error) {
      if (error.statusCode) {
        return next(error);
      }
      
      logger.error('Password reset error:', error);
      next(createError.internal('Password reset failed'));
    }
  }

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  static async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.userId;

      const userResult = await db.query(`
        SELECT id, email, name, account_type, email_verified, created_at, updated_at
        FROM users 
        WHERE id = $1
      `, [userId]);

      const user = userResult.rows[0];
      if (!user) {
        throw createError.notFound('User not found');
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            accountType: user.account_type,
            emailVerified: user.email_verified,
            createdAt: user.created_at,
            updatedAt: user.updated_at
          }
        }
      });

    } catch (error) {
      if (error.statusCode) {
        return next(error);
      }
      
      logger.error('Get current user error:', error);
      next(createError.internal('Failed to get user information'));
    }
  }

  /**
   * Handle failed login attempts (temporarily disabled for basic implementation)
   */
  private static async handleFailedLogin(userId: string): Promise<void> {
    logger.debug('Failed login attempt tracking disabled for basic implementation', { userId });
  }

  /**
   * Generate device ID for tracking
   */
  private static generateDeviceId(req: Request): string {
    const userAgent = req.get('User-Agent') || '';
    const ip = req.ip || '';
    
    return crypto.createHash('sha256')
      .update(`${userAgent}:${ip}`)
      .digest('hex');
  }
}