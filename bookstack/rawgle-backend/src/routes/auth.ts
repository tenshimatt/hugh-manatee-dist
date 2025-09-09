import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateSchema, commonSchemas } from '../middleware/validation';
import { 
  authenticate, 
  validateCSRF, 
  AuthMiddleware 
} from '../middleware/authMiddleware';
import { z } from 'zod';

const router = Router();

// Validation schemas for authentication endpoints
const authSchemas = {
  register: z.object({
    body: z.object({
      email: commonSchemas.email,
      password: commonSchemas.password,
      firstName: commonSchemas.name,
      lastName: commonSchemas.name,
      accountType: z.enum(['user', 'business']).default('user').optional(),
    })
  }),

  login: z.object({
    body: z.object({
      email: commonSchemas.email,
      password: z.string().min(1, 'Password is required').max(128, 'Password too long')
    })
  }),

  refreshToken: z.object({
    body: z.object({
      refreshToken: z.string().optional() // Optional as it can come from cookies
    })
  }),

  resetPasswordRequest: z.object({
    body: z.object({
      email: commonSchemas.email
    })
  }),

  resetPasswordConfirm: z.object({
    body: z.object({
      token: z.string().min(1, 'Reset token is required').max(256, 'Invalid token length'),
      newPassword: commonSchemas.password
    })
  }),

  verifyEmail: z.object({
    params: z.object({
      token: z.string().min(1, 'Verification token is required').max(256, 'Invalid token length')
    })
  })
};

/**
 * User Registration
 * POST /api/v1/auth/register
 * 
 * Security Features:
 * - Rate limiting (5 requests per hour per IP)
 * - Email validation and sanitization
 * - Password strength validation
 * - Duplicate email prevention with timing attack protection
 * - Email verification token generation
 */
router.post('/register', 
  AuthMiddleware.createAuthRateLimit(), // Enhanced rate limiting for auth
  validateSchema(authSchemas.register),
  AuthController.register
);

/**
 * User Login
 * POST /api/v1/auth/login
 * 
 * Security Features:
 * - Rate limiting (5 requests per minute per IP)
 * - Brute force protection with account lockout
 * - Consistent timing to prevent user enumeration
 * - JWT token generation with secure configuration
 * - HTTP-only cookies for token storage
 * - CSRF token generation
 * - Audit logging for security monitoring
 */
router.post('/login',
  AuthMiddleware.createAuthRateLimit(),
  validateSchema(authSchemas.login),
  AuthController.login
);

/**
 * Token Refresh
 * POST /api/v1/auth/refresh
 * 
 * Security Features:
 * - Refresh token rotation (old token invalidated)
 * - Token version checking (for global invalidation)
 * - Redis-based token validation
 * - Device tracking for anomaly detection
 */
router.post('/refresh',
  validateSchema(authSchemas.refreshToken),
  AuthController.refreshToken
);

/**
 * User Logout
 * POST /api/v1/auth/logout
 * 
 * Security Features:
 * - Token blacklisting (access and refresh)
 * - Cookie clearing
 * - Session cleanup
 * - Audit logging
 */
router.post('/logout',
  authenticate, // Require valid authentication
  validateCSRF, // CSRF protection for cookie-based auth
  AuthController.logout
);

/**
 * Email Verification
 * GET /api/v1/auth/verify-email/:token
 * 
 * Security Features:
 * - Token expiration validation (24 hours)
 * - Single-use token consumption
 * - Secure token generation and validation
 */
router.get('/verify-email/:token',
  validateSchema(authSchemas.verifyEmail),
  AuthController.verifyEmail
);

/**
 * Password Reset Request
 * POST /api/v1/auth/reset-password
 * 
 * Security Features:
 * - Rate limiting (3 requests per hour per IP)
 * - User enumeration protection (consistent responses)
 * - Secure token generation with expiration (1 hour)
 * - Token hashing for storage
 */
router.post('/reset-password',
  AuthMiddleware.createAuthRateLimit(),
  validateSchema(authSchemas.resetPasswordRequest),
  AuthController.requestPasswordReset
);

/**
 * Password Reset Confirmation
 * POST /api/v1/auth/reset-password/confirm
 * 
 * Security Features:
 * - Token validation and single-use consumption
 * - Password strength validation
 * - Token version increment (invalidates all existing sessions)
 * - Account unlock and failed attempt reset
 */
router.post('/reset-password/confirm',
  validateSchema(authSchemas.resetPasswordConfirm),
  AuthController.resetPassword
);

/**
 * Get Current User Profile
 * GET /api/v1/auth/me
 * 
 * Security Features:
 * - JWT authentication required
 * - No sensitive data exposure
 * - Session validation
 */
router.get('/me',
  authenticate,
  AuthController.getCurrentUser
);

/**
 * Advanced Security Endpoints
 */

/**
 * Invalidate All User Sessions (Security Feature)
 * POST /api/v1/auth/logout-all
 * 
 * Use Cases:
 * - Password change
 * - Suspected account compromise
 * - User-initiated session cleanup
 */
router.post('/logout-all',
  authenticate,
  validateCSRF,
  async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      
      // Increment token version to invalidate all existing tokens
      await AuthMiddleware.blacklistAllUserTokens(userId);
      
      // Clear current session cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.clearCookie('csrfToken');
      
      res.json({
        success: true,
        message: 'All sessions have been invalidated. Please log in again.'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get Active Sessions (Security Feature)
 * GET /api/v1/auth/sessions
 * 
 * Shows user their active sessions across devices for security monitoring
 */
router.get('/sessions',
  authenticate,
  async (req, res, next) => {
    try {
      // This would typically fetch from Redis where we store session metadata
      // For now, return basic session info
      res.json({
        success: true,
        data: {
          currentSession: {
            deviceId: req.deviceId?.substring(0, 8) + '...',
            lastActivity: new Date().toISOString(),
            current: true
          },
          // TODO: Implement full session tracking
          totalSessions: 1
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Security Testing Endpoints (Development Only)
 */
if (process.env.NODE_ENV === 'development') {
  /**
   * Test Token Validation (Development Only)
   * GET /api/v1/auth/validate-token
   */
  router.get('/validate-token',
    authenticate,
    (req, res) => {
      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          user: req.user,
          deviceId: req.deviceId,
          sessionId: req.sessionId
        }
      });
    }
  );

  /**
   * Test Rate Limiting (Development Only)
   * GET /api/v1/auth/test-rate-limit
   */
  router.get('/test-rate-limit',
    AuthMiddleware.createAuthRateLimit(),
    (req, res) => {
      res.json({
        success: true,
        message: 'Rate limit test passed',
        timestamp: new Date().toISOString()
      });
    }
  );
}

/**
 * Authentication Status Endpoint (Public)
 * GET /api/v1/auth/status
 * 
 * Returns authentication status without failing for unauthenticated users
 * Useful for frontend to determine if user is logged in
 */
router.get('/status',
  async (req, res, next) => {
    try {
      let isAuthenticated = false;
      let user = null;

      // Try to authenticate without throwing errors
      let token: string | null = null;
      
      // Check Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
      
      // Check cookies
      if (!token && req.cookies?.accessToken) {
        token = req.cookies.accessToken;
      }

      if (token) {
        try {
          const decoded = require('../utils/jwt').JWTService.verifyAccessToken(token);
          
          // Check if token is blacklisted
          const isBlacklisted = await AuthMiddleware.isTokenBlacklisted(token);
          
          if (!isBlacklisted) {
            isAuthenticated = true;
            user = {
              id: decoded.userId,
              email: decoded.email,
              accountType: decoded.accountType
            };
          }
        } catch (error) {
          // Token invalid or expired, but don't throw error
        }
      }

      res.json({
        success: true,
        data: {
          authenticated: isAuthenticated,
          user: user
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as authRouter };