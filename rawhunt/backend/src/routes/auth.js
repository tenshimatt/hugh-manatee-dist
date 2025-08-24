import { Router } from 'itty-router';
import { CryptoUtils } from '../utils/crypto.js';
import { ValidationUtils, userRegistrationSchema, userLoginSchema } from '../utils/validation.js';
import { UserQueries, TransactionQueries, DatabaseUtils } from '../utils/database.js';
import { authRateLimit, strictRateLimit } from '../middleware/rateLimit.js';
import { requireAuth, requireAuthWithBypass, createUserSession, revokeUserSession, checkAdminAccess } from '../middleware/auth.js';
import { createCorsResponse } from '../middleware/cors.js';

const authRouter = Router({ base: '/api/auth' });

/**
 * POST /api/auth/register
 * Register a new user
 */
authRouter.post('/register', async (request, env) => {
  try {
    // Apply rate limiting
    const rateLimitResponse = await authRateLimit(request, env);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    
    // Sanitize input to prevent XSS attacks
    const sanitizedBody = ValidationUtils.sanitizeJson(body);
    
    // Validate input
    const validatedData = ValidationUtils.validateRequest(userRegistrationSchema, sanitizedBody);
    
    // Check if user already exists
    const existingUser = await UserQueries.findByEmail(env.DB, validatedData.email);
    if (existingUser) {
      return createCorsResponse({
        error: 'User with this email already exists',
        code: 'EMAIL_EXISTS'
      }, 409);
    }

    // Hash password
    const passwordHash = await CryptoUtils.hashPassword(validatedData.password);

    // Create user
    const userId = await UserQueries.create(env.DB, {
      email: validatedData.email,
      passwordHash,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phoneNumber: validatedData.phoneNumber
    });

    // Award welcome bonus PAWS
    const welcomeBonus = 100;
    await UserQueries.updatePawsBalance(env.DB, userId, welcomeBonus);
    
    // Record welcome transaction
    await TransactionQueries.create(env.DB, {
      userId,
      type: 'earned',
      amount: welcomeBonus,
      description: 'Welcome bonus',
      referenceType: 'bonus',
      balanceAfter: welcomeBonus
    });

    // Generate JWT token
    const token = CryptoUtils.generateJWT({
      userId,
      email: validatedData.email
    }, env.JWT_SECRET);

    // Create session
    await createUserSession(env, userId, token);

    // Get user data (without password)
    const user = await UserQueries.findById(env.DB, userId);
    delete user.password_hash;
    
    // Add admin bypass capability
    user.has_admin_access = checkAdminAccess(user, env);

    return createCorsResponse({
      success: true,
      data: {
        user,
        token,
        message: 'Registration successful'
      }
    }, 201);

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.startsWith('[')) {
      // Validation errors
      return createCorsResponse({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: JSON.parse(error.message)
      }, 400);
    }

    return createCorsResponse({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    }, 500);
  }
});

/**
 * POST /api/auth/login
 * Authenticate user
 */
authRouter.post('/login', async (request, env) => {
  try {
    // Apply rate limiting
    const rateLimitResponse = await authRateLimit(request, env);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    
    // Sanitize input to prevent XSS attacks
    const sanitizedBody = ValidationUtils.sanitizeJson(body);
    
    // Validate input
    const validatedData = ValidationUtils.validateRequest(userLoginSchema, sanitizedBody);
    
    // Find user
    const user = await UserQueries.findByEmail(env.DB, validatedData.email);
    if (!user) {
      return createCorsResponse({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      }, 401);
    }

    // Verify password
    const isValidPassword = await CryptoUtils.verifyPassword(
      validatedData.password, 
      user.password_hash
    );
    
    if (!isValidPassword) {
      return createCorsResponse({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      }, 401);
    }

    // Generate JWT token
    const token = CryptoUtils.generateJWT({
      userId: user.id,
      email: user.email
    }, env.JWT_SECRET);

    // Create session
    await createUserSession(env, user.id, token);

    // Remove sensitive data
    delete user.password_hash;
    
    // Add admin bypass capability
    user.has_admin_access = checkAdminAccess(user, env);

    return createCorsResponse({
      success: true,
      data: {
        user,
        token,
        message: 'Login successful'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message.startsWith('[')) {
      return createCorsResponse({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: JSON.parse(error.message)
      }, 400);
    }

    return createCorsResponse({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    }, 500);
  }
});

/**
 * POST /api/auth/logout
 * Logout user and revoke token
 */
authRouter.post('/logout', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    // Revoke session
    await revokeUserSession(env, auth.token);

    return createCorsResponse({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return createCorsResponse({
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    }, 500);
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
authRouter.get('/me', async (request, env) => {
  try {
    const auth = await requireAuthWithBypass(request, env);
    if (auth instanceof Response) return auth;

    // Get fresh user data
    const user = await UserQueries.findById(env.DB, auth.user.id);
    if (!user) {
      return createCorsResponse({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, 404);
    }

    delete user.password_hash;
    
    // Add admin bypass capability
    user.has_admin_access = checkAdminAccess(user, env);

    return createCorsResponse({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return createCorsResponse({
      error: 'Failed to get profile',
      code: 'PROFILE_ERROR'
    }, 500);
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
authRouter.put('/profile', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    
    // Validate and sanitize input
    const updates = {};
    if (body.firstName) updates.first_name = ValidationUtils.sanitizeInput(body.firstName);
    if (body.lastName) updates.last_name = ValidationUtils.sanitizeInput(body.lastName);
    if (body.phoneNumber) updates.phone_number = ValidationUtils.sanitizeInput(body.phoneNumber);
    if (body.locationLatitude !== undefined) updates.location_latitude = body.locationLatitude;
    if (body.locationLongitude !== undefined) updates.location_longitude = body.locationLongitude;
    if (body.locationAddress) updates.location_address = ValidationUtils.sanitizeInput(body.locationAddress);

    // Validate coordinates if provided
    if (updates.location_latitude !== undefined && updates.location_longitude !== undefined) {
      if (!ValidationUtils.validateCoordinates(updates.location_latitude, updates.location_longitude)) {
        return createCorsResponse({
          error: 'Invalid coordinates',
          code: 'INVALID_COORDINATES'
        }, 400);
      }
    }

    // Update user
    await UserQueries.update(env.DB, auth.user.id, updates);

    // Get updated user data
    const user = await UserQueries.findById(env.DB, auth.user.id);
    delete user.password_hash;

    return createCorsResponse({
      success: true,
      data: { user },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return createCorsResponse({
      error: 'Failed to update profile',
      code: 'UPDATE_ERROR'
    }, 500);
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
authRouter.post('/change-password', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    
    if (!body.currentPassword || !body.newPassword) {
      return createCorsResponse({
        error: 'Current password and new password are required',
        code: 'MISSING_PASSWORDS'
      }, 400);
    }

    // Verify current password
    const user = await UserQueries.findById(env.DB, auth.user.id);
    const isValidPassword = await CryptoUtils.verifyPassword(
      body.currentPassword, 
      user.password_hash
    );
    
    if (!isValidPassword) {
      return createCorsResponse({
        error: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      }, 401);
    }

    // Validate new password
    try {
      userRegistrationSchema.pick({ password: true }).parse({ password: body.newPassword });
    } catch (error) {
      return createCorsResponse({
        error: 'New password does not meet requirements',
        code: 'WEAK_PASSWORD',
        details: error.errors
      }, 400);
    }

    // Hash new password
    const newPasswordHash = await CryptoUtils.hashPassword(body.newPassword);

    // Update password
    await UserQueries.update(env.DB, auth.user.id, {
      password_hash: newPasswordHash
    });

    return createCorsResponse({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return createCorsResponse({
      error: 'Failed to change password',
      code: 'PASSWORD_CHANGE_ERROR'
    }, 500);
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
authRouter.post('/forgot-password', async (request, env) => {
  try {
    // Apply rate limiting
    const rateLimitResponse = await strictRateLimit(request, env);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const sanitizedBody = ValidationUtils.sanitizeJson(body);
    
    if (!sanitizedBody.email || !ValidationUtils.validateEmail(sanitizedBody.email)) {
      return createCorsResponse({
        error: 'Valid email address is required',
        code: 'INVALID_EMAIL'
      }, 400);
    }

    const user = await UserQueries.findByEmail(env.DB, sanitizedBody.email);
    
    // Always return success to prevent email enumeration
    const response = createCorsResponse({
      success: true,
      message: 'If the email exists, a reset link has been sent'
    });

    if (user) {
      // Generate secure reset token
      const resetToken = CryptoUtils.generateSecureRandomString(32);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      // Store reset token
      await DatabaseUtils.executeUpdate(
        env.DB,
        `INSERT OR REPLACE INTO password_resets (user_id, token, expires_at, created_at)
         VALUES (?, ?, ?, ?)`,
        [user.id, resetToken, expiresAt.toISOString(), new Date().toISOString()]
      );

      // TODO: Send email with reset link
      console.log(`Password reset token for ${user.email}: ${resetToken}`);
    }

    return response;

  } catch (error) {
    console.error('Forgot password error:', error);
    return createCorsResponse({
      error: 'Failed to process request',
      code: 'FORGOT_PASSWORD_ERROR'
    }, 500);
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
authRouter.post('/reset-password', async (request, env) => {
  try {
    const body = await request.json();
    const sanitizedBody = ValidationUtils.sanitizeJson(body);
    
    if (!sanitizedBody.token || !sanitizedBody.newPassword) {
      return createCorsResponse({
        error: 'Token and new password are required',
        code: 'MISSING_FIELDS'
      }, 400);
    }

    // Find valid reset token
    const resetRecord = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM password_resets WHERE token = ? AND expires_at > ? AND used = 0',
      [sanitizedBody.token, new Date().toISOString()]
    );

    if (!resetRecord) {
      return createCorsResponse({
        error: 'Invalid or expired reset token',
        code: 'INVALID_TOKEN'
      }, 400);
    }

    // Validate new password
    try {
      userRegistrationSchema.pick({ password: true }).parse({ password: sanitizedBody.newPassword });
    } catch (error) {
      return createCorsResponse({
        error: 'Password does not meet requirements',
        code: 'WEAK_PASSWORD',
        details: error.errors
      }, 400);
    }

    // Hash new password
    const newPasswordHash = await CryptoUtils.hashPassword(sanitizedBody.newPassword);

    // Update password and mark token as used
    await DatabaseUtils.transaction(env.DB, [
      env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        .bind(newPasswordHash, resetRecord.user_id),
      env.DB.prepare('UPDATE password_resets SET used = 1 WHERE id = ?')
        .bind(resetRecord.id)
    ]);

    return createCorsResponse({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return createCorsResponse({
      error: 'Failed to reset password',
      code: 'RESET_PASSWORD_ERROR'
    }, 500);
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email address
 */
authRouter.post('/verify-email', async (request, env) => {
  try {
    const body = await request.json();
    const sanitizedBody = ValidationUtils.sanitizeJson(body);
    
    if (!sanitizedBody.token) {
      return createCorsResponse({
        error: 'Verification token is required',
        code: 'MISSING_TOKEN'
      }, 400);
    }

    // Find valid verification token
    const verificationRecord = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM email_verifications WHERE token = ? AND expires_at > ? AND used = 0',
      [sanitizedBody.token, new Date().toISOString()]
    );

    if (!verificationRecord) {
      return createCorsResponse({
        error: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      }, 400);
    }

    // Update user verification status and mark token as used
    await DatabaseUtils.transaction(env.DB, [
      env.DB.prepare('UPDATE users SET is_verified = 1 WHERE id = ?')
        .bind(verificationRecord.user_id),
      env.DB.prepare('UPDATE email_verifications SET used = 1 WHERE id = ?')
        .bind(verificationRecord.id)
    ]);

    return createCorsResponse({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return createCorsResponse({
      error: 'Failed to verify email',
      code: 'EMAIL_VERIFICATION_ERROR'
    }, 500);
  }
});

export { authRouter };