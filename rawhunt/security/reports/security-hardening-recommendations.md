# GoHunta.com Security Hardening Recommendations

## Executive Summary

This document provides comprehensive security hardening recommendations for the GoHunta.com hunting community platform. These recommendations are prioritized based on risk assessment and impact on the hunting community's unique security requirements.

## Critical Priority (Immediate Action Required - 0-24 hours)

### 1. Location Data Encryption Implementation
**Risk Level**: 🔴 CRITICAL  
**Impact**: Hunting spot exposure, privacy violations, anti-hunting targeting

**Current Issue**:
- GPS coordinates stored in plaintext
- Hunting locations visible to unauthorized users
- Private land coordinates at risk

**Implementation Steps**:
```javascript
// Implement AES-256 encryption for location data
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.LOCATION_ENCRYPTION_KEY; // 32 bytes key
const IV_LENGTH = 16; // For AES, this is always 16

function encryptLocation(coordinates) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipher('aes-256-gcm', ENCRYPTION_KEY);
  
  let encrypted = cipher.update(JSON.stringify(coordinates), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decryptLocation(encryptedData) {
  const decipher = crypto.createDecipher('aes-256-gcm', ENCRYPTION_KEY);
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}
```

**Database Schema Updates**:
```sql
-- Add encryption support to location storage
ALTER TABLE hunt_locations 
ADD COLUMN encrypted_coordinates TEXT,
ADD COLUMN encryption_iv TEXT,
ADD COLUMN auth_tag TEXT,
ADD COLUMN precision_level INTEGER DEFAULT 100; -- meters

-- Migrate existing data
UPDATE hunt_locations 
SET precision_level = 100 
WHERE precision_level IS NULL;
```

### 2. JWT Token Security Hardening
**Risk Level**: 🔴 CRITICAL  
**Impact**: Account takeover, unauthorized access

**Current Issue**:
- Weak JWT validation
- No token rotation
- Missing signature verification

**Implementation Steps**:
```javascript
// Enhanced JWT security implementation
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET; // Use RS256 for production
const JWT_ALGORITHM = 'RS256';
const TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export class SecureJWTManager {
  static generateTokenPair(userId, userRole) {
    const payload = {
      sub: userId,
      role: userRole,
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID(), // Unique token ID for tracking
      aud: 'gohunta.com',
      iss: 'gohunta-auth'
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      algorithm: JWT_ALGORITHM,
      expiresIn: TOKEN_EXPIRY
    });

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      JWT_SECRET,
      { 
        algorithm: JWT_ALGORITHM,
        expiresIn: REFRESH_TOKEN_EXPIRY 
      }
    );

    return { accessToken, refreshToken };
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
        audience: 'gohunta.com',
        issuer: 'gohunta-auth'
      });
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static blacklistToken(tokenId) {
    // Store blacklisted tokens in KV store with TTL
    return KV.put(`blacklist:${tokenId}`, 'true', {
      expirationTtl: 86400 // 24 hours
    });
  }
}
```

### 3. SQL Injection Prevention
**Risk Level**: 🔴 CRITICAL  
**Impact**: Data breach, unauthorized access to hunt data

**Implementation Steps**:
```javascript
// Implement parameterized queries exclusively
export class SecureDatabase {
  static async searchDogs(searchTerm, userId) {
    // NEVER do this:
    // const query = `SELECT * FROM dogs WHERE name LIKE '%${searchTerm}%'`;
    
    // Always use parameterized queries:
    const query = `
      SELECT d.id, d.name, d.breed, d.age 
      FROM dogs d 
      WHERE d.name LIKE ? AND d.owner_id = ?
    `;
    
    return await DB.prepare(query)
      .bind(`%${searchTerm}%`, userId)
      .all();
  }

  static async createHuntLog(huntData, userId) {
    const query = `
      INSERT INTO hunt_logs (user_id, date, species, success, notes, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `;
    
    return await DB.prepare(query)
      .bind(userId, huntData.date, huntData.species, huntData.success, huntData.notes)
      .run();
  }
}
```

## High Priority (Complete within 7 days)

### 4. Multi-Factor Authentication (MFA)
**Risk Level**: 🟠 HIGH  
**Impact**: Account security, hunting data protection

**Implementation**:
```javascript
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export class MFAManager {
  static generateMFASecret(userId) {
    const secret = speakeasy.generateSecret({
      name: `GoHunta.com (${userId})`,
      issuer: 'GoHunta.com'
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url,
      backupCodes: this.generateBackupCodes()
    };
  }

  static verifyTOTP(token, secret) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time windows (60 seconds each)
    });
  }

  static generateBackupCodes() {
    return Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
  }
}
```

### 5. Photo EXIF Data Stripping
**Risk Level**: 🟠 HIGH  
**Impact**: Location exposure through photo metadata

**Implementation**:
```javascript
import sharp from 'sharp';
import ExifReader from 'exifreader';

export class PhotoSecurityProcessor {
  static async processHuntPhoto(imageBuffer) {
    try {
      // Remove all EXIF data and metadata
      const processedImage = await sharp(imageBuffer)
        .withMetadata(false) // Strip all metadata
        .jpeg({ 
          quality: 85,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();

      // Verify EXIF removal
      const remainingMetadata = await this.checkForEXIFData(processedImage);
      
      if (Object.keys(remainingMetadata).length > 0) {
        throw new Error('EXIF data not completely removed');
      }

      return {
        processedImage,
        originalSize: imageBuffer.length,
        processedSize: processedImage.length,
        metadataRemoved: true,
        compressionRatio: (imageBuffer.length / processedImage.length).toFixed(2)
      };

    } catch (error) {
      throw new Error(`Photo processing failed: ${error.message}`);
    }
  }

  static async checkForEXIFData(imageBuffer) {
    try {
      return ExifReader.load(imageBuffer);
    } catch (error) {
      return {}; // No EXIF data found
    }
  }
}
```

### 6. Content Security Policy (CSP) Implementation
**Risk Level**: 🟠 HIGH  
**Impact**: XSS prevention, script injection protection

**Implementation**:
```javascript
export function addSecurityHeaders(response) {
  const securityHeaders = {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.gohunta.com wss:",
      "media-src 'self' blob:",
      "worker-src 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'"
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': [
      'geolocation=(self)',
      'camera=(self)',
      'microphone=(self)',
      'notifications=(self)'
    ].join(', ')
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
```

## Medium Priority (Complete within 30 days)

### 7. Input Validation and Sanitization
**Risk Level**: 🟡 MEDIUM  
**Impact**: Data integrity, XSS prevention

**Implementation**:
```javascript
import DOMPurify from 'dompurify';
import validator from 'validator';

export class InputValidator {
  static sanitizeUserContent(input) {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href'],
      ALLOW_DATA_ATTR: false
    });
  }

  static validateEmail(email) {
    return validator.isEmail(email) && email.length <= 254;
  }

  static validateGPSCoordinates(lat, lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    return !isNaN(latitude) && !isNaN(longitude) &&
           latitude >= -90 && latitude <= 90 &&
           longitude >= -180 && longitude <= 180;
  }

  static validatePhoneNumber(phone) {
    return validator.isMobilePhone(phone, 'any', { strictMode: true });
  }

  static sanitizeSearchQuery(query) {
    // Remove SQL keywords and special characters
    return query
      .replace(/[<>'"%;()&+]/g, '')
      .substring(0, 100)
      .trim();
  }
}
```

### 8. Rate Limiting Implementation
**Risk Level**: 🟡 MEDIUM  
**Impact**: Brute force prevention, DDoS protection

**Implementation**:
```javascript
export class RateLimiter {
  static async checkRateLimit(request, limits = {}) {
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const endpoint = new URL(request.url).pathname;
    
    const defaultLimits = {
      '/api/auth/login': { requests: 5, window: 900 }, // 5 requests per 15 minutes
      '/api/auth/register': { requests: 3, window: 3600 }, // 3 per hour
      '/api/search': { requests: 100, window: 3600 }, // 100 per hour
      'default': { requests: 1000, window: 3600 } // 1000 per hour default
    };

    const limit = limits[endpoint] || defaultLimits[endpoint] || defaultLimits.default;
    const key = `ratelimit:${clientIP}:${endpoint}`;
    
    const currentCount = await KV.get(key);
    const count = currentCount ? parseInt(currentCount) : 0;

    if (count >= limit.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + (limit.window * 1000)
      };
    }

    await KV.put(key, (count + 1).toString(), {
      expirationTtl: limit.window
    });

    return {
      allowed: true,
      remaining: limit.requests - count - 1,
      resetTime: Date.now() + (limit.window * 1000)
    };
  }
}
```

### 9. GDPR Compliance Implementation
**Risk Level**: 🟡 MEDIUM  
**Impact**: Regulatory compliance, user privacy rights

**Implementation**:
```javascript
export class GDPRCompliance {
  static async processDataAccessRequest(userId) {
    const userData = {
      profile: await this.getUserProfile(userId),
      dogs: await this.getUserDogs(userId),
      huntLogs: await this.getHuntLogs(userId),
      locationData: await this.getLocationData(userId),
      photos: await this.getUserPhotos(userId),
      communityPosts: await this.getCommunityPosts(userId)
    };

    return {
      requestId: crypto.randomUUID(),
      userData,
      format: 'JSON',
      exportDate: new Date().toISOString(),
      dataRetentionPolicy: '7 years for hunting logs, 2 years for location data'
    };
  }

  static async processDataDeletionRequest(userId) {
    // Mark user for deletion (soft delete initially)
    await DB.prepare(`
      UPDATE users 
      SET deletion_requested = datetime('now'),
          status = 'DELETION_SCHEDULED'
      WHERE id = ?
    `).bind(userId).run();

    // Schedule deletion job
    return {
      deletionId: crypto.randomUUID(),
      scheduledFor: new Date(Date.now() + 86400000).toISOString(), // 24 hours
      estimatedCompletion: '30 days'
    };
  }

  static async processConsentUpdate(userId, consents) {
    const consentRecord = {
      userId,
      consents,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get('CF-Connecting-IP')
    };

    await DB.prepare(`
      INSERT INTO consent_records (user_id, consent_data, timestamp, ip_address)
      VALUES (?, ?, ?, ?)
    `).bind(userId, JSON.stringify(consents), consentRecord.timestamp, consentRecord.ipAddress).run();

    return { recorded: true, consentId: crypto.randomUUID() };
  }
}
```

## Low Priority (Complete within 90 days)

### 10. Security Monitoring and Alerting
**Implementation**:
```javascript
export class SecurityMonitoring {
  static async logSecurityEvent(eventType, details) {
    const event = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      details,
      severity: this.calculateSeverity(eventType),
      source: 'gohunta-api'
    };

    await KV.put(`security:${event.id}`, JSON.stringify(event), {
      expirationTtl: 2592000 // 30 days
    });

    if (event.severity === 'CRITICAL') {
      await this.sendAlerts(event);
    }

    return event.id;
  }

  static calculateSeverity(eventType) {
    const severityMap = {
      'UNAUTHORIZED_ACCESS': 'HIGH',
      'BRUTE_FORCE_ATTEMPT': 'HIGH',
      'SQL_INJECTION_ATTEMPT': 'CRITICAL',
      'LOCATION_ACCESS_VIOLATION': 'CRITICAL',
      'MULTIPLE_FAILED_LOGINS': 'MEDIUM',
      'SUSPICIOUS_API_USAGE': 'MEDIUM'
    };

    return severityMap[eventType] || 'LOW';
  }
}
```

## Infrastructure Hardening

### Cloudflare Workers Security Configuration
```javascript
// wrangler.toml security configuration
[env.production]
name = "gohunta-api-prod"
compatibility_flags = ["nodejs_compat"]

[env.production.vars]
# Never store sensitive data in vars - use secrets instead
ENVIRONMENT = "production"
LOG_LEVEL = "info"

# Use wrangler secret for sensitive values:
# wrangler secret put JWT_SECRET
# wrangler secret put DATABASE_URL
# wrangler secret put ENCRYPTION_KEY
```

### D1 Database Security
```sql
-- Create security audit table
CREATE TABLE security_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_id TEXT,
  ip_address TEXT,
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  severity TEXT DEFAULT 'LOW'
);

-- Create indexes for security queries
CREATE INDEX idx_security_audit_type ON security_audit(event_type);
CREATE INDEX idx_security_audit_user ON security_audit(user_id);
CREATE INDEX idx_security_audit_timestamp ON security_audit(timestamp);

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;
```

## Monitoring and Alerting Setup

### Security Metrics Dashboard
```javascript
export class SecurityMetrics {
  static async getSecurityDashboard() {
    const metrics = await Promise.all([
      this.getFailedLoginAttempts(),
      this.getLocationAccessAttempts(),
      this.getSQLInjectionAttempts(),
      this.getAPIAbuseMetrics(),
      this.getGDPRRequestMetrics()
    ]);

    return {
      lastUpdated: new Date().toISOString(),
      metrics: {
        failedLogins: metrics[0],
        locationAccess: metrics[1],
        injectionAttempts: metrics[2],
        apiAbuse: metrics[3],
        gdprRequests: metrics[4]
      },
      alerts: await this.getActiveAlerts(),
      recommendations: await this.getSecurityRecommendations()
    };
  }
}
```

## Testing and Validation

### Automated Security Testing
```bash
#!/bin/bash
# security-test-runner.sh

echo "🔒 Running GoHunta.com Security Tests..."

# Run the comprehensive security test suite
node security/tests/security-test-runner.js

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ All security tests passed"
    exit 0
else
    echo "❌ Security tests failed - deployment blocked"
    exit 1
fi
```

### CI/CD Integration
```yaml
# .github/workflows/security.yml
name: Security Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
      working-directory: security
    
    - name: Run security tests
      run: npm run security:test
      working-directory: security
      env:
        GOHUNTA_URL: ${{ secrets.GOHUNTA_URL }}
        GOHUNTA_API_URL: ${{ secrets.GOHUNTA_API_URL }}
        GOHUNTA_AUTH_TOKEN: ${{ secrets.GOHUNTA_AUTH_TOKEN }}
    
    - name: Upload security report
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: security-report
        path: security/reports/
```

## Deployment Checklist

### Pre-deployment Security Validation
- [ ] All critical vulnerabilities addressed
- [ ] Location data encryption implemented
- [ ] JWT security hardened
- [ ] EXIF data stripping functional
- [ ] SQL injection prevention verified
- [ ] CSP headers implemented
- [ ] Rate limiting active
- [ ] Security monitoring configured
- [ ] GDPR compliance features tested
- [ ] Security test suite passing

### Post-deployment Verification
- [ ] Security headers present
- [ ] HTTPS enforcement working
- [ ] Rate limiting functional
- [ ] Error messages don't leak info
- [ ] Security logging active
- [ ] Monitoring alerts configured
- [ ] Backup encryption verified
- [ ] Access controls tested

## Emergency Response Plan

### Security Incident Response
1. **Detection**: Automated monitoring alerts security team
2. **Assessment**: Evaluate threat severity and impact
3. **Containment**: Isolate affected systems/accounts
4. **Investigation**: Analyze attack vectors and data exposure
5. **Recovery**: Restore services and implement fixes
6. **Communication**: Notify affected users and authorities if required

### Critical Security Contacts
- Security Team Lead: security@gohunta.com
- Emergency Contact: +1-XXX-XXX-XXXX
- Legal/Compliance: compliance@gohunta.com

---

*This document should be reviewed and updated quarterly or after any significant security incidents.*