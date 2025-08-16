import { Router } from 'itty-router';
import { ValidationUtils, orderCreateSchema, orderUpdateSchema } from '../utils/validation.js';
import { SupplierQueries, UserQueries, DatabaseUtils } from '../utils/database.js';
import { CryptoUtils } from '../utils/crypto.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { createCorsResponse } from '../middleware/cors.js';

const ordersRouter = Router({ base: '/api/orders' });

/**
 * POST /api/orders
 * Create a new order
 */
ordersRouter.post('/', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    // Rate limiting for orders
    const rateLimitResponse = await rateLimit(request, env, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10 // 10 orders per 15 minutes
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    
    // Validate input
    const validatedData = ValidationUtils.validateRequest(orderCreateSchema, body);

    // Check if supplier exists
    const supplier = await SupplierQueries.findById(env.DB, validatedData.supplierId);
    if (!supplier || !supplier.is_active) {
      return createCorsResponse({
        error: 'Supplier not found or inactive',
        code: 'SUPPLIER_NOT_FOUND'
      }, 404);
    }

    // Generate order number
    const orderNumber = CryptoUtils.generateOrderNumber();

    // Calculate PAWS to be earned (10% of order amount in PAWS)
    const pawsEarned = Math.floor(validatedData.amount * 0.1);

    // Create order
    const orderId = await DatabaseUtils.executeUpdate(
      env.DB,
      `INSERT INTO orders (
        user_id, supplier_id, order_number, amount, paws_earned,
        service_type, service_description, scheduled_date, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        auth.user.id,
        validatedData.supplierId,
        orderNumber,
        validatedData.amount,
        pawsEarned,
        validatedData.serviceType,
        validatedData.serviceDescription || null,
        validatedData.scheduledDate || null,
        validatedData.notes || null,
        DatabaseUtils.formatDateForDB(),
        DatabaseUtils.formatDateForDB()
      ]
    );

    // Get created order with supplier info
    const order = await DatabaseUtils.executeQueryFirst(
      env.DB,
      `SELECT o.*, s.name as supplier_name, s.category as supplier_category,
              s.location_address as supplier_address, s.contact_phone as supplier_phone
       FROM orders o 
       JOIN rawgle_suppliers s ON o.supplier_id = s.id 
       WHERE o.id = ?`,
      [orderId.meta.last_row_id]
    );

    return createCorsResponse({
      success: true,
      data: { order },
      message: 'Order created successfully'
    }, 201);

  } catch (error) {
    console.error('Create order error:', error);
    
    if (error.message.startsWith('[')) {
      return createCorsResponse({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: JSON.parse(error.message)
      }, 400);
    }

    return createCorsResponse({
      error: 'Failed to create order',
      code: 'CREATE_ORDER_ERROR'
    }, 500);
  }
});

/**
 * GET /api/orders
 * Get user's orders
 */
ordersRouter.get('/', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100);
    const status = url.searchParams.get('status');
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, s.name as supplier_name, s.category as supplier_category,
             s.location_address as supplier_address, s.contact_phone as supplier_phone
      FROM orders o 
      JOIN suppliers s ON o.supplier_id = s.id 
      WHERE o.user_id = ?
    `;
    const params = [auth.user.id];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const orders = await DatabaseUtils.executeQuery(env.DB, query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    const countParams = [auth.user.id];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const countResult = await DatabaseUtils.executeQueryFirst(env.DB, countQuery, countParams);

    return createCorsResponse({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return createCorsResponse({
      error: 'Failed to get orders',
      code: 'GET_ORDERS_ERROR'
    }, 500);
  }
});

/**
 * GET /api/orders/:id
 * Get order details
 */
ordersRouter.get('/:id', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const orderId = parseInt(request.params.id);
    
    if (isNaN(orderId)) {
      return createCorsResponse({
        error: 'Invalid order ID',
        code: 'INVALID_ID'
      }, 400);
    }

    const order = await DatabaseUtils.executeQueryFirst(
      env.DB,
      `SELECT o.*, s.name as supplier_name, s.category as supplier_category,
              s.location_address as supplier_address, s.contact_phone as supplier_phone,
              s.contact_email as supplier_email, s.website_url as supplier_website
       FROM orders o 
       JOIN rawgle_suppliers s ON o.supplier_id = s.id 
       WHERE o.id = ? AND o.user_id = ?`,
      [orderId, auth.user.id]
    );

    if (!order) {
      return createCorsResponse({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      }, 404);
    }

    return createCorsResponse({
      success: true,
      data: { order }
    });

  } catch (error) {
    console.error('Get order error:', error);
    return createCorsResponse({
      error: 'Failed to get order',
      code: 'GET_ORDER_ERROR'
    }, 500);
  }
});

/**
 * PUT /api/orders/:id
 * Update order (limited fields for users)
 */
ordersRouter.put('/:id', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const orderId = parseInt(request.params.id);
    
    if (isNaN(orderId)) {
      return createCorsResponse({
        error: 'Invalid order ID',
        code: 'INVALID_ID'
      }, 400);
    }

    // Check if order exists and belongs to user
    const existingOrder = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, auth.user.id]
    );

    if (!existingOrder) {
      return createCorsResponse({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      }, 404);
    }

    // Only allow updates to pending orders
    if (existingOrder.status !== 'pending') {
      return createCorsResponse({
        error: 'Order cannot be modified in current status',
        code: 'ORDER_NOT_MODIFIABLE'
      }, 400);
    }

    const body = await request.json();
    
    // Users can only update limited fields
    const allowedUpdates = {};
    if (body.serviceDescription !== undefined) allowedUpdates.service_description = body.serviceDescription;
    if (body.scheduledDate !== undefined) allowedUpdates.scheduled_date = body.scheduledDate;
    if (body.notes !== undefined) allowedUpdates.notes = body.notes;

    if (Object.keys(allowedUpdates).length === 0) {
      return createCorsResponse({
        error: 'No valid updates provided',
        code: 'NO_UPDATES'
      }, 400);
    }

    // Update order
    const fields = [];
    const params = [];

    Object.entries(allowedUpdates).forEach(([key, value]) => {
      fields.push(`${key} = ?`);
      params.push(value);
    });

    fields.push('updated_at = ?');
    params.push(DatabaseUtils.formatDateForDB());
    params.push(orderId);

    await DatabaseUtils.executeUpdate(
      env.DB,
      `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    // Get updated order
    const order = await DatabaseUtils.executeQueryFirst(
      env.DB,
      `SELECT o.*, s.name as supplier_name, s.category as supplier_category
       FROM orders o 
       JOIN rawgle_suppliers s ON o.supplier_id = s.id 
       WHERE o.id = ?`,
      [orderId]
    );

    return createCorsResponse({
      success: true,
      data: { order },
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Update order error:', error);
    return createCorsResponse({
      error: 'Failed to update order',
      code: 'UPDATE_ORDER_ERROR'
    }, 500);
  }
});

/**
 * DELETE /api/orders/:id
 * Cancel order (only pending orders)
 */
ordersRouter.delete('/:id', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const orderId = parseInt(request.params.id);
    
    if (isNaN(orderId)) {
      return createCorsResponse({
        error: 'Invalid order ID',
        code: 'INVALID_ID'
      }, 400);
    }

    // Check if order exists and belongs to user
    const existingOrder = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, auth.user.id]
    );

    if (!existingOrder) {
      return createCorsResponse({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      }, 404);
    }

    // Only allow cancellation of pending orders
    if (existingOrder.status !== 'pending') {
      return createCorsResponse({
        error: 'Order cannot be cancelled in current status',
        code: 'ORDER_NOT_CANCELLABLE'
      }, 400);
    }

    // Update order status to cancelled
    await DatabaseUtils.executeUpdate(
      env.DB,
      'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?',
      ['cancelled', DatabaseUtils.formatDateForDB(), orderId]
    );

    return createCorsResponse({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    return createCorsResponse({
      error: 'Failed to cancel order',
      code: 'CANCEL_ORDER_ERROR'
    }, 500);
  }
});

/**
 * POST /api/orders/:id/complete
 * Mark order as completed (internal system use)
 */
ordersRouter.post('/:id/complete', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const orderId = parseInt(request.params.id);
    
    if (isNaN(orderId)) {
      return createCorsResponse({
        error: 'Invalid order ID',
        code: 'INVALID_ID'
      }, 400);
    }

    // Get order details
    const order = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, auth.user.id]
    );

    if (!order) {
      return createCorsResponse({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      }, 404);
    }

    if (order.status === 'completed') {
      return createCorsResponse({
        error: 'Order already completed',
        code: 'ORDER_ALREADY_COMPLETED'
      }, 400);
    }

    // Update order status and award PAWS
    const now = DatabaseUtils.formatDateForDB();
    const operations = [
      // Update order status
      env.DB.prepare(`
        UPDATE orders 
        SET status = 'completed', completed_date = ?, updated_at = ?
        WHERE id = ?
      `).bind(now, now, orderId),
      
      // Award PAWS to user
      env.DB.prepare(`
        UPDATE users 
        SET paws_balance = paws_balance + ?, updated_at = ?
        WHERE id = ?
      `).bind(order.paws_earned, now, auth.user.id),
      
      // Record PAWS transaction
      env.DB.prepare(`
        INSERT INTO transactions (
          user_id, type, amount, description, reference_type,
          reference_id, balance_after, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        auth.user.id,
        'earned',
        order.paws_earned,
        'Order completion reward',
        'order',
        orderId,
        0, // Will be updated after getting current balance
        now
      )
    ];

    // Get current balance first
    const user = await UserQueries.findById(env.DB, auth.user.id);
    const newBalance = user.paws_balance + order.paws_earned;

    // Update the transaction with correct balance
    operations[2] = env.DB.prepare(`
      INSERT INTO transactions (
        user_id, type, amount, description, reference_type,
        reference_id, balance_after, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      auth.user.id,
      'earned',
      order.paws_earned,
      'Order completion reward',
      'order',
      orderId,
      newBalance,
      now
    );

    await DatabaseUtils.transaction(env.DB, operations);

    return createCorsResponse({
      success: true,
      data: {
        pawsEarned: order.paws_earned,
        newBalance
      },
      message: 'Order completed successfully'
    });

  } catch (error) {
    console.error('Complete order error:', error);
    return createCorsResponse({
      error: 'Failed to complete order',
      code: 'COMPLETE_ORDER_ERROR'
    }, 500);
  }
});

/**
 * GET /api/orders/stats
 * Get order statistics for user
 */
ordersRouter.get('/stats', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const stats = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT 
         COUNT(*) as total_orders,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
         COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
         COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_orders,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
         COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
         SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_spent,
         SUM(CASE WHEN status = 'completed' THEN paws_earned ELSE 0 END) as total_paws_earned
       FROM orders 
       WHERE user_id = ?`,
      [auth.user.id]
    );

    return createCorsResponse({
      success: true,
      data: { stats: stats[0] }
    });

  } catch (error) {
    console.error('Get order stats error:', error);
    return createCorsResponse({
      error: 'Failed to get order statistics',
      code: 'ORDER_STATS_ERROR'
    }, 500);
  }
});

export { ordersRouter };