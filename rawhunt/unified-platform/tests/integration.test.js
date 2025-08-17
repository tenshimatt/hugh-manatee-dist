// Integration Tests - Complete Workflow Testing
// Tests end-to-end functionality across all services

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../src/services/auth-service.js';
import { UserService } from '../src/services/user-service.js';
import { PetService } from '../src/services/pet-service.js';
import { SupplierService } from '../src/services/supplier-service.js';
import { TestDatabase } from './helpers/test-database.js';
import { TestKV } from './helpers/test-kv.js';

describe('Integration Tests - Complete Workflows', () => {
  let authService;
  let userService;
  let petService;
  let supplierService;
  let testDb;
  let testKv;

  beforeEach(async () => {
    testDb = new TestDatabase();
    testKv = new TestKV();
    await testDb.setup();
    
    authService = new AuthService(testDb.db, testKv);
    userService = new UserService(testDb.db, testKv);
    petService = new PetService(testDb.db, testKv);
    supplierService = new SupplierService(testDb.db, testKv);
  });

  afterEach(async () => {
    await testDb.cleanup();
    await testKv.cleanup();
  });

  describe('Complete User Onboarding Workflow', () => {
    it('should handle complete user registration and profile setup for Rawgle', async () => {
      // Step 1: User Registration
      const registerData = {
        email: 'newuser@rawgle.com',
        password: 'SecurePass123!',
        name: 'Raw Feeding Enthusiast',
        location: 'California, USA'
      };

      const registerResult = await authService.register(registerData, 'rawgle');

      expect(registerResult.user).toBeDefined();
      expect(registerResult.user.platform).toBe('rawgle');
      expect(registerResult.session).toBeDefined();
      expect(registerResult.user.profileCompleted).toBe(true); // Has required fields

      const userId = registerResult.user.id;
      const sessionToken = registerResult.session.token;

      // Step 2: Verify Session
      const sessionVerification = await authService.verifySession(sessionToken);
      expect(sessionVerification).toBeDefined();
      expect(sessionVerification.user.id).toBe(userId);

      // Step 3: Update Profile with Additional Information
      const profileUpdates = {
        bio: 'Passionate about raw feeding for optimal pet health',
        social_links: {
          twitter: '@rawfeeder',
          instagram: '@healthypaws'
        },
        preferences: {
          theme: 'light',
          notifications: {
            email: true,
            push: false
          },
          measurementUnit: 'imperial'
        }
      };

      const updatedProfile = await userService.updateProfile(userId, profileUpdates);

      expect(updatedProfile.bio).toBe(profileUpdates.bio);
      expect(updatedProfile.socialLinks.twitter).toBe('@rawfeeder');
      expect(updatedProfile.preferences.theme).toBe('light');

      // Step 4: Set Privacy Settings
      const privacySettings = {
        hideEmail: true,
        publicProfile: true,
        allowMessages: true
      };

      const updatedPrivacy = await userService.updatePrivacySettings(userId, privacySettings);

      expect(updatedPrivacy.hideEmail).toBe(true);
      expect(updatedPrivacy.publicProfile).toBe(true);

      // Step 5: Create Pet Profile
      const petData = {
        name: 'Luna',
        species: 'dog',
        breed: 'Golden Retriever',
        birth_date: '2020-06-15',
        gender: 'female',
        weight_lbs: 55,
        feeding_type: 'raw',
        allergies: ['chicken', 'beef'],
        dietary_restrictions: ['grain-free'],
        health_records: [{
          date: '2023-01-15',
          type: 'checkup',
          vet: 'Dr. Smith',
          notes: 'Excellent health, thriving on raw diet'
        }]
      };

      const pet = await petService.createPet(userId, petData, 'rawgle');

      expect(pet.name).toBe('Luna');
      expect(pet.feedingType).toBe('raw');
      expect(pet.allergies).toEqual(['chicken', 'beef']);
      expect(pet.age.years).toBeGreaterThan(2);

      // Step 6: Get User Statistics
      const stats = await userService.getUserStats(userId);

      expect(stats.petsCount).toBe(1);
      expect(stats.postsCount).toBe(0);

      // Step 7: Upload Pet Photo
      const mockPhotoFile = { size: 1024 * 500, name: 'luna.jpg' };
      const photoResult = await petService.uploadPhotos(pet.id, userId, [mockPhotoFile], ['image/jpeg']);

      expect(photoResult.uploadedPhotos).toBeDefined();
      expect(photoResult.uploadedPhotos.length).toBe(1);
      expect(photoResult.totalPhotos).toBe(1);

      // Step 8: Update Pet with Additional Info
      const petUpdates = {
        notes: 'Luna loves her raw meals and has excellent energy levels',
        vaccination_records: [{
          date: '2023-01-15',
          vaccine: 'DHPP',
          expiration: '2024-01-15'
        }]
      };

      const updatedPet = await petService.updatePet(pet.id, userId, petUpdates);

      expect(updatedPet.notes).toBe(petUpdates.notes);
      expect(updatedPet.vaccinationRecords[0].vaccine).toBe('DHPP');

      // Verify complete profile
      const finalProfile = await userService.getUserProfile(userId, userId);
      const userPets = await petService.getUserPets(userId);

      expect(finalProfile.profileCompleted).toBe(true);
      expect(finalProfile.bio).toBeDefined();
      expect(userPets.length).toBe(1);
      expect(userPets[0].photos.length).toBe(1);
    });

    it('should handle complete user registration and profile setup for GoHunta', async () => {
      // Step 1: User Registration for Hunter
      const registerData = {
        email: 'hunter@gohunta.com',
        password: 'HuntPass123!',
        name: 'Experienced Hunter',
        location: 'Montana, USA'
      };

      const registerResult = await authService.register(registerData, 'gohunta');
      const userId = registerResult.user.id;

      // Step 2: Update Profile with Hunter-specific Information
      const profileUpdates = {
        bio: 'Passionate upland bird hunter with 15 years experience',
        experience_level: 'advanced',
        social_links: {
          instagram: '@montanahunter'
        },
        preferences: {
          theme: 'dark',
          measurementUnit: 'imperial',
          gpsTracking: true,
          weatherAlerts: true
        }
      };

      await userService.updateProfile(userId, profileUpdates);

      // Step 3: Create Hunting Dog Profile
      const dogData = {
        name: 'Rex',
        species: 'dog',
        breed: 'German Shorthaired Pointer',
        birth_date: '2019-03-10',
        gender: 'male',
        weight_lbs: 65,
        hunting_style: 'pointing',
        training_level: 'seasoned',
        energy_level: 4,
        health_records: [{
          date: '2023-12-01',
          type: 'pre-season checkup',
          vet: 'Dr. Johnson',
          notes: 'Excellent condition, ready for hunting season'
        }]
      };

      const huntingDog = await petService.createPet(userId, dogData, 'gohunta');

      expect(huntingDog.huntingStyle).toBe('pointing');
      expect(huntingDog.trainingLevel).toBe('seasoned');
      expect(huntingDog.energyLevel).toBe(4);

      // Step 4: Upload Dog Photos
      const dogPhotos = [
        { size: 1024 * 800, name: 'rex_field.jpg' },
        { size: 1024 * 600, name: 'rex_portrait.jpg' }
      ];
      const contentTypes = ['image/jpeg', 'image/jpeg'];

      const photoResult = await petService.uploadPhotos(huntingDog.id, userId, dogPhotos, contentTypes);

      expect(photoResult.totalPhotos).toBe(2);

      // Step 5: Update Dog Training Information
      const trainingUpdates = {
        training_level: 'finished',
        notes: 'Rex has mastered all basic commands and field work. Excellent bird dog.',
        health_records: [
          ...huntingDog.healthRecords,
          {
            date: '2024-01-15',
            type: 'training_assessment',
            notes: 'Outstanding performance in all categories'
          }
        ]
      };

      const updatedDog = await petService.updatePet(huntingDog.id, userId, trainingUpdates);

      expect(updatedDog.trainingLevel).toBe('finished');
      expect(updatedDog.healthRecords.length).toBe(2);

      // Verify complete hunter profile
      const finalProfile = await userService.getUserProfile(userId, userId);
      const huntingDogs = await petService.getUserPets(userId, { species: 'dog' });

      expect(finalProfile.experienceLevel).toBe('advanced');
      expect(huntingDogs.length).toBe(1);
      expect(huntingDogs[0].huntingStyle).toBe('pointing');
      expect(huntingDogs[0].photos.length).toBe(2);
    });
  });

  describe('Marketplace Interaction Workflow', () => {
    it('should handle complete supplier registration and discovery workflow', async () => {
      // Step 1: Register a User who will search for suppliers
      const userResult = await authService.register({
        email: 'customer@example.com',
        password: 'Customer123!',
        name: 'Pet Owner',
        location: 'Denver, Colorado'
      }, 'rawgle');

      const customerId = userResult.user.id;

      // Step 2: Register an Admin/Supplier User
      const supplierUserResult = await authService.register({
        email: 'supplier@example.com',
        password: 'Supplier123!',
        name: 'Raw Food Supplier',
        location: 'Colorado Springs, Colorado'
      }, 'rawgle');

      const supplierUserId = supplierUserResult.user.id;

      // Step 3: Create Supplier Business Profile
      const supplierData = {
        name: 'Rocky Mountain Raw',
        businessName: 'Rocky Mountain Raw Foods LLC',
        email: 'info@rockymountainraw.com',
        phone: '+1-719-555-0123',
        website: 'https://rockymountainraw.com',
        description: 'Premium raw dog food supplier serving Colorado and surrounding states',
        address: '123 Raw Food Lane',
        city: 'Colorado Springs',
        state: 'Colorado',
        country: 'US',
        postalCode: '80903',
        latitude: 38.8339,
        longitude: -104.8214,
        serviceRadiusMiles: 100,
        platformAccess: ['rawgle'],
        rawgleCategories: ['raw_meat', 'supplements', 'treats'],
        certifications: [{
          type: 'USDA_Certified',
          number: 'USDA-12345',
          expirationDate: '2024-12-31'
        }]
      };

      const supplier = await supplierService.createSupplier(supplierData, supplierUserId);

      expect(supplier.name).toBe('Rocky Mountain Raw');
      expect(supplier.city).toBe('Colorado Springs');
      expect(supplier.rawgleCategories).toEqual(['raw_meat', 'supplements', 'treats']);
      expect(supplier.verified).toBe(false); // New suppliers start unverified

      // Step 4: Search for Suppliers by Location (Customer Perspective)
      const searchResults = await supplierService.searchSuppliers({
        platform: 'rawgle',
        state: 'Colorado',
        category: 'raw_meat'
      }, {
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc'
      });

      expect(searchResults.suppliers).toBeDefined();
      expect(searchResults.suppliers.length).toBeGreaterThan(0);
      expect(searchResults.suppliers[0].name).toBe('Rocky Mountain Raw');

      // Step 5: Get Nearby Suppliers using GPS coordinates
      const nearbySuppliers = await supplierService.getSuppliersByLocation(
        39.7392, // Denver latitude
        -104.9903, // Denver longitude
        100 // 100 mile radius
      );

      expect(nearbySuppliers.suppliers).toBeDefined();
      expect(nearbySuppliers.suppliers.length).toBeGreaterThan(0);
      
      const foundSupplier = nearbySuppliers.suppliers.find(s => s.id === supplier.id);
      expect(foundSupplier).toBeDefined();
      expect(foundSupplier.distance).toBeLessThan(100);

      // Step 6: Get Detailed Supplier Information
      const detailedSupplier = await supplierService.getSupplier(supplier.id, customerId);

      expect(detailedSupplier.description).toBeDefined();
      expect(detailedSupplier.website).toBe('https://rockymountainraw.com');
      expect(detailedSupplier.certifications).toBeDefined();

      // Step 7: Update Supplier Information
      const supplierUpdates = {
        description: 'Premium raw dog food supplier serving Colorado and surrounding states. Now offering delivery!',
        serviceRadiusMiles: 150,
        insurance_info: {
          provider: 'Business Insurance Co',
          policyNumber: 'BIC-789456',
          expirationDate: '2024-06-30'
        }
      };

      const updatedSupplier = await supplierService.updateSupplier(supplier.id, supplierUpdates, supplierUserId);

      expect(updatedSupplier.description).toContain('Now offering delivery!');
      expect(updatedSupplier.serviceRadiusMiles).toBe(150);
      expect(updatedSupplier.insuranceInfo.provider).toBe('Business Insurance Co');

      // Step 8: Search with Updated Radius
      const expandedSearch = await supplierService.getSuppliersByLocation(
        39.7392, // Denver latitude
        -104.9903, // Denver longitude
        150 // Expanded radius
      );

      const foundExpandedSupplier = expandedSearch.suppliers.find(s => s.id === supplier.id);
      expect(foundExpandedSupplier).toBeDefined();
      expect(foundExpandedSupplier.distance).toBeLessThan(150);

      // Step 9: Verify Search Filters Work
      const filteredSearch = await supplierService.searchSuppliers({
        query: 'raw food',
        platform: 'rawgle',
        verified: false // Should find our unverified supplier
      });

      expect(filteredSearch.suppliers.length).toBeGreaterThan(0);
      expect(filteredSearch.suppliers.some(s => s.id === supplier.id)).toBe(true);

      // Step 10: Verify Pagination Works
      const paginatedSearch = await supplierService.searchSuppliers({
        platform: 'rawgle'
      }, {
        limit: 1,
        offset: 0
      });

      expect(paginatedSearch.suppliers.length).toBe(1);
      expect(paginatedSearch.pagination.total).toBeGreaterThan(0);
      expect(paginatedSearch.pagination.hasMore).toBe(false); // Only one supplier
    });
  });

  describe('Cross-Platform User Workflow', () => {
    it('should handle user with access to both platforms', async () => {
      // Step 1: Register User on Rawgle
      const rawgleResult = await authService.register({
        email: 'crossplatform@example.com',
        password: 'CrossPlatform123!',
        name: 'Cross Platform User',
        location: 'Texas, USA'
      }, 'rawgle');

      const userId = rawgleResult.user.id;
      expect(rawgleResult.user.platform).toBe('rawgle');

      // Step 2: Update user to have both platform access (simulating admin action)
      await testDb.execute(
        'UPDATE users SET platform = ? WHERE id = ?',
        ['both', userId]
      );

      // Step 3: Login to Rawgle Platform
      const rawgleLogin = await authService.login(
        'crossplatform@example.com',
        'CrossPlatform123!',
        'rawgle'
      );

      expect(rawgleLogin.user.platform).toBe('both');

      // Step 4: Login to GoHunta Platform
      const gohuntaLogin = await authService.login(
        'crossplatform@example.com',
        'CrossPlatform123!',
        'gohunta'
      );

      expect(gohuntaLogin.user.platform).toBe('both');
      expect(gohuntaLogin.session.token).not.toBe(rawgleLogin.session.token);

      // Step 5: Create Rawgle Pet (Cat)
      const rawglePet = await petService.createPet(userId, {
        name: 'Whiskers',
        species: 'cat',
        breed: 'Persian',
        feeding_type: 'raw'
      }, 'rawgle');

      expect(rawglePet.species).toBe('cat');
      expect(rawglePet.feedingType).toBe('raw');

      // Step 6: Create GoHunta Pet (Hunting Dog)
      const gohuntaPet = await petService.createPet(userId, {
        name: 'Scout',
        species: 'dog',
        breed: 'English Setter',
        hunting_style: 'pointing',
        training_level: 'started'
      }, 'gohunta');

      expect(gohuntaPet.species).toBe('dog');
      expect(gohuntaPet.huntingStyle).toBe('pointing');

      // Step 7: Get All User Pets
      const allPets = await petService.getUserPets(userId);

      expect(allPets.length).toBe(2);
      expect(allPets.some(p => p.species === 'cat')).toBe(true);
      expect(allPets.some(p => p.species === 'dog')).toBe(true);

      // Step 8: Filter Pets by Species
      const dogs = await petService.getUserPets(userId, { species: 'dog' });
      const cats = await petService.getUserPets(userId, { species: 'cat' });

      expect(dogs.length).toBe(1);
      expect(cats.length).toBe(1);
      expect(dogs[0].huntingStyle).toBe('pointing');
      expect(cats[0].feedingType).toBe('raw');

      // Step 9: Verify Both Sessions Are Valid
      const rawgleSessionVerify = await authService.verifySession(rawgleLogin.session.token);
      const gohuntaSessionVerify = await authService.verifySession(gohuntaLogin.session.token);

      expect(rawgleSessionVerify).toBeDefined();
      expect(gohuntaSessionVerify).toBeDefined();
      expect(rawgleSessionVerify.sessionData.platform).toBe('rawgle');
      expect(gohuntaSessionVerify.sessionData.platform).toBe('gohunta');

      // Step 10: Logout from Both Platforms
      await authService.logout(rawgleLogin.session.token);
      await authService.logout(gohuntaLogin.session.token);

      // Verify sessions are invalidated
      const rawgleSessionAfterLogout = await authService.verifySession(rawgleLogin.session.token);
      const gohuntaSessionAfterLogout = await authService.verifySession(gohuntaLogin.session.token);

      expect(rawgleSessionAfterLogout).toBeNull();
      expect(gohuntaSessionAfterLogout).toBeNull();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle various error scenarios gracefully', async () => {
      // Test 1: Registration with duplicate email
      const userData = {
        email: 'duplicate@example.com',
        password: 'Test123!',
        name: 'First User'
      };

      await authService.register(userData, 'rawgle');

      await expect(authService.register({
        ...userData,
        name: 'Second User'
      }, 'gohunta')).rejects.toThrow('User already exists with this email');

      // Test 2: Accessing non-existent resources
      await expect(userService.getUserProfile('non-existent-id'))
        .rejects.toThrow('User not found');

      await expect(petService.getPetProfile('non-existent-pet-id', 'user-id'))
        .rejects.toThrow('Pet not found');

      await expect(supplierService.getSupplier('non-existent-supplier-id'))
        .rejects.toThrow('Supplier not found');

      // Test 3: Unauthorized access
      const user1 = await authService.register({
        email: 'user1@example.com',
        password: 'User1Pass123!',
        name: 'User One'
      }, 'rawgle');

      const user2 = await authService.register({
        email: 'user2@example.com',
        password: 'User2Pass123!',
        name: 'User Two'
      }, 'rawgle');

      const user1Pet = await petService.createPet(user1.user.id, {
        name: 'Private Pet'
      }, 'rawgle');

      await expect(petService.getPetProfile(user1Pet.id, user2.user.id))
        .rejects.toThrow('Access denied');

      // Test 4: Invalid data validation
      await expect(userService.updateProfile(user1.user.id, {
        name: 'A' // Too short
      })).rejects.toThrow('Name must be between 2 and 100 characters');

      await expect(petService.createPet(user1.user.id, {
        name: 'Test Dog',
        weight_lbs: 500 // Too heavy
      }, 'rawgle')).rejects.toThrow('Weight must be between 0 and 300 pounds');

      // Test 5: Platform-specific restrictions
      await expect(petService.createPet(user1.user.id, {
        name: 'Cat',
        species: 'cat'
      }, 'gohunta')).rejects.toThrow('GoHunta platform only supports dogs');

      // Test 6: Rate limiting simulation
      const email = 'ratelimit@example.com';
      
      // Simulate multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        try {
          await authService.login(email, 'wrongpassword', 'rawgle');
        } catch (error) {
          // Expected to fail
        }
      }

      // 6th attempt should be rate limited
      await expect(authService.login(email, 'wrongpassword', 'rawgle'))
        .rejects.toThrow('Too many login attempts');
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across operations', async () => {
      // Step 1: Create user and pet
      const userResult = await authService.register({
        email: 'consistency@example.com',
        password: 'Consistent123!',
        name: 'Data User'
      }, 'rawgle');

      const userId = userResult.user.id;

      const pet = await petService.createPet(userId, {
        name: 'Consistency Dog',
        weight_lbs: 50
      }, 'rawgle');

      // Step 2: Verify initial state
      let stats = await userService.getUserStats(userId);
      expect(stats.petsCount).toBe(1);

      let userPets = await petService.getUserPets(userId);
      expect(userPets.length).toBe(1);

      // Step 3: Update pet and verify weight conversion
      await petService.updatePet(pet.id, userId, {
        weight_lbs: 60
      });

      const updatedPet = await petService.getPetProfile(pet.id, userId);
      expect(updatedPet.weightLbs).toBe(60);
      expect(updatedPet.weightKg).toBeCloseTo(27.22); // 60 * 0.453592

      // Step 4: Delete pet and verify stats update
      await petService.deletePet(pet.id, userId);

      stats = await userService.getUserStats(userId);
      expect(stats.petsCount).toBe(0);

      userPets = await petService.getUserPets(userId);
      expect(userPets.length).toBe(0);

      // Step 5: Verify soft delete (pet still exists in DB but inactive)
      await expect(petService.getPetProfile(pet.id, userId))
        .rejects.toThrow('Pet not found');

      // Step 6: Delete user and verify cascade
      await userService.deleteAccount(userId, 'test_cleanup');

      await expect(userService.getUserProfile(userId))
        .rejects.toThrow('User not found');
    });
  });
});