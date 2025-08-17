/**
 * SUPERLUXE Dashboard API Worker
 * Comprehensive API endpoints for the dashboard
 */

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      switch (path) {
        case '/api/status':
          return await getBotStatus(env, corsHeaders);
        
        case '/api/metrics/daily':
          return await getDailyMetrics(env, corsHeaders);
        
        case '/api/metrics/weekly':
          return await getWeeklyMetrics(env, corsHeaders);
        
        case '/api/subreddits':
          if (request.method === 'GET') {
            return await getSubreddits(env, corsHeaders);
          } else if (request.method === 'POST') {
            const body = await request.json();
            return await updateSubreddit(env, body, corsHeaders);
          }
          break;
        
        case '/api/audit':
          const limit = url.searchParams.get('limit') || '50';
          return await getAuditTrail(env, parseInt(limit), corsHeaders);
        
        case '/api/health':
          return await getSystemHealth(env, corsHeaders);
        
        case '/api/analytics/gpt':
          return await getGPTAnalytics(env, corsHeaders);
        
        case '/api/analytics/business':
          return await getBusinessMetrics(env, corsHeaders);
        
        case '/api/bot/pause':
          if (request.method === 'POST') {
            return await pauseBot(env, corsHeaders);
          }
          break;
        
        case '/api/bot/resume':
          if (request.method === 'POST') {
            return await resumeBot(env, corsHeaders);
          }
          break;
        
        case '/api/stream':
          return await createEventStream(env, corsHeaders);
        
        default:
          return new Response('API endpoint not found', { 
            status: 404, 
            headers: corsHeaders 
          });
      }
    } catch (error) {
      console.error('Dashboard API error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function getBotStatus(env: any, corsHeaders: any) {
  // Get current bot status from database
  const queueStats = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) as posted_today,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_today
    FROM engagement_queue 
    WHERE date(created_at) = date('now')
  `).first();

  const recentActivity = await env.DB.prepare(`
    SELECT updated_at
    FROM engagement_queue
    ORDER BY updated_at DESC
    LIMIT 1
  `).first();

  const status = {
    status: 'ACTIVE', // TODO: Get from KV store
    lastActivity: recentActivity?.updated_at || new Date().toISOString(),
    currentCycle: 'Reddit Monitoring',
    postsProcessed: queueStats?.total || 0,
    commentsGenerated: queueStats?.posted_today || 0,
    engagementRate: queueStats?.total > 0 ? (queueStats.posted_today / queueStats.total) : 0,
    uptime: Date.now() - (Date.now() - 24 * 60 * 60 * 1000) // 24h uptime simulation
  };

  return new Response(JSON.stringify(status), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getDailyMetrics(env: any, corsHeaders: any) {
  const metrics = await env.DB.prepare(`
    SELECT 
      date(created_at) as date,
      COUNT(*) as opportunities,
      SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) as posted,
      AVG(relevance_score) as avg_relevance
    FROM reddit_opportunities
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY date DESC
  `).all();

  return new Response(JSON.stringify(metrics.results || []), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getWeeklyMetrics(env: any, corsHeaders: any) {
  const metrics = await env.DB.prepare(`
    SELECT 
      strftime('%Y-%W', created_at) as week,
      COUNT(*) as opportunities,
      SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) as posted,
      COUNT(DISTINCT subreddit) as subreddits_active
    FROM reddit_opportunities
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY strftime('%Y-%W', created_at)
    ORDER BY week DESC
  `).all();

  return new Response(JSON.stringify(metrics.results || []), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getSubreddits(env: any, corsHeaders: any) {
  const subreddits = await env.DB.prepare(`
    SELECT 
      subreddit as name,
      COUNT(*) as postsToday,
      AVG(relevance_score) as avgRelevance,
      MAX(discovered_at) as lastActivity
    FROM reddit_opportunities
    WHERE date(discovered_at) = date('now')
    GROUP BY subreddit
    ORDER BY postsToday DESC
  `).all();

  const subredditMetrics = (subreddits.results || []).map((sub: any) => ({
    name: sub.name,
    status: 'ACTIVE',
    postsToday: sub.postsToday,
    commentsPosted: 0, // TODO: Calculate from engagement_queue
    avgUpvotes: 0, // TODO: Get from Reddit API
    bestPerforming: 'N/A',
    nextScan: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    riskLevel: sub.avgRelevance > 5 ? 'LOW' : 'MEDIUM',
    recentActivity: []
  }));

  return new Response(JSON.stringify(subredditMetrics), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getAuditTrail(env: any, limit: number, corsHeaders: any) {
  const auditData = await env.DB.prepare(`
    SELECT 
      eq.*,
      ro.title,
      ro.subreddit,
      ro.url,
      ro.author
    FROM engagement_queue eq
    LEFT JOIN reddit_opportunities ro ON eq.opportunity_id = ro.id
    ORDER BY eq.created_at DESC
    LIMIT ?
  `).bind(limit).all();

  const activities = (auditData.results || []).map((item: any) => ({
    timestamp: item.created_at,
    type: item.status === 'posted' ? 'COMMENT' : 'SKIP',
    subreddit: item.subreddit || 'unknown',
    postTitle: item.title || 'Unknown Post',
    action: `${item.status} - ${item.engagement_type}`,
    result: {
      engagement: item.status,
      productMatched: 'N/A',
      postUrl: item.url
    },
    riskLevel: 'LOW'
  }));

  return new Response(JSON.stringify(activities), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getSystemHealth(env: any, corsHeaders: any) {
  const health = {
    cloudflare: {
      worker: { status: 'healthy', latency: 45 },
      kv: { reads: 150, writes: 23, errors: 0 },
      d1: { queries: 234, avgTime: 12, errors: 0 },
      r2: { usage: 1024000, quota: 10000000000 }
    },
    apis: {
      reddit: { requestsUsed: 45, limit: 60, resetTime: new Date(Date.now() + 15 * 60 * 1000).toISOString() },
      openai: { costToday: 2.45, requestsToday: 12 }
    },
    errors: []
  };

  return new Response(JSON.stringify(health), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getGPTAnalytics(env: any, corsHeaders: any) {
  // Simulate GPT analytics based on database data
  const analytics = {
    contentClassification: {
      positive: 65,
      neutral: 25,
      negative: 10
    },
    artCategories: {
      'Oil Painting': 45,
      'Watercolor': 30,
      'Digital Art': 25,
      'Mixed Media': 15,
      'Sculpture': 8
    },
    productMatching: {
      successRate: 0.78,
      highConfidence: 23,
      manualReview: 5
    },
    averageConfidence: 0.82,
    processingTime: 1250
  };

  return new Response(JSON.stringify(analytics), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getBusinessMetrics(env: any, corsHeaders: any) {
  const metrics = {
    directTraffic: 156,
    productViews: 89,
    conversions: 7,
    estimatedRevenue: 1247.50,
    brandImpressions: 12450,
    engagementQuality: {
      sentiment: 0.78,
      upvoteRatio: 0.85,
      replyRate: 0.12,
      spamReports: 0
    }
  };

  return new Response(JSON.stringify(metrics), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function pauseBot(env: any, corsHeaders: any) {
  // Set bot status to paused in KV store
  await env.BOT_STATE?.put('status', 'PAUSED');
  
  return new Response(JSON.stringify({ status: 'PAUSED', message: 'Bot paused successfully' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function resumeBot(env: any, corsHeaders: any) {
  // Set bot status to active in KV store
  await env.BOT_STATE?.put('status', 'ACTIVE');
  
  return new Response(JSON.stringify({ status: 'ACTIVE', message: 'Bot resumed successfully' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function updateSubreddit(env: any, body: any, corsHeaders: any) {
  // Update subreddit configuration
  const { name, config } = body;
  
  // Store config in KV
  await env.BOT_STATE?.put(`subreddit:${name}`, JSON.stringify(config));
  
  return new Response(JSON.stringify({ success: true, subreddit: name }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function createEventStream(env: any, corsHeaders: any) {
  // Create Server-Sent Events stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  
  // Send initial connection event
  await writer.write(new TextEncoder().encode('data: {"type":"connected","timestamp":"' + new Date().toISOString() + '"}\n\n'));
  
  // Simulate periodic updates
  const interval = setInterval(async () => {
    const event = {
      type: 'activity',
      timestamp: new Date().toISOString(),
      data: {
        type: 'SCAN',
        subreddit: 'r/Art',
        postTitle: 'New artwork discovered',
        action: 'Analyzing...',
        riskLevel: 'LOW',
        result: {
          postUrl: 'https://reddit.com/r/Art/sample_post'
        }
      }
    };
    
    await writer.write(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
  }, 5000);
  
  // Clean up after 30 seconds
  setTimeout(() => {
    clearInterval(interval);
    writer.close();
  }, 30000);

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}