import Anthropic from '@anthropic-ai/sdk';
import { ValidationUtils } from '../utils/validation.js';
import { DatabaseUtils } from '../utils/database.js';

/**
 * Claude AI Service for Rawgle Platform
 * Handles nutrition advice and platform support chat
 */
export class ClaudeService {
  constructor() {
    this.defaultModel = 'claude-3-5-sonnet-20241022';
    this.maxTokens = 1000;
    this.temperature = 0.7;
  }

  /**
   * Initialize Anthropic client with API key from environment
   */
  getClient(env) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    
    return new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Generate cache key for conversation context
   */
  generateCacheKey(userId, conversationId) {
    return `chat_context:${userId || 'anonymous'}:${conversationId || 'default'}`;
  }

  /**
   * Get conversation context from KV cache
   */
  async getConversationContext(env, userId, conversationId) {
    try {
      if (!env.CACHE) return [];
      
      const cacheKey = this.generateCacheKey(userId, conversationId);
      const cached = await env.CACHE.get(cacheKey);
      
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.warn('Failed to retrieve conversation context:', error);
      return [];
    }
  }

  /**
   * Store conversation context in KV cache
   */
  async storeConversationContext(env, userId, conversationId, context) {
    try {
      if (!env.CACHE) return;
      
      const cacheKey = this.generateCacheKey(userId, conversationId);
      
      // Keep only last 10 messages for context
      const limitedContext = context.slice(-10);
      
      // Store with 1 hour TTL
      await env.CACHE.put(
        cacheKey, 
        JSON.stringify(limitedContext),
        { expirationTtl: 3600 }
      );
    } catch (error) {
      console.warn('Failed to store conversation context:', error);
    }
  }

  /**
   * Check for cached common responses
   */
  async getCachedResponse(env, normalizedQuery) {
    try {
      if (!env.CACHE) return null;
      
      const cacheKey = `common_response:${normalizedQuery}`;
      const cached = await env.CACHE.get(cacheKey);
      
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Failed to retrieve cached response:', error);
      return null;
    }
  }

  /**
   * Cache common responses for cost optimization
   */
  async cacheResponse(env, normalizedQuery, response) {
    try {
      if (!env.CACHE) return;
      
      const cacheKey = `common_response:${normalizedQuery}`;
      
      // Cache for 24 hours
      await env.CACHE.put(
        cacheKey,
        JSON.stringify(response),
        { expirationTtl: 86400 }
      );
    } catch (error) {
      console.warn('Failed to cache response:', error);
    }
  }

  /**
   * Normalize query for caching (remove personal info, standardize)
   */
  normalizeQuery(message) {
    return message
      .toLowerCase()
      .replace(/my (dog|cat|pet)/, 'pet')
      .replace(/\b\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4}\b/g, 'date')
      .replace(/\b\d+\s*(lbs?|pounds?|kg|kilograms?)\b/g, 'weight')
      .replace(/\b\d+\s*(years?|months?|weeks?)\s*(old)?\b/g, 'age')
      .trim();
  }

  /**
   * Build system prompt for Claude
   */
  buildSystemPrompt() {
    return `You are an AI assistant for Rawgle, a platform connecting pet owners with raw food suppliers and providing pet nutrition guidance.

Your role:
- Provide helpful, accurate information about raw pet feeding
- Help users navigate the Rawgle platform
- Connect users with appropriate suppliers when relevant
- Always prioritize pet safety and health

Guidelines:
- Be friendly, knowledgeable, and supportive
- Always recommend consulting with veterinarians for health concerns
- Provide evidence-based nutrition advice
- Help users understand raw feeding benefits and risks
- Suggest Rawgle suppliers when appropriate
- Keep responses concise but informative
- If unsure about medical advice, recommend professional consultation

You have access to information about:
- Raw feeding principles and practices
- Pet nutrition requirements
- Rawgle platform features (supplier search, reviews, PAWS token system)
- Food safety for raw pet diets

Always end responses with encouragement to explore Rawgle's features when relevant.`;
  }

  /**
   * Process user's pet profile to enhance responses
   */
  async getPetProfile(env, userId) {
    try {
      if (!userId) return null;
      
      const user = await DatabaseUtils.executeQueryFirst(
        env.DB,
        `SELECT pet_info FROM users WHERE id = ?`,
        [userId]
      );
      
      return user && user.pet_info ? JSON.parse(user.pet_info) : null;
    } catch (error) {
      console.warn('Failed to retrieve pet profile:', error);
      return null;
    }
  }

  /**
   * Main chat method
   */
  async chat(env, {
    message,
    userId = null,
    conversationId = null,
    petProfile = null,
    stream = false
  }) {
    try {
      // Input validation
      if (!message || typeof message !== 'string') {
        throw new Error('Message is required and must be a string');
      }

      const sanitizedMessage = ValidationUtils.sanitizeInput(message);
      if (sanitizedMessage.length > 4000) {
        throw new Error('Message too long. Please keep messages under 4000 characters.');
      }

      // Check for cached response first (cost optimization)
      const normalizedQuery = this.normalizeQuery(sanitizedMessage);
      const cachedResponse = await this.getCachedResponse(env, normalizedQuery);
      
      if (cachedResponse) {
        console.log('Returning cached response for cost optimization');
        return {
          message: cachedResponse.message,
          cached: true,
          conversationId: conversationId || 'default'
        };
      }

      // Get conversation context
      const context = await this.getConversationContext(env, userId, conversationId);
      
      // Get pet profile if not provided
      if (!petProfile && userId) {
        petProfile = await this.getPetProfile(env, userId);
      }

      // Build messages for Claude
      const messages = [
        ...context,
        {
          role: 'user',
          content: this.enhanceMessageWithContext(sanitizedMessage, petProfile)
        }
      ];

      // Initialize Claude client
      const anthropic = this.getClient(env);

      // Make API call to Claude
      const response = await anthropic.messages.create({
        model: this.defaultModel,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: this.buildSystemPrompt(),
        messages: messages,
        stream: stream
      });

      let responseText;
      
      if (stream) {
        // Handle streaming response
        return this.handleStreamingResponse(response);
      } else {
        // Handle regular response
        responseText = response.content[0].text;
      }

      // Update conversation context
      const updatedContext = [
        ...context,
        { role: 'user', content: sanitizedMessage },
        { role: 'assistant', content: responseText }
      ];
      
      await this.storeConversationContext(env, userId, conversationId, updatedContext);

      // Cache common responses for cost optimization
      if (this.shouldCacheResponse(sanitizedMessage)) {
        await this.cacheResponse(env, normalizedQuery, { message: responseText });
      }

      // Log the conversation for analytics
      await this.logConversation(env, {
        userId,
        conversationId,
        message: sanitizedMessage,
        response: responseText,
        model: this.defaultModel,
        tokens: response.usage?.output_tokens || 0
      });

      return {
        message: responseText,
        cached: false,
        conversationId: conversationId || 'default',
        usage: response.usage
      };

    } catch (error) {
      console.error('Claude chat error:', error);
      
      // Return helpful error message
      if (error.message.includes('API key')) {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      } else if (error.message.includes('rate limit')) {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      } else if (error.message.includes('quota')) {
        throw new Error('AI service is currently at capacity. Please try again later.');
      }
      
      throw error;
    }
  }

  /**
   * Enhance user message with pet profile context
   */
  enhanceMessageWithContext(message, petProfile) {
    if (!petProfile) return message;
    
    let contextualMessage = message;
    
    // Add pet context if relevant to the query
    const needsContext = message.toLowerCase().includes('my pet') || 
                        message.toLowerCase().includes('my dog') ||
                        message.toLowerCase().includes('my cat') ||
                        message.toLowerCase().includes('feeding') ||
                        message.toLowerCase().includes('diet');
    
    if (needsContext) {
      const petContext = [];
      if (petProfile.species) petContext.push(`Species: ${petProfile.species}`);
      if (petProfile.breed) petContext.push(`Breed: ${petProfile.breed}`);
      if (petProfile.age) petContext.push(`Age: ${petProfile.age}`);
      if (petProfile.weight) petContext.push(`Weight: ${petProfile.weight}`);
      if (petProfile.activity_level) petContext.push(`Activity Level: ${petProfile.activity_level}`);
      
      if (petContext.length > 0) {
        contextualMessage = `${message}\n\nMy pet information: ${petContext.join(', ')}`;
      }
    }
    
    return contextualMessage;
  }

  /**
   * Determine if response should be cached
   */
  shouldCacheResponse(message) {
    const commonQueries = [
      'what is raw feeding',
      'how to start raw feeding',
      'benefits of raw food',
      'raw food safety',
      'switching to raw',
      'how much to feed',
      'raw feeding guide'
    ];
    
    const normalizedMessage = message.toLowerCase();
    return commonQueries.some(query => normalizedMessage.includes(query));
  }

  /**
   * Handle streaming response
   */
  async handleStreamingResponse(stream) {
    // This would need to be implemented with proper streaming support
    // For now, we'll collect the stream and return it
    let fullContent = '';
    
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        fullContent += chunk.delta.text;
      }
    }
    
    return {
      message: fullContent,
      cached: false,
      streamed: true
    };
  }

  /**
   * Log conversation for analytics and cost tracking
   */
  async logConversation(env, {
    userId,
    conversationId,
    message,
    response,
    model,
    tokens
  }) {
    try {
      await DatabaseUtils.executeUpdate(
        env.DB,
        `INSERT INTO chat_logs (
          user_id, conversation_id, message, response, model, 
          tokens_used, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          conversationId || 'default',
          message,
          response,
          model,
          tokens || 0,
          new Date().toISOString()
        ]
      );
    } catch (error) {
      console.warn('Failed to log conversation:', error);
      // Don't throw - logging failure shouldn't break the chat
    }
  }

  /**
   * Get usage statistics for cost monitoring
   */
  async getUsageStats(env, timeframe = '24h') {
    try {
      const timeCondition = timeframe === '24h' 
        ? `created_at > datetime('now', '-24 hours')`
        : `created_at > datetime('now', '-7 days')`;

      const stats = await DatabaseUtils.executeQueryFirst(
        env.DB,
        `SELECT 
          COUNT(*) as total_messages,
          SUM(tokens_used) as total_tokens,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT conversation_id) as unique_conversations
        FROM chat_logs 
        WHERE ${timeCondition}`
      );

      return stats;
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return {
        total_messages: 0,
        total_tokens: 0,
        unique_users: 0,
        unique_conversations: 0
      };
    }
  }
}

export default ClaudeService;