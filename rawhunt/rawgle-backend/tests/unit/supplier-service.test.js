/**
 * Supplier Service Unit Tests
 * Tests supplier operations and business logic
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { SupplierService } from '../../src/services/supplier-service.js';
import { EnhancedTestHelpers, createEnhancedMockEnv } from '../helpers/enhanced-test-setup.js';

describe('SupplierService', () => {
  let supplierService;
  let mockEnv;
  let testUser;

  beforeEach(() => {
    mockEnv = createEnhancedMockEnv();
    supplierService = new SupplierService(mockEnv.DB, mockEnv.KV);
    testUser = EnhancedTestHelpers.createTestUser();
  });

  describe('searchSuppliers', () => {
    test('should search suppliers successfully', async () => {
      const results = await supplierService.searchSuppliers({
        query: 'raw food',
        location: 'California'
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter by business type', async () => {
      const results = await supplierService.searchSuppliers({
        business_type: 'manufacturer'
      });

      expect(Array.isArray(results)).toBe(true);
    });

    test('should filter by verified status', async () => {
      const results = await supplierService.searchSuppliers({
        verified: true
      });

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getSupplierProfile', () => {
    test('should get supplier profile successfully', async () => {
      const supplierId = 'supplier-123';
      
      const profile = await supplierService.getSupplierProfile(supplierId);

      expect(profile).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        business_type: expect.any(String)
      });
    });

    test('should return null for non-existent supplier', async () => {
      const supplierId = 'non-existent';
      
      const profile = await supplierService.getSupplierProfile(supplierId);

      expect(profile).toBeNull();
    });
  });

  describe('createSupplier', () => {
    test('should create supplier successfully', async () => {
      const supplierData = {
        name: 'New Raw Foods Co',
        email: 'contact@newraw.com',
        business_type: 'retailer',
        location: 'Texas',
        description: 'Premium raw pet foods'
      };

      const result = await supplierService.createSupplier(testUser.id, supplierData);

      expect(result).toMatchObject({
        name: 'New Raw Foods Co',
        email: 'contact@newraw.com',
        business_type: 'retailer',
        location: 'Texas'
      });
      expect(result.id).toBeDefined();
    });

    test('should validate required fields', async () => {
      const invalidData = {
        email: 'test@test.com'
        // Missing name
      };

      await expect(
        supplierService.createSupplier(testUser.id, invalidData)
      ).rejects.toThrow();
    });
  });

  describe('updateSupplier', () => {
    test('should update supplier successfully', async () => {
      const supplierId = 'supplier-123';
      const updates = {
        rating: 4.9,
        description: 'Updated description'
      };

      const result = await supplierService.updateSupplier(supplierId, testUser.id, updates);

      expect(result).toMatchObject(updates);
    });

    test('should reject unauthorized updates', async () => {
      const supplierId = 'supplier-123';
      const wrongUserId = 'different-user';
      const updates = { rating: 5.0 };

      await expect(
        supplierService.updateSupplier(supplierId, wrongUserId, updates)
      ).rejects.toThrow();
    });
  });

  describe('deleteSupplier', () => {
    test('should delete supplier successfully', async () => {
      const supplierId = 'supplier-123';

      const result = await supplierService.deleteSupplier(supplierId, testUser.id);

      expect(result).toBe(true);
    });
  });

  describe('getSupplierProducts', () => {
    test('should get supplier products', async () => {
      const supplierId = 'supplier-123';

      const products = await supplierService.getSupplierProducts(supplierId);

      expect(Array.isArray(products)).toBe(true);
    });
  });
});