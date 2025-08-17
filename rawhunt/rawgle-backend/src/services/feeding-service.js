/**
 * Feeding Service for Rawgle
 * Handles feeding logs, nutrition tracking, and analytics
 */

import { nanoid } from 'nanoid';

export class FeedingService {
  constructor(db, kv, r2 = null) {
    this.db = db;
    this.kv = kv;
    this.r2 = r2;
  }

  /**
   * Get feeding logs with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Feeding logs with pagination
   */
  async getFeedingLogs(filters = {}) {
    const {
      userId,
      petId,
      startDate,
      endDate,
      limit = 20,
      offset = 0,
      sort = 'feeding_date',
      order = 'desc'
    } = filters;
    
    let whereClause = 'WHERE user_id = ?';
    const bindings = [userId];
    
    if (petId) {
      whereClause += ' AND pet_id = ?';
      bindings.push(petId);
    }
    
    if (startDate) {
      whereClause += ' AND feeding_date >= ?';
      bindings.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND feeding_date <= ?';
      bindings.push(endDate);
    }
    
    const validSorts = ['feeding_date', 'created_at', 'calories_estimated', 'amount_grams'];
    const sortField = validSorts.includes(sort) ? sort : 'feeding_date';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    // Get logs
    const logs = await this.db
      .prepare(`
        SELECT fl.*, p.name as pet_name, p.species as pet_species
        FROM feeding_logs fl
        JOIN pets p ON fl.pet_id = p.id
        ${whereClause}
        ORDER BY ${sortField} ${sortOrder}
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, limit, offset)
      .all();
    
    // Get total count
    const countResult = await this.db
      .prepare(`
        SELECT COUNT(*) as total
        FROM feeding_logs fl
        JOIN pets p ON fl.pet_id = p.id
        ${whereClause}
      `)
      .bind(...bindings.slice(0, -2)) // Remove limit and offset
      .first();
    
    return {
      logs: (logs.results || []).map(log => ({
        ...log,
        photos: JSON.parse(log.photos || '[]'),
        tags: JSON.parse(log.tags || '[]')
      })),
      total: countResult?.total || 0
    };
  }

  /**
   * Create feeding log
   * @param {string} userId - User ID
   * @param {Object} logData - Feeding log data
   * @returns {Promise<Object>} Created feeding log
   */
  async createFeedingLog(userId, logData) {
    const logId = nanoid(21);
    const now = new Date().toISOString();
    
    // Convert feeding_date to proper format
    const feedingDate = new Date(logData.feeding_date);
    const feedingDateStr = feedingDate.toISOString().split('T')[0];
    const feedingTime = feedingDate.toTimeString().split(' ')[0];
    
    const feedingLog = {
      id: logId,
      pet_id: logData.pet_id,
      user_id: userId,
      feeding_date: feedingDateStr,
      feeding_time: feedingTime,
      meal_type: logData.meal_type || 'dinner',
      food_type: logData.food_type,
      protein_source: logData.protein_source || null,
      brand: logData.brand || null,
      product_name: logData.product_name || null,
      amount_oz: logData.amount_oz || null,
      amount_grams: logData.amount_grams || null,
      pieces_count: logData.pieces_count || null,
      calories_estimated: logData.calories_estimated || null,
      protein_grams: logData.protein_grams || null,
      fat_grams: logData.fat_grams || null,
      carb_grams: logData.carb_grams || null,
      fiber_grams: logData.fiber_grams || null,
      calcium_mg: logData.calcium_mg || null,
      phosphorus_mg: logData.phosphorus_mg || null,
      appetite_rating: logData.appetite_rating || null,
      eating_speed: logData.eating_speed || null,
      food_left_over: logData.food_left_over || false,
      digestion_notes: logData.digestion_notes || null,
      energy_level_after: logData.energy_level || null,
      stool_quality: logData.stool_quality || null,
      location: logData.location || null,
      weather: logData.weather || null,
      temperature_f: logData.temperature_f || null,
      feeding_method: logData.feeding_method || null,
      photos: JSON.stringify(logData.photos || []),
      videos: JSON.stringify([]),
      notes: logData.notes || null,
      shared_publicly: logData.shared_publicly || false,
      tags: JSON.stringify(logData.tags || []),
      created_at: now,
      updated_at: now
    };
    
    await this.db
      .prepare(`
        INSERT INTO feeding_logs (
          id, pet_id, user_id, feeding_date, feeding_time, meal_type,
          food_type, protein_source, brand, product_name, amount_oz, amount_grams,
          pieces_count, calories_estimated, protein_grams, fat_grams, carb_grams,
          fiber_grams, calcium_mg, phosphorus_mg, appetite_rating, eating_speed,
          food_left_over, digestion_notes, energy_level_after, stool_quality,
          location, weather, temperature_f, feeding_method, photos, videos,
          notes, shared_publicly, tags, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        feedingLog.id, feedingLog.pet_id, feedingLog.user_id, feedingLog.feeding_date,
        feedingLog.feeding_time, feedingLog.meal_type, feedingLog.food_type,
        feedingLog.protein_source, feedingLog.brand, feedingLog.product_name,
        feedingLog.amount_oz, feedingLog.amount_grams, feedingLog.pieces_count,
        feedingLog.calories_estimated, feedingLog.protein_grams, feedingLog.fat_grams,
        feedingLog.carb_grams, feedingLog.fiber_grams, feedingLog.calcium_mg,
        feedingLog.phosphorus_mg, feedingLog.appetite_rating, feedingLog.eating_speed,
        feedingLog.food_left_over, feedingLog.digestion_notes, feedingLog.energy_level_after,
        feedingLog.stool_quality, feedingLog.location, feedingLog.weather,
        feedingLog.temperature_f, feedingLog.feeding_method, feedingLog.photos,
        feedingLog.videos, feedingLog.notes, feedingLog.shared_publicly,
        feedingLog.tags, feedingLog.created_at, feedingLog.updated_at
      )
      .run();
    
    return {
      ...feedingLog,
      photos: JSON.parse(feedingLog.photos),
      tags: JSON.parse(feedingLog.tags)
    };
  }

  /**
   * Get specific feeding log
   * @param {string} logId - Feeding log ID
   * @param {string} userId - User ID for ownership check
   * @returns {Promise<Object>} Feeding log
   */
  async getFeedingLog(logId, userId) {
    const log = await this.db
      .prepare(`
        SELECT fl.*, p.name as pet_name, p.species as pet_species
        FROM feeding_logs fl
        JOIN pets p ON fl.pet_id = p.id
        WHERE fl.id = ? AND fl.user_id = ?
      `)
      .bind(logId, userId)
      .first();
    
    if (!log) {
      throw new Error('Feeding log not found or access denied');
    }
    
    return {
      ...log,
      photos: JSON.parse(log.photos || '[]'),
      videos: JSON.parse(log.videos || '[]'),
      tags: JSON.parse(log.tags || '[]')
    };
  }

  /**
   * Update feeding log
   * @param {string} logId - Feeding log ID
   * @param {string} userId - User ID for ownership check
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated feeding log
   */
  async updateFeedingLog(logId, userId, updates) {
    // Verify ownership
    const existing = await this.db
      .prepare('SELECT user_id FROM feeding_logs WHERE id = ?')
      .bind(logId)
      .first();
    
    if (!existing || existing.user_id !== userId) {
      throw new Error('Feeding log not found or access denied');
    }
    
    const allowedFields = [
      'feeding_date', 'feeding_time', 'meal_type', 'food_type', 'protein_source',
      'brand', 'product_name', 'amount_oz', 'amount_grams', 'pieces_count',
      'calories_estimated', 'protein_grams', 'fat_grams', 'carb_grams',
      'fiber_grams', 'calcium_mg', 'phosphorus_mg', 'appetite_rating',
      'eating_speed', 'food_left_over', 'digestion_notes', 'energy_level_after',
      'stool_quality', 'location', 'weather', 'temperature_f', 'feeding_method',
      'notes', 'shared_publicly', 'tags'
    ];
    
    const validUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        validUpdates[key] = value;
      }
    }
    
    if (Object.keys(validUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Handle JSON fields
    if (validUpdates.tags) {
      validUpdates.tags = JSON.stringify(validUpdates.tags);
    }
    
    // Handle date/time updates
    if (validUpdates.feeding_date) {
      const feedingDate = new Date(validUpdates.feeding_date);
      validUpdates.feeding_date = feedingDate.toISOString().split('T')[0];
      if (!validUpdates.feeding_time) {
        validUpdates.feeding_time = feedingDate.toTimeString().split(' ')[0];
      }
    }
    
    // Build update query
    const updateFields = Object.keys(validUpdates).map(field => `${field} = ?`);
    updateFields.push('updated_at = ?');
    
    const updateValues = Object.values(validUpdates);
    updateValues.push(new Date().toISOString());
    updateValues.push(logId);
    
    await this.db
      .prepare(`UPDATE feeding_logs SET ${updateFields.join(', ')} WHERE id = ?`)
      .bind(...updateValues)
      .run();
    
    return await this.getFeedingLog(logId, userId);
  }

  /**
   * Delete feeding log
   * @param {string} logId - Feeding log ID
   * @param {string} userId - User ID for ownership check
   */
  async deleteFeedingLog(logId, userId) {
    // Verify ownership
    const existing = await this.db
      .prepare('SELECT user_id FROM feeding_logs WHERE id = ?')
      .bind(logId)
      .first();
    
    if (!existing || existing.user_id !== userId) {
      throw new Error('Feeding log not found or access denied');
    }
    
    await this.db
      .prepare('DELETE FROM feeding_logs WHERE id = ?')
      .bind(logId)
      .run();
  }

  /**
   * Get feeding analytics
   * @param {string} userId - User ID
   * @param {Object} params - Analytics parameters
   * @returns {Promise<Object>} Analytics data
   */
  async getFeedingAnalytics(userId, params = {}) {
    const {
      pet_id,
      start_date,
      end_date,
      period = 'month',
      metrics = ['nutrition']
    } = params;
    
    // Calculate date range
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date();
    
    if (!start_date) {
      const daysBack = period === 'week' ? 7 : period === 'month' ? 30 : 90;
      startDate.setDate(endDate.getDate() - daysBack);
    }
    
    let whereClause = 'WHERE user_id = ? AND feeding_date >= ? AND feeding_date <= ?';
    const bindings = [userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]];
    
    if (pet_id) {
      whereClause += ' AND pet_id = ?';
      bindings.push(pet_id);
    }
    
    const analytics = {
      period: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        period_type: period
      },
      summary: {}
    };
    
    // Get basic summary
    const summary = await this.db
      .prepare(`
        SELECT 
          COUNT(*) as total_logs,
          COUNT(DISTINCT pet_id) as pets_fed,
          AVG(CASE WHEN calories_estimated > 0 THEN calories_estimated END) as avg_calories,
          AVG(CASE WHEN appetite_rating > 0 THEN appetite_rating END) as avg_appetite,
          COUNT(DISTINCT food_type) as food_variety,
          COUNT(DISTINCT protein_source) as protein_variety
        FROM feeding_logs
        ${whereClause}
      `)
      .bind(...bindings)
      .first();
    
    analytics.summary = {
      total_feeding_logs: summary?.total_logs || 0,
      unique_pets: summary?.pets_fed || 0,
      average_calories_per_meal: Math.round(summary?.avg_calories || 0),
      average_appetite_rating: Math.round((summary?.avg_appetite || 0) * 10) / 10,
      food_type_variety: summary?.food_variety || 0,
      protein_source_variety: summary?.protein_variety || 0
    };
    
    // Get nutrition metrics if requested
    if (metrics.includes('nutrition')) {
      analytics.nutrition = await this.getNutritionMetrics(whereClause, bindings);
    }
    
    // Get appetite trends if requested
    if (metrics.includes('appetite')) {
      analytics.appetite = await this.getAppetiteMetrics(whereClause, bindings);
    }
    
    // Get energy trends if requested
    if (metrics.includes('energy')) {
      analytics.energy = await this.getEnergyMetrics(whereClause, bindings);
    }
    
    return analytics;
  }

  /**
   * Get nutrition summary for a pet
   * @param {string} petId - Pet ID
   * @param {string} period - Time period (week, month, quarter)
   * @returns {Promise<Object>} Nutrition summary
   */
  async getNutritionSummary(petId, period = 'week') {
    const daysBack = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const summary = await this.db
      .prepare(`
        SELECT 
          COUNT(*) as total_meals,
          SUM(CASE WHEN calories_estimated > 0 THEN calories_estimated ELSE 0 END) as total_calories,
          SUM(CASE WHEN protein_grams > 0 THEN protein_grams ELSE 0 END) as total_protein,
          SUM(CASE WHEN fat_grams > 0 THEN fat_grams ELSE 0 END) as total_fat,
          SUM(CASE WHEN amount_grams > 0 THEN amount_grams ELSE 0 END) as total_grams,
          AVG(CASE WHEN appetite_rating > 0 THEN appetite_rating END) as avg_appetite
        FROM feeding_logs
        WHERE pet_id = ? AND feeding_date >= ?
      `)
      .bind(petId, startDate.toISOString().split('T')[0])
      .first();
    
    const dailyAverages = {
      calories: Math.round((summary?.total_calories || 0) / daysBack),
      protein_grams: Math.round((summary?.total_protein || 0) / daysBack),
      fat_grams: Math.round((summary?.total_fat || 0) / daysBack),
      food_grams: Math.round((summary?.total_grams || 0) / daysBack),
      meals: Math.round(((summary?.total_meals || 0) / daysBack) * 10) / 10
    };
    
    return {
      period: period,
      days_analyzed: daysBack,
      total_meals: summary?.total_meals || 0,
      daily_averages: dailyAverages,
      average_appetite_rating: Math.round((summary?.avg_appetite || 0) * 10) / 10
    };
  }

  /**
   * Get feeding recommendations for a pet
   * @param {string} petId - Pet ID
   * @param {Object} petData - Pet data (weight, birth_date, etc.)
   * @returns {Promise<Object>} Feeding recommendations
   */
  async getFeedingRecommendations(petId, petData) {
    const { weight, birthDate } = petData;
    
    // Get recent feeding data
    const recentLogs = await this.db
      .prepare(`
        SELECT * FROM feeding_logs
        WHERE pet_id = ? AND feeding_date >= date('now', '-7 days')
        ORDER BY feeding_date DESC
      `)
      .bind(petId)
      .all();
    
    const logs = recentLogs.results || [];
    const recommendations = [];
    
    // Calculate basic metrics
    if (weight && weight > 0) {
      const targetCaloriesPerDay = Math.round(weight * 25); // Rough estimate: 25 calories per pound
      const avgCaloriesPerDay = logs.reduce((sum, log) => sum + (log.calories_estimated || 0), 0) / 7;
      
      if (avgCaloriesPerDay < targetCaloriesPerDay * 0.8) {
        recommendations.push({
          type: 'calories',
          priority: 'medium',
          message: `Consider increasing daily calories. Target: ${targetCaloriesPerDay}, Current avg: ${Math.round(avgCaloriesPerDay)}`
        });
      }
    }
    
    // Check feeding frequency
    const feedingDays = new Set(logs.map(log => log.feeding_date)).size;
    const avgMealsPerDay = logs.length / Math.max(feedingDays, 1);
    
    if (avgMealsPerDay < 1.5) {
      recommendations.push({
        type: 'frequency',
        priority: 'low',
        message: 'Consider feeding more frequently (2-3 meals per day is typical for raw feeding)'
      });
    }
    
    // Check protein variety
    const proteinSources = new Set(logs.map(log => log.protein_source).filter(Boolean));
    if (proteinSources.size < 3) {
      recommendations.push({
        type: 'variety',
        priority: 'medium',
        message: 'Try to include more protein variety (chicken, beef, fish, etc.) for balanced nutrition'
      });
    }
    
    // Check appetite trends
    const appetiteRatings = logs.filter(log => log.appetite_rating).map(log => log.appetite_rating);
    if (appetiteRatings.length > 0) {
      const avgAppetite = appetiteRatings.reduce((sum, rating) => sum + rating, 0) / appetiteRatings.length;
      
      if (avgAppetite < 3.5) {
        recommendations.push({
          type: 'appetite',
          priority: 'high',
          message: 'Low appetite observed. Consider consulting a vet or trying different proteins/preparation methods'
        });
      }
    }
    
    return {
      pet_id: petId,
      analysis_period: '7 days',
      total_logs_analyzed: logs.length,
      recommendations
    };
  }

  // Helper methods for analytics
  async getNutritionMetrics(whereClause, bindings) {
    const nutrition = await this.db
      .prepare(`
        SELECT 
          SUM(CASE WHEN calories_estimated > 0 THEN calories_estimated ELSE 0 END) as total_calories,
          AVG(CASE WHEN calories_estimated > 0 THEN calories_estimated ELSE NULL END) as avg_calories,
          SUM(CASE WHEN protein_grams > 0 THEN protein_grams ELSE 0 END) as total_protein,
          SUM(CASE WHEN fat_grams > 0 THEN fat_grams ELSE 0 END) as total_fat,
          COUNT(DISTINCT protein_source) as protein_sources
        FROM feeding_logs
        ${whereClause}
      `)
      .bind(...bindings)
      .first();
    
    return {
      total_calories: nutrition?.total_calories || 0,
      average_calories_per_meal: Math.round(nutrition?.avg_calories || 0),
      total_protein_grams: Math.round(nutrition?.total_protein || 0),
      total_fat_grams: Math.round(nutrition?.total_fat || 0),
      protein_source_variety: nutrition?.protein_sources || 0
    };
  }

  async getAppetiteMetrics(whereClause, bindings) {
    const appetite = await this.db
      .prepare(`
        SELECT 
          AVG(CASE WHEN appetite_rating > 0 THEN appetite_rating ELSE NULL END) as avg_appetite,
          COUNT(CASE WHEN appetite_rating >= 4 THEN 1 END) as good_appetite_count,
          COUNT(CASE WHEN appetite_rating <= 2 THEN 1 END) as poor_appetite_count,
          COUNT(CASE WHEN appetite_rating > 0 THEN 1 END) as total_rated
        FROM feeding_logs
        ${whereClause}
      `)
      .bind(...bindings)
      .first();
    
    const totalRated = appetite?.total_rated || 0;
    
    return {
      average_rating: Math.round((appetite?.avg_appetite || 0) * 10) / 10,
      good_appetite_percentage: totalRated > 0 ? Math.round((appetite?.good_appetite_count / totalRated) * 100) : 0,
      poor_appetite_percentage: totalRated > 0 ? Math.round((appetite?.poor_appetite_count / totalRated) * 100) : 0,
      total_ratings: totalRated
    };
  }

  async getEnergyMetrics(whereClause, bindings) {
    const energy = await this.db
      .prepare(`
        SELECT 
          AVG(CASE WHEN energy_level_after > 0 THEN energy_level_after ELSE NULL END) as avg_energy,
          COUNT(CASE WHEN energy_level_after >= 4 THEN 1 END) as high_energy_count,
          COUNT(CASE WHEN energy_level_after <= 2 THEN 1 END) as low_energy_count,
          COUNT(CASE WHEN energy_level_after > 0 THEN 1 END) as total_rated
        FROM feeding_logs
        ${whereClause}
      `)
      .bind(...bindings)
      .first();
    
    const totalRated = energy?.total_rated || 0;
    
    return {
      average_energy_level: Math.round((energy?.avg_energy || 0) * 10) / 10,
      high_energy_percentage: totalRated > 0 ? Math.round((energy?.high_energy_count / totalRated) * 100) : 0,
      low_energy_percentage: totalRated > 0 ? Math.round((energy?.low_energy_count / totalRated) * 100) : 0,
      total_ratings: totalRated
    };
  }
}