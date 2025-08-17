import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CryptoUtils } from '../../src/utils/crypto.js';
import { ValidationUtils, userRegistrationSchema } from '../../src/utils/validation.js';

describe('Authentication Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CryptoUtils', () => {
    it('should hash and verify passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await CryptoUtils.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      
      const isValid = await CryptoUtils.verifyPassword(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await CryptoUtils.verifyPassword('wrongpassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should generate and verify JWT tokens', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const secret = 'test-secret';
      
      const token = CryptoUtils.generateJWT(payload, secret);
      expect(token).toBeDefined();
      
      const decoded = CryptoUtils.verifyJWT(token, secret);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should generate unique order numbers', () => {
      const orderNumber1 = CryptoUtils.generateOrderNumber();
      const orderNumber2 = CryptoUtils.generateOrderNumber();
      
      expect(orderNumber1).toBeDefined();
      expect(orderNumber2).toBeDefined();
      expect(orderNumber1).not.toBe(orderNumber2);
      expect(orderNumber1).toMatch(/^RWG-/);
    });
  });

  describe('Validation', () => {
    it('should validate user registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      const result = ValidationUtils.validateRequest(userRegistrationSchema, validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid email formats', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      expect(() => {
        ValidationUtils.validateRequest(userRegistrationSchema, invalidData);
      }).toThrow();
    });

    it('should reject weak passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123', // Too weak
        firstName: 'John',
        lastName: 'Doe'
      };
      
      expect(() => {
        ValidationUtils.validateRequest(userRegistrationSchema, invalidData);
      }).toThrow();
    });

    it('should sanitize input strings', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello';
      const sanitized = ValidationUtils.sanitizeInput(maliciousInput);
      
      expect(sanitized).toBe('Hello');
      expect(sanitized).not.toContain('<script>');
    });

    it('should validate coordinates correctly', () => {
      expect(ValidationUtils.validateCoordinates(40.7128, -74.0060)).toBe(true); // NYC
      expect(ValidationUtils.validateCoordinates(91, 0)).toBe(false); // Invalid latitude
      expect(ValidationUtils.validateCoordinates(0, 181)).toBe(false); // Invalid longitude
    });

    it('should calculate distance between coordinates', () => {
      // Distance between NYC and LA (approximately 3944 km)
      const distance = ValidationUtils.calculateDistance(
        40.7128, -74.0060, // NYC
        34.0522, -118.2437  // LA
      );
      
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });
  });
});