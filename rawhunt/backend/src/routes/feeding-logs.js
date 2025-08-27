import { Router } from 'itty-router';
import { ValidationUtils } from '../utils/validation.js';
import { requireAuth, requireDogOwnershipOrAdmin } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { createCorsResponse } from '../middleware/cors.js';
import { DatabaseUtils } from '../utils/database.js';

const feedingLogsRouter = Router({ base: '/api/feeding-logs' });

/**
 * POST /api/feeding-logs
 * Log a feeding session for a pet with detailed nutritional and behavioral data
 */
feedingLogsRouter.post('/', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const rateLimitResponse = await rateLimit(request, env, {
      windowMs: 60 * 1000,
      maxRequests: 30 // Allow frequent feeding log entries
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const sanitizedBody = ValidationUtils.sanitizeJson(body);

    const {
      dogId,
      feedDate = new Date().toISOString().split('T')[0], // Default to today
      feedTime = new Date().toTimeString().split(' ')[0], // Default to current time
      mealType = 'meal',
      foodBrand,
      foodProduct,
      foodType = 'kibble',
      quantityCups,
      quantityGrams,
      caloriesEstimated,
      nutritionalData = {},
      behaviorData = {},
      digestiveData = {},
      notes = ''
    } = sanitizedBody;

    if (!dogId || (!quantityCups && !quantityGrams)) {
      return createCorsResponse({
        error: 'Dog ID and quantity (cups or grams) are required',
        code: 'MISSING_REQUIRED_FIELDS'
      }, 400);
    }

    // Verify dog ownership
    const dog = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT id, name FROM dogs WHERE id = ? AND owner_id = ? AND is_active = TRUE',
      [dogId, auth.user.id]
    );

    if (!dog) {
      return createCorsResponse({
        error: 'Pet not found or access denied',
        code: 'PET_NOT_FOUND'
      }, 404);
    }

    // Insert feeding log
    const result = await DatabaseUtils.executeUpdate(
      env.DB,
      `INSERT INTO feeding_logs (
        dog_id, logged_by, feed_date, feed_time, meal_type,
        food_brand, food_product, food_type, quantity_cups, quantity_grams,
        calories_estimated, protein_grams, fat_grams, carbs_grams, fiber_grams,
        appetite_rating, eating_speed, finished_meal, leftover_amount,
        stool_quality, stool_frequency, digestive_response,
        activity_level_before, activity_level_after, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dogId, auth.user.id, feedDate, feedTime, mealType,
        foodBrand, foodProduct, foodType, quantityCups, quantityGrams,
        caloriesEstimated, 
        nutritionalData.protein || null,
        nutritionalData.fat || null,
        nutritionalData.carbs || null,
        nutritionalData.fiber || null,
        behaviorData.appetiteRating || null,
        behaviorData.eatingSpeed || null,
        behaviorData.finishedMeal !== false,
        behaviorData.leftoverAmount || null,
        digestiveData.stoolQuality || null,
        digestiveData.stoolFrequency || null,
        JSON.stringify(digestiveData.response || {}),
        behaviorData.activityLevelBefore || null,
        behaviorData.activityLevelAfter || null,
        notes
      ]
    );

    const feedingLogId = result.meta.last_row_id;

    // Calculate and store daily nutritional summary
    await updateDailyNutritionalSummary(env, dogId, feedDate);

    return createCorsResponse({
      success: true,
      data: {
        feedingLogId,
        petName: dog.name,
        message: 'Feeding log recorded successfully'
      }
    });

  } catch (error) {
    console.error('Create feeding log error:', error);
    return createCorsResponse({
      error: 'Failed to record feeding log',
      code: 'FEEDING_LOG_ERROR'
    }, 500);
  }
});

/**
 * GET /api/feeding-logs/:dogId
 * Get feeding history for a specific pet
 */
feedingLogsRouter.get('/:dogId', async (request, env) => {
  try {
    const dogId = request.params.dogId;
    const auth = await requireDogOwnershipOrAdmin(request, env, dogId);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const offset = (page - 1) * limit;

    // Build query with optional date filtering
    let whereClause = 'WHERE dog_id = ?';
    let queryParams = [dogId];

    if (startDate) {
      whereClause += ' AND feed_date >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND feed_date <= ?';
      queryParams.push(endDate);
    }

    // Get feeding logs
    const feedingLogs = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT * FROM feeding_logs 
       ${whereClause}
       ORDER BY feed_date DESC, feed_time DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get total count for pagination
    const totalCount = await DatabaseUtils.executeQueryFirst(
      env.DB,
      `SELECT COUNT(*) as count FROM feeding_logs ${whereClause}`,
      queryParams
    );

    // Get nutritional summary for the period
    const nutritionSummary = await DatabaseUtils.executeQueryFirst(
      env.DB,
      `SELECT 
        COUNT(*) as total_meals,
        AVG(calories_estimated) as avg_calories_per_meal,
        SUM(calories_estimated) as total_calories,
        AVG(appetite_rating) as avg_appetite_rating,
        AVG(stool_quality) as avg_stool_quality,
        COUNT(CASE WHEN JSON_EXTRACT(digestive_response, '$') LIKE '%vomiting%' THEN 1 END) as vomiting_incidents,
        COUNT(CASE WHEN JSON_EXTRACT(digestive_response, '$') LIKE '%diarrhea%' THEN 1 END) as diarrhea_incidents
       FROM feeding_logs ${whereClause}`,
      queryParams
    );

    return createCorsResponse({
      success: true,
      data: {
        pet_name: auth.dog.name,
        admin_access: auth.user.has_admin_access || false,
        feeding_logs: feedingLogs.map(log => ({
          id: log.id,
          date: log.feed_date,
          time: log.feed_time,
          meal_type: log.meal_type,
          food: {
            brand: log.food_brand,
            product: log.food_product,
            type: log.food_type
          },
          quantity: {
            cups: log.quantity_cups,
            grams: log.quantity_grams
          },
          nutrition: {
            calories: log.calories_estimated,
            protein_grams: log.protein_grams,
            fat_grams: log.fat_grams,
            carbs_grams: log.carbs_grams,
            fiber_grams: log.fiber_grams
          },
          behavior: {
            appetite_rating: log.appetite_rating,
            eating_speed: log.eating_speed,
            finished_meal: log.finished_meal,
            leftover_amount: log.leftover_amount,
            activity_before: log.activity_level_before,
            activity_after: log.activity_level_after
          },
          digestive: {
            stool_quality: log.stool_quality,
            stool_frequency: log.stool_frequency,
            response: JSON.parse(log.digestive_response || '{}')
          },
          notes: log.notes,
          logged_at: log.created_at
        })),
        nutrition_summary: nutritionSummary,
        pagination: {
          page,
          limit,
          total: totalCount.count,
          total_pages: Math.ceil(totalCount.count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get feeding logs error:', error);
    return createCorsResponse({
      error: 'Failed to retrieve feeding logs',
      code: 'FEEDING_LOGS_ERROR'
    }, 500);
  }
});

/**
 * GET /api/feeding-logs/:dogId/analytics
 * Get feeding pattern analytics and insights for veterinary use
 */
feedingLogsRouter.get('/:dogId/analytics', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const dogId = request.params.dogId;
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days')) || 30;

    // Verify dog ownership
    const dog = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT id, name, weight_lbs, birth_date FROM dogs WHERE id = ? AND owner_id = ? AND is_active = TRUE',
      [dogId, auth.user.id]
    );

    if (!dog) {
      return createCorsResponse({
        error: 'Pet not found or access denied',
        code: 'PET_NOT_FOUND'
      }, 404);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    // Get daily feeding summaries
    const dailySummaries = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT 
        feed_date,
        COUNT(*) as meals_count,
        SUM(calories_estimated) as total_calories,
        AVG(appetite_rating) as avg_appetite,
        AVG(stool_quality) as avg_stool_quality,
        COUNT(CASE WHEN finished_meal = 0 THEN 1 END) as unfinished_meals,
        GROUP_CONCAT(DISTINCT food_brand || ' ' || food_product) as foods_eaten
       FROM feeding_logs 
       WHERE dog_id = ? AND feed_date >= ?
       GROUP BY feed_date
       ORDER BY feed_date DESC`,
      [dogId, cutoffDateStr]
    );

    // Get food variety analysis
    const foodVariety = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT 
        food_brand, food_product, food_type,
        COUNT(*) as frequency,
        AVG(appetite_rating) as avg_appetite_for_food,
        SUM(calories_estimated) as total_calories_from_food
       FROM feeding_logs 
       WHERE dog_id = ? AND feed_date >= ?
       GROUP BY food_brand, food_product, food_type
       ORDER BY frequency DESC`,
      [dogId, cutoffDateStr]
    );

    // Get digestive health patterns
    const digestivePatterns = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT 
        feed_date,
        AVG(stool_quality) as daily_stool_quality,
        AVG(stool_frequency) as daily_stool_frequency,
        COUNT(CASE WHEN JSON_EXTRACT(digestive_response, '$') LIKE '%vomiting%' THEN 1 END) as vomiting_count,
        COUNT(CASE WHEN JSON_EXTRACT(digestive_response, '$') LIKE '%diarrhea%' THEN 1 END) as diarrhea_count,
        COUNT(CASE WHEN JSON_EXTRACT(digestive_response, '$') LIKE '%normal%' THEN 1 END) as normal_count
       FROM feeding_logs 
       WHERE dog_id = ? AND feed_date >= ?
       GROUP BY feed_date
       ORDER BY feed_date DESC`,
      [dogId, cutoffDateStr]
    );

    // Calculate weight correlation if available
    const weightData = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT 
        dhl.log_date,
        dhl.weight_lbs,
        dhl.body_condition_score,
        fl_summary.total_calories
       FROM dog_health_logs dhl
       LEFT JOIN (
         SELECT feed_date, SUM(calories_estimated) as total_calories
         FROM feeding_logs 
         WHERE dog_id = ? AND feed_date >= ?
         GROUP BY feed_date
       ) fl_summary ON dhl.log_date = fl_summary.feed_date
       WHERE dhl.dog_id = ? AND dhl.log_date >= ?
       ORDER BY dhl.log_date DESC`,
      [dogId, cutoffDateStr, dogId, cutoffDateStr]
    );

    // Generate insights and recommendations
    const insights = generateFeedingInsights(dailySummaries, foodVariety, digestivePatterns, weightData, dog);

    return createCorsResponse({
      success: true,
      data: {
        pet_info: {
          name: dog.name,
          current_weight: dog.weight_lbs,
          age_months: calculateAgeInMonths(dog.birth_date)
        },
        analysis_period: {
          days: days,
          start_date: cutoffDateStr,
          end_date: new Date().toISOString().split('T')[0]
        },
        daily_summaries: dailySummaries,
        food_variety: foodVariety,
        digestive_patterns: digestivePatterns,
        weight_correlation: weightData,
        insights: insights,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get feeding analytics error:', error);
    return createCorsResponse({
      error: 'Failed to generate feeding analytics',
      code: 'ANALYTICS_ERROR'
    }, 500);
  }
});

/**
 * PUT /api/feeding-logs/:id
 * Update a feeding log entry
 */
feedingLogsRouter.put('/:id', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const feedingLogId = request.params.id;
    const body = await request.json();
    const sanitizedBody = ValidationUtils.sanitizeJson(body);

    // Verify ownership
    const existingLog = await DatabaseUtils.executeQueryFirst(
      env.DB,
      `SELECT fl.*, d.owner_id 
       FROM feeding_logs fl
       JOIN dogs d ON fl.dog_id = d.id
       WHERE fl.id = ?`,
      [feedingLogId]
    );

    if (!existingLog || existingLog.owner_id !== auth.user.id) {
      return createCorsResponse({
        error: 'Feeding log not found or access denied',
        code: 'LOG_NOT_FOUND'
      }, 404);
    }

    // Update the log
    const updateFields = [];
    const updateValues = [];

    // Helper to add update fields
    const addUpdateField = (field, dbColumn, value) => {
      if (value !== undefined) {
        updateFields.push(`${dbColumn} = ?`);
        updateValues.push(value);
      }
    };

    addUpdateField('mealType', 'meal_type', sanitizedBody.mealType);
    addUpdateField('foodBrand', 'food_brand', sanitizedBody.foodBrand);
    addUpdateField('foodProduct', 'food_product', sanitizedBody.foodProduct);
    addUpdateField('quantityCups', 'quantity_cups', sanitizedBody.quantityCups);
    addUpdateField('quantityGrams', 'quantity_grams', sanitizedBody.quantityGrams);
    addUpdateField('caloriesEstimated', 'calories_estimated', sanitizedBody.caloriesEstimated);
    addUpdateField('notes', 'notes', sanitizedBody.notes);

    if (sanitizedBody.nutritionalData) {
      addUpdateField('protein', 'protein_grams', sanitizedBody.nutritionalData.protein);
      addUpdateField('fat', 'fat_grams', sanitizedBody.nutritionalData.fat);
      addUpdateField('carbs', 'carbs_grams', sanitizedBody.nutritionalData.carbs);
      addUpdateField('fiber', 'fiber_grams', sanitizedBody.nutritionalData.fiber);
    }

    if (sanitizedBody.behaviorData) {
      addUpdateField('appetiteRating', 'appetite_rating', sanitizedBody.behaviorData.appetiteRating);
      addUpdateField('eatingSpeed', 'eating_speed', sanitizedBody.behaviorData.eatingSpeed);
      addUpdateField('finishedMeal', 'finished_meal', sanitizedBody.behaviorData.finishedMeal);
    }

    if (sanitizedBody.digestiveData) {
      addUpdateField('stoolQuality', 'stool_quality', sanitizedBody.digestiveData.stoolQuality);
      addUpdateField('stoolFrequency', 'stool_frequency', sanitizedBody.digestiveData.stoolFrequency);
    }

    if (updateFields.length === 0) {
      return createCorsResponse({
        error: 'No fields to update',
        code: 'NO_UPDATE_FIELDS'
      }, 400);
    }

    updateValues.push(feedingLogId);

    await DatabaseUtils.executeUpdate(
      env.DB,
      `UPDATE feeding_logs SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    return createCorsResponse({
      success: true,
      message: 'Feeding log updated successfully'
    });

  } catch (error) {
    console.error('Update feeding log error:', error);
    return createCorsResponse({
      error: 'Failed to update feeding log',
      code: 'UPDATE_ERROR'
    }, 500);
  }
});

/**
 * DELETE /api/feeding-logs/:id
 * Delete a feeding log entry
 */
feedingLogsRouter.delete('/:id', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const feedingLogId = request.params.id;

    // Verify ownership
    const existingLog = await DatabaseUtils.executeQueryFirst(
      env.DB,
      `SELECT fl.*, d.owner_id 
       FROM feeding_logs fl
       JOIN dogs d ON fl.dog_id = d.id
       WHERE fl.id = ?`,
      [feedingLogId]
    );

    if (!existingLog || existingLog.owner_id !== auth.user.id) {
      return createCorsResponse({
        error: 'Feeding log not found or access denied',
        code: 'LOG_NOT_FOUND'
      }, 404);
    }

    await DatabaseUtils.executeUpdate(
      env.DB,
      'DELETE FROM feeding_logs WHERE id = ?',
      [feedingLogId]
    );

    return createCorsResponse({
      success: true,
      message: 'Feeding log deleted successfully'
    });

  } catch (error) {
    console.error('Delete feeding log error:', error);
    return createCorsResponse({
      error: 'Failed to delete feeding log',
      code: 'DELETE_ERROR'
    }, 500);
  }
});

// Helper functions

async function updateDailyNutritionalSummary(env, dogId, feedDate) {
  // This could maintain a separate table for daily nutritional summaries
  // For now, we'll skip this implementation but the structure is in place
  return;
}

function generateFeedingInsights(dailySummaries, foodVariety, digestivePatterns, weightData, dog) {
  const insights = [];

  // Analyze feeding consistency
  if (dailySummaries.length > 0) {
    const avgMealsPerDay = dailySummaries.reduce((sum, day) => sum + day.meals_count, 0) / dailySummaries.length;
    const avgCaloriesPerDay = dailySummaries.reduce((sum, day) => sum + (day.total_calories || 0), 0) / dailySummaries.length;

    insights.push({
      type: 'feeding_pattern',
      title: 'Feeding Consistency',
      description: `Average ${avgMealsPerDay.toFixed(1)} meals per day with ${avgCaloriesPerDay.toFixed(0)} calories`,
      severity: avgMealsPerDay < 1.5 ? 'warning' : 'normal'
    });
  }

  // Analyze food variety
  if (foodVariety.length <= 2) {
    insights.push({
      type: 'nutrition',
      title: 'Limited Food Variety',
      description: 'Consider introducing more variety to prevent food sensitivities and ensure balanced nutrition',
      severity: 'info'
    });
  }

  // Analyze digestive health
  const recentDigestiveIssues = digestivePatterns.filter(day => 
    day.vomiting_count > 0 || day.diarrhea_count > 0
  ).length;

  if (recentDigestiveIssues > 0) {
    insights.push({
      type: 'health',
      title: 'Digestive Concerns',
      description: `${recentDigestiveIssues} days with digestive issues in the analysis period`,
      severity: recentDigestiveIssues > 3 ? 'warning' : 'info'
    });
  }

  // Weight correlation insights
  if (weightData.length >= 2) {
    const weightTrend = weightData[0].weight_lbs - weightData[weightData.length - 1].weight_lbs;
    if (Math.abs(weightTrend) > 1) {
      insights.push({
        type: 'weight',
        title: 'Weight Change Detected',
        description: `Weight ${weightTrend > 0 ? 'increased' : 'decreased'} by ${Math.abs(weightTrend).toFixed(1)} lbs`,
        severity: Math.abs(weightTrend) > 2 ? 'warning' : 'info'
      });
    }
  }

  return insights;
}

function calculateAgeInMonths(birthDate) {
  if (!birthDate) return null;
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += today.getMonth();
  
  return months > 0 ? months : 0;
}

export { feedingLogsRouter };