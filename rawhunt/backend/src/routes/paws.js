import { Router } from 'itty-router';
import { ValidationUtils, pawsTransferSchema, pawsEarnSchema } from '../utils/validation.js';
import { UserQueries, TransactionQueries, DatabaseUtils } from '../utils/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { createCorsResponse } from '../middleware/cors.js';

const pawsRouter = Router({ base: '/api/paws' });

/**
 * GET /api/paws/balance
 * Get user's PAWS balance
 */
pawsRouter.get('/balance', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const user = await UserQueries.findById(env.DB, auth.user.id);
    
    if (!user) {
      return createCorsResponse({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, 404);
    }

    return createCorsResponse({
      success: true,
      data: {
        balance: user.paws_balance,
        userId: user.id
      }
    });

  } catch (error) {
    console.error('Get PAWS balance error:', error);
    return createCorsResponse({
      error: 'Failed to get PAWS balance',
      code: 'BALANCE_ERROR'
    }, 500);
  }
});

/**
 * GET /api/paws/transactions
 * Get user's PAWS transaction history
 */
pawsRouter.get('/transactions', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100);

    const transactions = await TransactionQueries.getByUserId(env.DB, auth.user.id, page, limit);

    // Get total count for pagination
    const countResult = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?',
      [auth.user.id]
    );

    return createCorsResponse({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get PAWS transactions error:', error);
    return createCorsResponse({
      error: 'Failed to get transaction history',
      code: 'TRANSACTIONS_ERROR'
    }, 500);
  }
});

/**
 * POST /api/paws/transfer
 * Transfer PAWS to another user
 */
pawsRouter.post('/transfer', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    // Rate limiting for transfers
    const rateLimitResponse = await rateLimit(request, env, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5 // 5 transfers per minute
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    
    // Validate input
    const validatedData = ValidationUtils.validateRequest(pawsTransferSchema, body);

    // Check if trying to transfer to self
    if (validatedData.toUserId === auth.user.id) {
      return createCorsResponse({
        error: 'Cannot transfer PAWS to yourself',
        code: 'SELF_TRANSFER'
      }, 400);
    }

    // Get sender's current balance
    const sender = await UserQueries.findById(env.DB, auth.user.id);
    if (sender.paws_balance < validatedData.amount) {
      return createCorsResponse({
        error: 'Insufficient PAWS balance',
        code: 'INSUFFICIENT_BALANCE'
      }, 400);
    }

    // Check if recipient exists
    const recipient = await UserQueries.findById(env.DB, validatedData.toUserId);
    if (!recipient) {
      return createCorsResponse({
        error: 'Recipient user not found',
        code: 'RECIPIENT_NOT_FOUND'
      }, 404);
    }

    // Perform transfer transaction
    const operations = [
      // Deduct from sender
      env.DB.prepare(`
        UPDATE users 
        SET paws_balance = paws_balance - ?, updated_at = ?
        WHERE id = ?
      `).bind(validatedData.amount, DatabaseUtils.formatDateForDB(), auth.user.id),
      
      // Add to recipient
      env.DB.prepare(`
        UPDATE users 
        SET paws_balance = paws_balance + ?, updated_at = ?
        WHERE id = ?
      `).bind(validatedData.amount, DatabaseUtils.formatDateForDB(), validatedData.toUserId),
      
      // Record sender transaction
      env.DB.prepare(`
        INSERT INTO transactions (
          user_id, type, amount, description, reference_type,
          from_user_id, to_user_id, balance_after, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        auth.user.id, 'transfer_out', -validatedData.amount, validatedData.description,
        'transfer', auth.user.id, validatedData.toUserId,
        sender.paws_balance - validatedData.amount, DatabaseUtils.formatDateForDB()
      ),
      
      // Record recipient transaction
      env.DB.prepare(`
        INSERT INTO transactions (
          user_id, type, amount, description, reference_type,
          from_user_id, to_user_id, balance_after, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        validatedData.toUserId, 'transfer_in', validatedData.amount, validatedData.description,
        'transfer', auth.user.id, validatedData.toUserId,
        recipient.paws_balance + validatedData.amount, DatabaseUtils.formatDateForDB()
      )
    ];

    await DatabaseUtils.transaction(env.DB, operations);

    // Get updated balances
    const updatedSender = await UserQueries.findById(env.DB, auth.user.id);
    const updatedRecipient = await UserQueries.findById(env.DB, validatedData.toUserId);

    return createCorsResponse({
      success: true,
      data: {
        transfer: {
          amount: validatedData.amount,
          from: {
            id: auth.user.id,
            name: `${sender.first_name} ${sender.last_name}`,
            newBalance: updatedSender.paws_balance
          },
          to: {
            id: validatedData.toUserId,
            name: `${recipient.first_name} ${recipient.last_name}`,
            newBalance: updatedRecipient.paws_balance
          },
          description: validatedData.description
        }
      },
      message: 'PAWS transfer completed successfully'
    });

  } catch (error) {
    console.error('PAWS transfer error:', error);
    
    if (error.message.startsWith('[')) {
      return createCorsResponse({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: JSON.parse(error.message)
      }, 400);
    }

    return createCorsResponse({
      error: 'Transfer failed',
      code: 'TRANSFER_ERROR'
    }, 500);
  }
});

/**
 * POST /api/paws/earn
 * Award PAWS to user (internal system use)
 */
pawsRouter.post('/earn', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    
    // Validate input
    const validatedData = ValidationUtils.validateRequest(pawsEarnSchema, body);

    // Get PAWS earning rates from environment
    const earningRates = JSON.parse(env.PAWS_EARNING_RATES || '{}');
    const expectedAmount = earningRates[validatedData.type];

    // Security check: ensure amount matches expected earning rate
    if (expectedAmount && validatedData.amount !== expectedAmount) {
      return createCorsResponse({
        error: 'Invalid earning amount for this type',
        code: 'INVALID_EARNING_AMOUNT'
      }, 400);
    }

    // Check daily earning limits (prevent abuse)
    const today = new Date().toISOString().split('T')[0];
    const dailyEarnings = await DatabaseUtils.executeQueryFirst(
      env.DB,
      `SELECT SUM(amount) as total 
       FROM transactions 
       WHERE user_id = ? AND type = 'earned' 
       AND DATE(created_at) = ?`,
      [auth.user.id, today]
    );

    const dailyLimit = 1000; // 1000 PAWS per day limit
    const currentDailyTotal = dailyEarnings?.total || 0;

    if (currentDailyTotal + validatedData.amount > dailyLimit) {
      return createCorsResponse({
        error: 'Daily PAWS earning limit exceeded',
        code: 'DAILY_LIMIT_EXCEEDED'
      }, 429);
    }

    // Get current balance
    const user = await UserQueries.findById(env.DB, auth.user.id);
    const newBalance = user.paws_balance + validatedData.amount;

    // Update balance and record transaction
    const operations = [
      env.DB.prepare(`
        UPDATE users 
        SET paws_balance = ?, updated_at = ?
        WHERE id = ?
      `).bind(newBalance, DatabaseUtils.formatDateForDB(), auth.user.id),
      
      env.DB.prepare(`
        INSERT INTO transactions (
          user_id, type, amount, description, reference_type,
          reference_id, balance_after, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        auth.user.id, 'earned', validatedData.amount, validatedData.description,
        validatedData.type, validatedData.referenceId, newBalance,
        DatabaseUtils.formatDateForDB()
      )
    ];

    await DatabaseUtils.transaction(env.DB, operations);

    return createCorsResponse({
      success: true,
      data: {
        earned: validatedData.amount,
        newBalance,
        type: validatedData.type,
        description: validatedData.description
      },
      message: 'PAWS earned successfully'
    });

  } catch (error) {
    console.error('PAWS earn error:', error);
    
    if (error.message.startsWith('[')) {
      return createCorsResponse({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: JSON.parse(error.message)
      }, 400);
    }

    return createCorsResponse({
      error: 'Failed to earn PAWS',
      code: 'EARN_ERROR'
    }, 500);
  }
});

/**
 * POST /api/paws/spend
 * Spend PAWS (for purchases, upgrades, etc.)
 */
pawsRouter.post('/spend', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    
    if (!body.amount || !body.description) {
      return createCorsResponse({
        error: 'Amount and description are required',
        code: 'MISSING_FIELDS'
      }, 400);
    }

    const amount = parseInt(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return createCorsResponse({
        error: 'Invalid amount',
        code: 'INVALID_AMOUNT'
      }, 400);
    }

    // Get current balance
    const user = await UserQueries.findById(env.DB, auth.user.id);
    if (user.paws_balance < amount) {
      return createCorsResponse({
        error: 'Insufficient PAWS balance',
        code: 'INSUFFICIENT_BALANCE'
      }, 400);
    }

    const newBalance = user.paws_balance - amount;

    // Update balance and record transaction
    const operations = [
      env.DB.prepare(`
        UPDATE users 
        SET paws_balance = ?, updated_at = ?
        WHERE id = ?
      `).bind(newBalance, DatabaseUtils.formatDateForDB(), auth.user.id),
      
      env.DB.prepare(`
        INSERT INTO transactions (
          user_id, type, amount, description, reference_type,
          reference_id, balance_after, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        auth.user.id, 'spent', -amount, body.description,
        body.referenceType || 'purchase', body.referenceId, newBalance,
        DatabaseUtils.formatDateForDB()
      )
    ];

    await DatabaseUtils.transaction(env.DB, operations);

    return createCorsResponse({
      success: true,
      data: {
        spent: amount,
        newBalance,
        description: body.description
      },
      message: 'PAWS spent successfully'
    });

  } catch (error) {
    console.error('PAWS spend error:', error);
    return createCorsResponse({
      error: 'Failed to spend PAWS',
      code: 'SPEND_ERROR'
    }, 500);
  }
});

/**
 * GET /api/paws/leaderboard
 * Get PAWS leaderboard
 */
pawsRouter.get('/leaderboard', async (request, env) => {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 10, 100);

    const leaderboard = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT u.id, u.first_name, u.last_name, u.paws_balance, u.created_at
       FROM users u 
       WHERE u.paws_balance > 0
       ORDER BY u.paws_balance DESC 
       LIMIT ?`,
      [limit]
    );

    const processedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: `${user.first_name} ${user.last_name.charAt(0)}.`,
      pawsBalance: user.paws_balance,
      memberSince: user.created_at
    }));

    return createCorsResponse({
      success: true,
      data: { leaderboard: processedLeaderboard }
    });

  } catch (error) {
    console.error('Get PAWS leaderboard error:', error);
    return createCorsResponse({
      error: 'Failed to get leaderboard',
      code: 'LEADERBOARD_ERROR'
    }, 500);
  }
});

/**
 * POST /api/paws/admin/mint
 * Admin: Mint PAWS for a user (emergency/promotional use)
 */
pawsRouter.post('/admin/mint', async (request, env) => {
  try {
    const auth = await requireAdmin(request, env);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const sanitizedBody = ValidationUtils.sanitizeJson(body);
    
    if (!sanitizedBody.userId || !sanitizedBody.amount || !sanitizedBody.reason) {
      return createCorsResponse({
        error: 'User ID, amount, and reason are required',
        code: 'MISSING_FIELDS'
      }, 400);
    }

    const amount = parseInt(sanitizedBody.amount);
    if (isNaN(amount) || amount <= 0 || amount > 10000) {
      return createCorsResponse({
        error: 'Invalid amount (1-10000 PAWS allowed)',
        code: 'INVALID_AMOUNT'
      }, 400);
    }

    // Check if target user exists
    const targetUser = await UserQueries.findById(env.DB, sanitizedBody.userId);
    if (!targetUser) {
      return createCorsResponse({
        error: 'Target user not found',
        code: 'USER_NOT_FOUND'
      }, 404);
    }

    const newBalance = targetUser.paws_balance + amount;

    // Update balance and record transaction
    const operations = [
      env.DB.prepare(`
        UPDATE users 
        SET paws_balance = ?, updated_at = ?
        WHERE id = ?
      `).bind(newBalance, DatabaseUtils.formatDateForDB(), sanitizedBody.userId),
      
      env.DB.prepare(`
        INSERT INTO transactions (
          user_id, type, amount, description, reference_type,
          balance_after, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        sanitizedBody.userId, 'admin_adjustment', amount, 
        `Admin mint: ${sanitizedBody.reason}`, 'admin_mint',
        newBalance, DatabaseUtils.formatDateForDB()
      )
    ];

    await DatabaseUtils.transaction(env.DB, operations);

    return createCorsResponse({
      success: true,
      data: {
        userId: sanitizedBody.userId,
        minted: amount,
        newBalance,
        reason: sanitizedBody.reason,
        adminId: auth.user.id
      },
      message: 'PAWS minted successfully'
    });

  } catch (error) {
    console.error('PAWS admin mint error:', error);
    return createCorsResponse({
      error: 'Failed to mint PAWS',
      code: 'ADMIN_MINT_ERROR'
    }, 500);
  }
});

/**
 * GET /api/paws/admin/stats
 * Admin: Get PAWS system statistics
 */
pawsRouter.get('/admin/stats', async (request, env) => {
  try {
    const auth = await requireAdmin(request, env);
    if (auth instanceof Response) return auth;

    const stats = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT 
        COUNT(DISTINCT u.id) as total_users,
        SUM(u.paws_balance) as total_paws_in_circulation,
        AVG(u.paws_balance) as average_balance,
        (SELECT COUNT(*) FROM transactions WHERE type = 'earned' AND DATE(created_at) = DATE('now')) as daily_earnings,
        (SELECT COUNT(*) FROM transactions WHERE type = 'spent' AND DATE(created_at) = DATE('now')) as daily_spending,
        (SELECT COUNT(*) FROM transactions WHERE type LIKE 'transfer_%' AND DATE(created_at) = DATE('now')) as daily_transfers
       FROM users u WHERE u.paws_balance > 0`
    );

    const recentTransactions = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT t.*, u.first_name, u.last_name
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC
       LIMIT 20`
    );

    return createCorsResponse({
      success: true,
      data: {
        statistics: stats[0] || {},
        recentTransactions
      }
    });

  } catch (error) {
    console.error('PAWS admin stats error:', error);
    return createCorsResponse({
      error: 'Failed to get PAWS statistics',
      code: 'ADMIN_STATS_ERROR'
    }, 500);
  }
});

export { pawsRouter };