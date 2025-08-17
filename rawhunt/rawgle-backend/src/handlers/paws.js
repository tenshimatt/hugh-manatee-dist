/**
 * PAWS Token Handler for Rawgle
 * Handles PAWS cryptocurrency transactions, rewards, and balance management
 */

import { Hono } from 'hono';
import { PAWSService } from '../services/paws-service.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { z } from 'zod';

const app = new Hono();

// All routes require authentication
app.use('*', authMiddleware);

// Validation schemas
const transferSchema = z.object({
  recipient_user_id: z.string().uuid('Invalid recipient user ID'),
  amount: z.number().int().positive('Amount must be positive'),
  reason: z.string().min(1, 'Reason is required').max(200, 'Reason too long'),
  message: z.string().max(500, 'Message too long').optional()
});

const earnSchema = z.object({
  action: z.enum([
    'feeding_log_created',
    'community_post_created',
    'product_review_created',
    'profile_completed',
    'referral_signup',
    'daily_login',
    'weekly_streak',
    'monthly_streak',
    'nft_minted',
    'supplier_verified',
    'expert_answer_given',
    'milestone_reached'
  ]),
  related_entity_id: z.string().optional(),
  multiplier: z.number().positive().max(10).default(1),
  details: z.record(z.any()).optional()
});

const spendSchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  purpose: z.enum([
    'nft_mint',
    'premium_feature',
    'marketplace_purchase',
    'expert_consultation',
    'priority_support',
    'advanced_analytics',
    'custom_meal_plan',
    'nutrition_analysis'
  ]),
  related_entity_id: z.string().optional(),
  details: z.record(z.any()).optional()
});

// GET /api/paws/balance - Get user's PAWS balance
app.get('/balance', async (c) => {
  try {
    const user = c.get('user');
    const pawsService = new PAWSService(c.env.DB, c.env.KV);
    
    const balance = await pawsService.getBalance(user.id);
    
    return c.json({
      success: true,
      data: {
        user_id: user.id,
        balance: balance.current,
        lifetime_earned: balance.lifetime_earned,
        lifetime_spent: balance.lifetime_spent,
        pending_transactions: balance.pending,
        last_updated: balance.last_updated
      }
    });
  } catch (error) {
    console.error('Get PAWS balance error:', error);
    return c.json({
      success: false,
      error: 'BALANCE_FETCH_FAILED',
      message: 'Failed to retrieve PAWS balance'
    }, 500);
  }
});

// GET /api/paws/transactions - Get transaction history
app.get('/transactions', async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    
    const {
      type,
      status,
      start_date,
      end_date,
      limit = 20,
      offset = 0,
      sort = 'created_at',
      order = 'desc'
    } = query;
    
    const pawsService = new PAWSService(c.env.DB, c.env.KV);
    
    const filters = {
      userId: user.id,
      type,
      status,
      startDate: start_date,
      endDate: end_date,
      limit: parseInt(limit),
      offset: parseInt(offset),
      sort,
      order
    };
    
    const result = await pawsService.getTransactionHistory(filters);
    
    return c.json({
      success: true,
      data: {
        transactions: result.transactions,
        total: result.total,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get PAWS transactions error:', error);
    return c.json({
      success: false,
      error: 'TRANSACTIONS_FETCH_FAILED',
      message: 'Failed to retrieve transaction history'
    }, 500);
  }
});

// POST /api/paws/earn - Award PAWS tokens for actions
app.post('/earn', validateRequest(earnSchema), async (c) => {
  try {
    const user = c.get('user');
    const { action, related_entity_id, multiplier, details } = c.get('validatedData');
    
    const pawsService = new PAWSService(c.env.DB, c.env.KV);
    
    // Calculate base reward amount based on action
    const baseRewards = {
      feeding_log_created: 10,
      community_post_created: 25,
      product_review_created: 15,
      profile_completed: 50,
      referral_signup: 100,
      daily_login: 5,
      weekly_streak: 50,
      monthly_streak: 200,
      nft_minted: 100,
      supplier_verified: 500,
      expert_answer_given: 75,
      milestone_reached: 250
    };
    
    const baseAmount = baseRewards[action] || 0;
    const finalAmount = Math.floor(baseAmount * multiplier);
    
    if (finalAmount <= 0) {
      return c.json({
        success: false,
        error: 'INVALID_REWARD',
        message: 'Invalid reward amount'
      }, 400);
    }
    
    // Check for duplicate rewards to prevent gaming
    const isDuplicate = await pawsService.checkDuplicateReward(
      user.id,
      action,
      related_entity_id
    );
    
    if (isDuplicate) {
      return c.json({
        success: false,
        error: 'DUPLICATE_REWARD',
        message: 'Reward already claimed for this action'
      }, 409);
    }
    
    const transaction = await pawsService.awardTokens(
      user.id,
      finalAmount,
      action,
      {
        related_entity_id,
        multiplier,
        ...details
      }
    );
    
    return c.json({
      success: true,
      message: 'PAWS tokens awarded successfully',
      data: {
        transaction,
        amount_earned: finalAmount,
        action,
        new_balance: transaction.balance_after
      }
    }, 201);
  } catch (error) {
    console.error('Earn PAWS tokens error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return c.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'EARN_FAILED',
      message: 'Failed to award PAWS tokens'
    }, 500);
  }
});

// POST /api/paws/spend - Spend PAWS tokens
app.post('/spend', validateRequest(spendSchema), async (c) => {
  try {
    const user = c.get('user');
    const { amount, purpose, related_entity_id, details } = c.get('validatedData');
    
    const pawsService = new PAWSService(c.env.DB, c.env.KV);
    
    // Check if user has sufficient balance
    const balance = await pawsService.getBalance(user.id);
    if (balance.current < amount) {
      return c.json({
        success: false,
        error: 'INSUFFICIENT_BALANCE',
        message: `Insufficient PAWS balance. Required: ${amount}, Available: ${balance.current}`
      }, 400);
    }
    
    const transaction = await pawsService.spendTokens(
      user.id,
      amount,
      purpose,
      {
        related_entity_id,
        ...details
      }
    );
    
    return c.json({
      success: true,
      message: 'PAWS tokens spent successfully',
      data: {
        transaction,
        amount_spent: amount,
        purpose,
        new_balance: transaction.balance_after
      }
    });
  } catch (error) {
    console.error('Spend PAWS tokens error:', error);
    
    if (error.message.includes('Insufficient')) {
      return c.json({
        success: false,
        error: 'INSUFFICIENT_BALANCE',
        message: error.message
      }, 400);
    }
    
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return c.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'SPEND_FAILED',
      message: 'Failed to spend PAWS tokens'
    }, 500);
  }
});

// POST /api/paws/transfer - Transfer PAWS tokens to another user
app.post('/transfer', validateRequest(transferSchema), async (c) => {
  try {
    const user = c.get('user');
    const { recipient_user_id, amount, reason, message } = c.get('validatedData');
    
    // Check if trying to transfer to self
    if (recipient_user_id === user.id) {
      return c.json({
        success: false,
        error: 'INVALID_RECIPIENT',
        message: 'Cannot transfer PAWS to yourself'
      }, 400);
    }
    
    // Verify recipient exists
    const recipientResult = await c.env.DB
      .prepare('SELECT id, name FROM users WHERE id = ? AND deleted_at IS NULL')
      .bind(recipient_user_id)
      .first();
    
    if (!recipientResult) {
      return c.json({
        success: false,
        error: 'RECIPIENT_NOT_FOUND',
        message: 'Recipient user not found'
      }, 404);
    }
    
    const pawsService = new PAWSService(c.env.DB, c.env.KV);
    
    // Check if sender has sufficient balance
    const balance = await pawsService.getBalance(user.id);
    if (balance.current < amount) {
      return c.json({
        success: false,
        error: 'INSUFFICIENT_BALANCE',
        message: `Insufficient PAWS balance. Required: ${amount}, Available: ${balance.current}`
      }, 400);
    }
    
    // Check daily transfer limits (prevent abuse)
    const dailyTransferLimit = 1000; // Maximum 1000 PAWS per day
    const dailyTransferred = await pawsService.getDailyTransferAmount(user.id);
    
    if (dailyTransferred + amount > dailyTransferLimit) {
      return c.json({
        success: false,
        error: 'DAILY_LIMIT_EXCEEDED',
        message: `Daily transfer limit exceeded. Limit: ${dailyTransferLimit}, Already transferred: ${dailyTransferred}`
      }, 429);
    }
    
    const result = await pawsService.transferTokens(
      user.id,
      recipient_user_id,
      amount,
      reason,
      { message }
    );
    
    return c.json({
      success: true,
      message: 'PAWS tokens transferred successfully',
      data: {
        transfer_id: result.transferId,
        sender_transaction: result.senderTransaction,
        recipient_transaction: result.recipientTransaction,
        amount_transferred: amount,
        recipient_name: recipientResult.name,
        sender_new_balance: result.senderTransaction.balance_after,
        reason
      }
    });
  } catch (error) {
    console.error('Transfer PAWS tokens error:', error);
    
    if (error.message.includes('Insufficient') || error.message.includes('limit')) {
      return c.json({
        success: false,
        error: 'TRANSFER_FAILED',
        message: error.message
      }, 400);
    }
    
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return c.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'TRANSFER_FAILED',
      message: 'Failed to transfer PAWS tokens'
    }, 500);
  }
});

// GET /api/paws/leaderboard - Get PAWS leaderboard
app.get('/leaderboard', async (c) => {
  try {
    const query = c.req.query();
    const { period = 'all_time', limit = 50, category = 'total_earned' } = query;
    
    const pawsService = new PAWSService(c.env.DB, c.env.KV);
    const leaderboard = await pawsService.getLeaderboard({
      period,
      limit: parseInt(limit),
      category
    });
    
    return c.json({
      success: true,
      data: {
        leaderboard,
        period,
        category,
        total_users: leaderboard.length
      }
    });
  } catch (error) {
    console.error('Get PAWS leaderboard error:', error);
    return c.json({
      success: false,
      error: 'LEADERBOARD_FETCH_FAILED',
      message: 'Failed to retrieve leaderboard'
    }, 500);
  }
});

// GET /api/paws/stats - Get PAWS ecosystem statistics
app.get('/stats', async (c) => {
  try {
    const pawsService = new PAWSService(c.env.DB, c.env.KV);
    const stats = await pawsService.getEcosystemStats();
    
    return c.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get PAWS stats error:', error);
    return c.json({
      success: false,
      error: 'STATS_FETCH_FAILED',
      message: 'Failed to retrieve ecosystem statistics'
    }, 500);
  }
});

// GET /api/paws/rewards-info - Get information about reward actions
app.get('/rewards-info', async (c) => {
  try {
    const rewardsInfo = {
      actions: {
        feeding_log_created: {
          base_amount: 10,
          description: 'Log a feeding session for your pet',
          cooldown: '1 hour',
          max_per_day: 10
        },
        community_post_created: {
          base_amount: 25,
          description: 'Create a helpful community post',
          cooldown: '6 hours',
          max_per_day: 4
        },
        product_review_created: {
          base_amount: 15,
          description: 'Write a detailed product review',
          cooldown: '1 hour',
          max_per_day: 5
        },
        profile_completed: {
          base_amount: 50,
          description: 'Complete your profile information',
          one_time_only: true
        },
        referral_signup: {
          base_amount: 100,
          description: 'Refer a friend who signs up',
          max_per_month: 10
        },
        daily_login: {
          base_amount: 5,
          description: 'Daily login bonus',
          cooldown: '24 hours'
        },
        weekly_streak: {
          base_amount: 50,
          description: 'Complete 7 consecutive days of feeding logs',
          cooldown: '7 days'
        },
        monthly_streak: {
          base_amount: 200,
          description: 'Complete 30 consecutive days of feeding logs',
          cooldown: '30 days'
        },
        nft_minted: {
          base_amount: 100,
          description: 'Mint an NFT of your pet',
          max_per_pet: 1
        },
        supplier_verified: {
          base_amount: 500,
          description: 'Get verified as a raw food supplier',
          one_time_only: true
        },
        expert_answer_given: {
          base_amount: 75,
          description: 'Provide expert answer that gets upvoted',
          cooldown: '1 hour'
        },
        milestone_reached: {
          base_amount: 250,
          description: 'Reach significant platform milestones',
          varies: true
        }
      },
      spending_options: {
        nft_mint: {
          cost: 500,
          description: 'Mint an NFT of your pet profile'
        },
        premium_feature: {
          cost: 100,
          description: 'Unlock premium features for 30 days'
        },
        marketplace_purchase: {
          cost: 'varies',
          description: 'Purchase items from the marketplace'
        },
        expert_consultation: {
          cost: 200,
          description: '30-minute consultation with raw feeding expert'
        },
        priority_support: {
          cost: 50,
          description: 'Get priority customer support for 7 days'
        },
        advanced_analytics: {
          cost: 150,
          description: 'Unlock advanced feeding analytics for 30 days'
        },
        custom_meal_plan: {
          cost: 300,
          description: 'Get a custom meal plan designed by experts'
        },
        nutrition_analysis: {
          cost: 75,
          description: 'Detailed nutritional analysis of your feeding logs'
        }
      }
    };
    
    return c.json({
      success: true,
      data: rewardsInfo
    });
  } catch (error) {
    console.error('Get rewards info error:', error);
    return c.json({
      success: false,
      error: 'INFO_FETCH_FAILED',
      message: 'Failed to retrieve rewards information'
    }, 500);
  }
});

export default app;