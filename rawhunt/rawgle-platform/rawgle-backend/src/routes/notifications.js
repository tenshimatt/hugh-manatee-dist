import { Router } from 'itty-router';
import { ValidationUtils, notificationCreateSchema } from '../utils/validation.js';
import { DatabaseUtils } from '../utils/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createCorsResponse } from '../middleware/cors.js';

const notificationsRouter = Router({ base: '/api/notifications' });

/**
 * GET /api/notifications
 * Get user's notifications
 */
notificationsRouter.get('/', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100);
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const type = url.searchParams.get('type');
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM notifications 
      WHERE user_id = ?
    `;
    const params = [auth.user.id];

    if (unreadOnly) {
      query += ' AND is_read = 0';
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const notifications = await DatabaseUtils.executeQuery(env.DB, query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
    const countParams = [auth.user.id];

    if (unreadOnly) {
      countQuery += ' AND is_read = 0';
    }

    if (type) {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }

    const countResult = await DatabaseUtils.executeQueryFirst(env.DB, countQuery, countParams);

    // Get unread count
    const unreadResult = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0',
      [auth.user.id]
    );

    // Parse JSON data field
    const processedNotifications = notifications.map(notification => ({
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : null
    }));

    return createCorsResponse({
      success: true,
      data: {
        notifications: processedNotifications,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        },
        unreadCount: unreadResult.unread
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return createCorsResponse({
      error: 'Failed to get notifications',
      code: 'GET_NOTIFICATIONS_ERROR'
    }, 500);
  }
});

/**
 * POST /api/notifications
 * Create a notification (admin only)
 */
notificationsRouter.post('/', async (request, env) => {
  try {
    const auth = await requireAdmin(request, env);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    
    // Validate input
    const validatedData = ValidationUtils.validateRequest(notificationCreateSchema, body);

    // Create notification
    const notificationId = await DatabaseUtils.executeUpdate(
      env.DB,
      `INSERT INTO notifications (
        user_id, type, title, message, data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        validatedData.userId,
        validatedData.type,
        validatedData.title,
        validatedData.message,
        JSON.stringify(validatedData.data || {}),
        DatabaseUtils.formatDateForDB()
      ]
    );

    // Get created notification
    const notification = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM notifications WHERE id = ?',
      [notificationId.meta.last_row_id]
    );

    return createCorsResponse({
      success: true,
      data: { 
        notification: {
          ...notification,
          data: notification.data ? JSON.parse(notification.data) : null
        }
      },
      message: 'Notification created successfully'
    }, 201);

  } catch (error) {
    console.error('Create notification error:', error);
    
    if (error.message.startsWith('[')) {
      return createCorsResponse({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: JSON.parse(error.message)
      }, 400);
    }

    return createCorsResponse({
      error: 'Failed to create notification',
      code: 'CREATE_NOTIFICATION_ERROR'
    }, 500);
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
notificationsRouter.put('/:id/read', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const notificationId = parseInt(request.params.id);
    
    if (isNaN(notificationId)) {
      return createCorsResponse({
        error: 'Invalid notification ID',
        code: 'INVALID_ID'
      }, 400);
    }

    // Check if notification exists and belongs to user
    const notification = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, auth.user.id]
    );

    if (!notification) {
      return createCorsResponse({
        error: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND'
      }, 404);
    }

    // Mark as read
    await DatabaseUtils.executeUpdate(
      env.DB,
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [notificationId]
    );

    return createCorsResponse({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    return createCorsResponse({
      error: 'Failed to mark notification as read',
      code: 'MARK_READ_ERROR'
    }, 500);
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
notificationsRouter.put('/read-all', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    // Mark all user's notifications as read
    const result = await DatabaseUtils.executeUpdate(
      env.DB,
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [auth.user.id]
    );

    return createCorsResponse({
      success: true,
      data: {
        markedCount: result.changes
      },
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return createCorsResponse({
      error: 'Failed to mark all notifications as read',
      code: 'MARK_ALL_READ_ERROR'
    }, 500);
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
notificationsRouter.delete('/:id', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const notificationId = parseInt(request.params.id);
    
    if (isNaN(notificationId)) {
      return createCorsResponse({
        error: 'Invalid notification ID',
        code: 'INVALID_ID'
      }, 400);
    }

    // Check if notification exists and belongs to user
    const notification = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, auth.user.id]
    );

    if (!notification) {
      return createCorsResponse({
        error: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND'
      }, 404);
    }

    // Delete notification
    await DatabaseUtils.executeUpdate(
      env.DB,
      'DELETE FROM notifications WHERE id = ?',
      [notificationId]
    );

    return createCorsResponse({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    return createCorsResponse({
      error: 'Failed to delete notification',
      code: 'DELETE_NOTIFICATION_ERROR'
    }, 500);
  }
});

/**
 * GET /api/notifications/types
 * Get notification types
 */
notificationsRouter.get('/types', async (request, env) => {
  try {
    const types = [
      { value: 'order', label: 'Order Updates', description: 'Order status changes and updates' },
      { value: 'review', label: 'Review Activity', description: 'New reviews and review responses' },
      { value: 'paws', label: 'PAWS Activity', description: 'PAWS earnings and transfers' },
      { value: 'system', label: 'System Alerts', description: 'System maintenance and updates' },
      { value: 'promotion', label: 'Promotions', description: 'Special offers and promotions' }
    ];

    return createCorsResponse({
      success: true,
      data: { types }
    });

  } catch (error) {
    console.error('Get notification types error:', error);
    return createCorsResponse({
      error: 'Failed to get notification types',
      code: 'GET_TYPES_ERROR'
    }, 500);
  }
});

/**
 * Utility function to create system notifications
 * This would be called from other parts of the system
 */
export async function createSystemNotification(env, userId, type, title, message, data = {}) {
  try {
    await DatabaseUtils.executeUpdate(
      env.DB,
      `INSERT INTO notifications (
        user_id, type, title, message, data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        type,
        title,
        message,
        JSON.stringify(data),
        DatabaseUtils.formatDateForDB()
      ]
    );
  } catch (error) {
    console.error('Failed to create system notification:', error);
  }
}

/**
 * Utility function to create order status notifications
 */
export async function createOrderNotification(env, userId, orderId, status, supplierName) {
  const statusMessages = {
    confirmed: `Your order with ${supplierName} has been confirmed`,
    in_progress: `Your order with ${supplierName} is now in progress`,
    completed: `Your order with ${supplierName} has been completed`,
    cancelled: `Your order with ${supplierName} has been cancelled`
  };

  const message = statusMessages[status] || `Your order status has been updated to ${status}`;

  await createSystemNotification(
    env,
    userId,
    'order',
    'Order Update',
    message,
    { orderId, status, supplierName }
  );
}

/**
 * Utility function to create PAWS notifications
 */
export async function createPawsNotification(env, userId, type, amount, description) {
  const typeMessages = {
    earned: `You earned ${amount} PAWS! ${description}`,
    spent: `You spent ${amount} PAWS. ${description}`,
    transfer_in: `You received ${amount} PAWS. ${description}`,
    transfer_out: `You sent ${amount} PAWS. ${description}`
  };

  const message = typeMessages[type] || `PAWS transaction: ${description}`;

  await createSystemNotification(
    env,
    userId,
    'paws',
    'PAWS Activity',
    message,
    { type, amount, description }
  );
}

export { notificationsRouter };