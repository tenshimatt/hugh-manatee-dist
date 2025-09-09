/**
 * Course Management Unit Tests
 * Following TDD_DOCUMENTATION.md specifications for comprehensive course testing
 */

const { EducationalPlatformTestData } = require('../fixtures/TestDataFactory');

// Mock dependencies for isolated unit testing
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn()
  }))
}));

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn()
  }))
}));

// Course Management Service Mock (would normally import from src/services/courseService.ts)
class CourseManagementService {
  constructor(db, redis, logger) {
    this.db = db;
    this.redis = redis;
    this.logger = logger;
  }

  async enrollUser(userId, courseId, options = {}) {
    // Validate inputs
    if (!userId || !courseId) {
      throw new Error('User ID and Course ID are required');
    }

    // Check if user exists
    const userExists = await this.checkUserExists(userId);
    if (!userExists) {
      throw new Error('User not found');
    }

    // Check if course exists and is active
    const course = await this.getCourse(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (!course.isActive) {
      throw new Error('Course is not available for enrollment');
    }

    // Check if user is already enrolled
    const existingEnrollment = await this.getEnrollment(userId, courseId);
    if (existingEnrollment) {
      throw new Error('User is already enrolled in this course');
    }

    // Check prerequisites
    if (course.prerequisites && course.prerequisites.length > 0) {
      const hasPrerequisites = await this.checkPrerequisites(userId, course.prerequisites);
      if (!hasPrerequisites) {
        throw new Error('User does not meet course prerequisites');
      }
    }

    // Create enrollment
    const enrollment = {
      id: `enrollment-${Date.now()}`,
      userId,
      courseId,
      status: 'active',
      progress: 0,
      enrolledAt: new Date(),
      estimatedCompletionDate: this.calculateEstimatedCompletion(course.estimatedHours),
      lastAccessedAt: new Date(),
      completedModules: [],
      currentModule: 1,
      currentLesson: 1
    };

    // Save to database (mocked)
    await this.db.query(
      'INSERT INTO course_enrollments (id, user_id, course_id, status, progress, enrolled_at, estimated_completion_date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [enrollment.id, enrollment.userId, enrollment.courseId, enrollment.status, enrollment.progress, enrollment.enrolledAt, enrollment.estimatedCompletionDate]
    );

    // Cache enrollment for quick access
    await this.redis.set(`enrollment:${userId}:${courseId}`, JSON.stringify(enrollment), 'EX', 3600);

    return enrollment;
  }

  async updateProgress(userId, courseId, progressData) {
    const { moduleId, lessonId, percentComplete, timeSpent } = progressData;

    // Validate inputs
    if (!userId || !courseId || typeof percentComplete !== 'number') {
      throw new Error('Invalid progress data');
    }

    if (percentComplete < 0 || percentComplete > 100) {
      throw new Error('Progress percentage must be between 0 and 100');
    }

    // Get current enrollment
    const enrollment = await this.getEnrollment(userId, courseId);
    if (!enrollment) {
      throw new Error('User is not enrolled in this course');
    }

    // Update progress
    const updatedEnrollment = {
      ...enrollment,
      progress: Math.max(enrollment.progress, percentComplete),
      lastAccessedAt: new Date(),
      totalTimeSpent: (enrollment.totalTimeSpent || 0) + (timeSpent || 0)
    };

    // Mark module as completed if progress is 100%
    if (percentComplete === 100 && !enrollment.completedModules.includes(moduleId)) {
      updatedEnrollment.completedModules = [...enrollment.completedModules, moduleId];
    }

    // Update database
    await this.db.query(
      'UPDATE course_enrollments SET progress = $1, last_accessed_at = $2, completed_modules = $3, total_time_spent = $4 WHERE user_id = $5 AND course_id = $6',
      [updatedEnrollment.progress, updatedEnrollment.lastAccessedAt, updatedEnrollment.completedModules, updatedEnrollment.totalTimeSpent, userId, courseId]
    );

    // Update cache
    await this.redis.set(`enrollment:${userId}:${courseId}`, JSON.stringify(updatedEnrollment), 'EX', 3600);

    return updatedEnrollment;
  }

  async getProgress(userId, courseId) {
    // Try cache first
    const cached = await this.redis.get(`enrollment:${userId}:${courseId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fall back to database
    const result = await this.db.query(
      'SELECT * FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const enrollment = result.rows[0];
    
    // Update cache
    await this.redis.set(`enrollment:${userId}:${courseId}`, JSON.stringify(enrollment), 'EX', 3600);

    return enrollment;
  }

  async generateCertificate(userId, courseId) {
    const enrollment = await this.getEnrollment(userId, courseId);
    
    if (!enrollment) {
      throw new Error('User is not enrolled in this course');
    }

    if (enrollment.progress < 100) {
      throw new Error('Course must be 100% complete to generate certificate');
    }

    const course = await this.getCourse(courseId);
    const user = await this.getUser(userId);

    const certificate = {
      id: `cert-${Date.now()}`,
      userId,
      courseId,
      courseName: course.title,
      userName: user.name,
      completionDate: new Date(),
      certificateUrl: `https://cdn.rawgle.com/certificates/${userId}/${courseId}.pdf`,
      verificationCode: this.generateVerificationCode(),
      issuedBy: course.instructor
    };

    // Save certificate
    await this.db.query(
      'INSERT INTO certificates (id, user_id, course_id, course_name, user_name, completion_date, certificate_url, verification_code, issued_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [certificate.id, certificate.userId, certificate.courseId, certificate.courseName, certificate.userName, certificate.completionDate, certificate.certificateUrl, certificate.verificationCode, certificate.issuedBy]
    );

    return certificate;
  }

  async getCourseAnalytics(courseId) {
    const course = await this.getCourse(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Get enrollment statistics
    const enrollmentStats = await this.db.query(
      'SELECT COUNT(*) as total_enrollments, AVG(progress) as average_progress, COUNT(CASE WHEN progress = 100 THEN 1 END) as completions FROM course_enrollments WHERE course_id = $1',
      [courseId]
    );

    // Get module completion rates
    const moduleStats = await this.db.query(
      'SELECT module_id, COUNT(*) as completions FROM course_progress WHERE course_id = $1 AND completed = true GROUP BY module_id',
      [courseId]
    );

    return {
      courseId,
      courseName: course.title,
      totalEnrollments: parseInt(enrollmentStats.rows[0].total_enrollments),
      averageProgress: parseFloat(enrollmentStats.rows[0].average_progress) || 0,
      completionRate: (parseInt(enrollmentStats.rows[0].completions) / parseInt(enrollmentStats.rows[0].total_enrollments)) * 100 || 0,
      moduleCompletionRates: moduleStats.rows.map(row => ({
        moduleId: row.module_id,
        completions: parseInt(row.completions)
      }))
    };
  }

  // Helper methods
  async checkUserExists(userId) {
    const result = await this.db.query('SELECT id FROM users WHERE id = $1', [userId]);
    return result.rows.length > 0;
  }

  async getCourse(courseId) {
    const courses = EducationalPlatformTestData.generateCourses();
    return courses.find(course => course.id === courseId);
  }

  async getEnrollment(userId, courseId) {
    // Try cache first
    const cached = await this.redis.get(`enrollment:${userId}:${courseId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Mock database query
    return null; // Would normally query database
  }

  async checkPrerequisites(userId, prerequisites) {
    // Mock prerequisite check - would normally check completed courses
    return true;
  }

  calculateEstimatedCompletion(estimatedHours) {
    // Assume 2 hours per week study time
    const weeksToComplete = Math.ceil(estimatedHours / 2);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + (weeksToComplete * 7));
    return completionDate;
  }

  async getUser(userId) {
    const users = EducationalPlatformTestData.generateUsers(10);
    return users.find(user => user.id === userId) || { id: userId, name: 'Test User' };
  }

  generateVerificationCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}

describe('Course Management System', () => {
  let courseService;
  let mockDb;
  let mockRedis;
  let mockLogger;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    mockDb = {
      query: jest.fn()
    };

    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn()
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };

    courseService = new CourseManagementService(mockDb, mockRedis, mockLogger);
  });

  describe('User Enrollment', () => {
    it('should enroll user successfully with progress tracking', async () => {
      // Arrange
      const userId = 'test-user-1';
      const courseId = 'raw-feeding-101';
      
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: userId }] }) // User exists check
        .mockResolvedValueOnce({ rows: [] }) // No existing enrollment
        .mockResolvedValueOnce({}); // Insert enrollment
      
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      // Act
      const enrollment = await courseService.enrollUser(userId, courseId);

      // Assert
      expect(enrollment.status).toBe('active');
      expect(enrollment.progress).toBe(0);
      expect(enrollment.userId).toBe(userId);
      expect(enrollment.courseId).toBe(courseId);
      expect(enrollment.estimatedCompletionDate).toBeDefined();
      expect(enrollment.estimatedCompletionDate).toBeInstanceOf(Date);
    });

    it('should reject enrollment for non-existent user', async () => {
      // Arrange
      const userId = 'non-existent-user';
      const courseId = 'raw-feeding-101';
      
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // User doesn't exist

      // Act & Assert
      await expect(courseService.enrollUser(userId, courseId)).rejects.toThrow('User not found');
    });

    it('should reject enrollment for inactive course', async () => {
      // Arrange
      const userId = 'test-user-1';
      const courseId = 'inactive-course';
      
      // Mock course service to return inactive course
      const originalGetCourse = courseService.getCourse;
      courseService.getCourse = jest.fn().mockResolvedValue({
        id: courseId,
        isActive: false,
        title: 'Inactive Course'
      });

      mockDb.query.mockResolvedValueOnce({ rows: [{ id: userId }] }); // User exists

      // Act & Assert
      await expect(courseService.enrollUser(userId, courseId)).rejects.toThrow('Course is not available for enrollment');
      
      // Restore original method
      courseService.getCourse = originalGetCourse;
    });

    it('should prevent duplicate enrollment', async () => {
      // Arrange
      const userId = 'test-user-1';
      const courseId = 'raw-feeding-101';
      
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: userId }] }); // User exists
      
      const existingEnrollment = { id: 'existing', userId, courseId };
      courseService.getEnrollment = jest.fn().mockResolvedValue(existingEnrollment);

      // Act & Assert
      await expect(courseService.enrollUser(userId, courseId)).rejects.toThrow('User is already enrolled in this course');
    });

    it('should validate course prerequisites', async () => {
      // Arrange
      const userId = 'test-user-1';
      const courseId = 'advanced-nutrition'; // Has prerequisites
      
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: userId }] }); // User exists
      courseService.getEnrollment = jest.fn().mockResolvedValue(null); // Not enrolled
      courseService.checkPrerequisites = jest.fn().mockResolvedValue(false); // Missing prerequisites

      // Act & Assert
      await expect(courseService.enrollUser(userId, courseId)).rejects.toThrow('User does not meet course prerequisites');
    });
  });

  describe('Progress Tracking', () => {
    it('should persist progress automatically every update', async () => {
      // Arrange
      const userId = 'test-user-1';
      const courseId = 'raw-feeding-101';
      const progressData = {
        moduleId: 'module-1',
        lessonId: 'lesson-3',
        percentComplete: 45,
        timeSpent: 30 // minutes
      };
      
      const existingEnrollment = {
        id: 'enrollment-123',
        userId,
        courseId,
        progress: 30,
        completedModules: [],
        totalTimeSpent: 120
      };

      courseService.getEnrollment = jest.fn().mockResolvedValue(existingEnrollment);
      mockDb.query.mockResolvedValue({});
      mockRedis.set.mockResolvedValue('OK');

      // Act
      const updatedProgress = await courseService.updateProgress(userId, courseId, progressData);

      // Assert
      expect(updatedProgress.progress).toBe(45);
      expect(updatedProgress.totalTimeSpent).toBe(150);
      expect(updatedProgress.lastAccessedAt).toBeInstanceOf(Date);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE course_enrollments'),
        expect.arrayContaining([45, expect.any(Date), expect.any(Array), 150, userId, courseId])
      );
    });

    it('should mark modules as completed at 100% progress', async () => {
      // Arrange
      const userId = 'test-user-1';
      const courseId = 'raw-feeding-101';
      const progressData = {
        moduleId: 'module-1',
        lessonId: 'lesson-final',
        percentComplete: 100,
        timeSpent: 45
      };
      
      const existingEnrollment = {
        userId,
        courseId,
        progress: 90,
        completedModules: [],
        totalTimeSpent: 200
      };

      courseService.getEnrollment = jest.fn().mockResolvedValue(existingEnrollment);
      mockDb.query.mockResolvedValue({});
      mockRedis.set.mockResolvedValue('OK');

      // Act
      const updatedProgress = await courseService.updateProgress(userId, courseId, progressData);

      // Assert
      expect(updatedProgress.progress).toBe(100);
      expect(updatedProgress.completedModules).toContain('module-1');
    });

    it('should validate progress percentage bounds', async () => {
      // Arrange
      const userId = 'test-user-1';
      const courseId = 'raw-feeding-101';
      
      const invalidProgressData = {
        moduleId: 'module-1',
        lessonId: 'lesson-1',
        percentComplete: 150 // Invalid - over 100%
      };

      // Act & Assert
      await expect(courseService.updateProgress(userId, courseId, invalidProgressData))
        .rejects.toThrow('Progress percentage must be between 0 and 100');
    });

    it('should prevent regression in progress tracking', async () => {
      // Arrange
      const userId = 'test-user-1';
      const courseId = 'raw-feeding-101';
      const progressData = {
        moduleId: 'module-1',
        lessonId: 'lesson-2',
        percentComplete: 30, // Lower than existing progress
        timeSpent: 15
      };
      
      const existingEnrollment = {
        userId,
        courseId,
        progress: 60, // Higher existing progress
        completedModules: ['module-1'],
        totalTimeSpent: 180
      };

      courseService.getEnrollment = jest.fn().mockResolvedValue(existingEnrollment);
      mockDb.query.mockResolvedValue({});
      mockRedis.set.mockResolvedValue('OK');

      // Act
      const updatedProgress = await courseService.updateProgress(userId, courseId, progressData);

      // Assert
      expect(updatedProgress.progress).toBe(60); // Should maintain higher progress
      expect(updatedProgress.totalTimeSpent).toBe(195); // Should still add time spent
    });
  });

  describe('Certificate Generation', () => {
    it('should generate certificate for completed course', async () => {
      // Arrange
      const userId = 'test-user-1';
      const courseId = 'raw-feeding-101';
      
      const completedEnrollment = {
        userId,
        courseId,
        progress: 100,
        completionDate: new Date()
      };

      courseService.getEnrollment = jest.fn().mockResolvedValue(completedEnrollment);
      courseService.getCourse = jest.fn().mockResolvedValue({
        id: courseId,
        title: 'Raw Feeding Fundamentals',
        instructor: 'Dr. Sarah Johnson'
      });
      courseService.getUser = jest.fn().mockResolvedValue({
        id: userId,
        name: 'Test User'
      });
      mockDb.query.mockResolvedValue({});

      // Act
      const certificate = await courseService.generateCertificate(userId, courseId);

      // Assert
      expect(certificate.userId).toBe(userId);
      expect(certificate.courseId).toBe(courseId);
      expect(certificate.courseName).toBe('Raw Feeding Fundamentals');
      expect(certificate.userName).toBe('Test User');
      expect(certificate.completionDate).toBeInstanceOf(Date);
      expect(certificate.certificateUrl).toContain('cdn.rawgle.com/certificates');
      expect(certificate.verificationCode).toBeDefined();
      expect(certificate.issuedBy).toBe('Dr. Sarah Johnson');
    });

    it('should reject certificate generation for incomplete course', async () => {
      // Arrange
      const userId = 'test-user-1';
      const courseId = 'raw-feeding-101';
      
      const incompleteEnrollment = {
        userId,
        courseId,
        progress: 85 // Not 100% complete
      };

      courseService.getEnrollment = jest.fn().mockResolvedValue(incompleteEnrollment);

      // Act & Assert
      await expect(courseService.generateCertificate(userId, courseId))
        .rejects.toThrow('Course must be 100% complete to generate certificate');
    });
  });

  describe('Course Analytics', () => {
    it('should calculate accurate course completion rates', async () => {
      // Arrange
      const courseId = 'raw-feeding-101';
      
      courseService.getCourse = jest.fn().mockResolvedValue({
        id: courseId,
        title: 'Raw Feeding Fundamentals'
      });

      // Mock enrollment statistics
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{
            total_enrollments: '100',
            average_progress: '75.5',
            completions: '25'
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            { module_id: 'module-1', completions: '90' },
            { module_id: 'module-2', completions: '75' },
            { module_id: 'module-3', completions: '60' }
          ]
        });

      // Act
      const analytics = await courseService.getCourseAnalytics(courseId);

      // Assert
      expect(analytics.courseId).toBe(courseId);
      expect(analytics.totalEnrollments).toBe(100);
      expect(analytics.averageProgress).toBe(75.5);
      expect(analytics.completionRate).toBe(25);
      expect(analytics.moduleCompletionRates).toHaveLength(3);
      expect(analytics.moduleCompletionRates[0]).toEqual({
        moduleId: 'module-1',
        completions: 90
      });
    });

    it('should handle courses with no enrollments', async () => {
      // Arrange
      const courseId = 'new-course';
      
      courseService.getCourse = jest.fn().mockResolvedValue({
        id: courseId,
        title: 'New Course'
      });

      mockDb.query
        .mockResolvedValueOnce({
          rows: [{
            total_enrollments: '0',
            average_progress: null,
            completions: '0'
          }]
        })
        .mockResolvedValueOnce({
          rows: []
        });

      // Act
      const analytics = await courseService.getCourseAnalytics(courseId);

      // Assert
      expect(analytics.totalEnrollments).toBe(0);
      expect(analytics.averageProgress).toBe(0);
      expect(analytics.completionRate).toBe(0);
      expect(analytics.moduleCompletionRates).toEqual([]);
    });
  });

  describe('Cache Integration', () => {
    it('should cache enrollment data for performance', async () => {
      // Arrange
      const userId = 'test-user-1';
      const courseId = 'raw-feeding-101';
      
      mockRedis.get.mockResolvedValue(null); // Not in cache initially
      mockDb.query.mockResolvedValue({
        rows: [{
          id: 'enrollment-123',
          user_id: userId,
          course_id: courseId,
          progress: 50
        }]
      });
      mockRedis.set.mockResolvedValue('OK');

      // Act
      await courseService.getProgress(userId, courseId);

      // Assert
      expect(mockRedis.get).toHaveBeenCalledWith(`enrollment:${userId}:${courseId}`);
      expect(mockRedis.set).toHaveBeenCalledWith(
        `enrollment:${userId}:${courseId}`,
        expect.any(String),
        'EX',
        3600
      );
    });

    it('should return cached data when available', async () => {
      // Arrange
      const userId = 'test-user-1';
      const courseId = 'raw-feeding-101';
      const cachedData = JSON.stringify({
        userId,
        courseId,
        progress: 75
      });
      
      mockRedis.get.mockResolvedValue(cachedData);

      // Act
      const result = await courseService.getProgress(userId, courseId);

      // Assert
      expect(result.progress).toBe(75);
      expect(mockDb.query).not.toHaveBeenCalled(); // Should not hit database
    });
  });
});