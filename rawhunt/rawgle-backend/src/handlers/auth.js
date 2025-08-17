/**
 * Authentication Handler for Rawgle
 * Handles user registration, login, logout, and profile management
 */

import { Hono } from 'hono';
import { AuthService } from '../services/auth-service.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { z } from 'zod';

const app = new Hono();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  location: z.string().optional(),
  phone: z.string().optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'professional']).default('beginner'),
  privacy_settings: z.object({
    share_feeding_data: z.boolean().default(true),
    share_location: z.boolean().default(false),
    public_profile: z.boolean().default(true),
    allow_messages: z.boolean().default(true)
  }).optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().default(false)
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'professional']).optional(),
  privacy_settings: z.object({
    share_feeding_data: z.boolean(),
    share_location: z.boolean(),
    public_profile: z.boolean(),
    allow_messages: z.boolean()
  }).optional(),
  preferences: z.object({
    email_notifications: z.boolean(),
    push_notifications: z.boolean(),
    newsletter: z.boolean(),
    feeding_reminders: z.boolean(),
    paws_notifications: z.boolean()
  }).optional()
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Password confirmation is required')
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
});

// POST /api/auth/register
app.post('/register', validateRequest(registerSchema), async (c) => {
  try {
    const userData = c.get('validatedData');
    const authService = new AuthService(c.env.DB, c.env.KV);
    
    const result = await authService.register({
      ...userData,
      platform: 'rawgle'
    });
    
    return c.json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: result.user,
        token: result.token,
        expires_at: result.expiresAt
      }
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return c.json({
        success: false,
        error: 'EMAIL_EXISTS',
        message: 'An account with this email already exists'
      }, 409);
    }
    
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return c.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'REGISTRATION_FAILED',
      message: 'Failed to create account. Please try again.'
    }, 500);
  }
});

// POST /api/auth/login
app.post('/login', validateRequest(loginSchema), async (c) => {
  try {
    const { email, password, remember_me } = c.get('validatedData');
    const authService = new AuthService(c.env.DB, c.env.KV);
    
    const result = await authService.login(email, password, {
      platform: 'rawgle',
      rememberMe: remember_me,
      userAgent: c.req.header('user-agent'),
      ipAddress: c.req.header('cf-connecting-ip')
    });
    
    return c.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        token: result.token,
        expires_at: result.expiresAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Invalid credentials')) {
      return c.json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }, 401);
    }
    
    if (error.message.includes('not verified')) {
      return c.json({
        success: false,
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before logging in'
      }, 401);
    }
    
    return c.json({
      success: false,
      error: 'LOGIN_FAILED',
      message: 'Login failed. Please try again.'
    }, 500);
  }
});

// POST /api/auth/logout
app.post('/logout', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const token = c.get('token');
    const authService = new AuthService(c.env.DB, c.env.KV);
    
    await authService.logout(token, user.id);
    
    return c.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({
      success: false,
      error: 'LOGOUT_FAILED',
      message: 'Failed to logout. Please try again.'
    }, 500);
  }
});

// POST /api/auth/refresh
app.post('/refresh', async (c) => {
  try {
    const refreshToken = c.req.header('x-refresh-token');
    if (!refreshToken) {
      return c.json({
        success: false,
        error: 'REFRESH_TOKEN_REQUIRED',
        message: 'Refresh token is required'
      }, 400);
    }
    
    const authService = new AuthService(c.env.DB, c.env.KV);
    const result = await authService.refreshToken(refreshToken);
    
    return c.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: result.token,
        expires_at: result.expiresAt
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return c.json({
      success: false,
      error: 'TOKEN_REFRESH_FAILED',
      message: 'Failed to refresh token'
    }, 401);
  }
});

// GET /api/auth/profile
app.get('/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const authService = new AuthService(c.env.DB, c.env.KV);
    
    const profile = await authService.getUserProfile(user.id);
    
    return c.json({
      success: true,
      data: {
        user: profile
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({
      success: false,
      error: 'PROFILE_FETCH_FAILED',
      message: 'Failed to retrieve profile'
    }, 500);
  }
});

// PUT /api/auth/profile
app.put('/profile', authMiddleware, validateRequest(updateProfileSchema), async (c) => {
  try {
    const user = c.get('user');
    const updates = c.get('validatedData');
    const authService = new AuthService(c.env.DB, c.env.KV);
    
    const updatedProfile = await authService.updateProfile(user.id, updates);
    
    return c.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedProfile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return c.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'PROFILE_UPDATE_FAILED',
      message: 'Failed to update profile'
    }, 500);
  }
});

// POST /api/auth/change-password
app.post('/change-password', authMiddleware, validateRequest(changePasswordSchema), async (c) => {
  try {
    const user = c.get('user');
    const { current_password, new_password } = c.get('validatedData');
    const authService = new AuthService(c.env.DB, c.env.KV);
    
    await authService.changePassword(user.id, current_password, new_password);
    
    return c.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.message.includes('Current password is incorrect')) {
      return c.json({
        success: false,
        error: 'INVALID_CURRENT_PASSWORD',
        message: 'Current password is incorrect'
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'PASSWORD_CHANGE_FAILED',
      message: 'Failed to change password'
    }, 500);
  }
});

// POST /api/auth/verify-email
app.post('/verify-email', async (c) => {
  try {
    const { token } = await c.req.json();
    if (!token) {
      return c.json({
        success: false,
        error: 'TOKEN_REQUIRED',
        message: 'Verification token is required'
      }, 400);
    }
    
    const authService = new AuthService(c.env.DB, c.env.KV);
    await authService.verifyEmail(token);
    
    return c.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return c.json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired verification token'
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'VERIFICATION_FAILED',
      message: 'Email verification failed'
    }, 500);
  }
});

// POST /api/auth/resend-verification
app.post('/resend-verification', async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({
        success: false,
        error: 'EMAIL_REQUIRED',
        message: 'Email address is required'
      }, 400);
    }
    
    const authService = new AuthService(c.env.DB, c.env.KV);
    await authService.resendVerificationEmail(email);
    
    return c.json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return c.json({
      success: true, // Always return success to prevent email enumeration
      message: 'If the email exists, a verification email has been sent'
    });
  }
});

// POST /api/auth/forgot-password
app.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({
        success: false,
        error: 'EMAIL_REQUIRED',
        message: 'Email address is required'
      }, 400);
    }
    
    const authService = new AuthService(c.env.DB, c.env.KV);
    await authService.sendPasswordResetEmail(email);
    
    return c.json({
      success: true,
      message: 'If the email exists, a password reset email has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({
      success: true, // Always return success to prevent email enumeration
      message: 'If the email exists, a password reset email has been sent'
    });
  }
});

// POST /api/auth/reset-password
app.post('/reset-password', async (c) => {
  try {
    const { token, new_password, confirm_password } = await c.req.json();
    
    if (!token || !new_password || !confirm_password) {
      return c.json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Token, new password, and confirmation are required'
      }, 400);
    }
    
    if (new_password !== confirm_password) {
      return c.json({
        success: false,
        error: 'PASSWORD_MISMATCH',
        message: 'Passwords do not match'
      }, 400);
    }
    
    if (new_password.length < 8) {
      return c.json({
        success: false,
        error: 'PASSWORD_TOO_SHORT',
        message: 'Password must be at least 8 characters'
      }, 400);
    }
    
    const authService = new AuthService(c.env.DB, c.env.KV);
    await authService.resetPassword(token, new_password);
    
    return c.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return c.json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired reset token'
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'PASSWORD_RESET_FAILED',
      message: 'Password reset failed'
    }, 500);
  }
});

// DELETE /api/auth/account
app.delete('/account', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { confirm_deletion } = await c.req.json();
    
    if (!confirm_deletion) {
      return c.json({
        success: false,
        error: 'CONFIRMATION_REQUIRED',
        message: 'Account deletion must be confirmed'
      }, 400);
    }
    
    const authService = new AuthService(c.env.DB, c.env.KV);
    await authService.deleteAccount(user.id);
    
    return c.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return c.json({
      success: false,
      error: 'ACCOUNT_DELETION_FAILED',
      message: 'Failed to delete account'
    }, 500);
  }
});

export default app;