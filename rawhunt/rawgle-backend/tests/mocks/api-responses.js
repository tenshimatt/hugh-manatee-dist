/**
 * API Response Mocks for Frontend Testing
 * Provides standardized mock responses for Rawgle API endpoints
 */

// Mock user data
export const mockUser = {
  id: 'user_123456789',
  email: 'test@rawgle.com',
  name: 'Test User',
  platform: 'rawgle',
  location: 'San Francisco, CA',
  experience_level: 'intermediate',
  subscription_tier: 'premium',
  email_verified: true,
  profile_completed: true,
  onboarding_completed: true,
  paws_balance: 1250,
  paws_lifetime_earned: 3500,
  paws_lifetime_spent: 2250,
  avatar_url: 'https://api.rawgle.com/avatars/user_123456789.jpg',
  bio: 'Raw feeding enthusiast with 2 Golden Retrievers',
  created_at: '2024-01-15T10:30:00Z',
  last_login: '2024-08-14T14:22:33Z'
};

// Mock pet data
export const mockPets = [
  {
    id: 'pet_dog_123',
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    birth_date: '2020-03-15',
    gender: 'male',
    weight_lbs: 68,
    color_markings: 'Golden coat with white chest patch',
    feeding_type: 'raw',
    activity_level: 'high',
    target_daily_calories: 1700,
    allergies: ['chicken'],
    dietary_restrictions: [],
    photos: [
      'https://api.rawgle.com/pets/pet_dog_123/photo1.jpg',
      'https://api.rawgle.com/pets/pet_dog_123/photo2.jpg'
    ],
    nft_minted: true,
    nft_token_id: 'nft_buddy_001',
    created_at: '2024-02-01T09:15:00Z'
  },
  {
    id: 'pet_cat_456',
    name: 'Whiskers',
    species: 'cat',
    breed: 'Maine Coon',
    birth_date: '2021-07-10',
    gender: 'female',
    weight_lbs: 12,
    feeding_type: 'raw',
    activity_level: 'moderate',
    target_daily_calories: 350,
    allergies: [],
    dietary_restrictions: ['fish'],
    photos: ['https://api.rawgle.com/pets/pet_cat_456/photo1.jpg'],
    nft_minted: false,
    nft_token_id: null,
    created_at: '2024-03-10T11:45:00Z'
  }
];

// Mock feeding logs
export const mockFeedingLogs = [
  {
    id: 'log_001',
    pet_id: 'pet_dog_123',
    pet_name: 'Buddy',
    feeding_date: '2024-08-14',
    feeding_time: '18:30:00',
    meal_type: 'dinner',
    food_type: 'raw_meat',
    protein_source: 'beef',
    amount_grams: 450,
    calories_estimated: 380,
    protein_grams: 85,
    fat_grams: 25,
    appetite_rating: 5,
    energy_level_after: 4,
    digestion_notes: 'Normal, formed stool next day',
    notes: 'Ate enthusiastically, finished everything',
    created_at: '2024-08-14T18:35:00Z'
  },
  {
    id: 'log_002',
    pet_id: 'pet_dog_123',
    pet_name: 'Buddy',
    feeding_date: '2024-08-14',
    feeding_time: '08:00:00',
    meal_type: 'breakfast',
    food_type: 'organs',
    protein_source: 'beef_liver',
    amount_grams: 150,
    calories_estimated: 180,
    protein_grams: 30,
    appetite_rating: 4,
    energy_level_after: 5,
    notes: 'Good appetite, liver provides energy boost',
    created_at: '2024-08-14T08:05:00Z'
  }
];

// API Response Mocks
export const ApiMocks = {
  // Health endpoint
  '/health': {
    success: true,
    data: {
      status: 'healthy',
      platform: 'rawgle',
      timestamp: '2024-08-14T15:30:00Z',
      environment: 'production',
      version: '1.0.0',
      checks: {
        api: { status: 'healthy', response_time_ms: 45 },
        database: { status: 'healthy', response_time_ms: 23 },
        kv_store: { status: 'healthy', response_time_ms: 12 },
        r2_storage: { status: 'healthy', response_time_ms: 67 }
      },
      frontend: {
        cors_configured: true,
        target_url: 'https://afc39a6e.rawgle-frontend.pages.dev'
      }
    }
  },

  // Root endpoint
  '/': {
    success: true,
    data: {
      message: 'Welcome to Rawgle API',
      platform: 'rawgle',
      description: 'Raw feeding community and marketplace API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        users: '/api/users',
        pets: '/api/pets',
        feeding: '/api/feeding',
        paws: '/api/paws',
        nft: '/api/nft',
        community: '/api/community',
        suppliers: '/api/suppliers',
        products: '/api/products',
        nutrition: '/api/nutrition'
      },
      timestamp: '2024-08-14T15:30:00Z'
    }
  },

  // Authentication endpoints
  'POST /api/auth/login': {
    success: true,
    message: 'Login successful',
    data: {
      user: mockUser,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expires_at: '2024-08-15T15:30:00Z'
    }
  },

  'POST /api/auth/register': {
    success: true,
    message: 'Account created successfully',
    data: {
      user: mockUser,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expires_at: '2024-08-15T15:30:00Z'
    }
  },

  'GET /api/auth/profile': {
    success: true,
    data: {
      user: mockUser
    }
  },

  'POST /api/auth/logout': {
    success: true,
    message: 'Logged out successfully'
  },

  // User endpoints
  'GET /api/users/me': {
    success: true,
    data: {
      user: mockUser
    }
  },

  'GET /api/users/dashboard': {
    success: true,
    data: {
      pets: mockPets,
      recent_feedings: mockFeedingLogs.slice(0, 5),
      paws: {
        balance: 1250,
        lifetime_earned: 3500,
        recent_transactions: [
          {
            id: 'txn_001',
            transaction_type: 'earned',
            amount: 25,
            reason: 'pet_profile_created',
            created_at: '2024-08-14T10:00:00Z'
          },
          {
            id: 'txn_002',
            transaction_type: 'earned',
            amount: 15,
            reason: 'feeding_log_created',
            created_at: '2024-08-14T08:05:00Z'
          }
        ]
      },
      summary: {
        total_pets: 2,
        total_feedings: 24,
        active_streak_days: 7
      }
    }
  },

  'GET /api/users/stats': {
    success: true,
    data: {
      user_id: mockUser.id,
      stats: {
        pets: { total: 2 },
        feeding: { 
          total_logs: 127,
          recent_activity: mockFeedingLogs.slice(0, 3)
        },
        paws: {
          balance: 1250,
          lifetime_earned: 3500
        },
        community: {
          posts: 8,
          net_votes: 23,
          total_views: 456
        }
      }
    }
  },

  // Pet endpoints
  'GET /api/pets': {
    success: true,
    data: {
      pets: mockPets,
      total: mockPets.length
    }
  },

  'POST /api/pets': {
    success: true,
    message: 'Pet profile created successfully',
    data: {
      pet: mockPets[0],
      paws_awarded: 25
    }
  },

  'GET /api/pets/:id': {
    success: true,
    data: {
      pet: mockPets[0]
    }
  },

  'PUT /api/pets/:id': {
    success: true,
    message: 'Pet profile updated successfully',
    data: {
      pet: { ...mockPets[0], weight_lbs: 70, updated_at: '2024-08-14T15:30:00Z' }
    }
  },

  // Feeding endpoints
  'GET /api/feeding/logs': {
    success: true,
    data: {
      logs: mockFeedingLogs,
      pagination: {
        limit: 20,
        offset: 0,
        total: mockFeedingLogs.length,
        pages: 1
      }
    }
  },

  'POST /api/feeding/logs': {
    success: true,
    message: 'Feeding log created successfully',
    data: {
      feeding_log: mockFeedingLogs[0],
      paws_awarded: 10
    }
  },

  'GET /api/feeding/logs/:id': {
    success: true,
    data: {
      feeding_log: mockFeedingLogs[0]
    }
  },

  // PAWS endpoints
  'GET /api/paws/balance': {
    success: true,
    data: {
      balance: 1250,
      lifetime_earned: 3500,
      lifetime_spent: 2250,
      last_transaction: {
        id: 'txn_latest',
        amount: 10,
        reason: 'feeding_log_created',
        created_at: '2024-08-14T18:35:00Z'
      }
    }
  },

  'GET /api/paws/transactions': {
    success: true,
    data: {
      transactions: [
        {
          id: 'txn_001',
          transaction_type: 'earned',
          amount: 25,
          balance_before: 1225,
          balance_after: 1250,
          reason: 'pet_profile_created',
          related_entity_type: 'pet',
          created_at: '2024-08-14T10:00:00Z'
        },
        {
          id: 'txn_002',
          transaction_type: 'earned',
          amount: 15,
          balance_before: 1210,
          balance_after: 1225,
          reason: 'community_post_created',
          related_entity_type: 'community_post',
          created_at: '2024-08-13T16:22:00Z'
        }
      ],
      pagination: {
        limit: 20,
        offset: 0,
        total: 2,
        pages: 1
      }
    }
  },

  // NFT endpoints
  'GET /api/nft/collection': {
    success: true,
    data: {
      nfts: [
        {
          id: 'nft_001',
          token_id: 'nft_buddy_001',
          nft_type: 'pet_profile',
          blockchain: 'solana',
          name: 'Buddy - Rawgle Pet Profile',
          description: 'Digital collectible pet profile for Buddy',
          image_url: 'https://api.rawgle.com/nfts/nft_buddy_001.png',
          rarity_score: 85.5,
          status: 'minted',
          minted_at: '2024-03-15T14:20:00Z',
          pet_name: 'Buddy',
          pet_species: 'dog'
        }
      ],
      pagination: {
        total: 1,
        limit: 20,
        offset: 0,
        pages: 1
      }
    }
  },

  // Community endpoints
  'GET /api/community/posts': {
    success: true,
    data: {
      posts: [
        {
          id: 'post_001',
          title: 'My Raw Feeding Success Story',
          content: 'After 6 months of raw feeding, my Golden Retriever has never been healthier!',
          post_type: 'success_story',
          category: 'feeding',
          tags: ['raw-feeding', 'golden-retriever', 'success'],
          upvotes: 23,
          downvotes: 1,
          view_count: 145,
          reply_count: 8,
          created_at: '2024-08-13T10:15:00Z',
          author_name: 'Test User',
          author_avatar: 'https://api.rawgle.com/avatars/user_123456789.jpg',
          pet_name: 'Buddy',
          net_votes: 22
        }
      ],
      pagination: {
        total: 1,
        limit: 20,
        offset: 0,
        pages: 1
      }
    }
  },

  'GET /api/community/categories': {
    success: true,
    data: {
      categories: {
        feeding: {
          name: 'Raw Feeding',
          description: 'Discussion about raw feeding practices',
          subcategories: ['meal_prep', 'nutrition', 'portions']
        },
        health: {
          name: 'Health & Wellness',
          description: 'Pet health topics and veterinary advice',
          subcategories: ['general_health', 'digestion', 'weight_management']
        },
        recipes: {
          name: 'Recipes & Meal Ideas',
          description: 'Raw food recipes and preparation tips',
          subcategories: ['dog_recipes', 'cat_recipes', 'treats']
        }
      }
    }
  },

  // Nutrition endpoints
  'POST /api/nutrition/calculator': {
    success: true,
    data: {
      pet: {
        id: 'pet_dog_123',
        name: 'Buddy',
        weight_lbs: 68,
        species: 'dog'
      },
      calculations: {
        daily_calories: 1700,
        daily_food_oz: 27,
        daily_food_grams: 765,
        meals_per_day: 2,
        macronutrients: {
          protein_grams: 106,
          fat_grams: 28,
          carb_grams: 21
        },
        raw_feeding: {
          breakdown: {
            muscle_meat_grams: 612,
            organ_meat_grams: 77,
            bone_content_grams: 77,
            liver_grams: 38,
            other_organs_grams: 38
          },
          weekly_totals: {
            muscle_meat_lbs: 9.5,
            organ_meat_lbs: 1.2,
            bone_content_lbs: 1.2
          }
        }
      }
    }
  },

  // Error responses
  'ERROR_401': {
    success: false,
    error: 'AUTHENTICATION_REQUIRED',
    message: 'Authorization header with Bearer token is required',
    platform: 'rawgle',
    timestamp: '2024-08-14T15:30:00Z'
  },

  'ERROR_404': {
    success: false,
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    platform: 'rawgle',
    timestamp: '2024-08-14T15:30:00Z'
  },

  'ERROR_400': {
    success: false,
    error: 'VALIDATION_ERROR',
    message: 'Invalid request data',
    platform: 'rawgle',
    timestamp: '2024-08-14T15:30:00Z'
  },

  'ERROR_500': {
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An internal server error occurred',
    platform: 'rawgle',
    timestamp: '2024-08-14T15:30:00Z'
  }
};

// Mock server for testing
export class MockApiServer {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.responses = ApiMocks;
  }

  mockResponse(endpoint, method = 'GET') {
    const key = method === 'GET' ? endpoint : `${method} ${endpoint}`;
    
    // Handle parameterized endpoints
    if (endpoint.includes(':id')) {
      const baseEndpoint = endpoint.replace(/\/[^\/]*$/, '/:id');
      return this.responses[key] || this.responses[baseEndpoint] || this.responses['ERROR_404'];
    }
    
    return this.responses[key] || this.responses['ERROR_404'];
  }

  // Generate test data
  generateTestUser(overrides = {}) {
    return {
      ...mockUser,
      id: `user_${Date.now()}`,
      email: `test${Date.now()}@rawgle.com`,
      created_at: new Date().toISOString(),
      ...overrides
    };
  }

  generateTestPet(userId, overrides = {}) {
    return {
      ...mockPets[0],
      id: `pet_${Date.now()}`,
      user_id: userId,
      name: `TestPet${Date.now()}`,
      created_at: new Date().toISOString(),
      ...overrides
    };
  }

  generateTestFeedingLog(petId, overrides = {}) {
    return {
      ...mockFeedingLogs[0],
      id: `log_${Date.now()}`,
      pet_id: petId,
      feeding_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      ...overrides
    };
  }

  // Validation helpers
  validateApiResponse(response, endpoint) {
    const expected = this.mockResponse(endpoint);
    const validationResults = {
      hasSuccess: 'success' in response,
      successMatches: response.success === expected.success,
      hasData: 'data' in response || 'message' in response,
      hasPlatform: response.platform === 'rawgle' || (response.data && response.data.platform === 'rawgle'),
      hasTimestamp: 'timestamp' in response || (response.data && 'timestamp' in response.data)
    };

    return {
      isValid: Object.values(validationResults).every(Boolean),
      details: validationResults,
      response,
      expected
    };
  }
}

export default ApiMocks;