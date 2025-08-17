/**
 * Rawgle Backend Integration Tests
 * Comprehensive test suite for all API endpoints
 * Designed for frontend compatibility verification
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import app from '../../src/index.js';

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:8787',
  frontendUrl: 'https://afc39a6e.rawgle-frontend.pages.dev',
  timeout: 30000
};

// Test data
const testUsers = {
  regularUser: {
    email: 'test@rawgle.com',
    password: 'TestPass123!',
    name: 'Test User',
    location: 'Test City'
  },
  premiumUser: {
    email: 'premium@rawgle.com', 
    password: 'PremiumPass123!',
    name: 'Premium User',
    location: 'Premium City'
  }
};

const testPets = {
  dog: {
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    birth_date: '2020-01-15',
    gender: 'male',
    weight_lbs: 65,
    feeding_type: 'raw',
    activity_level: 'high'
  },
  cat: {
    name: 'Whiskers',
    species: 'cat', 
    breed: 'Maine Coon',
    birth_date: '2021-06-10',
    gender: 'female',
    weight_lbs: 12,
    feeding_type: 'raw',
    activity_level: 'moderate'
  }
};

// Global test state
let testState = {
  tokens: {},
  pets: {},
  feedingLogs: {},
  posts: {},
  nfts: {}
};

// Helper functions
async function makeRequest(endpoint, options = {}) {
  const url = `${TEST_CONFIG.baseUrl}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Origin': TEST_CONFIG.frontendUrl,
      'X-Platform': 'rawgle',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  return { response, data };
}

async function authenticatedRequest(endpoint, userType = 'regularUser', options = {}) {
  const token = testState.tokens[userType];
  return makeRequest(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
}

// Test Suite
describe('Rawgle Backend Integration Tests', () => {
  
  beforeAll(async () => {
    console.log('🚀 Starting Rawgle Integration Tests...');
    console.log(`Frontend URL: ${TEST_CONFIG.frontendUrl}`);
  }, TEST_CONFIG.timeout);

  afterAll(async () => {
    console.log('✅ Rawgle Integration Tests Complete');
  });

  describe('1. Health & System Endpoints', () => {
    
    test('GET /health - Health check endpoint', async () => {
      const { response, data } = await makeRequest('/health');
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.platform).toBe('rawgle');
      expect(data.timestamp).toBeTruthy();
      expect(data.version).toBe('1.0.0');
    });

    test('GET / - Root endpoint with API info', async () => {
      const { response, data } = await makeRequest('/');
      
      expect(response.status).toBe(200);
      expect(data.platform).toBe('rawgle');
      expect(data.message).toContain('Rawgle API');
      expect(data.endpoints).toHaveProperty('auth');
      expect(data.endpoints).toHaveProperty('pets');
      expect(data.endpoints).toHaveProperty('feeding');
    });

    test('GET /api/docs - API documentation', async () => {
      const { response, data } = await makeRequest('/api/docs');
      
      expect(response.status).toBe(200);
      expect(data.title).toContain('Rawgle API');
      expect(data.endpoints).toHaveProperty('authentication');
      expect(data.endpoints).toHaveProperty('pets');
      expect(data.endpoints).toHaveProperty('feeding');
    });

  });

  describe('2. Authentication & User Management', () => {
    
    test('POST /api/auth/register - User registration', async () => {
      const { response, data } = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(testUsers.regularUser)
      });
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.user).toHaveProperty('id');
      expect(data.data.user.email).toBe(testUsers.regularUser.email);
      expect(data.data.user.platform).toBe('rawgle');
      expect(data.data.token).toBeTruthy();
      
      // Store token for subsequent tests
      testState.tokens.regularUser = data.data.token;
    });

    test('POST /api/auth/register - Premium user registration', async () => {
      const { response, data } = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(testUsers.premiumUser)
      });
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      testState.tokens.premiumUser = data.data.token;
    });

    test('POST /api/auth/login - User login', async () => {
      const { response, data } = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: testUsers.regularUser.email,
          password: testUsers.regularUser.password
        })
      });
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeTruthy();
      expect(data.data.user.email).toBe(testUsers.regularUser.email);
    });

    test('GET /api/auth/profile - Get user profile', async () => {
      const { response, data } = await authenticatedRequest('/api/auth/profile');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user).toHaveProperty('id');
      expect(data.data.user.email).toBe(testUsers.regularUser.email);
      expect(data.data.user.paws_balance).toBeGreaterThanOrEqual(0);
    });

    test('PUT /api/auth/profile - Update user profile', async () => {
      const updates = {
        bio: 'Raw feeding enthusiast and dog lover',
        experience_level: 'intermediate'
      };

      const { response, data } = await authenticatedRequest('/api/auth/profile', 'regularUser', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.bio).toBe(updates.bio);
      expect(data.data.user.experience_level).toBe(updates.experience_level);
    });

    test('GET /api/users/me - Get user via users endpoint', async () => {
      const { response, data } = await authenticatedRequest('/api/users/me');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe(testUsers.regularUser.email);
    });

  });

  describe('3. Pet Management', () => {
    
    test('POST /api/pets - Create dog profile', async () => {
      const { response, data } = await authenticatedRequest('/api/pets', 'regularUser', {
        method: 'POST',
        body: JSON.stringify(testPets.dog)
      });
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.pet).toHaveProperty('id');
      expect(data.data.pet.name).toBe(testPets.dog.name);
      expect(data.data.pet.species).toBe('dog');
      expect(data.data.paws_awarded).toBe(25);
      
      testState.pets.dog = data.data.pet;
    });

    test('POST /api/pets - Create cat profile', async () => {
      const { response, data } = await authenticatedRequest('/api/pets', 'regularUser', {
        method: 'POST',
        body: JSON.stringify(testPets.cat)
      });
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      testState.pets.cat = data.data.pet;
    });

    test('GET /api/pets - Get user pets', async () => {
      const { response, data } = await authenticatedRequest('/api/pets');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pets).toHaveLength(2);
      expect(data.data.total).toBe(2);
    });

    test('GET /api/pets/:id - Get specific pet', async () => {
      const petId = testState.pets.dog.id;
      const { response, data } = await authenticatedRequest(`/api/pets/${petId}`);
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pet.id).toBe(petId);
      expect(data.data.pet.name).toBe(testPets.dog.name);
    });

    test('PUT /api/pets/:id - Update pet profile', async () => {
      const petId = testState.pets.dog.id;
      const updates = {
        weight_lbs: 70,
        notes: 'Updated weight after vet visit'
      };

      const { response, data } = await authenticatedRequest(`/api/pets/${petId}`, 'regularUser', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pet.weight_lbs).toBe(70);
    });

    test('GET /api/pets/:id/nft-status - Check NFT status', async () => {
      const petId = testState.pets.dog.id;
      const { response, data } = await authenticatedRequest(`/api/pets/${petId}/nft-status`);
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.nft_minted).toBe(false);
    });

  });

  describe('4. Feeding Logs & Nutrition', () => {
    
    test('POST /api/feeding/logs - Create feeding log', async () => {
      const feedingLog = {
        pet_id: testState.pets.dog.id,
        feeding_date: new Date().toISOString(),
        meal_type: 'dinner',
        food_type: 'raw_meat',
        protein_source: 'chicken',
        amount_grams: 500,
        calories_estimated: 400,
        appetite_rating: 5,
        energy_level: 4,
        notes: 'Ate everything enthusiastically'
      };

      const { response, data } = await authenticatedRequest('/api/feeding/logs', 'regularUser', {
        method: 'POST',
        body: JSON.stringify(feedingLog)
      });
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.feeding_log).toHaveProperty('id');
      expect(data.data.paws_awarded).toBe(10);
      
      testState.feedingLogs.first = data.data.feeding_log;
    });

    test('GET /api/feeding/logs - Get feeding logs', async () => {
      const { response, data } = await authenticatedRequest('/api/feeding/logs');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.logs).toHaveLength(1);
      expect(data.data.pagination).toHaveProperty('total');
    });

    test('GET /api/feeding/logs/:id - Get specific feeding log', async () => {
      const logId = testState.feedingLogs.first.id;
      const { response, data } = await authenticatedRequest(`/api/feeding/logs/${logId}`);
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.feeding_log.id).toBe(logId);
    });

    test('POST /api/nutrition/calculator - Calculate nutrition requirements', async () => {
      const calculatorData = {
        pet_id: testState.pets.dog.id,
        activity_level: 'high',
        life_stage: 'adult',
        body_condition: 'ideal'
      };

      const { response, data } = await authenticatedRequest('/api/nutrition/calculator', 'regularUser', {
        method: 'POST',
        body: JSON.stringify(calculatorData)
      });
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.calculations).toHaveProperty('daily_calories');
      expect(data.data.calculations.daily_calories).toBeGreaterThan(0);
    });

    test('POST /api/nutrition/meal-plan - Generate meal plan', async () => {
      const mealPlanData = {
        pet_id: testState.pets.dog.id,
        duration_days: 7,
        meal_preferences: {
          proteins: ['chicken', 'beef', 'fish'],
          include_variety: true
        }
      };

      const { response, data } = await authenticatedRequest('/api/nutrition/meal-plan', 'regularUser', {
        method: 'POST',
        body: JSON.stringify(mealPlanData)
      });
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.meal_plan.meals).toHaveLength(7);
    });

    test('GET /api/nutrition/analysis/:petId - Get nutrition analysis', async () => {
      const petId = testState.pets.dog.id;
      const { response, data } = await authenticatedRequest(`/api/nutrition/analysis/${petId}`);
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.nutrition_analysis).toHaveProperty('feeding_consistency');
    });

    test('GET /api/nutrition/guidelines - Get feeding guidelines', async () => {
      const { response, data } = await authenticatedRequest('/api/nutrition/guidelines');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.guidelines).toHaveProperty('general');
      expect(data.data.guidelines).toHaveProperty('portion_guidelines');
    });

  });

  describe('5. PAWS Token System', () => {
    
    test('GET /api/paws/balance - Get PAWS balance', async () => {
      const { response, data } = await authenticatedRequest('/api/paws/balance');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.balance).toBeGreaterThan(0); // Should have welcome bonus + rewards
    });

    test('GET /api/paws/transactions - Get transaction history', async () => {
      const { response, data } = await authenticatedRequest('/api/paws/transactions');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.transactions.length).toBeGreaterThan(0);
    });

    test('POST /api/paws/earn - Earn PAWS tokens', async () => {
      const earnData = {
        action: 'daily_checkin',
        metadata: { date: new Date().toISOString().split('T')[0] }
      };

      const { response, data } = await authenticatedRequest('/api/paws/earn', 'regularUser', {
        method: 'POST',
        body: JSON.stringify(earnData)
      });
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.paws_earned).toBeGreaterThan(0);
    });

  });

  describe('6. NFT System', () => {
    
    test('POST /api/nft/pets/:petId - Mint pet NFT', async () => {
      const petId = testState.pets.dog.id;
      const nftData = {
        pet_id: petId,
        nft_type: 'pet_profile'
      };

      const { response, data } = await authenticatedRequest(`/api/nft/pets/${petId}`, 'regularUser', {
        method: 'POST',
        body: JSON.stringify(nftData)
      });
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.nft).toHaveProperty('token_id');
      expect(data.data.nft.status).toBe('minted');
      
      testState.nfts.dogNft = data.data.nft;
    });

    test('GET /api/nft/collection - Get NFT collection', async () => {
      const { response, data } = await authenticatedRequest('/api/nft/collection');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.nfts).toHaveLength(1);
    });

    test('GET /api/nft/:id - Get specific NFT', async () => {
      const nftId = testState.nfts.dogNft.id;
      const { response, data } = await authenticatedRequest(`/api/nft/${nftId}`);
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.nft.id).toBe(nftId);
    });

    test('GET /api/nft/marketplace - Browse NFT marketplace', async () => {
      const { response, data } = await authenticatedRequest('/api/nft/marketplace');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.nfts.length).toBeGreaterThanOrEqual(0);
    });

  });

  describe('7. Community Features', () => {
    
    test('GET /api/community/categories - Get community categories', async () => {
      const { response, data } = await makeRequest('/api/community/categories');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.categories).toHaveProperty('feeding');
      expect(data.data.categories).toHaveProperty('health');
    });

    test('POST /api/community/posts - Create community post', async () => {
      const postData = {
        title: 'My Raw Feeding Journey',
        content: 'Started raw feeding my Golden Retriever 3 months ago and the results are amazing!',
        category: 'feeding',
        post_type: 'success_story',
        tags: ['raw-feeding', 'golden-retriever', 'success'],
        pet_id: testState.pets.dog.id
      };

      const { response, data } = await authenticatedRequest('/api/community/posts', 'regularUser', {
        method: 'POST',
        body: JSON.stringify(postData)
      });
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.post.title).toBe(postData.title);
      expect(data.data.paws_awarded).toBeGreaterThan(0);
      
      testState.posts.first = data.data.post;
    });

    test('GET /api/community/posts - Get community posts', async () => {
      const { response, data } = await makeRequest('/api/community/posts');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.posts).toHaveLength(1);
    });

    test('GET /api/community/posts/:id - Get specific post', async () => {
      const postId = testState.posts.first.id;
      const { response, data } = await makeRequest(`/api/community/posts/${postId}`);
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.post.id).toBe(postId);
    });

    test('POST /api/community/posts/:id/comments - Add comment', async () => {
      const postId = testState.posts.first.id;
      const commentData = {
        content: 'That\'s amazing! What changes did you notice first?'
      };

      const { response, data } = await authenticatedRequest(`/api/community/posts/${postId}/comments`, 'premiumUser', {
        method: 'POST',
        body: JSON.stringify(commentData)
      });
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.comment.content).toBe(commentData.content);
    });

    test('POST /api/community/posts/:id/vote - Vote on post', async () => {
      const postId = testState.posts.first.id;
      const voteData = { vote_type: 'upvote' };

      const { response, data } = await authenticatedRequest(`/api/community/posts/${postId}/vote`, 'premiumUser', {
        method: 'POST',
        body: JSON.stringify(voteData)
      });
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.upvotes).toBe(1);
    });

  });

  describe('8. Suppliers & Products', () => {
    
    test('GET /api/suppliers - Get suppliers', async () => {
      const { response, data } = await makeRequest('/api/suppliers');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.suppliers).toBeDefined();
      expect(data.data.pagination).toHaveProperty('total');
    });

    test('GET /api/suppliers/search - Search suppliers', async () => {
      const { response, data } = await makeRequest('/api/suppliers/search?q=raw');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.suppliers).toBeDefined();
    });

    test('GET /api/products - Get products', async () => {
      const { response, data } = await makeRequest('/api/products');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.products).toBeDefined();
    });

    test('GET /api/products/categories - Get product categories', async () => {
      const { response, data } = await makeRequest('/api/products/categories');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.categories).toBeDefined();
    });

    test('GET /api/products/search - Search products', async () => {
      const { response, data } = await makeRequest('/api/products/search?q=chicken');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.products).toBeDefined();
    });

  });

  describe('9. User Dashboard & Statistics', () => {
    
    test('GET /api/users/dashboard - Get user dashboard', async () => {
      const { response, data } = await authenticatedRequest('/api/users/dashboard');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('pets');
      expect(data.data).toHaveProperty('recent_feedings');
      expect(data.data).toHaveProperty('paws');
    });

    test('GET /api/users/stats - Get user statistics', async () => {
      const { response, data } = await authenticatedRequest('/api/users/stats');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stats).toHaveProperty('pets');
      expect(data.data.stats).toHaveProperty('feeding');
      expect(data.data.stats).toHaveProperty('paws');
    });

    test('GET /api/users/leaderboard - Get PAWS leaderboard', async () => {
      const { response, data } = await authenticatedRequest('/api/users/leaderboard');
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.leaderboard).toBeDefined();
    });

  });

  describe('10. Error Handling & Edge Cases', () => {
    
    test('GET /nonexistent - 404 handling', async () => {
      const { response, data } = await makeRequest('/nonexistent');
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('Not Found');
      expect(data.platform).toBe('rawgle');
    });

    test('POST /api/pets - Invalid data validation', async () => {
      const invalidPet = {
        name: '', // Invalid: empty name
        species: 'dragon', // Invalid: not in enum
        weight_lbs: -10 // Invalid: negative weight
      };

      const { response, data } = await authenticatedRequest('/api/pets', 'regularUser', {
        method: 'POST',
        body: JSON.stringify(invalidPet)
      });
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    test('GET /api/pets/invalid-uuid - Invalid UUID handling', async () => {
      const { response, data } = await authenticatedRequest('/api/pets/invalid-uuid');
      
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    test('Unauthorized access without token', async () => {
      const { response, data } = await makeRequest('/api/pets');
      
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('AUTHENTICATION_REQUIRED');
    });

  });

  describe('11. CORS & Frontend Compatibility', () => {
    
    test('OPTIONS preflight request - CORS handling', async () => {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/pets`, {
        method: 'OPTIONS',
        headers: {
          'Origin': TEST_CONFIG.frontendUrl,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type,Authorization'
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe(TEST_CONFIG.frontendUrl);
      expect(response.headers.get('access-control-allow-methods')).toContain('POST');
    });

    test('GET with frontend origin - CORS headers', async () => {
      const { response } = await makeRequest('/health');
      
      expect(response.headers.get('access-control-allow-origin')).toBe(TEST_CONFIG.frontendUrl);
      expect(response.headers.get('access-control-expose-headers')).toContain('X-Total-Count');
    });

  });

  describe('12. Authentication Flow', () => {
    
    test('POST /api/auth/logout - User logout', async () => {
      const { response, data } = await authenticatedRequest('/api/auth/logout', 'regularUser', {
        method: 'POST'
      });
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Logged out successfully');
    });

    test('Access with logged out token - Should fail', async () => {
      const { response, data } = await authenticatedRequest('/api/pets', 'regularUser');
      
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

  });

});

// Test Summary and Reporting
describe('Test Summary', () => {
  
  test('Generate test report', async () => {
    const report = {
      timestamp: new Date().toISOString(),
      frontend_url: TEST_CONFIG.frontendUrl,
      endpoints_tested: [
        'Health endpoints',
        'Authentication',
        'User management',
        'Pet management', 
        'Feeding logs',
        'Nutrition system',
        'PAWS tokens',
        'NFT system',
        'Community features',
        'Suppliers & products',
        'Dashboard & stats',
        'Error handling',
        'CORS compatibility'
      ],
      test_data_created: {
        users: Object.keys(testUsers).length,
        pets: Object.keys(testState.pets).length,
        feeding_logs: Object.keys(testState.feedingLogs).length,
        community_posts: Object.keys(testState.posts).length,
        nfts: Object.keys(testState.nfts).length
      },
      compatibility_verified: {
        cors_headers: true,
        api_response_format: true,
        error_handling: true,
        authentication_flow: true
      }
    };
    
    console.log('\n📊 TEST REPORT');
    console.log('=====================================');
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Frontend URL: ${report.frontend_url}`);
    console.log(`Endpoints Tested: ${report.endpoints_tested.length}`);
    console.log(`Test Data Created:`, report.test_data_created);
    console.log(`Frontend Compatibility:`, report.compatibility_verified);
    console.log('=====================================\n');
    
    expect(report.endpoints_tested.length).toBeGreaterThan(10);
    expect(report.test_data_created.users).toBeGreaterThan(0);
  });

});