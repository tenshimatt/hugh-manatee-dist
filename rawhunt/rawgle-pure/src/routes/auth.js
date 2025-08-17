import { validateEmail, validatePassword, validateSolanaAddress, sanitizeInput } from '../lib/validation.js';
import { v4 as uuidv4 } from 'uuid';

// Constants
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

// BCrypt-like implementation for Cloudflare Workers
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'rawgle_salt_2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// JWT-like token generation
async function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  const message = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${message}.${encodedSignature}`;
}

async function verifyJWT(token, secret) {
  try {
    const [header, payload, signature] = token.split('.');
    const message = `${header}.${payload}`;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, encoder.encode(message));
    
    if (!isValid) return null;
    
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check expiration
    if (decodedPayload.exp && Date.now() > decodedPayload.exp * 1000) {
      return null;
    }
    
    return decodedPayload;
  } catch (error) {
    return null;
  }
}

// Rate limiting for auth attempts
async function checkRateLimit(email, env) {
  const key = `auth_attempts:${email}`;
  const attempts = await env.SESSIONS.get(key);
  
  if (!attempts) return { allowed: true, remaining: RATE_LIMIT_ATTEMPTS };
  
  const attemptData = JSON.parse(attempts);
  const now = Date.now();
  
  // Reset if window has passed
  if (now - attemptData.firstAttempt > RATE_LIMIT_WINDOW) {
    await env.SESSIONS.delete(key);
    return { allowed: true, remaining: RATE_LIMIT_ATTEMPTS };
  }
  
  if (attemptData.count >= RATE_LIMIT_ATTEMPTS) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: attemptData.firstAttempt + RATE_LIMIT_WINDOW
    };
  }
  
  return { allowed: true, remaining: RATE_LIMIT_ATTEMPTS - attemptData.count };
}

async function recordFailedAttempt(email, env) {
  const key = `auth_attempts:${email}`;
  const existing = await env.SESSIONS.get(key);
  const now = Date.now();
  
  let attemptData;
  if (existing) {
    attemptData = JSON.parse(existing);
    if (now - attemptData.firstAttempt > RATE_LIMIT_WINDOW) {
      attemptData = { count: 1, firstAttempt: now };
    } else {
      attemptData.count += 1;
    }
  } else {
    attemptData = { count: 1, firstAttempt: now };
  }
  
  await env.SESSIONS.put(key, JSON.stringify(attemptData), {
    expirationTtl: Math.floor(RATE_LIMIT_WINDOW / 1000)
  });
}

async function clearFailedAttempts(email, env) {
  const key = `auth_attempts:${email}`;
  await env.SESSIONS.delete(key);
}

// User registration
async function registerUser(request, env) {
  try {
    const body = await request.json();
    const { email, password, walletAddress } = body;
    
    // Validate input
    if (!email || !password) {
      return new Response(JSON.stringify({ 
        error: 'Email and password are required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    
    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid email format' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate password strength
    if (!validatePassword(password)) {
      return new Response(JSON.stringify({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate wallet address if provided
    if (walletAddress && !validateSolanaAddress(walletAddress)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid Solana wallet address' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if user already exists
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ? OR wallet_address = ?'
    ).bind(sanitizedEmail, walletAddress || null).first();
    
    if (existingUser) {
      return new Response(JSON.stringify({ 
        error: 'User with this email or wallet already exists' 
      }), { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Generate user ID
    const userId = uuidv4();
    
    // Create user with welcome bonus
    const welcomeBonus = 50;
    await env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, wallet_address, paws_balance) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(userId, sanitizedEmail, passwordHash, walletAddress || null, welcomeBonus).run();
    
    // Create session token
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
    
    // Store session in KV
    await env.SESSIONS.put(sessionToken, JSON.stringify({
      userId,
      email: sanitizedEmail,
      createdAt: new Date().toISOString(),
      expiresAt
    }), {
      expirationTtl: Math.floor(SESSION_DURATION / 1000)
    });
    
    // Record PAWS welcome bonus transaction
    await env.DB.prepare(`
      INSERT INTO paws_transactions (id, user_id, amount, transaction_type, description, status) 
      VALUES (?, ?, ?, 'reward', 'Welcome bonus', 'completed')
    `).bind(uuidv4(), userId, welcomeBonus).run();
    
    return new Response(JSON.stringify({
      userId,
      email: sanitizedEmail,
      sessionToken,
      pawsBalance: welcomeBonus,
      walletAddress: walletAddress || null
    }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// User login
async function loginUser(request, env) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return new Response(JSON.stringify({ 
        error: 'Email and password are required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    
    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(sanitizedEmail, env);
    if (!rateLimitCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Too many attempts. Please try again later.' 
      }), { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get user from database
    const user = await env.DB.prepare(
      'SELECT id, email, password_hash, paws_balance FROM users WHERE email = ?'
    ).bind(sanitizedEmail).first();
    
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      await recordFailedAttempt(sanitizedEmail, env);
      return new Response(JSON.stringify({ 
        error: 'Invalid credentials' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Clear failed attempts on successful login
    await clearFailedAttempts(sanitizedEmail, env);
    
    // Create session token
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
    
    // Store session in KV
    await env.SESSIONS.put(sessionToken, JSON.stringify({
      userId: user.id,
      email: user.email,
      createdAt: new Date().toISOString(),
      expiresAt
    }), {
      expirationTtl: Math.floor(SESSION_DURATION / 1000)
    });
    
    return new Response(JSON.stringify({
      userId: user.id,
      email: user.email,
      sessionToken,
      pawsBalance: user.paws_balance
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Validate session
async function validateSession(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Missing or invalid authorization header' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.substring(7);
    const sessionData = await env.SESSIONS.get(token);
    
    if (!sessionData) {
      return new Response(JSON.stringify({ 
        error: 'Invalid or expired session' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const session = JSON.parse(sessionData);
    
    // Check if session is expired
    if (new Date() > new Date(session.expiresAt)) {
      await env.SESSIONS.delete(token);
      return new Response(JSON.stringify({ 
        error: 'Session expired' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      valid: true,
      userId: session.userId,
      email: session.email
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Session validation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Logout user
async function logoutUser(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Missing or invalid authorization header' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.substring(7);
    await env.SESSIONS.delete(token);
    
    return new Response(JSON.stringify({
      message: 'Successfully logged out'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Link Solana wallet
async function linkWallet(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Missing or invalid authorization header' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.substring(7);
    const sessionData = await env.SESSIONS.get(token);
    
    if (!sessionData) {
      return new Response(JSON.stringify({ 
        error: 'Invalid or expired session' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const session = JSON.parse(sessionData);
    const body = await request.json();
    const { walletAddress, signature } = body;
    
    if (!walletAddress || !signature) {
      return new Response(JSON.stringify({ 
        error: 'Wallet address and signature are required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!validateSolanaAddress(walletAddress)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid Solana wallet address' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if wallet is already linked to another user
    const existingWallet = await env.DB.prepare(
      'SELECT id FROM users WHERE wallet_address = ? AND id != ?'
    ).bind(walletAddress, session.userId).first();
    
    if (existingWallet) {
      return new Response(JSON.stringify({ 
        error: 'Wallet already linked to another account' 
      }), { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Update user with wallet address
    await env.DB.prepare(
      'UPDATE users SET wallet_address = ? WHERE id = ?'
    ).bind(walletAddress, session.userId).run();
    
    // Check if user holds NFTs (mock implementation)
    const nftHolderStatus = {
      hasNFTs: Math.random() > 0.5, // Mock NFT check
      nftCount: Math.floor(Math.random() * 10)
    };
    
    return new Response(JSON.stringify({
      walletLinked: true,
      walletAddress,
      nftHolderStatus
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Wallet linking error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Main handler
export default async function handleAuth(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    let response;
    
    if (path.endsWith('/register') && request.method === 'POST') {
      response = await registerUser(request, env);
    } else if (path.endsWith('/login') && request.method === 'POST') {
      response = await loginUser(request, env);
    } else if (path.endsWith('/validate') && request.method === 'GET') {
      response = await validateSession(request, env);
    } else if (path.endsWith('/logout') && request.method === 'POST') {
      response = await logoutUser(request, env);
    } else if (path.endsWith('/link-wallet') && request.method === 'POST') {
      response = await linkWallet(request, env);
    } else {
      response = new Response(JSON.stringify({ 
        error: 'Not found' 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
    
  } catch (error) {
    console.error('Auth handler error:', error);
    const response = new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}