import { CryptoUtils } from '../utils/crypto.js';
import { DatabaseUtils } from '../utils/database.js';

/**
 * Authentication middleware
 */

export async function authenticateUser(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Missing or invalid authorization header', status: 401 };
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const payload = CryptoUtils.verifyJWT(token, env.JWT_SECRET);
    
    // Check if token is blacklisted
    const tokenHash = await CryptoUtils.generateTokenHash(token);
    const blacklistedToken = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT id FROM user_sessions WHERE token_hash = ? AND is_revoked = 1',
      [tokenHash]
    );

    if (blacklistedToken) {
      return { error: 'Token has been revoked', status: 401 };
    }

    // Check if token has expired
    const session = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM user_sessions WHERE token_hash = ? AND expires_at > ?',
      [tokenHash, new Date().toISOString()]
    );

    if (!session) {
      return { error: 'Token has expired', status: 401 };
    }

    // Get user data
    const user = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM users WHERE id = ?',
      [payload.userId]
    );

    if (!user) {
      return { error: 'User not found', status: 401 };
    }

    // Add admin bypass capability
    user.has_admin_access = checkAdminAccess(user, env);

    return { user, token };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Invalid token', status: 401 };
  }
}

export async function requireAuth(request, env) {
  const auth = await authenticateUser(request, env);
  
  if (auth.error) {
    return new Response(JSON.stringify({ 
      error: auth.error,
      code: 'UNAUTHORIZED'
    }), {
      status: auth.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return auth;
}

export async function requireAdmin(request, env) {
  const auth = await authenticateUser(request, env);
  
  if (auth.error) {
    return new Response(JSON.stringify({ 
      error: auth.error,
      code: 'UNAUTHORIZED'
    }), {
      status: auth.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!auth.user.is_admin) {
    return new Response(JSON.stringify({ 
      error: 'Admin access required',
      code: 'FORBIDDEN'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return auth;
}

export async function optionalAuth(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null };
    }

    const auth = await authenticateUser(request, env);
    return auth.error ? { user: null } : auth;
  } catch (error) {
    return { user: null };
  }
}

export async function createUserSession(env, userId, token) {
  const tokenHash = await CryptoUtils.generateTokenHash(token);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

  await DatabaseUtils.executeUpdate(
    env.DB,
    `INSERT INTO user_sessions (user_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?)`,
    [userId, tokenHash, expiresAt.toISOString(), new Date().toISOString()]
  );
}

export async function revokeUserSession(env, token) {
  const tokenHash = await CryptoUtils.generateTokenHash(token);
  
  await DatabaseUtils.executeUpdate(
    env.DB,
    'UPDATE user_sessions SET is_revoked = 1 WHERE token_hash = ?',
    [tokenHash]
  );
}

export async function cleanupExpiredSessions(env) {
  const now = new Date().toISOString();
  
  await DatabaseUtils.executeUpdate(
    env.DB,
    'DELETE FROM user_sessions WHERE expires_at < ? OR is_revoked = 1',
    [now]
  );
}

/**
 * Check if user has admin access (bypass all restrictions)
 * Multiple methods to grant admin access for development/testing
 */
export function checkAdminAccess(user, env) {
  // Method 1: Database role-based admin
  if (user.role === 'admin' || user.is_admin) {
    return true;
  }

  // Method 2: Environment variable for master admin emails
  const adminEmails = (env.ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase());
  if (adminEmails.includes(user.email?.toLowerCase())) {
    return true;
  }

  // Method 3: Development bypass - any authenticated user gets admin access
  if (env.ENVIRONMENT === 'development' || env.BYPASS_AUTH === 'true') {
    return true;
  }

  // Method 4: Specific user IDs that always have admin access
  const adminUserIds = (env.ADMIN_USER_IDS || '').split(',').map(id => id.trim());
  if (adminUserIds.includes(user.id)) {
    return true;
  }

  return false;
}

/**
 * Enhanced requireAuth that includes admin bypass
 * Users with admin access can access any endpoint
 */
export async function requireAuthWithBypass(request, env) {
  const auth = await authenticateUser(request, env);
  
  if (auth.error) {
    return new Response(JSON.stringify({ 
      error: auth.error,
      code: 'UNAUTHORIZED'
    }), {
      status: auth.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Add admin bypass flag to the response
  auth.user.admin_bypass_active = auth.user.has_admin_access;
  
  return auth;
}

/**
 * Flexible auth middleware that allows admin bypass for ownership checks
 */
export async function requireOwnershipOrAdmin(request, env, resourceUserId) {
  const auth = await requireAuthWithBypass(request, env);
  
  if (auth instanceof Response) return auth; // Auth failed
  
  // Admin bypass - can access any resource
  if (auth.user.has_admin_access) {
    return auth;
  }
  
  // Regular ownership check
  if (auth.user.id !== resourceUserId) {
    return new Response(JSON.stringify({ 
      error: 'Access denied - resource not owned by user',
      code: 'FORBIDDEN'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return auth;
}

/**
 * Dog ownership check with admin bypass
 */
export async function requireDogOwnershipOrAdmin(request, env, dogId) {
  const auth = await requireAuthWithBypass(request, env);
  
  if (auth instanceof Response) return auth; // Auth failed
  
  // Admin bypass - can access any dog
  if (auth.user.has_admin_access) {
    // Get dog info for admin context
    const dog = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT id, name, owner_id FROM dogs WHERE id = ? AND is_active = TRUE',
      [dogId]
    );
    
    if (!dog) {
      return new Response(JSON.stringify({ 
        error: 'Pet not found',
        code: 'PET_NOT_FOUND'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    auth.dog = dog;
    auth.admin_accessing_other_user_data = dog.owner_id !== auth.user.id;
    return auth;
  }
  
  // Regular ownership check
  const dog = await DatabaseUtils.executeQueryFirst(
    env.DB,
    'SELECT id, name FROM dogs WHERE id = ? AND owner_id = ? AND is_active = TRUE',
    [dogId, auth.user.id]
  );

  if (!dog) {
    return new Response(JSON.stringify({ 
      error: 'Pet not found or access denied',
      code: 'PET_NOT_FOUND'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  auth.dog = dog;
  return auth;
}