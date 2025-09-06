import { NextRequest, NextResponse } from 'next/server';

/**
 * Main API endpoint - provides API documentation and health status
 * GET /api - Returns available API endpoints and system status
 */
export async function GET(req: NextRequest) {
  try {
    const baseUrl = new URL(req.url).origin;
    
    const apiDocumentation = {
      service: 'rawgle-api',
      version: '1.0.0',
      status: 'online',
      timestamp: new Date().toISOString(),
      description: 'RAWGLE - Raw Pet Food Community Platform API',
      documentation: {
        openapi: '3.0.0',
        info: {
          title: 'RAWGLE API',
          version: '1.0.0',
          description: 'The ultimate platform for raw pet food enthusiasts. Track feeding, find suppliers, connect with community.',
          contact: {
            name: 'RAWGLE Team',
            url: 'https://rawgle.com'
          }
        }
      },
      endpoints: {
        '/api/health': {
          method: 'GET',
          description: 'Health check endpoint',
          response: 'Service health status'
        },
        '/api/auth': {
          method: 'POST',
          description: 'Authentication endpoints',
          endpoints: [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/logout'
          ]
        },
        '/api/pets': {
          method: 'GET, POST, PUT, DELETE',
          description: 'Pet management endpoints',
          response: 'Pet profiles and data'
        },
        '/api/feeding-entries': {
          method: 'GET, POST, PUT, DELETE',
          description: 'Feeding schedule and history',
          response: 'Feeding entries and analytics'
        },
        '/api/stores': {
          method: 'GET',
          description: 'Raw food supplier directory',
          response: 'Store locations and inventory'
        },
        '/api/location': {
          method: 'GET',
          description: 'Location-based services',
          response: 'Nearby suppliers and services'
        },
        '/api/chat': {
          method: 'POST',
          description: 'AI-powered chat assistance',
          response: 'Chat responses and recommendations'
        },
        '/api/images': {
          method: 'POST, GET',
          description: 'Image upload and processing',
          response: 'Image URLs and metadata'
        }
      },
      features: {
        authentication: 'Clerk-based user management',
        database: 'Real-time data synchronization',
        ai_chat: 'OpenAI-powered pet nutrition advice',
        geolocation: 'Location-based supplier discovery',
        image_processing: 'Pet photo and food image analysis',
        mobile_responsive: 'Progressive Web App (PWA) support'
      },
      usage: {
        base_url: `${baseUrl}/api`,
        content_type: 'application/json',
        authentication: 'Bearer token (Clerk session)',
        rate_limits: {
          general: '1000 requests/hour',
          chat: '100 requests/hour',
          images: '50 uploads/hour'
        }
      },
      support: {
        documentation: `${baseUrl}/guides`,
        community: `${baseUrl}/community`,
        roadmap: `${baseUrl}/roadmap`,
        status_page: `${baseUrl}/api/health`
      }
    };

    return NextResponse.json(apiDocumentation, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Content-Type': 'application/json',
      },
    });

  } catch (error: any) {
    console.error('API documentation endpoint error:', error);
    
    return NextResponse.json(
      { 
        service: 'rawgle-api',
        status: 'error',
        error: 'Failed to generate API documentation',
        timestamp: new Date().toISOString(),
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}