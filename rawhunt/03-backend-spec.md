# GoHunta.com - Backend Development Specification

## Backend Architecture Overview

The GoHunta backend is built on Cloudflare Workers with a comprehensive testing framework prioritizing reliability for rural hunting environments. The system handles user authentication, dog profile management, hunt logging, GPS data, community features, and equipment reviews.

## Core Backend Components

### 1. Authentication Service

#### Positive Test Cases
```gherkin
Feature: User Registration and Authentication

Scenario: Successful user registration
  Given a new user with valid email "hunter@example.com"
  And password "SecureHunt123!"
  And location "Montana, USA"
  When they register for an account
  Then account is created successfully
  And confirmation email is sent
  And user can login immediately
  And JWT token is returned with 7-day expiration

Scenario: Successful user login
  Given an existing user with email "hunter@example.com"
  And correct password "SecureHunt123!"
  When they attempt to login
  Then JWT token is returned
  And user profile data is included
  And last login timestamp is updated
  And session is created in KV store

Scenario: JWT token refresh
  Given a user with expired JWT token
  And valid refresh token in KV store
  When they request token refresh
  Then new JWT token is issued
  And refresh token is rotated
  And user remains authenticated
```

#### Negative Test Cases
```gherkin
Scenario: Registration with invalid email
  Given a user with invalid email "not-an-email"
  When they attempt to register
  Then registration fails with "Invalid email format"
  And no user account is created
  And no confirmation email is sent

Scenario: Registration with weak password
  Given a user with password "123"
  When they attempt to register
  Then registration fails with "Password too weak"
  And password requirements are displayed
  And no account is created

Scenario: Login with incorrect credentials
  Given an existing user with email "hunter@example.com"
  And incorrect password "wrongpass"
  When they attempt to login
  Then login fails with "Invalid credentials"
  And no JWT token is issued
  And failed attempt is logged

Scenario: Login rate limiting
  Given a user with 5 failed login attempts in 10 minutes
  When they attempt another login
  Then request is blocked with "Too many attempts"
  And lockout timer is set to 15 minutes
  And security event is logged
```

#### Step Classes (Authentication)
```javascript
// auth-steps.js
class AuthSteps {
  async registerUser(email, password, location) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, location })
    });
    return { status: response.status, data: await response.json() };
  }

  async loginUser(email, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return { status: response.status, data: await response.json() };
  }

  async refreshToken(refreshToken) {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${refreshToken}` }
    });
    return { status: response.status, data: await response.json() };
  }

  validateJWT(token) {
    // JWT validation logic
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { valid: true, payload: decoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}
```

### 2. Dog Profile Management Service

#### Positive Test Cases
```gherkin
Feature: Dog Profile Management

Scenario: Create hunting dog profile
  Given an authenticated hunter
  And dog details:
    | name     | breed           | birth_date | hunting_style |
    | Rex      | German Shorthair| 2020-05-15 | pointing      |
  When they create a dog profile
  Then profile is saved to database
  And dog ID is returned
  And profile appears in user's dog list
  And default training goals are created

Scenario: Update dog profile with training progress
  Given an existing dog profile with ID "dog123"
  And new training level "seasoned"
  And performance metrics:
    | metric        | value |
    | pointing_hold | 45s   |
    | retrieve_rate | 95%   |
  When profile is updated
  Then changes are saved to database
  And updated timestamp is set
  And training progress is logged

Scenario: Upload dog photos
  Given an existing dog profile
  And valid image files (JPEG, PNG, WEBP)
  And maximum 5MB per file
  When photos are uploaded
  Then images are stored in R2
  And URLs are saved to dog profile
  And thumbnails are generated
  And metadata is extracted
```

#### Negative Test Cases
```gherkin
Scenario: Create dog profile with missing required fields
  Given an authenticated hunter
  And incomplete dog details missing name
  When they attempt to create profile
  Then creation fails with "Name is required"
  And no profile is created
  And validation errors are returned

Scenario: Update non-existent dog profile
  Given an authenticated hunter
  And dog ID "nonexistent123"
  When they attempt to update profile
  Then update fails with "Dog not found"
  And no changes are made
  And 404 status is returned

Scenario: Upload oversized photo
  Given an existing dog profile
  And image file larger than 5MB
  When photo upload is attempted
  Then upload fails with "File too large"
  And no file is stored
  And size limit is communicated

Scenario: Access another user's dog profile
  Given an authenticated hunter
  And dog ID belonging to different user
  When they attempt to access profile
  Then access is denied with "Unauthorized"
  And no profile data is returned
  And security event is logged
```

#### Step Classes (Dog Profiles)
```javascript
// dog-profile-steps.js
class DogProfileSteps {
  async createDogProfile(userId, dogData) {
    const response = await fetch('/api/dogs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken(userId)}`
      },
      body: JSON.stringify(dogData)
    });
    return { status: response.status, data: await response.json() };
  }

  async updateDogProfile(userId, dogId, updates) {
    const response = await fetch(`/api/dogs/${dogId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken(userId)}`
      },
      body: JSON.stringify(updates)
    });
    return { status: response.status, data: await response.json() };
  }

  async uploadDogPhoto(userId, dogId, photoFile) {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    const response = await fetch(`/api/dogs/${dogId}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken(userId)}`
      },
      body: formData
    });
    return { status: response.status, data: await response.json() };
  }

  validateDogData(dogData) {
    const errors = [];
    if (!dogData.name) errors.push('Name is required');
    if (!dogData.breed) errors.push('Breed is required');
    if (dogData.birth_date && !this.isValidDate(dogData.birth_date)) {
      errors.push('Invalid birth date');
    }
    return errors;
  }
}
```

### 3. Hunt Logging Service

#### Positive Test Cases
```gherkin
Feature: Hunt Logging and GPS Tracking

Scenario: Create successful hunt log
  Given an authenticated hunter
  And hunt details:
    | location      | date       | dogs_present | duration |
    | Pheasant Ridge| 2024-01-15 | ["dog123"]   | 240      |
  And GPS route data with waypoints
  And weather conditions recorded
  When hunt log is created
  Then log is saved to database
  And GPS route is stored
  And statistics are updated
  And dogs' hunt count increments

Scenario: Add game harvest data
  Given an existing hunt log
  And harvest details:
    | species  | count | location_gps        |
    | pheasant | 2     | 45.123, -110.456   |
    | quail    | 3     | 45.124, -110.457   |
  When harvest data is added
  Then harvest records are created
  And GPS locations are validated
  And season limits are checked
  And hunting license is verified

Scenario: Offline hunt data sync
  Given a hunter with offline hunt data
  And cached GPS routes and photos
  And network connectivity restored
  When sync is initiated
  Then all offline data is uploaded
  And conflicts are resolved
  And user is notified of sync status
  And local cache is cleared
```

#### Negative Test Cases
```gherkin
Scenario: Hunt log with invalid GPS coordinates
  Given hunt log data with GPS coordinates "999, 999"
  When attempting to save hunt log
  Then save fails with "Invalid GPS coordinates"
  And error details specify coordinate ranges
  And no hunt log is created

Scenario: Hunt log exceeding daily limits
  Given a hunter with 5 hunt logs for today
  And platform limit of 5 hunts per day
  When attempting to create 6th hunt log
  Then creation fails with "Daily limit exceeded"
  And upgrade options are presented
  And existing logs remain unchanged

Scenario: Harvest data without valid license
  Given a hunter without current hunting license
  And harvest data to be recorded
  When attempting to log harvest
  Then logging fails with "Valid license required"
  And license verification process is initiated
  And harvest data is not saved

Scenario: GPS route data corruption
  Given hunt log with corrupted GPS data
  And malformed JSON in route field
  When attempting to process hunt log
  Then processing fails gracefully
  And error is logged for investigation
  And partial data is preserved where possible
```

#### Step Classes (Hunt Logging)
```javascript
// hunt-logging-steps.js
class HuntLoggingSteps {
  async createHuntLog(userId, huntData) {
    const response = await fetch('/api/hunts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken(userId)}`
      },
      body: JSON.stringify(huntData)
    });
    return { status: response.status, data: await response.json() };
  }

  async addHarvestData(userId, huntId, harvestData) {
    const response = await fetch(`/api/hunts/${huntId}/harvest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken(userId)}`
      },
      body: JSON.stringify(harvestData)
    });
    return { status: response.status, data: await response.json() };
  }

  async syncOfflineData(userId, offlineData) {
    const response = await fetch('/api/hunts/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken(userId)}`
      },
      body: JSON.stringify({ offlineData })
    });
    return { status: response.status, data: await response.json() };
  }

  validateGPSCoordinates(lat, lng) {
    return (
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }

  validateHuntingLicense(licenseNumber, state, expirationDate) {
    // License validation logic
    return {
      valid: this.isValidLicenseFormat(licenseNumber, state),
      expired: new Date(expirationDate) < new Date(),
      state: state
    };
  }
}
```

### 4. Training Session Management

#### Positive Test Cases
```gherkin
Feature: Training Session Management

Scenario: Log basic training session
  Given an authenticated hunter
  And dog ID "dog123"
  And training session data:
    | exercise_type | duration | performance_rating |
    | retrieve_drill| 45       | 4                  |
  When training session is logged
  Then session is saved to database
  And dog's training progress is updated
  And performance trends are calculated
  And next recommended exercises are suggested

Scenario: Upload training video with analysis
  Given an existing training session
  And video file (MP4, MOV, AVI)
  And video metadata (duration, resolution)
  When video is uploaded
  Then video is stored in R2
  And thumbnail is generated
  And video URL is saved to session
  And compression is applied for mobile viewing
```

#### Negative Test Cases
```gherkin
Scenario: Training session with invalid performance rating
  Given training session data with rating "10"
  And valid rating range is 1-5
  When attempting to save session
  Then save fails with "Rating must be 1-5"
  And validation error details are provided
  And no session record is created

Scenario: Upload video exceeding size limit
  Given training video larger than 100MB
  When attempting to upload
  Then upload fails with "Video too large"
  And size limit is communicated
  And compression suggestions are provided
```

### 5. Community Features Backend

#### Positive Test Cases
```gherkin
Feature: Community Posts and Comments

Scenario: Create community post
  Given an authenticated hunter
  And post content:
    | title          | content                  | category      |
    | Training Tips  | Great retrieve exercise  | training      |
  When post is created
  Then post is saved to database
  And post appears in community feed
  And user's post count increments
  And notifications are sent to followers

Scenario: Moderate content automatically
  Given a post with potentially inappropriate content
  When content moderation runs
  Then suspicious content is flagged
  And post is held for review
  And user is notified of review status
  And moderators are alerted
```

#### Negative Test Cases
```gherkin
Scenario: Post with prohibited content
  Given a post containing spam keywords
  When attempting to create post
  Then creation fails with "Content violates guidelines"
  And specific violations are identified
  And user education is provided

Scenario: Excessive posting rate
  Given a user posting 10 times in 5 minutes
  When attempting another post
  Then post is blocked with "Rate limit exceeded"
  And cooldown period is enforced
  And user is advised of limits
```

## Backend Testing Framework

### Unit Test Structure
```javascript
// Example unit test file: auth.test.js
describe('Authentication Service', () => {
  describe('User Registration', () => {
    test('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        location: 'Montana'
      };
      
      const result = await authService.registerUser(userData);
      
      expect(result.success).toBe(true);
      expect(result.user.email).toBe(userData.email);
      expect(result.user.password).toBeUndefined(); // Password should not be returned
    });

    test('should reject user with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        location: 'Montana'
      };
      
      await expect(authService.registerUser(userData))
        .rejects.toThrow('Invalid email format');
    });
  });
});
```

### Integration Test Examples
```javascript
// Example integration test: hunt-flow.test.js
describe('Complete Hunt Flow', () => {
  test('should handle full hunt logging workflow', async () => {
    // Setup: Create user and dog
    const user = await testHelper.createTestUser();
    const dog = await testHelper.createTestDog(user.id);
    
    // Test: Create hunt log
    const huntData = {
      location: 'Test Hunting Area',
      dogs_present: [dog.id],
      gps_route: testHelper.generateGPSRoute()
    };
    
    const huntLog = await huntService.createHuntLog(user.id, huntData);
    expect(huntLog.id).toBeDefined();
    
    // Test: Add harvest data
    const harvestData = {
      species: 'pheasant',
      count: 2,
      location_gps: '45.123,-110.456'
    };
    
    const harvest = await huntService.addHarvest(user.id, huntLog.id, harvestData);
    expect(harvest.species).toBe('pheasant');
    
    // Verify: Data consistency
    const retrievedLog = await huntService.getHuntLog(user.id, huntLog.id);
    expect(retrievedLog.harvest.length).toBe(1);
  });
});
```

### Performance Test Specifications
```javascript
// Load testing configuration
const loadTestConfig = {
  scenarios: {
    'peak_hunting_season': {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '2m', target: 100 },   // Ramp up
        { duration: '5m', target: 100 },   // Stay at 100 users
        { duration: '2m', target: 200 },   // Ramp to 200 users
        { duration: '5m', target: 200 },   // Stay at 200 users
        { duration: '2m', target: 0 },     // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};
```

## Database Schema & Testing

### Database Test Cases
```sql
-- Test data setup
INSERT INTO test_users (id, email, name, location) VALUES
('test_user_1', 'hunter1@test.com', 'Test Hunter 1', 'Montana'),
('test_user_2', 'hunter2@test.com', 'Test Hunter 2', 'Wyoming');

INSERT INTO test_dogs (id, user_id, name, breed, hunting_style) VALUES
('test_dog_1', 'test_user_1', 'Rex', 'German Shorthaired Pointer', 'pointing'),
('test_dog_2', 'test_user_1', 'Belle', 'English Setter', 'pointing');

-- Test constraint validation
-- This should fail due to foreign key constraint
INSERT INTO test_dogs (id, user_id, name, breed) VALUES
('invalid_dog', 'nonexistent_user', 'Invalid', 'Pointer');

-- Test data integrity
SELECT 
  u.email,
  COUNT(d.id) as dog_count,
  COUNT(h.id) as hunt_count
FROM test_users u
LEFT JOIN test_dogs d ON u.id = d.user_id
LEFT JOIN test_hunt_logs h ON u.id = h.user_id
GROUP BY u.id, u.email;
```

## Error Handling & Logging

### Error Response Format
```javascript
// Standardized error response
const errorResponse = {
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data',
    details: {
      field: 'email',
      reason: 'Invalid email format',
      received: 'not-an-email'
    },
    timestamp: '2024-01-15T10:30:00Z',
    request_id: 'req_12345'
  }
};
```

### Logging Strategy
```javascript
// Structured logging for backend services
class Logger {
  logUserAction(userId, action, details) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category: 'USER_ACTION',
      user_id: userId,
      action: action,
      details: details,
      request_id: this.getRequestId()
    }));
  }

  logSecurityEvent(event, severity, details) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'SECURITY',
      severity: severity,
      event: event,
      details: details,
      request_id: this.getRequestId()
    }));
  }
}
```

## Deployment & Monitoring

### Health Check Endpoints
```javascript
// Health check implementations
app.get('/health', async (c) => {
  const checks = {
    database: await checkDatabaseConnection(),
    storage: await checkR2Storage(),
    kv: await checkKVStorage(),
    external_apis: await checkExternalAPIs()
  };

  const healthy = Object.values(checks).every(check => check.status === 'ok');

  return c.json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: checks
  }, healthy ? 200 : 503);
});
```

### Performance Monitoring
```javascript
// Performance monitoring middleware
const performanceMiddleware = async (c, next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  
  c.set('requestId', requestId);
  
  await next();
  
  const duration = Date.now() - start;
  
  // Log slow requests
  if (duration > 1000) {
    console.log(JSON.stringify({
      type: 'SLOW_REQUEST',
      duration: duration,
      path: c.req.path,
      method: c.req.method,
      request_id: requestId
    }));
  }
};
```

## Security Testing

### Security Test Cases
```gherkin
Feature: Security Validation

Scenario: SQL Injection Prevention
  Given a malicious input containing SQL injection
  When the input is processed by database queries
  Then the injection is prevented
  And safe query execution occurs
  And security event is logged

Scenario: Authentication Bypass Attempt
  Given an unauthenticated request to protected endpoint
  When the request attempts to bypass authentication
  Then access is denied
  And security event is logged
  And IP may be temporarily blocked

Scenario: Rate Limiting Enforcement
  Given excessive requests from single IP
  When rate limit is exceeded
  Then further requests are blocked
  And appropriate error response is returned
  And blocking duration is enforced
```

This backend specification provides comprehensive testing coverage for all core functionality, emphasizing the testing-first approach requested. Each feature includes both positive and negative test cases with corresponding step classes for implementation.