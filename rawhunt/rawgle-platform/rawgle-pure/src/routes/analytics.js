import { corsHeaders } from '../lib/cors.js';
import { v4 as uuidv4 } from 'uuid';

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

// Check admin privileges
async function checkAdminAccess(request, env) {
  const adminToken = request.headers.get('X-Admin-Token');
  return adminToken && adminToken === env.ADMIN_TOKEN;
}

// Track user behavior event
async function trackEvent(request, env) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { event, data, timestamp } = body;
    
    if (!event) {
      return new Response(JSON.stringify({ error: 'Event name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get user info for context
    const user = await env.DB.prepare('SELECT subscription_tier FROM users WHERE id = ?')
      .bind(auth.userId).first();
    
    // Get Cloudflare analytics
    const cfData = {
      country: request.headers.get('cf-ipcountry'),
      ip: request.headers.get('cf-connecting-ip'),
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer')
    };
    
    // Store event in analytics durable object
    const analyticsId = env.ANALYTICS_DO.idFromName('main');
    const analyticsObject = env.ANALYTICS_DO.get(analyticsId);
    
    await analyticsObject.fetch('https://fake-host/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: auth.userId,
        event,
        data: data || {},
        timestamp: timestamp || Date.now(),
        userTier: user?.subscription_tier || 'free',
        metadata: cfData
      })
    });
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Event tracking error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get user analytics dashboard
async function getUserAnalytics(request, env) {
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
    let dateFilter = "date(created_at) >= date('now', '-30 days')";
    switch (timeframe) {
      case '7d':
        dateFilter = "date(created_at) >= date('now', '-7 days')";
        break;
      case '90d':
        dateFilter = "date(created_at) >= date('now', '-90 days')";
        break;
      case '1y':
        dateFilter = "date(created_at) >= date('now', '-1 year')";
        break;
    }
    
    // Get pet statistics
    const petStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_pets,
        COUNT(CASE WHEN memorial_mode = 1 THEN 1 END) as memorial_pets,
        AVG(CASE WHEN profile_image_r2_key IS NOT NULL THEN 1 ELSE 0 END) * 100 as image_completion_rate
      FROM pet_profiles 
      WHERE user_id = ?
    `).bind(auth.userId).first();
    
    // Get feeding statistics
    const feedingStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT date(log_date)) as days_logged,
        COUNT(DISTINCT f.pet_id) as pets_with_logs
      FROM feeding_logs f
      JOIN pet_profiles p ON f.pet_id = p.id
      WHERE p.user_id = ? AND ${dateFilter.replace('created_at', 'f.created_at')}
    `).bind(auth.userId).first();
    
    // Get consultation statistics
    const consultationStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_consultations,
        COUNT(CASE WHEN emergency = 1 THEN 1 END) as emergency_consultations,
        AVG(confidence_score) as avg_confidence_score
      FROM ai_consultations c
      JOIN pet_profiles p ON c.pet_id = p.id
      WHERE p.user_id = ? AND ${dateFilter.replace('created_at', 'c.created_at')}
    `).bind(auth.userId).first();
    
    // Get PAWS statistics
    const pawsStats = await env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_earned,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_spent,
        COUNT(CASE WHEN transaction_type = 'reward' THEN 1 END) as reward_transactions,
        COUNT(CASE WHEN transaction_type = 'transfer_out' THEN 1 END) as transfers_sent
      FROM paws_transactions 
      WHERE user_id = ? AND status = 'completed' AND ${dateFilter}
    `).bind(auth.userId).first();
    
    // Get activity timeline (last 30 days)
    const activityTimeline = await env.DB.prepare(`
      SELECT 
        date(created_at) as activity_date,
        'feeding' as activity_type,
        COUNT(*) as count
      FROM feeding_logs f
      JOIN pet_profiles p ON f.pet_id = p.id
      WHERE p.user_id = ? AND date(f.created_at) >= date('now', '-30 days')
      GROUP BY date(f.created_at)
      
      UNION ALL
      
      SELECT 
        date(created_at) as activity_date,
        'consultation' as activity_type,
        COUNT(*) as count
      FROM ai_consultations c
      JOIN pet_profiles p ON c.pet_id = p.id
      WHERE p.user_id = ? AND date(c.created_at) >= date('now', '-30 days')
      GROUP BY date(c.created_at)
      
      ORDER BY activity_date DESC
    `).bind(auth.userId, auth.userId).all();
    
    return new Response(JSON.stringify({
      timeframe,
      pets: {
        total: petStats.total_pets || 0,
        memorial: petStats.memorial_pets || 0,
        imageCompletion: Math.round(petStats.image_completion_rate || 0)
      },
      feeding: {
        totalLogs: feedingStats.total_logs || 0,
        daysLogged: feedingStats.days_logged || 0,
        petsWithLogs: feedingStats.pets_with_logs || 0,
        consistency: feedingStats.days_logged ? Math.round((feedingStats.days_logged / 30) * 100) : 0
      },
      consultations: {
        total: consultationStats.total_consultations || 0,
        emergency: consultationStats.emergency_consultations || 0,
        avgConfidence: Math.round((consultationStats.avg_confidence_score || 0) * 100)
      },
      paws: {
        totalEarned: pawsStats.total_earned || 0,
        totalSpent: pawsStats.total_spent || 0,
        rewardCount: pawsStats.reward_transactions || 0,
        transfersSent: pawsStats.transfers_sent || 0
      },
      activityTimeline: activityTimeline.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('User analytics error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get system-wide metrics (admin only)
async function getSystemMetrics(request, env) {
  try {
    const isAdmin = await checkAdminAccess(request, env);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '30d';
    
    // Calculate date range
    let dateFilter = "date(created_at) >= date('now', '-30 days')";
    switch (timeframe) {
      case '7d':
        dateFilter = "date(created_at) >= date('now', '-7 days')";
        break;
      case '90d':
        dateFilter = "date(created_at) >= date('now', '-90 days')";
        break;
      case '1y':
        dateFilter = "date(created_at) >= date('now', '-1 year')";
        break;
    }
    
    // Get user metrics
    const userMetrics = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN ${dateFilter} THEN 1 END) as new_users,
        COUNT(CASE WHEN subscription_tier != 'free' THEN 1 END) as paid_users,
        COUNT(CASE WHEN wallet_address IS NOT NULL THEN 1 END) as wallet_connected_users
      FROM users
    `).first();
    
    // Get pet metrics
    const petMetrics = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_pets,
        COUNT(CASE WHEN ${dateFilter} THEN 1 END) as new_pets,
        COUNT(CASE WHEN memorial_mode = 1 THEN 1 END) as memorial_pets,
        COUNT(CASE WHEN profile_image_r2_key IS NOT NULL THEN 1 END) as pets_with_images
      FROM pet_profiles
    `).first();
    
    // Get feeding metrics
    const feedingMetrics = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_feeding_logs,
        COUNT(CASE WHEN ${dateFilter} THEN 1 END) as recent_feeding_logs,
        COUNT(DISTINCT pet_id) as pets_with_feeding_logs,
        COUNT(DISTINCT date(log_date)) as unique_feeding_days
      FROM feeding_logs
    `).first();
    
    // Get consultation metrics
    const consultationMetrics = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_consultations,
        COUNT(CASE WHEN ${dateFilter} THEN 1 END) as recent_consultations,
        COUNT(CASE WHEN emergency = 1 THEN 1 END) as emergency_consultations,
        AVG(confidence_score) as avg_confidence_score
      FROM ai_consultations
    `).first();
    
    // Get PAWS metrics
    const pawsMetrics = await env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN amount > 0 AND status = 'completed' THEN amount ELSE 0 END) as total_paws_distributed,
        COUNT(CASE WHEN transaction_type = 'reward' AND status = 'completed' THEN 1 END) as reward_transactions,
        COUNT(CASE WHEN transaction_type = 'transfer_in' AND status = 'completed' THEN 1 END) as transfer_transactions,
        COUNT(CASE WHEN ${dateFilter} THEN 1 END) as recent_transactions
      FROM paws_transactions
    `).first();
    
    // Get NFT metrics
    const nftMetrics = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_nft_mints,
        COUNT(CASE WHEN ${dateFilter} THEN 1 END) as recent_nft_mints,
        COUNT(CASE WHEN solana_mint_address IS NOT NULL THEN 1 END) as successful_mints
      FROM nft_mints
    `).first();
    
    // Get daily active users (last 30 days)
    const dailyActiveUsers = await env.DB.prepare(`
      SELECT 
        date(created_at) as activity_date,
        COUNT(DISTINCT user_id) as active_users
      FROM (
        SELECT user_id, created_at FROM paws_transactions WHERE date(created_at) >= date('now', '-30 days')
        UNION
        SELECT p.user_id, f.created_at FROM feeding_logs f 
        JOIN pet_profiles p ON f.pet_id = p.id 
        WHERE date(f.created_at) >= date('now', '-30 days')
        UNION
        SELECT p.user_id, c.created_at FROM ai_consultations c 
        JOIN pet_profiles p ON c.pet_id = p.id 
        WHERE date(c.created_at) >= date('now', '-30 days')
      )
      GROUP BY date(created_at)
      ORDER BY activity_date DESC
    `).all();
    
    return new Response(JSON.stringify({
      timeframe,
      users: {
        total: userMetrics.total_users || 0,
        new: userMetrics.new_users || 0,
        paid: userMetrics.paid_users || 0,
        withWallet: userMetrics.wallet_connected_users || 0,
        conversionRate: userMetrics.total_users > 0 ? 
          Math.round((userMetrics.paid_users / userMetrics.total_users) * 100) : 0
      },
      pets: {
        total: petMetrics.total_pets || 0,
        new: petMetrics.new_pets || 0,
        memorial: petMetrics.memorial_pets || 0,
        withImages: petMetrics.pets_with_images || 0,
        imageCompletionRate: petMetrics.total_pets > 0 ? 
          Math.round((petMetrics.pets_with_images / petMetrics.total_pets) * 100) : 0
      },
      feeding: {
        totalLogs: feedingMetrics.total_feeding_logs || 0,
        recentLogs: feedingMetrics.recent_feeding_logs || 0,
        petsWithLogs: feedingMetrics.pets_with_feeding_logs || 0,
        uniqueLogDays: feedingMetrics.unique_feeding_days || 0
      },
      consultations: {
        total: consultationMetrics.total_consultations || 0,
        recent: consultationMetrics.recent_consultations || 0,
        emergency: consultationMetrics.emergency_consultations || 0,
        avgConfidence: Math.round((consultationMetrics.avg_confidence_score || 0) * 100),
        emergencyRate: consultationMetrics.total_consultations > 0 ? 
          Math.round((consultationMetrics.emergency_consultations / consultationMetrics.total_consultations) * 100) : 0
      },
      paws: {
        totalDistributed: pawsMetrics.total_paws_distributed || 0,
        rewardTransactions: pawsMetrics.reward_transactions || 0,
        transferTransactions: pawsMetrics.transfer_transactions || 0,
        recentTransactions: pawsMetrics.recent_transactions || 0
      },
      nfts: {
        totalMints: nftMetrics.total_nft_mints || 0,
        recentMints: nftMetrics.recent_nft_mints || 0,
        successfulMints: nftMetrics.successful_mints || 0,
        successRate: nftMetrics.total_nft_mints > 0 ? 
          Math.round((nftMetrics.successful_mints / nftMetrics.total_nft_mints) * 100) : 0
      },
      dailyActiveUsers: dailyActiveUsers.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('System metrics error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Update daily metrics (cron job endpoint)
async function updateDailyMetrics(request, env) {
  try {
    const isAdmin = await checkAdminAccess(request, env);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Check if metrics already exist for today
    const existingMetrics = await env.DB.prepare(
      'SELECT id FROM daily_metrics WHERE metric_date = ?'
    ).bind(today).first();
    
    // Calculate today's metrics
    const userStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN date(created_at) = ? THEN 1 END) as new_users,
        COUNT(CASE WHEN date(created_at) >= date('now', '-1 day') AND 
                         date(created_at) <= date('now') THEN 1 END) as active_users
      FROM users
    `).bind(today).first();
    
    const petStats = await env.DB.prepare(`
      SELECT COUNT(*) as total_pets
      FROM pet_profiles
    `).first();
    
    const feedingStats = await env.DB.prepare(`
      SELECT COUNT(*) as feeding_logs_count
      FROM feeding_logs
      WHERE date(created_at) = ?
    `).bind(today).first();
    
    const consultationStats = await env.DB.prepare(`
      SELECT COUNT(*) as ai_consultations_count
      FROM ai_consultations
      WHERE date(created_at) = ?
    `).bind(today).first();
    
    const nftStats = await env.DB.prepare(`
      SELECT COUNT(*) as nft_mints_count
      FROM nft_mints
      WHERE date(created_at) = ?
    `).bind(today).first();
    
    const pawsStats = await env.DB.prepare(`
      SELECT SUM(CASE WHEN amount > 0 AND status = 'completed' THEN amount ELSE 0 END) as paws_distributed
      FROM paws_transactions
      WHERE date(created_at) = ?
    `).bind(today).first();
    
    const metricsData = {
      id: uuidv4(),
      metric_date: today,
      total_users: userStats.total_users || 0,
      new_users: userStats.new_users || 0,
      active_users: userStats.active_users || 0,
      total_pets: petStats.total_pets || 0,
      feeding_logs_count: feedingStats.feeding_logs_count || 0,
      ai_consultations_count: consultationStats.ai_consultations_count || 0,
      nft_mints_count: nftStats.nft_mints_count || 0,
      paws_distributed: pawsStats.paws_distributed || 0
    };
    
    if (existingMetrics) {
      // Update existing metrics
      await env.DB.prepare(`
        UPDATE daily_metrics 
        SET total_users = ?, new_users = ?, active_users = ?, total_pets = ?,
            feeding_logs_count = ?, ai_consultations_count = ?, nft_mints_count = ?,
            paws_distributed = ?
        WHERE metric_date = ?
      `).bind(
        metricsData.total_users,
        metricsData.new_users,
        metricsData.active_users,
        metricsData.total_pets,
        metricsData.feeding_logs_count,
        metricsData.ai_consultations_count,
        metricsData.nft_mints_count,
        metricsData.paws_distributed,
        today
      ).run();
    } else {
      // Insert new metrics
      await env.DB.prepare(`
        INSERT INTO daily_metrics (id, metric_date, total_users, new_users, active_users,
                                   total_pets, feeding_logs_count, ai_consultations_count,
                                   nft_mints_count, paws_distributed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        metricsData.id,
        metricsData.metric_date,
        metricsData.total_users,
        metricsData.new_users,
        metricsData.active_users,
        metricsData.total_pets,
        metricsData.feeding_logs_count,
        metricsData.ai_consultations_count,
        metricsData.nft_mints_count,
        metricsData.paws_distributed
      ).run();
    }
    
    return new Response(JSON.stringify({
      message: 'Daily metrics updated successfully',
      metrics: metricsData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Update daily metrics error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get performance metrics
async function getPerformanceMetrics(request, env) {
  try {
    const isAdmin = await checkAdminAccess(request, env);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get analytics from durable object
    const analyticsId = env.ANALYTICS_DO.idFromName('main');
    const analyticsObject = env.ANALYTICS_DO.get(analyticsId);
    
    const response = await analyticsObject.fetch('https://fake-host/metrics', {
      method: 'GET'
    });
    
    const performanceData = await response.json();
    
    return new Response(JSON.stringify(performanceData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Performance metrics error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Main handler
export default async function handleAnalytics(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    let response;
    
    // POST /api/analytics/track - Track user behavior event
    if (path === '/api/analytics/track' && method === 'POST') {
      response = await trackEvent(request, env);
    }
    // GET /api/analytics/dashboard - Get user analytics dashboard
    else if (path === '/api/analytics/dashboard' && method === 'GET') {
      response = await getUserAnalytics(request, env);
    }
    // GET /api/analytics/system - Get system-wide metrics (admin only)
    else if (path === '/api/analytics/system' && method === 'GET') {
      response = await getSystemMetrics(request, env);
    }
    // POST /api/analytics/daily-update - Update daily metrics (admin only)
    else if (path === '/api/analytics/daily-update' && method === 'POST') {
      response = await updateDailyMetrics(request, env);
    }
    // GET /api/analytics/performance - Get performance metrics (admin only)
    else if (path === '/api/analytics/performance' && method === 'GET') {
      response = await getPerformanceMetrics(request, env);
    }
    else {
      response = new Response(JSON.stringify({
        error: 'Not found',
        availableEndpoints: [
          'POST /api/analytics/track - Track user behavior event',
          'GET /api/analytics/dashboard?timeframe=7d|30d|90d|1y - Get user analytics',
          'GET /api/analytics/system?timeframe=7d|30d|90d|1y - Get system metrics (admin)',
          'POST /api/analytics/daily-update - Update daily metrics (admin)',
          'GET /api/analytics/performance - Get performance metrics (admin)'
        ]
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
    console.error('Analytics handler error:', error);
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
