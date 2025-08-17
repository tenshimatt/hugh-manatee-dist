import { sanitizeInput } from '../lib/validation.js';
import { corsHeaders } from '../lib/cors.js';
import { v4 as uuidv4 } from 'uuid';

// Constants
const VALID_MEAL_TIMES = ['breakfast', 'lunch', 'dinner', 'snack', 'treat', 'medication'];
const VALID_FOOD_TYPES = ['dry_food', 'wet_food', 'raw_food', 'home_cooked', 'treats', 'supplements', 'medication'];
const FEEDING_STREAK_REWARDS = {
  7: { amount: 10, description: '7-day feeding streak' },
  14: { amount: 25, description: '14-day feeding streak' },
  30: { amount: 50, description: '30-day feeding streak' },
  90: { amount: 100, description: '90-day feeding streak' }
};

// Authentication helper
async function authenticateUser(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' };
  }
  
  const token = authHeader.substring(7);
  const sessionData = await env.SESSIONS.get(token);
  
  if (!sessionData) {
    return { valid: false, error: 'Invalid or expired session' };
  }
  
  const session = JSON.parse(sessionData);
  
  // Check if session is expired
  if (new Date() > new Date(session.expiresAt)) {
    await env.SESSIONS.delete(token);
    return { valid: false, error: 'Session expired' };
  }
  
  return { valid: true, userId: session.userId, email: session.email };
}

// Helper function to calculate feeding streaks
async function calculateFeedingStreak(petId, env) {
  try {
    // Get all feeding dates for this pet, ordered by date
    const feedingDates = await env.DB.prepare(`
      SELECT DISTINCT date(log_date) as feeding_date
      FROM feeding_logs 
      WHERE pet_id = ? 
      ORDER BY feeding_date DESC
    `).bind(petId).all();
    
    if (!feedingDates.results || feedingDates.results.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }
    
    const dates = feedingDates.results.map(row => new Date(row.feeding_date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let longestStreak = 0;
    let currentStreakLength = 0;
    
    // Check for current streak
    for (let i = 0; i < dates.length; i++) {
      const feedingDate = dates[i];
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (feedingDate.getTime() === expectedDate.getTime()) {
        currentStreakLength++;
      } else {
        break;
      }
    }
    
    currentStreak = currentStreakLength;
    
    // Calculate longest streak
    let tempStreak = 1;
    longestStreak = 1;
    
    for (let i = 1; i < dates.length; i++) {
      const currentDate = dates[i];
      const previousDate = dates[i - 1];
      const dayDifference = (previousDate - currentDate) / (1000 * 60 * 60 * 24);
      
      if (dayDifference === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { currentStreak, longestStreak };
    
  } catch (error) {
    console.error('Calculate feeding streak error:', error);
    return { currentStreak: 0, longestStreak: 0 };
  }
}

// Create feeding log entry
async function createFeedingLog(request, env) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { petId, logDate, mealTime, foodType, quantity, notes } = body;
    
    if (!petId || !logDate) {
      return new Response(JSON.stringify({ error: 'petId and logDate are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verify pet ownership
    const pet = await env.DB.prepare(
      'SELECT * FROM pet_profiles WHERE id = ? AND user_id = ?'
    ).bind(petId, auth.userId).first();
    
    if (!pet) {
      return new Response(JSON.stringify({ error: 'Pet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate and sanitize inputs
    const sanitizedMealTime = mealTime && VALID_MEAL_TIMES.includes(mealTime) ? mealTime : null;
    const sanitizedFoodType = foodType && VALID_FOOD_TYPES.includes(foodType) ? foodType : null;
    const sanitizedQuantity = quantity ? sanitizeInput(quantity.toString()) : null;
    const sanitizedNotes = notes ? sanitizeInput(notes) : null;
    
    // Validate date format
    const feedingDate = new Date(logDate);
    if (isNaN(feedingDate.getTime())) {
      return new Response(JSON.stringify({ error: 'Invalid date format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if feeding log already exists for this pet and date/time combination
    const feedingDateTime = logDate + ' ' + sanitizedMealTime;
    const existingLog = await env.DB.prepare(`
      SELECT id FROM feeding_logs 
      WHERE pet_id = ? AND feeding_time = ?
    `).bind(petId, feedingDateTime).first();
    
    if (existingLog) {
      return new Response(JSON.stringify({ error: 'Feeding log already exists for this pet, date, and meal time' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const logId = uuidv4();
    
    // Create feeding log
    await env.DB.prepare(`
      INSERT INTO feeding_logs (id, pet_id, user_id, log_date, meal_time, food_type, quantity, amount, feeding_time, notes, paws_earned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      logId,
      petId,
      auth.userId,
      logDate,
      sanitizedMealTime,
      sanitizedFoodType,
      sanitizedQuantity,
      parseFloat(sanitizedQuantity) || 0,
      logDate + ' ' + sanitizedMealTime,
      sanitizedNotes,
      1
    ).run();
    
    // Get created log with pet info
    const createdLog = await env.DB.prepare(`
      SELECT f.*, p.name as pet_name 
      FROM feeding_logs f
      JOIN pet_profiles p ON f.pet_id = p.id
      WHERE f.id = ?
    `).bind(logId).first();
    
    // Calculate updated feeding streak
    const streakData = await calculateFeedingStreak(petId, env);
    
    // Check for streak rewards
    const previousStreak = streakData.currentStreak - 1;
    let rewardAwarded = false;
    let rewardAmount = 0;
    
    for (const [streakDays, reward] of Object.entries(FEEDING_STREAK_REWARDS)) {
      const days = parseInt(streakDays);
      if (streakData.currentStreak >= days && previousStreak < days) {
        // Award streak reward (queue disabled for free tier)
        // await env.RAWGLE_QUEUE.send({
        //   type: 'award_paws',
        //   data: {
        //     userId: auth.userId,
        //     amount: reward.amount,
        //     type: 'feeding_streak',
        //     description: reward.description
        //   }
        // });
        console.log(`Streak reward earned: ${reward.amount} PAWS for ${auth.userId}`);
        rewardAwarded = true;
        rewardAmount = reward.amount;
        break;
      }
    }
    
    // Award daily feeding PAWS (queue disabled for free tier)
    // await env.RAWGLE_QUEUE.send({
    //   type: 'award_paws',
    //   data: {
    //     userId: auth.userId,
    //     amount: 1,
    //     type: 'daily_feeding',
    //     description: `Feeding log for ${pet.name}`
    //   }
    // });
    console.log(`Daily feeding reward: 1 PAWS for ${auth.userId}`);
    
    const response = {
      log: createdLog,
      streakData,
      dailyReward: 1,
      message: 'Feeding log created successfully'
    };
    
    if (rewardAwarded) {
      response.streakReward = {
        awarded: true,
        amount: rewardAmount,
        streak: streakData.currentStreak
      };
    }
    
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Create feeding log error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get feeding logs for a pet
async function getPetFeedingLogs(request, env) {
  try {
    const url = new URL(request.url);
    const petId = url.pathname.split('/')[3]; // /api/feeding/{petId}
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const mealTime = url.searchParams.get('mealTime');
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verify pet ownership
    const pet = await env.DB.prepare(
      'SELECT * FROM pet_profiles WHERE id = ? AND user_id = ?'
    ).bind(petId, auth.userId).first();
    
    if (!pet) {
      return new Response(JSON.stringify({ error: 'Pet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Build query with filters
    let query = 'SELECT * FROM feeding_logs WHERE pet_id = ?';
    let bindings = [petId];
    
    if (startDate) {
      query += ' AND log_date >= ?';
      bindings.push(startDate);
    }
    
    if (endDate) {
      query += ' AND log_date <= ?';
      bindings.push(endDate);
    }
    
    if (mealTime && VALID_MEAL_TIMES.includes(mealTime)) {
      query += ' AND meal_time = ?';
      bindings.push(mealTime);
    }
    
    query += ' ORDER BY log_date DESC, created_at DESC LIMIT ? OFFSET ?';
    bindings.push(limit, offset);
    
    const logs = await env.DB.prepare(query).bind(...bindings).all();
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM feeding_logs WHERE pet_id = ?';
    let countBindings = [petId];
    
    if (startDate) {
      countQuery += ' AND log_date >= ?';
      countBindings.push(startDate);
    }
    
    if (endDate) {
      countQuery += ' AND log_date <= ?';
      countBindings.push(endDate);
    }
    
    if (mealTime && VALID_MEAL_TIMES.includes(mealTime)) {
      countQuery += ' AND meal_time = ?';
      countBindings.push(mealTime);
    }
    
    const countResult = await env.DB.prepare(countQuery).bind(...countBindings).first();
    const totalCount = countResult.total;
    
    // Calculate feeding statistics
    const stats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT log_date) as unique_days,
        COUNT(CASE WHEN meal_time = 'breakfast' THEN 1 END) as breakfast_count,
        COUNT(CASE WHEN meal_time = 'lunch' THEN 1 END) as lunch_count,
        COUNT(CASE WHEN meal_time = 'dinner' THEN 1 END) as dinner_count,
        COUNT(CASE WHEN meal_time = 'snack' THEN 1 END) as snack_count
      FROM feeding_logs 
      WHERE pet_id = ?
    `).bind(petId).first();
    
    // Calculate feeding streak
    const streakData = await calculateFeedingStreak(petId, env);
    
    return new Response(JSON.stringify({
      logs: logs.results || [],
      pet: {
        id: pet.id,
        name: pet.name
      },
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: (offset + limit) < totalCount
      },
      statistics: {
        totalLogs: stats.total_logs || 0,
        uniqueDays: stats.unique_days || 0,
        breakfastCount: stats.breakfast_count || 0,
        lunchCount: stats.lunch_count || 0,
        dinnerCount: stats.dinner_count || 0,
        snackCount: stats.snack_count || 0,
        consistency: stats.unique_days > 0 ? Math.round((stats.unique_days / 30) * 100) : 0
      },
      streakData,
      filters: {
        startDate,
        endDate,
        mealTime
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get pet feeding logs error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Update feeding log
async function updateFeedingLog(request, env) {
  try {
    const url = new URL(request.url);
    const logId = url.pathname.split('/').pop();
    
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verify log ownership
    const existingLog = await env.DB.prepare(`
      SELECT f.*, p.user_id 
      FROM feeding_logs f
      JOIN pet_profiles p ON f.pet_id = p.id
      WHERE f.id = ? AND p.user_id = ?
    `).bind(logId, auth.userId).first();
    
    if (!existingLog) {
      return new Response(JSON.stringify({ error: 'Feeding log not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { mealTime, foodType, quantity, notes } = body;
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (mealTime !== undefined) {
      const sanitizedMealTime = mealTime && VALID_MEAL_TIMES.includes(mealTime) ? mealTime : null;
      updateFields.push('meal_time = ?');
      updateValues.push(sanitizedMealTime);
    }
    
    if (foodType !== undefined) {
      const sanitizedFoodType = foodType && VALID_FOOD_TYPES.includes(foodType) ? foodType : null;
      updateFields.push('food_type = ?');
      updateValues.push(sanitizedFoodType);
    }
    
    if (quantity !== undefined) {
      updateFields.push('quantity = ?');
      updateValues.push(quantity ? sanitizeInput(quantity.toString()) : null);
    }
    
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes ? sanitizeInput(notes) : null);
    }
    
    if (updateFields.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    updateValues.push(logId);
    
    const updateQuery = `
      UPDATE feeding_logs 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;
    
    await env.DB.prepare(updateQuery).bind(...updateValues).run();
    
    // Get updated log with pet info
    const updatedLog = await env.DB.prepare(`
      SELECT f.*, p.name as pet_name 
      FROM feeding_logs f
      JOIN pet_profiles p ON f.pet_id = p.id
      WHERE f.id = ?
    `).bind(logId).first();
    
    return new Response(JSON.stringify({
      log: updatedLog,
      message: 'Feeding log updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Update feeding log error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Delete feeding log
async function deleteFeedingLog(request, env) {
  try {
    const url = new URL(request.url);
    const logId = url.pathname.split('/').pop();
    
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verify log ownership
    const existingLog = await env.DB.prepare(`
      SELECT f.*, p.user_id, p.name as pet_name 
      FROM feeding_logs f
      JOIN pet_profiles p ON f.pet_id = p.id
      WHERE f.id = ? AND p.user_id = ?
    `).bind(logId, auth.userId).first();
    
    if (!existingLog) {
      return new Response(JSON.stringify({ error: 'Feeding log not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Delete the feeding log
    await env.DB.prepare('DELETE FROM feeding_logs WHERE id = ?').bind(logId).run();
    
    return new Response(JSON.stringify({
      message: `Feeding log for ${existingLog.pet_name} on ${existingLog.log_date} has been deleted`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Delete feeding log error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get user's feeding overview (all pets)
async function getUserFeedingOverview(request, env) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '30d';
    
    // Calculate date range
    let dateFilter = "date(f.log_date) >= date('now', '-30 days')";
    switch (timeframe) {
      case '7d':
        dateFilter = "date(f.log_date) >= date('now', '-7 days')";
        break;
      case '90d':
        dateFilter = "date(f.log_date) >= date('now', '-90 days')";
        break;
      case '1y':
        dateFilter = "date(f.log_date) >= date('now', '-1 year')";
        break;
    }
    
    // Get feeding statistics per pet
    const petStats = await env.DB.prepare(`
      SELECT 
        p.id as pet_id,
        p.name as pet_name,
        COUNT(f.id) as total_logs,
        COUNT(DISTINCT date(f.log_date)) as unique_days,
        COUNT(CASE WHEN f.meal_time = 'breakfast' THEN 1 END) as breakfast_count,
        COUNT(CASE WHEN f.meal_time = 'dinner' THEN 1 END) as dinner_count,
        MAX(date(f.log_date)) as last_fed_date
      FROM pet_profiles p
      LEFT JOIN feeding_logs f ON p.id = f.pet_id AND ${dateFilter}
      WHERE p.user_id = ?
      GROUP BY p.id, p.name
      ORDER BY p.name
    `).bind(auth.userId).all();
    
    // Get overall statistics
    const overallStats = await env.DB.prepare(`
      SELECT 
        COUNT(f.id) as total_logs,
        COUNT(DISTINCT f.pet_id) as pets_with_logs,
        COUNT(DISTINCT date(f.log_date)) as unique_feeding_days,
        AVG(daily_counts.daily_count) as avg_logs_per_day
      FROM feeding_logs f
      JOIN pet_profiles p ON f.pet_id = p.id
      LEFT JOIN (
        SELECT date(log_date) as feeding_date, COUNT(*) as daily_count
        FROM feeding_logs f2
        JOIN pet_profiles p2 ON f2.pet_id = p2.id
        WHERE p2.user_id = ? AND ${dateFilter.replace('f.log_date', 'f2.log_date')}
        GROUP BY date(f2.log_date)
      ) daily_counts ON date(f.log_date) = daily_counts.feeding_date
      WHERE p.user_id = ? AND ${dateFilter}
    `).bind(auth.userId, auth.userId).all();
    
    // Get recent activity
    const recentActivity = await env.DB.prepare(`
      SELECT 
        f.log_date,
        f.meal_time,
        f.food_type,
        p.name as pet_name,
        f.created_at
      FROM feeding_logs f
      JOIN pet_profiles p ON f.pet_id = p.id
      WHERE p.user_id = ?
      ORDER BY f.log_date DESC, f.created_at DESC
      LIMIT 10
    `).bind(auth.userId).all();
    
    // Calculate streaks for each pet
    const petsWithStreaks = [];
    for (const pet of petStats.results) {
      const streakData = await calculateFeedingStreak(pet.pet_id, env);
      petsWithStreaks.push({
        ...pet,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak
      });
    }
    
    // Get feeding trend data (last 30 days)
    const trendData = await env.DB.prepare(`
      SELECT 
        date(f.log_date) as feeding_date,
        COUNT(*) as log_count
      FROM feeding_logs f
      JOIN pet_profiles p ON f.pet_id = p.id
      WHERE p.user_id = ? AND date(f.log_date) >= date('now', '-30 days')
      GROUP BY date(f.log_date)
      ORDER BY feeding_date DESC
    `).bind(auth.userId).all();
    
    const stats = overallStats.results[0] || {};
    
    return new Response(JSON.stringify({
      timeframe,
      overview: {
        totalLogs: stats.total_logs || 0,
        petsWithLogs: stats.pets_with_logs || 0,
        uniqueFeedingDays: stats.unique_feeding_days || 0,
        avgLogsPerDay: Math.round((stats.avg_logs_per_day || 0) * 10) / 10,
        consistency: stats.unique_feeding_days > 0 ? 
          Math.round((stats.unique_feeding_days / 30) * 100) : 0
      },
      pets: petsWithStreaks,
      recentActivity: recentActivity.results || [],
      trendData: trendData.results || [],
      validMealTimes: VALID_MEAL_TIMES,
      validFoodTypes: VALID_FOOD_TYPES
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get user feeding overview error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Main handler
export default async function handleFeeding(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    let response;
    
    // POST /api/feeding - Create feeding log
    if (path === '/api/feeding' && method === 'POST') {
      response = await createFeedingLog(request, env);
    }
    // GET /api/feeding/overview - Get user's feeding overview
    else if (path === '/api/feeding/overview' && method === 'GET') {
      response = await getUserFeedingOverview(request, env);
    }
    // GET /api/feeding/{petId} - Get feeding logs for a specific pet
    else if (path.match(/^\/api\/feeding\/[a-f0-9-]+$/) && method === 'GET') {
      response = await getPetFeedingLogs(request, env);
    }
    // PUT /api/feeding/logs/{logId} - Update feeding log
    else if (path.match(/^\/api\/feeding\/logs\/[a-f0-9-]+$/) && method === 'PUT') {
      response = await updateFeedingLog(request, env);
    }
    // DELETE /api/feeding/logs/{logId} - Delete feeding log
    else if (path.match(/^\/api\/feeding\/logs\/[a-f0-9-]+$/) && method === 'DELETE') {
      response = await deleteFeedingLog(request, env);
    }
    else {
      response = new Response(JSON.stringify({
        error: 'Not found',
        availableEndpoints: [
          'POST /api/feeding - Create feeding log',
          'GET /api/feeding/overview?timeframe=7d|30d|90d|1y - Get feeding overview',
          'GET /api/feeding/{petId}?startDate=&endDate=&mealTime=&limit=50&offset=0 - Get pet feeding logs',
          'PUT /api/feeding/logs/{logId} - Update feeding log',
          'DELETE /api/feeding/logs/{logId} - Delete feeding log'
        ],
        validMealTimes: VALID_MEAL_TIMES,
        validFoodTypes: VALID_FOOD_TYPES
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
    
  } catch (error) {
    console.error('Feeding handler error:', error);
    const response = new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
