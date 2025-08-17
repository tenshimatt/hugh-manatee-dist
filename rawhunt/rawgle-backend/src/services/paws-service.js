/**
 * PAWS Service for Rawgle
 * Handles PAWS cryptocurrency token transactions, rewards, and balance management
 */

import { nanoid } from 'nanoid';

export class PAWSService {
  constructor(db, kv) {
    this.db = db;
    this.kv = kv;
  }

  /**
   * Get user's PAWS balance
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Balance information
   */
  async getBalance(userId) {
    const user = await this.db
      .prepare(`
        SELECT paws_balance, paws_lifetime_earned, paws_lifetime_spent, updated_at
        FROM users 
        WHERE id = ? AND deleted_at IS NULL
      `)
      .bind(userId)
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Get pending transactions count
    const pendingResult = await this.db
      .prepare(`
        SELECT COALESCE(SUM(CASE WHEN transaction_type = 'earned' THEN amount ELSE -amount END), 0) as pending_amount
        FROM paws_transactions 
        WHERE user_id = ? AND blockchain_status = 'pending'
      `)
      .bind(userId)
      .first();

    return {
      current: user.paws_balance,
      lifetime_earned: user.paws_lifetime_earned,
      lifetime_spent: user.paws_lifetime_spent,
      pending: pendingResult?.pending_amount || 0,
      last_updated: user.updated_at
    };
  }

  /**
   * Award PAWS tokens to a user
   * @param {string} userId - User ID
   * @param {number} amount - Amount to award
   * @param {string} reason - Reason for award
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Transaction record
   */
  async awardTokens(userId, amount, reason, metadata = {}) {
    if (amount <= 0) {
      throw new Error('Award amount must be positive');
    }

    // Check for duplicate rewards to prevent gaming
    if (metadata.related_entity_id) {
      const existingReward = await this.checkDuplicateReward(userId, reason, metadata.related_entity_id);
      if (existingReward) {
        throw new Error('Reward already claimed for this action');
      }
    }

    // Get current balance
    const currentUser = await this.db
      .prepare('SELECT paws_balance, paws_lifetime_earned FROM users WHERE id = ? AND deleted_at IS NULL')
      .bind(userId)
      .first();

    if (!currentUser) {
      throw new Error('User not found');
    }

    const balanceBefore = currentUser.paws_balance;
    const balanceAfter = balanceBefore + amount;
    const lifetimeEarned = currentUser.paws_lifetime_earned + amount;

    try {
      // Start transaction
      const transactionId = nanoid(21);
      const now = new Date().toISOString();

      // Create transaction record
      await this.db
        .prepare(`
          INSERT INTO paws_transactions (
            id, user_id, transaction_type, amount, balance_before, balance_after,
            reason, related_entity_type, related_entity_id, metadata, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          transactionId, userId, 'earned', amount, balanceBefore, balanceAfter,
          reason, metadata.related_entity_type || null, metadata.related_entity_id || null,
          JSON.stringify(metadata), now
        )
        .run();

      // Update user balance
      await this.db
        .prepare(`
          UPDATE users 
          SET paws_balance = ?, paws_lifetime_earned = ?, updated_at = ?
          WHERE id = ?
        `)
        .bind(balanceAfter, lifetimeEarned, now, userId)
        .run();

      // Cache recent transaction for quick access
      await this.kv.put(
        `recent_paws:${userId}:${transactionId}`,
        JSON.stringify({
          type: 'earned',
          amount,
          reason,
          timestamp: now
        }),
        { expirationTtl: 24 * 60 * 60 } // 24 hours
      );

      return {
        id: transactionId,
        type: 'earned',
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reason,
        metadata,
        created_at: now
      };
    } catch (error) {
      console.error('Award PAWS tokens error:', error);
      throw new Error('Failed to award PAWS tokens');
    }
  }

  /**
   * Spend PAWS tokens
   * @param {string} userId - User ID
   * @param {number} amount - Amount to spend
   * @param {string} purpose - Purpose of spending
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Transaction record
   */
  async spendTokens(userId, amount, purpose, metadata = {}) {
    if (amount <= 0) {
      throw new Error('Spend amount must be positive');
    }

    // Get current balance
    const currentUser = await this.db
      .prepare('SELECT paws_balance, paws_lifetime_spent FROM users WHERE id = ? AND deleted_at IS NULL')
      .bind(userId)
      .first();

    if (!currentUser) {
      throw new Error('User not found');
    }

    if (currentUser.paws_balance < amount) {
      throw new Error(`Insufficient PAWS balance. Required: ${amount}, Available: ${currentUser.paws_balance}`);
    }

    const balanceBefore = currentUser.paws_balance;
    const balanceAfter = balanceBefore - amount;
    const lifetimeSpent = currentUser.paws_lifetime_spent + amount;

    try {
      const transactionId = nanoid(21);
      const now = new Date().toISOString();

      // Create transaction record
      await this.db
        .prepare(`
          INSERT INTO paws_transactions (
            id, user_id, transaction_type, amount, balance_before, balance_after,
            reason, related_entity_type, related_entity_id, metadata, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          transactionId, userId, 'spent', amount, balanceBefore, balanceAfter,
          purpose, metadata.related_entity_type || null, metadata.related_entity_id || null,
          JSON.stringify(metadata), now
        )
        .run();

      // Update user balance
      await this.db
        .prepare(`
          UPDATE users 
          SET paws_balance = ?, paws_lifetime_spent = ?, updated_at = ?
          WHERE id = ?
        `)
        .bind(balanceAfter, lifetimeSpent, now, userId)
        .run();

      return {
        id: transactionId,
        type: 'spent',
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reason: purpose,
        metadata,
        created_at: now
      };
    } catch (error) {
      console.error('Spend PAWS tokens error:', error);
      throw new Error('Failed to spend PAWS tokens');
    }
  }

  /**
   * Transfer PAWS tokens between users
   * @param {string} fromUserId - Sender user ID
   * @param {string} toUserId - Recipient user ID
   * @param {number} amount - Amount to transfer
   * @param {string} reason - Reason for transfer
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Transfer result
   */
  async transferTokens(fromUserId, toUserId, amount, reason, metadata = {}) {
    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    if (fromUserId === toUserId) {
      throw new Error('Cannot transfer to self');
    }

    // Get both users' current balances
    const fromUser = await this.db
      .prepare('SELECT paws_balance, paws_lifetime_spent FROM users WHERE id = ? AND deleted_at IS NULL')
      .bind(fromUserId)
      .first();

    const toUser = await this.db
      .prepare('SELECT paws_balance, paws_lifetime_earned FROM users WHERE id = ? AND deleted_at IS NULL')
      .bind(toUserId)
      .first();

    if (!fromUser || !toUser) {
      throw new Error('One or both users not found');
    }

    if (fromUser.paws_balance < amount) {
      throw new Error(`Insufficient PAWS balance. Required: ${amount}, Available: ${fromUser.paws_balance}`);
    }

    try {
      const transferId = nanoid(21);
      const now = new Date().toISOString();

      // Create sender transaction
      const senderTransactionId = nanoid(21);
      const senderBalanceAfter = fromUser.paws_balance - amount;
      
      await this.db
        .prepare(`
          INSERT INTO paws_transactions (
            id, user_id, transaction_type, amount, balance_before, balance_after,
            reason, from_user_id, to_user_id, transfer_message, metadata, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          senderTransactionId, fromUserId, 'transferred', amount,
          fromUser.paws_balance, senderBalanceAfter,
          reason, fromUserId, toUserId, metadata.message || null,
          JSON.stringify({ ...metadata, transfer_id: transferId }), now
        )
        .run();

      // Create recipient transaction
      const recipientTransactionId = nanoid(21);
      const recipientBalanceAfter = toUser.paws_balance + amount;
      
      await this.db
        .prepare(`
          INSERT INTO paws_transactions (
            id, user_id, transaction_type, amount, balance_before, balance_after,
            reason, from_user_id, to_user_id, transfer_message, metadata, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          recipientTransactionId, toUserId, 'earned', amount,
          toUser.paws_balance, recipientBalanceAfter,
          `Transfer received: ${reason}`, fromUserId, toUserId, metadata.message || null,
          JSON.stringify({ ...metadata, transfer_id: transferId }), now
        )
        .run();

      // Update sender balance
      await this.db
        .prepare(`
          UPDATE users 
          SET paws_balance = ?, paws_lifetime_spent = ?, updated_at = ?
          WHERE id = ?
        `)
        .bind(senderBalanceAfter, fromUser.paws_lifetime_spent + amount, now, fromUserId)
        .run();

      // Update recipient balance
      await this.db
        .prepare(`
          UPDATE users 
          SET paws_balance = ?, paws_lifetime_earned = ?, updated_at = ?
          WHERE id = ?
        `)
        .bind(recipientBalanceAfter, toUser.paws_lifetime_earned + amount, now, toUserId)
        .run();

      return {
        transferId,
        senderTransaction: {
          id: senderTransactionId,
          balance_after: senderBalanceAfter
        },
        recipientTransaction: {
          id: recipientTransactionId,
          balance_after: recipientBalanceAfter
        }
      };
    } catch (error) {
      console.error('Transfer PAWS tokens error:', error);
      throw new Error('Failed to transfer PAWS tokens');
    }
  }

  /**
   * Get transaction history
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Transaction history
   */
  async getTransactionHistory(filters) {
    const {
      userId,
      type,
      status,
      startDate,
      endDate,
      limit = 20,
      offset = 0,
      sort = 'created_at',
      order = 'desc'
    } = filters;

    let query = `
      SELECT t.*, u_from.name as from_user_name, u_to.name as to_user_name
      FROM paws_transactions t
      LEFT JOIN users u_from ON t.from_user_id = u_from.id
      LEFT JOIN users u_to ON t.to_user_id = u_to.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (type) {
      query += ' AND t.transaction_type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND t.blockchain_status = ?';
      params.push(status);
    }

    if (startDate) {
      query += ' AND t.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND t.created_at <= ?';
      params.push(endDate);
    }

    // Count total records
    const countQuery = query.replace('SELECT t.*, u_from.name as from_user_name, u_to.name as to_user_name', 'SELECT COUNT(*) as total');
    const countResult = await this.db.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;

    // Add sorting and pagination
    query += ` ORDER BY t.${sort} ${order.toUpperCase()} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await this.db.prepare(query).bind(...params).all();

    const transactions = result.results.map(tx => ({
      id: tx.id,
      type: tx.transaction_type,
      amount: tx.amount,
      balance_before: tx.balance_before,
      balance_after: tx.balance_after,
      reason: tx.reason,
      related_entity_type: tx.related_entity_type,
      related_entity_id: tx.related_entity_id,
      from_user_id: tx.from_user_id,
      from_user_name: tx.from_user_name,
      to_user_id: tx.to_user_id,
      to_user_name: tx.to_user_name,
      transfer_message: tx.transfer_message,
      blockchain_status: tx.blockchain_status,
      blockchain_tx_hash: tx.blockchain_tx_hash,
      metadata: tx.metadata ? JSON.parse(tx.metadata) : {},
      created_at: tx.created_at,
      processed_at: tx.processed_at
    }));

    return {
      transactions,
      total
    };
  }

  /**
   * Check for duplicate rewards
   * @param {string} userId - User ID
   * @param {string} action - Action type
   * @param {string} relatedEntityId - Related entity ID
   * @returns {Promise<boolean>} Whether duplicate exists
   */
  async checkDuplicateReward(userId, action, relatedEntityId) {
    if (!relatedEntityId) {
      return false;
    }

    const existing = await this.db
      .prepare(`
        SELECT id FROM paws_transactions 
        WHERE user_id = ? AND reason = ? AND related_entity_id = ? AND transaction_type = 'earned'
      `)
      .bind(userId, action, relatedEntityId)
      .first();

    return !!existing;
  }

  /**
   * Get daily transfer amount (for rate limiting)
   * @param {string} userId - User ID
   * @returns {Promise<number>} Amount transferred today
   */
  async getDailyTransferAmount(userId) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = tomorrow.toISOString().split('T')[0];

    const result = await this.db
      .prepare(`
        SELECT COALESCE(SUM(amount), 0) as daily_total
        FROM paws_transactions 
        WHERE user_id = ? AND transaction_type = 'transferred' 
        AND created_at >= ? AND created_at < ?
      `)
      .bind(userId, today, tomorrowStart)
      .first();

    return result?.daily_total || 0;
  }

  /**
   * Get PAWS leaderboard
   * @param {Object} options - Leaderboard options
   * @returns {Promise<Array>} Leaderboard data
   */
  async getLeaderboard(options = {}) {
    const { period = 'all_time', limit = 50, category = 'total_earned' } = options;

    let query = `
      SELECT u.id, u.name, u.avatar_url, u.experience_level, u.created_at,
             u.paws_balance, u.paws_lifetime_earned, u.paws_lifetime_spent
      FROM users u
      WHERE u.deleted_at IS NULL AND u.paws_lifetime_earned > 0
    `;

    if (period === 'month') {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      query = `
        SELECT u.id, u.name, u.avatar_url, u.experience_level, u.created_at,
               u.paws_balance, COALESCE(SUM(t.amount), 0) as period_earned
        FROM users u
        LEFT JOIN paws_transactions t ON u.id = t.user_id 
          AND t.transaction_type = 'earned' 
          AND t.created_at >= '${monthStart.toISOString()}'
        WHERE u.deleted_at IS NULL
        GROUP BY u.id
        HAVING period_earned > 0
      `;
    }

    // Add ordering based on category
    if (category === 'current_balance') {
      query += ' ORDER BY u.paws_balance DESC';
    } else if (category === 'total_spent') {
      query += ' ORDER BY u.paws_lifetime_spent DESC';
    } else if (period === 'month') {
      query += ' ORDER BY period_earned DESC';
    } else {
      query += ' ORDER BY u.paws_lifetime_earned DESC';
    }

    query += ` LIMIT ?`;

    const result = await this.db.prepare(query).bind(limit).all();

    return result.results.map((user, index) => ({
      rank: index + 1,
      user_id: user.id,
      name: user.name,
      avatar_url: user.avatar_url,
      experience_level: user.experience_level,
      current_balance: user.paws_balance,
      lifetime_earned: user.paws_lifetime_earned,
      lifetime_spent: user.paws_lifetime_spent,
      period_earned: user.period_earned || user.paws_lifetime_earned,
      member_since: user.created_at
    }));
  }

  /**
   * Get ecosystem statistics
   * @returns {Promise<Object>} Ecosystem stats
   */
  async getEcosystemStats() {
    // Total PAWS in circulation
    const circulationResult = await this.db
      .prepare(`
        SELECT 
          COALESCE(SUM(paws_balance), 0) as total_in_circulation,
          COALESCE(SUM(paws_lifetime_earned), 0) as total_ever_earned,
          COALESCE(SUM(paws_lifetime_spent), 0) as total_ever_spent,
          COUNT(*) as total_users
        FROM users 
        WHERE deleted_at IS NULL
      `)
      .first();

    // Active users (users with PAWS activity in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const activeUsersResult = await this.db
      .prepare(`
        SELECT COUNT(DISTINCT user_id) as active_users
        FROM paws_transactions 
        WHERE created_at >= ?
      `)
      .bind(thirtyDaysAgo)
      .first();

    // Recent transaction volume (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentVolumeResult = await this.db
      .prepare(`
        SELECT 
          COUNT(*) as transaction_count,
          COALESCE(SUM(amount), 0) as total_volume
        FROM paws_transactions 
        WHERE created_at >= ?
      `)
      .bind(sevenDaysAgo)
      .first();

    // Top earning activities
    const topActivitiesResult = await this.db
      .prepare(`
        SELECT 
          reason,
          COUNT(*) as frequency,
          COALESCE(SUM(amount), 0) as total_awarded
        FROM paws_transactions 
        WHERE transaction_type = 'earned' AND created_at >= ?
        GROUP BY reason
        ORDER BY total_awarded DESC
        LIMIT 10
      `)
      .bind(thirtyDaysAgo)
      .all();

    return {
      circulation: {
        total_in_circulation: circulationResult.total_in_circulation,
        total_ever_earned: circulationResult.total_ever_earned,
        total_ever_spent: circulationResult.total_ever_spent
      },
      users: {
        total_users: circulationResult.total_users,
        active_users_30d: activeUsersResult.active_users
      },
      activity: {
        transactions_7d: recentVolumeResult.transaction_count,
        volume_7d: recentVolumeResult.total_volume
      },
      top_earning_activities: topActivitiesResult.results,
      last_updated: new Date().toISOString()
    };
  }
}