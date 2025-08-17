/**
 * Comprehensive unit tests for suppliers endpoints
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { suppliersRouter } from '../../src/routes/suppliers.js';
import { 
  SupplierFactory, 
  UserFactory,
  TestEnvironmentFactory, 
  RequestFactory,
  DatabaseMock 
} from '../fixtures/index.js';

// Mock external dependencies
vi.mock('../../src/utils/database.js', () => ({
  SupplierQueries: {
    search: vi.fn(),
    findById: vi.fn(),
    create: vi.fn().mockResolvedValue('mock_supplier_id'),
    update: vi.fn().mockResolvedValue()
  },
  DatabaseUtils: {
    executeQuery: vi.fn(),
    executeQueryFirst: vi.fn(),
    executeUpdate: vi.fn(),
    escapeSearchTerm: vi.fn().mockImplementation(term => `%${term}%`),
    formatDateForDB: vi.fn().mockReturnValue('2023-01-01 00:00:00')
  }
}));

vi.mock('../../src/middleware/auth.js', () => ({
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  optionalAuth: vi.fn().mockResolvedValue(null)
}));

vi.mock('../../src/middleware/rateLimit.js', () => ({
  rateLimit: vi.fn().mockResolvedValue(null)
}));

describe('Suppliers Router - GET /', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should return suppliers with basic search', async () => {
      const mockSuppliers = [
        SupplierFactory.create(),
        SupplierFactory.create(),
        SupplierFactory.create()
      ];
      
      const request = RequestFactory.create('GET', '/api/suppliers');

      const { SupplierQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      SupplierQueries.search.mockResolvedValue(mockSuppliers);
      DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 3 });

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.suppliers).toHaveLength(3);
      expect(responseData.data.pagination).toBeDefined();
      expect(responseData.data.pagination.total).toBe(3);
    });

    it('should filter suppliers by category', async () => {
      const veterinarySuppliers = [
        SupplierFactory.create({ category: 'veterinary' }),
        SupplierFactory.create({ category: 'veterinary' })
      ];
      
      const request = RequestFactory.create('GET', '/api/suppliers?category=veterinary');

      const { SupplierQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      SupplierQueries.search.mockResolvedValue(veterinarySuppliers);
      DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 2 });

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.suppliers).toHaveLength(2);
      expect(SupplierQueries.search).toHaveBeenCalledWith(env.DB, expect.objectContaining({
        category: 'veterinary'
      }));
    });

    it('should filter suppliers by location and radius', async () => {
      const nearbySuppliers = [SupplierFactory.create()];
      
      const request = RequestFactory.create('GET', '/api/suppliers?latitude=40.7128&longitude=-74.0060&radius=5');

      const { SupplierQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      SupplierQueries.search.mockResolvedValue(nearbySuppliers);
      DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 1 });

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(SupplierQueries.search).toHaveBeenCalledWith(env.DB, expect.objectContaining({
        latitude: 40.7128,
        longitude: -74.0060,
        radius: 5
      }));
    });

    it('should search suppliers by text', async () => {
      const matchingSuppliers = [SupplierFactory.create({ name: 'Pet Grooming Salon' })];
      
      const request = RequestFactory.create('GET', '/api/suppliers?search=grooming');

      const { SupplierQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      SupplierQueries.search.mockResolvedValue(matchingSuppliers);
      DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 1 });

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(SupplierQueries.search).toHaveBeenCalledWith(env.DB, expect.objectContaining({
        search: 'grooming'
      }));
    });

    it('should paginate results correctly', async () => {
      const mockSuppliers = [SupplierFactory.create()];
      
      const request = RequestFactory.create('GET', '/api/suppliers?page=2&limit=10');

      const { SupplierQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      SupplierQueries.search.mockResolvedValue(mockSuppliers);
      DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 25 });

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.pagination.page).toBe(2);
      expect(responseData.data.pagination.limit).toBe(10);
      expect(responseData.data.pagination.total).toBe(25);
      expect(responseData.data.pagination.totalPages).toBe(3);
    });

    it('should process JSON fields correctly', async () => {
      const supplierWithJSON = SupplierFactory.create({
        specialties: '["grooming", "training"]',
        business_hours: '{"monday": "9-5", "tuesday": "9-5"}',
        images: '["image1.jpg", "image2.jpg"]'
      });
      
      const request = RequestFactory.create('GET', '/api/suppliers');

      const { SupplierQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      SupplierQueries.search.mockResolvedValue([supplierWithJSON]);
      DatabaseUtils.executeQueryFirst.mockResolvedValue({ total: 1 });

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.suppliers[0].specialties).toEqual(['grooming', 'training']);
      expect(responseData.data.suppliers[0].businessHours).toEqual({ monday: '9-5', tuesday: '9-5' });
      expect(responseData.data.suppliers[0].images).toEqual(['image1.jpg', 'image2.jpg']);
    });
  });

  describe('Negative Test Cases', () => {
    it('should handle invalid search parameters', async () => {
      const request = RequestFactory.create('GET', '/api/suppliers?latitude=invalid');

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid search parameters');
      expect(responseData.code).toBe('VALIDATION_ERROR');
    });

    it('should handle database errors gracefully', async () => {
      const request = RequestFactory.create('GET', '/api/suppliers');

      const { SupplierQueries } = await import('../../src/utils/database.js');
      SupplierQueries.search.mockRejectedValue(new Error('Database connection failed'));

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to search suppliers');
      expect(responseData.code).toBe('SEARCH_ERROR');
    });

    it('should respect rate limiting', async () => {
      const request = RequestFactory.create('GET', '/api/suppliers');

      const { rateLimit } = await import('../../src/middleware/rateLimit.js');
      rateLimit.mockResolvedValue(new Response('Rate limit exceeded', { status: 429 }));

      const response = await suppliersRouter.handle(request, env);

      expect(response.status).toBe(429);
    });
  });
});

describe('Suppliers Router - GET /:id', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should return supplier details with reviews', async () => {
      const mockSupplier = SupplierFactory.create({ id: 123 });
      const mockReviews = [
        {
          id: 1,
          rating: 5,
          content: 'Great service!',
          first_name: 'John',
          last_name: 'Doe',
          images: '["review1.jpg"]'
        }
      ];
      
      const request = RequestFactory.create('GET', '/api/suppliers/123');
      request.params = { id: '123' };

      const { SupplierQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      SupplierQueries.findById.mockResolvedValue(mockSupplier);
      DatabaseUtils.executeQuery.mockResolvedValue(mockReviews);

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.supplier).toBeDefined();
      expect(responseData.data.reviews).toHaveLength(1);
      expect(responseData.data.reviews[0].userName).toBe('John D.');
      expect(responseData.data.reviews[0].images).toEqual(['review1.jpg']);
    });
  });

  describe('Negative Test Cases', () => {
    it('should fail with invalid supplier ID', async () => {
      const request = RequestFactory.create('GET', '/api/suppliers/invalid');
      request.params = { id: 'invalid' };

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid supplier ID');
      expect(responseData.code).toBe('INVALID_ID');
    });

    it('should fail when supplier not found', async () => {
      const request = RequestFactory.create('GET', '/api/suppliers/999');
      request.params = { id: '999' };

      const { SupplierQueries } = await import('../../src/utils/database.js');
      SupplierQueries.findById.mockResolvedValue(null);

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Supplier not found');
      expect(responseData.code).toBe('SUPPLIER_NOT_FOUND');
    });

    it('should handle database errors', async () => {
      const request = RequestFactory.create('GET', '/api/suppliers/123');
      request.params = { id: '123' };

      const { SupplierQueries } = await import('../../src/utils/database.js');
      SupplierQueries.findById.mockRejectedValue(new Error('Database error'));

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to get supplier');
      expect(responseData.code).toBe('GET_SUPPLIER_ERROR');
    });
  });
});

describe('Suppliers Router - POST /', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should create new supplier with admin auth', async () => {
      const supplierData = {
        name: 'New Pet Clinic',
        category: 'veterinary',
        email: 'clinic@example.com',
        phoneNumber: '+1234567890',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060
      };
      const createdSupplier = SupplierFactory.create(supplierData);
      
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/suppliers', 'admin_token', {
        body: supplierData
      });

      const { requireAdmin } = await import('../../src/middleware/auth.js');
      const { SupplierQueries } = await import('../../src/utils/database.js');
      
      requireAdmin.mockResolvedValue({ user: { id: 'admin_id', isAdmin: true } });
      SupplierQueries.create.mockResolvedValue('new_supplier_id');
      SupplierQueries.findById.mockResolvedValue(createdSupplier);

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.supplier).toBeDefined();
      expect(responseData.message).toBe('Supplier created successfully');
      
      expect(SupplierQueries.create).toHaveBeenCalledWith(env.DB, expect.objectContaining(supplierData));
    });
  });

  describe('Negative Test Cases', () => {
    it('should fail without admin authentication', async () => {
      const supplierData = SupplierFactory.create();
      const request = RequestFactory.create('POST', '/api/suppliers', { body: supplierData });

      const { requireAdmin } = await import('../../src/middleware/auth.js');
      requireAdmin.mockResolvedValue(new Response('Forbidden', { status: 403 }));

      const response = await suppliersRouter.handle(request, env);

      expect(response.status).toBe(403);
    });

    it('should fail with invalid supplier data', async () => {
      const invalidData = { name: '' }; // Missing required fields
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/suppliers', 'admin_token', {
        body: invalidData
      });

      const { requireAdmin } = await import('../../src/middleware/auth.js');
      requireAdmin.mockResolvedValue({ user: { id: 'admin_id', isAdmin: true } });

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.code).toBe('VALIDATION_ERROR');
    });

    it('should handle database creation errors', async () => {
      const supplierData = SupplierFactory.create();
      const request = RequestFactory.createAuthenticatedRequest('POST', '/api/suppliers', 'admin_token', {
        body: supplierData
      });

      const { requireAdmin } = await import('../../src/middleware/auth.js');
      const { SupplierQueries } = await import('../../src/utils/database.js');
      
      requireAdmin.mockResolvedValue({ user: { id: 'admin_id', isAdmin: true } });
      SupplierQueries.create.mockRejectedValue(new Error('Database constraint violation'));

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to create supplier');
      expect(responseData.code).toBe('CREATE_SUPPLIER_ERROR');
    });
  });
});

describe('Suppliers Router - PUT /:id', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should update supplier with admin auth', async () => {
      const existingSupplier = SupplierFactory.create({ id: 123 });
      const updateData = {
        name: 'Updated Pet Clinic',
        phoneNumber: '+1987654321'
      };
      const updatedSupplier = { ...existingSupplier, ...updateData };
      
      const request = RequestFactory.createAuthenticatedRequest('PUT', '/api/suppliers/123', 'admin_token', {
        body: updateData
      });
      request.params = { id: '123' };

      const { requireAdmin } = await import('../../src/middleware/auth.js');
      const { SupplierQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      
      requireAdmin.mockResolvedValue({ user: { id: 'admin_id', isAdmin: true } });
      SupplierQueries.findById.mockResolvedValueOnce(existingSupplier);
      SupplierQueries.findById.mockResolvedValueOnce(updatedSupplier);
      DatabaseUtils.executeUpdate.mockResolvedValue();

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.supplier).toBeDefined();
      expect(responseData.message).toBe('Supplier updated successfully');
    });

    it('should handle JSON field updates', async () => {
      const existingSupplier = SupplierFactory.create({ id: 123 });
      const updateData = {
        specialties: ['grooming', 'boarding'],
        businessHours: { monday: '9-6', tuesday: '9-6' }
      };
      
      const request = RequestFactory.createAuthenticatedRequest('PUT', '/api/suppliers/123', 'admin_token', {
        body: updateData
      });
      request.params = { id: '123' };

      const { requireAdmin } = await import('../../src/middleware/auth.js');
      const { SupplierQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      
      requireAdmin.mockResolvedValue({ user: { id: 'admin_id', isAdmin: true } });
      SupplierQueries.findById.mockResolvedValueOnce(existingSupplier);
      SupplierQueries.findById.mockResolvedValueOnce(existingSupplier);
      DatabaseUtils.executeUpdate.mockResolvedValue();

      const response = await suppliersRouter.handle(request, env);

      expect(response.status).toBe(200);
      expect(DatabaseUtils.executeUpdate).toHaveBeenCalledWith(
        env.DB,
        expect.stringContaining('UPDATE suppliers SET'),
        expect.arrayContaining([
          JSON.stringify(updateData.specialties),
          JSON.stringify(updateData.businessHours)
        ])
      );
    });
  });

  describe('Negative Test Cases', () => {
    it('should fail with invalid supplier ID', async () => {
      const request = RequestFactory.createAuthenticatedRequest('PUT', '/api/suppliers/invalid', 'admin_token', {
        body: { name: 'Updated Name' }
      });
      request.params = { id: 'invalid' };

      const { requireAdmin } = await import('../../src/middleware/auth.js');
      requireAdmin.mockResolvedValue({ user: { id: 'admin_id', isAdmin: true } });

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid supplier ID');
      expect(responseData.code).toBe('INVALID_ID');
    });

    it('should fail when supplier not found', async () => {
      const request = RequestFactory.createAuthenticatedRequest('PUT', '/api/suppliers/999', 'admin_token', {
        body: { name: 'Updated Name' }
      });
      request.params = { id: '999' };

      const { requireAdmin } = await import('../../src/middleware/auth.js');
      const { SupplierQueries } = await import('../../src/utils/database.js');
      
      requireAdmin.mockResolvedValue({ user: { id: 'admin_id', isAdmin: true } });
      SupplierQueries.findById.mockResolvedValue(null);

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Supplier not found');
      expect(responseData.code).toBe('SUPPLIER_NOT_FOUND');
    });

    it('should fail with no updates provided', async () => {
      const existingSupplier = SupplierFactory.create({ id: 123 });
      const request = RequestFactory.createAuthenticatedRequest('PUT', '/api/suppliers/123', 'admin_token', {
        body: {} // No updates
      });
      request.params = { id: '123' };

      const { requireAdmin } = await import('../../src/middleware/auth.js');
      const { SupplierQueries } = await import('../../src/utils/database.js');
      
      requireAdmin.mockResolvedValue({ user: { id: 'admin_id', isAdmin: true } });
      SupplierQueries.findById.mockResolvedValue(existingSupplier);

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('No updates provided');
      expect(responseData.code).toBe('NO_UPDATES');
    });
  });
});

describe('Suppliers Router - DELETE /:id', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should soft delete supplier with admin auth', async () => {
      const existingSupplier = SupplierFactory.create({ id: 123 });
      const request = RequestFactory.createAuthenticatedRequest('DELETE', '/api/suppliers/123', 'admin_token');
      request.params = { id: '123' };

      const { requireAdmin } = await import('../../src/middleware/auth.js');
      const { SupplierQueries, DatabaseUtils } = await import('../../src/utils/database.js');
      
      requireAdmin.mockResolvedValue({ user: { id: 'admin_id', isAdmin: true } });
      SupplierQueries.findById.mockResolvedValue(existingSupplier);
      DatabaseUtils.executeUpdate.mockResolvedValue();

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Supplier deactivated successfully');
      
      expect(DatabaseUtils.executeUpdate).toHaveBeenCalledWith(
        env.DB,
        'UPDATE suppliers SET is_active = 0, updated_at = ? WHERE id = ?',
        ['2023-01-01 00:00:00', 123]
      );
    });
  });

  describe('Negative Test Cases', () => {
    it('should fail without admin authentication', async () => {
      const request = RequestFactory.create('DELETE', '/api/suppliers/123');
      request.params = { id: '123' };

      const { requireAdmin } = await import('../../src/middleware/auth.js');
      requireAdmin.mockResolvedValue(new Response('Forbidden', { status: 403 }));

      const response = await suppliersRouter.handle(request, env);

      expect(response.status).toBe(403);
    });

    it('should fail with invalid supplier ID', async () => {
      const request = RequestFactory.createAuthenticatedRequest('DELETE', '/api/suppliers/invalid', 'admin_token');
      request.params = { id: 'invalid' };

      const { requireAdmin } = await import('../../src/middleware/auth.js');
      requireAdmin.mockResolvedValue({ user: { id: 'admin_id', isAdmin: true } });

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid supplier ID');
      expect(responseData.code).toBe('INVALID_ID');
    });
  });
});

describe('Suppliers Router - GET /categories', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  it('should return all active categories', async () => {
    const mockCategories = [
      { id: 1, name: 'Veterinary', slug: 'veterinary' },
      { id: 2, name: 'Grooming', slug: 'grooming' },
      { id: 3, name: 'Boarding', slug: 'boarding' }
    ];
    
    const request = RequestFactory.create('GET', '/api/suppliers/categories');

    const { DatabaseUtils } = await import('../../src/utils/database.js');
    DatabaseUtils.executeQuery.mockResolvedValue(mockCategories);

    const response = await suppliersRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.categories).toHaveLength(3);
    expect(DatabaseUtils.executeQuery).toHaveBeenCalledWith(
      env.DB,
      'SELECT * FROM supplier_categories WHERE is_active = 1 ORDER BY name',
      []
    );
  });

  it('should handle database errors', async () => {
    const request = RequestFactory.create('GET', '/api/suppliers/categories');

    const { DatabaseUtils } = await import('../../src/utils/database.js');
    DatabaseUtils.executeQuery.mockRejectedValue(new Error('Database error'));

    const response = await suppliersRouter.handle(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData.error).toBe('Failed to get categories');
    expect(responseData.code).toBe('GET_CATEGORIES_ERROR');
  });
});

describe('Suppliers Router - GET /nearby', () => {
  let env;

  beforeEach(() => {
    env = TestEnvironmentFactory.create();
    vi.clearAllMocks();
  });

  describe('Positive Test Cases', () => {
    it('should return nearby suppliers', async () => {
      const nearbySuppliers = [SupplierFactory.create(), SupplierFactory.create()];
      const request = RequestFactory.create('GET', '/api/suppliers/nearby?latitude=40.7128&longitude=-74.0060&radius=5');

      const { SupplierQueries } = await import('../../src/utils/database.js');
      SupplierQueries.search.mockResolvedValue(nearbySuppliers);

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.suppliers).toHaveLength(2);
      
      expect(SupplierQueries.search).toHaveBeenCalledWith(env.DB, {
        latitude: 40.7128,
        longitude: -74.0060,
        radius: 5,
        limit: 10,
        page: 1
      });
    });

    it('should use default radius when not provided', async () => {
      const request = RequestFactory.create('GET', '/api/suppliers/nearby?latitude=40.7128&longitude=-74.0060');

      const { SupplierQueries } = await import('../../src/utils/database.js');
      SupplierQueries.search.mockResolvedValue([]);

      await suppliersRouter.handle(request, env);

      expect(SupplierQueries.search).toHaveBeenCalledWith(env.DB, expect.objectContaining({
        radius: 10 // Default radius
      }));
    });
  });

  describe('Negative Test Cases', () => {
    it('should fail with missing coordinates', async () => {
      const request = RequestFactory.create('GET', '/api/suppliers/nearby');

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Latitude and longitude are required');
      expect(responseData.code).toBe('MISSING_COORDINATES');
    });

    it('should fail with invalid coordinates', async () => {
      const request = RequestFactory.create('GET', '/api/suppliers/nearby?latitude=91&longitude=181');

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid coordinates');
      expect(responseData.code).toBe('INVALID_COORDINATES');
    });

    it('should handle database errors', async () => {
      const request = RequestFactory.create('GET', '/api/suppliers/nearby?latitude=40.7128&longitude=-74.0060');

      const { SupplierQueries } = await import('../../src/utils/database.js');
      SupplierQueries.search.mockRejectedValue(new Error('Database error'));

      const response = await suppliersRouter.handle(request, env);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to get nearby suppliers');
      expect(responseData.code).toBe('NEARBY_SUPPLIERS_ERROR');
    });
  });
});