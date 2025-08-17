// Frontend Integration Configuration for GoHunta Platform
// Connects working backend to new frontend at https://afc39a6e.rawgle-frontend.pages.dev/

export const FRONTEND_CONFIG = {
  // New Frontend URL
  NEW_FRONTEND_URL: 'https://afc39a6e.rawgle-frontend.pages.dev',
  
  // Legacy Frontend URLs (for backward compatibility)
  LEGACY_FRONTEND_URLS: [
    'https://4df825d3.hunta-v2-frontend.pages.dev',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  
  // CORS Configuration for new frontend
  CORS_CONFIG: {
    ALLOWED_ORIGINS: [
      'https://afc39a6e.rawgle-frontend.pages.dev',
      'https://4df825d3.hunta-v2-frontend.pages.dev',
      'http://localhost:3000',
      'http://localhost:5173'
    ],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    ALLOWED_HEADERS: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'Pragma'
    ],
    CREDENTIALS: true,
    MAX_AGE: 86400 // 24 hours
  },

  // API Endpoint Mappings for new frontend
  API_ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      PROFILE: '/api/users/me',
      REFRESH_TOKEN: '/api/auth/refresh'
    },
    
    // Pack Management (Dogs)
    DOGS: {
      LIST: '/api/dogs',
      CREATE: '/api/dogs',
      GET: '/api/dogs/:id',
      UPDATE: '/api/dogs/:id',
      DELETE: '/api/dogs/:id',
      UPLOAD_PHOTO: '/api/dogs/:id/photo'
    },
    
    // Route Planning
    ROUTES: {
      LIST: '/api/routes',
      CREATE: '/api/routes',
      GET: '/api/routes/:id',
      UPDATE: '/api/routes/:id',
      DELETE: '/api/routes/:id',
      SHARE: '/api/routes/:id/share'
    },
    
    // Training Management
    TRAINING: {
      LIST: '/api/training',
      CREATE: '/api/training',
      GET: '/api/training/:id',
      UPDATE: '/api/training/:id',
      DELETE: '/api/training/:id',
      UPLOAD_VIDEO: '/api/training/:id/video'
    },
    
    // Gear Reviews
    GEAR: {
      LIST: '/api/gear',
      CREATE: '/api/gear',
      GET: '/api/gear/:id',
      UPDATE: '/api/gear/:id',
      DELETE: '/api/gear/:id',
      REVIEWS: '/api/gear/:id/reviews'
    },
    
    // Ethics & Conservation
    ETHICS: {
      ARTICLES: '/api/ethics',
      GET_ARTICLE: '/api/ethics/:id',
      CONSERVATION_LOG: '/api/conservation',
      REPORT_VIOLATION: '/api/ethics/report'
    },
    
    // Community
    COMMUNITY: {
      POSTS: '/api/posts',
      CREATE_POST: '/api/posts',
      GET_POST: '/api/posts/:id',
      COMMENTS: '/api/posts/:id/comments',
      GROUPS: '/api/community/groups',
      EVENTS: '/api/events'
    }
  },

  // Response Format Standards
  RESPONSE_FORMATS: {
    SUCCESS: {
      success: true,
      data: null,
      message: null,
      timestamp: null
    },
    ERROR: {
      success: false,
      error: null,
      message: null,
      timestamp: null,
      details: null
    }
  },

  // Field Mapping (Frontend camelCase ↔ Backend snake_case)
  FIELD_MAPPINGS: {
    // Dog Profile Mappings
    DOG_PROFILE: {
      // Frontend → Backend
      TO_BACKEND: {
        'firstName': 'first_name',
        'lastName': 'last_name',
        'birthDate': 'birth_date',
        'microchipId': 'microchip_id',
        'registrationNumber': 'registration_number',
        'trainingLevel': 'training_level',
        'healthNotes': 'health_notes',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at'
      },
      // Backend → Frontend
      TO_FRONTEND: {
        'first_name': 'firstName',
        'last_name': 'lastName',
        'birth_date': 'birthDate',
        'microchip_id': 'microchipId',
        'registration_number': 'registrationNumber',
        'training_level': 'trainingLevel',
        'health_notes': 'healthNotes',
        'created_at': 'createdAt',
        'updated_at': 'updatedAt'
      }
    },
    
    // Route Mappings
    ROUTE: {
      TO_BACKEND: {
        'routeName': 'route_name',
        'huntType': 'hunt_type',
        'estimatedTime': 'estimated_time',
        'startPoint': 'start_point',
        'endPoint': 'end_point',
        'waypoints': 'waypoints',
        'createdAt': 'created_at'
      },
      TO_FRONTEND: {
        'route_name': 'routeName',
        'hunt_type': 'huntType',
        'estimated_time': 'estimatedTime',
        'start_point': 'startPoint',
        'end_point': 'endPoint',
        'waypoints': 'waypoints',
        'created_at': 'createdAt'
      }
    },
    
    // Training Session Mappings
    TRAINING: {
      TO_BACKEND: {
        'sessionType': 'session_type',
        'skillFocus': 'skill_focus',
        'trainingNotes': 'training_notes',
        'successRate': 'success_rate',
        'weatherConditions': 'weather_conditions',
        'sessionDate': 'session_date'
      },
      TO_FRONTEND: {
        'session_type': 'sessionType',
        'skill_focus': 'skillFocus',
        'training_notes': 'trainingNotes',
        'success_rate': 'successRate',
        'weather_conditions': 'weatherConditions',
        'session_date': 'sessionDate'
      }
    }
  },

  // Mobile Optimization Settings
  MOBILE_CONFIG: {
    MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB for mobile uploads
    COMPRESSION_QUALITY: 0.8,
    BATCH_SIZE: 10, // Items per page for mobile
    CACHE_DURATION: 300000, // 5 minutes cache for mobile
    OFFLINE_SYNC_INTERVAL: 60000 // 1 minute offline sync attempts
  },

  // Rural Connectivity Optimization
  RURAL_CONFIG: {
    REQUEST_TIMEOUT: 15000, // 15 second timeout for rural areas
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000, // 2 second delay between retries
    COMPRESSION_ENABLED: true,
    MINIMAL_RESPONSE_MODE: true // Send only essential data
  }
};

// Helper Functions for Frontend Integration

export function getCorsHeaders(origin) {
  const { CORS_CONFIG } = FRONTEND_CONFIG;
  
  // Check if origin is allowed
  const isAllowedOrigin = CORS_CONFIG.ALLOWED_ORIGINS.includes(origin) || 
                         CORS_CONFIG.ALLOWED_ORIGINS.includes('*');
  
  if (!isAllowedOrigin) {
    return {};
  }
  
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': CORS_CONFIG.ALLOWED_METHODS.join(', '),
    'Access-Control-Allow-Headers': CORS_CONFIG.ALLOWED_HEADERS.join(', '),
    'Access-Control-Allow-Credentials': CORS_CONFIG.CREDENTIALS.toString(),
    'Access-Control-Max-Age': CORS_CONFIG.MAX_AGE.toString()
  };
}

export function mapFieldsToBackend(data, mappingType) {
  const mapping = FRONTEND_CONFIG.FIELD_MAPPINGS[mappingType]?.TO_BACKEND;
  if (!mapping) return data;
  
  const mappedData = {};
  for (const [key, value] of Object.entries(data)) {
    const backendKey = mapping[key] || key;
    mappedData[backendKey] = value;
  }
  return mappedData;
}

export function mapFieldsToFrontend(data, mappingType) {
  const mapping = FRONTEND_CONFIG.FIELD_MAPPINGS[mappingType]?.TO_FRONTEND;
  if (!mapping) return data;
  
  const mappedData = {};
  for (const [key, value] of Object.entries(data)) {
    const frontendKey = mapping[key] || key;
    mappedData[frontendKey] = value;
  }
  return mappedData;
}

export function formatSuccessResponse(data, message = null) {
  return {
    ...FRONTEND_CONFIG.RESPONSE_FORMATS.SUCCESS,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

export function formatErrorResponse(error, message = null, details = null) {
  return {
    ...FRONTEND_CONFIG.RESPONSE_FORMATS.ERROR,
    error: error.message || error,
    message: message || 'An error occurred',
    timestamp: new Date().toISOString(),
    details
  };
}

export function optimizeForMobile(request) {
  const userAgent = request.headers.get('User-Agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  
  return {
    isMobile,
    useCompression: isMobile,
    batchSize: isMobile ? FRONTEND_CONFIG.MOBILE_CONFIG.BATCH_SIZE : 50,
    maxUploadSize: isMobile ? FRONTEND_CONFIG.MOBILE_CONFIG.MAX_UPLOAD_SIZE : 10 * 1024 * 1024
  };
}

export function optimizeForRural(request) {
  const connection = request.headers.get('Connection-Type') || '';
  const isSlowConnection = /2g|3g|slow/.test(connection.toLowerCase());
  
  return {
    isSlowConnection,
    timeout: isSlowConnection ? FRONTEND_CONFIG.RURAL_CONFIG.REQUEST_TIMEOUT : 5000,
    compression: isSlowConnection ? FRONTEND_CONFIG.RURAL_CONFIG.COMPRESSION_ENABLED : false,
    minimalResponse: isSlowConnection ? FRONTEND_CONFIG.RURAL_CONFIG.MINIMAL_RESPONSE_MODE : false
  };
}