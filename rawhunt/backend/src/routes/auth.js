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

/**
 * Social Authentication Endpoints
 * OAuth2/OpenID Connect integration for major social providers
 */

/**
 * GET /api/auth/oauth/:provider
 * Initiate OAuth2 flow for social provider
 */
authRouter.get('/oauth/:provider', async (request, env) => {
  try {
    const { provider } = request.params;
    const url = new URL(request.url);
    const redirectUri = url.searchParams.get('redirect_uri') || env.FRONTEND_URL || 'http://localhost:3000';

    // Validate provider
    const supportedProviders = ['google', 'facebook', 'apple', 'twitter', 'wechat'];
    if (!supportedProviders.includes(provider)) {
      return createCorsResponse({
        error: 'Unsupported OAuth provider',
        code: 'INVALID_PROVIDER'
      }, 400);
    }

    // Generate secure state token for CSRF protection
    const stateToken = CryptoUtils.generateSecureRandomString(32);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minute expiry

    // Store state token
    await DatabaseUtils.executeUpdate(
      env.DB,
      `INSERT INTO oauth_states (state_token, provider, redirect_uri, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [stateToken, provider, redirectUri, expiresAt.toISOString(), new Date().toISOString()]
    );

    // Build OAuth URL based on provider
    const oauthUrl = buildOAuthUrl(provider, stateToken, env);
    
    return createCorsResponse({
      success: true,
      data: {
        oauth_url: oauthUrl,
        state: stateToken,
        provider
      }
    });

  } catch (error) {
    console.error('OAuth initiation error:', error);
    return createCorsResponse({
      error: 'Failed to initiate OAuth flow',
      code: 'OAUTH_INIT_ERROR'
    }, 500);
  }
});

/**
 * GET /api/auth/oauth/:provider/callback
 * Handle OAuth2 callback from social provider
 */
authRouter.get('/oauth/:provider/callback', async (request, env) => {
  try {
    const { provider } = request.params;
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Check for OAuth error
    if (error) {
      return createCorsResponse({
        error: `OAuth error: ${error}`,
        code: 'OAUTH_ERROR'
      }, 400);
    }

    if (!code || !state) {
      return createCorsResponse({
        error: 'Missing authorization code or state',
        code: 'INVALID_CALLBACK'
      }, 400);
    }

    // Verify state token
    const stateRecord = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM oauth_states WHERE state_token = ? AND expires_at > ? AND provider = ?',
      [state, new Date().toISOString(), provider]
    );

    if (!stateRecord) {
      return createCorsResponse({
        error: 'Invalid or expired state token',
        code: 'INVALID_STATE'
      }, 400);
    }

    // Exchange code for tokens and get user data
    const socialUserData = await exchangeCodeForTokens(provider, code, env);
    
    // Find or create user
    const { user, isNewUser } = await findOrCreateSocialUser(provider, socialUserData, env);

    // Generate JWT token
    const token = CryptoUtils.generateJWT({
      userId: user.id,
      email: user.email
    }, env.JWT_SECRET);

    // Create session
    await createUserSession(env, user.id, token);

    // Clean up state token
    await DatabaseUtils.executeUpdate(
      env.DB,
      'DELETE FROM oauth_states WHERE id = ?',
      [stateRecord.id]
    );

    // Remove sensitive data
    delete user.password_hash;
    user.has_admin_access = checkAdminAccess(user, env);

    // Redirect to frontend with token
    const redirectUrl = new URL(stateRecord.redirect_uri);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('provider', provider);
    if (isNewUser) redirectUrl.searchParams.set('new_user', '1');

    return Response.redirect(redirectUrl.toString(), 302);

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    // Redirect to frontend with error
    const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';
    const errorUrl = new URL(`${frontendUrl}/auth/error`);
    errorUrl.searchParams.set('error', 'oauth_failed');
    errorUrl.searchParams.set('message', error.message || 'Authentication failed');
    
    return Response.redirect(errorUrl.toString(), 302);
  }
});

/**
 * POST /api/auth/link-social
 * Link social account to existing user
 */
authRouter.post('/link-social', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const { provider, authorization_code } = body;

    if (!provider || !authorization_code) {
      return createCorsResponse({
        error: 'Provider and authorization code are required',
        code: 'MISSING_FIELDS'
      }, 400);
    }

    // Exchange code for user data
    const socialUserData = await exchangeCodeForTokens(provider, authorization_code, env);

    // Check if social account is already linked to another user
    const existingLink = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT user_id FROM user_social_accounts WHERE provider = ? AND provider_id = ?',
      [provider, socialUserData.id]
    );

    if (existingLink && existingLink.user_id !== auth.user.id) {
      return createCorsResponse({
        error: 'This social account is already linked to another user',
        code: 'ACCOUNT_ALREADY_LINKED'
      }, 409);
    }

    // Link social account
    await linkSocialAccount(auth.user.id, provider, socialUserData, env);

    return createCorsResponse({
      success: true,
      message: `${provider} account linked successfully`
    });

  } catch (error) {
    console.error('Link social account error:', error);
    return createCorsResponse({
      error: 'Failed to link social account',
      code: 'LINK_SOCIAL_ERROR'
    }, 500);
  }
});

/**
 * DELETE /api/auth/unlink-social/:provider
 * Unlink social account from user
 */
authRouter.delete('/unlink-social/:provider', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const { provider } = request.params;

    // Check if user has password or other social accounts
    const user = await UserQueries.findById(env.DB, auth.user.id);
    const socialAccounts = await DatabaseUtils.executeQuery(
      env.DB,
      'SELECT provider FROM user_social_accounts WHERE user_id = ? AND is_active = 1',
      [auth.user.id]
    );

    // Prevent unlinking if it's the only authentication method
    if (!user.password_hash && socialAccounts.length <= 1) {
      return createCorsResponse({
        error: 'Cannot unlink last authentication method. Set a password first.',
        code: 'LAST_AUTH_METHOD'
      }, 400);
    }

    // Unlink social account
    await DatabaseUtils.executeUpdate(
      env.DB,
      'UPDATE user_social_accounts SET is_active = 0 WHERE user_id = ? AND provider = ?',
      [auth.user.id, provider]
    );

    return createCorsResponse({
      success: true,
      message: `${provider} account unlinked successfully`
    });

  } catch (error) {
    console.error('Unlink social account error:', error);
    return createCorsResponse({
      error: 'Failed to unlink social account',
      code: 'UNLINK_SOCIAL_ERROR'
    }, 500);
  }
});

/**
 * GET /api/auth/social-accounts
 * Get user's linked social accounts
 */
authRouter.get('/social-accounts', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const socialAccounts = await DatabaseUtils.executeQuery(
      env.DB,
      'SELECT provider, provider_email, provider_name, provider_avatar, created_at FROM user_social_accounts WHERE user_id = ? AND is_active = 1',
      [auth.user.id]
    );

    // Check if user has password set
    const user = await UserQueries.findById(env.DB, auth.user.id);
    const hasPassword = !!user.password_hash;

    return createCorsResponse({
      success: true,
      data: {
        social_accounts: socialAccounts,
        has_password: hasPassword,
        available_providers: ['google', 'facebook', 'apple', 'twitter', 'wechat']
      }
    });

  } catch (error) {
    console.error('Get social accounts error:', error);
    return createCorsResponse({
      error: 'Failed to get social accounts',
      code: 'SOCIAL_ACCOUNTS_ERROR'
    }, 500);
  }
});

/**
 * Helper Functions for OAuth Implementation
 */

function buildOAuthUrl(provider, state, env) {
  const baseUrls = {
    google: 'https://accounts.google.com/o/oauth2/v2/auth',
    facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
    apple: 'https://appleid.apple.com/auth/authorize',
    twitter: 'https://twitter.com/i/oauth2/authorize',
    wechat: 'https://open.weixin.qq.com/connect/qrconnect'
  };

  const redirectUri = `${env.BACKEND_URL || 'https://your-domain.com'}/api/auth/oauth/${provider}/callback`;
  
  const params = new URLSearchParams({
    response_type: 'code',
    state,
    redirect_uri: redirectUri
  });

  // Provider-specific parameters
  switch (provider) {
    case 'google':
      params.set('client_id', env.GOOGLE_CLIENT_ID);
      params.set('scope', 'openid email profile');
      params.set('access_type', 'offline');
      break;
    
    case 'facebook':
      params.set('client_id', env.FACEBOOK_APP_ID);
      params.set('scope', 'email,public_profile');
      break;
    
    case 'apple':
      params.set('client_id', env.APPLE_CLIENT_ID);
      params.set('scope', 'name email');
      params.set('response_mode', 'form_post');
      break;
    
    case 'twitter':
      params.set('client_id', env.TWITTER_CLIENT_ID);
      params.set('scope', 'tweet.read users.read offline.access');
      params.set('code_challenge_method', 'S256');
      // Twitter requires PKCE, would need to implement code_challenge
      break;
    
    case 'wechat':
      params.set('appid', env.WECHAT_APP_ID);
      params.set('scope', 'snsapi_login');
      params.delete('response_type'); // WeChat uses different param name
      params.set('response_type', 'code');
      break;
  }

  return `${baseUrls[provider]}?${params.toString()}`;
}

async function exchangeCodeForTokens(provider, code, env) {
  const redirectUri = `${env.BACKEND_URL || 'https://your-domain.com'}/api/auth/oauth/${provider}/callback`;

  switch (provider) {
    case 'google':
      return await exchangeGoogleCode(code, redirectUri, env);
    
    case 'facebook':
      return await exchangeFacebookCode(code, redirectUri, env);
    
    case 'apple':
      return await exchangeAppleCode(code, redirectUri, env);
    
    case 'twitter':
      return await exchangeTwitterCode(code, redirectUri, env);
    
    case 'wechat':
      return await exchangeWeChatCode(code, redirectUri, env);
    
    default:
      throw new Error(`Token exchange for ${provider} not implemented`);
  }
}

async function exchangeGoogleCode(code, redirectUri, env) {
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Google token exchange failed: ${error}`);
    }

    const tokens = await tokenResponse.json();

    // Get user profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch Google profile');
    }

    const profile = await profileResponse.json();

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      given_name: profile.given_name,
      family_name: profile.family_name,
      picture: profile.picture,
      verified_email: profile.verified_email
    };

  } catch (error) {
    console.error('Google OAuth error:', error);
    throw new Error(`Google authentication failed: ${error.message}`);
  }
}

async function exchangeFacebookCode(code, redirectUri, env) {
  try {
    if (!env.FACEBOOK_APP_ID || !env.FACEBOOK_APP_SECRET) {
      throw new Error('Facebook OAuth credentials not configured');
    }

    // Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${env.FACEBOOK_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${env.FACEBOOK_APP_SECRET}` +
      `&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      throw new Error(tokenData.error?.message || 'Failed to exchange Facebook code');
    }

    // Get user profile
    const profileResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`
    );
    const profile = await profileResponse.json();

    if (!profileResponse.ok || profile.error) {
      throw new Error(profile.error?.message || 'Failed to get Facebook profile');
    }

    return {
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture?.data?.url,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null
    };

  } catch (error) {
    console.error('Facebook OAuth error:', error);
    throw new Error(`Facebook authentication failed: ${error.message}`);
  }
}

async function exchangeAppleCode(code, redirectUri, env) {
  try {
    // Apple Sign-In requires JWT client assertion
    // Implementation would be more complex due to Apple's requirements
    throw new Error('Apple Sign-In implementation pending - requires Apple Developer account and certificates');

  } catch (error) {
    console.error('Apple OAuth error:', error);
    throw new Error(`Apple authentication failed: ${error.message}`);
  }
}

async function exchangeTwitterCode(code, redirectUri, env) {
  try {
    if (!env.TWITTER_CLIENT_ID || !env.TWITTER_CLIENT_SECRET) {
      throw new Error('Twitter OAuth credentials not configured');
    }

    // Twitter OAuth 2.0 with PKCE - would need code_verifier from initial request
    // For now, provide structured error with implementation guidance
    throw new Error('Twitter OAuth 2.0 requires PKCE implementation - need to store code_verifier during authorization');

  } catch (error) {
    console.error('Twitter OAuth error:', error);
    throw new Error(`Twitter authentication failed: ${error.message}`);
  }
}

async function exchangeWeChatCode(code, redirectUri, env) {
  try {
    if (!env.WECHAT_APP_ID || !env.WECHAT_APP_SECRET) {
      throw new Error('WeChat OAuth credentials not configured');
    }

    // Exchange code for access token
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?` +
      `appid=${env.WECHAT_APP_ID}` +
      `&secret=${env.WECHAT_APP_SECRET}` +
      `&code=${code}` +
      `&grant_type=authorization_code`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.errcode) {
      throw new Error(`WeChat API Error ${tokenData.errcode}: ${tokenData.errmsg}`);
    }

    // Get user profile
    const profileResponse = await fetch(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=en`
    );
    const profile = await profileResponse.json();

    if (profile.errcode) {
      throw new Error(`WeChat Profile Error ${profile.errcode}: ${profile.errmsg}`);
    }

    return {
      providerId: profile.openid,
      email: null, // WeChat doesn't provide email
      name: profile.nickname,
      avatarUrl: profile.headimgurl,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null
    };

  } catch (error) {
    console.error('WeChat OAuth error:', error);
    throw new Error(`WeChat authentication failed: ${error.message}`);
  }
}

async function findOrCreateSocialUser(provider, socialData, env) {
  // Check if user exists by provider ID
  let socialAccount = await DatabaseUtils.executeQueryFirst(
    env.DB,
    'SELECT user_id FROM user_social_accounts WHERE provider = ? AND provider_id = ? AND is_active = 1',
    [provider, socialData.id]
  );

  if (socialAccount) {
    // User exists, return existing user
    const user = await UserQueries.findById(env.DB, socialAccount.user_id);
    return { user, isNewUser: false };
  }

  // Check if user exists by email (for account linking)
  let user = null;
  if (socialData.email) {
    user = await UserQueries.findByEmail(env.DB, socialData.email);
  }

  if (user) {
    // Link social account to existing user
    await linkSocialAccount(user.id, provider, socialData, env);
    return { user, isNewUser: false };
  }

  // Create new user
  const userId = await UserQueries.create(env.DB, {
    email: socialData.email || `${provider}_${socialData.id}@social.rawgle.com`,
    passwordHash: null, // Social-only account
    firstName: socialData.given_name || socialData.first_name || '',
    lastName: socialData.family_name || socialData.last_name || '',
    phoneNumber: null,
    locationLatitude: null,
    locationLongitude: null,
    locationAddress: null
  });

  // Award welcome bonus
  const welcomeBonus = 100;
  await UserQueries.updatePawsBalance(env.DB, userId, welcomeBonus);
  
  await TransactionQueries.create(env.DB, {
    userId,
    type: 'earned',
    amount: welcomeBonus,
    description: `Welcome bonus (${provider} signup)`,
    referenceType: 'bonus',
    balanceAfter: welcomeBonus
  });

  // Link social account
  await linkSocialAccount(userId, provider, socialData, env);

  // Get the created user
  user = await UserQueries.findById(env.DB, userId);
  return { user, isNewUser: true };
}

async function linkSocialAccount(userId, provider, socialData, env) {
  return await DatabaseUtils.executeUpdate(
    env.DB,
    `INSERT OR REPLACE INTO user_social_accounts 
     (user_id, provider, provider_id, provider_email, provider_name, provider_avatar, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      userId,
      provider,
      socialData.id,
      socialData.email,
      socialData.name || `${socialData.given_name} ${socialData.family_name}`.trim(),
      socialData.picture || socialData.avatar,
      new Date().toISOString(),
      new Date().toISOString()
    ]
  );
}

export { authRouter };