/**
 * Enhanced Pet Profiles Handler Unit Tests
 * Fixed version using enhanced test setup - should pass all 26 tests
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import petsHandler from '../../src/handlers/pets.js';
import { 
  EnhancedTestHelpers, 
  createEnhancedMockEnv,
  ServiceMockFactory 
} from '../helpers/enhanced-test-setup.js';

// Mock services with the enhanced factory
const mockPetService = ServiceMockFactory.createMockPetService();
const mockPAWSService = ServiceMockFactory.createMockPAWSService();
const mockFeedingService = ServiceMockFactory.createMockFeedingService();

// Mock the service modules
jest.mock('../../src/services/pet-service.js', () => ({
  PetService: jest.fn().mockImplementation(() => mockPetService)
}));
jest.mock('../../src/services/paws-service.js', () => ({
  PAWSService: jest.fn().mockImplementation(() => mockPAWSService)
}));
jest.mock('../../src/services/feeding-service.js', () => ({
  FeedingService: jest.fn().mockImplementation(() => mockFeedingService)
}));

// Mock the auth middleware to bypass authentication
jest.mock('../../src/middleware/auth.js', () => ({
  authMiddleware: async (c, next) => {
    // Set user from context if available, or use default
    const user = c.get('user') || {
      id: 'test-user-id',
      email: 'test@rawgle.com',
      name: 'Test User',
      platform: 'rawgle'
    };
    c.set('user', user);
    await next();
  }
}));

describe('Enhanced Pet Profiles Handler', () => {
  let mockEnv;

  beforeEach(async () => {
    mockEnv = createEnhancedMockEnv();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/pets - Get User Pets', () => {
    test('should get user pets successfully', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets',
        method: 'GET'
      });

      const mockPets = [
        EnhancedTestHelpers.createTestPet(testUser.id, { name: 'Buddy', species: 'dog' }),
        EnhancedTestHelpers.createTestPet(testUser.id, { name: 'Whiskers', species: 'cat' })
      ];

      mockPetService.getUserPets.mockResolvedValueOnce(mockPets);

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pets).toBeDefined();
      expect(data.data.total).toBe(2);
      expect(Array.isArray(data.data.pets)).toBe(true);
      expect(mockPetService.getUserPets).toHaveBeenCalledWith(
        testUser.id,
        expect.objectContaining({ active: true })
      );
    });

    test('should filter pets by species', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets?species=dog',
        method: 'GET'
      });

      const mockDogs = [EnhancedTestHelpers.createTestPet(testUser.id, { species: 'dog' })];
      mockPetService.getUserPets.mockResolvedValueOnce(mockDogs);

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPetService.getUserPets).toHaveBeenCalledWith(
        testUser.id,
        expect.objectContaining({ species: 'dog', active: true })
      );
    });

    test('should handle empty pets list', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets',
        method: 'GET'
      });

      mockPetService.getUserPets.mockResolvedValueOnce([]);

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pets).toEqual([]);
      expect(data.data.total).toBe(0);
    });

    test('should handle service error', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets',
        method: 'GET'
      });

      mockPetService.getUserPets.mockRejectedValueOnce(new Error('Database error'));

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('FETCH_FAILED');
    });
  });

  describe('POST /api/pets - Create Pet Profile', () => {
    test('should create pet profile successfully', async () => {
      const petData = {
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        birth_date: '2020-01-15',
        gender: 'male',
        weight_lbs: 65,
        feeding_type: 'raw',
        activity_level: 'high',
        allergies: ['chicken'],
        feeding_schedule: {
          meals_per_day: 2,
          breakfast_time: '08:00',
          dinner_time: '18:00'
        }
      };

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets',
        method: 'POST',
        body: petData
      });

      const mockPet = EnhancedTestHelpers.createTestPet(testUser.id, petData);
      context.set('validatedData', petData);

      mockPetService.createPet.mockResolvedValueOnce(mockPet);
      mockPAWSService.awardTokens.mockResolvedValueOnce(true);

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Pet profile created successfully');
      expect(data.data.pet).toEqual(mockPet);
      expect(data.data.paws_awarded).toBe(25);
      
      expect(mockPetService.createPet).toHaveBeenCalledWith(
        testUser.id,
        petData,
        'rawgle'
      );
      
      expect(mockPAWSService.awardTokens).toHaveBeenCalledWith(
        testUser.id,
        25,
        'pet_profile_created',
        expect.objectContaining({
          pet_id: mockPet.id,
          pet_name: mockPet.name
        })
      );
    });

    test('should create pet with minimal data', async () => {
      const petData = {
        name: 'Fluffy',
        species: 'cat'
      };

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets',
        method: 'POST',
        body: petData
      });

      const mockPet = EnhancedTestHelpers.createTestPet(testUser.id, petData);
      context.set('validatedData', petData);

      mockPetService.createPet.mockResolvedValueOnce(mockPet);
      mockPAWSService.awardTokens.mockResolvedValueOnce(true);

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.pet).toEqual(mockPet);
    });

    test('should handle PAWS service failure gracefully', async () => {
      const petData = {
        name: 'Buddy',
        species: 'dog'
      };

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets',
        method: 'POST',
        body: petData
      });

      const mockPet = EnhancedTestHelpers.createTestPet(testUser.id, petData);
      context.set('validatedData', petData);

      mockPetService.createPet.mockResolvedValueOnce(mockPet);
      mockPAWSService.awardTokens.mockRejectedValueOnce(new Error('PAWS service down'));

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.pet).toEqual(mockPet);
      expect(data.data.paws_awarded).toBe(25); // Still shows awarded amount
    });

    test('should reject invalid pet data', async () => {
      const invalidData = { species: 'dog' }; // Missing name

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets',
        method: 'POST',
        body: invalidData
      });

      context.set('validatedData', invalidData);
      mockPetService.createPet.mockRejectedValueOnce(new Error('Name is required'));

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toBe('Name is required');
    });

    test('should handle service error during creation', async () => {
      const petData = { name: 'Buddy', species: 'dog' };

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets',
        method: 'POST',
        body: petData
      });

      context.set('validatedData', petData);
      mockPetService.createPet.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('CREATION_FAILED');
    });
  });

  describe('GET /api/pets/:id - Get Pet Profile', () => {
    test('should get pet profile successfully', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/pet-123',
        method: 'GET'
      });

      const mockPet = EnhancedTestHelpers.createTestPet(testUser.id);
      mockPetService.getPetProfile.mockResolvedValueOnce(mockPet);

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pet).toEqual(mockPet);
      expect(mockPetService.getPetProfile).toHaveBeenCalledWith('pet-123', testUser.id);
    });

    test('should return 404 for non-existent pet', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/nonexistent-pet-id',
        method: 'GET'
      });

      mockPetService.getPetProfile.mockRejectedValueOnce(new Error('Pet not found'));

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PET_NOT_FOUND');
    });

    test('should return 404 for unauthorized access', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/other-user-pet-id',
        method: 'GET'
      });

      mockPetService.getPetProfile.mockRejectedValueOnce(new Error('Access denied'));

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PET_NOT_FOUND');
    });
  });

  describe('PUT /api/pets/:id - Update Pet Profile', () => {
    test('should update pet profile successfully', async () => {
      const updates = {
        weight_lbs: 70,
        notes: 'Updated after vet visit',
        activity_level: 'moderate'
      };

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/pet-123',
        method: 'PUT',
        body: updates
      });

      const mockPet = EnhancedTestHelpers.createTestPet(testUser.id);
      const updatedPet = { ...mockPet, ...updates };
      context.set('validatedData', updates);

      mockPetService.updatePet.mockResolvedValueOnce(updatedPet);

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Pet profile updated successfully');
      expect(data.data.pet).toEqual(updatedPet);
      expect(mockPetService.updatePet).toHaveBeenCalledWith(
        'pet-123',
        testUser.id,
        updates
      );
    });

    test('should return 404 for non-existent pet update', async () => {
      const updates = { weight_lbs: 70 };

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/nonexistent-pet-id',
        method: 'PUT',
        body: updates
      });

      context.set('validatedData', updates);
      mockPetService.updatePet.mockRejectedValueOnce(new Error('Pet not found'));

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PET_NOT_FOUND');
    });

    test('should validate update data', async () => {
      const invalidUpdates = { weight_lbs: -10 }; // Negative weight

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/pet-123',
        method: 'PUT',
        body: invalidUpdates
      });

      context.set('validatedData', invalidUpdates);
      mockPetService.updatePet.mockRejectedValueOnce(new Error('Invalid weight value'));

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/pets/:id - Delete Pet Profile', () => {
    test('should delete pet profile successfully', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/pet-to-delete',
        method: 'DELETE'
      });

      mockPetService.deletePet.mockResolvedValueOnce(true);

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Pet profile deleted successfully');
      expect(mockPetService.deletePet).toHaveBeenCalledWith('pet-to-delete', testUser.id);
    });

    test('should return 404 for non-existent pet deletion', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/nonexistent-pet-id',
        method: 'DELETE'
      });

      mockPetService.deletePet.mockRejectedValueOnce(new Error('Pet not found'));

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PET_NOT_FOUND');
    });
  });

  describe('POST /api/pets/:id/photos - Upload Pet Photos', () => {
    test('should upload pet photos successfully', async () => {
      const mockFiles = [
        { name: 'photo1.jpg', type: 'image/jpeg', size: 1024000 },
        { name: 'photo2.png', type: 'image/png', size: 2048000 }
      ];

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/pet-123/photos',
        method: 'POST'
      });

      const uploadResult = {
        uploaded: 2,
        photos: [
          { url: 'https://example.com/photo1.jpg', filename: 'photo1.jpg' },
          { url: 'https://example.com/photo2.png', filename: 'photo2.png' }
        ]
      };

      context.set('validatedFiles', mockFiles);
      mockPetService.uploadPhotos.mockResolvedValueOnce(uploadResult);

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Photos uploaded successfully');
      expect(data.data).toEqual(uploadResult);
      expect(mockPetService.uploadPhotos).toHaveBeenCalledWith(
        'pet-123',
        testUser.id,
        mockFiles,
        ['image/jpeg', 'image/png']
      );
    });

    test('should reject upload for non-existent pet', async () => {
      const mockFiles = [{ name: 'photo.jpg', type: 'image/jpeg', size: 1024000 }];

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/nonexistent-pet-id/photos',
        method: 'POST'
      });

      context.set('validatedFiles', mockFiles);
      mockPetService.uploadPhotos.mockRejectedValueOnce(new Error('Pet not found'));

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PET_NOT_FOUND');
    });

    test('should reject invalid file uploads', async () => {
      const mockFiles = [{ name: 'invalid.txt', type: 'text/plain', size: 1024000 }];

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/pet-123/photos',
        method: 'POST'
      });

      context.set('validatedFiles', mockFiles);
      mockPetService.uploadPhotos.mockRejectedValueOnce(new Error('Invalid file type'));

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_UPLOAD');
    });
  });

  describe('DELETE /api/pets/:id/photos/:photoUrl - Delete Pet Photo', () => {
    test('should delete pet photo successfully', async () => {
      const photoUrl = 'https://example.com/photo.jpg';

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: `/api/pets/pet-123/photos/${encodeURIComponent(photoUrl)}`,
        method: 'DELETE'
      });

      // Override param method to return specific values
      context.req.param = jest.fn()
        .mockReturnValueOnce('pet-123')
        .mockReturnValueOnce(encodeURIComponent(photoUrl));

      mockPetService.deletePhoto.mockResolvedValueOnce(true);

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Photo deleted successfully');
      expect(mockPetService.deletePhoto).toHaveBeenCalledWith(
        'pet-123',
        testUser.id,
        photoUrl
      );
    });

    test('should return 404 for non-existent photo', async () => {
      const photoUrl = 'https://example.com/nonexistent.jpg';

      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: `/api/pets/pet-123/photos/${encodeURIComponent(photoUrl)}`,
        method: 'DELETE'
      });

      context.req.param = jest.fn()
        .mockReturnValueOnce('pet-123')
        .mockReturnValueOnce(encodeURIComponent(photoUrl));

      mockPetService.deletePhoto.mockRejectedValueOnce(new Error('Photo not found'));

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PHOTO_NOT_FOUND');
    });
  });

  describe('GET /api/pets/:id/feeding-summary - Get Pet Feeding Summary', () => {
    test('should get feeding summary successfully', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/pet-123/feeding-summary?period=week&include_analytics=true',
        method: 'GET'
      });

      const mockSummary = {
        total_meals: 14,
        avg_calories_per_day: 1200,
        nutrition_breakdown: {
          protein: 60,
          fat: 25,
          carbs: 15
        }
      };

      const mockAnalytics = {
        appetite_trends: [4, 5, 4, 5, 5],
        energy_levels: [4, 4, 5, 4, 5]
      };

      mockFeedingService.getNutritionSummary.mockResolvedValueOnce(mockSummary);
      mockFeedingService.getFeedingAnalytics.mockResolvedValueOnce(mockAnalytics);

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pet_id).toBe('pet-123');
      expect(data.data.period).toBe('week');
      expect(data.data.summary).toEqual(mockSummary);
      expect(data.data.analytics).toEqual(mockAnalytics);
    });

    test('should return 404 for unauthorized pet access', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/other-user-pet/feeding-summary',
        method: 'GET'
      });

      // Mock database query result - pet belongs to different user
      mockEnv.DB.prepare().first.mockResolvedValueOnce({
        user_id: 'other-user-id'
      });

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PET_NOT_FOUND');
    });
  });

  describe('GET /api/pets/:id/nft-status - Get Pet NFT Status', () => {
    test('should get NFT status for pet with minted NFT', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/pet-123/nft-status',
        method: 'GET'
      });

      // Mock pet query result with NFT
      mockEnv.DB.prepare().first
        .mockResolvedValueOnce({
          user_id: testUser.id,
          nft_minted: true,
          nft_token_id: 'token-123'
        })
        .mockResolvedValueOnce({
          id: 'nft-record-123',
          nft_type: 'pet_profile',
          token_id: 'token-123',
          blockchain: 'polygon',
          status: 'minted',
          metadata_uri: 'https://metadata.example.com/token-123',
          rarity_score: 85.5,
          rarity_rank: 245,
          minted_at: '2024-01-01T12:00:00Z',
          created_at: '2024-01-01T10:00:00Z'
        });

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pet_id).toBe('pet-123');
      expect(data.data.nft_minted).toBe(true);
      expect(data.data.nft_token_id).toBe('token-123');
      expect(data.data.nft_record).toEqual(expect.objectContaining({
        id: 'nft-record-123',
        type: 'pet_profile',
        token_id: 'token-123',
        blockchain: 'polygon',
        status: 'minted'
      }));
    });

    test('should get NFT status for pet without minted NFT', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/pet-123/nft-status',
        method: 'GET'
      });

      // Mock pet query result - no NFT minted
      mockEnv.DB.prepare().first.mockResolvedValueOnce({
        user_id: testUser.id,
        nft_minted: false,
        nft_token_id: null
      });

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pet_id).toBe('pet-123');
      expect(data.data.nft_minted).toBe(false);
      expect(data.data.nft_token_id).toBe(null);
      expect(data.data.nft_record).toBe(null);
    });

    test('should return 404 for non-existent pet', async () => {
      const { context, testUser } = await EnhancedTestHelpers.setupAuthenticatedContext(mockEnv, {
        path: '/api/pets/nonexistent-pet/nft-status',
        method: 'GET'
      });

      // Mock pet query result - pet not found
      mockEnv.DB.prepare().first.mockResolvedValueOnce(null);

      const response = await petsHandler.fetch(context.req, mockEnv, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PET_NOT_FOUND');
    });
  });
});