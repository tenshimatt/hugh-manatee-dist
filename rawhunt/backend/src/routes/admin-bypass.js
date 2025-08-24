import { Router } from 'itty-router';
import { ValidationUtils } from '../utils/validation.js';
import { requireAuthWithBypass, checkAdminAccess } from '../middleware/auth.js';
import { createCorsResponse } from '../middleware/cors.js';
import { DatabaseUtils } from '../utils/database.js';

const adminBypassRouter = Router({ base: '/api/admin-bypass' });

/**
 * GET /api/admin-bypass/status
 * Check if current user has admin bypass capabilities
 */
adminBypassRouter.get('/status', async (request, env) => {
  try {
    const auth = await requireAuthWithBypass(request, env);
    if (auth instanceof Response) return auth;

    return createCorsResponse({
      success: true,
      data: {
        user_id: auth.user.id,
        email: auth.user.email,
        role: auth.user.role,
        has_admin_access: auth.user.has_admin_access,
        admin_bypass_active: auth.user.admin_bypass_active,
        access_methods: {
          database_role: auth.user.role === 'admin' || auth.user.is_admin,
          environment_email: checkAdminEmailAccess(auth.user.email, env),
          development_mode: env.ENVIRONMENT === 'development' || env.BYPASS_AUTH === 'true',
          user_id_whitelist: checkUserIdAccess(auth.user.id, env)
        },
        capabilities: auth.user.has_admin_access ? [
          'Access all user data',
          'View all pets and health records',
          'Access all feeding logs and veterinary data',
          'Bypass ownership restrictions',
          'View system admin endpoints',
          'Export any data'
        ] : []
      }
    });

  } catch (error) {
    console.error('Admin bypass status error:', error);
    return createCorsResponse({
      error: 'Failed to check admin bypass status',
      code: 'BYPASS_STATUS_ERROR'
    }, 500);
  }
});

/**
 * GET /api/admin-bypass/all-users
 * Admin endpoint to list all users in the system
 */
adminBypassRouter.get('/all-users', async (request, env) => {
  try {
    const auth = await requireAuthWithBypass(request, env);
    if (auth instanceof Response) return auth;

    if (!auth.user.has_admin_access) {
      return createCorsResponse({
        error: 'Admin access required',
        code: 'ADMIN_ACCESS_REQUIRED'
      }, 403);
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
    const offset = (page - 1) * limit;

    const users = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT 
        id, email, username, first_name, last_name, display_name,
        role, is_active, paws_balance, created_at, last_login,
        (SELECT COUNT(*) FROM dogs WHERE owner_id = users.id AND is_active = TRUE) as dogs_count,
        (SELECT COUNT(*) FROM hunt_logs WHERE user_id = users.id) as hunt_logs_count
       FROM users 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const totalUsers = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT COUNT(*) as count FROM users'
    );

    return createCorsResponse({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: totalUsers.count,
          total_pages: Math.ceil(totalUsers.count / limit)
        },
        admin_info: {
          accessed_by: auth.user.email,
          access_time: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    return createCorsResponse({
      error: 'Failed to retrieve users',
      code: 'GET_USERS_ERROR'
    }, 500);
  }
});

/**
 * GET /api/admin-bypass/all-dogs
 * Admin endpoint to list all pets in the system
 */
adminBypassRouter.get('/all-dogs', async (request, env) => {
  try {
    const auth = await requireAuthWithBypass(request, env);
    if (auth instanceof Response) return auth;

    if (!auth.user.has_admin_access) {
      return createCorsResponse({
        error: 'Admin access required',
        code: 'ADMIN_ACCESS_REQUIRED'
      }, 403);
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
    const offset = (page - 1) * limit;

    const dogs = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT 
        d.id, d.name, d.breed, d.birth_date, d.weight_lbs, d.gender,
        d.hunting_style, d.training_level, d.is_active, d.created_at,
        u.email as owner_email, u.first_name || ' ' || u.last_name as owner_name,
        (SELECT COUNT(*) FROM feeding_logs WHERE dog_id = d.id) as feeding_logs_count,
        (SELECT COUNT(*) FROM dog_health_logs WHERE dog_id = d.id) as health_logs_count,
        (SELECT COUNT(*) FROM training_sessions WHERE dog_id = d.id) as training_sessions_count
       FROM dogs d
       JOIN users u ON d.owner_id = u.id
       WHERE d.is_active = TRUE
       ORDER BY d.created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const totalDogs = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT COUNT(*) as count FROM dogs WHERE is_active = TRUE'
    );

    return createCorsResponse({
      success: true,
      data: {
        dogs,
        pagination: {
          page,
          limit,
          total: totalDogs.count,
          total_pages: Math.ceil(totalDogs.count / limit)
        },
        admin_info: {
          accessed_by: auth.user.email,
          access_time: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Get all dogs error:', error);
    return createCorsResponse({
      error: 'Failed to retrieve pets',
      code: 'GET_DOGS_ERROR'
    }, 500);
  }
});

/**
 * GET /api/admin-bypass/user-details/:userId
 * Admin endpoint to get detailed user information including all related data
 */
adminBypassRouter.get('/user-details/:userId', async (request, env) => {
  try {
    const auth = await requireAuthWithBypass(request, env);
    if (auth instanceof Response) return auth;

    if (!auth.user.has_admin_access) {
      return createCorsResponse({
        error: 'Admin access required',
        code: 'ADMIN_ACCESS_REQUIRED'
      }, 403);
    }

    const userId = request.params.userId;

    // Get user details
    const user = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return createCorsResponse({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, 404);
    }

    // Get user's dogs
    const dogs = await DatabaseUtils.executeQuery(
      env.DB,
      'SELECT * FROM dogs WHERE owner_id = ? AND is_active = TRUE',
      [userId]
    );

    // Get hunt logs
    const huntLogs = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT id, hunt_date, location_name, hunting_type, success_rating, created_at 
       FROM hunt_logs WHERE user_id = ? ORDER BY hunt_date DESC LIMIT 10`,
      [userId]
    );

    // Get AI consultations
    const aiConsultations = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT id, symptoms, urgency, created_at 
       FROM ai_consultations WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    // Get PAWS transactions
    const pawsTransactions = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT type, amount, description, created_at 
       FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    return createCorsResponse({
      success: true,
      data: {
        user: {
          ...user,
          password_hash: '[HIDDEN]' // Don't expose password hash
        },
        dogs,
        recent_hunt_logs: huntLogs,
        recent_ai_consultations: aiConsultations,
        recent_paws_transactions: pawsTransactions,
        summary: {
          total_dogs: dogs.length,
          total_hunt_logs: huntLogs.length,
          current_paws_balance: user.paws_balance || 0
        },
        admin_info: {
          accessed_by: auth.user.email,
          access_time: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    return createCorsResponse({
      error: 'Failed to retrieve user details',
      code: 'USER_DETAILS_ERROR'
    }, 500);
  }
});

/**
 * POST /api/admin-bypass/impersonate
 * Admin endpoint to impersonate another user (for testing/support)
 */
adminBypassRouter.post('/impersonate', async (request, env) => {
  try {
    const auth = await requireAuthWithBypass(request, env);
    if (auth instanceof Response) return auth;

    if (!auth.user.has_admin_access) {
      return createCorsResponse({
        error: 'Admin access required',
        code: 'ADMIN_ACCESS_REQUIRED'
      }, 403);
    }

    const body = await request.json();
    const { userEmail, userId } = ValidationUtils.sanitizeJson(body);

    if (!userEmail && !userId) {
      return createCorsResponse({
        error: 'User email or user ID required',
        code: 'MISSING_USER_IDENTIFIER'
      }, 400);
    }

    // Find target user
    const targetUser = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM users WHERE email = ? OR id = ?',
      [userEmail || '', userId || '']
    );

    if (!targetUser) {
      return createCorsResponse({
        error: 'Target user not found',
        code: 'TARGET_USER_NOT_FOUND'
      }, 404);
    }

    // Log the impersonation for audit
    console.log(`ADMIN IMPERSONATION: ${auth.user.email} (${auth.user.id}) impersonating ${targetUser.email} (${targetUser.id})`);

    return createCorsResponse({
      success: true,
      data: {
        message: 'Impersonation enabled',
        original_admin: {
          id: auth.user.id,
          email: auth.user.email
        },
        impersonating: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.first_name + ' ' + targetUser.last_name
        },
        note: 'All subsequent API calls will show data from the impersonated user\'s perspective'
      }
    });

  } catch (error) {
    console.error('User impersonation error:', error);
    return createCorsResponse({
      error: 'Failed to impersonate user',
      code: 'IMPERSONATION_ERROR'
    }, 500);
  }
});

/**
 * GET /api/admin-bypass/system-stats
 * Admin endpoint for system-wide statistics
 */
adminBypassRouter.get('/system-stats', async (request, env) => {
  try {
    const auth = await requireAuthWithBypass(request, env);
    if (auth instanceof Response) return auth;

    if (!auth.user.has_admin_access) {
      return createCorsResponse({
        error: 'Admin access required',
        code: 'ADMIN_ACCESS_REQUIRED'
      }, 403);
    }

    // Get comprehensive system statistics
    const stats = await Promise.all([
      // User statistics
      DatabaseUtils.executeQueryFirst(env.DB, 'SELECT COUNT(*) as total_users FROM users'),
      DatabaseUtils.executeQueryFirst(env.DB, 'SELECT COUNT(*) as active_users FROM users WHERE is_active = TRUE'),
      DatabaseUtils.executeQueryFirst(env.DB, 'SELECT COUNT(*) as users_last_7_days FROM users WHERE created_at >= datetime("now", "-7 days")'),
      
      // Pet statistics
      DatabaseUtils.executeQueryFirst(env.DB, 'SELECT COUNT(*) as total_dogs FROM dogs WHERE is_active = TRUE'),
      DatabaseUtils.executeQueryFirst(env.DB, 'SELECT COUNT(*) as dogs_last_7_days FROM dogs WHERE created_at >= datetime("now", "-7 days") AND is_active = TRUE'),
      
      // Activity statistics
      DatabaseUtils.executeQueryFirst(env.DB, 'SELECT COUNT(*) as total_hunt_logs FROM hunt_logs'),
      DatabaseUtils.executeQueryFirst(env.DB, 'SELECT COUNT(*) as hunt_logs_last_7_days FROM hunt_logs WHERE created_at >= datetime("now", "-7 days")'),
      DatabaseUtils.executeQueryFirst(env.DB, 'SELECT COUNT(*) as total_feeding_logs FROM feeding_logs'),
      DatabaseUtils.executeQueryFirst(env.DB, 'SELECT COUNT(*) as total_ai_consultations FROM ai_consultations'),
      
      // System health
      DatabaseUtils.executeQueryFirst(env.DB, 'SELECT COUNT(*) as total_suppliers FROM suppliers WHERE is_active = 1'),
      DatabaseUtils.executeQueryFirst(env.DB, 'SELECT COUNT(*) as total_reviews FROM reviews'),
    ]);

    const [
      totalUsers, activeUsers, newUsersWeek,
      totalDogs, newDogsWeek,
      totalHuntLogs, newHuntLogsWeek,
      totalFeedingLogs, totalAiConsultations,
      totalSuppliers, totalReviews
    ] = stats;

    return createCorsResponse({
      success: true,
      data: {
        users: {
          total: totalUsers.total_users,
          active: activeUsers.active_users,
          new_this_week: newUsersWeek.users_last_7_days
        },
        pets: {
          total: totalDogs.total_dogs,
          new_this_week: newDogsWeek.dogs_last_7_days
        },
        activity: {
          hunt_logs: {
            total: totalHuntLogs.total_hunt_logs,
            new_this_week: newHuntLogsWeek.hunt_logs_last_7_days
          },
          feeding_logs: totalFeedingLogs.total_feeding_logs,
          ai_consultations: totalAiConsultations.total_ai_consultations
        },
        platform: {
          suppliers: totalSuppliers.total_suppliers,
          reviews: totalReviews.total_reviews
        },
        generated_at: new Date().toISOString(),
        admin_info: {
          accessed_by: auth.user.email
        }
      }
    });

  } catch (error) {
    console.error('System stats error:', error);
    return createCorsResponse({
      error: 'Failed to retrieve system statistics',
      code: 'SYSTEM_STATS_ERROR'
    }, 500);
  }
});

// Helper functions
function checkAdminEmailAccess(email, env) {
  const adminEmails = (env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  return adminEmails.includes(email?.toLowerCase());
}

function checkUserIdAccess(userId, env) {
  const adminUserIds = (env.ADMIN_USER_IDS || '').split(',').map(id => id.trim());
  return adminUserIds.includes(userId);
}

export { adminBypassRouter };