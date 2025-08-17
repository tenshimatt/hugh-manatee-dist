/**
 * Feeding Logs Handler for Rawgle
 * Handles pet feeding logs, nutrition tracking, and analytics
 */

import { Hono } from 'hono';
import { FeedingService } from '../services/feeding-service.js';
import { PAWSService } from '../services/paws-service.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { z } from 'zod';

const app = new Hono();

// All routes require authentication
app.use('*', authMiddleware);

// Validation schemas
const createFeedingLogSchema = z.object({
  pet_id: z.string().uuid('Invalid pet ID'),
  feeding_date: z.string().datetime('Invalid date format'),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  food_type: z.string().min(1, 'Food type is required'),
  brand: z.string().optional(),
  protein_source: z.string().optional(),
  amount_oz: z.number().positive('Amount must be positive').optional(),
  amount_grams: z.number().positive('Amount must be positive').optional(),
  calories_estimated: z.number().int().positive().optional(),
  protein_grams: z.number().positive().optional(),
  fat_grams: z.number().positive().optional(),
  carb_grams: z.number().positive().optional(),
  calcium_mg: z.number().positive().optional(),
  phosphorus_mg: z.number().positive().optional(),
  appetite_rating: z.number().int().min(1).max(5).optional(),
  digestion_notes: z.string().max(500).optional(),
  energy_level: z.number().int().min(1).max(5).optional(),
  location: z.string().max(100).optional(),
  weather: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).max(5).optional()
}).refine((data) => data.amount_oz || data.amount_grams, {
  message: "Either amount_oz or amount_grams must be provided",
  path: ["amount_oz"]
});

// Create a separate schema for updates
const updateFeedingLogSchema = z.object({
  feeding_date: z.string().datetime('Invalid date format').optional(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  food_type: z.string().min(1, 'Food type is required').optional(),
  brand: z.string().optional(),
  protein_source: z.string().optional(),
  amount_oz: z.number().positive('Amount must be positive').optional(),
  amount_grams: z.number().positive('Amount must be positive').optional(),
  calories_estimated: z.number().int().positive().optional(),
  protein_grams: z.number().positive().optional(),
  fat_grams: z.number().positive().optional(),
  carb_grams: z.number().positive().optional(),
  calcium_mg: z.number().positive().optional(),
  phosphorus_mg: z.number().positive().optional(),
  appetite_rating: z.number().int().min(1).max(5).optional(),
  digestion_notes: z.string().max(500).optional(),
  energy_level: z.number().int().min(1).max(5).optional(),
  location: z.string().max(100).optional(),
  weather: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).max(5).optional()
});

const analyticsQuerySchema = z.object({
  pet_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  metrics: z.array(z.enum(['nutrition', 'appetite', 'energy', 'weight'])).default(['nutrition'])
});

// GET /api/feeding/logs - Get feeding logs
app.get('/logs', async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    
    const {
      pet_id,
      start_date,
      end_date,
      limit = 20,
      offset = 0,
      sort = 'feeding_date',
      order = 'desc'
    } = query;
    
    const feedingService = new FeedingService(c.env.DB, c.env.KV);
    
    const filters = {
      userId: user.id,
      petId: pet_id,
      startDate: start_date,
      endDate: end_date,
      limit: parseInt(limit),
      offset: parseInt(offset),
      sort,
      order
    };
    
    const result = await feedingService.getFeedingLogs(filters);
    
    return c.json({
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get feeding logs error:', error);
    return c.json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve feeding logs'
    }, 500);
  }
});

// POST /api/feeding/logs - Create feeding log
app.post('/logs', validateRequest(createFeedingLogSchema), async (c) => {
  try {
    const user = c.get('user');
    const logData = c.get('validatedData');
    
    const feedingService = new FeedingService(c.env.DB, c.env.KV);
    const pawsService = new PAWSService(c.env.DB, c.env.KV);
    
    // Verify pet ownership
    const petResult = await c.env.DB
      .prepare('SELECT user_id FROM pets WHERE id = ? AND active = 1')
      .bind(logData.pet_id)
      .first();
    
    if (!petResult || petResult.user_id !== user.id) {
      return c.json({
        success: false,
        error: 'PET_NOT_FOUND',
        message: 'Pet not found or access denied'
      }, 404);
    }
    
    const feedingLog = await feedingService.createFeedingLog(user.id, logData);
    
    // Award PAWS tokens for logging feeding
    try {
      await pawsService.awardTokens(user.id, 10, 'feeding_log_created', {
        feeding_log_id: feedingLog.id,
        pet_id: logData.pet_id
      });
    } catch (pawsError) {
      console.warn('Failed to award PAWS tokens:', pawsError);
      // Don't fail the main operation
    }
    
    return c.json({
      success: true,
      message: 'Feeding log created successfully',
      data: {
        feeding_log: feedingLog,
        paws_awarded: 10
      }
    }, 201);
  } catch (error) {
    console.error('Create feeding log error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return c.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'CREATION_FAILED',
      message: 'Failed to create feeding log'
    }, 500);
  }
});

// GET /api/feeding/logs/:id - Get specific feeding log
app.get('/logs/:id', async (c) => {
  try {
    const user = c.get('user');
    const logId = c.req.param('id');
    
    const feedingService = new FeedingService(c.env.DB, c.env.KV);
    const feedingLog = await feedingService.getFeedingLog(logId, user.id);
    
    return c.json({
      success: true,
      data: {
        feeding_log: feedingLog
      }
    });
  } catch (error) {
    console.error('Get feeding log error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Access denied')) {
      return c.json({
        success: false,
        error: 'LOG_NOT_FOUND',
        message: 'Feeding log not found'
      }, 404);
    }
    
    return c.json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve feeding log'
    }, 500);
  }
});

// PUT /api/feeding/logs/:id - Update feeding log
app.put('/logs/:id', validateRequest(updateFeedingLogSchema), async (c) => {
  try {
    const user = c.get('user');
    const logId = c.req.param('id');
    const updates = c.get('validatedData');
    
    const feedingService = new FeedingService(c.env.DB, c.env.KV);
    const updatedLog = await feedingService.updateFeedingLog(logId, user.id, updates);
    
    return c.json({
      success: true,
      message: 'Feeding log updated successfully',
      data: {
        feeding_log: updatedLog
      }
    });
  } catch (error) {
    console.error('Update feeding log error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Access denied')) {
      return c.json({
        success: false,
        error: 'LOG_NOT_FOUND',
        message: 'Feeding log not found'
      }, 404);
    }
    
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return c.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'UPDATE_FAILED',
      message: 'Failed to update feeding log'
    }, 500);
  }
});

// DELETE /api/feeding/logs/:id - Delete feeding log
app.delete('/logs/:id', async (c) => {
  try {
    const user = c.get('user');
    const logId = c.req.param('id');
    
    const feedingService = new FeedingService(c.env.DB, c.env.KV);
    await feedingService.deleteFeedingLog(logId, user.id);
    
    return c.json({
      success: true,
      message: 'Feeding log deleted successfully'
    });
  } catch (error) {
    console.error('Delete feeding log error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Access denied')) {
      return c.json({
        success: false,
        error: 'LOG_NOT_FOUND',
        message: 'Feeding log not found'
      }, 404);
    }
    
    return c.json({
      success: false,
      error: 'DELETE_FAILED',
      message: 'Failed to delete feeding log'
    }, 500);
  }
});

// GET /api/feeding/analytics - Get feeding analytics
app.get('/analytics', validateRequest(analyticsQuerySchema, 'query'), async (c) => {
  try {
    const user = c.get('user');
    const params = c.get('validatedData');
    
    const feedingService = new FeedingService(c.env.DB, c.env.KV);
    const analytics = await feedingService.getFeedingAnalytics(user.id, params);
    
    return c.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get feeding analytics error:', error);
    return c.json({
      success: false,
      error: 'ANALYTICS_FAILED',
      message: 'Failed to generate feeding analytics'
    }, 500);
  }
});

// GET /api/feeding/nutrition-summary/:petId - Get nutrition summary for pet
app.get('/nutrition-summary/:petId', async (c) => {
  try {
    const user = c.get('user');
    const petId = c.req.param('petId');
    const query = c.req.query();
    const { period = 'week' } = query;
    
    // Verify pet ownership
    const petResult = await c.env.DB
      .prepare('SELECT user_id FROM pets WHERE id = ? AND active = 1')
      .bind(petId)
      .first();
    
    if (!petResult || petResult.user_id !== user.id) {
      return c.json({
        success: false,
        error: 'PET_NOT_FOUND',
        message: 'Pet not found or access denied'
      }, 404);
    }
    
    const feedingService = new FeedingService(c.env.DB, c.env.KV);
    const summary = await feedingService.getNutritionSummary(petId, period);
    
    return c.json({
      success: true,
      data: {
        pet_id: petId,
        period,
        nutrition_summary: summary
      }
    });
  } catch (error) {
    console.error('Get nutrition summary error:', error);
    return c.json({
      success: false,
      error: 'SUMMARY_FAILED',
      message: 'Failed to generate nutrition summary'
    }, 500);
  }
});

// POST /api/feeding/photos/:logId - Upload feeding photos
app.post('/photos/:logId', async (c) => {
  try {
    const user = c.get('user');
    const logId = c.req.param('logId');
    
    // Verify feeding log ownership
    const logResult = await c.env.DB
      .prepare('SELECT user_id FROM feeding_logs WHERE id = ?')
      .bind(logId)
      .first();
    
    if (!logResult || logResult.user_id !== user.id) {
      return c.json({
        success: false,
        error: 'LOG_NOT_FOUND',
        message: 'Feeding log not found or access denied'
      }, 404);
    }
    
    const formData = await c.req.formData();
    const files = formData.getAll('photos');
    
    if (!files || files.length === 0) {
      return c.json({
        success: false,
        error: 'NO_FILES',
        message: 'No photos provided'
      }, 400);
    }
    
    if (files.length > 5) {
      return c.json({
        success: false,
        error: 'TOO_MANY_FILES',
        message: 'Maximum 5 photos allowed per feeding log'
      }, 400);
    }
    
    const feedingService = new FeedingService(c.env.DB, c.env.KV, c.env.R2);
    const uploadedPhotos = await feedingService.uploadFeedingPhotos(logId, files);
    
    return c.json({
      success: true,
      message: 'Photos uploaded successfully',
      data: {
        photos: uploadedPhotos
      }
    });
  } catch (error) {
    console.error('Upload feeding photos error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('too large')) {
      return c.json({
        success: false,
        error: 'INVALID_FILE',
        message: error.message
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'UPLOAD_FAILED',
      message: 'Failed to upload photos'
    }, 500);
  }
});

// DELETE /api/feeding/photos/:logId/:photoId - Delete feeding photo
app.delete('/photos/:logId/:photoId', async (c) => {
  try {
    const user = c.get('user');
    const logId = c.req.param('logId');
    const photoId = c.req.param('photoId');
    
    // Verify feeding log ownership
    const logResult = await c.env.DB
      .prepare('SELECT user_id FROM feeding_logs WHERE id = ?')
      .bind(logId)
      .first();
    
    if (!logResult || logResult.user_id !== user.id) {
      return c.json({
        success: false,
        error: 'LOG_NOT_FOUND',
        message: 'Feeding log not found or access denied'
      }, 404);
    }
    
    const feedingService = new FeedingService(c.env.DB, c.env.KV, c.env.R2);
    await feedingService.deleteFeedingPhoto(logId, photoId);
    
    return c.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    console.error('Delete feeding photo error:', error);
    
    if (error.message.includes('not found')) {
      return c.json({
        success: false,
        error: 'PHOTO_NOT_FOUND',
        message: 'Photo not found'
      }, 404);
    }
    
    return c.json({
      success: false,
      error: 'DELETE_FAILED',
      message: 'Failed to delete photo'
    }, 500);
  }
});

// GET /api/feeding/recommendations/:petId - Get feeding recommendations
app.get('/recommendations/:petId', async (c) => {
  try {
    const user = c.get('user');
    const petId = c.req.param('petId');
    
    // Verify pet ownership
    const petResult = await c.env.DB
      .prepare('SELECT user_id, weight_lbs, birth_date FROM pets WHERE id = ? AND active = 1')
      .bind(petId)
      .first();
    
    if (!petResult || petResult.user_id !== user.id) {
      return c.json({
        success: false,
        error: 'PET_NOT_FOUND',
        message: 'Pet not found or access denied'
      }, 404);
    }
    
    const feedingService = new FeedingService(c.env.DB, c.env.KV);
    const recommendations = await feedingService.getFeedingRecommendations(petId, {
      weight: petResult.weight_lbs,
      birthDate: petResult.birth_date
    });
    
    return c.json({
      success: true,
      data: {
        pet_id: petId,
        recommendations
      }
    });
  } catch (error) {
    console.error('Get feeding recommendations error:', error);
    return c.json({
      success: false,
      error: 'RECOMMENDATIONS_FAILED',
      message: 'Failed to generate feeding recommendations'
    }, 500);
  }
});

export default app;