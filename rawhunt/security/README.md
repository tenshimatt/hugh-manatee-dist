# GoHunta.com Security Testing Suite

A comprehensive security testing and vulnerability assessment framework designed specifically for the GoHunta.com hunting community platform.

## Overview

This security testing suite addresses the unique security challenges of a hunting community platform, including:

- **Location Data Protection**: GPS coordinates and hunting spot privacy
- **Photo Metadata Security**: EXIF data stripping and privacy protection
- **Community Safety**: Social engineering and trust exploitation prevention
- **Regulatory Compliance**: GDPR, CCPA, and hunting license regulations
- **Infrastructure Security**: Cloudflare Workers, D1 database, KV store security

## Features

### 🔐 Authentication Security Testing
- JWT token validation and tampering detection
- Multi-factor authentication (MFA) security
- Session management and fixation prevention
- Brute force attack protection
- Password strength enforcement

### 🌐 API Security Testing
- SQL injection prevention across all endpoints
- Cross-site scripting (XSS) protection
- CORS configuration validation
- Input validation and sanitization
- Parameter tampering prevention

### 📍 Data Protection Testing
- GPS coordinate encryption verification
- Location precision reduction testing
- Photo EXIF data stripping validation
- GDPR compliance verification
- Data retention policy enforcement

### 📱 PWA Security Testing
- Service Worker security model validation
- Content Security Policy (CSP) effectiveness
- Offline data protection verification
- Local storage security assessment
- Web app manifest security

### 🏗️ Infrastructure Security Testing
- Cloudflare Workers security boundaries
- D1 database access controls
- KV store encryption and isolation
- Environment variable protection
- Secrets management validation

## Installation

```bash
# Clone the repository
git clone https://github.com/gohunta/security-testing-suite.git
cd security-testing-suite

# Install dependencies
npm install

# Install optional security tools
npm run install-tools
```

## Configuration

Create a `.env` file in the security directory:

```env
# Target URLs
GOHUNTA_URL=https://gohunta.com
GOHUNTA_API_URL=https://api.gohunta.com

# Authentication tokens
GOHUNTA_AUTH_TOKEN=your_test_user_token
GOHUNTA_ADMIN_TOKEN=your_admin_token

# Cloudflare configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# Test configuration
TEST_USER_ID=security-test-user
OUTPUT_DIR=./reports
FAIL_ON_CRITICAL=true
```

## Usage

### Run All Security Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Authentication security only
npm run test:auth

# API security only
npm run test:api

# Data protection only
npm run test:data

# PWA security only
npm run test:pwa

# Infrastructure security only
npm run test:infrastructure
```

### CI/CD Integration
```bash
# For CI/CD pipelines - exits with error code on critical issues
npm run test:ci
```

### Generate Reports
```bash
# Generate comprehensive security report
npm run report

# Check compliance status
npm run compliance
```

## Test Results

After running tests, results are generated in multiple formats:

- **Markdown Report**: `reports/security-test-report.md`
- **JSON Results**: `reports/security-test-results.json`
- **HTML Dashboard**: `reports/security-dashboard.html`
- **CSV Export**: `reports/vulnerability-summary.csv`

## Security Test Categories

### Critical Priority Tests
- Location data encryption
- JWT token security
- SQL injection prevention
- Authentication bypass
- Sensitive data exposure

### High Priority Tests
- XSS prevention
- CSRF protection
- File upload security
- Session management
- Access control validation

### Medium Priority Tests
- Rate limiting
- Input validation
- Error handling
- Security headers
- CORS configuration

### Low Priority Tests
- Information disclosure
- Security logging
- Monitoring effectiveness
- Documentation completeness

## Compliance Testing

### GDPR Compliance
- Data subject access rights
- Right to erasure (right to be forgotten)
- Data portability
- Consent management
- Privacy policy compliance

### OWASP Top 10 Coverage
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable Components
- A07: Authentication Failures
- A08: Software/Data Integrity Failures
- A09: Logging/Monitoring Failures
- A10: Server-Side Request Forgery

### Hunting-Specific Privacy
- Location data protection
- Photo metadata sanitization
- Community safety measures
- Anti-hunting activist protection

## Automated Testing Pipeline

### GitHub Actions Integration
```yaml
name: Security Testing
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
        working-directory: security
      - run: npm run test:ci
        working-directory: security
        env:
          GOHUNTA_URL: ${{ secrets.GOHUNTA_URL }}
          GOHUNTA_API_URL: ${{ secrets.GOHUNTA_API_URL }}
          GOHUNTA_AUTH_TOKEN: ${{ secrets.GOHUNTA_AUTH_TOKEN }}
```

### Pre-commit Hooks
```bash
# Install pre-commit security checks
npx husky install
npx husky add .husky/pre-commit "cd security && npm run test:critical"
```

## Penetration Testing

### Manual Testing Guidance
The suite includes guidance for manual penetration testing:

1. **Reconnaissance**: Information gathering and attack surface mapping
2. **Vulnerability Discovery**: Automated and manual vulnerability identification
3. **Exploitation**: Safe exploitation of identified vulnerabilities
4. **Post-Exploitation**: Impact assessment and lateral movement testing
5. **Reporting**: Comprehensive vulnerability documentation

### External Tools Integration
- **OWASP ZAP**: Web application security scanner
- **SQLMap**: SQL injection detection and exploitation
- **Nikto**: Web server scanner
- **Burp Suite**: Web vulnerability scanner (Professional)

## Security Monitoring

### Real-time Monitoring
```javascript
// Integration with security monitoring
import { SecurityMonitoring } from './tools/monitoring.js';

const monitor = new SecurityMonitoring({
  alertThreshold: 'HIGH',
  notificationWebhook: process.env.SECURITY_WEBHOOK,
  retentionDays: 90
});

monitor.startRealTimeMonitoring();
```

### Alerting Configuration
- **Critical Issues**: Immediate Slack/email notification
- **High Issues**: Notification within 1 hour
- **Medium Issues**: Daily digest
- **Low Issues**: Weekly summary

## Contributing

### Adding New Tests
1. Create test file in appropriate category directory
2. Extend the corresponding test class
3. Add test execution to the main runner
4. Update documentation and examples

### Test Development Guidelines
- Follow the existing test structure and naming conventions
- Include both positive and negative test cases
- Provide clear assertions and error messages
- Add appropriate logging and metrics collection
- Ensure tests are idempotent and don't affect production data

### Security Considerations
- Never store real credentials in test files
- Use mock data that doesn't expose actual hunting locations
- Ensure tests don't create actual vulnerabilities
- Follow responsible disclosure practices

## Troubleshooting

### Common Issues

**Tests failing due to network timeouts:**
```bash
# Increase timeout values
export TEST_TIMEOUT=300000
npm test
```

**Browser automation issues:**
```bash
# Install additional dependencies for Puppeteer
sudo apt-get install -y gconf-service libasound2-dev libatk1.0-dev
```

**Database connection errors:**
```bash
# Verify D1 database access
wrangler d1 execute your-database --command "SELECT 1"
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=security:* npm test
```

## Security Hardening

Based on test results, the suite provides actionable hardening recommendations:

- **Critical**: Immediate action required (0-24 hours)
- **High**: Address within 7 days
- **Medium**: Address within 30 days
- **Low**: Address within 90 days

See `reports/security-hardening-recommendations.md` for detailed guidance.

## License

This security testing suite is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## Support and Contact

- **Security Issues**: security@gohunta.com
- **Bug Reports**: https://github.com/gohunta/security-testing-suite/issues
- **Documentation**: https://docs.gohunta.com/security
- **Emergency Contact**: +1-XXX-XXX-XXXX

## Changelog

### Version 1.0.0 (2025-08-14)
- Initial release
- Comprehensive security testing framework
- GDPR compliance validation
- OWASP Top 10 coverage
- Hunting-specific privacy protection
- Automated CI/CD integration
- Real-time security monitoring

---

**⚠️ Important Security Notice**: This testing suite is designed for authorized security testing only. Do not run these tests against systems you don't own or don't have explicit permission to test. Always follow responsible disclosure practices when reporting security vulnerabilities.