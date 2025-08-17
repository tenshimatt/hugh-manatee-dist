# GoHunta.com - Security Specification

## Security Architecture Overview

GoHunta.com implements defense-in-depth security for hunting dog enthusiasts who often share sensitive location data, personal information, and financial details. Security is critical given the rural environments and potential targeting of hunters.

## Security Threat Model

### Threat Landscape Analysis
```
Primary Threats:
1. Location data exposure (hunting spots, private land access)
2. Account takeover (valuable hunting information)
3. Payment fraud (subscription and marketplace transactions)
4. Data breaches (personal and dog information)
5. Social engineering (hunting community trust exploitation)
6. Malicious content injection (community features)
7. GPS spoofing (false location data)
8. Equipment theft coordination (gear information exposure)

Secondary Threats:
9. Competitor intelligence gathering
10. Anti-hunting activist targeting
11. Public land access disruption
12. Hunting license fraud
13. Community reputation attacks
14. Service disruption during hunting seasons
```

## Authentication & Authorization Security

### Multi-Factor Authentication

#### Positive Test Cases
```gherkin
Feature: Secure Authentication System

Scenario: Successful MFA setup and login
  Given a user with email "hunter@example.com"
  When they enable two-factor authentication
  Then TOTP QR code is generated securely
  And backup codes are provided
  And MFA is enforced on next login
  And login requires both password and TOTP
  And session is established with proper security headers

Scenario: Account lockout after failed attempts
  Given a user account with MFA enabled
  When 5 consecutive failed login attempts occur
  Then account is temporarily locked for 15 minutes
  And security event is logged with IP address
  And user receives email notification
  And legitimate user can unlock via email verification
  And lockout duration increases with repeated attempts

Scenario: JWT token security and rotation
  Given an authenticated user session
  When JWT token is issued
  Then token has appropriate expiration (15 minutes)
  And includes necessary security claims
  And is signed with secure algorithm (RS256)
  And refresh token is stored securely in HttpOnly cookie
  And token rotation occurs before expiration
```

#### Negative Test Cases
```gherkin
Scenario: Brute force attack prevention
  Given an attacker attempting password guessing
  When multiple failed attempts occur from same IP
  Then rate limiting blocks further attempts
  And IP is temporarily banned
  And security alerts are triggered
  And CAPTCHA is required for suspicious activity
  And attack patterns are detected and blocked

Scenario: Session fixation attack prevention
  Given an attacker with pre-existing session ID
  When legitimate user logs in
  Then new session ID is generated
  And old session is invalidated
  And session regeneration is enforced
  And session hijacking is prevented
  And secure session cookies are used

Scenario: JWT token tampering detection
  Given an attacker modifying JWT token
  When tampered token is submitted
  Then signature validation fails
  And request is rejected immediately
  And security event is logged
  And user session is terminated
  And re-authentication is required
```

#### Step Classes (Authentication Security)
```typescript
// auth-security-steps.ts
export class AuthSecuritySteps {
  async testMFASetup(userId: string) {
    const response = await fetch('/api/auth/mfa/setup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken(userId)}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    const mfaData = await response.json();
    
    expect(mfaData.qrCode).toBeDefined();
    expect(mfaData.secret).toBeDefined();
    expect(mfaData.backupCodes).toHaveLength(10);
    
    // Verify QR code is properly formatted
    expect(mfaData.qrCode).toMatch(/^data:image\/png;base64,/);
    
    return mfaData;
  }

  async testBruteForceProtection(email: string) {
    const attempts = [];
    
    // Attempt 6 failed logins
    for (let i = 0; i < 6; i++) {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password: 'wrong_password_' + i 
        })
      });
      
      attempts.push({
        attempt: i + 1,
        status: response.status,
        headers: response.headers
      });
    }

    // First 5 should return 401, 6th should return 429 (rate limited)
    expect(attempts.slice(0, 5).every(a => a.status === 401)).toBe(true);
    expect(attempts[5].status).toBe(429);
    
    // Check for rate limiting headers
    expect(attempts[5].headers.get('Retry-After')).toBeDefined();
    
    return attempts;
  }

  async testJWTSecurity(validToken: string) {
    // Test token validation
    const validationResponse = await fetch('/api/auth/validate', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    expect(validationResponse.status).toBe(200);

    // Test tampered token
    const tamperedToken = validToken.slice(0, -5) + 'XXXXX';
    const tamperedResponse = await fetch('/api/auth/validate', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tamperedToken}` }
    });
    expect(tamperedResponse.status).toBe(401);

    // Test expired token handling
    const expiredResponse = await fetch('/api/auth/validate', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${this.createExpiredToken()}` }
    });
    expect(expiredResponse.status).toBe(401);
  }

  validateSecureHeaders(response: Response) {
    const securityHeaders = {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Content-Security-Policy': /default-src 'self'/,
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    Object.entries(securityHeaders).forEach(([header, expectedValue]) => {
      const actualValue = response.headers.get(header);
      if (typeof expectedValue === 'string') {
        expect(actualValue).toBe(expectedValue);
      } else {
        expect(actualValue).toMatch(expectedValue);
      }
    });
  }
}
```

## Data Protection & Privacy

### Location Data Security

#### Positive Test Cases
```gherkin
Feature: Location Data Protection

Scenario: GPS data encryption and anonymization
  Given user tracks hunt with GPS
  When location data is stored
  Then coordinates are encrypted at rest
  And precision is reduced for privacy (100m accuracy)
  And sensitive locations are automatically flagged
  And private land coordinates are scrubbed
  And location sharing requires explicit consent

Scenario: Hunting spot privacy controls
  Given user wants to share hunt success
  When posting to community
  Then location data is stripped from public posts
  And precise coordinates are never exposed
  And general region only is shown
  And user can opt into location sharing
  And private hunting areas are protected

Scenario: Data retention and deletion
  Given user requests data deletion
  When deletion process is initiated
  Then all location data is permanently removed
  And backups are purged within 30 days
  And user receives confirmation
  And deletion is logged for compliance
  And associated metadata is also removed
```

#### Negative Test Cases
```gherkin
Scenario: Unauthorized location access attempt
  Given attacker trying to access location data
  When accessing location API without permission
  Then request is denied immediately
  And access attempt is logged
  And user is notified of unauthorized access
  And security monitoring is triggered
  And IP is flagged for suspicious activity

Scenario: Location data leakage prevention
  Given system processing location data
  When data flows through system components
  Then encryption is maintained end-to-end
  And logs don't contain coordinates
  And error messages don't expose locations
  And debugging info is sanitized
  And third-party services receive minimal data
```

#### Step Classes (Location Security)
```typescript
// location-security-steps.ts
export class LocationSecuritySteps {
  async testLocationDataEncryption() {
    const sensitiveLocation = {
      latitude: 45.12345678,
      longitude: -110.98765432,
      accuracy: 3.5,
      timestamp: new Date().toISOString()
    };

    const response = await fetch('/api/hunts/location', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ location: sensitiveLocation })
    });

    expect(response.status).toBe(200);
    
    // Verify stored data is encrypted
    const storedData = await this.getStoredLocationData();
    expect(storedData.latitude).not.toBe(sensitiveLocation.latitude);
    expect(storedData.encrypted).toBe(true);
    
    // Verify precision reduction
    const retrievedData = await this.getLocationData();
    const precision = this.calculatePrecision(retrievedData.latitude, retrievedData.longitude);
    expect(precision).toBeLessThanOrEqual(100); // 100m accuracy max
  }

  async testLocationAccessControl(unauthorizedUserId: string) {
    const huntId = 'hunt_123';
    
    const response = await fetch(`/api/hunts/${huntId}/location`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken(unauthorizedUserId)}`
      }
    });

    expect(response.status).toBe(403);
    
    const error = await response.json();
    expect(error.code).toBe('UNAUTHORIZED_LOCATION_ACCESS');
    
    // Verify security event is logged
    const securityLogs = await this.getSecurityLogs();
    const locationAccessAttempt = securityLogs.find(
      log => log.event === 'UNAUTHORIZED_LOCATION_ACCESS' && 
             log.resource === huntId
    );
    expect(locationAccessAttempt).toBeDefined();
  }

  async testLocationDataDeletion(userId: string) {
    // Create location data
    await this.createTestLocationData(userId);
    
    // Request deletion
    const deletionResponse = await fetch('/api/privacy/delete-location-data', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken(userId)}`
      }
    });

    expect(deletionResponse.status).toBe(200);
    
    // Verify data is deleted
    const remainingData = await this.checkRemainingLocationData(userId);
    expect(remainingData.count).toBe(0);
    
    // Verify deletion is logged
    const deletionLogs = await this.getDeletionLogs(userId);
    expect(deletionLogs.length).toBeGreaterThan(0);
    expect(deletionLogs[0].type).toBe('LOCATION_DATA_DELETION');
  }

  calculatePrecision(lat: number, lng: number): number {
    // Calculate precision based on decimal places
    const latPrecision = this.getDecimalPlaces(lat);
    const lngPrecision = this.getDecimalPlaces(lng);
    
    // Convert to approximate meters (rough calculation)
    const avgPrecision = (latPrecision + lngPrecision) / 2;
    return Math.pow(10, 5 - avgPrecision) * 1.11; // Approximate meters
  }
}
```

## Input Validation & Injection Prevention

### SQL Injection Prevention

#### Positive Test Cases
```gherkin
Feature: SQL Injection Prevention

Scenario: Parameterized query usage
  Given user input containing potential SQL injection
  When database query is executed
  Then parameterized queries are used exclusively
  And user input is properly escaped
  And query structure remains intact
  And malicious SQL is treated as literal data
  And database returns expected results safely

Scenario: Input sanitization for dog profiles
  Given user creating dog profile with special characters
  When profile data is processed
  Then special characters are properly encoded
  And HTML tags are escaped
  And SQL keywords are treated as literals
  And profile saves successfully
  And data integrity is maintained
```

#### Negative Test Cases
```gherkin
Scenario: SQL injection attack attempt
  Given attacker submitting malicious SQL in form field
  When form is processed by backend
  Then SQL injection is prevented
  And malicious query doesn't execute
  And error doesn't reveal database structure
  And attack attempt is logged
  And user receives generic error message

Scenario: Union-based SQL injection prevention
  Given attacker using UNION SELECT injection
  When attempting to extract data
  Then parameterized queries prevent injection
  And unauthorized data access is blocked
  And database schema remains protected
  And security monitoring detects attempt
  And response doesn't leak information
```

#### Step Classes (Injection Prevention)
```typescript
// injection-prevention-steps.ts
export class InjectionPreventionSteps {
  async testSQLInjectionPrevention() {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "1 OR 1=1",
      "1 UNION SELECT * FROM users",
      "'; UPDATE users SET admin=1; --",
      "1; DELETE FROM hunt_logs; --"
    ];

    for (const maliciousInput of maliciousInputs) {
      const response = await fetch('/api/dogs/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: maliciousInput })
      });

      // Should return normal response, not error
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.dogs).toBeDefined();
      expect(Array.isArray(data.dogs)).toBe(true);
      
      // Verify database integrity
      await this.verifyDatabaseIntegrity();
    }
  }

  async testParameterizedQueries() {
    const testInput = "O'Malley's Hunting Dog";
    
    const response = await fetch('/api/dogs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        name: testInput,
        breed: 'Irish Setter'
      })
    });

    expect(response.status).toBe(201);
    
    const createdDog = await response.json();
    expect(createdDog.name).toBe(testInput);
    
    // Verify data was stored correctly with apostrophe
    const retrievedDog = await this.getDogById(createdDog.id);
    expect(retrievedDog.name).toBe(testInput);
  }

  async verifyDatabaseIntegrity() {
    // Check that critical tables still exist
    const tables = ['users', 'dogs', 'hunt_logs', 'training_sessions'];
    
    for (const table of tables) {
      const response = await fetch(`/api/admin/table-check/${table}`, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      expect(response.status).toBe(200);
    }
  }

  async testXSSPrevention() {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      '"><script>alert("XSS")</script>'
    ];

    for (const payload of xssPayloads) {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Test Post',
          content: payload
        })
      });

      expect(response.status).toBe(201);
      
      const post = await response.json();
      expect(post.content).not.toContain('<script>');
      expect(post.content).not.toContain('javascript:');
      expect(post.content).not.toContain('onerror');
      expect(post.content).not.toContain('onload');
    }
  }
}
```

## Secure File Upload & Storage

### File Upload Security

#### Positive Test Cases
```gherkin
Feature: Secure File Upload System

Scenario: Image upload with validation
  Given user uploading hunt photo
  When image file is submitted
  Then file type is validated (JPEG, PNG, WEBP only)
  And file size is checked (max 10MB)
  And image headers are verified
  And EXIF data is stripped for privacy
  And file is scanned for malware
  And upload succeeds to secure storage

Scenario: File storage security
  Given file uploaded successfully
  When file is stored
  Then file is encrypted in R2 storage
  And access is controlled by signed URLs
  And URLs expire after reasonable time
  And file metadata is stored separately
  And virus scanning results are logged
```

#### Negative Test Cases
```gherkin
Scenario: Malicious file upload attempt
  Given attacker uploading executable file
  When file is submitted as image
  Then file type validation rejects upload
  And malicious content is detected
  And upload is blocked immediately
  And security event is logged
  And user receives appropriate error

Scenario: File bomb upload prevention
  Given attacker uploading zip bomb file
  When file is processed
  Then size limits prevent expansion
  And processing is terminated safely
  And system resources are protected
  And attack is detected and logged
  And attacker IP is flagged
```

#### Step Classes (File Security)
```typescript
// file-security-steps.ts
export class FileSecuritySteps {
  async testSecureImageUpload() {
    const validImageFile = new File(['mock-image-data'], 'hunt-photo.jpg', {
      type: 'image/jpeg'
    });

    const formData = new FormData();
    formData.append('photo', validImageFile);

    const response = await fetch('/api/uploads/photos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      },
      body: formData
    });

    expect(response.status).toBe(200);
    
    const uploadResult = await response.json();
    expect(uploadResult.url).toBeDefined();
    expect(uploadResult.exif_stripped).toBe(true);
    expect(uploadResult.malware_scan).toBe('clean');
    
    // Verify file is accessible via signed URL
    const fileResponse = await fetch(uploadResult.url);
    expect(fileResponse.status).toBe(200);
  }

  async testMaliciousFileUpload() {
    const maliciousFiles = [
      { name: 'script.php', type: 'application/php', content: '<?php system($_GET["cmd"]); ?>' },
      { name: 'evil.exe', type: 'application/octet-stream', content: 'MZ\x90\x00' },
      { name: 'fake.jpg', type: 'image/jpeg', content: '#!/bin/bash\nrm -rf /' }
    ];

    for (const maliciousFile of maliciousFiles) {
      const file = new File([maliciousFile.content], maliciousFile.name, {
        type: maliciousFile.type
      });

      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/uploads/photos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        },
        body: formData
      });

      expect(response.status).toBe(400);
      
      const error = await response.json();
      expect(error.code).toBe('INVALID_FILE_TYPE');
    }
  }

  async testFileSizeLimit() {
    // Create file larger than 10MB limit
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    });

    const formData = new FormData();
    formData.append('photo', largeFile);

    const response = await fetch('/api/uploads/photos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      },
      body: formData
    });

    expect(response.status).toBe(413); // Payload Too Large
    
    const error = await response.json();
    expect(error.code).toBe('FILE_TOO_LARGE');
    expect(error.max_size).toBe('10MB');
  }

  async testEXIFDataStripping() {
    // Upload image with EXIF data
    const imageWithEXIF = await this.createImageWithEXIF();
    
    const formData = new FormData();
    formData.append('photo', imageWithEXIF);

    const response = await fetch('/api/uploads/photos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      },
      body: formData
    });

    expect(response.status).toBe(200);
    
    const result = await response.json();
    
    // Download and verify EXIF data is stripped
    const processedImage = await fetch(result.url);
    const imageData = await processedImage.arrayBuffer();
    
    const hasEXIF = this.checkForEXIFData(imageData);
    expect(hasEXIF).toBe(false);
  }
}
```

## Security Monitoring & Incident Response

### Real-time Security Monitoring

#### Positive Test Cases
```gherkin
Feature: Security Monitoring System

Scenario: Suspicious activity detection
  Given user account showing abnormal patterns
  When multiple unusual activities occur
  Then security monitoring detects anomaly
  And risk score is calculated
  And alerts are triggered appropriately
  And user is notified of suspicious activity
  And protective measures are activated

Scenario: Security incident logging
  Given security event occurs in system
  When event is processed
  Then event is logged with full context
  And severity level is assigned
  And relevant stakeholders are notified
  And response procedures are initiated
  And event correlation is performed
```

#### Step Classes (Security Monitoring)
```typescript
// security-monitoring-steps.ts
export class SecurityMonitoringSteps {
  async testSuspiciousActivityDetection() {
    const userId = 'test_user_123';
    
    // Simulate suspicious activities
    const suspiciousActivities = [
      { type: 'LOGIN_FROM_NEW_LOCATION', location: 'Russia' },
      { type: 'MULTIPLE_FAILED_LOGINS', count: 5 },
      { type: 'UNUSUAL_DATA_ACCESS', tables: ['all_users'] },
      { type: 'RAPID_API_REQUESTS', rate: 100 }
    ];

    for (const activity of suspiciousActivities) {
      await this.simulateSecurityEvent(userId, activity);
    }

    // Check if monitoring detected the pattern
    const alertResponse = await fetch('/api/security/alerts', {
      headers: { 'Authorization': `Bearer ${this.adminToken}` }
    });

    expect(alertResponse.status).toBe(200);
    
    const alerts = await alertResponse.json();
    const userAlerts = alerts.filter((alert: any) => alert.user_id === userId);
    
    expect(userAlerts.length).toBeGreaterThan(0);
    expect(userAlerts[0].risk_score).toBeGreaterThan(70);
  }

  async testSecurityEventLogging() {
    const securityEvent = {
      type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      user_id: 'test_user_123',
      resource: '/api/admin/users',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Test Browser)',
      timestamp: new Date().toISOString()
    };

    await this.logSecurityEvent(securityEvent);

    // Verify event was logged
    const logsResponse = await fetch('/api/security/logs', {
      headers: { 'Authorization': `Bearer ${this.adminToken}` }
    });

    expect(logsResponse.status).toBe(200);
    
    const logs = await logsResponse.json();
    const eventLog = logs.find((log: any) => 
      log.type === securityEvent.type && 
      log.user_id === securityEvent.user_id
    );

    expect(eventLog).toBeDefined();
    expect(eventLog.severity).toBe('HIGH');
  }

  async testIncidentResponse() {
    // Trigger high-severity security incident
    const incident = {
      type: 'DATA_BREACH_ATTEMPT',
      severity: 'CRITICAL',
      affected_users: 1000,
      data_types: ['location', 'personal_info']
    };

    const response = await fetch('/api/security/incident', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(incident)
    });

    expect(response.status).toBe(200);
    
    const incidentResponse = await response.json();
    expect(incidentResponse.incident_id).toBeDefined();
    expect(incidentResponse.response_team_notified).toBe(true);
    expect(incidentResponse.automated_measures_activated).toBe(true);
  }
}
```

## Compliance & Privacy Regulations

### GDPR Compliance Testing

#### Positive Test Cases
```gherkin
Feature: GDPR Compliance

Scenario: Data subject access request
  Given user requesting their data
  When data access request is submitted
  Then all user data is collected
  And data is provided in machine-readable format
  And response includes data sources
  And request is fulfilled within 30 days
  And data accuracy is verified

Scenario: Right to data portability
  Given user wanting to export their data
  When export request is made
  Then data is provided in JSON format
  And includes all user-generated content
  And format is interoperable
  And user can import to other systems
  And export is available for download

Scenario: Right to erasure (right to be forgotten)
  Given user requesting data deletion
  When deletion request is processed
  Then all personal data is removed
  And backups are scheduled for purging
  And third-party processors are notified
  And deletion confirmation is provided
  And audit trail is maintained
```

#### Step Classes (Compliance)
```typescript
// compliance-steps.ts
export class ComplianceSteps {
  async testDataAccessRequest(userId: string) {
    const response = await fetch('/api/privacy/data-request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken(userId)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type: 'ACCESS' })
    });

    expect(response.status).toBe(200);
    
    const request = await response.json();
    expect(request.request_id).toBeDefined();
    expect(request.estimated_completion).toBeDefined();
    
    // Wait for processing (in real scenario, this would be async)
    const dataResponse = await this.getDataAccessResult(request.request_id);
    
    expect(dataResponse.user_data).toBeDefined();
    expect(dataResponse.user_data.profile).toBeDefined();
    expect(dataResponse.user_data.dogs).toBeDefined();
    expect(dataResponse.user_data.hunt_logs).toBeDefined();
    expect(dataResponse.format).toBe('JSON');
  }

  async testDataDeletionRequest(userId: string) {
    const response = await fetch('/api/privacy/data-request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken(userId)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type: 'DELETION' })
    });

    expect(response.status).toBe(200);
    
    const request = await response.json();
    expect(request.deletion_scheduled).toBe(true);
    
    // Verify user data is marked for deletion
    const userCheck = await this.checkUserExists(userId);
    expect(userCheck.status).toBe('DELETION_SCHEDULED');
    
    // Verify deletion audit trail
    const auditResponse = await fetch(`/api/privacy/audit/${userId}`, {
      headers: { 'Authorization': `Bearer ${this.adminToken}` }
    });
    
    const audit = await auditResponse.json();
    expect(audit.deletion_requested).toBeDefined();
  }

  async testConsentManagement() {
    const consentTypes = [
      'essential',
      'analytics', 
      'marketing',
      'location_sharing',
      'community_posts'
    ];

    const response = await fetch('/api/privacy/consent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        consents: consentTypes.map(type => ({
          type,
          granted: type === 'essential', // Only essential required
          timestamp: new Date().toISOString()
        }))
      })
    });

    expect(response.status).toBe(200);
    
    const result = await response.json();
    expect(result.consents_recorded).toBe(consentTypes.length);
    
    // Verify consent can be withdrawn
    const withdrawResponse = await fetch('/api/privacy/consent/analytics', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.authToken}` }
    });
    
    expect(withdrawResponse.status).toBe(200);
  }
}
```

This security specification provides comprehensive coverage of all security aspects critical for a hunting community platform, with particular emphasis on location data protection and community safety while maintaining the testing-first approach throughout.