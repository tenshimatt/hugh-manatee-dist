/**
 * Hunta Backend - Main Cloudflare Worker
 * Elite Dog Hunting Platform API
 */

import { Router } from './router.js';
import { AuthService } from './services/auth.js';
import { UserService } from './services/users.js';
import { DogService } from './services/dogs.js';
import { RouteService } from './services/routes.js';
import { EventService } from './services/events.js';
import { GearService } from './services/gear.js';
import { EthicsService } from './services/ethics.js';
import { PostService } from './services/posts.js';
import { TrainingService } from './services/training.js';
import { MediaService } from './services/media.js';
import { GPSService } from './services/gps.js';

class HuntaAPI {
    constructor(env) {
        this.env = env;
        this.db = env.DB;
        this.cache = env.CACHE;
        this.media = env.MEDIA;
        
        // Initialize services
        this.auth = new AuthService(env);
        this.users = new UserService(env);
        this.dogs = new DogService(env);
        this.routes = new RouteService(env);
        this.events = new EventService(env);
        this.gear = new GearService(env);
        this.ethics = new EthicsService(env);
        this.posts = new PostService(env);
        this.training = new TrainingService(env);
        this.media = new MediaService(env);
        this.gps = new GPSService(env);
        
        // Initialize router
        this.router = new Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // CORS preflight
        this.router.options('*', this.handleCORS.bind(this));
        
        // Health check
        this.router.get('/health', this.healthCheck.bind(this));
        
        // Authentication routes
        this.router.post('/api/auth/register', this.auth.register.bind(this.auth));
        this.router.post('/api/auth/login', this.auth.login.bind(this.auth));
        this.router.post('/api/auth/refresh', this.auth.refresh.bind(this.auth));
        this.router.post('/api/auth/logout', this.auth.logout.bind(this.auth));
        this.router.post('/api/auth/verify-email', this.auth.verifyEmail.bind(this.auth));
        this.router.post('/api/auth/forgot-password', this.auth.forgotPassword.bind(this.auth));
        this.router.post('/api/auth/reset-password', this.auth.resetPassword.bind(this.auth));
        
        // User management routes
        this.router.get('/api/users/me', this.authenticateUser, this.users.getProfile.bind(this.users));
        this.router.put('/api/users/me', this.authenticateUser, this.users.updateProfile.bind(this.users));
        this.router.get('/api/users/:id', this.users.getUser.bind(this.users));
        this.router.get('/api/users', this.users.searchUsers.bind(this.users));
        
        // Dog management routes
        this.router.get('/api/dogs', this.authenticateUser, this.dogs.getDogs.bind(this.dogs));
        this.router.post('/api/dogs', this.authenticateUser, this.dogs.createDog.bind(this.dogs));
        this.router.get('/api/dogs/search', this.dogs.searchDogs.bind(this.dogs));
        this.router.get('/api/dogs/:id', this.dogs.getDog.bind(this.dogs));
        this.router.put('/api/dogs/:id', this.authenticateUser, this.dogs.updateDog.bind(this.dogs));
        this.router.delete('/api/dogs/:id', this.authenticateUser, this.dogs.deleteDog.bind(this.dogs));
        
        // Hunt route management
        this.router.get('/api/routes', this.routes.getRoutes.bind(this.routes));
        this.router.post('/api/routes', this.authenticateUser, this.routes.createRoute.bind(this.routes));
        this.router.get('/api/routes/:id', this.routes.getRoute.bind(this.routes));
        this.router.put('/api/routes/:id', this.authenticateUser, this.routes.updateRoute.bind(this.routes));
        this.router.delete('/api/routes/:id', this.authenticateUser, this.routes.deleteRoute.bind(this.routes));
        this.router.post('/api/routes/:id/gpx', this.authenticateUser, this.routes.uploadGPX.bind(this.routes));
        
        // Event management
        this.router.get('/api/events', this.events.getEvents.bind(this.events));
        this.router.post('/api/events', this.authenticateUser, this.events.createEvent.bind(this.events));
        this.router.get('/api/events/:id', this.events.getEvent.bind(this.events));
        this.router.put('/api/events/:id', this.authenticateUser, this.events.updateEvent.bind(this.events));
        this.router.delete('/api/events/:id', this.authenticateUser, this.events.deleteEvent.bind(this.events));
        this.router.post('/api/events/:id/register', this.authenticateUser, this.events.registerForEvent.bind(this.events));
        this.router.delete('/api/events/:id/register', this.authenticateUser, this.events.unregisterFromEvent.bind(this.events));
        
        // Gear and reviews
        this.router.get('/api/gear', this.gear.getGear.bind(this.gear));
        this.router.post('/api/gear', this.authenticateUser, this.gear.createGearItem.bind(this.gear));
        this.router.get('/api/gear/:id', this.gear.getGearItem.bind(this.gear));
        this.router.post('/api/gear/:id/reviews', this.authenticateUser, this.gear.createReview.bind(this.gear));
        this.router.get('/api/gear/:id/reviews', this.gear.getReviews.bind(this.gear));
        this.router.get('/api/loadouts', this.authenticateUser, this.gear.getLoadouts.bind(this.gear));
        this.router.post('/api/loadouts', this.authenticateUser, this.gear.createLoadout.bind(this.gear));
        
        // Ethics knowledge base
        this.router.get('/api/ethics', this.ethics.getArticles.bind(this.ethics));
        this.router.post('/api/ethics', this.authenticateUser, this.ethics.createArticle.bind(this.ethics));
        this.router.get('/api/ethics/categories', this.ethics.getCategories.bind(this.ethics));
        this.router.get('/api/ethics/featured', this.ethics.getFeaturedArticles.bind(this.ethics));
        this.router.get('/api/ethics/:slug', this.ethics.getArticle.bind(this.ethics));
        this.router.put('/api/ethics/:id', this.authenticateUser, this.ethics.updateArticle.bind(this.ethics));
        
        // Brag board and posts
        this.router.get('/api/posts', this.posts.getPosts.bind(this.posts));
        this.router.post('/api/posts', this.authenticateUser, this.posts.createPost.bind(this.posts));
        this.router.get('/api/posts/stats', this.posts.getPostStats.bind(this.posts));
        this.router.get('/api/posts/:id', this.posts.getPost.bind(this.posts));
        this.router.put('/api/posts/:id', this.authenticateUser, this.posts.updatePost.bind(this.posts));
        this.router.delete('/api/posts/:id', this.authenticateUser, this.posts.deletePost.bind(this.posts));
        this.router.post('/api/posts/:id/like', this.authenticateUser, this.posts.likePost.bind(this.posts));
        
        // Training logs
        this.router.get('/api/training', this.authenticateUser, this.training.getLogs.bind(this.training));
        this.router.post('/api/training', this.authenticateUser, this.training.createLog.bind(this.training));
        this.router.get('/api/training/reminders', this.authenticateUser, this.training.getTrainingReminders.bind(this.training));
        this.router.get('/api/training/dogs/:dogId/stats', this.authenticateUser, this.training.getDogTrainingStats.bind(this.training));
        this.router.get('/api/training/:id', this.authenticateUser, this.training.getLog.bind(this.training));
        this.router.put('/api/training/:id', this.authenticateUser, this.training.updateLog.bind(this.training));
        this.router.delete('/api/training/:id', this.authenticateUser, this.training.deleteLog.bind(this.training));
        
        // Media upload
        this.router.post('/api/media/upload', this.authenticateUser, this.media.uploadFile.bind(this.media));
        this.router.get('/api/media', this.authenticateUser, this.media.getMediaFiles.bind(this.media));
        this.router.post('/api/media/upload-url', this.authenticateUser, this.media.generateUploadUrl.bind(this.media));
        this.router.post('/api/media/process', this.authenticateUser, this.media.processUploadedFile.bind(this.media));
        this.router.delete('/api/media/:id', this.authenticateUser, this.media.deleteFile.bind(this.media));
        
        // GPS utilities
        this.router.post('/api/gps/parse-gpx', this.gps.parseGPX.bind(this.gps));
        this.router.post('/api/gps/geocode', this.gps.geocode.bind(this.gps));
        this.router.get('/api/gps/reverse-geocode', this.gps.reverseGeocode.bind(this.gps));
        this.router.post('/api/gps/distance', this.gps.calculateDistance.bind(this.gps));
        this.router.get('/api/gps/nearby-poi', this.gps.findNearbyPOI.bind(this.gps));
        
        // Admin routes
        this.router.get('/api/admin/stats', this.authenticateAdmin, this.getAdminStats.bind(this));
        this.router.get('/api/admin/users', this.authenticateAdmin, this.users.adminGetUsers.bind(this.users));
        this.router.put('/api/admin/users/:id/role', this.authenticateAdmin, this.users.updateUserRole.bind(this.users));
        
        // Catch-all for SPA routing
        this.router.get('*', this.serveFrontend.bind(this));
    }

    async authenticateUser(request, env, ctx) {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return new Response('Unauthorized', { status: 401 });
        }

        try {
            const user = await this.auth.verifyToken(token);
            request.user = user;
            return null; // Continue to next handler
        } catch (error) {
            return new Response('Invalid token', { status: 401 });
        }
    }

    async authenticateAdmin(request, env, ctx) {
        const authResult = await this.authenticateUser(request, env, ctx);
        if (authResult) return authResult;

        if (request.user.role !== 'admin') {
            return new Response('Forbidden', { status: 403 });
        }
        return null;
    }

    async handleCORS(request) {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    async healthCheck(request) {
        return new Response(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: this.env.ENVIRONMENT || 'development'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    async getAdminStats(request) {
        try {
            const stats = await this.db.prepare(`
                SELECT 
                    'users' as metric, COUNT(*) as value FROM users
                UNION ALL
                SELECT 'dogs' as metric, COUNT(*) as value FROM dogs
                UNION ALL
                SELECT 'routes' as metric, COUNT(*) as value FROM hunt_routes
                UNION ALL
                SELECT 'events' as metric, COUNT(*) as value FROM events
                UNION ALL
                SELECT 'posts' as metric, COUNT(*) as value FROM posts
            `).all();

            return new Response(JSON.stringify({
                success: true,
                data: stats.results
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    async serveFrontend(request) {
        // In production, this would serve the built frontend
        // For now, return a placeholder
        return new Response(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Hunta - Elite Dog Hunting Platform</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                </head>
                <body>
                    <h1>Hunta Platform</h1>
                    <p>Elite Dog Hunting Platform - Coming Soon</p>
                    <p>API is running at /api/*</p>
                </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }

    async handleRequest(request) {
        try {
            // Add CORS headers to all responses
            const response = await this.router.handle(request, this.env);
            response.headers.set('Access-Control-Allow-Origin', '*');
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
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
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
}

// Cloudflare Worker entry point
export default {
    async fetch(request, env, ctx) {
        const api = new HuntaAPI(env);
        return await api.handleRequest(request);
    }
};