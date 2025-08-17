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
    const tokenHash = CryptoUtils.generateTokenHash(token);
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
  const tokenHash = CryptoUtils.generateTokenHash(token);
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
  const tokenHash = CryptoUtils.generateTokenHash(token);
  
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