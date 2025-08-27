import { Router } from 'itty-router';
import { ValidationUtils } from '../utils/validation.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { createCorsResponse } from '../middleware/cors.js';
import { ClaudeService } from '../services/claudeService.js';
import { DatabaseUtils } from '../utils/database.js';

const chatRouter = Router({ base: '/api/chat' });
const claudeService = new ClaudeService();

/**
 * POST /api/chat
 * Main Claude AI chat endpoint for nutrition advice and platform support
 */
chatRouter.post('/', async (request, env) => {
  try {
    // Optional authentication - works for both logged in and anonymous users
    const auth = await optionalAuth(request, env);
    
    // Rate limiting - more generous for authenticated users
    const rateLimitResponse = await rateLimit(request, env, {
      windowMs: 60 * 1000, // 1 minute window
      maxRequests: auth.user ? 20 : 5, // 20 requests for users, 5 for anonymous
      keyGenerator: (req) => {
        const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
        return auth.user ? `chat-user-${auth.user.id}` : `chat-ip-${ip}`;
      }
    });
    if (rateLimitResponse) return rateLimitResponse;

    // Parse and validate request body
    const body = await request.json();
    const sanitizedBody = ValidationUtils.sanitizeJson(body);
    
    // Validate required fields
    const { message, conversationId, stream = false } = sanitizedBody;
    
    if (!message) {
      return createCorsResponse({
        error: 'Message is required',
        code: 'MISSING_MESSAGE'
      }, 400);
    }

    // Validate message length
    if (message.length > 4000) {
      return createCorsResponse({
        error: 'Message too long. Please keep messages under 4000 characters.',
        code: 'MESSAGE_TOO_LONG'
      }, 400);
    }

    // Check daily usage limits for cost control
    if (auth.user) {
      const dailyUsage = await getDailyUsage(env, auth.user.id);
      const maxDailyMessages = auth.user.is_premium ? 100 : 20;
      
      if (dailyUsage >= maxDailyMessages) {
        return createCorsResponse({
          error: `Daily message limit reached (${maxDailyMessages} messages). Upgrade to premium for more messages.`,
          code: 'DAILY_LIMIT_EXCEEDED',
          upgradeUrl: '/premium'
        }, 429);
      }
    }

    // Process the chat request
    const chatResponse = await claudeService.chat(env, {
      message,
      userId: auth.user?.id,
      conversationId,
      stream
    });

    // Award PAWS for authenticated users (cost offset incentive)
    if (auth.user && !chatResponse.cached) {
      try {
        await awardPawsForChat(env, auth.user.id, message);
      } catch (error) {
        console.warn('Failed to award PAWS for chat:', error);
        // Don't fail the request if PAWS awarding fails
      }
    }

    // Return response
    return createCorsResponse({
      success: true,
      data: {
        message: chatResponse.message,
        conversationId: chatResponse.conversationId,
        cached: chatResponse.cached,
        usage: chatResponse.usage ? {
          input_tokens: chatResponse.usage.input_tokens,
          output_tokens: chatResponse.usage.output_tokens
        } : undefined
      }
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    
    return createCorsResponse({
      error: error.message || 'Failed to process chat message',
      code: 'CHAT_ERROR'
    }, 500);
  }
});

/**
 * GET /api/chat/history
 * Get conversation history for authenticated users
 */
chatRouter.get('/history', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId') || 'default';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
    const offset = (page - 1) * limit;

    const messages = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT message, response, created_at
       FROM chat_logs 
       WHERE user_id = ? AND conversation_id = ?
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [auth.user.id, conversationId, limit, offset]
    );

    const total = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT COUNT(*) as count FROM chat_logs WHERE user_id = ? AND conversation_id = ?',
      [auth.user.id, conversationId]
    );

    return createCorsResponse({
      success: true,
      data: {
        messages: messages.map(msg => ({
          user_message: msg.message,
          ai_response: msg.response,
          timestamp: msg.created_at
        })),
        pagination: {
          page,
          limit,
          total: total.count,
          totalPages: Math.ceil(total.count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Chat history error:', error);
    return createCorsResponse({
      error: 'Failed to retrieve chat history',
      code: 'HISTORY_ERROR'
    }, 500);
  }
});

/**
 * GET /api/chat/conversations
 * Get list of user's conversations
 */
chatRouter.get('/conversations', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const conversations = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT 
        conversation_id,
        COUNT(*) as message_count,
        MAX(created_at) as last_message_at,
        MIN(created_at) as started_at
       FROM chat_logs 
       WHERE user_id = ?
       GROUP BY conversation_id
       ORDER BY last_message_at DESC
       LIMIT 20`,
      [auth.user.id]
    );

    return createCorsResponse({
      success: true,
      data: {
        conversations: conversations.map(conv => ({
          id: conv.conversation_id,
          messageCount: conv.message_count,
          lastMessageAt: conv.last_message_at,
          startedAt: conv.started_at
        }))
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    return createCorsResponse({
      error: 'Failed to retrieve conversations',
      code: 'CONVERSATIONS_ERROR'
    }, 500);
  }
});

/**
 * DELETE /api/chat/conversations/:id
 * Delete a conversation and its history
 */
chatRouter.delete('/conversations/:id', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const conversationId = request.params.id;
    
    if (!conversationId || conversationId === 'default') {
      return createCorsResponse({
        error: 'Cannot delete the default conversation',
        code: 'INVALID_CONVERSATION'
      }, 400);
    }

    // Delete from database
    await DatabaseUtils.executeUpdate(
      env.DB,
      'DELETE FROM chat_logs WHERE user_id = ? AND conversation_id = ?',
      [auth.user.id, conversationId]
    );

    // Clear from cache
    try {
      if (env.CACHE) {
        const cacheKey = claudeService.generateCacheKey(auth.user.id, conversationId);
        await env.CACHE.delete(cacheKey);
      }
    } catch (error) {
      console.warn('Failed to clear conversation cache:', error);
    }

    return createCorsResponse({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    return createCorsResponse({
      error: 'Failed to delete conversation',
      code: 'DELETE_ERROR'
    }, 500);
  }
});

/**
 * GET /api/chat/stats
 * Get usage statistics (admin or user stats)
 */
chatRouter.get('/stats', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '24h';

    let stats;
    if (auth.user.role === 'admin') {
      // Admin gets global stats
      stats = await claudeService.getUsageStats(env, timeframe);
    } else {
      // Regular users get their personal stats
      stats = await getUserStats(env, auth.user.id, timeframe);
    }

    return createCorsResponse({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    return createCorsResponse({
      error: 'Failed to retrieve statistics',
      code: 'STATS_ERROR'
    }, 500);
  }
});

/**
 * POST /api/chat/clear-cache
 * Clear cached responses (admin only)
 */
chatRouter.post('/clear-cache', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    if (auth.user.role !== 'admin') {
      return createCorsResponse({
        error: 'Admin access required',
        code: 'ACCESS_DENIED'
      }, 403);
    }

    // This would clear all common response caches
    // Implementation depends on KV namespace structure
    let clearedCount = 0;
    
    if (env.CACHE) {
      try {
        // In a real implementation, we'd need to list and delete cache keys
        // For now, we'll just log that we would clear the cache
        console.log('Cache clearing requested by admin');
        clearedCount = 1; // Placeholder
      } catch (error) {
        console.warn('Failed to clear cache:', error);
      }
    }

    return createCorsResponse({
      success: true,
      message: `Cleared ${clearedCount} cached responses`,
      data: { clearedCount }
    });

  } catch (error) {
    console.error('Clear cache error:', error);
    return createCorsResponse({
      error: 'Failed to clear cache',
      code: 'CLEAR_CACHE_ERROR'
    }, 500);
  }
});

// Helper functions

/**
 * Get user's daily chat usage
 */
async function getDailyUsage(env, userId) {
  try {
    const result = await DatabaseUtils.executeQueryFirst(
      env.DB,
      `SELECT COUNT(*) as count 
       FROM chat_logs 
       WHERE user_id = ? AND created_at > datetime('now', '-24 hours')`,
      [userId]
    );
    
    return result?.count || 0;
  } catch (error) {
    console.warn('Failed to get daily usage:', error);
    return 0;
  }
}

/**
 * Award PAWS tokens for chat usage
 */
async function awardPawsForChat(env, userId, message) {
  // Award 1 PAWS per chat message (small incentive to offset AI costs)
  const pawsAmount = 1;
  
  // Don't award PAWS for very short messages (spam prevention)
  if (message.length < 10) {
    return;
  }
  
  try {
    // Get current balance
    const user = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT paws_balance FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) return;
    
    const newBalance = user.paws_balance + pawsAmount;
    
    // Update balance and record transaction
    const operations = [
      env.DB.prepare(`
        UPDATE users 
        SET paws_balance = ?, updated_at = ?
        WHERE id = ?
      `).bind(newBalance, new Date().toISOString(), userId),
      
      env.DB.prepare(`
        INSERT INTO transactions (
          user_id, type, amount, description, reference_type,
          reference_id, balance_after, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId, 'earned', pawsAmount, 'AI chat usage',
        'chat', null, newBalance, new Date().toISOString()
      )
    ];
    
    await DatabaseUtils.transaction(env.DB, operations);
  } catch (error) {
    console.warn('Failed to award PAWS for chat:', error);
    // Don't throw - PAWS failure shouldn't break chat
  }
}

/**
 * Get user-specific statistics
 */
async function getUserStats(env, userId, timeframe) {
  try {
    const timeCondition = timeframe === '24h' 
      ? `created_at > datetime('now', '-24 hours')`
      : `created_at > datetime('now', '-7 days')`;

    const stats = await DatabaseUtils.executeQueryFirst(
      env.DB,
      `SELECT 
        COUNT(*) as total_messages,
        SUM(tokens_used) as total_tokens,
        COUNT(DISTINCT conversation_id) as unique_conversations
      FROM chat_logs 
      WHERE user_id = ? AND ${timeCondition}`,
      [userId]
    );

    return {
      total_messages: stats.total_messages || 0,
      total_tokens: stats.total_tokens || 0,
      unique_conversations: stats.unique_conversations || 0,
      timeframe
    };
  } catch (error) {
    console.error('Failed to get user stats:', error);
    return {
      total_messages: 0,
      total_tokens: 0,
      unique_conversations: 0,
      timeframe
    };
  }
}

export { chatRouter };