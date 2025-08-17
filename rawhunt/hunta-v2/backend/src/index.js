/**
 * Hunta Backend - Clean Architecture
 * Learning from previous errors:
 * - Proper async/await everywhere
 * - Simple routing with clear error handling
 * - Real database integration
 */

import { authHandler } from './handlers/auth.js';
import { usersHandler } from './handlers/users.js';
import { dogsHandler } from './handlers/dogs.js';
import { routesHandler } from './handlers/routes.js';
import { eventsHandler } from './handlers/events.js';
import { gearHandler } from './handlers/gear.js';
import { ethicsHandler } from './handlers/ethics.js';
import { postsHandler } from './handlers/posts.js';
import { analyticsHandler } from './handlers/analytics.js';
import { stylerHandler } from './handlers/styler.js';
import { huntsHandler } from './handlers/hunts.js';
import { weatherHandler } from './handlers/weather.js';
import { trainingHandler } from './handlers/training.js';
import { AnalyticsMiddleware } from './middleware/analytics.js';

class HuntaAPI {
    constructor(env) {
        this.env = env;
        this.db = env.DB;
        this.cache = env.CACHE;
        this.media = env.MEDIA;
        this.analytics = new AnalyticsMiddleware(env);
    }

    async handleRequest(request) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;
        const startTime = Date.now();

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // Handle preflight
        if (method === 'OPTIONS') {
            return new Response(null, { status: 200, headers: corsHeaders });
        }

        let response;
        let error = null;

        try {
            // Simple, clear routing
            if (path === '/health') {
                response = await this.healthCheck();
            } else if (path.startsWith('/api/auth/')) {
                response = await authHandler(request, path, this.env);
            } else if (path.startsWith('/api/users/')) {
                response = await usersHandler(request, path, this.env);
            } else if (path.startsWith('/api/dogs/')) {
                response = await dogsHandler(request, path, this.env);
            } else if (path.startsWith('/api/routes/')) {
                response = await routesHandler(request, path, this.env);
            } else if (path.startsWith('/api/events/')) {
                response = await eventsHandler(request, path, this.env);
            } else if (path.startsWith('/api/gear/')) {
                response = await gearHandler(request, path, this.env);
            } else if (path.startsWith('/api/ethics/')) {
                response = await ethicsHandler(request, path, this.env);
            } else if (path.startsWith('/api/posts/')) {
                response = await postsHandler(request, path, this.env);
            } else if (path.startsWith('/api/analytics/')) {
                response = await analyticsHandler(request, path, this.env);
            } else if (path.startsWith('/api/styler/')) {
                response = await stylerHandler(request, path, this.env);
            } else if (path.startsWith('/api/hunts/')) {
                response = await huntsHandler(request, path, this.env);
            } else if (path.startsWith('/api/weather/')) {
                response = await weatherHandler(request, path, this.env);
            } else if (path.startsWith('/api/training/')) {
                response = await trainingHandler(request, path, this.env);
            } else if (path.startsWith('/api/')) {
                response = this.apiNotFound();
            } else {
                response = this.serveInfo();
            }

            // Add CORS to all responses
            const headers = new Headers(response.headers);
            Object.entries(corsHeaders).forEach(([key, value]) => {
                headers.set(key, value);
            });

            // Track analytics (async, don't wait)
            if (path.startsWith('/api/')) {
                this.analytics.trackRequest(request, response, startTime, error).catch(console.error);
            }

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: headers
            });

        } catch (err) {
            error = err;
            console.error('Request error:', error);
            response = this.errorResponse('Internal server error', 500, corsHeaders);
            
            // Track analytics for error cases too
            if (path.startsWith('/api/')) {
                this.analytics.trackRequest(request, response, startTime, error).catch(console.error);
            }
            
            return response;
        }
    }

    async healthCheck() {
        const status = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            environment: this.env.ENVIRONMENT || 'development',
            database: this.db ? 'connected' : 'not configured',
            cache: this.cache ? 'connected' : 'not configured',
            media: this.media ? 'connected' : 'not configured'
        };

        return new Response(JSON.stringify(status), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    apiNotFound() {
        return this.errorResponse('API endpoint not found', 404);
    }

    serveInfo() {
        const info = {
            name: 'Hunta API',
            version: '2.0.0',
            description: 'Elite dog hunting platform backend',
            endpoints: [
                'GET /health - System health check',
                'POST /api/auth/register - User registration',
                'POST /api/auth/login - User login',
                'GET /api/dogs/list - List user dogs',
                'GET /api/events/list - List upcoming events',
                'GET /api/gear/reviews - Gear reviews',
                'GET /api/posts/feed - Community posts'
            ]
        };

        return new Response(JSON.stringify(info, null, 2), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    errorResponse(message, status = 500, additionalHeaders = {}) {
        return new Response(JSON.stringify({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        }), {
            status,
            headers: {
                'Content-Type': 'application/json',
                ...additionalHeaders
            }
        });
    }
}

// Worker entry point
export default {
    async fetch(request, env, ctx) {
        const api = new HuntaAPI(env);
        return await api.handleRequest(request);
    }
};