/**
 * Test fixtures and factories for generating test data
 */
import { faker } from '@faker-js/faker';

/**
 * User data factory
 */
export class UserFactory {
  static create(overrides = {}) {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phoneNumber: faker.phone.number(),
      pawsBalance: faker.number.int({ min: 0, max: 10000 }),
      locationLatitude: faker.location.latitude(),
      locationLongitude: faker.location.longitude(),
      locationAddress: faker.location.streetAddress(),
      isActive: true,
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createRegistrationData(overrides = {}) {
    return {
      email: faker.internet.email(),
      password: 'SecurePassword123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phoneNumber: faker.phone.number(),
      ...overrides
    };
  }

  static createLoginData(overrides = {}) {
    return {
      email: faker.internet.email(),
      password: 'SecurePassword123!',
      ...overrides
    };
  }
}

/**
 * Supplier data factory
 */
export class SupplierFactory {
  static create(overrides = {}) {
    const categories = ['veterinary', 'grooming', 'boarding', 'training', 'food', 'toys', 'accessories'];
    
    return {
      id: faker.string.uuid(),
      name: faker.company.name(),
      description: faker.lorem.paragraph(),
      category: faker.helpers.arrayElement(categories),
      email: faker.internet.email(),
      phoneNumber: faker.phone.number(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      website: faker.internet.url(),
      rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
      reviewCount: faker.number.int({ min: 0, max: 500 }),
      isActive: true,
      isVerified: faker.datatype.boolean(),
      pawsRewardRate: faker.number.float({ min: 0.01, max: 0.1, fractionDigits: 2 }),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }
}

/**
 * Order data factory
 */
export class OrderFactory {
  static create(overrides = {}) {
    const statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      supplierId: faker.string.uuid(),
      serviceType: faker.lorem.word(),
      description: faker.lorem.sentence(),
      amount: faker.number.float({ min: 10, max: 500, fractionDigits: 2 }),
      pawsEarned: faker.number.int({ min: 1, max: 50 }),
      status: faker.helpers.arrayElement(statuses),
      scheduledDate: faker.date.future(),
      completedAt: null,
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }
}

/**
 * Review data factory
 */
export class ReviewFactory {
  static create(overrides = {}) {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      supplierId: faker.string.uuid(),
      orderId: faker.string.uuid(),
      rating: faker.number.int({ min: 1, max: 5 }),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      helpfulCount: faker.number.int({ min: 0, max: 100 }),
      isVerified: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }
}

/**
 * Transaction data factory
 */
export class TransactionFactory {
  static create(overrides = {}) {
    const types = ['earned', 'spent', 'transferred', 'bonus', 'refund'];
    const referenceTypes = ['order', 'review', 'bonus', 'transfer', 'refund'];
    
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      type: faker.helpers.arrayElement(types),
      amount: faker.number.int({ min: 1, max: 1000 }),
      description: faker.lorem.sentence(),
      referenceType: faker.helpers.arrayElement(referenceTypes),
      referenceId: faker.string.uuid(),
      balanceAfter: faker.number.int({ min: 0, max: 10000 }),
      createdAt: faker.date.recent(),
      ...overrides
    };
  }
}

/**
 * Notification data factory
 */
export class NotificationFactory {
  static create(overrides = {}) {
    const types = ['order_update', 'paws_earned', 'review_request', 'system_announcement'];
    
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      type: faker.helpers.arrayElement(types),
      title: faker.lorem.sentence(),
      message: faker.lorem.paragraph(),
      isRead: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
      ...overrides
    };
  }
}

/**
 * Database mock utilities
 */
export class DatabaseMock {
  constructor() {
    this.data = {
      users: [],
      suppliers: [],
      orders: [],
      reviews: [],
      transactions: [],
      notifications: [],
      sessions: []
    };
  }

  // Mock D1 database prepare method
  prepare(query) {
    return {
      bind: (...params) => {
        return {
          first: async () => {
            // Mock implementation - return first matching record
            return this.mockQueryResult(query, params)[0] || null;
          },
          all: async () => {
            // Mock implementation - return all matching records
            return {
              results: this.mockQueryResult(query, params),
              success: true
            };
          },
          run: async () => {
            // Mock implementation - simulate insert/update/delete
            return {
              success: true,
              meta: {
                changes: 1,
                last_row_id: faker.string.uuid()
              }
            };
          }
        };
      },
      first: async () => this.mockQueryResult(query)[0] || null,
      all: async () => ({
        results: this.mockQueryResult(query),
        success: true
      }),
      run: async () => ({
        success: true,
        meta: {
          changes: 1,
          last_row_id: faker.string.uuid()
        }
      })
    };
  }

  mockQueryResult(query, params = []) {
    // Simple query parsing for mocking
    if (query.includes('SELECT') && query.includes('users')) {
      return this.data.users;
    }
    if (query.includes('SELECT') && query.includes('suppliers')) {
      return this.data.suppliers;
    }
    if (query.includes('SELECT') && query.includes('orders')) {
      return this.data.orders;
    }
    if (query.includes('SELECT') && query.includes('reviews')) {
      return this.data.reviews;
    }
    if (query.includes('SELECT') && query.includes('transactions')) {
      return this.data.transactions;
    }
    if (query.includes('SELECT') && query.includes('notifications')) {
      return this.data.notifications;
    }
    return [];
  }

  // Helper methods to add test data
  addUser(user) {
    this.data.users.push(user);
    return user;
  }

  addSupplier(supplier) {
    this.data.suppliers.push(supplier);
    return supplier;
  }

  addOrder(order) {
    this.data.orders.push(order);
    return order;
  }

  addReview(review) {
    this.data.reviews.push(review);
    return review;
  }

  addTransaction(transaction) {
    this.data.transactions.push(transaction);
    return transaction;
  }

  addNotification(notification) {
    this.data.notifications.push(notification);
    return notification;
  }

  reset() {
    this.data = {
      users: [],
      suppliers: [],
      orders: [],
      reviews: [],
      transactions: [],
      notifications: [],
      sessions: []
    };
  }
}

/**
 * Test environment factory
 */
export class TestEnvironmentFactory {
  static create(overrides = {}) {
    return {
      DB: new DatabaseMock(),
      JWT_SECRET: 'test-jwt-secret-key-for-testing-purposes-only',
      API_VERSION: 'v1',
      ENVIRONMENT: 'test',
      RATE_LIMIT_REQUESTS: 100,
      RATE_LIMIT_WINDOW: 60000,
      ...overrides
    };
  }
}

/**
 * HTTP request factory for testing
 */
export class RequestFactory {
  static create(method, url, options = {}) {
    const { body, headers = {}, ...requestOptions } = options;
    
    // Convert relative URLs to absolute URLs for testing
    const baseUrl = 'http://localhost:8787';
    const absoluteUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    
    const requestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      ...requestOptions
    };

    // Add body only for methods that support it
    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      requestInit.body = JSON.stringify(body);
    }

    const request = new Request(absoluteUrl, requestInit);
    
    // Add request ID for tracking
    request.id = faker.string.uuid();
    
    return request;
  }

  static createAuthenticatedRequest(method, url, token, options = {}) {
    return this.create(method, url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
  }
}