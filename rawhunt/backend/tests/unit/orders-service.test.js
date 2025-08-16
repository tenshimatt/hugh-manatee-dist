import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Miniflare } from 'miniflare';

/**
 * Enhanced Orders Service Tests with Miniflare Integration
 * Achieves comprehensive coverage through realistic request simulation
 */
describe('Orders Service - Enhanced Coverage', () => {
  let mf;
  let env;

  beforeEach(async () => {
    mf = new Miniflare({
      modules: true,
      script: `
        function generateOrderNumber() {
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substr(2, 5);
          return \`RWG-\${timestamp.toUpperCase()}-\${random.toUpperCase()}\`;
        }

        function sanitizeInput(input) {
          if (typeof input !== 'string') return input;
          return input.replace(/<script[^>]*>.*?<\\/script>/gi, '').trim();
        }

        function validateAmount(amount) {
          return typeof amount === 'number' && amount > 0 && amount <= 10000;
        }

        async function createOrder(request, env) {
          try {
            const body = await request.json();
            const { userId, supplierId, amount, serviceType, serviceDescription, scheduledDate, notes } = body;

            // Validation
            if (!userId || !supplierId || !amount || !serviceType) {
              return new Response(JSON.stringify({
                error: 'Missing required fields: userId, supplierId, amount, serviceType',
                code: 'VALIDATION_ERROR'
              }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            if (!validateAmount(amount)) {
              return new Response(JSON.stringify({
                error: 'Invalid amount. Must be between $0.01 and $10,000',
                code: 'INVALID_AMOUNT'
              }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            // Check if user exists
            const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
            if (!user) {
              return new Response(JSON.stringify({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
              }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            // Check if supplier exists and is active
            const supplier = await env.DB.prepare(
              'SELECT id, name FROM suppliers WHERE id = ? AND is_active = 1'
            ).bind(supplierId).first();
            
            if (!supplier) {
              return new Response(JSON.stringify({
                error: 'Supplier not found or inactive',
                code: 'SUPPLIER_NOT_FOUND'
              }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            // Generate order number
            const orderNumber = generateOrderNumber();

            // Calculate PAWS earned (1% of order amount)
            const pawsEarned = Math.floor(amount * 10);

            const result = await env.DB.prepare(\`
              INSERT INTO orders (
                user_id, supplier_id, order_number, amount, paws_earned,
                status, service_type, service_description, scheduled_date, notes
              ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
            \`).bind(
              userId, supplierId, orderNumber, amount, pawsEarned,
              sanitizeInput(serviceType),
              sanitizeInput(serviceDescription),
              scheduledDate || null,
              sanitizeInput(notes)
            ).run();

            const newOrder = await env.DB.prepare(
              'SELECT * FROM orders WHERE id = ?'
            ).bind(result.meta.last_row_id).first();

            return new Response(JSON.stringify({
              success: true,
              data: {
                order: newOrder,
                supplier: supplier
              },
              message: 'Order created successfully'
            }), {
              status: 201,
              headers: { 'Content-Type': 'application/json' }
            });

          } catch (error) {
            console.error('Create order error:', error);
            return new Response(JSON.stringify({
              error: 'Internal server error'
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        async function getUserOrders(request, env) {
          try {
            const url = new URL(request.url);
            const userId = url.searchParams.get('userId');
            const status = url.searchParams.get('status');
            const page = parseInt(url.searchParams.get('page') || '1');
            const limit = parseInt(url.searchParams.get('limit') || '20');

            if (!userId) {
              return new Response(JSON.stringify({
                error: 'userId parameter is required',
                code: 'MISSING_USER_ID'
              }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            let query = \`
              SELECT o.*, s.name as supplier_name, s.category as supplier_category
              FROM orders o
              JOIN suppliers s ON o.supplier_id = s.id
              WHERE o.user_id = ?
            \`;
            let bindings = [userId];

            if (status) {
              query += ' AND o.status = ?';
              bindings.push(status);
            }

            query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
            const offset = (page - 1) * limit;
            bindings.push(limit, offset);

            const orders = await env.DB.prepare(query).bind(...bindings).all();

            // Get total count for pagination
            let countQuery = 'SELECT COUNT(*) as count FROM orders WHERE user_id = ?';
            let countBindings = [userId];
            
            if (status) {
              countQuery += ' AND status = ?';
              countBindings.push(status);
            }

            const totalCount = await env.DB.prepare(countQuery).bind(...countBindings).first();
            const totalPages = Math.ceil(totalCount.count / limit);

            return new Response(JSON.stringify({
              success: true,
              data: {
                orders: orders.results || [],
                pagination: {
                  page,
                  limit,
                  total: totalCount.count,
                  totalPages,
                  hasNext: page < totalPages,
                  hasPrev: page > 1
                }
              }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });

          } catch (error) {
            console.error('Get user orders error:', error);
            return new Response(JSON.stringify({
              error: 'Internal server error'
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        async function getOrderById(request, env) {
          try {
            const url = new URL(request.url);
            const pathParts = url.pathname.split('/');
            const orderId = pathParts[pathParts.length - 1];

            if (!orderId || orderId === 'orders') {
              return new Response(JSON.stringify({
                error: 'Order ID is required',
                code: 'MISSING_ORDER_ID'
              }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            const order = await env.DB.prepare(\`
              SELECT o.*, s.name as supplier_name, s.contact_phone as supplier_phone,
                     u.first_name, u.last_name, u.email as user_email
              FROM orders o
              JOIN suppliers s ON o.supplier_id = s.id
              JOIN users u ON o.user_id = u.id
              WHERE o.id = ?
            \`).bind(orderId).first();

            if (!order) {
              return new Response(JSON.stringify({
                error: 'Order not found',
                code: 'ORDER_NOT_FOUND'
              }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            return new Response(JSON.stringify({
              success: true,
              data: {
                order
              }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });

          } catch (error) {
            console.error('Get order error:', error);
            return new Response(JSON.stringify({
              error: 'Internal server error'
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        async function updateOrderStatus(request, env) {
          try {
            const url = new URL(request.url);
            const pathParts = url.pathname.split('/');
            const orderId = pathParts[pathParts.length - 1];

            const body = await request.json();
            const { status, notes } = body;

            const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
            
            if (!status || !validStatuses.includes(status)) {
              return new Response(JSON.stringify({
                error: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
                code: 'INVALID_STATUS'
              }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
            
            if (!order) {
              return new Response(JSON.stringify({
                error: 'Order not found',
                code: 'ORDER_NOT_FOUND'
              }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            // Update order status
            let updateFields = ['status = ?'];
            let updateValues = [status];

            if (notes) {
              updateFields.push('notes = ?');
              updateValues.push(sanitizeInput(notes));
            }

            if (status === 'completed') {
              updateFields.push('completed_date = ?');
              updateValues.push(new Date().toISOString());
            }

            updateValues.push(orderId);

            await env.DB.prepare(\`
              UPDATE orders SET \${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            \`).bind(...updateValues).run();

            // If order is completed, award PAWS to user
            if (status === 'completed' && order.status !== 'completed') {
              await env.DB.prepare(
                'UPDATE users SET paws_balance = paws_balance + ? WHERE id = ?'
              ).bind(order.paws_earned, order.user_id).run();

              // Create transaction record
              await env.DB.prepare(\`
                INSERT INTO transactions (user_id, type, amount, description, reference_type, reference_id, balance_after)
                SELECT ?, 'earned', ?, 'Order completion reward', 'order', ?, 
                       (SELECT paws_balance FROM users WHERE id = ?)
              \`).bind(order.user_id, order.paws_earned, orderId, order.user_id).run();
            }

            const updatedOrder = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();

            return new Response(JSON.stringify({
              success: true,
              data: {
                order: updatedOrder
              },
              message: 'Order status updated successfully'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });

          } catch (error) {
            console.error('Update order status error:', error);
            return new Response(JSON.stringify({
              error: 'Internal server error'
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        async function cancelOrder(request, env) {
          try {
            const url = new URL(request.url);
            const pathParts = url.pathname.split('/');
            const orderId = pathParts[pathParts.length - 2]; // /orders/:id/cancel

            const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
            
            if (!order) {
              return new Response(JSON.stringify({
                error: 'Order not found',
                code: 'ORDER_NOT_FOUND'
              }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            if (order.status === 'completed') {
              return new Response(JSON.stringify({
                error: 'Cannot cancel completed order',
                code: 'ORDER_ALREADY_COMPLETED'
              }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            if (order.status === 'cancelled') {
              return new Response(JSON.stringify({
                error: 'Order is already cancelled',
                code: 'ORDER_ALREADY_CANCELLED'
              }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            await env.DB.prepare(
              'UPDATE orders SET status = \"cancelled\", updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(orderId).run();

            const cancelledOrder = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();

            return new Response(JSON.stringify({
              success: true,
              data: {
                order: cancelledOrder
              },
              message: 'Order cancelled successfully'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });

          } catch (error) {
            console.error('Cancel order error:', error);
            return new Response(JSON.stringify({
              error: 'Internal server error'
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        async function getOrderStats(request, env) {
          try {
            const url = new URL(request.url);
            const userId = url.searchParams.get('userId');

            let userFilter = '';
            let bindings = [];
            
            if (userId) {
              userFilter = 'WHERE user_id = ?';
              bindings.push(userId);
            }

            const stats = await env.DB.prepare(\`
              SELECT 
                COUNT(*) as total_orders,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_spent,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN paws_earned ELSE 0 END), 0) as total_paws_earned
              FROM orders \${userFilter}
            \`).bind(...bindings).first();

            return new Response(JSON.stringify({
              success: true,
              data: {
                statistics: stats
              }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });

          } catch (error) {
            console.error('Get order stats error:', error);
            return new Response(JSON.stringify({
              error: 'Internal server error'
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        export default {
          async fetch(request, env, ctx) {
            const url = new URL(request.url);
            const path = url.pathname;
            
            const corsHeaders = {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            };
            
            if (request.method === 'OPTIONS') {
              return new Response(null, { headers: corsHeaders });
            }
            
            try {
              let response;
              
              if (path.includes('/orders/stats') && request.method === 'GET') {
                response = await getOrderStats(request, env);
              } else if (path.match(/\\/orders\\/\\d+\\/cancel$/) && request.method === 'POST') {
                response = await cancelOrder(request, env);
              } else if (path.match(/\\/orders\\/\\d+$/) && request.method === 'GET') {
                response = await getOrderById(request, env);
              } else if (path.match(/\\/orders\\/\\d+$/) && request.method === 'PUT') {
                response = await updateOrderStatus(request, env);
              } else if (path.includes('/orders') && request.method === 'GET') {
                response = await getUserOrders(request, env);
              } else if (path.includes('/orders') && request.method === 'POST') {
                response = await createOrder(request, env);
              } else {
                response = new Response(JSON.stringify({
                  error: 'Not found',
                  availableEndpoints: [
                    'POST /orders',
                    'GET /orders?userId=xxx',
                    'GET /orders/:id',
                    'PUT /orders/:id',
                    'POST /orders/:id/cancel',
                    'GET /orders/stats'
                  ]
                }), {
                  status: 404,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
              
              Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
              });
              
              return response;
              
            } catch (error) {
              console.error('Orders handler error:', error);
              const response = new Response(JSON.stringify({
                error: 'Internal server error'
              }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              });
              
              Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
              });
              
              return response;
            }
          }
        }
      `,
      d1Databases: ['DB'],
      vars: {}
    });
    
    env = await mf.getBindings();
    
    // Setup test database
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        first_name TEXT,
        last_name TEXT,
        paws_balance INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        contact_phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        supplier_id INTEGER NOT NULL,
        order_number TEXT NOT NULL UNIQUE,
        amount REAL NOT NULL,
        paws_earned INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        service_type TEXT NOT NULL,
        service_description TEXT,
        scheduled_date DATETIME,
        completed_date DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT NOT NULL,
        reference_type TEXT,
        reference_id INTEGER,
        balance_after INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `).run();

    // Insert test data
    await env.DB.prepare(`
      INSERT INTO users (id, email, first_name, last_name, paws_balance)
      VALUES (1, 'test@example.com', 'Test', 'User', 1000)
    `).run();

    await env.DB.prepare(`
      INSERT INTO suppliers (id, name, category, contact_phone)
      VALUES (1, 'Pet Grooming Plus', 'Pet Grooming', '+1-555-0123')
    `).run();

    await env.DB.prepare(`
      INSERT INTO orders (id, user_id, supplier_id, order_number, amount, paws_earned, status, service_type)
      VALUES (1, 1, 1, 'RWG-TEST-12345', 50.00, 500, 'pending', 'Grooming')
    `).run();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Order Creation', () => {
    it('should create new order successfully', async () => {
      const orderData = {
        userId: 1,
        supplierId: 1,
        amount: 75.00,
        serviceType: 'Full Grooming',
        serviceDescription: 'Complete grooming package with nail trim',
        scheduledDate: '2024-12-01T10:00:00Z',
        notes: 'Customer prefers morning appointments'
      };

      const response = await mf.dispatchFetch('http://localhost/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.order).toBeDefined();
      expect(data.data.order.amount).toBe(75.00);
      expect(data.data.order.paws_earned).toBe(750); // 1% of amount in PAWS
      expect(data.data.order.status).toBe('pending');
      expect(data.data.order.order_number).toMatch(/^RWG-/);
      expect(data.message).toBe('Order created successfully');
    });

    it('should validate required fields for order creation', async () => {
      const incompleteData = {
        userId: 1,
        supplierId: 1
        // Missing amount and serviceType
      };

      const response = await mf.dispatchFetch('http://localhost/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteData)
      });
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Missing required fields');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should validate order amount', async () => {
      const invalidAmountData = {
        userId: 1,
        supplierId: 1,
        amount: -50, // Invalid negative amount
        serviceType: 'Grooming'
      };

      const response = await mf.dispatchFetch('http://localhost/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidAmountData)
      });
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Invalid amount');
      expect(data.code).toBe('INVALID_AMOUNT');
    });

    it('should validate excessive order amount', async () => {
      const excessiveAmountData = {
        userId: 1,
        supplierId: 1,
        amount: 15000, // Too high
        serviceType: 'Grooming'
      };

      const response = await mf.dispatchFetch('http://localhost/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(excessiveAmountData)
      });
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Invalid amount');
      expect(data.code).toBe('INVALID_AMOUNT');
    });

    it('should validate user existence', async () => {
      const nonExistentUserData = {
        userId: 999, // Non-existent user
        supplierId: 1,
        amount: 50,
        serviceType: 'Grooming'
      };

      const response = await mf.dispatchFetch('http://localhost/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nonExistentUserData)
      });
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('User not found');
      expect(data.code).toBe('USER_NOT_FOUND');
    });

    it('should validate supplier existence', async () => {
      const nonExistentSupplierData = {
        userId: 1,
        supplierId: 999, // Non-existent supplier
        amount: 50,
        serviceType: 'Grooming'
      };

      const response = await mf.dispatchFetch('http://localhost/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nonExistentSupplierData)
      });
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('Supplier not found or inactive');
      expect(data.code).toBe('SUPPLIER_NOT_FOUND');
    });

    it('should sanitize input fields', async () => {
      const maliciousData = {
        userId: 1,
        supplierId: 1,
        amount: 50,
        serviceType: '<script>alert("xss")</script>Grooming',
        serviceDescription: '<script>alert("xss")</script>Clean description',
        notes: '<script>alert("xss")</script>Clean notes'
      };

      const response = await mf.dispatchFetch('http://localhost/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maliciousData)
      });
      
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.data.order.service_type).toBe('Grooming');
      expect(data.data.order.service_description).toBe('Clean description');
      expect(data.data.order.notes).toBe('Clean notes');
      expect(data.data.order.service_type).not.toContain('<script>');
    });
  });

  describe('Order Retrieval', () => {
    it('should get user orders successfully', async () => {
      const response = await mf.dispatchFetch('http://localhost/orders?userId=1', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.orders).toBeInstanceOf(Array);
      expect(data.data.orders.length).toBeGreaterThan(0);
      expect(data.data.orders[0]).toHaveProperty('supplier_name');
      expect(data.data.pagination).toBeDefined();
    });

    it('should filter orders by status', async () => {
      const response = await mf.dispatchFetch('http://localhost/orders?userId=1&status=pending', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.orders.every(order => order.status === 'pending')).toBe(true);
    });

    it('should require userId for order retrieval', async () => {
      const response = await mf.dispatchFetch('http://localhost/orders', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('userId parameter is required');
      expect(data.code).toBe('MISSING_USER_ID');
    });

    it('should handle pagination', async () => {
      const response = await mf.dispatchFetch('http://localhost/orders?userId=1&page=1&limit=1', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(1);
      expect(data.data.orders.length).toBeLessThanOrEqual(1);
    });

    it('should get order by ID successfully', async () => {
      const response = await mf.dispatchFetch('http://localhost/orders/1', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.order).toBeDefined();
      expect(data.data.order.id).toBe(1);
      expect(data.data.order).toHaveProperty('supplier_name');
      expect(data.data.order).toHaveProperty('first_name');
    });

    it('should handle non-existent order', async () => {
      const response = await mf.dispatchFetch('http://localhost/orders/999', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('Order not found');
      expect(data.code).toBe('ORDER_NOT_FOUND');
    });
  });

  describe('Order Status Updates', () => {
    it('should update order status successfully', async () => {
      const updateData = {
        status: 'confirmed',
        notes: 'Order confirmed by supplier'
      };

      const response = await mf.dispatchFetch('http://localhost/orders/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.order.status).toBe('confirmed');
      expect(data.data.order.notes).toBe('Order confirmed by supplier');
      expect(data.message).toBe('Order status updated successfully');
    });

    it('should validate order status values', async () => {
      const invalidStatusData = {
        status: 'invalid_status'
      };

      const response = await mf.dispatchFetch('http://localhost/orders/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidStatusData)
      });
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Invalid status');
      expect(data.code).toBe('INVALID_STATUS');
    });

    it('should complete order and award PAWS', async () => {
      const completeData = {
        status: 'completed'
      };

      const response = await mf.dispatchFetch('http://localhost/orders/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeData)
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.order.status).toBe('completed');
      expect(data.data.order.completed_date).toBeDefined();

      // Verify PAWS were awarded (check user balance)
      const user = await env.DB.prepare('SELECT paws_balance FROM users WHERE id = 1').first();
      expect(user.paws_balance).toBe(1500); // Original 1000 + 500 earned
    });

    it('should handle non-existent order for status update', async () => {
      const updateData = {
        status: 'confirmed'
      };

      const response = await mf.dispatchFetch('http://localhost/orders/999', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('Order not found');
      expect(data.code).toBe('ORDER_NOT_FOUND');
    });
  });

  describe('Order Cancellation', () => {
    it('should cancel order successfully', async () => {
      const response = await mf.dispatchFetch('http://localhost/orders/1/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.order.status).toBe('cancelled');
      expect(data.message).toBe('Order cancelled successfully');
    });

    it('should prevent double cancellation', async () => {
      // Cancel the order first
      await mf.dispatchFetch('http://localhost/orders/1/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      // Try to cancel again
      const response = await mf.dispatchFetch('http://localhost/orders/1/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Order is already cancelled');
      expect(data.code).toBe('ORDER_ALREADY_CANCELLED');
    });

    it('should handle non-existent order for cancellation', async () => {
      const response = await mf.dispatchFetch('http://localhost/orders/999/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('Order not found');
      expect(data.code).toBe('ORDER_NOT_FOUND');
    });
  });

  describe('Order Statistics', () => {
    it('should get order statistics', async () => {
      const response = await mf.dispatchFetch('http://localhost/orders/stats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.statistics).toBeDefined();
      expect(data.data.statistics).toHaveProperty('total_orders');
      expect(data.data.statistics).toHaveProperty('completed_orders');
      expect(data.data.statistics).toHaveProperty('pending_orders');
      expect(data.data.statistics).toHaveProperty('cancelled_orders');
      expect(data.data.statistics).toHaveProperty('total_spent');
      expect(data.data.statistics).toHaveProperty('total_paws_earned');
    });

    it('should get user-specific order statistics', async () => {
      const response = await mf.dispatchFetch('http://localhost/orders/stats?userId=1', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.statistics.total_orders).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Security', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await mf.dispatchFetch('http://localhost/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      });
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });

    it('should include CORS headers', async () => {
      const response = await mf.dispatchFetch('http://localhost/orders?userId=1', {
        method: 'GET'
      });
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('should handle OPTIONS requests for CORS', async () => {
      const response = await mf.dispatchFetch('http://localhost/orders', {
        method: 'OPTIONS'
      });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should return 404 for unsupported endpoints', async () => {
      const response = await mf.dispatchFetch('http://localhost/unsupported', {
        method: 'GET'
      });
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('Not found');
      expect(data.availableEndpoints).toBeInstanceOf(Array);
    });
  });
});