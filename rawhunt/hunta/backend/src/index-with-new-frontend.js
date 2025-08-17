/**
 * Hunta Backend - Updated for New Frontend Integration
 * Elite Dog Hunting Platform API with new frontend support
 * Integrates with: https://afc39a6e.rawgle-frontend.pages.dev/
 */

import { Router } from '../workers/router.js';
import { AuthService } from '../workers/services/auth.js';
import { UserService } from '../workers/services/users.js';
import { DogService } from '../workers/services/dogs.js';
import { RouteService } from '../workers/services/routes.js';
import { EventService } from '../workers/services/events.js';
import { GearService } from '../workers/services/gear.js';
import { EthicsService } from '../workers/services/ethics.js';
import { PostService } from '../workers/services/posts.js';
import { TrainingService } from '../workers/services/training.js';
import { MediaService } from '../workers/services/media.js';
import { GPSService } from '../workers/services/gps.js';

// Import new frontend integration config
import {
  FRONTEND_CONFIG,
  getCorsHeaders,
  mapFieldsToBackend,
  mapFieldsToFrontend,
  formatSuccessResponse,
  formatErrorResponse,
  optimizeForMobile,
  optimizeForRural
} from './config/frontend-integration.js';

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
    // CORS preflight for new frontend
    this.router.options('*', this.handleNewFrontendCORS.bind(this));
    
    // Health check with frontend integration status
    this.router.get('/health', this.healthCheck.bind(this));
    
    // Authentication routes
    this.router.post('/api/auth/login', this.handleWithIntegration(this.auth.login.bind(this.auth)));
    this.router.post('/api/auth/register', this.handleWithIntegration(this.auth.register.bind(this.auth)));
    this.router.post('/api/auth/logout', this.handleWithIntegration(this.auth.logout.bind(this.auth)));
    this.router.get('/api/users/me', this.handleWithIntegration(this.users.getCurrentUser.bind(this.users)));
    
    // Pack Management (Dogs) - with field mapping
    this.router.get('/api/dogs', this.handleWithIntegration(this.dogs.getAllDogs.bind(this.dogs), 'DOG_PROFILE'));
    this.router.post('/api/dogs', this.handleWithIntegration(this.dogs.createDog.bind(this.dogs), 'DOG_PROFILE'));
    this.router.get('/api/dogs/:id', this.handleWithIntegration(this.dogs.getDog.bind(this.dogs), 'DOG_PROFILE'));
    this.router.put('/api/dogs/:id', this.handleWithIntegration(this.dogs.updateDog.bind(this.dogs), 'DOG_PROFILE'));
    this.router.delete('/api/dogs/:id', this.handleWithIntegration(this.dogs.deleteDog.bind(this.dogs)));
    
    // Route Planning - with field mapping
    this.router.get('/api/routes', this.handleWithIntegration(this.routes.getAllRoutes.bind(this.routes), 'ROUTE'));
    this.router.post('/api/routes', this.handleWithIntegration(this.routes.createRoute.bind(this.routes), 'ROUTE'));
    this.router.get('/api/routes/:id', this.handleWithIntegration(this.routes.getRoute.bind(this.routes), 'ROUTE'));
    this.router.put('/api/routes/:id', this.handleWithIntegration(this.routes.updateRoute.bind(this.routes), 'ROUTE'));
    this.router.delete('/api/routes/:id', this.handleWithIntegration(this.routes.deleteRoute.bind(this.routes)));
    
    // Training Management - with field mapping
    this.router.get('/api/training', this.handleWithIntegration(this.training.getAllSessions.bind(this.training), 'TRAINING'));
    this.router.post('/api/training', this.handleWithIntegration(this.training.createSession.bind(this.training), 'TRAINING'));
    this.router.get('/api/training/:id', this.handleWithIntegration(this.training.getSession.bind(this.training), 'TRAINING'));
    this.router.put('/api/training/:id', this.handleWithIntegration(this.training.updateSession.bind(this.training), 'TRAINING'));
    
    // Gear Reviews
    this.router.get('/api/gear', this.handleWithIntegration(this.gear.getAllGear.bind(this.gear)));
    this.router.post('/api/gear', this.handleWithIntegration(this.gear.createGearReview.bind(this.gear)));
    this.router.get('/api/gear/:id', this.handleWithIntegration(this.gear.getGear.bind(this.gear)));
    
    // Ethics & Conservation
    this.router.get('/api/ethics', this.handleWithIntegration(this.ethics.getAllArticles.bind(this.ethics)));
    this.router.get('/api/ethics/:id', this.handleWithIntegration(this.ethics.getArticle.bind(this.ethics)));
    this.router.post('/api/conservation', this.handleWithIntegration(this.ethics.logConservation.bind(this.ethics)));
    
    // Community & Posts
    this.router.get('/api/posts', this.handleWithIntegration(this.posts.getAllPosts.bind(this.posts)));
    this.router.post('/api/posts', this.handleWithIntegration(this.posts.createPost.bind(this.posts)));
    this.router.get('/api/posts/:id', this.handleWithIntegration(this.posts.getPost.bind(this.posts)));
    
    // Events
    this.router.get('/api/events', this.handleWithIntegration(this.events.getAllEvents.bind(this.events)));
    this.router.post('/api/events', this.handleWithIntegration(this.events.createEvent.bind(this.events)));
    
    // GPS Services
    this.router.post('/api/gps/track', this.handleWithIntegration(this.gps.trackLocation.bind(this.gps)));
    this.router.get('/api/gps/waypoints', this.handleWithIntegration(this.gps.getWaypoints.bind(this.gps)));
  }

  // Enhanced CORS handling for new frontend
  async handleNewFrontendCORS(request) {
    const origin = request.headers.get('Origin');
    const corsHeaders = getCorsHeaders(origin);
    
    return new Response(null, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Length': '0'
      }
    });
  }

  // Wrapper to handle new frontend integration
  handleWithIntegration(serviceMethod, mappingType = null) {
    return async (request, params) => {
      try {
        const origin = request.headers.get('Origin');
        const corsHeaders = getCorsHeaders(origin);
        
        // Get mobile and rural optimization settings
        const mobileOptions = optimizeForMobile(request);
        const ruralOptions = optimizeForRural(request);
        
        let requestData = null;
        
        // Parse request data if POST/PUT
        if (request.method === 'POST' || request.method === 'PUT') {
          const contentType = request.headers.get('Content-Type');
          
          if (contentType?.includes('application/json')) {
            requestData = await request.json();
            
            // Map frontend fields to backend fields
            if (mappingType && requestData) {
              requestData = mapFieldsToBackend(requestData, mappingType);
            }
          }
        }
        
        // Call the original service method with optimization options
        const result = await serviceMethod(request, params, {
          data: requestData,
          mobile: mobileOptions,
          rural: ruralOptions
        });
        
        // Process the result
        let responseData = result;
        
        // Map backend fields to frontend fields
        if (mappingType && responseData?.data) {
          if (Array.isArray(responseData.data)) {
            // Handle arrays (lists)
            const mappedItems = responseData.data.map(item => 
              mapFieldsToFrontend(item, mappingType)
            );
            responseData = { ...responseData, data: mappedItems };
          } else if (typeof responseData.data === 'object') {
            // Handle single objects
            const mappedData = mapFieldsToFrontend(responseData.data, mappingType);
            responseData = { ...responseData, data: mappedData };
          }
        }
        
        // Format response according to new frontend standards
        const formattedResponse = result.success 
          ? formatSuccessResponse(responseData.data, responseData.message)
          : formatErrorResponse(result.error, result.message);
        
        // Apply mobile optimizations
        if (mobileOptions.useCompression) {
          // Add compression headers
          corsHeaders['Content-Encoding'] = 'gzip';
        }
        
        return new Response(JSON.stringify(formattedResponse), {
          status: result.success ? 200 : (result.statusCode || 500),
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
        
      } catch (error) {
        console.error('Integration error:', error);
        
        const errorResponse = formatErrorResponse(error, 'Integration error occurred');
        
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request.headers.get('Origin'))
          }
        });
      }
    };
  }

  async healthCheck(request) {
    const origin = request.headers.get('Origin');
    
    const health = {
      status: 'healthy',
      version: '2.0.0',
      environment: this.env.ENVIRONMENT || 'development',
      timestamp: new Date().toISOString(),
      frontend_integration: {
        new_frontend_url: FRONTEND_CONFIG.NEW_FRONTEND_URL,
        cors_configured: true,
        field_mapping_enabled: true,
        mobile_optimized: true,
        rural_optimized: true
      },
      services: {
        database: this.db ? 'connected' : 'disconnected',
        cache: this.cache ? 'connected' : 'disconnected',
        media: this.media ? 'connected' : 'disconnected'
      }
    };
    
    return new Response(JSON.stringify(health), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin)
      }
    });
  }

  async fetch(request, env) {
    try {
      // Update environment
      this.env = env;
      this.db = env.DB;
      this.cache = env.CACHE;
      this.media = env.MEDIA;
      
      // Log request for debugging
      console.log(`${request.method} ${request.url}`);
      
      // Handle the request
      const response = await this.router.handle(request);
      
      return response;
      
    } catch (error) {
      console.error('Worker error:', error);
      
      const errorResponse = formatErrorResponse(error, 'Worker error occurred');
      
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request.headers.get('Origin'))
        }
      });
    }
  }
}

// Export the worker
export default {
  async fetch(request, env, ctx) {
    const api = new HuntaAPI(env);
    return await api.fetch(request, env);
  }
};