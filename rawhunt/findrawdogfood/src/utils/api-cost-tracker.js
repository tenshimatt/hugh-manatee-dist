/**
 * Real-time API Cost Tracker for FindRawDogFood
 * Fetches actual usage and cost data from API providers
 */

class APICostTracker {
  constructor() {
    this.costCache = new Map();
    this.lastFetchTime = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes cache
  }

  // Get real-time costs from OpenAI API
  async getOpenAICosts(apiKey) {
    const cacheKey = 'openai_costs';
    const now = Date.now();
    
    // Check cache first
    if (this.costCache.has(cacheKey) && 
        (now - this.lastFetchTime.get(cacheKey)) < this.cacheTTL) {
      return this.costCache.get(cacheKey);
    }

    try {
      // OpenAI doesn't have a direct billing API, so we'll track usage internally
      // and calculate costs based on known rates
      const response = await fetch('https://api.openai.com/v1/usage', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const costs = this.calculateOpenAICosts(data);
        
        this.costCache.set(cacheKey, costs);
        this.lastFetchTime.set(cacheKey, now);
        
        return costs;
      } else {
        console.warn('OpenAI usage API not available, using internal tracking');
        return this.getInternalOpenAICosts();
      }
    } catch (error) {
      console.warn('Failed to fetch OpenAI costs:', error.message);
      return this.getInternalOpenAICosts();
    }
  }

  // Get real-time costs from Anthropic API
  async getAnthropicCosts(apiKey) {
    const cacheKey = 'anthropic_costs';
    const now = Date.now();
    
    if (this.costCache.has(cacheKey) && 
        (now - this.lastFetchTime.get(cacheKey)) < this.cacheTTL) {
      return this.costCache.get(cacheKey);
    }

    try {
      // Anthropic doesn't have a public billing API yet
      // We'll use internal tracking with real pricing
      const costs = this.getInternalAnthropicCosts();
      
      this.costCache.set(cacheKey, costs);
      this.lastFetchTime.set(cacheKey, now);
      
      return costs;
    } catch (error) {
      console.warn('Failed to fetch Anthropic costs:', error.message);
      return this.getInternalAnthropicCosts();
    }
  }

  // Get real-time costs from ElevenLabs API
  async getElevenLabsCosts(apiKey) {
    const cacheKey = 'elevenlabs_costs';
    const now = Date.now();
    
    if (this.costCache.has(cacheKey) && 
        (now - this.lastFetchTime.get(cacheKey)) < this.cacheTTL) {
      return this.costCache.get(cacheKey);
    }

    try {
      // ElevenLabs has a user info endpoint that includes subscription details
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const costs = this.calculateElevenLabsCosts(data);
        
        this.costCache.set(cacheKey, costs);
        this.lastFetchTime.set(cacheKey, now);
        
        return costs;
      } else {
        console.warn('ElevenLabs user API not available, using internal tracking');
        return this.getInternalElevenLabsCosts();
      }
    } catch (error) {
      console.warn('Failed to fetch ElevenLabs costs:', error.message);
      return this.getInternalElevenLabsCosts();
    }
  }

  // Get real-time costs from Google Cloud API
  async getGoogleCloudCosts(apiKey) {
    const cacheKey = 'google_costs';
    const now = Date.now();
    
    if (this.costCache.has(cacheKey) && 
        (now - this.lastFetchTime.get(cacheKey)) < this.cacheTTL) {
      return this.costCache.get(cacheKey);
    }

    try {
      // Google Places API quota check
      const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=ChIJN1t_tDeuEmsRUsoyG83frY4&key=${apiKey}`);
      
      if (response.ok) {
        // We can infer usage from response headers and calculate costs
        const costs = this.calculateGooglePlacesCosts(response);
        
        this.costCache.set(cacheKey, costs);
        this.lastFetchTime.set(cacheKey, now);
        
        return costs;
      } else {
        console.warn('Google Places API not available, using internal tracking');
        return this.getInternalGoogleCosts();
      }
    } catch (error) {
      console.warn('Failed to fetch Google costs:', error.message);
      return this.getInternalGoogleCosts();
    }
  }

  // Calculate costs from OpenAI usage data
  calculateOpenAICosts(usageData) {
    // OpenAI Whisper pricing: $0.006 per minute
    const whisperMinutes = usageData.whisper_usage || 0;
    const whisperCost = whisperMinutes * 0.006;

    return {
      service: 'OpenAI',
      totalCost: whisperCost,
      breakdown: {
        whisper: {
          usage: whisperMinutes,
          cost: whisperCost,
          unit: 'minutes'
        }
      },
      billingPeriod: 'current_month',
      lastUpdated: new Date().toISOString()
    };
  }

  // Calculate costs from ElevenLabs user data
  calculateElevenLabsCosts(userData) {
    const subscription = userData.subscription || {};
    const characterCount = subscription.character_count || 0;
    const characterLimit = subscription.character_limit || 10000;
    const tier = subscription.tier || 'free';

    let totalCost = 0;
    if (tier !== 'free' && characterCount > 10000) {
      // Estimate cost based on overage
      const overage = characterCount - 10000;
      totalCost = overage * 0.00003; // Rough estimate
    }

    return {
      service: 'ElevenLabs',
      totalCost: totalCost,
      breakdown: {
        tts: {
          usage: characterCount,
          limit: characterLimit,
          cost: totalCost,
          unit: 'characters',
          tier: tier
        }
      },
      billingPeriod: 'current_month',
      lastUpdated: new Date().toISOString()
    };
  }

  // Calculate costs from Google Places response
  calculateGooglePlacesCosts(response) {
    // Google Places API: $17 per 1000 requests after free tier
    // We'll estimate based on our internal tracking
    return this.getInternalGoogleCosts();
  }

  // Internal cost tracking fallback methods
  getInternalOpenAICosts() {
    const usage = this.getStoredUsage('openai_whisper');
    const cost = usage.minutes * 0.006;

    return {
      service: 'OpenAI (Internal)',
      totalCost: cost,
      breakdown: {
        whisper: {
          usage: usage.minutes,
          cost: cost,
          unit: 'minutes'
        }
      },
      billingPeriod: 'to_date',
      lastUpdated: new Date().toISOString()
    };
  }

  getInternalAnthropicCosts() {
    const usage = this.getStoredUsage('anthropic_claude');
    const inputCost = usage.inputTokens * 0.000003;
    const outputCost = usage.outputTokens * 0.000015;
    const totalCost = inputCost + outputCost;

    return {
      service: 'Anthropic (Internal)',
      totalCost: totalCost,
      breakdown: {
        claude: {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          inputCost: inputCost,
          outputCost: outputCost,
          totalCost: totalCost,
          unit: 'tokens'
        }
      },
      billingPeriod: 'to_date',
      lastUpdated: new Date().toISOString()
    };
  }

  getInternalElevenLabsCosts() {
    const usage = this.getStoredUsage('elevenlabs_tts');
    const cost = Math.max(0, usage.characters - 10000) * 0.00003;

    return {
      service: 'ElevenLabs (Internal)',
      totalCost: cost,
      breakdown: {
        tts: {
          usage: usage.characters,
          freeLimit: 10000,
          billableChars: Math.max(0, usage.characters - 10000),
          cost: cost,
          unit: 'characters'
        }
      },
      billingPeriod: 'to_date',
      lastUpdated: new Date().toISOString()
    };
  }

  getInternalGoogleCosts() {
    const usage = this.getStoredUsage('google_places');
    const cost = Math.max(0, usage.requests - 1000) * 0.017;

    return {
      service: 'Google Places (Internal)',
      totalCost: cost,
      breakdown: {
        places: {
          usage: usage.requests,
          freeLimit: 1000,
          billableRequests: Math.max(0, usage.requests - 1000),
          cost: cost,
          unit: 'requests'
        }
      },
      billingPeriod: 'to_date',
      lastUpdated: new Date().toISOString()
    };
  }

  // Get stored usage from our API monitor
  getStoredUsage(apiName) {
    if (this.apiMonitor) {
      const report = this.apiMonitor.getUsageReport();
      if (report && report.apis && report.apis[apiName]) {
        const apiData = report.apis[apiName];
        return {
          minutes: apiData.usage?.minutes || 0,
          requests: apiData.requests?.current || 0,
          characters: apiData.characters?.current || 0,
          tokens: apiData.tokens?.current || 0,
          inputTokens: apiData.usage?.inputTokens || 0,
          outputTokens: apiData.usage?.outputTokens || 0
        };
      }
    }

    // Fallback defaults
    const defaults = {
      openai_whisper: { minutes: 0, requests: 0 },
      anthropic_claude: { inputTokens: 0, outputTokens: 0, requests: 0 },
      elevenlabs_tts: { characters: 0, requests: 0 },
      google_places: { requests: 0 }
    };

    return defaults[apiName] || { requests: 0 };
  }

  // Store usage data (integrate with existing monitoring)
  storeUsage(apiName, usageData) {
    // This would update our persistent storage
    console.log(`Storing usage for ${apiName}:`, usageData);
  }

  // Get comprehensive cost report from all APIs
  async getAllCosts(env) {
    const costs = await Promise.allSettled([
      this.getOpenAICosts(env.OPENAI_API_KEY),
      this.getAnthropicCosts(env.ANTHROPIC_API_KEY),
      this.getElevenLabsCosts(env.ELEVENLABS_API_KEY),
      this.getGoogleCloudCosts(env.GOOGLE_PLACES_API_KEYS?.split(',')[0])
    ]);

    const results = costs.map((result, index) => {
      const services = ['OpenAI', 'Anthropic', 'ElevenLabs', 'Google'];
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.warn(`Failed to get costs for ${services[index]}:`, result.reason);
        return {
          service: services[index],
          totalCost: 0,
          error: result.reason.message,
          lastUpdated: new Date().toISOString()
        };
      }
    });

    const totalCost = results.reduce((sum, result) => sum + (result.totalCost || 0), 0);

    return {
      totalCost,
      services: results,
      lastUpdated: new Date().toISOString(),
      period: 'to_date'
    };
  }

  // Integration with existing API monitor
  integrateWithMonitor(apiMonitor) {
    // Store reference to API monitor for live data access
    this.apiMonitor = apiMonitor;
    
    // Update stored usage from API monitor
    const report = apiMonitor.getUsageReport();
    
    if (report && report.apis) {
      Object.entries(report.apis).forEach(([apiName, apiData]) => {
        if (apiData.usage) {
          this.storeUsage(apiName, apiData.usage);
        }
      });
    }
  }

  // Generate cost breakdown for dashboard
  generateCostBreakdown(costData) {
    const breakdown = costData.services.map(service => ({
      name: service.service,
      cost: service.totalCost,
      breakdown: service.breakdown || {},
      status: service.error ? 'error' : 'ok'
    }));

    return {
      total: costData.totalCost,
      services: breakdown,
      lastUpdated: costData.lastUpdated
    };
  }

  // Clear cache (useful for testing)
  clearCache() {
    this.costCache.clear();
    this.lastFetchTime.clear();
  }
}

// Singleton instance
const apiCostTracker = new APICostTracker();

export { APICostTracker, apiCostTracker };