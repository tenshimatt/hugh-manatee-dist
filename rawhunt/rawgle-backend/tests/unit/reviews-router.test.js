/**
 * Comprehensive unit tests for reviews endpoints
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reviewsRouter } from '../../src/routes/reviews.js';
import { 
  UserFactory, 
  ReviewFactory,
  SupplierFactory,
  OrderFactory,
  TestEnvironmentFactory, 
  RequestFactory,
  DatabaseMock 
} from '../fixtures/index.js';

// Mock external dependencies
vi.mock('../../src/utils/database.js', () => ({
  ReviewQueries: {
    create: vi.fn(),
    findById: vi.fn(),
    findBySupplier: vi.fn(),
    findByUser: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    markHelpful: vi.fn()
  },
  OrderQueries: {
    findById: vi.fn()
  },
  SupplierQueries: {
    findById: vi.fn(),
    updateRating: vi.fn()
  },
  UserQueries: {
    findById: vi.fn(),
    updatePawsBalance: vi.fn()
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

describe('Reviews Router - POST /', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should create review and award PAWS successfully', async () => {
      const user = UserFactory.create({ pawsBalance: 100 });
      const supplier = SupplierFactory.create();
      const order = OrderFactory.create({ 
        userId: user.id, 
        supplierId: supplier.id,
        status: 'completed'
      });
      const reviewData = {
        orderId: order.id,
        supplierId: supplier.id,
        rating: 5,
        title: 'Excellent service!',
        content: 'Great experience with this supplier.',
        images: ['review1.jpg', 'review2.jpg']
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/reviews', 'token', {
        body: reviewData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { ReviewQueries, OrderQueries, SupplierQueries, UserQueries, TransactionQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: user.id } });
      OrderQueries.findById.mockResolvedValue(order);
      SupplierQueries.findById.mockResolvedValue(supplier);
      ReviewQueries.create.mockResolvedValue('new_review_id');
      UserQueries.findById.mockResolvedValue(user);

      const response = await reviewsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.review).toBeDefined();
      expect(responseData.data.pawsEarned).toBe(25); // Standard review reward
      expect(responseData.message).toBe('Review submitted successfully');
      
      expect(ReviewQueries.create).toHaveBeenCalledWith(env.DB, expect.objectContaining({
        userId: user.id,
        supplierId: supplier.id,
        orderId: order.id,
        rating: 5,
        title: reviewData.title,
        content: reviewData.content,
        isVerified: true // Because it's linked to a completed order
      }));

      // Verify PAWS transaction
      expect(TransactionQueries.create).toHaveBeenCalledWith(env.DB, expect.objectContaining({
        userId: user.id,
        type: 'earned',
        amount: 25,
        description: 'Review submission'
      }));
    });

    it('should update supplier rating after review', async () => {
      const user = UserFactory.create();
      const supplier = SupplierFactory.create({ rating: 4.0, reviewCount: 10 });
      const order = OrderFactory.create({ userId: user.id, supplierId: supplier.id, status: 'completed' });
      const reviewData = {
        orderId: order.id,
        supplierId: supplier.id,
        rating: 5,
        title: 'Great service',
        content: 'Highly recommended'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/reviews', 'token', {
        body: reviewData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { ReviewQueries, OrderQueries, SupplierQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: user.id } });
      OrderQueries.findById.mockResolvedValue(order);
      SupplierQueries.findById.mockResolvedValue(supplier);
      ReviewQueries.create.mockResolvedValue('new_review_id');

      await reviewsRouter.handle(request, env);

      expect(SupplierQueries.updateRating).toHaveBeenCalledWith(env.DB, supplier.id, 5);
    });

    it('should create review without order (unverified)', async () => {
      const user = UserFactory.create();
      const supplier = SupplierFactory.create();
      const reviewData = {
        supplierId: supplier.id,
        rating: 4,
        title: 'Good service',
        content: 'Overall positive experience'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/reviews', 'token', {
        body: reviewData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { ReviewQueries, SupplierQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: user.id } });
      SupplierQueries.findById.mockResolvedValue(supplier);
      ReviewQueries.create.mockResolvedValue('new_review_id');

      const response = await reviewsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(ReviewQueries.create).toHaveBeenCalledWith(env.DB, expect.objectContaining({
        isVerified: false // No order linked
      }));
      expect(responseData.data.pawsEarned).toBe(0); // No PAWS for unverified reviews
    });
  });

  describe('Negative Test Cases', () => {
    it('should prevent duplicate reviews for same order', async () => {
      const user = UserFactory.create();
      const supplier = SupplierFactory.create();
      const order = OrderFactory.create({ userId: user.id, supplierId: supplier.id });
      const existingReview = ReviewFactory.create({ 
        userId: user.id, 
        supplierId: supplier.id,
        orderId: order.id 
      });
      
      const reviewData = {
        orderId: order.id,
        supplierId: supplier.id,
        rating: 5,
        title: 'Another review',
        content: 'Trying to submit duplicate review'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/reviews', 'token', {
        body: reviewData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { ReviewQueries, OrderQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: user.id } });
      OrderQueries.findById.mockResolvedValue(order);
      ReviewQueries.findByUser.mockResolvedValue([existingReview]); // Existing review found

      const response = await reviewsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.error).toBe('You have already reviewed this order');
    });

    it('should fail when supplier not found', async () => {
      const user = UserFactory.create();
      const reviewData = {
        supplierId: 'non_existent_supplier',
        rating: 5,
        title: 'Review for non-existent supplier',
        content: 'This should fail'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/reviews', 'token', {
        body: reviewData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { SupplierQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: user.id } });
      SupplierQueries.findById.mockResolvedValue(null);

      const response = await reviewsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Supplier not found');
    });

    it('should fail with invalid rating', async () => {
      const user = UserFactory.create();
      const supplier = SupplierFactory.create();
      const reviewData = {
        supplierId: supplier.id,
        rating: 6, // Invalid rating (should be 1-5)
        title: 'Invalid rating review',
        content: 'This has an invalid rating'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/reviews', 'token', {
        body: reviewData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      requireAuth.mockResolvedValue({ user: { id: user.id } });

      const response = await reviewsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Validation failed');
    });

    it('should prevent review of own order by wrong user', async () => {
      const user = UserFactory.create();
      const otherUser = UserFactory.create();
      const supplier = SupplierFactory.create();
      const order = OrderFactory.create({ 
        userId: otherUser.id, // Order belongs to different user
        supplierId: supplier.id 
      });
      
      const reviewData = {
        orderId: order.id,
        supplierId: supplier.id,
        rating: 5,
        title: 'Unauthorized review',
        content: 'Trying to review someone elses order'
      };
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/reviews', 'token', {
        body: reviewData
      });

      const { requireAuth } = await import('../../src/middleware/auth.js');
      const { OrderQueries } = await import('../../src/utils/database.js');
      
      requireAuth.mockResolvedValue({ user: { id: user.id } });
      OrderQueries.findById.mockResolvedValue(order);

      const response = await reviewsRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe('You can only review your own orders');
    });
  });
});

describe('Reviews Router - GET /supplier/:supplierId', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should return supplier reviews with pagination', async () => {
    const supplier = SupplierFactory.create();
    const reviews = [
      ReviewFactory.create({ supplierId: supplier.id }),
      ReviewFactory.create({ supplierId: supplier.id }),
      ReviewFactory.create({ supplierId: supplier.id })
    ];
    
    const request = RequestFactory.create('GET', `/api/reviews/supplier/${supplier.id}?page=1&limit=10`);
    request.params = { supplierId: supplier.id };

    const { ReviewQueries, DatabaseUtils } = await import('../../src/utils/database.js');
    ReviewQueries.findBySupplier.mockResolvedValue(reviews);
    DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 15 });

    const response = await reviewsRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.reviews).toHaveLength(3);
    expect(responseData.data.pagination.total).toBe(15);
    expect(responseData.data.pagination.totalPages).toBe(2);
  });

  it('should filter reviews by rating', async () => {
    const supplier = SupplierFactory.create();
    const request = RequestFactory.create('GET', `/api/reviews/supplier/${supplier.id}?rating=5`);
    request.params = { supplierId: supplier.id };

    const { ReviewQueries } = await import('../../src/utils/database.js');
    ReviewQueries.findBySupplier.mockResolvedValue([]);

    await reviewsRouter.handle(request, env);

    expect(ReviewQueries.findBySupplier).toHaveBeenCalledWith(
      env.DB, 
      supplier.id, 
      expect.objectContaining({
        rating: 5
      })
    );
  });

  it('should anonymize reviewer names', async () => {
    const supplier = SupplierFactory.create();
    const reviews = [
      ReviewFactory.create({ 
        supplierId: supplier.id,
        userName: 'John Doe'
      })
    ];
    
    const request = RequestFactory.create('GET', `/api/reviews/supplier/${supplier.id}`);
    request.params = { supplierId: supplier.id };

    const { ReviewQueries, DatabaseUtils } = await import('../../src/utils/database.js');
    ReviewQueries.findBySupplier.mockResolvedValue(reviews);
    DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 1 });

    const response = await reviewsRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.data.reviews[0].userName).toBe('John D.'); // Last name should be abbreviated
  });
});

describe('Reviews Router - GET /user', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should return user reviews', async () => {
    const user = UserFactory.create();
    const userReviews = [
      ReviewFactory.create({ userId: user.id }),
      ReviewFactory.create({ userId: user.id })
    ];
    
    const request = RequestFactory.createAuthenticatedRequest('GET', '/api/reviews/user', 'token');

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { ReviewQueries, DatabaseUtils } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    ReviewQueries.findByUser.mockResolvedValue(userReviews);
    DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 2 });

    const response = await reviewsRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.reviews).toHaveLength(2);
  });
});

describe('Reviews Router - PUT /:id', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should update user review successfully', async () => {
    const user = UserFactory.create();
    const review = ReviewFactory.create({ userId: user.id });
    const updateData = {
      rating: 4,
      title: 'Updated title',
      content: 'Updated content'
    };
    
    const request = RequestFactory.createAuthenticatedRequest('PUT', `/api/reviews/${review.id}`, 'token', {
      body: updateData
    });
    request.params = { id: review.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { ReviewQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    ReviewQueries.findById.mockResolvedValue(review);
    ReviewQueries.update.mockResolvedValue();

    const response = await reviewsRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.message).toBe('Review updated successfully');
    
    expect(ReviewQueries.update).toHaveBeenCalledWith(env.DB, review.id, updateData);
  });

  it('should prevent updating other users reviews', async () => {
    const user = UserFactory.create();
    const otherUserReview = ReviewFactory.create({ userId: 'other_user_id' });
    const updateData = { rating: 1, title: 'Malicious update' };
    
    const request = RequestFactory.createAuthenticatedRequest('PUT', `/api/reviews/${otherUserReview.id}`, 'token', {
      body: updateData
    });
    request.params = { id: otherUserReview.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { ReviewQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    ReviewQueries.findById.mockResolvedValue(otherUserReview);

    const response = await reviewsRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(404);
    expect(responseData.error).toBe('Review not found');
  });

  it('should prevent awarding additional PAWS for review updates', async () => {
    const user = UserFactory.create();
    const review = ReviewFactory.create({ userId: user.id });
    const updateData = { content: 'Updated review content' };
    
    const request = RequestFactory.createAuthenticatedRequest('PUT', `/api/reviews/${review.id}`, 'token', {
      body: updateData
    });
    request.params = { id: review.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { ReviewQueries, TransactionQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    ReviewQueries.findById.mockResolvedValue(review);
    ReviewQueries.update.mockResolvedValue();

    const response = await reviewsRouter.handle(request, env);

    expect(response.status).toBe(200);
    expect(TransactionQueries.create).not.toHaveBeenCalled(); // No additional PAWS
  });
});

describe('Reviews Router - DELETE /:id', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should delete user review successfully', async () => {
    const user = UserFactory.create();
    const review = ReviewFactory.create({ userId: user.id });
    
    const request = RequestFactory.createAuthenticatedRequest('DELETE', `/api/reviews/${review.id}`, 'token');
    request.params = { id: review.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { ReviewQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    ReviewQueries.findById.mockResolvedValue(review);
    ReviewQueries.delete.mockResolvedValue();

    const response = await reviewsRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.message).toBe('Review deleted successfully');
    
    expect(ReviewQueries.delete).toHaveBeenCalledWith(env.DB, review.id);
  });

  it('should prevent deleting other users reviews', async () => {
    const user = UserFactory.create();
    const otherUserReview = ReviewFactory.create({ userId: 'other_user_id' });
    
    const request = RequestFactory.createAuthenticatedRequest('DELETE', `/api/reviews/${otherUserReview.id}`, 'token');
    request.params = { id: otherUserReview.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { ReviewQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    ReviewQueries.findById.mockResolvedValue(otherUserReview);

    const response = await reviewsRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(404);
    expect(responseData.error).toBe('Review not found');
  });
});

describe('Reviews Router - POST /:id/helpful', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should mark review as helpful', async () => {
    const user = UserFactory.create();
    const review = ReviewFactory.create();
    
    const request = RequestFactory.createAuthenticatedRequest('POST', `/api/reviews/${review.id}/helpful`, 'token');
    request.params = { id: review.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { ReviewQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    ReviewQueries.findById.mockResolvedValue(review);
    ReviewQueries.markHelpful.mockResolvedValue();

    const response = await reviewsRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.message).toBe('Review marked as helpful');
    
    expect(ReviewQueries.markHelpful).toHaveBeenCalledWith(env.DB, review.id, user.id);
  });

  it('should prevent marking own review as helpful', async () => {
    const user = UserFactory.create();
    const userReview = ReviewFactory.create({ userId: user.id });
    
    const request = RequestFactory.createAuthenticatedRequest('POST', `/api/reviews/${userReview.id}/helpful`, 'token');
    request.params = { id: userReview.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { ReviewQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    ReviewQueries.findById.mockResolvedValue(userReview);

    const response = await reviewsRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Cannot mark your own review as helpful');
  });

  it('should handle duplicate helpful marks', async () => {
    const user = UserFactory.create();
    const review = ReviewFactory.create();
    
    const request = RequestFactory.createAuthenticatedRequest('POST', `/api/reviews/${review.id}/helpful`, 'token');
    request.params = { id: review.id };

    const { requireAuth } = await import('../../src/middleware/auth.js');
    const { ReviewQueries } = await import('../../src/utils/database.js');
    
    requireAuth.mockResolvedValue({ user: { id: user.id } });
    ReviewQueries.findById.mockResolvedValue(review);
    ReviewQueries.markHelpful.mockRejectedValue(new Error('UNIQUE constraint failed'));

    const response = await reviewsRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(409);
    expect(responseData.error).toBe('You have already marked this review as helpful');
  });
});