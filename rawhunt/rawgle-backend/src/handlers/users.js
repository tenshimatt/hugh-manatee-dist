/**
 * User Management Handler for Rawgle
 * Handles user profile and account management beyond authentication
 */

import { Hono } from 'hono';
import { AuthService } from '../services/auth-service.js';
import { authMiddleware, premiumAuthMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { z } from 'zod';

const app = new Hono();

// All routes require authentication
app.use('*', authMiddleware);

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  location: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'professional']).optional(),
  social_links: z.object({
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    website: z.string().url().optional()
  }).optional()
});

// GET /api/users/me - Get current user profile
app.get('/me', async (c) => {
  try {
    const user = c.get('user');
    const authService = new AuthService(c.env.DB, c.env.KV);
    
    const profile = await authService.getUserProfile(user.id);
    
    return c.json({
      success: true,
      data: {
        user: profile
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return c.json({
      success: false,
      error: 'PROFILE_FETCH_FAILED',
      message: 'Failed to retrieve user profile'
    }, 500);
  }
});

// PUT /api/users/me - Update current user profile
app.put('/me', validateRequest(updateUserSchema), async (c) => {
  try {
    const user = c.get('user');
    const updates = c.get('validatedData');
    const authService = new AuthService(c.env.DB, c.env.KV);
    
    const updatedProfile = await authService.updateProfile(user.id, updates);
    
    return c.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedProfile
      }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return c.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'PROFILE_UPDATE_FAILED',
      message: 'Failed to update profile'
    }, 500);
  }
});

// GET /api/users/stats - Get user statistics
app.get('/stats', async (c) => {
  try {
    const user = c.get('user');
    
    // Get various stats
    const petCount = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM pets WHERE user_id = ? AND active = 1')
      .bind(user.id)
      .first();
    
    const feedingLogCount = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM feeding_logs WHERE user_id = ?')
      .bind(user.id)
      .first();
    
    const pawsBalance = await c.env.DB
      .prepare('SELECT paws_balance, paws_lifetime_earned FROM users WHERE id = ?')
      .bind(user.id)
      .first();
    
    const communityStats = await c.env.DB
      .prepare(`
        SELECT 
          COUNT(*) as post_count,
          SUM(upvotes - downvotes) as net_votes,
          SUM(view_count) as total_views
        FROM community_posts 
        WHERE user_id = ?
      `)
      .bind(user.id)
      .first();
    
    const recentActivity = await c.env.DB
      .prepare(`
        SELECT 
          'feeding_log' as type,
          id,
          feeding_date as date,
          pet_id
        FROM feeding_logs 
        WHERE user_id = ? 
        ORDER BY feeding_date DESC 
        LIMIT 5
      `)
      .bind(user.id)
      .all();
    
    const stats = {
      pets: {
        total: petCount?.count || 0
      },
      feeding: {
        total_logs: feedingLogCount?.count || 0,
        recent_activity: recentActivity.results || []
      },
      paws: {
        balance: pawsBalance?.paws_balance || 0,
        lifetime_earned: pawsBalance?.paws_lifetime_earned || 0
      },
      community: {
        posts: communityStats?.post_count || 0,
        net_votes: communityStats?.net_votes || 0,
        total_views: communityStats?.total_views || 0
      }
    };
    
    return c.json({
      success: true,
      data: {
        user_id: user.id,
        stats
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    return c.json({
      success: false,
      error: 'STATS_FETCH_FAILED',
      message: 'Failed to retrieve user statistics'
    }, 500);
  }
});

// GET /api/users/dashboard - Get user dashboard data
app.get('/dashboard', async (c) => {
  try {
    const user = c.get('user');
    
    // Get active pets
    const pets = await c.env.DB
      .prepare(`
        SELECT id, name, species, breed, birth_date, weight_lbs, 
               photos, feeding_type, nft_minted
        FROM pets 
        WHERE user_id = ? AND active = 1
        ORDER BY created_at DESC
      `)
      .bind(user.id)
      .all();
    
    // Get recent feeding logs
    const recentFeedings = await c.env.DB
      .prepare(`
        SELECT fl.id, fl.pet_id, fl.feeding_date, fl.meal_type, 
               fl.food_type, fl.amount_oz, fl.amount_grams,
               p.name as pet_name
        FROM feeding_logs fl
        JOIN pets p ON fl.pet_id = p.id
        WHERE fl.user_id = ?
        ORDER BY fl.feeding_date DESC, fl.feeding_time DESC
        LIMIT 10
      `)
      .bind(user.id)
      .all();
    
    // Get PAWS summary
    const pawsData = await c.env.DB
      .prepare('SELECT paws_balance, paws_lifetime_earned FROM users WHERE id = ?')
      .bind(user.id)
      .first();
    
    // Get recent PAWS transactions
    const recentPawsTransactions = await c.env.DB
      .prepare(`
        SELECT id, transaction_type, amount, reason, created_at
        FROM paws_transactions
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 5
      `)
      .bind(user.id)
      .all();
    
    const dashboardData = {
      pets: (pets.results || []).map(pet => ({
        ...pet,
        photos: JSON.parse(pet.photos || '[]')
      })),
      recent_feedings: (recentFeedings.results || []),
      paws: {
        balance: pawsData?.paws_balance || 0,
        lifetime_earned: pawsData?.paws_lifetime_earned || 0,
        recent_transactions: recentPawsTransactions.results || []
      },
      summary: {
        total_pets: pets.results?.length || 0,
        total_feedings: recentFeedings.results?.length || 0,
        active_streak_days: 0 // TODO: Calculate feeding streak
      }
    };
    
    return c.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Get user dashboard error:', error);
    return c.json({
      success: false,
      error: 'DASHBOARD_FETCH_FAILED',
      message: 'Failed to retrieve dashboard data'
    }, 500);
  }
});

// GET /api/users/leaderboard - Get PAWS leaderboard
app.get('/leaderboard', async (c) => {
  try {
    const query = c.req.query();
    const { period = 'all_time', limit = 50 } = query;
    
    let leaderboardQuery;
    
    if (period === 'monthly') {
      const thisMonth = new Date().toISOString().slice(0, 7) + '%';
      leaderboardQuery = c.env.DB
        .prepare(`
          SELECT u.id, u.name, u.avatar_url, SUM(pt.amount) as paws_earned
          FROM users u
          JOIN paws_transactions pt ON u.id = pt.user_id
          WHERE pt.transaction_type = 'earned' 
            AND pt.created_at LIKE ?
            AND u.deleted_at IS NULL
          GROUP BY u.id, u.name, u.avatar_url
          ORDER BY paws_earned DESC
          LIMIT ?
        `)
        .bind(thisMonth, parseInt(limit));
    } else {
      leaderboardQuery = c.env.DB
        .prepare(`
          SELECT id, name, avatar_url, paws_lifetime_earned as paws_earned
          FROM users 
          WHERE deleted_at IS NULL
            AND paws_lifetime_earned > 0
          ORDER BY paws_lifetime_earned DESC
          LIMIT ?
        `)
        .bind(parseInt(limit));
    }
    
    const leaderboard = await leaderboardQuery.all();
    
    return c.json({
      success: true,
      data: {
        period,
        leaderboard: (leaderboard.results || []).map((user, index) => ({
          rank: index + 1,
          ...user
        }))
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return c.json({
      success: false,
      error: 'LEADERBOARD_FETCH_FAILED',
      message: 'Failed to retrieve leaderboard'
    }, 500);
  }
});

export default app;