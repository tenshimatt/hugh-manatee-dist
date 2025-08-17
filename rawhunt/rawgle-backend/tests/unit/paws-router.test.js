/**
 * Comprehensive unit tests for PAWS endpoints
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pawsRouter } from '../../src/routes/paws.js';
import { 
  UserFactory, 
  TransactionFactory,
  TestEnvironmentFactory, 
  RequestFactory,
  DatabaseMock 
} from '../fixtures/index.js';

// Mock external dependencies
vi.mock('../../src/utils/database.js', () => ({
  UserQueries: {
    findById: vi.fn(),
    updatePawsBalance: vi.fn()
  },
  TransactionQueries: {
    getByUserId: vi.fn()
  },
  DatabaseUtils: {
    executeQueryFirst: vi.fn(),
    executeQuery: vi.fn(),
    executeUpdate: vi.fn(),
    formatDateForDB: vi.fn().mockReturnValue('2023-01-01 00:00:00'),
    transaction: vi.fn()
  }
}));

vi.mock('../../src/middleware/auth.js', () => ({
  requireAuth: vi.fn()
}));

vi.mock('../../src/middleware/rateLimit.js', () => ({
  rateLimit: vi.fn().mockResolvedValue(null)
}));

describe('PAWS Router - GET /balance', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should return user PAWS balance', async () => {
      const mockUser = UserFactory.create({ pawsBalance: 500 });
      const request = RequestFactory.createAuthenticatedRequest('GET', '/api/paws/balance', 'valid_token');

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { UserQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: mockUser.id } });
      UserQueries.findById.mockResolvedValue({ ...mockUser, paws_balance: 500 });

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.balance).toBe(500);
      expect(responseData.data.userId).toBe(mockUser.id);
    });
  });

  describe('Negative Test Cases', () => {
    it('should fail for unauthenticated user', async () => {
      const request = RequestFactory.create('GET', '/api/paws/balance');

      const { requireAuth } = await import('../../src/middleware/auth.js');
      requireAuth.mockResolvedValue(new Response('Unauthorized', { status: 401 }));

      const response = await pawsRouter.handle(request, env);

      expect(response.status).toBe(401);
    });

    it('should fail when user not found', async () => {
      const request = RequestFactory.createAuthenticatedRequest('GET', '/api/paws/balance', 'valid_token');

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { UserQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'non_existent_user' } });
      UserQueries.findById.mockResolvedValue(null);

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('User not found');
      expect(responseData.code).toBe('USER_NOT_FOUND');
    });

    it('should handle database errors', async () => {
      const request = RequestFactory.createAuthenticatedRequest('GET', '/api/paws/balance', 'valid_token');

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { UserQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });
      UserQueries.findById.mockRejectedValue(new Error('Database error'));

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to get PAWS balance');
      expect(responseData.code).toBe('BALANCE_ERROR');
    });
  });
});

describe('PAWS Router - GET /transactions', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should return paginated transaction history', async () => {
      const mockTransactions = [
        TransactionFactory.create(),
        TransactionFactory.create(),
        TransactionFactory.create()
      ];
      const request = RequestFactory.createAuthenticatedRequest('GET', '/api/paws/transactions?page=1&limit=10', 'valid_token');

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { TransactionQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });
      TransactionQueries.getByUserId.mockResolvedValue(mockTransactions);
      DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 25 });

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.transactions).toHaveLength(3);
      expect(responseData.data.pagination.page).toBe(1);
      expect(responseData.data.pagination.limit).toBe(10);
      expect(responseData.data.pagination.total).toBe(25);
      expect(responseData.data.pagination.totalPages).toBe(3);
    });

    it('should use default pagination values', async () => {
      const request = RequestFactory.createAuthenticatedRequest('GET', '/api/paws/transactions', 'valid_token');

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { TransactionQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });
      TransactionQueries.getByUserId.mockResolvedValue([]);
      DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 0 });

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.pagination.page).toBe(1);
      expect(responseData.data.pagination.limit).toBe(20);
      
      expect(TransactionQueries.getByUserId).toHaveBeenCalledWith(env.DB, 'user_id', 1, 20);
    });

    it('should limit maximum page size', async () => {
      const request = RequestFactory.createAuthenticatedRequest('GET', '/api/paws/transactions?limit=200', 'valid_token');

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { TransactionQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });
      TransactionQueries.getByUserId.mockResolvedValue([]);
      DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 0 });

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(responseData.data.pagination.limit).toBe(100); // Max limit
      expect(TransactionQueries.getByUserId).toHaveBeenCalledWith(env.DB, 'user_id', 1, 100);
    });
  });

  describe('Negative Test Cases', () => {
    it('should handle database errors', async () => {
      const request = RequestFactory.createAuthenticatedRequest('GET', '/api/paws/transactions', 'valid_token');

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { TransactionQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });
      TransactionQueries.getByUserId.mockRejectedValue(new Error('Database error'));

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to get transaction history');
      expect(responseData.code).toBe('TRANSACTIONS_ERROR');
    });
  });
});

describe('PAWS Router - POST /transfer', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should successfully transfer PAWS between users', async () => {
      const sender = UserFactory.create({ id: 'sender_id', pawsBalance: 1000 });
      const recipient = UserFactory.create({ id: 'recipient_id', pawsBalance: 500 });
      const transferData = {
        toUserId: 'recipient_id',
        amount: 100,
        description: 'Gift transfer'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/transfer', 'valid_token', {
        body: transferData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { UserQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'sender_id' } });
      UserQueries.findById.mockResolvedValueOnce({ ...sender, paws_balance: 1000 }); // Initial sender
      UserQueries.findById.mockResolvedValueOnce({ ...recipient, paws_balance: 500 }); // Recipient check
      UserQueries.findById.mockResolvedValueOnce({ ...sender, paws_balance: 900 }); // Updated sender
      UserQueries.findById.mockResolvedValueOnce({ ...recipient, paws_balance: 600 }); // Updated recipient
      DatabaseUtils.transaction.mockResolvedValue();

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.transfer.amount).toBe(100);
      expect(responseData.data.transfer.from.newBalance).toBe(900);
      expect(responseData.data.transfer.to.newBalance).toBe(600);
      expect(responseData.message).toBe('PAWS transfer completed successfully');
      
      expect(DatabaseUtils.transaction).toHaveBeenCalled();
    });
  });

  describe('Negative Test Cases', () => {
    it('should fail when trying to transfer to self', async () => {
      const transferData = {
        toUserId: 'user_id',
        amount: 100,
        description: 'Self transfer'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/transfer', 'valid_token', {
        body: transferData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Cannot transfer PAWS to yourself');
      expect(responseData.code).toBe('SELF_TRANSFER');
    });

    it('should fail with insufficient balance', async () => {
      const sender = UserFactory.create({ id: 'sender_id', pawsBalance: 50 });
      const transferData = {
        toUserId: 'recipient_id',
        amount: 100,
        description: 'Transfer more than balance'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/transfer', 'valid_token', {
        body: transferData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { UserQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'sender_id' } });
      UserQueries.findById.mockResolvedValue({ ...sender, paws_balance: 50 });

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Insufficient PAWS balance');
      expect(responseData.code).toBe('INSUFFICIENT_BALANCE');
    });

    it('should fail when recipient not found', async () => {
      const sender = UserFactory.create({ id: 'sender_id', pawsBalance: 1000 });
      const transferData = {
        toUserId: 'non_existent_user',
        amount: 100,
        description: 'Transfer to non-existent user'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/transfer', 'valid_token', {
        body: transferData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { UserQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'sender_id' } });
      UserQueries.findById.mockResolvedValueOnce({ ...sender, paws_balance: 1000 }); // Sender
      UserQueries.findById.mockResolvedValueOnce(null); // Recipient not found

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Recipient user not found');
      expect(responseData.code).toBe('RECIPIENT_NOT_FOUND');
    });

    it('should respect rate limiting', async () => {
      const transferData = {
        toUserId: 'recipient_id',
        amount: 100,
        description: 'Rate limited transfer'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/transfer', 'valid_token', {
        body: transferData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { rateLimit } = await import('../../src/middleware/rateLimit.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'sender_id' } });
      rateLimit.mockResolvedValue(new Response('Too Many Requests', { status: 429 }));

      const response = await pawsRouter.handle(request, env);

      expect(response.status).toBe(429);
      expect(rateLimit).toHaveBeenCalledWith(request, env, {
        windowMs: 60 * 1000,
        maxRequests: 5
      });
    });

    it('should fail with invalid transfer data', async () => {
      const invalidData = {
        toUserId: 'recipient_id',
        amount: -100, // Invalid negative amount
        description: 'Invalid transfer'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/transfer', 'valid_token', {
        body: invalidData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      requireAuth.mockResolvedValue({ user: { id: 'sender_id' } });

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.code).toBe('VALIDATION_ERROR');
    });
  });
});

describe('PAWS Router - POST /earn', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create({
      PAWS_EARNING_RATES: '{"order_completion": 50, "review_submission": 25}'
    });
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should successfully award PAWS for valid earning activity', async () => {
      const user = UserFactory.create({ pawsBalance: 200 });
      const earnData = {
        amount: 50,
        type: 'order_completion',
        description: 'Order completed',
        referenceId: 'order_123'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/earn', 'valid_token', {
        body: earnData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { UserQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });
      DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 0 }); // No daily earnings yet
      UserQueries.findById.mockResolvedValue({ ...user, paws_balance: 200 });
      DatabaseUtils.transaction.mockResolvedValue();

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.earned).toBe(50);
      expect(responseData.data.newBalance).toBe(250);
      expect(responseData.data.type).toBe('order_completion');
      expect(responseData.message).toBe('PAWS earned successfully');
    });

    it('should work when no earning rates are configured', async () => {
      env.PAWS_EARNING_RATES = undefined;
      const user = UserFactory.create({ pawsBalance: 200 });
      const earnData = {
        amount: 75,
        type: 'custom_activity',
        description: 'Custom earning',
        referenceId: 'ref_123'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/earn', 'valid_token', {
        body: earnData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { UserQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });
      DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 0 });
      UserQueries.findById.mockResolvedValue({ ...user, paws_balance: 200 });
      DatabaseUtils.transaction.mockResolvedValue();

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.earned).toBe(75);
    });
  });

  describe('Negative Test Cases', () => {
    it('should fail with invalid earning amount for configured type', async () => {
      const earnData = {
        amount: 100, // Should be 50 for order_completion
        type: 'order_completion',
        description: 'Order completed',
        referenceId: 'order_123'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/earn', 'valid_token', {
        body: earnData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid earning amount for this type');
      expect(responseData.code).toBe('INVALID_EARNING_AMOUNT');
    });

    it('should fail when daily earning limit exceeded', async () => {
      const earnData = {
        amount: 50,
        type: 'order_completion',
        description: 'Order completed',
        referenceId: 'order_123'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/earn', 'valid_token', {
        body: earnData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { DatabaseUtils } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });
      DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 980 }); // Almost at daily limit

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(429);
      expect(responseData.error).toBe('Daily PAWS earning limit exceeded');
      expect(responseData.code).toBe('DAILY_LIMIT_EXCEEDED');
    });

    it('should fail with invalid earning data', async () => {
      const invalidData = {
        amount: -25, // Negative amount
        type: 'invalid_type',
        description: 'Invalid earning'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/earn', 'valid_token', {
        body: invalidData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.code).toBe('VALIDATION_ERROR');
    });
  });
});

describe('PAWS Router - POST /spend', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should successfully spend PAWS', async () => {
      const user = UserFactory.create({ pawsBalance: 500 });
      const spendData = {
        amount: 100,
        description: 'Premium upgrade',
        referenceType: 'upgrade',
        referenceId: 'upgrade_123'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/spend', 'valid_token', {
        body: spendData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { UserQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });
      UserQueries.findById.mockResolvedValue({ ...user, paws_balance: 500 });
      DatabaseUtils.transaction.mockResolvedValue();

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.spent).toBe(100);
      expect(responseData.data.newBalance).toBe(400);
      expect(responseData.data.description).toBe('Premium upgrade');
      expect(responseData.message).toBe('PAWS spent successfully');
    });

    it('should use default reference type when not provided', async () => {
      const user = UserFactory.create({ pawsBalance: 500 });
      const spendData = {
        amount: 50,
        description: 'Basic purchase'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/spend', 'valid_token', {
        body: spendData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { UserQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });
      UserQueries.findById.mockResolvedValue({ ...user, paws_balance: 500 });
      DatabaseUtils.transaction.mockResolvedValue();

      const response = await pawsRouter.handle(request, env);

      expect(response.status).toBe(200);
      expect(DatabaseUtils.transaction).toHaveBeenCalled();
    });
  });

  describe('Negative Test Cases', () => {
    it('should fail with missing required fields', async () => {
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/spend', 'valid_token', {
        body: {} // Missing amount and description
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Amount and description are required');
      expect(responseData.code).toBe('MISSING_FIELDS');
    });

    it('should fail with invalid amount', async () => {
      const spendData = {
        amount: 'invalid',
        description: 'Invalid amount'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/spend', 'valid_token', {
        body: spendData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid amount');
      expect(responseData.code).toBe('INVALID_AMOUNT');
    });

    it('should fail with negative or zero amount', async () => {
      const spendData = {
        amount: -50,
        description: 'Negative amount'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/spend', 'valid_token', {
        body: spendData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid amount');
      expect(responseData.code).toBe('INVALID_AMOUNT');
    });

    it('should fail with insufficient balance', async () => {
      const user = UserFactory.create({ pawsBalance: 50 });
      const spendData = {
        amount: 100,
        description: 'More than balance'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/spend', 'valid_token', {
        body: spendData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { UserQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });
      UserQueries.findById.mockResolvedValue({ ...user, paws_balance: 50 });

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Insufficient PAWS balance');
      expect(responseData.code).toBe('INSUFFICIENT_BALANCE');
    });

    it('should handle database errors', async () => {
      const spendData = {
        amount: 100,
        description: 'Database error test'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/paws/spend', 'valid_token', {
        body: spendData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { UserQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: 'user_id' } });
      UserQueries.findById.mockRejectedValue(new Error('Database error'));

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to spend PAWS');
      expect(responseData.code).toBe('SPEND_ERROR');
    });
  });
});

describe('PAWS Router - GET /leaderboard', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should return PAWS leaderboard with rankings', async () => {
      const mockLeaderboardData = [
        { id: 'user1', first_name: 'John', last_name: 'Doe', paws_balance: 1000, created_at: '2023-01-01' },
        { id: 'user2', first_name: 'Jane', last_name: 'Smith', paws_balance: 800, created_at: '2023-01-02' },
        { id: 'user3', first_name: 'Bob', last_name: 'Johnson', paws_balance: 600, created_at: '2023-01-03' }
      ];
      
      const request = RequestFactory.create('GET', '/api/paws/leaderboard');

      const { DatabaseUtils } = await import('../../src/utils/database.js');
      DatabaseUtils.executeQuery.mockResolvedValue(mockLeaderboardData);

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.leaderboard).toHaveLength(3);
      
      // Check ranking and privacy
      expect(responseData.data.leaderboard[0].rank).toBe(1);
      expect(responseData.data.leaderboard[0].name).toBe('John D.');
      expect(responseData.data.leaderboard[0].pawsBalance).toBe(1000);
      
      expect(responseData.data.leaderboard[1].rank).toBe(2);
      expect(responseData.data.leaderboard[1].name).toBe('Jane S.');
      expect(responseData.data.leaderboard[1].pawsBalance).toBe(800);
    });

    it('should use default limit when not provided', async () => {
      const request = RequestFactory.create('GET', '/api/paws/leaderboard');

      const { DatabaseUtils } = await import('../../src/utils/database.js');
      DatabaseUtils.executeQuery.mockResolvedValue([]);

      await pawsRouter.handle(request, env);

      expect(DatabaseUtils.executeQuery).toHaveBeenCalledWith(
        env.DB,
        expect.stringContaining('LIMIT ?'),
        [10] // Default limit
      );
    });

    it('should respect custom limit', async () => {
      const request = RequestFactory.create('GET', '/api/paws/leaderboard?limit=5');

      const { DatabaseUtils } = await import('../../src/utils/database.js');
      DatabaseUtils.executeQuery.mockResolvedValue([]);

      await pawsRouter.handle(request, env);

      expect(DatabaseUtils.executeQuery).toHaveBeenCalledWith(
        env.DB,
        expect.stringContaining('LIMIT ?'),
        [5]
      );
    });

    it('should limit maximum results', async () => {
      const request = RequestFactory.create('GET', '/api/paws/leaderboard?limit=200');

      const { DatabaseUtils } = await import('../../src/utils/database.js');
      DatabaseUtils.executeQuery.mockResolvedValue([]);

      await pawsRouter.handle(request, env);

      expect(DatabaseUtils.executeQuery).toHaveBeenCalledWith(
        env.DB,
        expect.stringContaining('LIMIT ?'),
        [100] // Maximum limit
      );
    });
  });

  describe('Negative Test Cases', () => {
    it('should handle database errors', async () => {
      const request = RequestFactory.create('GET', '/api/paws/leaderboard');

      const { DatabaseUtils } = await import('../../src/utils/database.js');
      DatabaseUtils.executeQuery.mockRejectedValue(new Error('Database error'));

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to get leaderboard');
      expect(responseData.code).toBe('LEADERBOARD_ERROR');
    });

    it('should handle empty leaderboard', async () => {
      const request = RequestFactory.create('GET', '/api/paws/leaderboard');

      const { DatabaseUtils } = await import('../../src/utils/database.js');
      DatabaseUtils.executeQuery.mockResolvedValue([]);

      const response = await pawsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.leaderboard).toHaveLength(0);
    });
  });
});