/**
 * Reddit Community Monitoring Worker
 * Monitors art communities for SUPERLUXE brand engagement opportunities
 */

export { RedditMonitor };

export default {
  async scheduled(event, env, ctx) {
    console.log('🔍 Starting Reddit community monitoring...');
    
    try {
      const monitor = new RedditMonitor(env);
      await monitor.scanArtCommunities();
      console.log('✅ Reddit monitoring cycle complete');
    } catch (error) {
      console.error('❌ Reddit monitoring error:', error);
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Manual trigger endpoint for testing
    if (url.pathname === '/trigger-reddit-scan') {
      const monitor = new RedditMonitor(env);
      const results = await monitor.scanArtCommunities();
      
      return new Response(JSON.stringify({
        success: true,
        results: results,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Reddit Monitor API', { status: 200 });
  }
};

class RedditMonitor {
  constructor(env) {
    this.env = env;
    this.db = env.DB;
    this.redditClientId = env.REDDIT_CLIENT_ID;
    this.redditClientSecret = env.REDDIT_CLIENT_SECRET;
    this.userAgent = 'SUPERLUXE-Community-Bot/1.0';
    
    // Target art communities for SUPERLUXE engagement
    this.targetSubreddits = [
      'r/Art',
      'r/painting',
      'r/conceptart', 
      'r/learnart',
      'r/ArtCrit',
      'r/digitalpainting',
      'r/watercolor',
      'r/oilpainting',
      'r/AbstractArt',
      'r/streetart',
      'r/museum',
      'r/ArtHistory',
      'r/fineart',
      'r/contemporaryart'
    ];
    
    // SUPERLUXE brand keywords
    this.brandKeywords = [
      'luxury art',
      'premium canvas',
      'high-end art',
      'exclusive artwork',
      'limited edition',
      'gallery quality',
      'museum quality',
      'collector art',
      'investment art',
      'luxury home decor',
      'superluxe',
      'premium framing',
      'art collecting',
      'fine art prints'
    ];
  }

  async getRedditAccessToken() {
    const auth = btoa(`${this.redditClientId}:${this.redditClientSecret}`);
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': this.userAgent,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    
    const data = await response.json();
    return data.access_token;
  }

  async scanArtCommunities() {
    const accessToken = await this.getRedditAccessToken();
    let totalPosts = 0;
    let opportunities = [];
    
    for (const subreddit of this.targetSubreddits) {
      try {
        console.log(`🔍 Scanning ${subreddit}...`);
        
        const posts = await this.fetchSubredditPosts(subreddit, accessToken);
        totalPosts += posts.length;
        
        for (const post of posts) {
          const opportunity = await this.analyzeEngagementOpportunity(post, subreddit);
          if (opportunity) {
            opportunities.push(opportunity);
            await this.saveEngagementOpportunity(opportunity);
          }
        }
        
        // Rate limiting: 60 requests per minute
        await this.sleep(1000);
        
      } catch (error) {
        console.error(`❌ Error scanning ${subreddit}:`, error);
      }
    }
    
    console.log(`📊 Scanned ${totalPosts} posts, found ${opportunities.length} opportunities`);
    return { totalPosts, opportunities: opportunities.length };
  }

  async fetchSubredditPosts(subreddit, accessToken) {
    const response = await fetch(`https://oauth.reddit.com/${subreddit}/hot?limit=25`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': this.userAgent
      }
    });
    
    const data = await response.json();
    return data.data.children.map(child => child.data);
  }

  async analyzeEngagementOpportunity(post, subreddit) {
    const content = `${post.title} ${post.selftext || ''}`.toLowerCase();
    const score = post.score;
    const commentCount = post.num_comments;
    const postAge = (Date.now() / 1000) - post.created_utc;
    
    // Skip if post is too old (>24 hours)
    if (postAge > 86400) return null;
    
    // Skip if post has low engagement
    if (score < 5 && commentCount < 2) return null;
    
    // Check for brand keyword relevance
    const relevanceScore = this.calculateRelevanceScore(content);
    if (relevanceScore < 3) return null;
    
    // Analyze sentiment and engagement potential
    const sentiment = this.analyzeSentiment(content);
    const engagementPotential = this.calculateEngagementPotential(post);
    
    return {
      id: post.id,
      subreddit: subreddit,
      title: post.title,
      author: post.author,
      score: score,
      commentCount: commentCount,
      url: `https://reddit.com${post.permalink}`,
      content: post.selftext || '',
      relevanceScore: relevanceScore,
      sentiment: sentiment,
      engagementPotential: engagementPotential,
      createdAt: new Date(post.created_utc * 1000).toISOString(),
      discoveredAt: new Date().toISOString()
    };
  }

  calculateRelevanceScore(content) {
    let score = 0;
    
    for (const keyword of this.brandKeywords) {
      if (content.includes(keyword)) {
        score += keyword.split(' ').length; // Multi-word keywords get higher scores
      }
    }
    
    // Bonus for art-related terms
    const artTerms = ['painting', 'canvas', 'gallery', 'exhibition', 'artist', 'artwork', 'creative'];
    for (const term of artTerms) {
      if (content.includes(term)) score += 1;
    }
    
    return score;
  }

  analyzeSentiment(content) {
    // Simple sentiment analysis
    const positiveWords = ['amazing', 'beautiful', 'stunning', 'incredible', 'love', 'perfect', 'excellent'];
    const negativeWords = ['terrible', 'awful', 'hate', 'bad', 'disappointing', 'poor'];
    
    let sentimentScore = 0;
    
    for (const word of positiveWords) {
      if (content.includes(word)) sentimentScore += 1;
    }
    
    for (const word of negativeWords) {
      if (content.includes(word)) sentimentScore -= 1;
    }
    
    if (sentimentScore > 0) return 'positive';
    if (sentimentScore < 0) return 'negative';
    return 'neutral';
  }

  calculateEngagementPotential(post) {
    // Weighted scoring based on multiple factors
    const scoreWeight = Math.min(post.score / 100, 1); // Normalize score
    const commentWeight = Math.min(post.num_comments / 50, 1); // Normalize comments
    const ageWeight = Math.max(0, 1 - ((Date.now() / 1000 - post.created_utc) / 86400)); // Fresher is better
    
    const potential = (scoreWeight * 0.4) + (commentWeight * 0.4) + (ageWeight * 0.2);
    
    if (potential > 0.7) return 'high';
    if (potential > 0.4) return 'medium';
    return 'low';
  }

  async saveEngagementOpportunity(opportunity) {
    try {
      await this.db.prepare(`
        INSERT OR REPLACE INTO reddit_opportunities (
          reddit_id, subreddit, title, author, score, comment_count,
          url, content, relevance_score, sentiment, engagement_potential,
          created_at, discovered_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).bind(
        opportunity.id,
        opportunity.subreddit,
        opportunity.title,
        opportunity.author,
        opportunity.score,
        opportunity.commentCount,
        opportunity.url,
        opportunity.content,
        opportunity.relevanceScore,
        opportunity.sentiment,
        opportunity.engagementPotential,
        opportunity.createdAt,
        opportunity.discoveredAt
      ).run();
      
      console.log(`💾 Saved opportunity: ${opportunity.title.substring(0, 50)}...`);
    } catch (error) {
      console.error('❌ Error saving opportunity:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}