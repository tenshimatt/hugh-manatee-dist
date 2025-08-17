/**
 * Comprehensive unit tests for orders endpoints
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ordersRouter } from '../../src/routes/orders.js';
import { 
  UserFactory, 
  OrderFactory,
  SupplierFactory,
  TestEnvironmentFactory, 
  RequestFactory,
  DatabaseMock 
} from '../fixtures/index.js';

// Mock external dependencies
vi.mock('../../src/utils/database.js', () => ({
  OrderQueries: {
    create: vi.fn(),
    findById: vi.fn(),
    findByUserId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  UserQueries: {
    findById: vi.fn(),
    updatePawsBalance: vi.fn()
  },
  SupplierQueries: {
    findById: vi.fn()
  },
  TransactionQueries: {
    create: vi.fn()
  },
  DatabaseUtils: {
    executeQuery: vi.fn(),
    executeQueryFirst: vi.fn(),
    formatDateForDB: vi.fn().mockReturnValue('2023-01-01 00:00:00')
  }
}));

vi.mock('../../src/middleware/auth.js', () => ({
  requireAuth: vi.fn()
}));

vi.mock('../../src/utils/crypto.js', () => ({
  CryptoUtils: {
    generateOrderNumber: vi.fn().mockReturnValue('RWG-ABC123-DEF45')
  }
}));

describe('Orders Router - POST /', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should create new order successfully', async () => {
      const user = UserFactory.create();
      const supplier = SupplierFactory.create();
      const orderData = {
        supplierId: supplier.id,
        serviceType: 'grooming',
        description: 'Full grooming service',
        amount: 100.00,
        scheduledDate: '2023-12-01T10:00:00Z'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/orders', 'token', {
        body: orderData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { OrderQueries, SupplierQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: user.id } });
      SupplierQueries.findById.mockResolvedValue(supplier);
      OrderQueries.create.mockResolvedValue('new_order_id');

      const response = await ordersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.order).toBeDefined();
      expect(responseData.message).toBe('Order created successfully');
      
      expect(OrderQueries.create).toHaveBeenCalledWith(env.DB, expect.objectContaining({
        userId: user.id,
        supplierId: supplier.id,
        serviceType: orderData.serviceType,
        amount: orderData.amount
      }));
    });

    it('should calculate PAWS earned correctly', async () => {
      const user = UserFactory.create();
      const supplier = SupplierFactory.create({ pawsRewardRate: 0.05 });
      const orderData = {
        supplierId: supplier.id,
        serviceType: 'grooming',
        amount: 200.00
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/orders', 'token', {
        body: orderData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { OrderQueries, SupplierQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: user.id } });
      SupplierQueries.findById.mockResolvedValue(supplier);
      OrderQueries.create.mockResolvedValue('new_order_id');

      await ordersRouter.handle(request, env);

      expect(OrderQueries.create).toHaveBeenCalledWith(env.DB, expect.objectContaining({
        pawsEarned: 10 // 200 * 0.05 = 10 PAWS
      }));
    });

    it('should handle PAWS payment integration', async () => {
      const user = UserFactory.create({ pawsBalance: 500 });
      const supplier = SupplierFactory.create();
      const orderData = {
        supplierId: supplier.id,
        serviceType: 'training',
        amount: 100.00,
        pawsPayment: 50
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/orders', 'token', {
        body: orderData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { OrderQueries, SupplierQueries, UserQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: user.id } });
      UserQueries.findById.mockResolvedValue(user);
      SupplierQueries.findById.mockResolvedValue(supplier);
      OrderQueries.create.mockResolvedValue('new_order_id');

      const response = await ordersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.data.order.pawsUsed).toBe(50);
      expect(responseData.data.order.remainingAmount).toBe(50.00);
    });
  });

  describe('Negative Test Cases', () => {
    it('should fail when supplier not found', async () => {
      const user = UserFactory.create();
      const orderData = {
        supplierId: 'non_existent_supplier',
        serviceType: 'grooming',
        amount: 100.00
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/orders', 'token', {
        body: orderData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { SupplierQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: user.id } });
      SupplierQueries.findById.mockResolvedValue(null);

      const response = await ordersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Supplier not found');
    });

    it('should fail with insufficient PAWS balance', async () => {
      const user = UserFactory.create({ pawsBalance: 30 });
      const supplier = SupplierFactory.create();
      const orderData = {
        supplierId: supplier.id,
        serviceType: 'boarding',
        amount: 100.00,
        pawsPayment: 50 // User only has 30 PAWS
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/orders', 'token', {
        body: orderData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { SupplierQueries, UserQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: user.id } });
      UserQueries.findById.mockResolvedValue(user);
      SupplierQueries.findById.mockResolvedValue(supplier);

      const response = await ordersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Insufficient PAWS balance');
    });

    it('should fail with invalid order data', async () => {
      const user = UserFactory.create();
      const invalidOrderData = {
        supplierId: 'supplier123',
        amount: -50.00 // Negative amount
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/orders', 'token', {
        body: invalidOrderData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      requireAuth.mockResolvedValue({ user: { id: user.id } });

      const response = await ordersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Validation failed');
    });
  });
});

describe('Orders Router - GET /', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should return user orders with pagination', async () => {
    const user = UserFactory.create();
    const orders = [
      OrderFactory.create({ userId: user.id }),
      OrderFactory.create({ userId: user.id }),
      OrderFactory.create({ userId: user.id })
    ];
    
    const request = RequestFactory.createAuthenticatedRequest('GET', '/api/orders?page=1&limit=10', 'token');

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { OrderQueries, DatabaseUtils } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    OrderQueries.findByUserId.mockResolvedValue(orders);
    DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 3 });

    const response = await ordersRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.orders).toHaveLength(3);
    expect(responseData.data.pagination).toBeDefined();
  });

  it('should filter orders by status', async () => {
    const user = UserFactory.create();
    const request = RequestFactory.createAuthenticatedRequest('GET', '/api/orders?status=completed', 'token');

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { OrderQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    OrderQueries.findByUserId.mockResolvedValue([]);

    await ordersRouter.handle(request, env);

    expect(OrderQueries.findByUserId).toHaveBeenCalledWith(
      env.DB, 
      user.id, 
      expect.objectContaining({
        status: 'completed'
      })
    );
  });
});

describe('Orders Router - GET /:id', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should return order details for owner', async () => {
    const user = UserFactory.create();
    const order = OrderFactory.create({ userId: user.id });
    
    const request = RequestFactory.createAuthenticatedRequest('GET', `/api/orders/${order.id}`, 'token');
    request.params = { id: order.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { OrderQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    OrderQueries.findById.mockResolvedValue(order);

    const response = await ordersRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.order.id).toBe(order.id);
  });

  it('should prevent access to other users orders', async () => {
    const user = UserFactory.create();
    const otherUserOrder = OrderFactory.create({ userId: 'other_user_id' });
    
    const request = RequestFactory.createAuthenticatedRequest('GET', `/api/orders/${otherUserOrder.id}`, 'token');
    request.params = { id: otherUserOrder.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { OrderQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    OrderQueries.findById.mockResolvedValue(otherUserOrder);

    const response = await ordersRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(404);
    expect(responseData.error).toBe('Order not found');
  });
});

describe('Orders Router - PUT /:id', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should update order status', async () => {
    const user = UserFactory.create();
    const order = OrderFactory.create({ userId: user.id, status: 'pending' });
    const updateData = { status: 'confirmed' };
    
    const request = RequestFactory.createAuthenticatedRequest('PUT', `/api/orders/${order.id}`, 'token', {
      body: updateData
    });
    request.params = { id: order.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { OrderQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    OrderQueries.findById.mockResolvedValue(order);
    OrderQueries.update.mockResolvedValue();

    const response = await ordersRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(OrderQueries.update).toHaveBeenCalledWith(env.DB, order.id, updateData);
  });

  it('should prevent invalid status transitions', async () => {
    const user = UserFactory.create();
    const order = OrderFactory.create({ userId: user.id, status: 'completed' });
    const updateData = { status: 'pending' }; // Invalid reverse transition
    
    const request = RequestFactory.createAuthenticatedRequest('PUT', `/api/orders/${order.id}`, 'token', {
      body: updateData
    });
    request.params = { id: order.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { OrderQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    OrderQueries.findById.mockResolvedValue(order);

    const response = await ordersRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Invalid status transition');
  });
});

describe('Orders Router - POST /:id/complete', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should complete order and award PAWS', async () => {
    const user = UserFactory.create({ pawsBalance: 100 });
    const order = OrderFactory.create({ 
      userId: user.id, 
      status: 'in_progress',
      pawsEarned: 25 
    });
    
    const request = RequestFactory.createAuthenticatedRequest('POST', `/api/orders/${order.id}/complete`, 'token');
    request.params = { id: order.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { OrderQueries, UserQueries, TransactionQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    OrderQueries.findById.mockResolvedValue(order);
    UserQueries.findById.mockResolvedValue(user);
    OrderQueries.update.mockResolvedValue();
    UserQueries.updatePawsBalance.mockResolvedValue();
    TransactionQueries.create.mockResolvedValue();

    const response = await ordersRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.pawsEarned).toBe(25);
    expect(responseData.data.newBalance).toBe(125);

    expect(UserQueries.updatePawsBalance).toHaveBeenCalledWith(env.DB, user.id, 125);
    expect(TransactionQueries.create).toHaveBeenCalled();
  });

  it('should prevent completion of already completed orders', async () => {
    const user = UserFactory.create();
    const order = OrderFactory.create({ 
      userId: user.id, 
      status: 'completed'
    });
    
    const request = RequestFactory.createAuthenticatedRequest('POST', `/api/orders/${order.id}/complete`, 'token');
    request.params = { id: order.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { OrderQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    OrderQueries.findById.mockResolvedValue(order);

    const response = await ordersRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Order is already completed');
  });
});

describe('Orders Router - DELETE /:id', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should cancel pending order', async () => {
    const user = UserFactory.create();
    const order = OrderFactory.create({ 
      userId: user.id, 
      status: 'pending'
    });
    
    const request = RequestFactory.createAuthenticatedRequest('DELETE', `/api/orders/${order.id}`, 'token');
    request.params = { id: order.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { OrderQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    OrderQueries.findById.mockResolvedValue(order);
    OrderQueries.update.mockResolvedValue();

    const response = await ordersRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.message).toBe('Order cancelled successfully');

    expect(OrderQueries.update).toHaveBeenCalledWith(env.DB, order.id, {
      status: 'cancelled',
      cancelledAt: expect.any(String)
    });
  });

  it('should prevent cancellation of in-progress orders', async () => {
    const user = UserFactory.create();
    const order = OrderFactory.create({ 
      userId: user.id, 
      status: 'in_progress'
    });
    
    const request = RequestFactory.createAuthenticatedRequest('DELETE', `/api/orders/${order.id}`, 'token');
    request.params = { id: order.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { OrderQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    OrderQueries.findById.mockResolvedValue(order);

    const response = await ordersRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Cannot cancel order in progress');
  });
});

describe('Orders Router - GET /stats', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should return user order statistics', async () => {
    const user = UserFactory.create();
    const mockStats = {
      totalOrders: 15,
      completedOrders: 12,
      pendingOrders: 2,
      cancelledOrders: 1,
      totalSpent: 1250.00,
      totalPawsEarned: 125
    };
    
    const request = RequestFactory.createAuthenticatedRequest('GET', '/api/orders/stats', 'token');

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { DatabaseUtils } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    DatabaseUtils.executeQueryFirst.mockResolvedValue(mockStats);

    const response = await ordersRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.stats).toEqual(mockStats);
  });
});