// Comprehensive Pet Service Tests
// Tests pet management functionality for both Rawgle and GoHunta platforms

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PetService } from '../src/services/pet-service.js';
import { AuthService } from '../src/services/auth-service.js';
import { TestDatabase } from './helpers/test-database.js';
import { TestKV } from './helpers/test-kv.js';

describe('PetService - Comprehensive Tests', () => {
  let petService;
  let authService;
  let testDb;
  let testKv;
  let testUser;

  beforeEach(async () => {
    testDb = new TestDatabase();
    testKv = new TestKV();
    await testDb.setup();
    
    petService = new PetService(testDb.db, testKv);
    authService = new AuthService(testDb.db, testKv);

    // Create a test user
    const registerResult = await authService.register({
      email: 'petowner@example.com',
      password: 'PetPass123!',
      name: 'Pet Owner',
      location: 'Montana, USA'
    }, 'gohunta');
    
    testUser = registerResult.user;
  });

  afterEach(async () => {
    await testDb.cleanup();
    await testKv.cleanup();
  });

  describe('Create Pet - Positive Test Cases', () => {
    it('should create basic Rawgle pet successfully', async () => {
      const petData = {
        name: 'Fluffy',
        species: 'cat',
        breed: 'Persian',
        birth_date: '2022-01-15',
        gender: 'female',
        feeding_type: 'raw'
      };

      const pet = await petService.createPet(testUser.id, petData, 'rawgle');

      expect(pet).toBeDefined();
      expect(pet.id).toBeDefined();
      expect(pet.name).toBe('Fluffy');
      expect(pet.species).toBe('cat');
      expect(pet.breed).toBe('Persian');
      expect(pet.feedingType).toBe('raw');
      expect(pet.userId).toBe(testUser.id);
      expect(pet.age).toBeDefined();
      expect(pet.age.years).toBeGreaterThan(0);
    });

    it('should create GoHunta hunting dog successfully', async () => {
      const petData = {
        name: 'Rex',
        species: 'dog',
        breed: 'German Shorthaired Pointer',
        birth_date: '2020-03-10',
        gender: 'male',
        weight_lbs: 65,
        hunting_style: 'pointing',
        training_level: 'seasoned',
        energy_level: 4
      };

      const pet = await petService.createPet(testUser.id, petData, 'gohunta');

      expect(pet).toBeDefined();
      expect(pet.name).toBe('Rex');
      expect(pet.species).toBe('dog');
      expect(pet.huntingStyle).toBe('pointing');
      expect(pet.trainingLevel).toBe('seasoned');
      expect(pet.energyLevel).toBe(4);
      expect(pet.weightLbs).toBe(65);
      expect(pet.weightKg).toBeCloseTo(29.48); // 65 * 0.453592
    });

    it('should create pet with health records', async () => {
      const petData = {
        name: 'Healthy Dog',
        species: 'dog',
        health_records: [
          {
            date: '2023-01-15',
            type: 'checkup',
            vet: 'Dr. Smith',
            notes: 'Excellent health'
          }
        ],
        vaccination_records: [
          {
            date: '2023-01-15',
            vaccine: 'Rabies',
            expiration: '2024-01-15'
          }
        ]
      };

      const pet = await petService.createPet(testUser.id, petData, 'rawgle');

      expect(pet.healthRecords).toBeDefined();
      expect(pet.healthRecords[0].vet).toBe('Dr. Smith');
      expect(pet.vaccinationRecords).toBeDefined();
      expect(pet.vaccinationRecords[0].vaccine).toBe('Rabies');
    });

    it('should create pet with minimal required data', async () => {
      const petData = {
        name: 'Minimal'
      };

      const pet = await petService.createPet(testUser.id, petData, 'rawgle');

      expect(pet.name).toBe('Minimal');
      expect(pet.species).toBe('dog'); // Default
      expect(pet.photos).toEqual([]);
    });

    it('should convert weight correctly', async () => {
      const petData = {
        name: 'Heavy Dog',
        weight_lbs: 100
      };

      const pet = await petService.createPet(testUser.id, petData, 'rawgle');

      expect(pet.weightLbs).toBe(100);
      expect(pet.weightKg).toBeCloseTo(45.36); // 100 * 0.453592
    });
  });

  describe('Create Pet - Negative Test Cases', () => {
    it('should reject creation without user ID', async () => {
      const petData = { name: 'Test Pet' };
      await expect(petService.createPet(null, petData, 'rawgle'))
        .rejects.toThrow('User ID is required');
    });

    it('should reject creation without pet name', async () => {
      const petData = { species: 'dog' };
      await expect(petService.createPet(testUser.id, petData, 'rawgle'))
        .rejects.toThrow('Pet name is required');
    });

    it('should reject name that is too long', async () => {
      const petData = { name: 'A'.repeat(51) };
      await expect(petService.createPet(testUser.id, petData, 'rawgle'))
        .rejects.toThrow('Pet name must be between 1 and 50 characters');
    });

    it('should reject non-dog species for GoHunta', async () => {
      const petData = {
        name: 'Cat',
        species: 'cat'
      };
      await expect(petService.createPet(testUser.id, petData, 'gohunta'))
        .rejects.toThrow('GoHunta platform only supports dogs');
    });

    it('should reject invalid hunting style', async () => {
      const petData = {
        name: 'Dog',
        hunting_style: 'invalid_style'
      };
      await expect(petService.createPet(testUser.id, petData, 'gohunta'))
        .rejects.toThrow('Invalid hunting style');
    });

    it('should reject invalid training level', async () => {
      const petData = {
        name: 'Dog',
        training_level: 'invalid_level'
      };
      await expect(petService.createPet(testUser.id, petData, 'gohunta'))
        .rejects.toThrow('Invalid training level');
    });

    it('should reject invalid gender', async () => {
      const petData = {
        name: 'Dog',
        gender: 'invalid_gender'
      };
      await expect(petService.createPet(testUser.id, petData, 'rawgle'))
        .rejects.toThrow('Invalid gender');
    });

    it('should reject invalid birth date', async () => {
      const petData = {
        name: 'Dog',
        birth_date: 'invalid-date'
      };
      await expect(petService.createPet(testUser.id, petData, 'rawgle'))
        .rejects.toThrow('Invalid birth date');
    });

    it('should reject future birth date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const petData = {
        name: 'Time Traveler',
        birth_date: futureDate.toISOString().split('T')[0]
      };
      await expect(petService.createPet(testUser.id, petData, 'rawgle'))
        .rejects.toThrow('Invalid birth date');
    });

    it('should reject excessive weight', async () => {
      const petData = {
        name: 'Overweight',
        weight_lbs: 400
      };
      await expect(petService.createPet(testUser.id, petData, 'rawgle'))
        .rejects.toThrow('Weight must be between 0 and 300 pounds');
    });

    it('should reject for non-existent user', async () => {
      const petData = { name: 'Orphan Pet' };
      await expect(petService.createPet('non-existent-user', petData, 'rawgle'))
        .rejects.toThrow('User not found');
    });
  });

  describe('Get Pet Profile - Positive Test Cases', () => {
    let testPet;

    beforeEach(async () => {
      const petData = {
        name: 'Profile Test Dog',
        breed: 'Labrador',
        birth_date: '2021-06-01',
        weight_lbs: 70,
        notes: 'Good dog'
      };
      testPet = await petService.createPet(testUser.id, petData, 'rawgle');
    });

    it('should retrieve complete pet profile', async () => {
      const profile = await petService.getPetProfile(testPet.id, testUser.id);

      expect(profile).toBeDefined();
      expect(profile.id).toBe(testPet.id);
      expect(profile.name).toBe('Profile Test Dog');
      expect(profile.breed).toBe('Labrador');
      expect(profile.weightLbs).toBe(70);
      expect(profile.notes).toBe('Good dog');
      expect(profile.ownerName).toBe(testUser.name);
      expect(profile.age).toBeDefined();
      expect(profile.age.years).toBeGreaterThan(0);
    });

    it('should include calculated age', async () => {
      const profile = await petService.getPetProfile(testPet.id, testUser.id);

      expect(profile.age).toBeDefined();
      expect(profile.age.totalDays).toBeGreaterThan(0);
      expect(profile.age.formatted).toBeDefined();
    });

    it('should handle pet without birth date', async () => {
      const petWithoutAge = await petService.createPet(testUser.id, {
        name: 'Ageless Pet'
      }, 'rawgle');

      const profile = await petService.getPetProfile(petWithoutAge.id, testUser.id);

      expect(profile.age).toBeNull();
    });
  });

  describe('Get Pet Profile - Negative Test Cases', () => {
    let testPet;

    beforeEach(async () => {
      testPet = await petService.createPet(testUser.id, {
        name: 'Access Test Dog'
      }, 'rawgle');
    });

    it('should reject request without pet ID', async () => {
      await expect(petService.getPetProfile(null, testUser.id))
        .rejects.toThrow('Pet ID is required');
    });

    it('should reject request for non-existent pet', async () => {
      await expect(petService.getPetProfile('non-existent', testUser.id))
        .rejects.toThrow('Pet not found');
    });

    it('should reject access from non-owner', async () => {
      // Create another user
      const otherUser = await authService.register({
        email: 'other@example.com',
        password: 'Other123!',
        name: 'Other User'
      }, 'rawgle');

      await expect(petService.getPetProfile(testPet.id, otherUser.user.id))
        .rejects.toThrow('Access denied');
    });
  });

  describe('Update Pet - Positive Test Cases', () => {
    let testPet;

    beforeEach(async () => {
      testPet = await petService.createPet(testUser.id, {
        name: 'Update Test Dog',
        breed: 'Original Breed',
        weight_lbs: 50
      }, 'gohunta');
    });

    it('should update basic pet information', async () => {
      const updates = {
        name: 'Updated Name',
        breed: 'Updated Breed',
        weight_lbs: 60,
        notes: 'Updated notes'
      };

      const updatedPet = await petService.updatePet(testPet.id, testUser.id, updates);

      expect(updatedPet.name).toBe('Updated Name');
      expect(updatedPet.breed).toBe('Updated Breed');
      expect(updatedPet.weightLbs).toBe(60);
      expect(updatedPet.weightKg).toBeCloseTo(27.22); // 60 * 0.453592
      expect(updatedPet.notes).toBe('Updated notes');
    });

    it('should update GoHunta-specific fields', async () => {
      const updates = {
        hunting_style: 'retrieving',
        training_level: 'finished',
        energy_level: 5
      };

      const updatedPet = await petService.updatePet(testPet.id, testUser.id, updates);

      expect(updatedPet.huntingStyle).toBe('retrieving');
      expect(updatedPet.trainingLevel).toBe('finished');
      expect(updatedPet.energyLevel).toBe(5);
    });

    it('should update health records', async () => {
      const updates = {
        health_records: [
          {
            date: '2023-12-01',
            type: 'surgery',
            notes: 'Successful operation'
          }
        ]
      };

      const updatedPet = await petService.updatePet(testPet.id, testUser.id, updates);

      expect(updatedPet.healthRecords).toBeDefined();
      expect(updatedPet.healthRecords[0].type).toBe('surgery');
    });

    it('should ignore invalid fields', async () => {
      const updates = {
        name: 'Valid Update',
        id: 'hacker-attempt',
        user_id: 'hacker-attempt'
      };

      const updatedPet = await petService.updatePet(testPet.id, testUser.id, updates);

      expect(updatedPet.name).toBe('Valid Update');
      expect(updatedPet.id).toBe(testPet.id); // Should remain unchanged
      expect(updatedPet.userId).toBe(testUser.id); // Should remain unchanged
    });
  });

  describe('Update Pet - Negative Test Cases', () => {
    let testPet;

    beforeEach(async () => {
      testPet = await petService.createPet(testUser.id, {
        name: 'Update Fail Test'
      }, 'rawgle');
    });

    it('should reject update without IDs', async () => {
      await expect(petService.updatePet(null, testUser.id, { name: 'Test' }))
        .rejects.toThrow('Pet ID and User ID are required');

      await expect(petService.updatePet(testPet.id, null, { name: 'Test' }))
        .rejects.toThrow('Pet ID and User ID are required');
    });

    it('should reject update for non-existent pet', async () => {
      await expect(petService.updatePet('non-existent', testUser.id, { name: 'Test' }))
        .rejects.toThrow('Pet not found');
    });

    it('should reject update from non-owner', async () => {
      const otherUser = await authService.register({
        email: 'other2@example.com',
        password: 'Other123!',
        name: 'Other User'
      }, 'rawgle');

      await expect(petService.updatePet(testPet.id, otherUser.user.id, { name: 'Test' }))
        .rejects.toThrow('Access denied');
    });

    it('should reject invalid name length', async () => {
      await expect(petService.updatePet(testPet.id, testUser.id, { name: '' }))
        .rejects.toThrow('Pet name must be between 1 and 50 characters');

      await expect(petService.updatePet(testPet.id, testUser.id, { name: 'A'.repeat(51) }))
        .rejects.toThrow('Pet name must be between 1 and 50 characters');
    });

    it('should reject invalid hunting style', async () => {
      await expect(petService.updatePet(testPet.id, testUser.id, { hunting_style: 'invalid' }))
        .rejects.toThrow('Invalid hunting style');
    });

    it('should reject invalid training level', async () => {
      await expect(petService.updatePet(testPet.id, testUser.id, { training_level: 'invalid' }))
        .rejects.toThrow('Invalid training level');
    });

    it('should reject invalid energy level', async () => {
      await expect(petService.updatePet(testPet.id, testUser.id, { energy_level: 0 }))
        .rejects.toThrow('Energy level must be between 1 and 5');

      await expect(petService.updatePet(testPet.id, testUser.id, { energy_level: 6 }))
        .rejects.toThrow('Energy level must be between 1 and 5');
    });

    it('should reject empty updates', async () => {
      await expect(petService.updatePet(testPet.id, testUser.id, {}))
        .rejects.toThrow('No valid fields to update');

      await expect(petService.updatePet(testPet.id, testUser.id, { invalidField: 'value' }))
        .rejects.toThrow('No valid fields to update');
    });
  });

  describe('Photo Management - Positive Test Cases', () => {
    let testPet;

    beforeEach(async () => {
      testPet = await petService.createPet(testUser.id, {
        name: 'Photo Test Dog'
      }, 'rawgle');
    });

    it('should upload single photo', async () => {
      const mockFile = { size: 1024 * 1024, name: 'photo1.jpg' };
      const contentTypes = ['image/jpeg'];

      const result = await petService.uploadPhotos(testPet.id, testUser.id, [mockFile], contentTypes);

      expect(result.uploadedPhotos).toBeDefined();
      expect(result.uploadedPhotos.length).toBe(1);
      expect(result.uploadedPhotos[0].url).toBeDefined();
      expect(result.uploadedPhotos[0].contentType).toBe('image/jpeg');
      expect(result.totalPhotos).toBe(1);
    });

    it('should upload multiple photos', async () => {
      const mockFiles = [
        { size: 1024 * 1024, name: 'photo1.jpg' },
        { size: 2 * 1024 * 1024, name: 'photo2.png' }
      ];
      const contentTypes = ['image/jpeg', 'image/png'];

      const result = await petService.uploadPhotos(testPet.id, testUser.id, mockFiles, contentTypes);

      expect(result.uploadedPhotos.length).toBe(2);
      expect(result.totalPhotos).toBe(2);
      expect(result.uploadedPhotos[0].contentType).toBe('image/jpeg');
      expect(result.uploadedPhotos[1].contentType).toBe('image/png');
    });

    it('should handle different image formats', async () => {
      const formats = [
        { file: { size: 1024 }, type: 'image/jpeg' },
        { file: { size: 2048 }, type: 'image/png' },
        { file: { size: 3072 }, type: 'image/webp' }
      ];

      for (const format of formats) {
        const result = await petService.uploadPhotos(
          testPet.id, 
          testUser.id, 
          [format.file], 
          [format.type]
        );
        
        expect(result.uploadedPhotos[0].contentType).toBe(format.type);
      }
    });

    it('should delete photo successfully', async () => {
      // First upload a photo
      const mockFile = { size: 1024, name: 'delete-test.jpg' };
      const uploadResult = await petService.uploadPhotos(testPet.id, testUser.id, [mockFile], ['image/jpeg']);
      const photoUrl = uploadResult.uploadedPhotos[0].url;

      // Then delete it
      await petService.deletePhoto(testPet.id, testUser.id, photoUrl);

      // Verify pet has no photos
      const pet = await petService.getPetProfile(testPet.id, testUser.id);
      expect(pet.photos).toEqual([]);
    });
  });

  describe('Photo Management - Negative Test Cases', () => {
    let testPet;

    beforeEach(async () => {
      testPet = await petService.createPet(testUser.id, {
        name: 'Photo Fail Test'
      }, 'rawgle');
    });

    it('should reject upload without required parameters', async () => {
      await expect(petService.uploadPhotos(null, testUser.id, [], []))
        .rejects.toThrow('Pet ID and User ID are required');

      await expect(petService.uploadPhotos(testPet.id, null, [], []))
        .rejects.toThrow('Pet ID and User ID are required');

      await expect(petService.uploadPhotos(testPet.id, testUser.id, [], []))
        .rejects.toThrow('At least one image file is required');
    });

    it('should reject too many photos at once', async () => {
      const tooManyFiles = Array(11).fill({ size: 1024 });
      const contentTypes = Array(11).fill('image/jpeg');

      await expect(petService.uploadPhotos(testPet.id, testUser.id, tooManyFiles, contentTypes))
        .rejects.toThrow('Maximum 10 photos allowed');
    });

    it('should reject unsupported file types', async () => {
      const mockFile = { size: 1024 };
      await expect(petService.uploadPhotos(testPet.id, testUser.id, [mockFile], ['image/gif']))
        .rejects.toThrow('Invalid image format');
    });

    it('should reject files that are too large', async () => {
      const largeFile = { size: 6 * 1024 * 1024 }; // 6MB
      await expect(petService.uploadPhotos(testPet.id, testUser.id, [largeFile], ['image/jpeg']))
        .rejects.toThrow('Image file 1 too large');
    });

    it('should reject exceeding total photo limit', async () => {
      // Upload 10 photos first
      const files = Array(10).fill({ size: 1024 });
      const types = Array(10).fill('image/jpeg');
      await petService.uploadPhotos(testPet.id, testUser.id, files, types);

      // Try to upload one more
      await expect(petService.uploadPhotos(testPet.id, testUser.id, [{ size: 1024 }], ['image/jpeg']))
        .rejects.toThrow('Cannot exceed 10 total photos');
    });

    it('should reject upload for non-existent pet', async () => {
      const mockFile = { size: 1024 };
      await expect(petService.uploadPhotos('non-existent', testUser.id, [mockFile], ['image/jpeg']))
        .rejects.toThrow('Pet not found');
    });

    it('should reject delete for non-existent photo', async () => {
      await expect(petService.deletePhoto(testPet.id, testUser.id, 'non-existent-url'))
        .rejects.toThrow('Photo not found');
    });
  });

  describe('Get User Pets - Positive Test Cases', () => {
    beforeEach(async () => {
      // Create multiple pets
      await petService.createPet(testUser.id, {
        name: 'Dog 1',
        species: 'dog',
        breed: 'Labrador'
      }, 'rawgle');

      await petService.createPet(testUser.id, {
        name: 'Cat 1',
        species: 'cat',
        breed: 'Persian'
      }, 'rawgle');

      await petService.createPet(testUser.id, {
        name: 'Dog 2',
        species: 'dog',
        breed: 'Golden Retriever'
      }, 'rawgle');
    });

    it('should retrieve all user pets', async () => {
      const pets = await petService.getUserPets(testUser.id);

      expect(pets).toBeDefined();
      expect(pets.length).toBe(3);
      expect(pets.some(p => p.name === 'Dog 1')).toBe(true);
      expect(pets.some(p => p.name === 'Cat 1')).toBe(true);
      expect(pets.some(p => p.name === 'Dog 2')).toBe(true);
    });

    it('should filter pets by species', async () => {
      const dogs = await petService.getUserPets(testUser.id, { species: 'dog' });
      const cats = await petService.getUserPets(testUser.id, { species: 'cat' });

      expect(dogs.length).toBe(2);
      expect(cats.length).toBe(1);
      expect(dogs.every(p => p.species === 'dog')).toBe(true);
      expect(cats.every(p => p.species === 'cat')).toBe(true);
    });

    it('should include calculated ages', async () => {
      // Create pet with birth date
      await petService.createPet(testUser.id, {
        name: 'Age Test',
        birth_date: '2020-01-01'
      }, 'rawgle');

      const pets = await petService.getUserPets(testUser.id);
      const petWithAge = pets.find(p => p.name === 'Age Test');

      expect(petWithAge.age).toBeDefined();
      expect(petWithAge.age.years).toBeGreaterThan(0);
    });

    it('should return pets sorted by name', async () => {
      const pets = await petService.getUserPets(testUser.id);

      for (let i = 1; i < pets.length; i++) {
        expect(pets[i].name.localeCompare(pets[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Get User Pets - Negative Test Cases', () => {
    it('should reject request without user ID', async () => {
      await expect(petService.getUserPets(null))
        .rejects.toThrow('User ID is required');
    });

    it('should return empty array for user with no pets', async () => {
      const otherUser = await authService.register({
        email: 'nopets@example.com',
        password: 'NoPets123!',
        name: 'No Pets User'
      }, 'rawgle');

      const pets = await petService.getUserPets(otherUser.user.id);
      expect(pets).toEqual([]);
    });
  });

  describe('Delete Pet - Positive Test Cases', () => {
    let testPet;

    beforeEach(async () => {
      testPet = await petService.createPet(testUser.id, {
        name: 'Delete Test Pet'
      }, 'rawgle');
    });

    it('should soft delete pet successfully', async () => {
      await petService.deletePet(testPet.id, testUser.id);

      // Pet should no longer be found
      await expect(petService.getPetProfile(testPet.id, testUser.id))
        .rejects.toThrow('Pet not found');
    });

    it('should remove pet from user pets list', async () => {
      await petService.deletePet(testPet.id, testUser.id);

      const pets = await petService.getUserPets(testUser.id);
      expect(pets.find(p => p.id === testPet.id)).toBeUndefined();
    });
  });

  describe('Delete Pet - Negative Test Cases', () => {
    let testPet;

    beforeEach(async () => {
      testPet = await petService.createPet(testUser.id, {
        name: 'Delete Fail Test'
      }, 'rawgle');
    });

    it('should reject delete without required parameters', async () => {
      await expect(petService.deletePet(null, testUser.id))
        .rejects.toThrow('Pet ID and User ID are required');

      await expect(petService.deletePet(testPet.id, null))
        .rejects.toThrow('Pet ID and User ID are required');
    });

    it('should reject delete for non-existent pet', async () => {
      await expect(petService.deletePet('non-existent', testUser.id))
        .rejects.toThrow('Pet not found');
    });

    it('should reject delete from non-owner', async () => {
      const otherUser = await authService.register({
        email: 'other3@example.com',
        password: 'Other123!',
        name: 'Other User'
      }, 'rawgle');

      await expect(petService.deletePet(testPet.id, otherUser.user.id))
        .rejects.toThrow('Access denied');
    });
  });

  describe('Helper Methods Tests', () => {
    it('should validate dates correctly', async () => {
      expect(petService.isValidDate('2023-01-01')).toBe(true);
      expect(petService.isValidDate('2020-12-31')).toBe(true);
      
      expect(petService.isValidDate('invalid-date')).toBe(false);
      expect(petService.isValidDate('2025-01-01')).toBe(false); // Future date
    });

    it('should calculate age correctly', async () => {
      const birthDate = '2020-01-01';
      const age = petService.calculateAge(birthDate);

      expect(age).toBeDefined();
      expect(age.years).toBeGreaterThan(0);
      expect(age.totalDays).toBeGreaterThan(365);
      expect(age.formatted).toContain('year');
    });

    it('should calculate age for young pets', async () => {
      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 3);
      const age = petService.calculateAge(recentDate.toISOString().split('T')[0]);

      expect(age.years).toBe(0);
      expect(age.months).toBe(3);
      expect(age.formatted).toContain('month');
    });

    it('should get correct file extensions', async () => {
      expect(petService.getFileExtension('image/jpeg')).toBe('jpg');
      expect(petService.getFileExtension('image/png')).toBe('png');
      expect(petService.getFileExtension('image/webp')).toBe('webp');
      expect(petService.getFileExtension('unknown')).toBe('jpg');
    });

    it('should handle JSON stringify/parse safely', async () => {
      expect(petService.jsonStringify(null)).toBeNull();
      expect(petService.jsonStringify(undefined)).toBeNull();
      expect(petService.jsonStringify({ key: 'value' })).toBe('{"key":"value"}');
      expect(petService.jsonStringify('already-string')).toBe('already-string');

      expect(petService.jsonParse(null)).toBeNull();
      expect(petService.jsonParse('')).toBeNull();
      expect(petService.jsonParse('{"key":"value"}')).toEqual({ key: 'value' });
      expect(petService.jsonParse('invalid-json')).toBeNull();
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle database errors gracefully', async () => {
      const invalidPetService = new PetService(null, testKv);

      await expect(invalidPetService.createPet('user-id', { name: 'Test' }, 'rawgle'))
        .rejects.toThrow();
    });

    it('should not fail for logging errors', async () => {
      const mockPetService = new PetService(testDb.db, testKv);
      
      // Mock KV to fail
      const restore = testKv.simulateError('put', new Error('KV Error'));
      
      try {
        // This should still work despite KV logging error
        const pet = await mockPetService.createPet(testUser.id, {
          name: 'Logging Fail Test'
        }, 'rawgle');
        
        expect(pet.name).toBe('Logging Fail Test');
      } finally {
        restore();
      }
    });
  });
});