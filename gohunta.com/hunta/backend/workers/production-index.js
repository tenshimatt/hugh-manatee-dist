/**
 * Hunta Backend - Production Cloudflare Worker
 * Optimized for Workers runtime environment
 */

class HuntaAPI {
    constructor(env) {
        this.env = env;
        this.db = env.DB || null;
        this.cache = env.CACHE || null;
        this.media = env.MEDIA || null;
    }

    async handleRequest(request) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;

        // Add CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // Handle CORS preflight
        if (method === 'OPTIONS') {
            return new Response(null, { status: 200, headers: corsHeaders });
        }

        try {
            let response;

            // Route handling
            if (path === '/health') {
                response = this.healthCheck();
            } else if (path.startsWith('/api/auth/')) {
                response = this.handleAuth(request, path);
            } else if (path.startsWith('/api/users/')) {
                response = this.handleUsers(request, path);
            } else if (path.startsWith('/api/dogs/')) {
                response = this.handleDogs(request, path);
            } else if (path.startsWith('/api/routes/')) {
                response = this.handleRoutes(request, path);
            } else if (path.startsWith('/api/events/')) {
                response = this.handleEvents(request, path);
            } else if (path.startsWith('/api/gear/')) {
                response = this.handleGear(request, path);
            } else if (path.startsWith('/api/ethics/')) {
                response = this.handleEthics(request, path);
            } else if (path.startsWith('/api/posts/')) {
                response = this.handlePosts(request, path);
            } else if (path.startsWith('/api/training/')) {
                response = this.handleTraining(request, path);
            } else if (path.startsWith('/api/')) {
                response = new Response(JSON.stringify({
                    success: false,
                    error: 'API endpoint not found'
                }), { status: 404 });
            } else {
                response = this.serveFrontend();
            }

            // Add CORS headers to response
            Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
            });

            return response;

        } catch (error) {
            console.error('Request handling error:', error);
            return new Response(JSON.stringify({
                success: false,
                error: 'Internal server error'
            }), {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    }

    healthCheck() {
        return new Response(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: this.env.ENVIRONMENT || 'production'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    async handleAuth(request, path) {
        const method = request.method;
        
        if (path === '/api/auth/register' && method === 'POST') {
            return this.register(request);
        } else if (path === '/api/auth/login' && method === 'POST') {
            return this.login(request);
        } else {
            return new Response(JSON.stringify({
                success: false,
                error: 'Auth endpoint not implemented yet'
            }), { status: 501, headers: { 'Content-Type': 'application/json' } });
        }
    }

    async register(request) {
        try {
            const body = await request.json();
            const { email, username, password, firstName, lastName, role = 'hunter' } = body;

            if (!email || !username || !password) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Email, username, and password are required'
                }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            // If no database, return demo response
            if (!this.db) {
                const userId = this.generateId();
                const token = btoa(JSON.stringify({ 
                    userId, 
                    email, 
                    username 
                }));
                
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        user: {
                            id: userId,
                            email,
                            username,
                            firstName: firstName || '',
                            lastName: lastName || '',
                            role
                        },
                        token,
                        message: 'Registration successful (demo mode - no database)'
                    }
                }), { headers: { 'Content-Type': 'application/json' } });
            }

            // Generate a unique ID
            const userId = this.generateId();
            
            // Simple password hash for demo (in production, use proper hashing)
            const passwordHash = btoa(password);

            // Insert user (let ID auto-generate)
            const result = await this.db.prepare(`
                INSERT INTO users (email, username, password_hash, first_name, last_name, role)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(email, username, passwordHash, firstName || '', lastName || '', role).run();
            
            // Get the generated ID
            const newUser = await this.db.prepare(`
                SELECT id, email, username, first_name, last_name, role 
                FROM users 
                WHERE email = ? 
                LIMIT 1
            `).bind(email).first();

            // Generate a simple JWT token
            const token = btoa(JSON.stringify({ 
                userId: newUser.id, 
                email: newUser.email, 
                username: newUser.username 
            }));

            return new Response(JSON.stringify({
                success: true,
                data: {
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        username: newUser.username,
                        firstName: newUser.first_name,
                        lastName: newUser.last_name,
                        role: newUser.role
                    },
                    token,
                    message: 'Registration successful'
                }
            }), { headers: { 'Content-Type': 'application/json' } });

        } catch (error) {
            console.error('Registration error:', error);
            return new Response(JSON.stringify({
                success: false,
                error: 'Registration failed: ' + error.message
            }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }

    async login(request) {
        try {
            const body = await request.json();
            const { email, password } = body;

            if (!email || !password) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Email and password are required'
                }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            // Find user
            const user = await this.db.prepare(
                'SELECT * FROM users WHERE email = ? AND is_active = 1'
            ).bind(email).first();

            if (!user) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Invalid credentials'
                }), { status: 401, headers: { 'Content-Type': 'application/json' } });
            }

            // Verify password (simplified for demo)
            const isValid = user.password_hash === btoa(password);
            if (!isValid) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Invalid credentials'
                }), { status: 401, headers: { 'Content-Type': 'application/json' } });
            }

            // Generate a simple JWT token
            const token = btoa(JSON.stringify({ 
                userId: user.id, 
                email: user.email, 
                username: user.username 
            }));

            return new Response(JSON.stringify({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        role: user.role
                    },
                    token
                }
            }), { headers: { 'Content-Type': 'application/json' } });

        } catch (error) {
            console.error('Login error:', error);
            return new Response(JSON.stringify({
                success: false,
                error: 'Login failed'
            }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }

    async handleUsers(request, path) {
        const method = request.method;
        
        try {
            if (path === '/api/users/profile' && method === 'GET') {
                // Get user profile
                const token = this.extractToken(request);
                if (!token) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Authentication required'
                    }), { status: 401, headers: { 'Content-Type': 'application/json' } });
                }
                
                const user = this.decodeToken(token);
                const profile = await this.db.prepare(`
                    SELECT id, email, username, first_name, last_name, role, created_at
                    FROM users WHERE id = ?
                `).bind(user.userId).first();
                
                return new Response(JSON.stringify({
                    success: true,
                    data: profile
                }), { headers: { 'Content-Type': 'application/json' } });
                
            } else if (path === '/api/users/profile' && method === 'PUT') {
                // Update user profile
                const token = this.extractToken(request);
                if (!token) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Authentication required'
                    }), { status: 401, headers: { 'Content-Type': 'application/json' } });
                }
                
                const user = this.decodeToken(token);
                const body = await request.json();
                const { firstName, lastName } = body;
                
                await this.db.prepare(`
                    UPDATE users 
                    SET first_name = ?, last_name = ?, updated_at = datetime('now')
                    WHERE id = ?
                `).bind(firstName || '', lastName || '', user.userId).run();
                
                return new Response(JSON.stringify({
                    success: true,
                    message: 'Profile updated successfully'
                }), { headers: { 'Content-Type': 'application/json' } });
                
            } else {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'User endpoint not found'
                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }
        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: 'User operation failed'
            }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }

    async handleDogs(request, path) {
        const method = request.method;
        
        try {
            if (path === '/api/dogs/list' && method === 'GET') {
                // Get user's dogs
                const token = this.extractToken(request);
                if (!token) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Authentication required'
                    }), { status: 401, headers: { 'Content-Type': 'application/json' } });
                }
                
                if (!this.db) {
                    return new Response(JSON.stringify({
                        success: true,
                        data: [
                            { id: '1', name: 'Demo Dog', breed: 'Labrador', age: 3, training_level: 'advanced', description: 'Demo data - database not connected' }
                        ]
                    }), { headers: { 'Content-Type': 'application/json' } });
                }
                
                const user = this.decodeToken(token);
                const dogs = await this.db.prepare(`
                    SELECT id, name, breed, age, training_level, description, created_at
                    FROM dogs WHERE user_id = ? ORDER BY created_at DESC
                `).bind(user.userId).all();
                
                return new Response(JSON.stringify({
                    success: true,
                    data: dogs.results || []
                }), { headers: { 'Content-Type': 'application/json' } });
                
            } else if (path === '/api/dogs/add' && method === 'POST') {
                // Add new dog
                const token = this.extractToken(request);
                if (!token) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Authentication required'
                    }), { status: 401, headers: { 'Content-Type': 'application/json' } });
                }
                
                const user = this.decodeToken(token);
                const body = await request.json();
                const { name, breed, age, trainingLevel, description } = body;
                
                if (!name || !breed) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Name and breed are required'
                    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }
                
                const dogId = this.generateId();
                await this.db.prepare(`
                    INSERT INTO dogs (id, user_id, name, breed, age, training_level, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).bind(dogId, user.userId, name, breed, age || 0, trainingLevel || 'beginner', description || '').run();
                
                return new Response(JSON.stringify({
                    success: true,
                    message: 'Dog added successfully',
                    data: { id: dogId, name, breed }
                }), { headers: { 'Content-Type': 'application/json' } });
                
            } else {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Dogs endpoint not found'
                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }
        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Dogs operation failed'
            }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }

    async handleRoutes(request, path) {
        const method = request.method;
        
        try {
            if (path === '/api/routes/list' && method === 'GET') {
                // Get user's hunting routes
                const token = this.extractToken(request);
                if (!token) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Authentication required'
                    }), { status: 401, headers: { 'Content-Type': 'application/json' } });
                }
                
                const user = this.decodeToken(token);
                const routes = await this.db.prepare(`
                    SELECT id, name, description, waypoints, distance_km, difficulty, created_at
                    FROM hunt_routes WHERE user_id = ? ORDER BY created_at DESC
                `).bind(user.userId).all();
                
                return new Response(JSON.stringify({
                    success: true,
                    data: routes.results || []
                }), { headers: { 'Content-Type': 'application/json' } });
                
            } else if (path === '/api/routes/add' && method === 'POST') {
                // Add new hunting route
                const token = this.extractToken(request);
                if (!token) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Authentication required'
                    }), { status: 401, headers: { 'Content-Type': 'application/json' } });
                }
                
                const user = this.decodeToken(token);
                const body = await request.json();
                const { name, description, waypoints, distanceKm, difficulty } = body;
                
                if (!name || !waypoints) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Name and waypoints are required'
                    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }
                
                const routeId = this.generateId();
                await this.db.prepare(`
                    INSERT INTO hunt_routes (id, user_id, name, description, waypoints, distance_km, difficulty)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).bind(routeId, user.userId, name, description || '', JSON.stringify(waypoints), distanceKm || 0, difficulty || 'moderate').run();
                
                return new Response(JSON.stringify({
                    success: true,
                    message: 'Route added successfully',
                    data: { id: routeId, name }
                }), { headers: { 'Content-Type': 'application/json' } });
                
            } else {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Routes endpoint not found'
                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }
        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Routes operation failed'
            }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }

    async handleEvents(request, path) {
        const method = request.method;
        
        try {
            if (path === '/api/events/list' && method === 'GET') {
                // Get upcoming events
                if (!this.db) {
                    return new Response(JSON.stringify({
                        success: true,
                        data: [
                            { id: '1', title: 'Demo Hunt Trial', description: 'Demo event - database not connected', event_date: '2025-08-15', location: 'Demo Location', event_type: 'trial' }
                        ]
                    }), { headers: { 'Content-Type': 'application/json' } });
                }
                
                const events = await this.db.prepare(`
                    SELECT id, title, description, event_date, location, event_type, created_at
                    FROM events WHERE event_date >= date('now') 
                    ORDER BY event_date ASC LIMIT 50
                `).all();
                
                return new Response(JSON.stringify({
                    success: true,
                    data: events.results || []
                }), { headers: { 'Content-Type': 'application/json' } });
                
            } else if (path === '/api/events/add' && method === 'POST') {
                // Add new event (requires authentication)
                const token = this.extractToken(request);
                if (!token) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Authentication required'
                    }), { status: 401, headers: { 'Content-Type': 'application/json' } });
                }
                
                const user = this.decodeToken(token);
                const body = await request.json();
                const { title, description, eventDate, location, eventType } = body;
                
                if (!title || !eventDate || !location) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Title, event date, and location are required'
                    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }
                
                const eventId = this.generateId();
                await this.db.prepare(`
                    INSERT INTO events (id, organizer_id, title, description, event_date, location, event_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).bind(eventId, user.userId, title, description || '', eventDate, location, eventType || 'trial').run();
                
                return new Response(JSON.stringify({
                    success: true,
                    message: 'Event added successfully',
                    data: { id: eventId, title }
                }), { headers: { 'Content-Type': 'application/json' } });
                
            } else {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Events endpoint not found'
                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }
        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Events operation failed'
            }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }

    async handleGear(request, path) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Gear endpoint not implemented yet'
        }), { status: 501, headers: { 'Content-Type': 'application/json' } });
    }

    async handleEthics(request, path) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Ethics endpoint not implemented yet'
        }), { status: 501, headers: { 'Content-Type': 'application/json' } });
    }

    async handlePosts(request, path) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Posts endpoint not implemented yet'
        }), { status: 501, headers: { 'Content-Type': 'application/json' } });
    }

    async handleTraining(request, path) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Training endpoint not implemented yet'
        }), { status: 501, headers: { 'Content-Type': 'application/json' } });
    }

    generateId() {
        // Generate a simple unique ID
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    extractToken(request) {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }

    decodeToken(token) {
        try {
            const decoded = JSON.parse(atob(token));
            return decoded;
        } catch (error) {
            return null;
        }
    }

    serveFrontend() {
        return new Response(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Hunta - Elite Dog Hunting Platform</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { font-family: Inter, sans-serif; margin: 0; padding: 2rem; background: #f9fafb; }
                        .container { max-width: 800px; margin: 0 auto; text-align: center; }
                        .logo { font-size: 3rem; font-weight: bold; color: #2d5530; margin-bottom: 1rem; }
                        .tagline { font-size: 1.2rem; color: #6b7280; margin-bottom: 2rem; }
                        .status { background: #10b981; color: white; padding: 1rem 2rem; border-radius: 0.5rem; display: inline-block; margin-bottom: 2rem; }
                        .features { text-align: left; background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                        .feature { margin-bottom: 1rem; }
                        .api-info { background: #f0f9f1; padding: 1rem; border-radius: 0.5rem; margin-top: 2rem; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">🎯 HUNTA</div>
                        <div class="tagline">Elite Dog Hunting Platform</div>
                        <div class="status">✅ PRODUCTION DEPLOYMENT ACTIVE</div>
                        
                        <div class="features">
                            <h2>Core Features</h2>
                            <div class="feature">🐕 Pack & Profile Management</div>
                            <div class="feature">🗺️ Hunt Route Planner with GPS</div>
                            <div class="feature">🏆 Trial & Event Listings</div>
                            <div class="feature">⚡ Gear Reviews & Loadouts</div>
                            <div class="feature">📚 Ethics Knowledge Base</div>
                            <div class="feature">📸 Brag Board & Journal</div>
                        </div>

                        <div class="api-info">
                            <h3>API Status</h3>
                            <p><strong>Backend:</strong> Cloudflare Workers</p>
                            <p><strong>Database:</strong> D1 SQLite</p>
                            <p><strong>Storage:</strong> R2 Buckets</p>
                            <p><strong>Cache:</strong> KV Store</p>
                            <p><strong>API Endpoints:</strong> /api/*</p>
                        </div>
                        
                        <p style="margin-top: 2rem; color: #6b7280;">
                            Built for offline-first wilderness compatibility by elite developers who understand the hunting lifestyle.
                        </p>
                    </div>
                </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }

    // Simple password hashing (replace with proper bcrypt in production)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'hunta-salt');
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async verifyPassword(password, hash) {
        const computedHash = await this.hashPassword(password);
        return computedHash === hash;
    }
}

// Cloudflare Worker entry point
export default {
    async fetch(request, env, ctx) {
        const api = new HuntaAPI(env);
        return await api.handleRequest(request);
    }
};