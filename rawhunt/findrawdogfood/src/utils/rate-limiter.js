/**
 * Rate Limiter for FindRawDogFood APIs
 * Provides comprehensive rate limiting for all external API calls
 */

class RateLimiter {
  constructor() {
    this.limits = new Map();
    this.usage = new Map();
    
    // Initialize default rate limits
    this.setupDefaultLimits();
  }

  setupDefaultLimits() {
    // OpenAI Whisper API limits
    this.setLimit('openai_whisper', {
      requests: 50,        // requests per minute
      window: 60 * 1000,   // 1 minute window
      cooldown: 1000       // 1 second between requests
    });

    // Anthropic Claude API limits
    this.setLimit('anthropic_claude', {
      requests: 5,         // requests per minute (Tier 1)
      window: 60 * 1000,   // 1 minute window
      cooldown: 12000,     // 12 seconds between requests
      tokens: 25000,       // daily token limit
      tokenWindow: 24 * 60 * 60 * 1000 // 24 hours
    });

    // ElevenLabs API limits
    this.setLimit('elevenlabs_tts', {
      requests: 30,        // conservative limit
      window: 60 * 1000,   // 1 minute window
      characters: 10000,   // free tier monthly limit
      characterWindow: 30 * 24 * 60 * 60 * 1000, // 30 days
      cooldown: 2000       // 2 seconds between requests
    });

    // Google Places API limits
    this.setLimit('google_places', {
      requests: 50,        // QPS limit
      window: 1000,        // 1 second window
      dailyRequests: 1000, // daily limit per key
      dailyWindow: 24 * 60 * 60 * 1000, // 24 hours
      cooldown: 500        // 500ms between requests
    });

    // General API cooldown
    this.lastRequestTimes = new Map();
  }

  setLimit(apiName, config) {
    this.limits.set(apiName, config);
    if (!this.usage.has(apiName)) {
      this.usage.set(apiName, {
        requests: [],
        characters: 0,
        tokens: 0,
        dailyRequests: 0,
        lastReset: Date.now()
      });
    }
  }

  async checkLimit(apiName, options = {}) {
    const limit = this.limits.get(apiName);
    if (!limit) {
      throw new Error(`Rate limit not configured for API: ${apiName}`);
    }

    const usage = this.usage.get(apiName);
    const now = Date.now();

    // Clean old requests
    this.cleanOldRequests(apiName, now);

    // Check request rate limit
    if (usage.requests.length >= limit.requests) {
      const oldestRequest = usage.requests[0];
      const waitTime = limit.window - (now - oldestRequest);
      if (waitTime > 0) {
        throw new RateLimitError(apiName, 'requests', waitTime);
      }
    }

    // Check daily limits
    if (limit.dailyRequests && usage.dailyRequests >= limit.dailyRequests) {
      const timeSinceReset = now - usage.lastReset;
      if (timeSinceReset < limit.dailyWindow) {
        const waitTime = limit.dailyWindow - timeSinceReset;
        throw new RateLimitError(apiName, 'daily_requests', waitTime);
      } else {
        // Reset daily counter
        usage.dailyRequests = 0;
        usage.lastReset = now;
      }
    }

    // Check character limits (for text-based APIs)
    if (limit.characters && options.characters) {
      const characterWindow = limit.characterWindow || limit.window;
      if (usage.characters + options.characters > limit.characters) {
        throw new RateLimitError(apiName, 'characters', 0);
      }
    }

    // Check token limits (for AI APIs)
    if (limit.tokens && options.tokens) {
      const tokenWindow = limit.tokenWindow || limit.window;
      if (usage.tokens + options.tokens > limit.tokens) {
        throw new RateLimitError(apiName, 'tokens', 0);
      }
    }

    // Check cooldown period
    if (limit.cooldown) {
      const lastRequest = this.lastRequestTimes.get(apiName) || 0;
      const timeSinceLastRequest = now - lastRequest;
      if (timeSinceLastRequest < limit.cooldown) {
        const waitTime = limit.cooldown - timeSinceLastRequest;
        await this.sleep(waitTime);
      }
    }

    return true;
  }

  recordUsage(apiName, options = {}) {
    const usage = this.usage.get(apiName);
    const now = Date.now();

    // Record request
    usage.requests.push(now);
    usage.dailyRequests++;

    // Record character usage
    if (options.characters) {
      usage.characters += options.characters;
    }

    // Record token usage
    if (options.tokens) {
      usage.tokens += options.tokens;
    }

    // Update last request time
    this.lastRequestTimes.set(apiName, now);

    // Clean old data periodically
    this.cleanOldRequests(apiName, now);
  }

  cleanOldRequests(apiName, now) {
    const limit = this.limits.get(apiName);
    const usage = this.usage.get(apiName);

    // Clean requests outside the window
    usage.requests = usage.requests.filter(time => 
      now - time < limit.window
    );

    // Reset character count if outside window
    if (limit.characterWindow && now - usage.lastReset > limit.characterWindow) {
      usage.characters = 0;
      usage.lastReset = now;
    }

    // Reset token count if outside window
    if (limit.tokenWindow && now - usage.lastReset > limit.tokenWindow) {
      usage.tokens = 0;
    }
  }

  getUsageStats(apiName) {
    const limit = this.limits.get(apiName);
    const usage = this.usage.get(apiName);
    const now = Date.now();

    this.cleanOldRequests(apiName, now);

    return {
      api: apiName,
      requests: {
        current: usage.requests.length,
        limit: limit.requests,
        window: limit.window
      },
      dailyRequests: {
        current: usage.dailyRequests,
        limit: limit.dailyRequests || 'unlimited'
      },
      characters: {
        current: usage.characters,
        limit: limit.characters || 'unlimited'
      },
      tokens: {
        current: usage.tokens,
        limit: limit.tokens || 'unlimited'
      },
      lastRequest: this.lastRequestTimes.get(apiName),
      nextAvailable: this.getNextAvailableTime(apiName)
    };
  }

  getNextAvailableTime(apiName) {
    const limit = this.limits.get(apiName);
    const usage = this.usage.get(apiName);
    const now = Date.now();

    let nextAvailable = now;

    // Check cooldown
    if (limit.cooldown) {
      const lastRequest = this.lastRequestTimes.get(apiName) || 0;
      nextAvailable = Math.max(nextAvailable, lastRequest + limit.cooldown);
    }

    // Check rate limit
    if (usage.requests.length >= limit.requests) {
      const oldestRequest = usage.requests[0];
      nextAvailable = Math.max(nextAvailable, oldestRequest + limit.window);
    }

    return nextAvailable;
  }

  async waitForAvailability(apiName) {
    const nextAvailable = this.getNextAvailableTime(apiName);
    const now = Date.now();
    const waitTime = nextAvailable - now;

    if (waitTime > 0) {
      console.log(`⏳ Rate limit: Waiting ${waitTime}ms for ${apiName}`);
      await this.sleep(waitTime);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Reset all usage stats (useful for testing)
  reset() {
    this.usage.clear();
    this.lastRequestTimes.clear();
    this.setupDefaultLimits();
  }

  // Get overall system rate limit status
  getSystemStatus() {
    const status = {};
    for (const [apiName] of this.limits) {
      status[apiName] = this.getUsageStats(apiName);
    }
    return status;
  }
}

class RateLimitError extends Error {
  constructor(api, limitType, waitTime) {
    super(`Rate limit exceeded for ${api} (${limitType}). Wait ${waitTime}ms.`);
    this.name = 'RateLimitError';
    this.api = api;
    this.limitType = limitType;
    this.waitTime = waitTime;
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

export { RateLimiter, RateLimitError, rateLimiter };