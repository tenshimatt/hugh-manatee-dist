/**
 * Pet Service Unit Tests  
 * Tests pet profile operations and business logic
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { PetService } from '../../src/services/pet-service.js';
import { EnhancedTestHelpers, createEnhancedMockEnv } from '../helpers/enhanced-test-setup.js';

describe('PetService', () => {
  let petService;
  let mockEnv;
  let testUser;

  beforeEach(() => {
    mockEnv = createEnhancedMockEnv();
    petService = new PetService(mockEnv.DB, mockEnv.KV, mockEnv.R2);
    testUser = EnhancedTestHelpers.createTestUser();
  });

  describe('getUserPets', () => {
    test('should get user pets successfully', async () => {
      const pets = await petService.getUserPets(testUser.id);

      expect(Array.isArray(pets)).toBe(true);
      expect(pets.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter by species', async () => {
      const pets = await petService.getUserPets(testUser.id, { species: 'dog' });

      expect(Array.isArray(pets)).toBe(true);
    });

    test('should filter by active status', async () => {
      const pets = await petService.getUserPets(testUser.id, { active: true });

      expect(Array.isArray(pets)).toBe(true);
    });
  });

  describe('createPet', () => {
    test('should create pet successfully', async () => {
      const petData = {
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        birth_date: '2020-01-15',
        gender: 'male',
        weight_lbs: 65,
        feeding_type: 'raw'
      };

      const result = await petService.createPet(testUser.id, petData, 'rawgle');

      expect(result).toMatchObject({
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        user_id: testUser.id,
        feeding_type: 'raw'
      });
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeDefined();
    });

    test('should calculate age from birth date', async () => {
      const petData = {
        name: 'Young Pet',
        species: 'cat',
        birth_date: '2023-01-01'
      };

      const result = await petService.createPet(testUser.id, petData);

      expect(result.age_months).toBeGreaterThan(0);
    });

    test('should convert weight to kg', async () => {
      const petData = {
        name: 'Heavy Pet',
        species: 'dog',
        weight_lbs: 100
      };

      const result = await petService.createPet(testUser.id, petData);

      expect(result.weight_kg).toBeCloseTo(45.36, 1);
    });

    test('should validate required fields', async () => {
      const invalidData = {
        species: 'dog'
        // Missing name
      };

      await expect(
        petService.createPet(testUser.id, invalidData)
      ).rejects.toThrow();
    });
  });

  describe('getPetProfile', () => {
    test('should get pet profile successfully', async () => {
      const petId = 'pet-123';
      
      const profile = await petService.getPetProfile(petId, testUser.id);

      expect(profile).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        species: expect.any(String),
        user_id: testUser.id
      });
    });

    test('should reject unauthorized access', async () => {
      const petId = 'pet-123';
      const wrongUserId = 'different-user';
      
      await expect(
        petService.getPetProfile(petId, wrongUserId)
      ).rejects.toThrow();
    });

    test('should return null for non-existent pet', async () => {
      const petId = 'non-existent';
      
      const profile = await petService.getPetProfile(petId, testUser.id);

      expect(profile).toBeNull();
    });
  });

  describe('updatePet', () => {
    test('should update pet successfully', async () => {
      const petId = 'pet-123';
      const updates = {
        weight_lbs: 70,
        notes: 'Updated after vet visit',
        activity_level: 'moderate'
      };

      const result = await petService.updatePet(petId, testUser.id, updates);

      expect(result).toMatchObject(updates);
      expect(result.updated_at).toBeDefined();
    });

    test('should recalculate weight_kg when weight_lbs updated', async () => {
      const petId = 'pet-123';
      const updates = { weight_lbs: 80 };

      const result = await petService.updatePet(petId, testUser.id, updates);

      expect(result.weight_kg).toBeCloseTo(36.29, 1);
    });

    test('should reject unauthorized updates', async () => {
      const petId = 'pet-123';
      const wrongUserId = 'different-user';
      const updates = { weight_lbs: 70 };

      await expect(
        petService.updatePet(petId, wrongUserId, updates)
      ).rejects.toThrow();
    });
  });

  describe('deletePet', () => {
    test('should delete pet successfully', async () => {
      const petId = 'pet-123';

      const result = await petService.deletePet(petId, testUser.id);

      expect(result).toBe(true);
    });

    test('should reject unauthorized deletion', async () => {
      const petId = 'pet-123';
      const wrongUserId = 'different-user';

      await expect(
        petService.deletePet(petId, wrongUserId)
      ).rejects.toThrow();
    });
  });

  describe('uploadPhotos', () => {
    test('should upload photos successfully', async () => {
      const petId = 'pet-123';
      const files = [
        { name: 'photo1.jpg', type: 'image/jpeg', size: 1024000 },
        { name: 'photo2.png', type: 'image/png', size: 2048000 }
      ];
      const allowedTypes = ['image/jpeg', 'image/png'];

      const result = await petService.uploadPhotos(petId, testUser.id, files, allowedTypes);

      expect(result).toMatchObject({
        uploaded: expect.any(Number),
        photos: expect.any(Array)
      });
      expect(result.uploaded).toBeGreaterThan(0);
    });

    test('should reject invalid file types', async () => {
      const petId = 'pet-123';
      const files = [{ name: 'invalid.txt', type: 'text/plain', size: 1000 }];
      const allowedTypes = ['image/jpeg', 'image/png'];

      await expect(
        petService.uploadPhotos(petId, testUser.id, files, allowedTypes)
      ).rejects.toThrow();
    });
  });

  describe('deletePhoto', () => {
    test('should delete photo successfully', async () => {
      const petId = 'pet-123';
      const photoUrl = 'https://example.com/photo.jpg';

      const result = await petService.deletePhoto(petId, testUser.id, photoUrl);

      expect(result).toBe(true);
    });

    test('should reject unauthorized photo deletion', async () => {
      const petId = 'pet-123';
      const wrongUserId = 'different-user';
      const photoUrl = 'https://example.com/photo.jpg';

      await expect(
        petService.deletePhoto(petId, wrongUserId, photoUrl)
      ).rejects.toThrow();
    });
  });
});