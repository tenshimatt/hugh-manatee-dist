/**
 * SUPERLUXE Engagement Orchestrator
 * Coordinates the entire community engagement pipeline
 */

import { SuperluxeBrandIntelligence } from './superluxe-brand-intelligence.js';

export default {
  async scheduled(event, env, ctx) {
    console.log('🎼 Starting engagement orchestration...');
    
    const orchestrator = new EngagementOrchestrator(env);
    
    switch (event.cron) {
      case '*/15 * * * *': // Every 15 minutes
        await orchestrator.processEngagementQueue();
        break;
      case '0 */2 * * *': // Every 2 hours  
        await orchestrator.analyzePendingOpportunities();
        break;
      case '0 0 * * *': // Daily at midnight
        await orchestrator.generateDailyInsights();
        break;
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const orchestrator = new EngagementOrchestrator(env);
    
    // API endpoints for manual control and monitoring
    switch (url.pathname) {
      case '/api/queue/status':
        return await orchestrator.getQueueStatus();
        
      case '/api/queue/process':
        return await orchestrator.processEngagementQueue();
        
      case '/api/opportunities/analyze':
        return await orchestrator.analyzePendingOpportunities();
        
      case '/api/insights/daily':
        return await orchestrator.generateDailyInsights();
        
      case '/api/dashboard':
        return await orchestrator.getDashboard();
        
      case '/trigger-reddit-scan':
        const { RedditMonitor } = await import('./reddit-monitor.js');
        const monitor = new RedditMonitor(env);
        const results = await monitor.scanArtCommunities();
        return new Response(JSON.stringify({
          success: true,
          results: results,
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      default:
        return new Response('SUPERLUXE Engagement Orchestrator API', { status: 200 });
    }
  }
};

class EngagementOrchestrator {
  constructor(env) {
    this.env = env;
    this.db = env.DB;
    this.brandIntelligence = new SuperluxeBrandIntelligence(env);
    
    // Engagement configuration
    this.config = {
      maxDailyEngagements: 12,
      minTimeBetweenPosts: 30 * 60 * 1000, // 30 minutes
      optimalEngagementHours: [9, 11, 14, 16, 19, 21], // Peak Reddit hours
      qualityThreshold: 0.7,
      riskThreshold: 0.3
    };
  }

  async processEngagementQueue() {
    console.log('⚡ Processing engagement queue...');
    
    try {
      // Get ready-to-post items from queue
      const queueItems = await this.getReadyQueueItems();
      
      if (queueItems.length === 0) {
        console.log('📪 No items ready for engagement');
        return this.jsonResponse({ message: 'Queue empty', processed: 0 });
      }
      
      let processed = 0;
      
      for (const item of queueItems) {
        try {
          // Check daily limits and timing
          if (await this.shouldEngageNow(item)) {
            await this.executeEngagement(item);
            processed++;
            
            // Respect rate limits
            await this.sleep(this.config.minTimeBetweenPosts);
          }
        } catch (error) {
          console.error(`❌ Error processing queue item ${item.id}:`, error);
          await this.markQueueItemFailed(item.id, error.message);
        }
      }
      
      console.log(`✅ Processed ${processed} engagement items`);
      return this.jsonResponse({ message: 'Queue processed', processed });
      
    } catch (error) {
      console.error('❌ Error processing engagement queue:', error);
      return this.jsonResponse({ error: error.message }, 500);
    }
  }

  async getReadyQueueItems() {
    const result = await this.db.prepare(`
      SELECT eq.*, ro.title, ro.url, ro.subreddit, ro.author
      FROM engagement_queue eq
      LEFT JOIN reddit_opportunities ro ON eq.opportunity_id = ro.id
      WHERE eq.status = 'ready'
        AND (eq.scheduled_for IS NULL OR eq.scheduled_for <= datetime('now'))
      ORDER BY eq.priority DESC, eq.created_at ASC
      LIMIT 5
    `).all();
    
    return result.results || [];
  }

  async shouldEngageNow(item) {
    // Check daily engagement limits
    const todayCount = await this.getTodayEngagementCount();
    if (todayCount >= this.config.maxDailyEngagements) {
      console.log('⏰ Daily engagement limit reached');
      return false;
    }
    
    // Check if we're in optimal hours
    const currentHour = new Date().getHours();
    if (!this.config.optimalEngagementHours.includes(currentHour)) {
      // Reschedule for next optimal hour
      await this.rescheduleItem(item.id);
      return false;
    }
    
    // Check minimum time between posts
    const lastEngagement = await this.getLastEngagementTime();
    if (lastEngagement && (Date.now() - lastEngagement) < this.config.minTimeBetweenPosts) {
      console.log('⏰ Too soon since last engagement');
      return false;
    }
    
    return true;
  }

  async executeEngagement(item) {
    console.log(`🚀 Executing engagement for: ${item.title}`);
    
    try {
      // Post the response to Reddit
      const success = await this.postToReddit(item);
      
      if (success) {
        await this.markQueueItemPosted(item.id);
        await this.recordEngagementAnalytics(item);
        console.log(`✅ Successfully engaged with: ${item.title}`);
      } else {
        await this.markQueueItemFailed(item.id, 'Failed to post to Reddit');
      }
      
    } catch (error) {
      console.error(`❌ Engagement execution failed:`, error);
      await this.markQueueItemFailed(item.id, error.message);
    }
  }

  async postToReddit(item) {
    // In a real implementation, this would use Reddit API to post comments
    // For now, we'll simulate the posting
    
    console.log(`📝 Posting response to ${item.target_url}`);
    console.log(`💬 Response: ${item.generated_response?.substring(0, 100)}...`);
    
    // Simulate API call delay
    await this.sleep(2000);
    
    // Simulate 95% success rate
    return Math.random() > 0.05;
  }

  async analyzePendingOpportunities() {
    console.log('🔍 Analyzing pending opportunities...');
    
    try {
      // Get unanalyzed opportunities
      const opportunities = await this.db.prepare(`
        SELECT * FROM reddit_opportunities 
        WHERE status = 'pending' 
        ORDER BY discovered_at DESC 
        LIMIT 10
      `).all();
      
      if (!opportunities.results || opportunities.results.length === 0) {
        return this.jsonResponse({ message: 'No pending opportunities', analyzed: 0 });
      }
      
      let analyzed = 0;
      
      for (const opportunity of opportunities.results) {
        try {
          // Analyze with brand intelligence
          const analysis = await this.brandIntelligence.analyzeEngagementOpportunity(opportunity);
          
          // Save analysis results
          await this.brandIntelligence.saveAnalysis(analysis);
          
          // Queue for engagement if suitable
          if (analysis.generatedResponse && 
              analysis.brandAlignment > this.config.qualityThreshold &&
              analysis.riskLevel < this.config.riskThreshold) {
            
            await this.queueForEngagement(opportunity, analysis);
          }
          
          analyzed++;
          
        } catch (error) {
          console.error(`❌ Error analyzing opportunity ${opportunity.id}:`, error);
        }
      }
      
      console.log(`✅ Analyzed ${analyzed} opportunities`);
      return this.jsonResponse({ message: 'Analysis complete', analyzed });
      
    } catch (error) {
      console.error('❌ Error analyzing opportunities:', error);
      return this.jsonResponse({ error: error.message }, 500);
    }
  }

  async queueForEngagement(opportunity, analysis) {
    const priority = this.calculatePriority(opportunity, analysis);
    const scheduledFor = this.calculateOptimalPostTime(analysis.optimalTiming);
    
    await this.db.prepare(`
      INSERT INTO engagement_queue (
        opportunity_id, priority, engagement_type, target_platform,
        target_url, context_data, status, scheduled_for, generated_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      opportunity.id,
      priority,
      'comment',
      'reddit',
      opportunity.url,
      JSON.stringify({ analysis }),
      'ready',
      scheduledFor,
      analysis.generatedResponse?.content
    ).run();
    
    console.log(`📥 Queued opportunity: ${opportunity.title.substring(0, 50)}...`);
  }

  calculatePriority(opportunity, analysis) {
    let priority = 0;
    
    // Higher engagement potential = higher priority
    if (opportunity.engagement_potential === 'high') priority += 30;
    else if (opportunity.engagement_potential === 'medium') priority += 15;
    
    // Higher brand alignment = higher priority
    priority += Math.floor(analysis.brandAlignment * 20);
    
    // Fresh posts get priority boost
    const postAge = Date.now() - new Date(opportunity.created_at).getTime();
    const hoursOld = postAge / (1000 * 60 * 60);
    if (hoursOld < 4) priority += 10;
    
    return priority;
  }

  calculateOptimalPostTime(timing) {
    const now = new Date();
    
    switch (timing) {
      case 'immediate':
        return now.toISOString();
      case 'wait_2_hours':
        return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
      case 'soon':
        return new Date(now.getTime() + 30 * 60 * 1000).toISOString();
      default:
        return now.toISOString();
    }
  }

  async generateDailyInsights() {
    console.log('📊 Generating daily insights...');
    
    try {
      const insights = {
        engagementStats: await this.getEngagementStats(),
        topPerformingSubreddits: await this.getTopSubreddits(),
        brandMentionTrends: await this.getBrandMentionTrends(),
        responseEffectiveness: await this.getResponseEffectiveness()
      };
      
      // Save insights to database
      await this.saveInsights(insights);
      
      console.log('✅ Daily insights generated');
      return this.jsonResponse({ message: 'Insights generated', insights });
      
    } catch (error) {
      console.error('❌ Error generating insights:', error);
      return this.jsonResponse({ error: error.message }, 500);
    }
  }

  async getDashboard() {
    try {
      const dashboard = {
        queueStatus: await this.getQueueSummary(),
        recentEngagements: await this.getRecentEngagements(),
        performanceMetrics: await this.getPerformanceMetrics(),
        opportunities: await this.getTopOpportunities()
      };
      
      return this.jsonResponse({ dashboard });
      
    } catch (error) {
      console.error('❌ Error generating dashboard:', error);
      return this.jsonResponse({ error: error.message }, 500);
    }
  }

  // Helper methods
  async getTodayEngagementCount() {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM engagement_queue 
      WHERE status = 'posted' 
        AND date(updated_at) = date('now')
    `).first();
    
    return result?.count || 0;
  }

  async getLastEngagementTime() {
    const result = await this.db.prepare(`
      SELECT updated_at 
      FROM engagement_queue 
      WHERE status = 'posted' 
      ORDER BY updated_at DESC 
      LIMIT 1
    `).first();
    
    return result ? new Date(result.updated_at).getTime() : null;
  }

  async markQueueItemPosted(id) {
    await this.db.prepare(`
      UPDATE engagement_queue 
      SET status = 'posted', updated_at = datetime('now') 
      WHERE id = ?
    `).bind(id).run();
  }

  async markQueueItemFailed(id, error) {
    await this.db.prepare(`
      UPDATE engagement_queue 
      SET status = 'failed', updated_at = datetime('now'),
          context_data = json_set(COALESCE(context_data, '{}'), '$.error', ?)
      WHERE id = ?
    `).bind(error, id).run();
  }

  async rescheduleItem(id) {
    const nextOptimalHour = this.getNextOptimalHour();
    await this.db.prepare(`
      UPDATE engagement_queue 
      SET scheduled_for = ? 
      WHERE id = ?
    `).bind(nextOptimalHour.toISOString(), id).run();
  }

  getNextOptimalHour() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Find next optimal hour
    const nextHour = this.config.optimalEngagementHours.find(hour => hour > currentHour) || 
                    this.config.optimalEngagementHours[0];
    
    const nextTime = new Date(now);
    nextTime.setHours(nextHour, 0, 0, 0);
    
    // If next hour is tomorrow
    if (nextHour <= currentHour) {
      nextTime.setDate(nextTime.getDate() + 1);
    }
    
    return nextTime;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getQueueStatus() {
    const summary = await this.getQueueSummary();
    return this.jsonResponse({ queueStatus: summary });
  }

  async getQueueSummary() {
    const result = await this.db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM engagement_queue 
      GROUP BY status
    `).all();
    
    return result.results || [];
  }

  async getRecentEngagements() {
    const result = await this.db.prepare(`
      SELECT eq.*, ro.title, ro.subreddit
      FROM engagement_queue eq
      LEFT JOIN reddit_opportunities ro ON eq.opportunity_id = ro.id
      WHERE eq.status = 'posted'
      ORDER BY eq.updated_at DESC
      LIMIT 10
    `).all();
    
    return result.results || [];
  }

  async getPerformanceMetrics() {
    const today = await this.db.prepare(`
      SELECT COUNT(*) as count
      FROM engagement_queue
      WHERE status = 'posted' AND date(updated_at) = date('now')
    `).first();

    const total = await this.db.prepare(`
      SELECT COUNT(*) as count
      FROM engagement_queue
      WHERE status = 'posted'
    `).first();

    return {
      todayEngagements: today?.count || 0,
      totalEngagements: total?.count || 0,
      maxDailyLimit: this.config.maxDailyEngagements
    };
  }

  async getTopOpportunities() {
    const result = await this.db.prepare(`
      SELECT *
      FROM reddit_opportunities
      WHERE status = 'pending'
      ORDER BY relevance_score DESC, engagement_potential DESC
      LIMIT 5
    `).all();
    
    return result.results || [];
  }

  async getEngagementStats() {
    return await this.getPerformanceMetrics();
  }

  async getTopSubreddits() {
    const result = await this.db.prepare(`
      SELECT 
        subreddit,
        COUNT(*) as opportunity_count,
        AVG(relevance_score) as avg_relevance
      FROM reddit_opportunities
      WHERE discovered_at >= datetime('now', '-7 days')
      GROUP BY subreddit
      ORDER BY opportunity_count DESC
      LIMIT 5
    `).all();
    
    return result.results || [];
  }

  async getBrandMentionTrends() {
    const result = await this.db.prepare(`
      SELECT 
        date(discovered_at) as date,
        COUNT(*) as mentions
      FROM brand_mentions
      WHERE discovered_at >= datetime('now', '-30 days')
      GROUP BY date(discovered_at)
      ORDER BY date DESC
    `).all();
    
    return result.results || [];
  }

  async getResponseEffectiveness() {
    const result = await this.db.prepare(`
      SELECT 
        AVG(CASE WHEN status = 'posted' THEN 1.0 ELSE 0.0 END) as success_rate,
        COUNT(*) as total_attempts
      FROM engagement_queue
      WHERE created_at >= datetime('now', '-7 days')
    `).first();
    
    return result || { success_rate: 0, total_attempts: 0 };
  }

  async saveInsights(insights) {
    const insightData = JSON.stringify(insights);
    await this.db.prepare(`
      INSERT INTO community_insights (
        subreddit, insight_type, insight_data, 
        confidence_score, date_observed, impact_level
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      'all_communities',
      'daily_summary',
      insightData,
      0.9,
      new Date().toISOString().split('T')[0],
      'medium'
    ).run();
  }

  async recordEngagementAnalytics(item) {
    await this.db.prepare(`
      INSERT INTO engagement_analytics (
        engagement_queue_id, platform, post_url,
        metrics_snapshot, engagement_rate, captured_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      item.id,
      'reddit',
      item.target_url,
      JSON.stringify({ simulated: true }),
      0.1,
      new Date().toISOString()
    ).run();
  }

  jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}