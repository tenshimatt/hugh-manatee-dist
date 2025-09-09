import express from 'express';
import { z } from 'zod';
import { db } from '../config/database';
import { logger } from '../config/logger';

const router = express.Router();

// Validation schemas
const petHealthContextSchema = z.object({
  petId: z.string().uuid().optional(),
  name: z.string().optional(),
  breed: z.string().optional(),
  age: z.number().min(0).max(25).optional(),
  weight: z.number().min(0.1).max(300).optional(),
  activityLevel: z.enum(['low', 'moderate', 'high']).optional(),
  healthConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  currentDiet: z.string().optional(),
});

// Get pet health context for chat
router.get('/pets/:petId/context', async (req, res) => {
  try {
    const { petId } = req.params;

    // Validate UUID format
    if (!z.string().uuid().safeParse(petId).success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pet ID format'
      });
    }

    // Query pet basic information
    const petQuery = `
      SELECT 
        id,
        name,
        breed,
        EXTRACT(YEAR FROM AGE(date_of_birth)) as age,
        weight_kg,
        activity_level,
        diet_type,
        health_conditions,
        dietary_restrictions,
        created_at,
        updated_at
      FROM pets 
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const petResult = await db.query(petQuery, [petId]);
    
    if (petResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }

    const pet = petResult.rows[0];

    // Query recent health records
    const healthQuery = `
      SELECT 
        weight_kg,
        temperature_celsius,
        heart_rate_bpm,
        notes,
        symptoms,
        medications,
        recorded_at
      FROM pet_health_records 
      WHERE pet_id = $1 
      ORDER BY recorded_at DESC 
      LIMIT 5
    `;

    const healthResult = await db.query(healthQuery, [petId]);

    // Query recent feeding entries for diet context
    const feedingQuery = `
      SELECT 
        food_type,
        portion_size_grams,
        meal_type,
        notes,
        fed_at
      FROM feeding_entries 
      WHERE pet_id = $1 
      ORDER BY fed_at DESC 
      LIMIT 10
    `;

    const feedingResult = await db.query(feedingQuery, [petId]);

    // Compile health context
    const healthContext = {
      petId: pet.id,
      petName: pet.name,
      breed: pet.breed,
      age: pet.age || 0,
      weight: pet.weight_kg ? Math.round(pet.weight_kg * 2.20462) : undefined, // Convert to pounds
      activityLevel: pet.activity_level || 'moderate',
      currentDiet: pet.diet_type || 'unknown',
      healthConditions: pet.health_conditions || [],
      dietaryRestrictions: pet.dietary_restrictions || [],
      
      // Recent health data
      recentHealthRecords: healthResult.rows.map(record => ({
        weight: record.weight_kg ? Math.round(record.weight_kg * 2.20462) : null,
        temperature: record.temperature_celsius,
        heartRate: record.heart_rate_bpm,
        symptoms: record.symptoms || [],
        medications: record.medications || [],
        notes: record.notes,
        date: record.recorded_at
      })),
      
      // Recent feeding patterns
      recentFeeding: feedingResult.rows.map(feeding => ({
        foodType: feeding.food_type,
        portionGrams: feeding.portion_size_grams,
        mealType: feeding.meal_type,
        notes: feeding.notes,
        date: feeding.fed_at
      }))
    };

    // Calculate health insights
    const insights = generateHealthInsights(healthContext, healthResult.rows, feedingResult.rows);

    logger.info('Pet health context retrieved', {
      petId,
      petName: pet.name,
      hasHealthRecords: healthResult.rows.length > 0,
      hasFeedingData: feedingResult.rows.length > 0
    });

    res.json({
      success: true,
      data: {
        ...healthContext,
        insights
      }
    });

  } catch (error: any) {
    logger.error('Error retrieving pet health context:', {
      error: error.message,
      stack: error.stack,
      petId: req.params.petId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pet health context'
    });
  }
});

// Get all pets for user (simplified context for chat)
router.get('/pets/summary', async (req, res) => {
  try {
    // For now, return all pets since we don't have user authentication implemented
    const query = `
      SELECT 
        id,
        name,
        breed,
        EXTRACT(YEAR FROM AGE(date_of_birth)) as age,
        weight_kg,
        activity_level,
        diet_type,
        health_conditions
      FROM pets 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const result = await db.query(query);

    const pets = result.rows.map(pet => ({
      id: pet.id,
      name: pet.name,
      breed: pet.breed,
      age: pet.age || 0,
      weight: pet.weight_kg ? Math.round(pet.weight_kg * 2.20462) : undefined,
      activityLevel: pet.activity_level || 'moderate',
      currentDiet: pet.diet_type || 'unknown',
      healthConditions: pet.health_conditions || []
    }));

    logger.info('Pet summary retrieved', {
      petCount: pets.length
    });

    res.json({
      success: true,
      data: pets
    });

  } catch (error: any) {
    logger.error('Error retrieving pets summary:', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pets summary'
    });
  }
});

// Add quick health log entry (for chat integration)
router.post('/pets/:petId/health-log', async (req, res) => {
  try {
    const { petId } = req.params;
    const validationResult = z.object({
      weight: z.number().positive().optional(),
      temperature: z.number().min(35).max(42).optional(),
      heartRate: z.number().min(30).max(250).optional(),
      symptoms: z.array(z.string()).optional(),
      medications: z.array(z.string()).optional(),
      notes: z.string().max(1000).optional(),
    }).safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid health log data',
        details: validationResult.error.errors
      });
    }

    const { weight, temperature, heartRate, symptoms, medications, notes } = validationResult.data;

    // Verify pet exists
    const petCheck = await db.query('SELECT id FROM pets WHERE id = $1 AND deleted_at IS NULL', [petId]);
    if (petCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }

    // Insert health record
    const insertQuery = `
      INSERT INTO pet_health_records (
        pet_id, 
        weight_kg, 
        temperature_celsius, 
        heart_rate_bpm, 
        symptoms, 
        medications, 
        notes,
        recorded_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, recorded_at
    `;

    const weightKg = weight ? weight / 2.20462 : null; // Convert pounds to kg
    const result = await db.query(insertQuery, [
      petId,
      weightKg,
      temperature,
      heartRate,
      symptoms || [],
      medications || [],
      notes
    ]);

    logger.info('Health log entry created', {
      petId,
      recordId: result.rows[0].id,
      hasWeight: !!weight,
      hasTemperature: !!temperature,
      hasSymptoms: !!(symptoms?.length)
    });

    res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        recordedAt: result.rows[0].recorded_at
      },
      message: 'Health log entry created successfully'
    });

  } catch (error: any) {
    logger.error('Error creating health log entry:', {
      error: error.message,
      stack: error.stack,
      petId: req.params.petId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create health log entry'
    });
  }
});

// Generate health insights from data
function generateHealthInsights(healthContext: any, healthRecords: any[], feedingRecords: any[]): any {
  const insights = {
    weightTrend: null as string | null,
    feedingPattern: null as string | null,
    healthAlerts: [] as string[],
    recommendations: [] as string[]
  };

  // Weight trend analysis
  if (healthRecords.length >= 2) {
    const weights = healthRecords
      .filter(r => r.weight_kg)
      .map(r => r.weight_kg)
      .slice(0, 5);
    
    if (weights.length >= 2) {
      const recent = weights[0];
      const older = weights[weights.length - 1];
      const change = ((recent - older) / older) * 100;
      
      if (Math.abs(change) > 5) {
        insights.weightTrend = change > 0 ? 'increasing' : 'decreasing';
        insights.healthAlerts.push(`Weight ${change > 0 ? 'gain' : 'loss'} of ${Math.abs(change).toFixed(1)}% detected`);
      }
    }
  }

  // Feeding pattern analysis
  if (feedingRecords.length >= 3) {
    const avgPortion = feedingRecords.reduce((sum, f) => sum + (f.portion_size_grams || 0), 0) / feedingRecords.length;
    if (avgPortion > 0) {
      insights.feedingPattern = `Average portion: ${Math.round(avgPortion)}g`;
    }
  }

  // Health condition recommendations
  if (healthContext.healthConditions.length > 0) {
    if (healthContext.healthConditions.some((c: string) => c.toLowerCase().includes('arthritis'))) {
      insights.recommendations.push('Consider anti-inflammatory foods like fish and turmeric');
    }
    if (healthContext.healthConditions.some((c: string) => c.toLowerCase().includes('kidney'))) {
      insights.recommendations.push('Monitor protein levels and ensure adequate hydration');
    }
    if (healthContext.healthConditions.some((c: string) => c.toLowerCase().includes('allerg'))) {
      insights.recommendations.push('Maintain strict elimination diet protocols');
    }
  }

  // Age-specific recommendations
  if (healthContext.age > 7) {
    insights.recommendations.push('Senior pets benefit from smaller, more frequent meals');
  } else if (healthContext.age < 1) {
    insights.recommendations.push('Puppies need higher protein and more frequent feeding');
  }

  return insights;
}

export { router as healthDataRouter };