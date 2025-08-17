/**
 * Pet Profiles Handler Unit Tests
 * Tests all pet management endpoints with comprehensive coverage
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import petsHandler from '../../src/handlers/pets.js';
import { PetService } from '../../src/services/pet-service.js';
import { PAWSService } from '../../src/services/paws-service.js';
import { FeedingService } from '../../src/services/feeding-service.js';
import { TestHelpers, createMockEnv } from '../helpers/test-setup.js';

// Mock the auth middleware to bypass authentication
jest.mock('../../src/middleware/auth.js', () => ({
  authMiddleware: async (c, next) => {
    // Skip authentication and call next()
    await next();
  }
}));

// Mock services with manual implementation
const mockPetService = {
  getUserPets: jest.fn(),
  createPet: jest.fn(),
  getPetProfile: jest.fn(),
  updatePet: jest.fn(),
  deletePet: jest.fn(),
  uploadPhotos: jest.fn(),
  deletePhoto: jest.fn()
};

const mockPAWSService = {
  awardPAWS: jest.fn(),
  getPAWSBalance: jest.fn(),
  awardTokens: jest.fn()
};

const mockFeedingService = {
  createFeedingLog: jest.fn(),
  getFeedingHistory: jest.fn(),
  getNutritionSummary: jest.fn(),
  getFeedingAnalytics: jest.fn()
};

// Disable service mocking to test real services with mocked database
// jest.mock('../../src/services/pet-service.js', () => ({
//   PetService: jest.fn().mockImplementation(() => mockPetService)
// }));
// jest.mock('../../src/services/paws-service.js', () => ({
//   PAWSService: jest.fn().mockImplementation(() => mockPAWSService)
// }));
// jest.mock('../../src/services/feeding-service.js', () => ({
//   FeedingService: jest.fn().mockImplementation(() => mockFeedingService)
// }));

describe('Pet Profiles Handler', () => {
  let mockEnv;
  let mockContext;
  let testUser;
  let authToken;

  beforeEach(async () => {
    mockEnv = createMockEnv();
    
    // Create a test user and auth token for pets tests
    testUser = TestHelpers.createTestUser({ email: 'petowner@rawgle.com' });
    authToken = await TestHelpers.mockJWT({ 
      userId: testUser.id, 
      email: testUser.email,
      platform: 'rawgle'
    });
    
    // Mock the database to return the user for auth middleware
    mockEnv.DB.prepare.mockImplementation((query) => {
      const stmt = {
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockImplementation(async () => {
          // For auth middleware user lookup
          if (query.includes('SELECT id, email, name, platform')) {
            return {
              id: testUser.id,
              email: testUser.email,
              name: testUser.name,
              platform: 'rawgle',
              subscription_tier: 'free',
              email_verified: true,
              profile_completed: true,
              onboarding_completed: true,
              deleted_at: null,
              last_login: new Date().toISOString()
            };
          }
          return null;
        }),
        all: jest.fn().mockImplementation(async () => {
          // For pets query
          if (query.includes('SELECT id, name, species')) {
            return {
              results: [
                {
                  id: 'pet-1',
                  name: 'Buddy',
                  species: 'dog',
                  breed: 'Golden Retriever',
                  birth_date: '2020-01-15',
                  gender: 'male',
                  weight_lbs: 65,
                  color_markings: 'Golden',
                  feeding_type: 'raw',
                  activity_level: 'high',
                  photos: '[]',
                  allergies: '[]',
                  dietary_restrictions: '[]',
                  nft_minted: false,
                  nft_token_id: null,
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z'
                },
                {
                  id: 'pet-2',
                  name: 'Whiskers',
                  species: 'cat',
                  breed: 'Siamese',
                  birth_date: '2021-03-10',
                  gender: 'female',
                  weight_lbs: 10,
                  color_markings: 'Cream and brown',
                  feeding_type: 'raw',
                  activity_level: 'moderate',
                  photos: '[]',
                  allergies: '[]',
                  dietary_restrictions: '[]',
                  nft_minted: false,
                  nft_token_id: null,
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z'
                }
              ]
            };
          }
          return { results: [] };
        }),
        run: jest.fn().mockResolvedValue({ success: true, meta: { changed_rows: 1, last_row_id: 'test' } })
      };
      return stmt;
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/pets - Get User Pets', () => {
    test('should get user pets successfully', async () => {
      // Database is already mocked in beforeEach to return pets data

      // Create mock context with auth user set and Authorization header
      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest('/', {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${authToken}` 
          }
        })
      });
      mockContext.set('user', testUser);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Response data:', data);
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pets).toBeDefined();
      expect(data.data.total).toBe(2);
      expect(Array.isArray(data.data.pets)).toBe(true);
      // The real service should have been called with the database
      expect(data.data.pets[0]).toMatchObject({
        id: 'pet-1',
        name: 'Buddy',
        species: 'dog'
      });
      expect(data.data.pets[1]).toMatchObject({
        id: 'pet-2',
        name: 'Whiskers',
        species: 'cat'
      });
    });

    test('should filter pets by species', async () => {
      const mockUser = TestHelpers.createTestUser();
      const mockDogs = [TestHelpers.createTestPet(mockUser.id, { species: 'dog' })];

      mockPetService.getUserPets.mockResolvedValueOnce(mockDogs);

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest('/api/pets?species=dog')
      });

      mockContext.set('user', mockUser);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPetService.getUserPets).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ species: 'dog', active: true })
      );
    });

    test('should handle empty pets list', async () => {
      const mockUser = TestHelpers.createTestUser();
      mockPetService.getUserPets.mockResolvedValueOnce([]);

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest('/api/pets')
      });

      mockContext.set('user', mockUser);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pets).toEqual([]);
      expect(data.data.total).toBe(0);
    });

    test('should handle service error', async () => {
      const mockUser = TestHelpers.createTestUser();
      mockPetService.getUserPets.mockRejectedValueOnce(new Error('Database error'));

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest('/api/pets')
      });

      mockContext.set('user', mockUser);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('FETCH_FAILED');
    });
  });

  describe('POST /api/pets - Create Pet Profile', () => {
    test('should create pet profile successfully', async () => {
      const mockUser = TestHelpers.createTestUser();
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

      const mockPet = TestHelpers.createTestPet(mockUser.id, petData);

      mockPetService.createPet.mockResolvedValueOnce(mockPet);
      mockPAWSService.awardTokens.mockResolvedValueOnce(true);

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest('/api/pets', {
          method: 'POST',
          body: petData
        })
      });

      mockContext.set('user', mockUser);
      mockContext.set('validatedData', petData);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Pet profile created successfully');
      expect(data.data.pet).toEqual(mockPet);
      expect(data.data.paws_awarded).toBe(25);
      
      expect(mockPetService.createPet).toHaveBeenCalledWith(
        mockUser.id,
        petData,
        'rawgle'
      );
      
      expect(mockPAWSService.awardTokens).toHaveBeenCalledWith(
        mockUser.id,
        25,
        'pet_profile_created',
        expect.objectContaining({
          pet_id: mockPet.id,
          pet_name: mockPet.name
        })
      );
    });

    test('should create pet with minimal data', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petData = {
        name: 'Fluffy',
        species: 'cat'
      };

      const mockPet = TestHelpers.createTestPet(mockUser.id, petData);

      mockPetService.createPet.mockResolvedValueOnce(mockPet);
      mockPAWSService.awardTokens.mockResolvedValueOnce(true);

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest('/api/pets', {
          method: 'POST',
          body: petData
        })
      });

      mockContext.set('user', mockUser);
      mockContext.set('validatedData', petData);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.pet).toEqual(mockPet);
    });

    test('should handle PAWS service failure gracefully', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petData = {
        name: 'Buddy',
        species: 'dog'
      };

      const mockPet = TestHelpers.createTestPet(mockUser.id, petData);

      mockPetService.createPet.mockResolvedValueOnce(mockPet);
      mockPAWSService.awardTokens.mockRejectedValueOnce(new Error('PAWS service down'));

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest('/api/pets', {
          method: 'POST',
          body: petData
        })
      });

      mockContext.set('user', mockUser);
      mockContext.set('validatedData', petData);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.pet).toEqual(mockPet);
      expect(data.data.paws_awarded).toBe(25); // Still shows awarded amount
    });

    test('should reject invalid pet data', async () => {
      const mockUser = TestHelpers.createTestUser();
      mockPetService.createPet.mockRejectedValueOnce(
        new Error('Name is required')
      );

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest('/api/pets', {
          method: 'POST',
          body: { species: 'dog' } // Missing name
        })
      });

      mockContext.set('user', mockUser);
      mockContext.set('validatedData', { species: 'dog' });

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toBe('Name is required');
    });

    test('should handle service error during creation', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petData = { name: 'Buddy', species: 'dog' };

      mockPetService.createPet.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest('/api/pets', {
          method: 'POST',
          body: petData
        })
      });

      mockContext.set('user', mockUser);
      mockContext.set('validatedData', petData);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('CREATION_FAILED');
    });
  });

  describe('GET /api/pets/:id - Get Pet Profile', () => {
    test('should get pet profile successfully', async () => {
      const mockUser = TestHelpers.createTestUser();
      const mockPet = TestHelpers.createTestPet(mockUser.id);

      mockPetService.getPetProfile.mockResolvedValueOnce(mockPet);

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${mockPet.id}`)
      });

      mockContext.set('user', mockUser);

      // Mock the param function
      mockContext.req.param = jest.fn().mockReturnValue(mockPet.id);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pet).toEqual(mockPet);
      expect(mockPetService.getPetProfile).toHaveBeenCalledWith(mockPet.id, mockUser.id);
    });

    test('should return 404 for non-existent pet', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petId = 'nonexistent-pet-id';

      mockPetService.getPetProfile.mockRejectedValueOnce(
        new Error('Pet not found')
      );

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${petId}`)
      });

      mockContext.set('user', mockUser);
      mockContext.req.param = jest.fn().mockReturnValue(petId);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PET_NOT_FOUND');
    });

    test('should return 404 for unauthorized access', async () => {
      const mockUser = TestHelpers.createTestUser();
      const otherUserPetId = 'other-user-pet-id';

      mockPetService.getPetProfile.mockRejectedValueOnce(
        new Error('Access denied')
      );

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${otherUserPetId}`)
      });

      mockContext.set('user', mockUser);
      mockContext.req.param = jest.fn().mockReturnValue(otherUserPetId);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PET_NOT_FOUND');
    });
  });

  describe('PUT /api/pets/:id - Update Pet Profile', () => {
    test('should update pet profile successfully', async () => {
      const mockUser = TestHelpers.createTestUser();
      const mockPet = TestHelpers.createTestPet(mockUser.id);
      const updates = {
        weight_lbs: 70,
        notes: 'Updated after vet visit',
        activity_level: 'moderate'
      };
      const updatedPet = { ...mockPet, ...updates };

      mockPetService.updatePet.mockResolvedValueOnce(updatedPet);

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${mockPet.id}`, {
          method: 'PUT',
          body: updates
        })
      });

      mockContext.set('user', mockUser);
      mockContext.set('validatedData', updates);
      mockContext.req.param = jest.fn().mockReturnValue(mockPet.id);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Pet profile updated successfully');
      expect(data.data.pet).toEqual(updatedPet);
      expect(mockPetService.updatePet).toHaveBeenCalledWith(
        mockPet.id,
        mockUser.id,
        updates
      );
    });

    test('should return 404 for non-existent pet update', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petId = 'nonexistent-pet-id';
      const updates = { weight_lbs: 70 };

      mockPetService.updatePet.mockRejectedValueOnce(
        new Error('Pet not found')
      );

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${petId}`, {
          method: 'PUT',
          body: updates
        })
      });

      mockContext.set('user', mockUser);
      mockContext.set('validatedData', updates);
      mockContext.req.param = jest.fn().mockReturnValue(petId);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PET_NOT_FOUND');
    });

    test('should validate update data', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petId = 'pet-123';
      const invalidUpdates = { weight_lbs: -10 }; // Negative weight

      mockPetService.updatePet.mockRejectedValueOnce(
        new Error('Invalid weight value')
      );

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${petId}`, {
          method: 'PUT',
          body: invalidUpdates
        })
      });

      mockContext.set('user', mockUser);
      mockContext.set('validatedData', invalidUpdates);
      mockContext.req.param = jest.fn().mockReturnValue(petId);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/pets/:id - Delete Pet Profile', () => {
    test('should delete pet profile successfully', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petId = 'pet-to-delete';

      mockPetService.deletePet.mockResolvedValueOnce(true);

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${petId}`, {
          method: 'DELETE'
        })
      });

      mockContext.set('user', mockUser);
      mockContext.req.param = jest.fn().mockReturnValue(petId);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Pet profile deleted successfully');
      expect(mockPetService.deletePet).toHaveBeenCalledWith(petId, mockUser.id);
    });

    test('should return 404 for non-existent pet deletion', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petId = 'nonexistent-pet-id';

      mockPetService.deletePet.mockRejectedValueOnce(
        new Error('Pet not found')
      );

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${petId}`, {
          method: 'DELETE'
        })
      });

      mockContext.set('user', mockUser);
      mockContext.req.param = jest.fn().mockReturnValue(petId);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PET_NOT_FOUND');
    });
  });

  describe('POST /api/pets/:id/photos - Upload Pet Photos', () => {
    test('should upload pet photos successfully', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petId = 'pet-123';
      const mockFiles = [
        { name: 'photo1.jpg', type: 'image/jpeg', size: 1024000 },
        { name: 'photo2.png', type: 'image/png', size: 2048000 }
      ];

      const uploadResult = {
        uploaded: 2,
        photos: [
          { url: 'https://example.com/photo1.jpg', filename: 'photo1.jpg' },
          { url: 'https://example.com/photo2.png', filename: 'photo2.png' }
        ]
      };

      mockPetService.uploadPhotos.mockResolvedValueOnce(uploadResult);

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${petId}/photos`, {
          method: 'POST'
        })
      });

      mockContext.set('user', mockUser);
      mockContext.set('validatedFiles', mockFiles);
      mockContext.req.param = jest.fn().mockReturnValue(petId);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Photos uploaded successfully');
      expect(data.data).toEqual(uploadResult);
      expect(mockPetService.uploadPhotos).toHaveBeenCalledWith(
        petId,
        mockUser.id,
        mockFiles,
        ['image/jpeg', 'image/png']
      );
    });

    test('should reject upload for non-existent pet', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petId = 'nonexistent-pet-id';
      const mockFiles = [{ name: 'photo.jpg', type: 'image/jpeg', size: 1024000 }];

      mockPetService.uploadPhotos.mockRejectedValueOnce(
        new Error('Pet not found')
      );

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${petId}/photos`, {
          method: 'POST'
        })
      });

      mockContext.set('user', mockUser);
      mockContext.set('validatedFiles', mockFiles);
      mockContext.req.param = jest.fn().mockReturnValue(petId);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PET_NOT_FOUND');
    });

    test('should reject invalid file uploads', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petId = 'pet-123';
      const mockFiles = [{ name: 'invalid.txt', type: 'text/plain', size: 1024000 }];

      mockPetService.uploadPhotos.mockRejectedValueOnce(
        new Error('Invalid file type')
      );

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${petId}/photos`, {
          method: 'POST'
        })
      });

      mockContext.set('user', mockUser);
      mockContext.set('validatedFiles', mockFiles);
      mockContext.req.param = jest.fn().mockReturnValue(petId);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_UPLOAD');
    });
  });

  describe('DELETE /api/pets/:id/photos/:photoUrl - Delete Pet Photo', () => {
    test('should delete pet photo successfully', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petId = 'pet-123';
      const photoUrl = 'https://example.com/photo.jpg';

      mockPetService.deletePhoto.mockResolvedValueOnce(true);

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${petId}/photos/${encodeURIComponent(photoUrl)}`, {
          method: 'DELETE'
        })
      });

      mockContext.set('user', mockUser);
      mockContext.req.param = jest.fn()
        .mockReturnValueOnce(petId)
        .mockReturnValueOnce(encodeURIComponent(photoUrl));

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Photo deleted successfully');
      expect(mockPetService.deletePhoto).toHaveBeenCalledWith(
        petId,
        mockUser.id,
        photoUrl
      );
    });

    test('should return 404 for non-existent photo', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petId = 'pet-123';
      const photoUrl = 'https://example.com/nonexistent.jpg';

      mockPetService.deletePhoto.mockRejectedValueOnce(
        new Error('Photo not found')
      );

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${petId}/photos/${encodeURIComponent(photoUrl)}`, {
          method: 'DELETE'
        })
      });

      mockContext.set('user', mockUser);
      mockContext.req.param = jest.fn()
        .mockReturnValueOnce(petId)
        .mockReturnValueOnce(encodeURIComponent(photoUrl));

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PHOTO_NOT_FOUND');
    });
  });

  describe('GET /api/pets/:id/feeding-summary - Get Pet Feeding Summary', () => {
    test('should get feeding summary successfully', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petId = 'pet-123';

      // Mock database query result
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce({
        user_id: mockUser.id
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

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${petId}/feeding-summary?period=week&include_analytics=true`)
      });

      mockContext.set('user', mockUser);
      mockContext.req.param = jest.fn().mockReturnValue(petId);
      mockContext.req.query = jest.fn().mockReturnValue({
        period: 'week',
        include_analytics: 'true'
      });

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pet_id).toBe(petId);
      expect(data.data.period).toBe('week');
      expect(data.data.summary).toEqual(mockSummary);
      expect(data.data.analytics).toEqual(mockAnalytics);
    });

    test('should return 404 for unauthorized pet access', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petId = 'other-user-pet';

      // Mock database query result - pet belongs to different user
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce({
        user_id: 'other-user-id'
      });

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${petId}/feeding-summary`)
      });

      mockContext.set('user', mockUser);
      mockContext.req.param = jest.fn().mockReturnValue(petId);
      mockContext.req.query = jest.fn().mockReturnValue({});

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PET_NOT_FOUND');
    });
  });

  describe('GET /api/pets/:id/nft-status - Get Pet NFT Status', () => {
    test('should get NFT status for pet with minted NFT', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petId = 'pet-123';

      // Mock pet query result
      mockEnv.DB.prepare().bind().first
        .mockResolvedValueOnce({
          user_id: mockUser.id,
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

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${petId}/nft-status`)
      });

      mockContext.set('user', mockUser);
      mockContext.req.param = jest.fn().mockReturnValue(petId);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pet_id).toBe(petId);
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
      const mockUser = TestHelpers.createTestUser();
      const petId = 'pet-123';

      // Mock pet query result - no NFT minted
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce({
        user_id: mockUser.id,
        nft_minted: false,
        nft_token_id: null
      });

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${petId}/nft-status`)
      });

      mockContext.set('user', mockUser);
      mockContext.req.param = jest.fn().mockReturnValue(petId);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pet_id).toBe(petId);
      expect(data.data.nft_minted).toBe(false);
      expect(data.data.nft_token_id).toBe(null);
      expect(data.data.nft_record).toBe(null);
    });

    test('should return 404 for non-existent pet', async () => {
      const mockUser = TestHelpers.createTestUser();
      const petId = 'nonexistent-pet';

      // Mock pet query result - pet not found
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce(null);

      mockContext = TestHelpers.createMockContext(mockEnv, {
        req: TestHelpers.createMockRequest(`/api/pets/${petId}/nft-status`)
      });

      mockContext.set('user', mockUser);
      mockContext.req.param = jest.fn().mockReturnValue(petId);

      const response = await petsHandler.fetch(mockContext.req, mockEnv, mockContext);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PET_NOT_FOUND');
    });
  });
});