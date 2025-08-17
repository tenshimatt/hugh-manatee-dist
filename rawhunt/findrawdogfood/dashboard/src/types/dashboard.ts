export interface BotStatus {
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  lastActivity: string;
  currentCycle: string;
  postsProcessed: number;
  commentsGenerated: number;
  engagementRate: number;
  uptime: string;
}

export interface ActivityEvent {
  timestamp: string;
  type: 'SCAN' | 'COMMENT' | 'SKIP' | 'ERROR';
  subreddit: string;
  postTitle: string;
  action: string;
  result?: {
    upvotes?: number;
    engagement?: string;
    productMatched?: string;
    postUrl?: string;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SubredditMetrics {
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'COOLDOWN';
  postsToday: number;
  commentsPosted: number;
  avgUpvotes: number;
  bestPerforming: string;
  nextScan: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recentActivity: ActivityEvent[];
}

export interface GPTAnalytics {
  contentClassification: {
    positive: number;
    neutral: number;
    negative: number;
  };
  artCategories: Record<string, number>;
  productMatching: {
    successRate: number;
    highConfidence: number;
    manualReview: number;
  };
  averageConfidence: number;
  processingTime: number;
}

export interface BusinessMetrics {
  directTraffic: number;
  productViews: number;
  conversions: number;
  estimatedRevenue: number;
  brandImpressions: number;
  engagementQuality: {
    sentiment: number;
    upvoteRatio: number;
    replyRate: number;
    spamReports: number;
  };
}

export interface SystemHealth {
  cloudflare: {
    worker: { status: 'healthy' | 'degraded' | 'down'; latency: number };
    kv: { reads: number; writes: number; errors: number };
    d1: { queries: number; avgTime: number; errors: number };
    r2: { usage: number; quota: number };
  };
  apis: {
    reddit: { requestsUsed: number; limit: number; resetTime: string };
    openai: { costToday: number; requestsToday: number };
  };
  errors: Array<{ timestamp: string; level: string; message: string }>;
}

export interface Alert {
  id: string;
  type: 'ERROR' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}