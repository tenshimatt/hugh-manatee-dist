// API Routes - Comprehensive REST endpoints for all services
import { Hono } from 'hono';
import { 
  rateLimiter, 
  authenticate, 
  requirePlatform, 
  requestLogger, 
  errorHandler, 
  analytics, 
  cors, 
  validateContent 
} from '../middleware/index.js';

import { AuthService } from '../services/auth-service.js';
import { UserService } from '../services/user-service.js';
import { PetService } from '../services/pet-service.js';
import { SupplierService } from '../services/supplier-service.js';

const app = new Hono();

// Global middleware
app.use('*', cors());
app.use('*', requestLogger());
app.use('*', analytics());
app.use('*', errorHandler());

// Rate limiting - different limits for different endpoints
app.use('/api/auth/*', rateLimiter(10, 60000)); // 10 requests per minute for auth
app.use('/api/*', rateLimiter(100, 60000)); // 100 requests per minute for general API

// Health check endpoint
app.get('/health', async (c) => {
  try {
    const checks = {
      database: { status: 'ok' }, // Would check actual DB connection
      kv: { status: 'ok' }, // Would check KV connection
      timestamp: new Date().toISOString()
    };
    
    return c.json({
      status: 'healthy',
      checks
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      error: error.message
    }, 503);
  }
});

// Platform detection endpoint
app.get('/api/platform/:platform', async (c) => {
  const platform = c.req.param('platform');
  
  if (!['rawgle', 'gohunta'].includes(platform)) {
    return c.json({
      error: {
        code: 'INVALID_PLATFORM',
        message: 'Platform must be either "rawgle" or "gohunta"'
      }
    }, 400);
  }
  
  try {
    const platformConfig = await c.env.DB
      .prepare('SELECT * FROM platform_config WHERE platform = ?')
      .bind(platform)
      .first();
    
    if (!platformConfig) {
      return c.json({
        error: {
          code: 'PLATFORM_NOT_FOUND',
          message: 'Platform configuration not found'
        }
      }, 404);
    }
    
    return c.json({
      platform: platformConfig.platform,
      displayName: platformConfig.display_name,
      description: platformConfig.description,
      features: JSON.parse(platformConfig.features),
      theme: JSON.parse(platformConfig.theme)
    });
  } catch (error) {
    throw new Error('Failed to get platform configuration');
  }
});

// Authentication routes
const authRoutes = new Hono();

authRoutes.post('/register', 
  validateContent({
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string', minLength: 8 },
    name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    platform: { required: true, type: 'string' }
  }),
  async (c) => {
    const body = c.get('validatedBody');
    const authService = new AuthService(c.env.DB, c.env.KV);
    
    const result = await authService.register(body, body.platform);
    
    return c.json({
      success: true,
      data: result
    }, 201);
  }
);

authRoutes.post('/login',
  validateContent({
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string' },
    platform: { required: true, type: 'string' }
  }),
  async (c) => {
    const body = c.get('validatedBody');
    const authService = new AuthService(c.env.DB, c.env.KV);
    
    const result = await authService.login(body.email, body.password, body.platform);
    
    return c.json({
      success: true,
      data: result
    });
  }
);

authRoutes.post('/logout', authenticate(), async (c) => {
  const user = c.get('user');
  const authService = new AuthService(c.env.DB, c.env.KV);
  
  await authService.logout(user.sessionToken);
  
  return c.json({
    success: true,
    message: 'Logged out successfully'
  });
});

authRoutes.post('/refresh', authenticate(), async (c) => {
  const user = c.get('user');
  const authService = new AuthService(c.env.DB, c.env.KV);
  
  const newSession = await authService.refreshSession(user.sessionToken);
  
  return c.json({
    success: true,
    data: newSession
  });
});

authRoutes.post('/forgot-password',
  validateContent({
    email: { required: true, type: 'email' },
    platform: { required: true, type: 'string' }
  }),
  async (c) => {
    const body = c.get('validatedBody');
    const authService = new AuthService(c.env.DB, c.env.KV);
    
    await authService.requestPasswordReset(body.email, body.platform);
    
    return c.json({
      success: true,
      message: 'Password reset instructions sent'
    });
  }
);

authRoutes.post('/reset-password',
  validateContent({
    token: { required: true, type: 'string' },
    password: { required: true, type: 'string', minLength: 8 }
  }),
  async (c) => {
    const body = c.get('validatedBody');
    const authService = new AuthService(c.env.DB, c.env.KV);
    
    await authService.resetPassword(body.token, body.password);
    
    return c.json({
      success: true,
      message: 'Password reset successfully'
    });
  }
);

app.route('/api/auth', authRoutes);

// User routes
const userRoutes = new Hono();

userRoutes.get('/profile/:userId?', authenticate(true), async (c) => {
  const requestedUserId = c.req.param('userId');
  const currentUser = c.get('user');
  const userService = new UserService(c.env.DB, c.env.KV, c.env.R2);
  
  // If no userId specified, get current user's profile
  const userId = requestedUserId || currentUser?.id;
  
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const profile = await userService.getUserProfile(userId, currentUser?.id);
  
  return c.json({
    success: true,
    data: profile
  });
});

userRoutes.put('/profile', 
  authenticate(),
  validateContent({
    name: { type: 'string', minLength: 2, maxLength: 100 },
    location: { type: 'string' },
    bio: { type: 'string', maxLength: 500 },
    phone: { type: 'string' }
  }),
  async (c) => {
    const user = c.get('user');
    const body = c.get('validatedBody');
    const userService = new UserService(c.env.DB, c.env.KV, c.env.R2);
    
    const updatedProfile = await userService.updateProfile(user.id, body);
    
    return c.json({
      success: true,
      data: updatedProfile
    });
  }
);

userRoutes.post('/avatar', authenticate(), async (c) => {
  const user = c.get('user');
  const userService = new UserService(c.env.DB, c.env.KV, c.env.R2);
  
  const formData = await c.req.formData();
  const imageFile = formData.get('avatar');
  
  if (!imageFile) {
    throw new Error('Avatar image is required');
  }
  
  const result = await userService.uploadAvatar(user.id, imageFile, imageFile.type);
  
  return c.json({
    success: true,
    data: result
  });
});

userRoutes.delete('/avatar', authenticate(), async (c) => {
  const user = c.get('user');
  const userService = new UserService(c.env.DB, c.env.KV, c.env.R2);
  
  await userService.deleteAvatar(user.id);
  
  return c.json({
    success: true,
    message: 'Avatar deleted successfully'
  });
});

userRoutes.put('/preferences', authenticate(), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const userService = new UserService(c.env.DB, c.env.KV, c.env.R2);
  
  const preferences = await userService.updatePreferences(user.id, body);
  
  return c.json({
    success: true,
    data: preferences
  });
});

userRoutes.put('/privacy', authenticate(), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const userService = new UserService(c.env.DB, c.env.KV, c.env.R2);
  
  const privacySettings = await userService.updatePrivacySettings(user.id, body);
  
  return c.json({
    success: true,
    data: privacySettings
  });
});

userRoutes.get('/search', authenticate(true), async (c) => {
  const query = c.req.query('q');
  const location = c.req.query('location');
  const platform = c.req.query('platform');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');
  
  const userService = new UserService(c.env.DB, c.env.KV, c.env.R2);
  
  const results = await userService.searchUsers({
    name: query,
    location,
    platform
  }, {
    limit,
    offset,
    requestingUserId: c.get('user')?.id
  });
  
  return c.json({
    success: true,
    data: results
  });
});

userRoutes.get('/stats', authenticate(), async (c) => {
  const user = c.get('user');
  const userService = new UserService(c.env.DB, c.env.KV, c.env.R2);
  
  const stats = await userService.getUserStats(user.id);
  
  return c.json({
    success: true,
    data: stats
  });
});

app.route('/api/users', userRoutes);

// Pet routes
const petRoutes = new Hono();

petRoutes.post('/',
  authenticate(),
  validateContent({
    name: { required: true, type: 'string', minLength: 1, maxLength: 50 },
    species: { type: 'string' },
    breed: { type: 'string' }
  }),
  async (c) => {
    const user = c.get('user');
    const body = c.get('validatedBody');
    const petService = new PetService(c.env.DB, c.env.KV, c.env.R2);
    
    const pet = await petService.createPet(user.id, body, user.platform);
    
    return c.json({
      success: true,
      data: pet
    }, 201);
  }
);

petRoutes.get('/', authenticate(), async (c) => {
  const user = c.get('user');
  const species = c.req.query('species');
  const petService = new PetService(c.env.DB, c.env.KV, c.env.R2);
  
  const pets = await petService.getUserPets(user.id, { species });
  
  return c.json({
    success: true,
    data: pets
  });
});

petRoutes.get('/:petId', authenticate(), async (c) => {
  const user = c.get('user');
  const petId = c.req.param('petId');
  const petService = new PetService(c.env.DB, c.env.KV, c.env.R2);
  
  const pet = await petService.getPetProfile(petId, user.id);
  
  return c.json({
    success: true,
    data: pet
  });
});

petRoutes.put('/:petId',
  authenticate(),
  validateContent({
    name: { type: 'string', minLength: 1, maxLength: 50 },
    breed: { type: 'string' },
    weight_lbs: { type: 'number' }
  }),
  async (c) => {
    const user = c.get('user');
    const petId = c.req.param('petId');
    const body = c.get('validatedBody');
    const petService = new PetService(c.env.DB, c.env.KV, c.env.R2);
    
    const updatedPet = await petService.updatePet(petId, user.id, body);
    
    return c.json({
      success: true,
      data: updatedPet
    });
  }
);

petRoutes.post('/:petId/photos', authenticate(), async (c) => {
  const user = c.get('user');
  const petId = c.req.param('petId');
  const petService = new PetService(c.env.DB, c.env.KV, c.env.R2);
  
  const formData = await c.req.formData();
  const photos = [];
  const contentTypes = [];
  
  for (const [key, file] of formData.entries()) {
    if (key.startsWith('photo')) {
      photos.push(file);
      contentTypes.push(file.type);
    }
  }
  
  if (photos.length === 0) {
    throw new Error('At least one photo is required');
  }
  
  const result = await petService.uploadPhotos(petId, user.id, photos, contentTypes);
  
  return c.json({
    success: true,
    data: result
  });
});

petRoutes.delete('/:petId/photos/:photoUrl', authenticate(), async (c) => {
  const user = c.get('user');
  const petId = c.req.param('petId');
  const photoUrl = decodeURIComponent(c.req.param('photoUrl'));
  const petService = new PetService(c.env.DB, c.env.KV, c.env.R2);
  
  await petService.deletePhoto(petId, user.id, photoUrl);
  
  return c.json({
    success: true,
    message: 'Photo deleted successfully'
  });
});

petRoutes.delete('/:petId', authenticate(), async (c) => {
  const user = c.get('user');
  const petId = c.req.param('petId');
  const petService = new PetService(c.env.DB, c.env.KV, c.env.R2);
  
  await petService.deletePet(petId, user.id);
  
  return c.json({
    success: true,
    message: 'Pet deleted successfully'
  });
});

app.route('/api/pets', petRoutes);

// Supplier routes
const supplierRoutes = new Hono();

supplierRoutes.post('/',
  authenticate(),
  validateContent({
    name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    city: { required: true, type: 'string' },
    state: { required: true, type: 'string' },
    email: { type: 'email' }
  }),
  async (c) => {
    const user = c.get('user');
    const body = c.get('validatedBody');
    const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
    
    const supplier = await supplierService.createSupplier(body, user.id);
    
    return c.json({
      success: true,
      data: supplier
    }, 201);
  }
);

supplierRoutes.get('/search', async (c) => {
  const query = c.req.query('q');
  const platform = c.req.query('platform');
  const city = c.req.query('city');
  const state = c.req.query('state');
  const category = c.req.query('category');
  const verified = c.req.query('verified') === 'true';
  const featured = c.req.query('featured') === 'true';
  const latitude = c.req.query('lat') ? parseFloat(c.req.query('lat')) : undefined;
  const longitude = c.req.query('lng') ? parseFloat(c.req.query('lng')) : undefined;
  const radius = c.req.query('radius') ? parseInt(c.req.query('radius')) : 50;
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');
  const sortBy = c.req.query('sort') || 'rating';
  const sortOrder = c.req.query('order') || 'desc';
  
  const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
  
  const results = await supplierService.searchSuppliers({
    query,
    platform,
    city,
    state,
    category,
    verified,
    featured,
    latitude,
    longitude,
    radiusMiles: radius
  }, {
    limit,
    offset,
    sortBy,
    sortOrder
  });
  
  return c.json({
    success: true,
    data: results
  });
});

supplierRoutes.get('/featured/:platform', async (c) => {
  const platform = c.req.param('platform');
  const category = c.req.query('category');
  const limit = parseInt(c.req.query('limit') || '10');
  
  const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
  
  const suppliers = await supplierService.getFeaturedSuppliers(platform, {
    category,
    limit
  });
  
  return c.json({
    success: true,
    data: suppliers
  });
});

supplierRoutes.get('/nearby', async (c) => {
  const latitude = parseFloat(c.req.query('lat'));
  const longitude = parseFloat(c.req.query('lng'));
  const radius = parseInt(c.req.query('radius') || '25');
  const platform = c.req.query('platform');
  
  if (isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Valid latitude and longitude are required');
  }
  
  const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
  
  const result = await supplierService.getSuppliersByLocation(latitude, longitude, radius, {
    platform
  });
  
  return c.json({
    success: true,
    data: result.suppliers
  });
});

supplierRoutes.get('/:supplierId', authenticate(true), async (c) => {
  const supplierId = c.req.param('supplierId');
  const user = c.get('user');
  const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
  
  const supplier = await supplierService.getSupplier(supplierId, user?.id);
  
  return c.json({
    success: true,
    data: supplier
  });
});

supplierRoutes.put('/:supplierId',
  authenticate(),
  validateContent({
    name: { type: 'string', minLength: 2, maxLength: 100 },
    email: { type: 'email' }
  }),
  async (c) => {
    const user = c.get('user');
    const supplierId = c.req.param('supplierId');
    const body = c.get('validatedBody');
    const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
    
    const updatedSupplier = await supplierService.updateSupplier(supplierId, body, user.id);
    
    return c.json({
      success: true,
      data: updatedSupplier
    });
  }
);

supplierRoutes.delete('/:supplierId', authenticate(), async (c) => {
  const user = c.get('user');
  const supplierId = c.req.param('supplierId');
  const supplierService = new SupplierService(c.env.DB, c.env.KV, c.env.R2);
  
  await supplierService.deleteSupplier(supplierId, user.id);
  
  return c.json({
    success: true,
    message: 'Supplier deleted successfully'
  });
});

app.route('/api/suppliers', supplierRoutes);

// Error handling for unmatched routes
app.all('*', (c) => {
  return c.json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested endpoint does not exist',
      path: c.req.url
    }
  }, 404);
});

export default app;