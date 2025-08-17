/**
 * Feeding Service Unit Tests
 * Tests feeding log operations and analytics with proper method signatures
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { FeedingService } from '../../src/services/feeding-service.js';
import { EnhancedTestHelpers, createEnhancedMockEnv } from '../helpers/enhanced-test-setup.js';

describe('FeedingService', () => {
  let feedingService;
  let mockEnv;
  let testUser;
  let testPet;

  beforeEach(() => {
    mockEnv = createEnhancedMockEnv();
    feedingService = new FeedingService(mockEnv.DB, mockEnv.KV);
    testUser = EnhancedTestHelpers.createTestUser();
    testPet = EnhancedTestHelpers.createTestPet(testUser.id);
  });

  describe('createFeedingLog', () => {
    test('should create feeding log successfully', async () => {
      const feedingData = {
        pet_id: testPet.id,
        feeding_date: '2024-01-15T12:00:00Z',
        meal_type: 'lunch',
        food_type: 'raw_meat',
        protein_source: 'beef',
        amount_grams: 300,
        appetite_rating: 5,
        energy_level: 4
      };

      const result = await feedingService.createFeedingLog(testUser.id, feedingData);

      expect(result).toMatchObject({
        pet_id: testPet.id,
        user_id: testUser.id,
        meal_type: 'lunch',
        protein_source: 'beef',
        amount_grams: 300
      });
      expect(result.id).toBeDefined();
      expect(result.feeding_date).toBe('2024-01-15');
      expect(result.feeding_time).toBe('12:00:00');
    });

    test('should handle minimal data creation', async () => {
      const minimalData = {
        pet_id: testPet.id,
        feeding_date: '2024-01-15T12:00:00Z'
      };

      const result = await feedingService.createFeedingLog(testUser.id, minimalData);

      expect(result).toMatchObject({
        pet_id: testPet.id,
        user_id: testUser.id,
        meal_type: 'dinner', // default value
        feeding_date: '2024-01-15'
      });
      expect(result.id).toBeDefined();
    });

    test('should handle complex feeding log data', async () => {
      const complexData = {
        pet_id: testPet.id,
        feeding_date: '2024-01-15T18:30:00Z',
        meal_type: 'dinner',
        food_type: 'raw_meat',
        protein_source: 'chicken',
        brand: 'Premium Raw',
        product_name: 'Chicken Hearts',
        amount_oz: 8,
        amount_grams: 225,
        pieces_count: 12,
        calories_estimated: 180,
        protein_grams: 25,
        fat_grams: 8,
        carb_grams: 2,
        appetite_rating: 5,
        eating_speed: 'normal',
        food_left_over: false,
        digestion_notes: 'Good digestion',
        energy_level: 4,
        stool_quality: 'firm',
        location: 'kitchen',
        weather: 'sunny',
        temperature_f: 72,
        feeding_method: 'bowl',
        photos: ['photo1.jpg', 'photo2.jpg'],
        notes: 'Very enthusiastic eating',
        shared_publicly: true,
        tags: ['organic', 'local']
      };

      const result = await feedingService.createFeedingLog(testUser.id, complexData);

      expect(result).toMatchObject({
        pet_id: testPet.id,
        user_id: testUser.id,
        meal_type: 'dinner',
        protein_source: 'chicken',
        brand: 'Premium Raw',
        amount_grams: 225,
        calories_estimated: 180,
        appetite_rating: 5,
        notes: 'Very enthusiastic eating'
      });
      expect(result.photos).toEqual(['photo1.jpg', 'photo2.jpg']);
      expect(result.tags).toEqual(['organic', 'local']);
    });
  });

  describe('getFeedingLogs', () => {
    test('should get feeding logs with basic filters', async () => {
      const filters = { userId: testUser.id };
      const result = await feedingService.getFeedingLogs(filters);

      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.logs)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    test('should filter by pet ID', async () => {
      const filters = { 
        userId: testUser.id, 
        petId: testPet.id 
      };
      const result = await feedingService.getFeedingLogs(filters);

      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('total');
    });

    test('should filter by date range', async () => {
      const filters = {
        userId: testUser.id,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };
      const result = await feedingService.getFeedingLogs(filters);

      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('total');
    });

    test('should handle pagination', async () => {
      const filters = {
        userId: testUser.id,
        limit: 10,
        offset: 0
      };
      const result = await feedingService.getFeedingLogs(filters);

      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('total');
    });

    test('should handle sorting', async () => {
      const filters = {
        userId: testUser.id,
        sort: 'calories_estimated',
        order: 'asc'
      };
      const result = await feedingService.getFeedingLogs(filters);

      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('total');
    });
  });

  describe('getFeedingLog', () => {
    test('should get specific feeding log', async () => {
      // First create a log
      const feedingData = {
        pet_id: testPet.id,
        feeding_date: '2024-01-15T12:00:00Z',
        meal_type: 'lunch',
        food_type: 'raw_meat'
      };
      const created = await feedingService.createFeedingLog(testUser.id, feedingData);

      // Mock the database to return the log
      mockEnv.DB.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          ...created,
          pet_name: testPet.name,
          pet_species: testPet.species,
          photos: JSON.stringify([]),
          videos: JSON.stringify([]),
          tags: JSON.stringify([])
        })
      });

      const result = await feedingService.getFeedingLog(created.id, testUser.id);

      expect(result).toMatchObject({
        id: created.id,
        pet_id: testPet.id,
        user_id: testUser.id
      });
      expect(result.photos).toEqual([]);
      expect(result.tags).toEqual([]);
    });

    test('should throw error for non-existent log', async () => {
      mockEnv.DB.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      });

      await expect(
        feedingService.getFeedingLog('non-existent', testUser.id)
      ).rejects.toThrow('Feeding log not found or access denied');
    });
  });

  describe('updateFeedingLog', () => {
    test('should update existing feeding log', async () => {
      const logId = 'feeding-log-123';
      const updates = {
        appetite_rating: 4,
        notes: 'Updated notes',
        protein_source: 'salmon'
      };

      // Mock existing log check
      mockEnv.DB.prepare = jest.fn().mockImplementation((query) => {
        if (query.includes('SELECT user_id FROM feeding_logs')) {
          return {
            bind: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({ user_id: testUser.id })
          };
        }
        if (query.includes('UPDATE feeding_logs')) {
          return {
            bind: jest.fn().mockReturnThis(),
            run: jest.fn().mockResolvedValue({ success: true })
          };
        }
        // For getFeedingLog call at the end
        return {
          bind: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({
            id: logId,
            user_id: testUser.id,
            pet_id: testPet.id,
            appetite_rating: 4,
            notes: 'Updated notes',
            protein_source: 'salmon',
            pet_name: testPet.name,
            pet_species: testPet.species,
            photos: '[]',
            videos: '[]',
            tags: '[]'
          })
        };
      });

      const result = await feedingService.updateFeedingLog(logId, testUser.id, updates);

      expect(result).toMatchObject({
        id: logId,
        appetite_rating: 4,
        notes: 'Updated notes',
        protein_source: 'salmon'
      });
    });

    test('should reject unauthorized updates', async () => {
      const logId = 'feeding-log-123';
      const wrongUserId = 'different-user';

      mockEnv.DB.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ user_id: testUser.id }) // Different from wrongUserId
      });

      await expect(
        feedingService.updateFeedingLog(logId, wrongUserId, { appetite_rating: 4 })
      ).rejects.toThrow('Feeding log not found or access denied');
    });

    test('should reject updates with no valid fields', async () => {
      const logId = 'feeding-log-123';

      mockEnv.DB.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ user_id: testUser.id })
      });

      await expect(
        feedingService.updateFeedingLog(logId, testUser.id, { invalid_field: 'value' })
      ).rejects.toThrow('No valid fields to update');
    });

    test('should handle date updates properly', async () => {
      const logId = 'feeding-log-123';
      const updates = {
        feeding_date: '2024-02-15T14:30:00Z'
      };

      mockEnv.DB.prepare = jest.fn().mockImplementation((query) => {
        if (query.includes('SELECT user_id FROM feeding_logs')) {
          return {
            bind: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({ user_id: testUser.id })
          };
        }
        if (query.includes('UPDATE feeding_logs')) {
          return {
            bind: jest.fn().mockReturnThis(),
            run: jest.fn().mockResolvedValue({ success: true })
          };
        }
        return {
          bind: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({
            id: logId,
            feeding_date: '2024-02-15',
            feeding_time: '14:30:00',
            photos: '[]',
            videos: '[]',
            tags: '[]'
          })
        };
      });

      const result = await feedingService.updateFeedingLog(logId, testUser.id, updates);

      expect(result.feeding_date).toBe('2024-02-15');
    });
  });

  describe('deleteFeedingLog', () => {
    test('should delete feeding log successfully', async () => {
      const logId = 'feeding-log-123';

      mockEnv.DB.prepare = jest.fn().mockImplementation((query) => {
        if (query.includes('SELECT user_id FROM feeding_logs')) {
          return {
            bind: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({ user_id: testUser.id })
          };
        }
        return {
          bind: jest.fn().mockReturnThis(),
          run: jest.fn().mockResolvedValue({ success: true })
        };
      });

      await expect(
        feedingService.deleteFeedingLog(logId, testUser.id)
      ).resolves.not.toThrow();
    });

    test('should reject unauthorized deletion', async () => {
      const logId = 'feeding-log-123';
      const wrongUserId = 'different-user';

      mockEnv.DB.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ user_id: testUser.id })
      });

      await expect(
        feedingService.deleteFeedingLog(logId, wrongUserId)
      ).rejects.toThrow('Feeding log not found or access denied');
    });
  });

  describe('getFeedingAnalytics', () => {
    test('should generate feeding analytics', async () => {
      const params = {
        pet_id: testPet.id,
        period: 'month',
        metrics: ['nutrition', 'appetite']
      };

      // Mock analytics queries
      mockEnv.DB.prepare = jest.fn().mockImplementation((query) => {
        if (query.includes('COUNT(*) as total_logs')) {
          return {
            bind: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({
              total_logs: 10,
              pets_fed: 1,
              avg_calories: 350,
              avg_appetite: 4.2,
              food_variety: 3,
              protein_variety: 4
            })
          };
        }
        // Mock other analytics queries
        return {
          bind: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({
            total_calories: 3500,
            avg_calories: 350,
            total_protein: 250,
            total_fat: 120,
            protein_sources: 4
          })
        };
      });

      const result = await feedingService.getFeedingAnalytics(testUser.id, params);

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('summary');
      expect(result.summary).toMatchObject({
        total_feeding_logs: expect.any(Number),
        unique_pets: expect.any(Number),
        average_calories_per_meal: expect.any(Number),
        average_appetite_rating: expect.any(Number)
      });
    });

    test('should handle default parameters', async () => {
      mockEnv.DB.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          total_logs: 5,
          pets_fed: 1,
          avg_calories: 300,
          avg_appetite: 4.0,
          food_variety: 2,
          protein_variety: 3
        })
      });

      const result = await feedingService.getFeedingAnalytics(testUser.id);

      expect(result).toHaveProperty('period');
      expect(result.period.period_type).toBe('month');
    });
  });

  describe('getNutritionSummary', () => {
    test('should calculate nutrition summary', async () => {
      mockEnv.DB.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          total_meals: 14,
          total_calories: 4900,
          total_protein: 350,
          total_fat: 140,
          total_grams: 3150,
          avg_appetite: 4.3
        })
      });

      const summary = await feedingService.getNutritionSummary(testPet.id, 'week');

      expect(summary).toMatchObject({
        period: 'week',
        days_analyzed: 7,
        total_meals: 14,
        daily_averages: expect.objectContaining({
          calories: expect.any(Number),
          protein_grams: expect.any(Number),
          fat_grams: expect.any(Number),
          food_grams: expect.any(Number),
          meals: expect.any(Number)
        }),
        average_appetite_rating: expect.any(Number)
      });
    });

    test('should handle different time periods', async () => {
      mockEnv.DB.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          total_meals: 30,
          total_calories: 10500,
          total_protein: 750,
          total_fat: 300,
          total_grams: 6750,
          avg_appetite: 4.1
        })
      });

      const monthSummary = await feedingService.getNutritionSummary(testPet.id, 'month');
      expect(monthSummary.period).toBe('month');
      expect(monthSummary.days_analyzed).toBe(30);

      const quarterSummary = await feedingService.getNutritionSummary(testPet.id, 'quarter');
      expect(quarterSummary.period).toBe('quarter');
      expect(quarterSummary.days_analyzed).toBe(90);
    });
  });

  describe('getFeedingRecommendations', () => {
    test('should generate feeding recommendations', async () => {
      const petData = {
        weight: 65, // 65 lbs
        birthDate: '2020-01-15'
      };

      // Mock recent feeding logs
      mockEnv.DB.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue({
          results: [
            {
              feeding_date: '2024-01-10',
              calories_estimated: 300,
              protein_source: 'chicken',
              appetite_rating: 4
            },
            {
              feeding_date: '2024-01-11',
              calories_estimated: 350,
              protein_source: 'beef',
              appetite_rating: 5
            },
            {
              feeding_date: '2024-01-12',
              calories_estimated: 280,
              protein_source: 'chicken',
              appetite_rating: 3
            }
          ]
        })
      });

      const recommendations = await feedingService.getFeedingRecommendations(testPet.id, petData);

      expect(recommendations).toMatchObject({
        pet_id: testPet.id,
        analysis_period: '7 days',
        total_logs_analyzed: expect.any(Number),
        recommendations: expect.any(Array)
      });
      expect(recommendations.recommendations.length).toBeGreaterThanOrEqual(0);
    });

    test('should provide calorie recommendations', async () => {
      const petData = { weight: 50 }; // Lower weight pet

      mockEnv.DB.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue({
          results: [
            { feeding_date: '2024-01-10', calories_estimated: 200, protein_source: 'chicken', appetite_rating: 4 },
            { feeding_date: '2024-01-11', calories_estimated: 180, protein_source: 'beef', appetite_rating: 4 },
            { feeding_date: '2024-01-12', calories_estimated: 190, protein_source: 'fish', appetite_rating: 4 }
          ]
        })
      });

      const recommendations = await feedingService.getFeedingRecommendations(testPet.id, petData);
      
      // Should recommend increasing calories (avg 190 vs target 1250)
      const calorieRec = recommendations.recommendations.find(r => r.type === 'calories');
      expect(calorieRec).toBeDefined();
      expect(calorieRec.priority).toBe('medium');
    });

    test('should provide variety recommendations', async () => {
      const petData = { weight: 60 };

      mockEnv.DB.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue({
          results: [
            { feeding_date: '2024-01-10', calories_estimated: 400, protein_source: 'chicken', appetite_rating: 4 },
            { feeding_date: '2024-01-11', calories_estimated: 420, protein_source: 'chicken', appetite_rating: 4 },
            { feeding_date: '2024-01-12', calories_estimated: 380, protein_source: 'chicken', appetite_rating: 4 }
          ]
        })
      });

      const recommendations = await feedingService.getFeedingRecommendations(testPet.id, petData);
      
      // Should recommend more variety (only 1 protein source)
      const varietyRec = recommendations.recommendations.find(r => r.type === 'variety');
      expect(varietyRec).toBeDefined();
      expect(varietyRec.priority).toBe('medium');
    });

    test('should provide appetite recommendations', async () => {
      const petData = { weight: 60 };

      mockEnv.DB.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue({
          results: [
            { feeding_date: '2024-01-10', calories_estimated: 400, protein_source: 'chicken', appetite_rating: 2 },
            { feeding_date: '2024-01-11', calories_estimated: 420, protein_source: 'beef', appetite_rating: 3 },
            { feeding_date: '2024-01-12', calories_estimated: 380, protein_source: 'fish', appetite_rating: 2 }
          ]
        })
      });

      const recommendations = await feedingService.getFeedingRecommendations(testPet.id, petData);
      
      // Should recommend addressing low appetite (avg 2.3)
      const appetiteRec = recommendations.recommendations.find(r => r.type === 'appetite');
      expect(appetiteRec).toBeDefined();
      expect(appetiteRec.priority).toBe('high');
    });
  });

  describe('helper methods', () => {
    test('getNutritionMetrics should return nutrition data', async () => {
      mockEnv.DB.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          total_calories: 2800,
          avg_calories: 350,
          total_protein: 200,
          total_fat: 100,
          protein_sources: 3
        })
      });

      const whereClause = 'WHERE user_id = ?';
      const bindings = [testUser.id];

      const metrics = await feedingService.getNutritionMetrics(whereClause, bindings);

      expect(metrics).toMatchObject({
        total_calories: 2800,
        average_calories_per_meal: 350,
        total_protein_grams: 200,
        total_fat_grams: 100,
        protein_source_variety: 3
      });
    });

    test('getAppetiteMetrics should return appetite data', async () => {
      mockEnv.DB.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          avg_appetite: 4.2,
          good_appetite_count: 8,
          poor_appetite_count: 1,
          total_rated: 10
        })
      });

      const whereClause = 'WHERE user_id = ?';
      const bindings = [testUser.id];

      const metrics = await feedingService.getAppetiteMetrics(whereClause, bindings);

      expect(metrics).toMatchObject({
        average_rating: 4.2,
        good_appetite_percentage: 80,
        poor_appetite_percentage: 10,
        total_ratings: 10
      });
    });

    test('getEnergyMetrics should return energy data', async () => {
      mockEnv.DB.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          avg_energy: 3.8,
          high_energy_count: 6,
          low_energy_count: 2,
          total_rated: 10
        })
      });

      const whereClause = 'WHERE user_id = ?';
      const bindings = [testUser.id];

      const metrics = await feedingService.getEnergyMetrics(whereClause, bindings);

      expect(metrics).toMatchObject({
        average_energy_level: 3.8,
        high_energy_percentage: 60,
        low_energy_percentage: 20,
        total_ratings: 10
      });
    });
  });
});