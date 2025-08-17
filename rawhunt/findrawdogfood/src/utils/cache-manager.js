/**
 * Cache Manager for FindRawDogFood
 * Implements caching strategies for frequently used API data to reduce costs
 */

class CacheManager {
  constructor(kvNamespace = null) {
    this.kv = kvNamespace; // Cloudflare KV namespace
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalSavings: 0
    };
    
    this.setupCacheConfigs();
  }

  setupCacheConfigs() {
    // Cache configuration for different data types
    this.cacheConfigs = {
      // Speech-to-text results (same audio = same text)
      whisper_results: {
        ttl: 7 * 24 * 60 * 60, // 7 days
        useKV: true,
        useMemory: true,
        keyPrefix: 'whisper:',
        costSaving: 0.006 // Per minute saved
      },
      
      // Claude responses for common queries
      claude_responses: {
        ttl: 1 * 60 * 60, // 1 hour (responses may change)
        useKV: false, // Too dynamic for long-term storage
        useMemory: true,
        keyPrefix: 'claude:',
        costSaving: 0.000018 // Average cost per response
      },
      
      // Text-to-speech audio (same text = same audio)
      tts_audio: {
        ttl: 30 * 24 * 60 * 60, // 30 days
        useKV: true,
        useMemory: false, // Audio files too large for memory
        keyPrefix: 'tts:',
        costSaving: 0.0003 // Average cost per request
      },
      
      // Google Places results
      places_results: {
        ttl: 24 * 60 * 60, // 24 hours
        useKV: true,
        useMemory: true,
        keyPrefix: 'places:',
        costSaving: 0.017 // Per request saved
      },
      
      // Supplier search results
      supplier_search: {
        ttl: 6 * 60 * 60, // 6 hours
        useKV: true,
        useMemory: true,
        keyPrefix: 'search:',
        costSaving: 0.001 // Database query cost estimate
      }
    };
  }

  // Generate cache key with hashing for consistency
  generateCacheKey(type, data) {
    const config = this.cacheConfigs[type];
    if (!config) return null;

    let keyData = '';
    
    switch (type) {
      case 'whisper_results':
        // Hash audio data for consistent key
        keyData = this.hashData(data.audioBuffer);
        break;
        
      case 'claude_responses':
        // Use prompt + model for key
        keyData = this.hashData(data.prompt + data.model);
        break;
        
      case 'tts_audio':
        // Use text + voice settings for key
        keyData = this.hashData(data.text + JSON.stringify(data.settings || {}));
        break;
        
      case 'places_results':
        // Use query + location for key
        keyData = this.hashData(data.query + data.location);
        break;
        
      case 'supplier_search':
        // Use search parameters for key
        keyData = this.hashData(JSON.stringify(data.params));
        break;
        
      default:
        keyData = this.hashData(JSON.stringify(data));
    }
    
    return config.keyPrefix + keyData;
  }

  // Simple hash function for generating cache keys
  hashData(data) {
    let hash = 0;
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  // Get from cache (tries memory first, then KV)
  async get(type, keyData) {
    const key = this.generateCacheKey(type, keyData);
    if (!key) return null;

    const config = this.cacheConfigs[type];
    
    try {
      // Try memory cache first
      if (config.useMemory && this.memoryCache.has(key)) {
        const cached = this.memoryCache.get(key);
        if (this.isValid(cached, config.ttl)) {
          this.cacheStats.hits++;
          this.cacheStats.totalSavings += config.costSaving;
          console.log(`💾 Cache HIT (memory): ${type} - Saved $${config.costSaving.toFixed(6)}`);
          return cached.data;
        } else {
          // Remove expired entry
          this.memoryCache.delete(key);
        }
      }

      // Try KV cache
      if (config.useKV && this.kv) {
        const cached = await this.kv.get(key, { type: 'json' });
        if (cached && this.isValid(cached, config.ttl)) {
          // Store in memory for faster future access
          if (config.useMemory) {
            this.memoryCache.set(key, cached);
          }
          
          this.cacheStats.hits++;
          this.cacheStats.totalSavings += config.costSaving;
          console.log(`💾 Cache HIT (KV): ${type} - Saved $${config.costSaving.toFixed(6)}`);
          return cached.data;
        }
      }

      this.cacheStats.misses++;
      return null;
      
    } catch (error) {
      console.error(`❌ Cache get error for ${type}:`, error);
      this.cacheStats.errors++;
      return null;
    }
  }

  // Set cache entry
  async set(type, keyData, data) {
    const key = this.generateCacheKey(type, keyData);
    if (!key) return false;

    const config = this.cacheConfigs[type];
    const cacheEntry = {
      data: data,
      timestamp: Date.now(),
      type: type
    };

    try {
      // Store in memory cache
      if (config.useMemory) {
        this.memoryCache.set(key, cacheEntry);
        
        // Limit memory cache size (LRU-style cleanup)
        if (this.memoryCache.size > 100) {
          const firstKey = this.memoryCache.keys().next().value;
          this.memoryCache.delete(firstKey);
        }
      }

      // Store in KV cache
      if (config.useKV && this.kv) {
        await this.kv.put(key, JSON.stringify(cacheEntry), {
          expirationTtl: config.ttl
        });
      }

      console.log(`💾 Cache SET: ${type} (TTL: ${config.ttl}s)`);
      return true;
      
    } catch (error) {
      console.error(`❌ Cache set error for ${type}:`, error);
      this.cacheStats.errors++;
      return false;
    }
  }

  // Check if cache entry is still valid
  isValid(cached, ttl) {
    if (!cached || !cached.timestamp) return false;
    const age = (Date.now() - cached.timestamp) / 1000;
    return age < ttl;
  }

  // Cache wrapper for speech-to-text
  async cacheWhisperResult(audioBuffer, transcriptFunction) {
    const keyData = { audioBuffer };
    
    // Try to get from cache first
    const cached = await this.get('whisper_results', keyData);
    if (cached) {
      return cached;
    }

    // Not in cache, make API call
    const result = await transcriptFunction();
    
    // Cache the result
    await this.set('whisper_results', keyData, result);
    
    return result;
  }

  // Cache wrapper for Claude responses
  async cacheClaudeResponse(prompt, model, claudeFunction) {
    const keyData = { prompt, model };
    
    // Try to get from cache first
    const cached = await this.get('claude_responses', keyData);
    if (cached) {
      return cached;
    }

    // Not in cache, make API call
    const result = await claudeFunction();
    
    // Cache the result
    await this.set('claude_responses', keyData, result);
    
    return result;
  }

  // Cache wrapper for text-to-speech
  async cacheTTSAudio(text, settings, ttsFunction) {
    const keyData = { text, settings };
    
    // Try to get from cache first
    const cached = await this.get('tts_audio', keyData);
    if (cached) {
      // Convert back to ArrayBuffer if needed
      if (typeof cached === 'string') {
        return new Uint8Array(Buffer.from(cached, 'base64')).buffer;
      }
      return cached;
    }

    // Not in cache, make API call
    const result = await ttsFunction();
    
    // Convert ArrayBuffer to base64 for storage
    const base64Data = Buffer.from(result).toString('base64');
    await this.set('tts_audio', keyData, base64Data);
    
    return result;
  }

  // Cache wrapper for Google Places results
  async cachePlacesResult(query, location, searchFunction) {
    const keyData = { query, location };
    
    // Try to get from cache first
    const cached = await this.get('places_results', keyData);
    if (cached) {
      return cached;
    }

    // Not in cache, make API call
    const result = await searchFunction();
    
    // Cache the result
    await this.set('places_results', keyData, result);
    
    return result;
  }

  // Cache wrapper for supplier search
  async cacheSupplierSearch(params, searchFunction) {
    const keyData = { params };
    
    // Try to get from cache first
    const cached = await this.get('supplier_search', keyData);
    if (cached) {
      return cached;
    }

    // Not in cache, make database query
    const result = await searchFunction();
    
    // Cache the result
    await this.set('supplier_search', keyData, result);
    
    return result;
  }

  // Get cache statistics
  getStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100 
      : 0;

    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      errors: this.cacheStats.errors,
      hitRate: Math.round(hitRate * 100) / 100,
      totalSavings: this.cacheStats.totalSavings,
      memorySize: this.memoryCache.size,
      estimatedMonthlySavings: this.cacheStats.totalSavings * 30 // Rough estimate
    };
  }

  // Clear all caches
  async clearAll() {
    this.memoryCache.clear();
    
    if (this.kv) {
      // Note: KV doesn't have a clear all operation
      // Would need to track keys or use TTL for cleanup
      console.log('⚠️ KV cache entries will expire based on TTL');
    }
    
    // Reset stats
    this.cacheStats = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalSavings: 0
    };
    
    console.log('🗑️ Cache cleared');
  }

  // Clean expired entries from memory cache
  cleanupMemoryCache() {
    let cleaned = 0;
    
    for (const [key, cached] of this.memoryCache.entries()) {
      const config = this.cacheConfigs[cached.type];
      if (config && !this.isValid(cached, config.ttl)) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  // Get cache configuration
  getConfig() {
    return {
      configs: this.cacheConfigs,
      stats: this.getStats(),
      recommendations: this.generateRecommendations()
    };
  }

  // Generate cache optimization recommendations
  generateRecommendations() {
    const stats = this.getStats();
    const recommendations = [];

    if (stats.hitRate < 20) {
      recommendations.push({
        type: 'performance',
        message: `Low cache hit rate (${stats.hitRate}%). Consider adjusting TTL values or cache keys.`
      });
    }

    if (stats.totalSavings > 1.0) {
      recommendations.push({
        type: 'cost_optimization',
        message: `Cache has saved $${stats.totalSavings.toFixed(4)} in API costs. Great job!`
      });
    }

    if (stats.errors > stats.hits * 0.1) {
      recommendations.push({
        type: 'reliability',
        message: `High cache error rate (${stats.errors} errors). Check KV namespace configuration.`
      });
    }

    return recommendations;
  }
}

// Initialize cache manager
// Note: KV namespace will be injected by the Worker environment
const cacheManager = new CacheManager();

export { CacheManager, cacheManager };