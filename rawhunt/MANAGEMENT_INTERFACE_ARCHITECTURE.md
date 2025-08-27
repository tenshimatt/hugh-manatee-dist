# Rawgle Management Interface Architecture
**Comprehensive Backend Architecture for Platform Administration & Operations**

---

## Executive Summary

This document outlines the complete management interface architecture for the Rawgle raw pet food platform, designed to handle 150k+ suppliers with PAWS crypto token integration, Claude AI recommendations, and comprehensive community features. The architecture emphasizes scalability, security, and ease of use for non-technical administrators.

**Key Architecture Principles:**
- **Microservices-first**: Distributed, independently deployable services
- **Role-based access control**: Granular permissions with audit trails
- **Real-time monitoring**: Live dashboards with intelligent alerting
- **API-driven**: RESTful endpoints with WebSocket real-time updates
- **Database optimization**: Efficient queries and indexing for 150k+ records

---

## 1. Admin Dashboard Architecture

### 1.1 Dashboard Overview
The admin dashboard serves as the central command center for platform operations, providing comprehensive oversight and control capabilities.

### 1.2 Core Dashboard Components

#### 1.2.1 User Management System
```
┌─────────────────────────────────────────────────────────┐
│                    User Management Hub                   │
├─────────────────────────────────────────────────────────┤
│ • User Lifecycle Management (registration → deletion)   │
│ • Role & Permission Assignment (Super Admin, Moderator, │
│   Content Manager, Supplier Liaison, Analytics Viewer) │
│ • Bulk User Operations (CSV import/export, batch updates)│
│ • User Activity Monitoring (login patterns, IP tracking)│
│ • Account Security Controls (2FA enforcement, session   │
│   management, password policies)                        │
│ • Automated User Risk Scoring (unusual activity alerts) │
└─────────────────────────────────────────────────────────┘
```

**Role Hierarchy & Permissions:**
- **Super Admin**: Full system access including user management and system configuration
- **Operations Manager**: Supplier management, review moderation, PAWS token oversight
- **Content Moderator**: Review approval/rejection, community guideline enforcement
- **Data Analyst**: Read-only access to analytics, reporting dashboards
- **Support Agent**: User support tools, limited supplier communication
- **Developer**: Technical monitoring, API debugging, performance analysis

#### 1.2.2 Supplier Data Quality Monitoring
```
┌─────────────────────────────────────────────────────────┐
│               Supplier Quality Dashboard                 │
├─────────────────────────────────────────────────────────┤
│ • Real-time Quality Score Display (0-100 scale)        │
│ • Data Completeness Metrics (contact info, descriptions)│
│ • Duplicate Detection Alerts (fuzzy matching results)   │
│ • Google Places Sync Status (last updated, sync errors) │
│ • Verification Status Pipeline (pending → verified)     │
│ • Performance Analytics (response rate, customer rating)│
│ • Automated Flag Resolution Queue                       │
└─────────────────────────────────────────────────────────┘
```

**Quality Scoring Algorithm:**
```javascript
// Supplier Quality Score Calculation
const calculateQualityScore = (supplier) => {
  let score = 0;
  
  // Data Completeness (40 points)
  score += supplier.hasPhone ? 10 : 0;
  score += supplier.hasEmail ? 10 : 0;
  score += supplier.hasWebsite ? 10 : 0;
  score += supplier.description?.length > 100 ? 10 : 0;
  
  // Verification Status (30 points)
  score += supplier.isPhoneVerified ? 15 : 0;
  score += supplier.isEmailVerified ? 15 : 0;
  
  // Engagement Metrics (20 points)
  score += supplier.responseRate > 0.8 ? 10 : (supplier.responseRate * 10);
  score += supplier.averageRating > 4.0 ? 10 : (supplier.averageRating * 2);
  
  // Freshness (10 points)
  const daysSinceUpdate = (Date.now() - supplier.lastUpdated) / (1000 * 60 * 60 * 24);
  score += daysSinceUpdate < 30 ? 10 : Math.max(0, 10 - (daysSinceUpdate / 30));
  
  return Math.round(score);
};
```

#### 1.2.3 PAWS Token Economics Dashboard
```
┌─────────────────────────────────────────────────────────┐
│                PAWS Token Control Center                │
├─────────────────────────────────────────────────────────┤
│ • Token Supply Metrics (total, circulating, staked)    │
│ • Reward Distribution Analytics (daily/weekly trends)   │
│ • User Engagement Correlation (tokens earned vs activity)│
│ • Token Velocity Monitoring (transfer frequency)        │
│ • Anti-Fraud Detection (suspicious earning patterns)    │
│ • Reward Pool Management (allocation adjustments)       │
│ • Emergency Token Controls (freeze accounts, adjust rates)│
└─────────────────────────────────────────────────────────┘
```

**Token Economics Monitoring:**
- **Daily Token Emission Rate**: Track against target inflation
- **User Engagement Metrics**: Correlation between tokens and platform usage
- **Fraud Detection**: Identify bot activity and reward gaming
- **Economic Health Indicators**: Token velocity, holder distribution

#### 1.2.4 Claude AI Oversight Dashboard
```
┌─────────────────────────────────────────────────────────┐
│               Claude AI Performance Monitor              │
├─────────────────────────────────────────────────────────┤
│ • Conversation Quality Metrics (satisfaction scores)    │
│ • Response Time Analytics (p50, p95, p99 latencies)    │
│ • Accuracy Monitoring (user feedback, correction rates) │
│ • Content Safety Oversight (flagged responses review)   │
│ • Usage Pattern Analysis (peak hours, common queries)   │
│ • Model Performance Tracking (version comparisons)      │
│ • Integration Health Checks (API status, error rates)   │
└─────────────────────────────────────────────────────────┘
```

#### 1.2.5 Review Moderation Workflows
```
┌─────────────────────────────────────────────────────────┐
│             Community Moderation Center                 │
├─────────────────────────────────────────────────────────┤
│ • Pending Review Queue (priority-sorted by flags)      │
│ • Automated Content Flagging (spam, inappropriate)     │
│ • Moderator Assignment System (workload balancing)     │
│ • Escalation Pathways (complex cases → senior mods)    │
│ • Moderation Analytics (response times, accuracy)      │
│ • Community Guidelines Enforcement Tools               │
│ • Appeal Management System (user dispute resolution)   │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Analytics & KPI Dashboards

#### 1.3.1 Platform Health Metrics
```
┌─────────────────────────────────────────────────────────┐
│                 Platform KPI Dashboard                  │
├─────────────────────────────────────────────────────────┤
│ • Daily Active Users (DAU) with trends                 │
│ • Supplier Discovery Rate (searches → contacts)        │
│ • User Retention Cohorts (1-day, 7-day, 30-day)      │
│ • PAWS Token Engagement (earning rate vs activity)     │
│ • Claude AI Interaction Success Rate                   │
│ • Mobile App vs Web Usage Distribution                 │
│ • Geographic Usage Patterns (heat maps)                │
└─────────────────────────────────────────────────────────┘
```

#### 1.3.2 Business Intelligence Tools
- **Revenue Attribution**: PAWS token value impact on user behavior
- **Supplier Performance Analytics**: Conversion rates by supplier quality
- **Seasonal Trend Analysis**: Pet feeding pattern seasonality
- **Competitive Intelligence**: Market share tracking
- **Growth Forecasting**: Predictive analytics for user acquisition

---

## 2. Supplier Management System

### 2.1 Verification Workflow Architecture

#### 2.1.1 Multi-Stage Verification Pipeline
```
┌─────────────────────────────────────────────────────────┐
│              Supplier Verification Pipeline             │
├─────────────────────────────────────────────────────────┤
│ Stage 1: Automated Data Validation                     │
│ • Google Places API verification                       │
│ • Business registration lookup                         │
│ • Contact information validation                       │
│                                                         │
│ Stage 2: Manual Review Queue                           │
│ • Human verification of complex cases                  │
│ • Photo/documentation review                           │
│ • Compliance checking                                  │
│                                                         │
│ Stage 3: Operational Verification                      │
│ • Phone call verification                              │
│ • Email confirmation                                   │
│ • Business license validation                          │
│                                                         │
│ Stage 4: Ongoing Monitoring                            │
│ • Quarterly re-verification                            │
│ • Customer complaint monitoring                        │
│ • Performance score tracking                           │
└─────────────────────────────────────────────────────────┘
```

#### 2.1.2 Approval Process Management
```javascript
// Supplier Verification State Machine
const VerificationStates = {
  PENDING: 'pending',
  AUTO_APPROVED: 'auto_approved',
  MANUAL_REVIEW: 'manual_review',
  ADDITIONAL_INFO: 'additional_info_required',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended'
};

const verificationWorkflow = {
  transitions: {
    [VerificationStates.PENDING]: [
      VerificationStates.AUTO_APPROVED,
      VerificationStates.MANUAL_REVIEW,
      VerificationStates.REJECTED
    ],
    [VerificationStates.MANUAL_REVIEW]: [
      VerificationStates.APPROVED,
      VerificationStates.ADDITIONAL_INFO,
      VerificationStates.REJECTED
    ],
    // ... additional state transitions
  },
  
  automatedRules: {
    autoApprove: (supplier) => {
      return supplier.googlePlacesVerified && 
             supplier.hasValidPhone && 
             supplier.qualityScore > 75;
    },
    
    requireManualReview: (supplier) => {
      return supplier.hasComplaints || 
             supplier.qualityScore < 50 || 
             supplier.hasDuplicates;
    }
  }
};
```

### 2.2 Data Quality Scoring System

#### 2.2.1 Comprehensive Scoring Algorithm
```javascript
// Advanced Quality Scoring with Weighted Factors
const QualityFactors = {
  DATA_COMPLETENESS: {
    weight: 0.3,
    calculate: (supplier) => {
      const fields = [
        'name', 'phone', 'email', 'address', 'website', 
        'description', 'hours', 'services'
      ];
      const completedFields = fields.filter(field => 
        supplier[field] && supplier[field].length > 0
      );
      return (completedFields.length / fields.length) * 100;
    }
  },
  
  VERIFICATION_STATUS: {
    weight: 0.25,
    calculate: (supplier) => {
      let score = 0;
      if (supplier.phoneVerified) score += 40;
      if (supplier.emailVerified) score += 30;
      if (supplier.businessLicenseVerified) score += 30;
      return score;
    }
  },
  
  ENGAGEMENT_METRICS: {
    weight: 0.2,
    calculate: (supplier) => {
      const responseRate = supplier.responseRate || 0;
      const averageRating = supplier.averageRating || 0;
      return (responseRate * 50) + (averageRating * 20);
    }
  },
  
  FRESHNESS_SCORE: {
    weight: 0.15,
    calculate: (supplier) => {
      const daysSinceUpdate = (Date.now() - supplier.lastUpdated) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) return 100;
      if (daysSinceUpdate < 30) return 80;
      if (daysSinceUpdate < 90) return 60;
      return Math.max(0, 60 - (daysSinceUpdate - 90));
    }
  },
  
  CUSTOMER_FEEDBACK: {
    weight: 0.1,
    calculate: (supplier) => {
      const reviewCount = supplier.reviewCount || 0;
      const averageRating = supplier.averageRating || 0;
      if (reviewCount === 0) return 50; // neutral score for no reviews
      return Math.min(100, (averageRating * 20) + Math.log(reviewCount) * 5);
    }
  }
};

const calculateQualityScore = (supplier) => {
  let totalScore = 0;
  let totalWeight = 0;
  
  Object.entries(QualityFactors).forEach(([key, factor]) => {
    const score = factor.calculate(supplier);
    totalScore += score * factor.weight;
    totalWeight += factor.weight;
  });
  
  return Math.round(totalScore / totalWeight);
};
```

### 2.3 Duplicate Detection & Merging

#### 2.3.1 Fuzzy Matching Algorithm
```javascript
// Advanced Duplicate Detection System
const DuplicateDetector = {
  // Levenshtein distance with normalization
  stringDistance: (str1, str2) => {
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const a = normalize(str1);
    const b = normalize(str2);
    
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }
    
    return 1 - (matrix[b.length][a.length] / Math.max(a.length, b.length));
  },
  
  // Geographic proximity check
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  },
  
  // Comprehensive duplicate detection
  findDuplicates: (supplier, allSuppliers) => {
    const candidates = allSuppliers.filter(s => s.id !== supplier.id);
    const scores = candidates.map(candidate => {
      let score = 0;
      let factors = 0;
      
      // Name similarity (weight: 0.4)
      if (supplier.name && candidate.name) {
        score += this.stringDistance(supplier.name, candidate.name) * 0.4;
        factors += 0.4;
      }
      
      // Phone similarity (weight: 0.3)
      if (supplier.phone && candidate.phone) {
        const phoneDistance = this.stringDistance(supplier.phone, candidate.phone);
        score += phoneDistance * 0.3;
        factors += 0.3;
      }
      
      // Geographic proximity (weight: 0.2)
      if (supplier.latitude && candidate.latitude) {
        const distance = this.calculateDistance(
          supplier.latitude, supplier.longitude,
          candidate.latitude, candidate.longitude
        );
        const proximityScore = distance < 1 ? 1 : Math.max(0, 1 - (distance / 10));
        score += proximityScore * 0.2;
        factors += 0.2;
      }
      
      // Address similarity (weight: 0.1)
      if (supplier.address && candidate.address) {
        score += this.stringDistance(supplier.address, candidate.address) * 0.1;
        factors += 0.1;
      }
      
      return {
        candidate,
        score: factors > 0 ? score / factors : 0,
        confidence: factors
      };
    });
    
    return scores
      .filter(s => s.score > 0.7 && s.confidence > 0.5)
      .sort((a, b) => b.score - a.score);
  }
};
```

### 2.4 Google Places Integration Monitoring

#### 2.4.1 Sync Status Dashboard
```
┌─────────────────────────────────────────────────────────┐
│           Google Places Integration Monitor             │
├─────────────────────────────────────────────────────────┤
│ • Last Sync Timestamp (per geographic region)          │
│ • API Rate Limit Utilization (current vs maximum)      │
│ • Sync Success Rate (successful vs failed requests)    │
│ • Data Freshness Indicators (age of each record)       │
│ • Error Log Analysis (categorized failure reasons)     │
│ • Performance Metrics (response times, throughput)     │
│ • Cost Tracking (API usage vs budget allocation)       │
└─────────────────────────────────────────────────────────┘
```

### 2.5 Supplier Communication Tools

#### 2.5.1 Multi-Channel Communication Hub
```javascript
// Supplier Communication Management System
const CommunicationChannels = {
  EMAIL: {
    templates: {
      verification_request: 'email_verification_template.html',
      approval_notification: 'supplier_approved_template.html',
      data_update_request: 'data_update_template.html',
      performance_report: 'monthly_performance_template.html'
    },
    
    sendBulkEmail: async (recipients, template, variables) => {
      // Implementation for bulk email sending
      const results = await Promise.allSettled(
        recipients.map(recipient => 
          emailService.send({
            to: recipient.email,
            template: template,
            variables: { ...variables, ...recipient.customData }
          })
        )
      );
      
      return {
        sent: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        errors: results.filter(r => r.status === 'rejected').map(r => r.reason)
      };
    }
  },
  
  SMS: {
    sendVerificationCode: async (phoneNumber) => {
      const code = Math.floor(100000 + Math.random() * 900000);
      await smsService.send(phoneNumber, `Your Rawgle verification code: ${code}`);
      return code;
    }
  },
  
  AUTOMATED_CALLS: {
    scheduleVerificationCall: async (supplierId, phoneNumber) => {
      return await callService.schedule({
        supplier_id: supplierId,
        phone: phoneNumber,
        script: 'supplier_verification_script',
        callback_url: '/api/supplier/verification-callback'
      });
    }
  }
};
```

---

## 3. Technical Operations Interface

### 3.1 System Health Monitoring

#### 3.1.1 Infrastructure Monitoring Dashboard
```
┌─────────────────────────────────────────────────────────┐
│               System Health Overview                    │
├─────────────────────────────────────────────────────────┤
│ • Service Status Grid (all microservices)              │
│   - API Gateway: ✅ Healthy (2ms avg response)         │
│   - User Service: ✅ Healthy (15ms avg response)       │
│   - Supplier Service: ⚠️  Warning (125ms avg response) │
│   - PAWS Token Service: ✅ Healthy (8ms avg response)  │
│   - Claude AI Integration: ✅ Healthy (350ms avg)      │
│                                                         │
│ • Database Performance                                  │
│   - Query Performance: P95 < 50ms ✅                   │
│   - Connection Pool: 45/100 active ✅                  │
│   - Slow Query Count: 3 in last hour ⚠️               │
│                                                         │
│ • Infrastructure Metrics                               │
│   - CPU Usage: 34% average across nodes               │
│   - Memory Usage: 67% average across nodes            │
│   - Disk I/O: Normal (< 1000 IOPS)                    │
│   - Network: 2.3 Gbps throughput                      │
└─────────────────────────────────────────────────────────┘
```

#### 3.1.2 Intelligent Alerting System
```javascript
// Advanced Alerting Configuration
const AlertingRules = {
  CRITICAL: {
    conditions: [
      {
        metric: 'api_error_rate',
        threshold: 0.05, // 5% error rate
        duration: '2m',
        action: 'page_oncall'
      },
      {
        metric: 'database_connection_failures',
        threshold: 10,
        duration: '1m',
        action: 'page_oncall'
      },
      {
        metric: 'payment_processing_failures',
        threshold: 0.01, // 1% failure rate
        duration: '1m',
        action: 'page_oncall'
      }
    ]
  },
  
  WARNING: {
    conditions: [
      {
        metric: 'response_time_p95',
        threshold: 1000, // 1 second
        duration: '5m',
        action: 'slack_notification'
      },
      {
        metric: 'claude_ai_latency',
        threshold: 2000, // 2 seconds
        duration: '3m',
        action: 'email_team'
      }
    ]
  },
  
  PREDICTIVE: {
    conditions: [
      {
        metric: 'user_growth_rate',
        algorithm: 'linear_regression',
        prediction_horizon: '7d',
        threshold: '150k_active_users',
        action: 'capacity_planning_alert'
      }
    ]
  }
};
```

### 3.2 Database Performance Optimization Tools

#### 3.2.1 Query Performance Analyzer
```sql
-- Database Performance Monitoring Queries

-- Slow Query Analysis
CREATE VIEW slow_queries AS
SELECT 
  query_id,
  query_text,
  avg_duration_ms,
  call_count,
  total_duration_ms,
  avg_duration_ms * call_count as impact_score
FROM query_stats 
WHERE avg_duration_ms > 100
ORDER BY impact_score DESC;

-- Index Usage Analysis
CREATE VIEW index_performance AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  CASE WHEN idx_scan = 0 THEN 'UNUSED'
       WHEN idx_scan < 100 THEN 'LOW_USAGE'
       ELSE 'ACTIVE'
  END as usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Table Bloat Detection
CREATE VIEW table_bloat AS
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) as total_size,
  pg_size_pretty(pg_relation_size(tablename::regclass)) as table_size,
  (pg_total_relation_size(tablename::regclass) - pg_relation_size(tablename::regclass)) as index_size,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

#### 3.2.2 Automated Performance Optimization
```javascript
// Database Optimization Automation
const DatabaseOptimizer = {
  analyzeQueryPerformance: async () => {
    const slowQueries = await db.query(`
      SELECT query_id, query_text, avg_duration_ms, call_count
      FROM slow_queries 
      WHERE avg_duration_ms > 500
      LIMIT 20
    `);
    
    const recommendations = slowQueries.map(query => {
      const suggestions = [];
      
      // Check for missing indexes
      if (query.query_text.includes('WHERE') && !query.query_text.includes('INDEX')) {
        suggestions.push('Consider adding index on filtered columns');
      }
      
      // Check for inefficient JOINs
      if (query.query_text.includes('JOIN') && query.avg_duration_ms > 1000) {
        suggestions.push('Review JOIN conditions and consider denormalization');
      }
      
      // Check for full table scans
      if (query.avg_duration_ms > 2000 && query.query_text.includes('suppliers')) {
        suggestions.push('Large table scan detected - add appropriate indexes');
      }
      
      return {
        query_id: query.query_id,
        current_performance: query.avg_duration_ms,
        recommendations: suggestions
      };
    });
    
    return recommendations;
  },
  
  generateIndexRecommendations: async () => {
    // Analyze query patterns to suggest new indexes
    const queryPatterns = await db.query(`
      SELECT 
        table_name,
        column_name,
        COUNT(*) as usage_frequency
      FROM query_analysis 
      WHERE condition_type = 'WHERE'
      GROUP BY table_name, column_name
      HAVING COUNT(*) > 100
      ORDER BY usage_frequency DESC
    `);
    
    return queryPatterns.map(pattern => ({
      table: pattern.table_name,
      column: pattern.column_name,
      frequency: pattern.usage_frequency,
      suggested_index: `CREATE INDEX idx_${pattern.table_name}_${pattern.column_name} ON ${pattern.table_name}(${pattern.column_name});`
    }));
  }
};
```

### 3.3 API Security Controls

#### 3.3.1 Rate Limiting & Throttling
```javascript
// Advanced Rate Limiting System
const RateLimitingConfig = {
  tiers: {
    FREE: {
      requests_per_minute: 60,
      requests_per_hour: 1000,
      burst_allowance: 10
    },
    PREMIUM: {
      requests_per_minute: 300,
      requests_per_hour: 10000,
      burst_allowance: 50
    },
    ENTERPRISE: {
      requests_per_minute: 1000,
      requests_per_hour: 50000,
      burst_allowance: 200
    }
  },
  
  endpoints: {
    '/api/search': {
      weight: 1,
      special_limits: {
        anonymous: { rpm: 20, rph: 200 }
      }
    },
    '/api/supplier/create': {
      weight: 5,
      requires_auth: true,
      additional_validation: true
    },
    '/api/admin/*': {
      weight: 2,
      requires_admin: true,
      ip_whitelist_only: true
    }
  },
  
  security_measures: {
    suspicious_pattern_detection: true,
    progressive_delays: true, // Increase delay with repeated violations
    temporary_bans: true,
    geographic_restrictions: ['CN', 'RU'], // Block specific countries
    user_agent_filtering: true
  }
};

// Implementation of Sliding Window Rate Limiter
class SlidingWindowRateLimiter {
  constructor(redis, config) {
    this.redis = redis;
    this.config = config;
  }
  
  async checkLimit(userId, endpoint, userTier = 'FREE') {
    const limits = this.config.tiers[userTier];
    const endpointConfig = this.config.endpoints[endpoint] || {};
    const weight = endpointConfig.weight || 1;
    
    const minuteKey = `rate_limit:${userId}:${Math.floor(Date.now() / 60000)}`;
    const hourKey = `rate_limit:${userId}:${Math.floor(Date.now() / 3600000)}`;
    
    const [minuteCount, hourCount] = await Promise.all([
      this.redis.incrby(minuteKey, weight),
      this.redis.incrby(hourKey, weight)
    ]);
    
    // Set expiration if it's a new key
    if (minuteCount === weight) await this.redis.expire(minuteKey, 60);
    if (hourCount === weight) await this.redis.expire(hourKey, 3600);
    
    const allowed = {
      minute: minuteCount <= limits.requests_per_minute,
      hour: hourCount <= limits.requests_per_hour
    };
    
    return {
      allowed: allowed.minute && allowed.hour,
      current: { minute: minuteCount, hour: hourCount },
      limits: { minute: limits.requests_per_minute, hour: limits.requests_per_hour },
      reset_in: 60 - (Date.now() % 60000) / 1000 // seconds until minute reset
    };
  }
}
```

### 3.4 Integration Monitoring

#### 3.4.1 Service Health Checks
```javascript
// Comprehensive Integration Monitoring
const IntegrationMonitor = {
  services: {
    CLAUDE_AI: {
      endpoint: 'https://api.anthropic.com/v1/health',
      timeout: 5000,
      expected_response: { status: 'healthy' },
      sla_target: 99.9,
      check_interval: 30000 // 30 seconds
    },
    
    SUPABASE: {
      endpoint: 'https://your-project.supabase.co/rest/v1/health',
      timeout: 3000,
      auth_required: true,
      sla_target: 99.95,
      check_interval: 15000 // 15 seconds
    },
    
    AWS_LAMBDA: {
      endpoint: 'https://your-lambda-url.lambda-url.region.on.aws/health',
      timeout: 10000,
      sla_target: 99.5,
      check_interval: 60000 // 1 minute
    },
    
    GOOGLE_PLACES: {
      test_query: 'pet store near Los Angeles',
      timeout: 8000,
      sla_target: 99.0,
      check_interval: 300000 // 5 minutes
    }
  },
  
  async performHealthCheck(serviceName) {
    const service = this.services[serviceName];
    const startTime = Date.now();
    
    try {
      let response;
      
      if (serviceName === 'GOOGLE_PLACES') {
        response = await this.testGooglePlacesAPI(service.test_query);
      } else {
        response = await fetch(service.endpoint, {
          method: 'GET',
          timeout: service.timeout,
          headers: service.auth_required ? {
            'Authorization': `Bearer ${process.env.SUPABASE_KEY}`
          } : {}
        });
      }
      
      const duration = Date.now() - startTime;
      const isHealthy = response.ok || response.status === 200;
      
      await this.recordHealthMetric(serviceName, {
        timestamp: new Date(),
        status: isHealthy ? 'healthy' : 'unhealthy',
        response_time: duration,
        error: isHealthy ? null : await response.text()
      });
      
      return {
        service: serviceName,
        healthy: isHealthy,
        response_time: duration,
        timestamp: new Date()
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await this.recordHealthMetric(serviceName, {
        timestamp: new Date(),
        status: 'error',
        response_time: duration,
        error: error.message
      });
      
      return {
        service: serviceName,
        healthy: false,
        response_time: duration,
        error: error.message,
        timestamp: new Date()
      };
    }
  },
  
  async calculateSLA(serviceName, timeframe = '24h') {
    const metrics = await db.query(`
      SELECT 
        COUNT(*) as total_checks,
        COUNT(CASE WHEN status = 'healthy' THEN 1 END) as healthy_checks,
        AVG(response_time) as avg_response_time
      FROM health_metrics 
      WHERE service_name = ? 
        AND timestamp > datetime('now', '-${timeframe}')
    `, [serviceName]);
    
    const uptime = (metrics.healthy_checks / metrics.total_checks) * 100;
    const service = this.services[serviceName];
    
    return {
      service: serviceName,
      uptime_percentage: uptime,
      sla_target: service.sla_target,
      sla_met: uptime >= service.sla_target,
      avg_response_time: metrics.avg_response_time,
      total_checks: metrics.total_checks
    };
  }
};
```

### 3.5 A/B Testing Framework

#### 3.5.1 Feature Flag Management
```javascript
// A/B Testing and Feature Flag System
const FeatureFlagManager = {
  flags: {
    NEW_SUPPLIER_ONBOARDING: {
      enabled: true,
      rollout_percentage: 25,
      user_segments: ['premium', 'enterprise'],
      start_date: '2025-08-21',
      end_date: '2025-09-21',
      success_metrics: ['conversion_rate', 'time_to_verification']
    },
    
    ENHANCED_SEARCH_ALGORITHM: {
      enabled: true,
      rollout_percentage: 50,
      geographic_targeting: ['US', 'CA', 'UK'],
      success_metrics: ['search_satisfaction', 'click_through_rate']
    },
    
    PAWS_TOKEN_MULTIPLIER: {
      enabled: false,
      rollout_percentage: 10,
      requires_admin_approval: true,
      success_metrics: ['user_engagement', 'token_earning_rate']
    }
  },
  
  async evaluateFlag(flagName, userId, userContext = {}) {
    const flag = this.flags[flagName];
    if (!flag || !flag.enabled) return false;
    
    // Check date range
    const now = new Date();
    if (flag.start_date && new Date(flag.start_date) > now) return false;
    if (flag.end_date && new Date(flag.end_date) < now) return false;
    
    // Check user segments
    if (flag.user_segments && !flag.user_segments.includes(userContext.segment)) {
      return false;
    }
    
    // Check geographic targeting
    if (flag.geographic_targeting && !flag.geographic_targeting.includes(userContext.country)) {
      return false;
    }
    
    // Deterministic rollout based on user ID
    const hash = this.hashUserId(userId + flagName);
    const userBucket = hash % 100;
    
    const enabled = userBucket < flag.rollout_percentage;
    
    // Log the evaluation for analytics
    await this.logFlagEvaluation(flagName, userId, enabled, userContext);
    
    return enabled;
  },
  
  async trackMetric(flagName, userId, metricName, value) {
    await db.query(`
      INSERT INTO ab_test_metrics (
        flag_name, user_id, metric_name, metric_value, timestamp
      ) VALUES (?, ?, ?, ?, ?)
    `, [flagName, userId, metricName, value, new Date()]);
  },
  
  async getTestResults(flagName) {
    const results = await db.query(`
      SELECT 
        flag_enabled,
        metric_name,
        COUNT(*) as sample_size,
        AVG(metric_value) as avg_value,
        STDDEV(metric_value) as std_dev,
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value
      FROM ab_test_metrics m
      JOIN flag_evaluations f ON m.user_id = f.user_id AND m.flag_name = f.flag_name
      WHERE m.flag_name = ?
      GROUP BY flag_enabled, metric_name
    `, [flagName]);
    
    // Calculate statistical significance
    const analysis = this.calculateStatisticalSignificance(results);
    
    return {
      flag_name: flagName,
      test_duration: this.getTestDuration(flagName),
      results: results,
      statistical_analysis: analysis,
      recommendation: this.generateRecommendation(analysis)
    };
  }
};
```

---

## 4. RESTful API Architecture

### 4.1 API Design Principles

#### 4.1.1 Resource-Based URL Structure
```
Management API Endpoints Structure:

/api/v1/admin/
├── users/
│   ├── GET    /               # List users with filtering
│   ├── POST   /               # Create new user
│   ├── GET    /{id}           # Get user details
│   ├── PUT    /{id}           # Update user
│   ├── DELETE /{id}           # Delete user
│   ├── POST   /{id}/roles     # Assign roles
│   └── GET    /{id}/activity  # User activity log
│
├── suppliers/
│   ├── GET    /               # List suppliers with quality scores
│   ├── POST   /               # Create supplier
│   ├── GET    /{id}           # Get supplier details
│   ├── PUT    /{id}           # Update supplier
│   ├── DELETE /{id}           # Delete supplier
│   ├── POST   /{id}/verify    # Trigger verification
│   ├── GET    /{id}/duplicates # Find potential duplicates
│   ├── POST   /{id}/merge     # Merge with duplicate
│   └── GET    /{id}/analytics # Supplier performance metrics
│
├── reviews/
│   ├── GET    /               # List reviews for moderation
│   ├── PUT    /{id}/approve   # Approve review
│   ├── PUT    /{id}/reject    # Reject review
│   ├── POST   /{id}/flag      # Flag for manual review
│   └── GET    /stats          # Moderation statistics
│
├── tokens/
│   ├── GET    /economics      # PAWS token economics dashboard
│   ├── GET    /distribution   # Token distribution analytics
│   ├── POST   /emergency-stop # Emergency token controls
│   ├── PUT    /reward-rates   # Adjust reward rates
│   └── GET    /fraud-alerts   # Suspicious activity alerts
│
├── system/
│   ├── GET    /health         # System health overview
│   ├── GET    /metrics        # Performance metrics
│   ├── GET    /integrations   # Integration status
│   ├── POST   /maintenance    # Schedule maintenance
│   └── GET    /audit-logs     # System audit trail
│
└── analytics/
    ├── GET    /dashboard      # Main analytics dashboard
    ├── GET    /users          # User analytics
    ├── GET    /suppliers      # Supplier analytics
    ├── GET    /performance    # Platform performance
    └── POST   /reports        # Generate custom reports
```

### 4.2 Role-Based Access Control Implementation

#### 4.2.1 Permission Matrix
```javascript
// Comprehensive RBAC System
const PermissionMatrix = {
  SUPER_ADMIN: {
    users: ['create', 'read', 'update', 'delete', 'manage_roles'],
    suppliers: ['create', 'read', 'update', 'delete', 'verify', 'merge'],
    reviews: ['read', 'approve', 'reject', 'delete'],
    tokens: ['read', 'manage', 'emergency_controls'],
    system: ['read', 'configure', 'maintenance'],
    analytics: ['read', 'export', 'configure']
  },
  
  OPERATIONS_MANAGER: {
    users: ['read', 'update'],
    suppliers: ['read', 'update', 'verify'],
    reviews: ['read', 'approve', 'reject'],
    tokens: ['read', 'view_alerts'],
    system: ['read'],
    analytics: ['read', 'export']
  },
  
  CONTENT_MODERATOR: {
    users: ['read'],
    suppliers: ['read'],
    reviews: ['read', 'approve', 'reject', 'flag'],
    tokens: [],
    system: [],
    analytics: ['read']
  },
  
  DATA_ANALYST: {
    users: ['read'],
    suppliers: ['read'],
    reviews: ['read'],
    tokens: ['read'],
    system: ['read'],
    analytics: ['read', 'export', 'create_reports']
  },
  
  SUPPORT_AGENT: {
    users: ['read', 'update'],
    suppliers: ['read', 'update'],
    reviews: ['read'],
    tokens: [],
    system: [],
    analytics: ['read']
  }
};

// Middleware for permission checking
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user.role;
      const permissions = PermissionMatrix[userRole];
      
      if (!permissions || !permissions[resource] || !permissions[resource].includes(action)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: `${resource}:${action}`,
          user_role: userRole
        });
      }
      
      // Log the permission check for audit
      await auditLogger.log({
        user_id: req.user.id,
        action: `${resource}:${action}`,
        resource_id: req.params.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date()
      });
      
      next();
    } catch (error) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};
```

### 4.3 API Versioning Strategy

#### 4.3.1 Backwards-Compatible Versioning
```javascript
// API Versioning Implementation
const APIVersioning = {
  current_version: 'v1',
  supported_versions: ['v1'],
  deprecated_versions: [],
  
  middleware: (req, res, next) => {
    // Extract version from URL, header, or default to current
    const urlVersion = req.path.match(/^\/api\/(v\d+)\//)?.[1];
    const headerVersion = req.get('API-Version');
    const version = urlVersion || headerVersion || APIVersioning.current_version;
    
    if (!APIVersioning.supported_versions.includes(version)) {
      return res.status(400).json({
        error: 'Unsupported API version',
        supported_versions: APIVersioning.supported_versions,
        requested_version: version
      });
    }
    
    if (APIVersioning.deprecated_versions.includes(version)) {
      res.set('API-Deprecation', 'true');
      res.set('Sunset', '2025-12-31T23:59:59Z');
    }
    
    req.api_version = version;
    next();
  },
  
  // Version-specific response formatting
  formatResponse: (data, version, endpoint) => {
    switch (version) {
      case 'v1':
        return {
          data: data,
          meta: {
            version: version,
            timestamp: new Date().toISOString(),
            endpoint: endpoint
          }
        };
      
      // Future version handling
      case 'v2':
        return {
          result: data,
          metadata: {
            api_version: version,
            generated_at: new Date().toISOString()
          }
        };
      
      default:
        return data;
    }
  }
};
```

### 4.4 Comprehensive Audit Logging

#### 4.4.1 Audit Trail Implementation
```javascript
// Comprehensive Audit Logging System
const AuditLogger = {
  async log(action, details = {}) {
    const auditEntry = {
      id: generateUUID(),
      timestamp: new Date(),
      action: action.type,
      actor_id: action.user_id,
      actor_role: action.user_role,
      resource_type: action.resource_type,
      resource_id: action.resource_id,
      changes: action.changes || null,
      ip_address: action.ip_address,
      user_agent: action.user_agent,
      session_id: action.session_id,
      success: action.success,
      error_message: action.error_message || null,
      metadata: details
    };
    
    // Store in database
    await db.query(`
      INSERT INTO audit_logs (
        id, timestamp, action, actor_id, actor_role, 
        resource_type, resource_id, changes, ip_address, 
        user_agent, session_id, success, error_message, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, Object.values(auditEntry));
    
    // Also log to external audit service for compliance
    if (process.env.EXTERNAL_AUDIT_ENABLED === 'true') {
      await this.sendToExternalAuditService(auditEntry);
    }
    
    return auditEntry.id;
  },
  
  // Middleware to automatically log API actions
  middleware: (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      const action = {
        type: `${req.method} ${req.path}`,
        user_id: req.user?.id,
        user_role: req.user?.role,
        resource_type: req.path.split('/')[3], // Extract from /api/v1/resource
        resource_id: req.params.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        session_id: req.sessionID,
        success: res.statusCode < 400,
        error_message: res.statusCode >= 400 ? data : null
      };
      
      // Log the action (don't await to avoid blocking response)
      AuditLogger.log(action).catch(console.error);
      
      return originalSend.call(this, data);
    };
    
    next();
  },
  
  // Query audit logs with advanced filtering
  async query(filters = {}) {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    
    if (filters.user_id) {
      sql += ' AND actor_id = ?';
      params.push(filters.user_id);
    }
    
    if (filters.action) {
      sql += ' AND action LIKE ?';
      params.push(`%${filters.action}%`);
    }
    
    if (filters.resource_type) {
      sql += ' AND resource_type = ?';
      params.push(filters.resource_type);
    }
    
    if (filters.date_from) {
      sql += ' AND timestamp >= ?';
      params.push(filters.date_from);
    }
    
    if (filters.date_to) {
      sql += ' AND timestamp <= ?';
      params.push(filters.date_to);
    }
    
    if (filters.success !== undefined) {
      sql += ' AND success = ?';
      params.push(filters.success);
    }
    
    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(filters.limit || 100, filters.offset || 0);
    
    return await db.query(sql, params);
  }
};
```

### 4.5 Real-Time WebSocket Updates

#### 4.5.1 WebSocket Event System
```javascript
// Real-Time Update System using WebSockets
const WebSocketManager = {
  connections: new Map(), // userId -> Set of WebSocket connections
  
  // Register user connection
  registerConnection: (userId, ws, permissions) => {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    
    this.connections.get(userId).add(ws);
    
    // Store user permissions with connection
    ws.userId = userId;
    ws.permissions = permissions;
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connection_established',
      timestamp: new Date().toISOString(),
      permissions: permissions
    }));
    
    // Handle connection close
    ws.on('close', () => {
      this.connections.get(userId)?.delete(ws);
      if (this.connections.get(userId)?.size === 0) {
        this.connections.delete(userId);
      }
    });
  },
  
  // Broadcast update to relevant users
  broadcastUpdate: (eventType, data, requiredPermission = null) => {
    const message = JSON.stringify({
      type: eventType,
      data: data,
      timestamp: new Date().toISOString()
    });
    
    this.connections.forEach((userConnections, userId) => {
      userConnections.forEach(ws => {
        // Check if user has required permission
        if (requiredPermission && !this.hasPermission(ws.permissions, requiredPermission)) {
          return;
        }
        
        try {
          ws.send(message);
        } catch (error) {
          console.error(`Failed to send message to user ${userId}:`, error);
          userConnections.delete(ws);
        }
      });
    });
  },
  
  // Send update to specific user
  sendToUser: (userId, eventType, data) => {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return;
    
    const message = JSON.stringify({
      type: eventType,
      data: data,
      timestamp: new Date().toISOString()
    });
    
    userConnections.forEach(ws => {
      try {
        ws.send(message);
      } catch (error) {
        console.error(`Failed to send message to user ${userId}:`, error);
        userConnections.delete(ws);
      }
    });
  },
  
  hasPermission: (userPermissions, requiredPermission) => {
    const [resource, action] = requiredPermission.split(':');
    return userPermissions[resource]?.includes(action) || false;
  }
};

// Event handlers for different updates
const RealtimeEvents = {
  // Supplier verification status change
  onSupplierVerificationUpdate: (supplierId, status) => {
    WebSocketManager.broadcastUpdate(
      'supplier_verification_update',
      { supplier_id: supplierId, status: status },
      'suppliers:read'
    );
  },
  
  // New review submitted for moderation
  onReviewSubmitted: (reviewData) => {
    WebSocketManager.broadcastUpdate(
      'new_review_submitted',
      reviewData,
      'reviews:read'
    );
  },
  
  // System health alert
  onSystemAlert: (alertData) => {
    WebSocketManager.broadcastUpdate(
      'system_alert',
      alertData,
      'system:read'
    );
  },
  
  // PAWS token fraud alert
  onTokenFraudAlert: (alertData) => {
    WebSocketManager.broadcastUpdate(
      'token_fraud_alert',
      alertData,
      'tokens:view_alerts'
    );
  }
};
```

---

## 5. Database Schema Extensions

### 5.1 Administrative Tables

#### 5.1.1 User Roles & Permissions Schema
```sql
-- Administrative User Management Tables

-- Admin users table (extends main users table)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN (
    'SUPER_ADMIN', 'OPERATIONS_MANAGER', 'CONTENT_MODERATOR', 
    'DATA_ANALYST', 'SUPPORT_AGENT', 'DEVELOPER'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES admin_users(id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id)
);

-- Role permissions table for fine-grained control
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(role, resource, action)
);

-- User-specific permission overrides
CREATE TABLE user_permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL,
  reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES admin_users(id),
  
  UNIQUE(admin_user_id, resource, action)
);

-- Admin sessions for enhanced security tracking
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  INDEX idx_admin_sessions_token (session_token),
  INDEX idx_admin_sessions_user_active (admin_user_id, is_active),
  INDEX idx_admin_sessions_expires (expires_at)
);
```

### 5.2 Audit & Logging Tables

#### 5.2.1 Comprehensive Audit Schema
```sql
-- Comprehensive audit logging system
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  action VARCHAR(100) NOT NULL,
  actor_id UUID REFERENCES users(id),
  actor_role VARCHAR(50),
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB, -- Before/after values for updates
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  success BOOLEAN NOT NULL,
  error_message TEXT,
  metadata JSONB,
  
  INDEX idx_audit_logs_timestamp (timestamp),
  INDEX idx_audit_logs_actor (actor_id),
  INDEX idx_audit_logs_resource (resource_type, resource_id),
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_success (success)
);

-- Partition audit_logs by month for better performance
CREATE TABLE audit_logs_y2025m08 PARTITION OF audit_logs
FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
-- Continue with additional monthly partitions...

-- System events log (for technical monitoring)
CREATE TABLE system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  service_name VARCHAR(50),
  message TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES admin_users(id),
  
  INDEX idx_system_events_timestamp (timestamp),
  INDEX idx_system_events_type (event_type),
  INDEX idx_system_events_severity (severity),
  INDEX idx_system_events_unresolved (resolved) WHERE NOT resolved
);

-- Data change tracking for sensitive tables
CREATE TABLE data_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  change_reason TEXT,
  
  INDEX idx_data_changes_table_record (table_name, record_id),
  INDEX idx_data_changes_timestamp (changed_at),
  INDEX idx_data_changes_user (changed_by)
);
```

### 5.3 Supplier Management Schema Extensions

#### 5.3.1 Enhanced Supplier Tracking
```sql
-- Enhanced supplier management tables

-- Supplier verification tracking
CREATE TABLE supplier_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN (
    'PHONE', 'EMAIL', 'BUSINESS_LICENSE', 'GOOGLE_PLACES', 'MANUAL_REVIEW'
  )),
  status VARCHAR(20) NOT NULL CHECK (status IN (
    'PENDING', 'IN_PROGRESS', 'VERIFIED', 'FAILED', 'EXPIRED'
  )),
  verification_data JSONB, -- Store verification-specific data
  verified_by UUID REFERENCES admin_users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_supplier_verifications_supplier (supplier_id),
  INDEX idx_supplier_verifications_status (status),
  INDEX idx_supplier_verifications_expires (expires_at),
  UNIQUE(supplier_id, verification_type)
);

-- Supplier quality scores with historical tracking
CREATE TABLE supplier_quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  score_breakdown JSONB NOT NULL, -- Detailed score components
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  calculation_version VARCHAR(10) NOT NULL, -- Track scoring algorithm versions
  
  INDEX idx_supplier_quality_supplier (supplier_id),
  INDEX idx_supplier_quality_score (score),
  INDEX idx_supplier_quality_calculated (calculated_at)
);

-- Duplicate detection results
CREATE TABLE supplier_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  potential_duplicate_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  similarity_score DECIMAL(5,4) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  similarity_factors JSONB NOT NULL, -- What factors contributed to the match
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'CONFIRMED_DUPLICATE', 'NOT_DUPLICATE', 'MERGED'
  )),
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  merge_target_id UUID REFERENCES suppliers(id), -- Which supplier to keep
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_supplier_duplicates_supplier (supplier_id),
  INDEX idx_supplier_duplicates_status (status),
  INDEX idx_supplier_duplicates_score (similarity_score),
  UNIQUE(supplier_id, potential_duplicate_id)
);

-- Google Places sync tracking
CREATE TABLE google_places_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  place_id VARCHAR(255),
  sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN (
    'INITIAL_IMPORT', 'UPDATE_CHECK', 'FULL_REFRESH', 'VERIFICATION'
  )),
  status VARCHAR(20) NOT NULL CHECK (status IN (
    'SUCCESS', 'FAILED', 'PARTIAL', 'RATE_LIMITED'
  )),
  changes_detected JSONB, -- What fields were updated
  api_response JSONB, -- Store raw API response for debugging
  sync_duration_ms INTEGER,
  error_message TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_google_sync_supplier (supplier_id),
  INDEX idx_google_sync_status (status),
  INDEX idx_google_sync_timestamp (synced_at),
  INDEX idx_google_sync_place (place_id)
);
```

### 5.4 System Metrics & Monitoring

#### 5.4.1 Performance Monitoring Schema
```sql
-- System performance metrics
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,6) NOT NULL,
  metric_unit VARCHAR(20),
  service_name VARCHAR(50),
  instance_id VARCHAR(100),
  tags JSONB, -- Additional metadata like region, environment, etc.
  
  INDEX idx_system_metrics_timestamp (timestamp),
  INDEX idx_system_metrics_name (metric_name),
  INDEX idx_system_metrics_service (service_name),
  INDEX idx_system_metrics_composite (metric_name, service_name, timestamp)
);

-- Partition system_metrics by day for better performance
CREATE TABLE system_metrics_y2025m08d21 PARTITION OF system_metrics
FOR VALUES FROM ('2025-08-21 00:00:00+00') TO ('2025-08-22 00:00:00+00');
-- Continue with additional daily partitions...

-- API performance tracking
CREATE TABLE api_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  user_id UUID REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  request_size INTEGER,
  response_size INTEGER,
  
  INDEX idx_api_performance_timestamp (timestamp),
  INDEX idx_api_performance_endpoint (endpoint),
  INDEX idx_api_performance_status (status_code),
  INDEX idx_api_performance_response_time (response_time_ms)
);

-- Database performance tracking
CREATE TABLE db_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  query_hash VARCHAR(64) NOT NULL, -- Hash of the query for grouping
  query_text TEXT,
  execution_time_ms DECIMAL(10,3) NOT NULL,
  rows_examined INTEGER,
  rows_returned INTEGER,
  table_name VARCHAR(100),
  operation_type VARCHAR(20) CHECK (operation_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  
  INDEX idx_db_performance_timestamp (timestamp),
  INDEX idx_db_performance_hash (query_hash),
  INDEX idx_db_performance_execution_time (execution_time_ms),
  INDEX idx_db_performance_table (table_name)
);

-- Integration health monitoring
CREATE TABLE integration_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  service_name VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255),
  status VARCHAR(20) NOT NULL CHECK (status IN ('HEALTHY', 'DEGRADED', 'DOWN', 'UNKNOWN')),
  response_time_ms INTEGER,
  error_message TEXT,
  success_rate DECIMAL(5,4), -- Success rate over last measurement period
  
  INDEX idx_integration_health_timestamp (timestamp),
  INDEX idx_integration_health_service (service_name),
  INDEX idx_integration_health_status (status)
);
```

### 5.5 Optimized Indexes for Scale

#### 5.5.1 Performance Optimization Indexes
```sql
-- Indexes optimized for 150k+ suppliers and high query volume

-- Supplier search and filtering indexes
CREATE INDEX idx_suppliers_search_vector ON suppliers USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

CREATE INDEX idx_suppliers_location ON suppliers (latitude, longitude);
CREATE INDEX idx_suppliers_quality_score ON suppliers (quality_score DESC) WHERE quality_score IS NOT NULL;
CREATE INDEX idx_suppliers_verification_status ON suppliers (verification_status);
CREATE INDEX idx_suppliers_created_at ON suppliers (created_at DESC);

-- Composite indexes for common admin queries
CREATE INDEX idx_suppliers_admin_list ON suppliers (
  verification_status, quality_score DESC, created_at DESC
) WHERE deleted_at IS NULL;

-- User activity indexes for admin dashboard
CREATE INDEX idx_users_activity ON users (last_login DESC, created_at DESC);
CREATE INDEX idx_users_role_status ON users (role, status, created_at DESC);

-- Review moderation indexes
CREATE INDEX idx_reviews_moderation ON reviews (
  moderation_status, created_at DESC
) WHERE moderation_status IN ('PENDING', 'FLAGGED');

-- PAWS token transaction indexes
CREATE INDEX idx_token_transactions_user_time ON token_transactions (
  user_id, created_at DESC
);
CREATE INDEX idx_token_transactions_type_amount ON token_transactions (
  transaction_type, amount DESC, created_at DESC
);

-- Audit log performance indexes
CREATE INDEX idx_audit_logs_recent ON audit_logs (
  timestamp DESC, actor_id
) WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '30 days';

-- System metrics aggregation indexes
CREATE INDEX idx_system_metrics_aggregation ON system_metrics (
  metric_name, service_name, timestamp DESC
);

-- Partial indexes for active records only
CREATE INDEX idx_suppliers_active_quality ON suppliers (quality_score DESC) 
WHERE deleted_at IS NULL AND status = 'ACTIVE';

CREATE INDEX idx_admin_users_active ON admin_users (role, last_login DESC) 
WHERE is_active = true;
```

---

## 6. Security & Compliance Framework

### 6.1 Data Protection & Privacy

#### 6.1.1 GDPR Compliance Tools
```javascript
// GDPR Compliance Management System
const GDPRCompliance = {
  // Data subject access request handling
  async generateDataExport(userId) {
    const userData = {
      personal_info: await db.query('SELECT * FROM users WHERE id = ?', [userId]),
      admin_activities: await db.query('SELECT * FROM audit_logs WHERE actor_id = ?', [userId]),
      supplier_interactions: await db.query('SELECT * FROM supplier_interactions WHERE user_id = ?', [userId]),
      token_transactions: await db.query('SELECT * FROM token_transactions WHERE user_id = ?', [userId]),
      reviews: await db.query('SELECT * FROM reviews WHERE user_id = ?', [userId])
    };
    
    // Redact sensitive fields
    return this.redactSensitiveData(userData);
  },
  
  // Right to erasure (right to be forgotten)
  async eraseUserData(userId, adminId, reason) {
    const transaction = await db.beginTransaction();
    
    try {
      // Log the erasure request
      await this.logDataErasure(userId, adminId, reason);
      
      // Anonymize rather than delete for audit trail preservation
      await db.query(
        'UPDATE users SET email = ?, name = ?, phone = ?, anonymized_at = ? WHERE id = ?',
        [`anonymous_${userId}@deleted.local`, 'Deleted User', null, new Date(), userId]
      );
      
      // Remove PII from related tables
      await db.query('UPDATE reviews SET author_name = ? WHERE user_id = ?', ['Anonymous', userId]);
      await db.query('UPDATE audit_logs SET actor_id = NULL WHERE actor_id = ?', [userId]);
      
      await transaction.commit();
      return { success: true, erasure_id: generateUUID() };
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  
  // Data retention policy enforcement
  async enforceRetentionPolicies() {
    const policies = {
      audit_logs: '7 years',
      system_metrics: '2 years',
      api_performance: '1 year',
      user_sessions: '30 days'
    };
    
    for (const [table, retention] of Object.entries(policies)) {
      await db.query(
        `DELETE FROM ${table} WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${retention}'`
      );
    }
  }
};
```

### 6.2 Security Monitoring

#### 6.2.1 Advanced Security Analytics
```javascript
// Security monitoring and threat detection
const SecurityMonitor = {
  // Detect suspicious admin activities
  async detectAnomalousActivity(adminUserId) {
    const recentActivities = await db.query(`
      SELECT action, COUNT(*) as count, 
             EXTRACT(HOUR FROM timestamp) as hour
      FROM audit_logs 
      WHERE actor_id = ? 
        AND timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'
      GROUP BY action, hour
    `, [adminUserId]);
    
    const anomalies = [];
    
    // Check for unusual volume of actions
    const totalActions = recentActivities.reduce((sum, row) => sum + row.count, 0);
    if (totalActions > 1000) { // Threshold for high activity
      anomalies.push({
        type: 'HIGH_ACTIVITY_VOLUME',
        severity: 'MEDIUM',
        details: `${totalActions} actions in 24 hours`
      });
    }
    
    // Check for off-hours activity
    const offHoursActivity = recentActivities.filter(row => 
      row.hour < 6 || row.hour > 22
    );
    if (offHoursActivity.length > 10) {
      anomalies.push({
        type: 'OFF_HOURS_ACTIVITY',
        severity: 'LOW',
        details: 'Significant activity outside business hours'
      });
    }
    
    return anomalies;
  },
  
  // Monitor for privilege escalation attempts
  async monitorPrivilegeEscalation() {
    const suspiciousQueries = await db.query(`
      SELECT actor_id, action, COUNT(*) as attempts
      FROM audit_logs 
      WHERE action LIKE '%role%' 
        OR action LIKE '%permission%'
        AND success = false
        AND timestamp > CURRENT_TIMESTAMP - INTERVAL '1 hour'
      GROUP BY actor_id, action
      HAVING COUNT(*) >= 5
    `);
    
    for (const query of suspiciousQueries) {
      await this.triggerSecurityAlert({
        type: 'PRIVILEGE_ESCALATION_ATTEMPT',
        severity: 'HIGH',
        user_id: query.actor_id,
        details: `${query.attempts} failed attempts: ${query.action}`
      });
    }
  }
};
```

---

## 7. Deployment & Scaling Strategy

### 7.1 Microservices Architecture

#### 7.1.1 Service Deployment Configuration
```yaml
# Docker Compose for Management Interface Services
version: '3.8'

services:
  # Admin Dashboard Service
  admin-dashboard:
    build: ./services/admin-dashboard
    ports:
      - "3001:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Supplier Management Service
  supplier-service:
    build: ./services/supplier-management
    ports:
      - "3002:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - GOOGLE_PLACES_API_KEY=${GOOGLE_PLACES_API_KEY}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s

  # Analytics Service
  analytics-service:
    build: ./services/analytics
    ports:
      - "3003:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - CLICKHOUSE_URL=${CLICKHOUSE_URL}
    depends_on:
      - postgres
      - clickhouse

  # Real-time Updates Service
  realtime-service:
    build: ./services/realtime
    ports:
      - "3004:3000"
    environment:
      - REDIS_URL=${REDIS_URL}
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - redis

  # Infrastructure
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: rawgle_management
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  clickhouse:
    image: clickhouse/clickhouse-server:23
    ports:
      - "8123:8123"
      - "9000:9000"
    volumes:
      - clickhouse_data:/var/lib/clickhouse

volumes:
  postgres_data:
  redis_data:
  clickhouse_data:
```

### 7.2 Horizontal Scaling Configuration

#### 7.2.1 Load Balancing & Auto-scaling
```yaml
# Kubernetes deployment for production scaling
apiVersion: apps/v1
kind: Deployment
metadata:
  name: admin-dashboard
spec:
  replicas: 3
  selector:
    matchLabels:
      app: admin-dashboard
  template:
    metadata:
      labels:
        app: admin-dashboard
    spec:
      containers:
      - name: admin-dashboard
        image: rawgle/admin-dashboard:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: admin-dashboard-service
spec:
  selector:
    app: admin-dashboard
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: admin-dashboard-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: admin-dashboard
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## 8. Technology Stack Recommendations

### 8.1 Backend Framework Selection

**Primary Recommendation: Node.js with Express/Fastify**
- **Rationale**: 
  - Excellent ecosystem for real-time features (WebSockets)
  - Strong integration with existing Cloudflare Workers architecture
  - High performance for I/O intensive operations
  - Large talent pool and community support

**Alternative: Python with FastAPI**
- **Rationale**: 
  - Excellent for data analysis and ML integration
  - Strong typing support
  - Automatic API documentation generation
  - Good for complex business logic

### 8.2 Database Technology

**Primary: PostgreSQL with Extensions**
- **Extensions**: PostGIS (location data), pg_stat_statements (monitoring)
- **Rationale**: 
  - ACID compliance for financial transactions (PAWS tokens)
  - Advanced indexing for 150k+ supplier searches
  - JSON support for flexible data storage
  - Excellent performance monitoring tools

**Caching Layer: Redis**
- **Use cases**: Session storage, rate limiting, real-time data
- **Configuration**: Redis Cluster for high availability

### 8.3 Monitoring & Observability

**Recommended Stack:**
- **Application Monitoring**: New Relic or DataDog
- **Infrastructure Monitoring**: Prometheus + Grafana
- **Log Aggregation**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Error Tracking**: Sentry
- **Uptime Monitoring**: PingDom or UptimeRobot

### 8.4 Frontend Technology

**Recommended: React with Next.js**
- **Rationale**: 
  - Server-side rendering for SEO
  - Strong ecosystem and component libraries
  - Good performance optimization features
  - TypeScript support for better code quality

**UI Framework: Tailwind CSS + Headless UI**
- **Benefits**: 
  - Rapid development with utility classes
  - Consistent design system
  - Accessible components out of the box

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Database schema implementation
- [ ] Basic RBAC system
- [ ] Admin user management
- [ ] Audit logging framework
- [ ] API authentication & authorization

### Phase 2: Core Management (Weeks 5-8)
- [ ] Supplier verification workflow
- [ ] Quality scoring algorithm
- [ ] Duplicate detection system
- [ ] Review moderation interface
- [ ] Basic analytics dashboard

### Phase 3: Advanced Features (Weeks 9-12)
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics & reporting
- [ ] A/B testing framework
- [ ] Performance monitoring
- [ ] Integration health monitoring

### Phase 4: Scale & Polish (Weeks 13-16)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Comprehensive testing
- [ ] Documentation completion
- [ ] Production deployment

---

## Conclusion

This management interface architecture provides a comprehensive, scalable solution for administering the Rawgle platform. The design emphasizes:

- **Scalability**: Built to handle 150k+ suppliers with room for growth
- **Security**: Multi-layered security with comprehensive audit trails
- **Usability**: Intuitive interfaces for non-technical administrators
- **Maintainability**: Clean architecture with separation of concerns
- **Monitoring**: Comprehensive observability and alerting

The modular design allows for incremental implementation and deployment, ensuring that critical functionality can be delivered quickly while building toward the complete vision.

**Next Steps:**
1. Review and approve this architecture document
2. Begin Phase 1 implementation with database schema
3. Set up development environment and CI/CD pipeline
4. Start with basic admin user management functionality

---

*This document serves as the authoritative guide for implementing the Rawgle management interface. All implementation decisions should align with the principles and patterns outlined here.*