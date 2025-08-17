/**
 * Pet Profiles Handler for Rawgle
 * Handles pet profile management optimized for raw feeding
 */

import { Hono } from 'hono';
import { PetService } from '../services/pet-service.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest, validateFileUpload } from '../middleware/validation.js';
import { z } from 'zod';

const app = new Hono();

// All routes require authentication
app.use('*', authMiddleware);

// Validation schemas
const createPetSchema = z.object({
  name: z.string().min(1, 'Pet name is required').max(50, 'Pet name too long'),
  species: z.string().default('dog'),
  breed: z.string().optional(),
  birth_date: z.string().date().optional(),
  gender: z.enum(['male', 'female', 'unknown']).optional(),
  weight_lbs: z.number().positive().max(300).optional(),
  color_markings: z.string().max(200).optional(),
  registration_number: z.string().max(50).optional(),
  microchip_id: z.string().max(50).optional(),
  // Raw feeding specific
  feeding_type: z.enum(['raw', 'kibble', 'mixed']).default('raw'),
  allergies: z.array(z.string()).default([]),
  dietary_restrictions: z.array(z.string()).default([]),
  feeding_schedule: z.object({
    meals_per_day: z.number().int().min(1).max(6).default(2),
    breakfast_time: z.string().optional(),
    lunch_time: z.string().optional(),
    dinner_time: z.string().optional(),
    snack_times: z.array(z.string()).optional()
  }).optional(),
  target_daily_calories: z.number().int().positive().optional(),
  activity_level: z.enum(['low', 'moderate', 'high', 'very_high']).default('moderate'),
  // Health and notes
  health_records: z.array(z.object({
    date: z.string().date(),
    type: z.string(),
    description: z.string(),
    veterinarian: z.string().optional(),
    documents: z.array(z.string().url()).optional()
  })).default([]),
  vaccination_records: z.array(z.object({
    vaccine: z.string(),
    date: z.string().date(),
    next_due: z.string().date().optional(),
    veterinarian: z.string().optional()
  })).default([]),
  notes: z.string().max(2000).optional()
});

const updatePetSchema = createPetSchema.partial();

// GET /api/pets - Get user's pets
app.get('/', async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const { species, active = 'true' } = query;
    
    const petService = new PetService(c.env.DB, c.env.KV, c.env.R2);
    const pets = await petService.getUserPets(user.id, {
      species,
      active: active === 'true'
    });
    
    return c.json({
      success: true,
      data: {
        pets,
        total: pets.length
      }
    });
  } catch (error) {
    console.error('Get pets error:', error);
    return c.json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve pets'
    }, 500);
  }
});

// POST /api/pets - Create new pet profile
app.post('/', validateRequest(createPetSchema), async (c) => {
  try {
    const user = c.get('user');
    const petData = c.get('validatedData');
    
    const petService = new PetService(c.env.DB, c.env.KV, c.env.R2);
    const pet = await petService.createPet(user.id, petData, 'rawgle');
    
    // Award PAWS tokens for creating pet profile
    try {
      const PAWSService = (await import('../services/paws-service.js')).PAWSService;
      const pawsService = new PAWSService(c.env.DB, c.env.KV);
      await pawsService.awardTokens(user.id, 25, 'pet_profile_created', {
        pet_id: pet.id,
        pet_name: pet.name
      });
    } catch (pawsError) {
      console.warn('Failed to award PAWS tokens:', pawsError);
    }
    
    return c.json({
      success: true,
      message: 'Pet profile created successfully',
      data: {
        pet,
        paws_awarded: 25
      }
    }, 201);
  } catch (error) {
    console.error('Create pet error:', error);
    
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
      message: 'Failed to create pet profile'
    }, 500);
  }
});

// GET /api/pets/:id - Get specific pet profile
app.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const petId = c.req.param('id');
    
    const petService = new PetService(c.env.DB, c.env.KV, c.env.R2);
    const pet = await petService.getPetProfile(petId, user.id);
    
    return c.json({
      success: true,
      data: {
        pet
      }
    });
  } catch (error) {
    console.error('Get pet error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Access denied')) {
      return c.json({
        success: false,
        error: 'PET_NOT_FOUND',
        message: 'Pet not found'
      }, 404);
    }
    
    return c.json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve pet profile'
    }, 500);
  }
});

// PUT /api/pets/:id - Update pet profile
app.put('/:id', validateRequest(updatePetSchema), async (c) => {
  try {
    const user = c.get('user');
    const petId = c.req.param('id');
    const updates = c.get('validatedData');
    
    const petService = new PetService(c.env.DB, c.env.KV, c.env.R2);
    const updatedPet = await petService.updatePet(petId, user.id, updates);
    
    return c.json({
      success: true,
      message: 'Pet profile updated successfully',
      data: {
        pet: updatedPet
      }
    });
  } catch (error) {
    console.error('Update pet error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Access denied')) {
      return c.json({
        success: false,
        error: 'PET_NOT_FOUND',
        message: 'Pet not found'
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
      message: 'Failed to update pet profile'
    }, 500);
  }
});

// DELETE /api/pets/:id - Delete pet profile
app.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const petId = c.req.param('id');
    
    const petService = new PetService(c.env.DB, c.env.KV, c.env.R2);
    await petService.deletePet(petId, user.id);
    
    return c.json({
      success: true,
      message: 'Pet profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete pet error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Access denied')) {
      return c.json({
        success: false,
        error: 'PET_NOT_FOUND',
        message: 'Pet not found'
      }, 404);
    }
    
    return c.json({
      success: false,
      error: 'DELETE_FAILED',
      message: 'Failed to delete pet profile'
    }, 500);
  }
});

// POST /api/pets/:id/photos - Upload pet photos
app.post('/:id/photos', 
  validateFileUpload({
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    required: true
  }), 
  async (c) => {
    try {
      const user = c.get('user');
      const petId = c.req.param('id');
      const files = c.get('validatedFiles');
      
      const petService = new PetService(c.env.DB, c.env.KV, c.env.R2);
      const result = await petService.uploadPhotos(
        petId,
        user.id,
        files,
        files.map(f => f.type)
      );
      
      return c.json({
        success: true,
        message: 'Photos uploaded successfully',
        data: result
      });
    } catch (error) {
      console.error('Upload pet photos error:', error);
      
      if (error.message.includes('not found') || error.message.includes('Access denied')) {
        return c.json({
          success: false,
          error: 'PET_NOT_FOUND',
          message: 'Pet not found'
        }, 404);
      }
      
      if (error.message.includes('Invalid') || error.message.includes('Maximum')) {
        return c.json({
          success: false,
          error: 'INVALID_UPLOAD',
          message: error.message
        }, 400);
      }
      
      return c.json({
        success: false,
        error: 'UPLOAD_FAILED',
        message: 'Failed to upload photos'
      }, 500);
    }
  }
);

// DELETE /api/pets/:id/photos/:photoUrl - Delete pet photo
app.delete('/:id/photos/:photoUrl', async (c) => {
  try {
    const user = c.get('user');
    const petId = c.req.param('id');
    const photoUrl = decodeURIComponent(c.req.param('photoUrl'));
    
    const petService = new PetService(c.env.DB, c.env.KV, c.env.R2);
    await petService.deletePhoto(petId, user.id, photoUrl);
    
    return c.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    console.error('Delete pet photo error:', error);
    
    if (error.message.includes('not found')) {
      return c.json({
        success: false,
        error: 'PHOTO_NOT_FOUND',
        message: 'Photo not found'
      }, 404);
    }
    
    if (error.message.includes('Access denied')) {
      return c.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Access denied'
      }, 403);
    }
    
    return c.json({
      success: false,
      error: 'DELETE_FAILED',
      message: 'Failed to delete photo'
    }, 500);
  }
});

// GET /api/pets/:id/feeding-summary - Get feeding summary for pet
app.get('/:id/feeding-summary', async (c) => {
  try {
    const user = c.get('user');
    const petId = c.req.param('id');
    const query = c.req.query();
    const { period = 'week', include_analytics = 'true' } = query;
    
    // Verify pet ownership
    const petCheck = await c.env.DB
      .prepare('SELECT user_id FROM pets WHERE id = ? AND active = 1')
      .bind(petId)
      .first();
    
    if (!petCheck || petCheck.user_id !== user.id) {
      return c.json({
        success: false,
        error: 'PET_NOT_FOUND',
        message: 'Pet not found or access denied'
      }, 404);
    }
    
    const FeedingService = (await import('../services/feeding-service.js')).FeedingService;
    const feedingService = new FeedingService(c.env.DB, c.env.KV);
    
    const summary = await feedingService.getNutritionSummary(petId, period);
    
    let analytics = null;
    if (include_analytics === 'true') {
      analytics = await feedingService.getFeedingAnalytics(user.id, {
        pet_id: petId,
        period,
        metrics: ['nutrition', 'appetite', 'energy']
      });
    }
    
    return c.json({
      success: true,
      data: {
        pet_id: petId,
        period,
        summary,
        analytics
      }
    });
  } catch (error) {
    console.error('Get pet feeding summary error:', error);
    return c.json({
      success: false,
      error: 'SUMMARY_FAILED',
      message: 'Failed to generate feeding summary'
    }, 500);
  }
});

// GET /api/pets/:id/nft-status - Get NFT status for pet
app.get('/:id/nft-status', async (c) => {
  try {
    const user = c.get('user');
    const petId = c.req.param('id');
    
    // Verify pet ownership
    const pet = await c.env.DB
      .prepare('SELECT user_id, nft_minted, nft_token_id FROM pets WHERE id = ? AND active = 1')
      .bind(petId)
      .first();
    
    if (!pet || pet.user_id !== user.id) {
      return c.json({
        success: false,
        error: 'PET_NOT_FOUND',
        message: 'Pet not found or access denied'
      }, 404);
    }
    
    let nftRecord = null;
    if (pet.nft_minted && pet.nft_token_id) {
      nftRecord = await c.env.DB
        .prepare(`
          SELECT id, nft_type, token_id, blockchain, status, metadata_uri, 
                 rarity_score, rarity_rank, minted_at, created_at
          FROM nft_records 
          WHERE pet_id = ? AND status = 'minted'
          ORDER BY minted_at DESC
          LIMIT 1
        `)
        .bind(petId)
        .first();
    }
    
    return c.json({
      success: true,
      data: {
        pet_id: petId,
        nft_minted: pet.nft_minted,
        nft_token_id: pet.nft_token_id,
        nft_record: nftRecord ? {
          id: nftRecord.id,
          type: nftRecord.nft_type,
          token_id: nftRecord.token_id,
          blockchain: nftRecord.blockchain,
          status: nftRecord.status,
          metadata_uri: nftRecord.metadata_uri,
          rarity_score: nftRecord.rarity_score,
          rarity_rank: nftRecord.rarity_rank,
          minted_at: nftRecord.minted_at,
          created_at: nftRecord.created_at
        } : null
      }
    });
  } catch (error) {
    console.error('Get pet NFT status error:', error);
    return c.json({
      success: false,
      error: 'NFT_STATUS_FAILED',
      message: 'Failed to retrieve NFT status'
    }, 500);
  }
});

export default app;