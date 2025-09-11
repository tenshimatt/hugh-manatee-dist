/**
 * T023: Contract Test - GET /api/v1/templates
 * 
 * CRITICAL TDD REQUIREMENT: This test MUST FAIL initially
 */

import request from 'supertest';
import { jest } from '@jest/globals';

describe('GET /api/v1/templates - Contract Test', () => {
  let app: any;

  beforeAll(() => {
    try {
      app = require('../../src/app');
    } catch (error) {
      console.error('Expected failure - app not implemented yet:', error.message);
      app = null;
    }
  });

  describe('Templates Contract', () => {
    it('should return available templates', async () => {
      if (!app) {
        throw new Error('API not implemented - Express app missing (Expected TDD failure)');
      }

      const response = await request(app)
        .get('/api/v1/templates')
        .expect(200);

      expect(response.body).toMatchObject({
        templates: expect.any(Array),
        categories: expect.any(Array),
        totalTemplates: expect.any(Number)
      });

      if (response.body.templates.length > 0) {
        expect(response.body.templates[0]).toMatchObject({
          id: expect.stringMatching(/^[0-9a-f-]{36}$/),
          name: expect.any(String),
          description: expect.any(String),
          category: expect.any(String),
          structure: expect.any(Object),
          usageCount: expect.any(Number)
        });
      }
    });

    it('should require authentication', async () => {
      if (!app) {
        throw new Error('API not implemented - Express app missing (Expected TDD failure)');
      }

      await request(app)
        .get('/api/v1/templates')
        .expect(401);
    });

    it('should support category filtering', async () => {
      if (!app) {
        throw new Error('API not implemented - Express app missing (Expected TDD failure)');
      }

      const response = await request(app)
        .get('/api/v1/templates')
        .query({ category: 'technical' })
        .expect(200);

      if (response.body.templates.length > 0) {
        response.body.templates.forEach((template: any) => {
          expect(template.category).toBe('technical');
        });
      }
    });
  });
});