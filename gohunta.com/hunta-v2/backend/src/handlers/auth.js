/**
 * Authentication Handler
 * Handles user registration, login, and JWT token management
 */

export async function authHandler(request, path, env) {
    const method = request.method;
    
    try {
        if (path === '/api/auth/register' && method === 'POST') {
            return await register(request, env);
        } else if (path === '/api/auth/login' && method === 'POST') {
            return await login(request, env);
        } else if (path === '/api/auth/me' && method === 'GET') {
            return await getProfile(request, env);
        } else {
            return errorResponse('Auth endpoint not found', 404);
        }
    } catch (error) {
        console.error('Auth handler error:', error);
        return errorResponse('Authentication failed', 500);
    }
}

async function register(request, env) {
    try {
        const body = await request.json();
        const { email, username, password, firstName, lastName } = body;

        // Validation
        if (!email || !username || !password) {
            return errorResponse('Email, username, and password are required', 400);
        }

        if (password.length < 6) {
            return errorResponse('Password must be at least 6 characters', 400);
        }

        // Check if database is available
        if (!env.DB) {
            return demoResponse('register', { email, username, firstName, lastName });
        }

        // Check if user exists
        const existingUser = await env.DB.prepare(`
            SELECT id FROM users WHERE email = ? OR username = ?
        `).bind(email, username).first();

        if (existingUser) {
            return errorResponse('User already exists', 409);
        }

        // Hash password (simple for demo, use bcrypt in production)
        const passwordHash = await hashPassword(password);

        // Create user
        const userId = generateId();
        await env.DB.prepare(`
            INSERT INTO users (id, email, username, password_hash, first_name, last_name)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(userId, email, username, passwordHash, firstName || '', lastName || '').run();

        // Generate JWT
        const token = await generateJWT({ userId, email, username }, env.JWT_SECRET);

        return successResponse({
            user: {
                id: userId,
                email,
                username,
                firstName: firstName || '',
                lastName: lastName || '',
                role: 'hunter'
            },
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        return errorResponse('Registration failed', 500);
    }
}

async function login(request, env) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return errorResponse('Email and password are required', 400);
        }

        // Demo mode if no database
        if (!env.DB) {
            return demoResponse('login', { email });
        }

        // Find user
        const user = await env.DB.prepare(`
            SELECT id, email, username, password_hash, first_name, last_name, role, is_active
            FROM users WHERE email = ?
        `).bind(email).first();

        if (!user || !user.is_active) {
            return errorResponse('Invalid credentials', 401);
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
            return errorResponse('Invalid credentials', 401);
        }

        // Generate JWT
        const token = await generateJWT({
            userId: user.id,
            email: user.email,
            username: user.username
        }, env.JWT_SECRET);

        return successResponse({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        return errorResponse('Login failed', 500);
    }
}

async function getProfile(request, env) {
    try {
        const token = extractToken(request);
        if (!token) {
            return errorResponse('Authentication required', 401);
        }

        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload) {
            return errorResponse('Invalid token', 401);
        }

        if (!env.DB) {
            return demoResponse('profile', payload);
        }

        const user = await env.DB.prepare(`
            SELECT id, email, username, first_name, last_name, role, created_at
            FROM users WHERE id = ? AND is_active = 1
        `).bind(payload.userId).first();

        if (!user) {
            return errorResponse('User not found', 404);
        }

        return successResponse({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                memberSince: user.created_at
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        return errorResponse('Failed to get profile', 500);
    }
}

// Utility functions
function extractToken(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

async function generateJWT(payload, secret) {
    // Simple JWT for demo (use proper JWT library in production)
    const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
    const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 86400000 })); // 24h
    return `${header}.${body}.${btoa(secret + header + body)}`;
}

async function verifyJWT(token, secret) {
    try {
        const [header, body, signature] = token.split('.');
        const expectedSignature = btoa(secret + header + body);
        
        if (signature !== expectedSignature) {
            return null;
        }

        const payload = JSON.parse(atob(body));
        if (payload.exp < Date.now()) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}

async function hashPassword(password) {
    // Simple hash for demo (use bcrypt in production)
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'hunta-salt-2025');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function verifyPassword(password, hash) {
    const computed = await hashPassword(password);
    return computed === hash;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function successResponse(data) {
    return new Response(JSON.stringify({
        success: true,
        data
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

function errorResponse(message, status = 500) {
    return new Response(JSON.stringify({
        success: false,
        error: message
    }), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

function demoResponse(action, data) {
    const mockUser = {
        id: generateId(),
        email: data.email || 'demo@hunta.com',
        username: data.username || 'demo_hunter',
        firstName: data.firstName || 'Demo',
        lastName: data.lastName || 'Hunter',
        role: 'hunter'
    };

    const token = btoa(JSON.stringify(mockUser));

    return successResponse({
        user: mockUser,
        token,
        message: `Demo ${action} successful - database not connected`
    });
}