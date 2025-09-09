/**
 * Course API Integration Tests
 * Following TDD_DOCUMENTATION.md specifications for API endpoint testing
 */

const request = require('supertest');
const { Pool } = require('pg');
const { createClient } = require('redis');
const { TestFixtures } = require('../fixtures/testFixtures');
const { EducationalPlatformTestData } = require('../fixtures/TestDataFactory');

// Test containers setup for real database testing
const { PostgreSqlContainer } = require('@testcontainers/postgresql');

describe('Course API Integration Tests', () => {
  let app;
  let container;
  let pool;
  let redisClient;
  let testFixtures;
  let authToken;

  // Setup test environment with real database
  beforeAll(async () => {
    // Start PostgreSQL test container
    container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('rawgle_test')
      .withUsername('testuser')
      .withPassword('testpass')
      .withExposedPorts(5432)
      .start();

    // Create database connection
    pool = new Pool({
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: 'rawgle_test',
      user: 'testuser',
      password: 'testpass'
    });

    // Create Redis client (using real Redis for integration tests)
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    await redisClient.connect();

    // Initialize test fixtures
    testFixtures = new TestFixtures(pool);

    // Create test app (would normally import from src/app.ts)
    app = createTestApp(pool, redisClient);

    // Set up database schema
    await setupTestSchema(pool);

    // Seed test data
    await testFixtures.seedAllTestData();

    // Get authentication token for protected endpoints
    authToken = await getAuthToken();
  }, 60000);

  afterAll(async () => {
    if (pool) await pool.end();
    if (redisClient) await redisClient.quit();
    if (container) await container.stop();
  }, 30000);

  beforeEach(async () => {
    // Clear Redis cache between tests
    await redisClient.flushAll();
  });

  describe('GET /api/v1/courses', () => {
    it('should return list of available courses', async () => {
      const response = await request(app)
        .get('/api/v1/courses')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          courses: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              title: expect.any(String),
              description: expect.any(String),
              difficulty: expect.stringMatching(/^(beginner|intermediate|advanced)$/),
              estimatedHours: expect.any(Number),
              instructor: expect.any(String),
              isActive: expect.any(Boolean)
            })
          ]),
          total: expect.any(Number),
          page: expect.any(Number),
          limit: expect.any(Number)
        }
      });
    });

    it('should filter courses by difficulty level', async () => {
      const response = await request(app)
        .get('/api/v1/courses?difficulty=beginner')
        .expect(200);

      expect(response.body.data.courses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            difficulty: 'beginner'
          })
        ])
      );

      // Ensure no advanced courses are returned
      const advancedCourses = response.body.data.courses.filter(
        course => course.difficulty === 'advanced'
      );
      expect(advancedCourses).toHaveLength(0);
    });

    it('should filter courses by category', async () => {
      const response = await request(app)
        .get('/api/v1/courses?category=nutrition')
        .expect(200);

      response.body.data.courses.forEach(course => {
        expect(course.category).toBe('nutrition');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/courses?page=1&limit=2')
        .expect(200);

      expect(response.body.data.courses).toHaveLength(2);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(2);
    });

    it('should search courses by title', async () => {
      const response = await request(app)
        .get('/api/v1/courses?search=raw feeding')
        .expect(200);

      response.body.data.courses.forEach(course => {
        expect(course.title.toLowerCase()).toMatch(/raw|feeding/);
      });
    });
  });

  describe('GET /api/v1/courses/:courseId', () => {
    it('should return detailed course information', async () => {
      const courseId = 'raw-feeding-101';
      
      const response = await request(app)
        .get(`/api/v1/courses/${courseId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          course: {
            id: courseId,
            title: expect.any(String),
            description: expect.any(String),
            modules: expect.any(Number),
            difficulty: expect.any(String),
            estimatedHours: expect.any(Number),
            instructor: expect.any(String),
            rating: expect.any(Number),
            enrollmentCount: expect.any(Number),
            prerequisites: expect.any(Array),
            syllabus: expect.arrayContaining([
              expect.objectContaining({
                moduleNumber: expect.any(Number),
                title: expect.any(String),
                lessons: expect.any(Array)
              })
            ])
          }
        }
      });
    });

    it('should return 404 for non-existent course', async () => {
      const response = await request(app)
        .get('/api/v1/courses/non-existent-course')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'COURSE_NOT_FOUND',
          message: expect.stringContaining('not found')
        }
      });
    });

    it('should include user enrollment status when authenticated', async () => {
      const courseId = 'raw-feeding-101';
      
      const response = await request(app)
        .get(`/api/v1/courses/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.course).toHaveProperty('userEnrollment');
    });
  });

  describe('POST /api/v1/courses/:courseId/enroll', () => {
    it('should enroll user in course successfully', async () => {
      const courseId = 'raw-feeding-101';
      
      const response = await request(app)
        .post(`/api/v1/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('enrolled'),
        data: {
          enrollment: {
            userId: expect.any(String),
            courseId: courseId,
            status: 'active',
            progress: 0,
            enrolledAt: expect.any(String),
            estimatedCompletionDate: expect.any(String)
          }
        }
      });

      // Verify enrollment was persisted
      const checkResponse = await request(app)
        .get(`/api/v1/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(checkResponse.body.data.enrollment.status).toBe('active');
    });

    it('should prevent duplicate enrollment', async () => {
      const courseId = 'raw-feeding-101';
      
      // First enrollment should succeed
      await request(app)
        .post(`/api/v1/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Second enrollment should fail
      const response = await request(app)
        .post(`/api/v1/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'ALREADY_ENROLLED',
          message: expect.stringContaining('already enrolled')
        }
      });
    });

    it('should check prerequisites before enrollment', async () => {
      const courseId = 'advanced-nutrition'; // Has prerequisites
      
      const response = await request(app)
        .post(`/api/v1/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'PREREQUISITES_NOT_MET',
          message: expect.stringContaining('prerequisites'),
          details: {
            missingPrerequisites: expect.any(Array)
          }
        }
      });
    });

    it('should require authentication', async () => {
      const courseId = 'raw-feeding-101';
      
      const response = await request(app)
        .post(`/api/v1/courses/${courseId}/enroll`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: expect.stringContaining('authentication')
        }
      });
    });
  });

  describe('GET /api/v1/courses/:courseId/progress', () => {
    beforeEach(async () => {
      // Enroll user in course for progress tests
      await request(app)
        .post('/api/v1/courses/raw-feeding-101/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
    });

    it('should return user progress for enrolled course', async () => {
      const courseId = 'raw-feeding-101';
      
      const response = await request(app)
        .get(`/api/v1/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          enrollment: {
            courseId: courseId,
            progress: expect.any(Number),
            status: 'active',
            completedModules: expect.any(Array),
            currentModule: expect.any(Number),
            totalTimeSpent: expect.any(Number),
            lastAccessedAt: expect.any(String)
          },
          moduleProgress: expect.any(Array)
        }
      });
    });

    it('should return 404 for non-enrolled course', async () => {
      const courseId = 'advanced-nutrition';
      
      const response = await request(app)
        .get(`/api/v1/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'ENROLLMENT_NOT_FOUND'
        }
      });
    });

    it('should cache progress data for performance', async () => {
      const courseId = 'raw-feeding-101';
      
      // First request should hit database
      const response1 = await request(app)
        .get(`/api/v1/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Second request should be served from cache (faster)
      const startTime = Date.now();
      const response2 = await request(app)
        .get(`/api/v1/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const responseTime = Date.now() - startTime;

      // Cache should make this very fast (< 50ms)
      expect(responseTime).toBeLessThan(50);
      expect(response2.body).toEqual(response1.body);
    });
  });

  describe('PUT /api/v1/courses/:courseId/progress', () => {
    beforeEach(async () => {
      // Enroll user in course for progress tests
      await request(app)
        .post('/api/v1/courses/raw-feeding-101/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
    });

    it('should update course progress successfully', async () => {
      const courseId = 'raw-feeding-101';
      const progressData = {
        moduleId: 'module-1',
        lessonId: 'lesson-3',
        percentComplete: 45,
        timeSpent: 30
      };
      
      const response = await request(app)
        .put(`/api/v1/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(progressData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('updated'),
        data: {
          progress: {
            courseId: courseId,
            progress: 45,
            currentModule: expect.any(Number),
            totalTimeSpent: expect.any(Number),
            lastAccessedAt: expect.any(String)
          }
        }
      });

      // Verify progress was persisted
      const checkResponse = await request(app)
        .get(`/api/v1/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(checkResponse.body.data.enrollment.progress).toBe(45);
    });

    it('should validate progress data', async () => {
      const courseId = 'raw-feeding-101';
      const invalidProgressData = {
        moduleId: 'module-1',
        lessonId: 'lesson-1',
        percentComplete: 150 // Invalid - over 100%
      };
      
      const response = await request(app)
        .put(`/api/v1/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProgressData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('percentage')
        }
      });
    });

    it('should prevent progress regression', async () => {
      const courseId = 'raw-feeding-101';
      
      // Set initial progress to 60%
      await request(app)
        .put(`/api/v1/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          moduleId: 'module-2',
          lessonId: 'lesson-5',
          percentComplete: 60,
          timeSpent: 45
        });

      // Attempt to set lower progress (30%)
      const response = await request(app)
        .put(`/api/v1/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          moduleId: 'module-1',
          lessonId: 'lesson-3',
          percentComplete: 30,
          timeSpent: 20
        })
        .expect(200);

      // Progress should remain at 60%
      expect(response.body.data.progress.progress).toBe(60);
    });

    it('should automatically mark modules as completed', async () => {
      const courseId = 'raw-feeding-101';
      const completionData = {
        moduleId: 'module-1',
        lessonId: 'lesson-final',
        percentComplete: 100,
        timeSpent: 60
      };
      
      const response = await request(app)
        .put(`/api/v1/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(completionData)
        .expect(200);

      expect(response.body.data.progress.completedModules).toContain('module-1');
    });
  });

  describe('POST /api/v1/courses/:courseId/certificate', () => {
    beforeEach(async () => {
      // Enroll and complete course for certificate tests
      await request(app)
        .post('/api/v1/courses/raw-feeding-101/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // Complete the course
      await request(app)
        .put('/api/v1/courses/raw-feeding-101/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          moduleId: 'final-module',
          lessonId: 'final-lesson',
          percentComplete: 100,
          timeSpent: 120
        });
    });

    it('should generate certificate for completed course', async () => {
      const courseId = 'raw-feeding-101';
      
      const response = await request(app)
        .post(`/api/v1/courses/${courseId}/certificate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('certificate generated'),
        data: {
          certificate: {
            id: expect.any(String),
            courseId: courseId,
            courseName: expect.any(String),
            userName: expect.any(String),
            completionDate: expect.any(String),
            certificateUrl: expect.stringContaining('cdn.rawgle.com/certificates'),
            verificationCode: expect.any(String),
            issuedBy: expect.any(String)
          }
        }
      });

      // Verify certificate URL is accessible
      expect(response.body.data.certificate.certificateUrl).toMatch(/^https:\/\/cdn\.rawgle\.com\/certificates\/.+\.pdf$/);
    });

    it('should reject certificate generation for incomplete course', async () => {
      // Enroll in new course but don't complete it
      await request(app)
        .post('/api/v1/courses/advanced-nutrition/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      const response = await request(app)
        .post('/api/v1/courses/advanced-nutrition/certificate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'COURSE_NOT_COMPLETE',
          message: expect.stringContaining('100% complete')
        }
      });
    });

    it('should prevent duplicate certificate generation', async () => {
      const courseId = 'raw-feeding-101';
      
      // Generate first certificate
      await request(app)
        .post(`/api/v1/courses/${courseId}/certificate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Attempt to generate second certificate
      const response = await request(app)
        .post(`/api/v1/courses/${courseId}/certificate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'CERTIFICATE_EXISTS',
          message: expect.stringContaining('already generated')
        }
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should respond to course list within 200ms', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/courses')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(200);
    });

    it('should handle concurrent enrollments', async () => {
      const courseId = 'raw-feeding-101';
      const enrollmentPromises = [];
      
      // Create 50 concurrent enrollment requests (different users)
      for (let i = 0; i < 50; i++) {
        const userToken = await createUserAndGetToken(`concurrent-user-${i}@test.com`);
        enrollmentPromises.push(
          request(app)
            .post(`/api/v1/courses/${courseId}/enroll`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({})
        );
      }
      
      const startTime = Date.now();
      const responses = await Promise.all(enrollmentPromises);
      const totalTime = Date.now() - startTime;
      
      // All enrollments should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
      
      // Total time should be reasonable (< 5 seconds for 50 concurrent requests)
      expect(totalTime).toBeLessThan(5000);
    });

    it('should cache frequently accessed course data', async () => {
      const courseId = 'raw-feeding-101';
      
      // First request (cold cache)
      const startTime1 = Date.now();
      await request(app)
        .get(`/api/v1/courses/${courseId}`)
        .expect(200);
      const firstResponseTime = Date.now() - startTime1;

      // Second request (warm cache)
      const startTime2 = Date.now();
      await request(app)
        .get(`/api/v1/courses/${courseId}`)
        .expect(200);
      const secondResponseTime = Date.now() - startTime2;

      // Cached response should be significantly faster
      expect(secondResponseTime).toBeLessThan(firstResponseTime * 0.5);
    });
  });

  // Helper functions
  async function getAuthToken() {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'john@example.com',
        password: 'password123'
      });
    
    return response.body.data.accessToken;
  }

  async function createUserAndGetToken(email) {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: email,
        password: 'TestPass123!',
        accountType: 'user'
      });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: email,
        password: 'TestPass123!'
      });
    
    return response.body.data.accessToken;
  }
});

// Mock Express app for testing (would normally import from src/app.ts)
function createTestApp(pool, redisClient) {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  // Mock course routes
  app.get('/api/v1/courses', (req, res) => {
    const courses = EducationalPlatformTestData.generateCourses();
    res.json({
      success: true,
      data: {
        courses: courses.slice(0, req.query.limit || 10),
        total: courses.length,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      }
    });
  });

  app.get('/api/v1/courses/:courseId', (req, res) => {
    const courses = EducationalPlatformTestData.generateCourses();
    const course = courses.find(c => c.id === req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: { code: 'COURSE_NOT_FOUND', message: 'Course not found' }
      });
    }
    
    res.json({
      success: true,
      data: { course }
    });
  });

  // Add other mock routes as needed...
  
  return app;
}

async function setupTestSchema(pool) {
  // Create test database schema
  await pool.query(`
    CREATE TABLE IF NOT EXISTS course_enrollments (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      course_id VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      progress DECIMAL(5,2) NOT NULL DEFAULT 0,
      enrolled_at TIMESTAMP NOT NULL DEFAULT NOW(),
      estimated_completion_date TIMESTAMP,
      last_accessed_at TIMESTAMP,
      completed_modules JSONB DEFAULT '[]',
      total_time_spent INTEGER DEFAULT 0,
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      course_id VARCHAR(255) NOT NULL,
      course_name VARCHAR(255) NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      completion_date TIMESTAMP NOT NULL,
      certificate_url VARCHAR(500) NOT NULL,
      verification_code VARCHAR(50) NOT NULL,
      issued_by VARCHAR(255) NOT NULL,
      UNIQUE(user_id, course_id)
    );
  `);
}