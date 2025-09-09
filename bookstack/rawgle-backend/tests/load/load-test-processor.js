/**
 * Artillery Load Test Processor
 * Custom functions for load testing scenarios
 */

const { faker } = require('@faker-js/faker');

module.exports = {
  // Generate random user data for testing
  generateRandomUser: (context, events, done) => {
    context.vars.randomUser = {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      password: 'LoadTest123!'
    };
    return done();
  },

  // Generate realistic course interaction patterns
  generateCourseInteraction: (context, events, done) => {
    const interactions = [
      'browse',
      'search',
      'filter',
      'enroll',
      'progress_update',
      'certificate_request'
    ];
    
    context.vars.interaction = faker.helpers.arrayElement(interactions);
    context.vars.searchTerm = faker.helpers.arrayElement([
      'raw feeding',
      'dog nutrition',
      'cat food',
      'pet health',
      'canine diet',
      'feline nutrition'
    ]);
    
    return done();
  },

  // Simulate realistic progress updates
  generateProgressData: (context, events, done) => {
    const modules = ['module-1', 'module-2', 'module-3', 'module-4', 'module-5'];
    const lessons = ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4', 'lesson-5'];
    
    context.vars.progressData = {
      moduleId: faker.helpers.arrayElement(modules),
      lessonId: faker.helpers.arrayElement(lessons),
      percentComplete: faker.number.int({ min: 1, max: 100 }),
      timeSpent: faker.number.int({ min: 5, max: 120 }) // 5 minutes to 2 hours
    };
    
    return done();
  },

  // Track enrollment success rates
  trackEnrollmentMetrics: (requestParams, response, context, events, done) => {
    if (response.statusCode === 201 && requestParams.url.includes('/enroll')) {
      events.emit('customStat', 'enrollment.success', 1);
    } else if (requestParams.url.includes('/enroll')) {
      events.emit('customStat', 'enrollment.failure', 1);
    }
    
    return done();
  },

  // Monitor response times for critical endpoints
  monitorCriticalEndpoints: (requestParams, response, context, events, done) => {
    const responseTime = response.timings.response;
    
    if (requestParams.url.includes('/courses') && !requestParams.url.includes('/enroll')) {
      events.emit('customStat', 'courses_list.response_time', responseTime);
    }
    
    if (requestParams.url.includes('/enroll')) {
      events.emit('customStat', 'enrollment.response_time', responseTime);
    }
    
    if (requestParams.url.includes('/progress')) {
      events.emit('customStat', 'progress.response_time', responseTime);
    }
    
    return done();
  },

  // Generate realistic user behavior patterns
  generateUserBehavior: (context, events, done) => {
    const userTypes = [
      {
        type: 'browser',
        weight: 40,
        actions: ['browse_courses', 'search_courses', 'view_course_details']
      },
      {
        type: 'learner',
        weight: 35,
        actions: ['login', 'browse_courses', 'enroll', 'update_progress']
      },
      {
        type: 'completer',
        weight: 15,
        actions: ['login', 'update_progress', 'generate_certificate']
      },
      {
        type: 'mobile_user',
        weight: 10,
        actions: ['mobile_browse', 'mobile_enroll', 'mobile_learn']
      }
    ];
    
    const userType = faker.helpers.weightedArrayElement(userTypes.map(ut => ({
      value: ut,
      weight: ut.weight
    })));
    
    context.vars.userType = userType.type;
    context.vars.userActions = userType.actions;
    
    return done();
  },

  // Simulate database load patterns
  simulateDatabaseLoad: (context, events, done) => {
    // Add realistic delays for database operations
    const operationType = context.vars.operationType || 'read';
    
    const delays = {
      read: faker.number.int({ min: 10, max: 50 }),
      write: faker.number.int({ min: 20, max: 100 }),
      complex_query: faker.number.int({ min: 50, max: 200 })
    };
    
    context.vars.simulatedDelay = delays[operationType];
    
    return done();
  },

  // Generate course-specific test data
  generateCourseTestData: (context, events, done) => {
    const courses = [
      'raw-feeding-101',
      'advanced-nutrition',
      'feline-feeding-mastery',
      'puppy-nutrition-basics',
      'senior-dog-care',
      'cat-behavior-basics'
    ];
    
    context.vars.courseId = faker.helpers.arrayElement(courses);
    context.vars.difficulty = faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']);
    context.vars.category = faker.helpers.arrayElement(['nutrition', 'behavior', 'health', 'training']);
    
    return done();
  },

  // Performance assertion helpers
  assertPerformanceTargets: (requestParams, response, context, events, done) => {
    const responseTime = response.timings.response;
    const endpoint = requestParams.url;
    
    // Define performance targets based on TDD_DOCUMENTATION.md
    const performanceTargets = {
      '/api/v1/courses': { p95: 200, p99: 500 },
      '/api/v1/courses/.*': { p95: 200, p99: 500 },
      '/api/v1/courses/.*/enroll': { p95: 300, p99: 800 },
      '/api/v1/courses/.*/progress': { p95: 100, p99: 300 }
    };
    
    Object.keys(performanceTargets).forEach(pattern => {
      const regex = new RegExp(pattern);
      if (regex.test(endpoint)) {
        const targets = performanceTargets[pattern];
        
        if (responseTime > targets.p99) {
          events.emit('customStat', `performance.violation.${pattern}`, 1);
        }
        
        events.emit('customStat', `performance.${pattern}.response_time`, responseTime);
      }
    });
    
    return done();
  },

  // Error pattern analysis
  analyzeErrors: (requestParams, response, context, events, done) => {
    if (response.statusCode >= 400) {
      const errorType = Math.floor(response.statusCode / 100);
      const endpoint = requestParams.url.split('?')[0]; // Remove query params
      
      events.emit('customStat', `error.${errorType}xx.count`, 1);
      events.emit('customStat', `error.endpoint.${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`, 1);
      
      // Track specific error patterns
      if (response.statusCode === 429) {
        events.emit('customStat', 'error.rate_limit', 1);
      }
      
      if (response.statusCode === 503) {
        events.emit('customStat', 'error.service_unavailable', 1);
      }
      
      if (response.statusCode === 500) {
        events.emit('customStat', 'error.internal_server', 1);
      }
    }
    
    return done();
  },

  // Resource utilization tracking
  trackResourceUtilization: (context, events, done) => {
    // Simulate resource usage patterns
    const resourceMetrics = {
      cpu_usage: faker.number.int({ min: 20, max: 80 }),
      memory_usage: faker.number.int({ min: 30, max: 70 }),
      db_connections: faker.number.int({ min: 10, max: 100 }),
      redis_connections: faker.number.int({ min: 5, max: 50 })
    };
    
    Object.keys(resourceMetrics).forEach(metric => {
      events.emit('customStat', `resource.${metric}`, resourceMetrics[metric]);
    });
    
    return done();
  },

  // Custom cleanup for load tests
  cleanup: (context, events, done) => {
    // Perform any necessary cleanup
    if (context.vars.userId) {
      // Would normally clean up test users
      events.emit('customStat', 'cleanup.users', 1);
    }
    
    if (context.vars.enrollmentId) {
      // Would normally clean up test enrollments
      events.emit('customStat', 'cleanup.enrollments', 1);
    }
    
    return done();
  }
};