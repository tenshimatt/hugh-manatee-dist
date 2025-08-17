/**
 * GoHunta.com Comprehensive Security Test Runner
 * Orchestrates all security test suites and generates consolidated reports
 */

import AuthSecurityTests from './auth-security-tests.js';
import APISecurityTests from './api-security-tests.js';
import DataProtectionTests from './data-protection-tests.js';
import PWASecurityTests from './pwa-security-tests.js';
import InfrastructureSecurityTests from './infrastructure-security-tests.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SecurityTestRunner {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://gohunta.com',
      apiUrl: config.apiUrl || 'https://api.gohunta.com',
      authToken: config.authToken,
      adminToken: config.adminToken,
      testUserId: config.testUserId || 'security-test-user',
      outputDir: config.outputDir || path.join(__dirname, '../reports'),
      ...config
    };

    this.results = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        passRate: 0,
        securityScore: 0
      },
      testSuites: {
        authentication: null,
        apiSecurity: null,
        dataProtection: null,
        pwaSecurity: null,
        infrastructure: null
      },
      recommendations: [],
      compliance: {
        gdpr: { score: 0, issues: [] },
        owasp: { score: 0, issues: [] },
        privacy: { score: 0, issues: [] }
      },
      executionTime: 0,
      timestamp: new Date().toISOString()
    };

    this.testSuites = [];
  }

  async runComprehensiveSecurityTests() {
    console.log('🔒 GoHunta.com Comprehensive Security Testing Suite');
    console.log('=' .repeat(60));
    console.log(`📅 Started: ${new Date().toLocaleString()}`);
    console.log(`🎯 Target: ${this.config.baseUrl}`);
    console.log(`🔗 API: ${this.config.apiUrl}\n`);

    const startTime = Date.now();

    try {
      // Initialize test suites
      await this.initializeTestSuites();

      // Run all security test suites
      console.log('🚀 Running Security Test Suites...\n');
      
      if (this.shouldRunSuite('authentication')) {
        await this.runAuthenticationTests();
      }

      if (this.shouldRunSuite('api')) {
        await this.runAPISecurityTests();
      }

      if (this.shouldRunSuite('data')) {
        await this.runDataProtectionTests();
      }

      if (this.shouldRunSuite('pwa')) {
        await this.runPWASecurityTests();
      }

      if (this.shouldRunSuite('infrastructure')) {
        await this.runInfrastructureTests();
      }

      // Calculate overall results
      this.calculateOverallResults();

      // Generate security recommendations
      await this.generateSecurityRecommendations();

      // Generate compliance reports
      await this.generateComplianceReports();

      this.results.executionTime = Date.now() - startTime;

      // Output consolidated report
      await this.generateConsolidatedReport();

      // Output JSON results for CI/CD integration
      await this.exportResults();

      console.log('\n' + '=' .repeat(60));
      console.log('✅ Security Testing Complete!');
      console.log(`⏱️ Total execution time: ${(this.results.executionTime / 1000).toFixed(2)}s`);
      console.log(`📊 Overall Security Score: ${this.results.summary.securityScore}/100`);

      if (this.results.summary.critical > 0) {
        console.log('\n🚨 CRITICAL SECURITY ISSUES DETECTED - IMMEDIATE ACTION REQUIRED');
        process.exit(1);
      }

      return this.results;

    } catch (error) {
      console.error('❌ Security testing failed:', error);
      throw error;
    }
  }

  async initializeTestSuites() {
    console.log('🔧 Initializing test suites...\n');

    this.testSuites = {
      auth: new AuthSecurityTests(this.config),
      api: new APISecurityTests(this.config),
      data: new DataProtectionTests(this.config),
      pwa: new PWASecurityTests(this.config),
      infrastructure: new InfrastructureSecurityTests(this.config)
    };

    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  async runAuthenticationTests() {
    console.log('🔐 Running Authentication Security Tests...');
    try {
      const results = await this.testSuites.auth.runAllAuthTests();
      this.results.testSuites.authentication = results;
      console.log('✅ Authentication tests completed\n');
    } catch (error) {
      console.error('❌ Authentication tests failed:', error.message);
      this.results.testSuites.authentication = { error: error.message };
    }
  }

  async runAPISecurityTests() {
    console.log('🌐 Running API Security Tests...');
    try {
      const results = await this.testSuites.api.runAllAPISecurityTests();
      this.results.testSuites.apiSecurity = results;
      console.log('✅ API security tests completed\n');
    } catch (error) {
      console.error('❌ API security tests failed:', error.message);
      this.results.testSuites.apiSecurity = { error: error.message };
    }
  }

  async runDataProtectionTests() {
    console.log('🔒 Running Data Protection Tests...');
    try {
      const results = await this.testSuites.data.runAllDataProtectionTests();
      this.results.testSuites.dataProtection = results;
      console.log('✅ Data protection tests completed\n');
    } catch (error) {
      console.error('❌ Data protection tests failed:', error.message);
      this.results.testSuites.dataProtection = { error: error.message };
    }
  }

  async runPWASecurityTests() {
    console.log('📱 Running PWA Security Tests...');
    try {
      const results = await this.testSuites.pwa.runAllPWASecurityTests();
      this.results.testSuites.pwaSecurity = results;
      console.log('✅ PWA security tests completed\n');
    } catch (error) {
      console.error('❌ PWA security tests failed:', error.message);
      this.results.testSuites.pwaSecurity = { error: error.message };
    }
  }

  async runInfrastructureTests() {
    console.log('🏗️ Running Infrastructure Security Tests...');
    try {
      const results = await this.testSuites.infrastructure.runAllInfrastructureTests();
      this.results.testSuites.infrastructure = results;
      console.log('✅ Infrastructure tests completed\n');
    } catch (error) {
      console.error('❌ Infrastructure tests failed:', error.message);
      this.results.testSuites.infrastructure = { error: error.message };
    }
  }

  calculateOverallResults() {
    console.log('📊 Calculating overall security metrics...\n');

    const suites = Object.values(this.results.testSuites).filter(suite => suite && !suite.error);

    this.results.summary = suites.reduce((summary, suite) => {
      return {
        totalTests: summary.totalTests + (suite.passed + suite.failed),
        passed: summary.passed + suite.passed,
        failed: summary.failed + suite.failed,
        critical: summary.critical + suite.critical,
        high: summary.high + suite.high,
        medium: summary.medium + suite.medium,
        low: summary.low + suite.low
      };
    }, this.results.summary);

    // Calculate pass rate
    this.results.summary.passRate = this.results.summary.totalTests > 0 
      ? (this.results.summary.passed / this.results.summary.totalTests * 100)
      : 0;

    // Calculate security score (weighted by severity)
    const totalIssues = this.results.summary.failed;
    if (totalIssues === 0) {
      this.results.summary.securityScore = 100;
    } else {
      const weightedScore = 100 - (
        (this.results.summary.critical * 25) +
        (this.results.summary.high * 15) +
        (this.results.summary.medium * 8) +
        (this.results.summary.low * 3)
      );
      this.results.summary.securityScore = Math.max(0, Math.min(100, weightedScore));
    }

    console.log('📈 Security Metrics Summary:');
    console.log(`   Total Tests: ${this.results.summary.totalTests}`);
    console.log(`   Passed: ${this.results.summary.passed}`);
    console.log(`   Failed: ${this.results.summary.failed}`);
    console.log(`   Pass Rate: ${this.results.summary.passRate.toFixed(2)}%`);
    console.log(`   Security Score: ${this.results.summary.securityScore.toFixed(1)}/100\n`);
  }

  async generateSecurityRecommendations() {
    console.log('💡 Generating security recommendations...\n');

    const recommendations = [];

    // Critical recommendations
    if (this.results.summary.critical > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Immediate Action Required',
        title: 'Critical Security Vulnerabilities Detected',
        description: `${this.results.summary.critical} critical security issues require immediate attention to prevent potential data breaches and system compromise.`,
        action: 'Address all critical vulnerabilities within 24 hours',
        impact: 'Data breach, system compromise, regulatory violations'
      });
    }

    // High priority recommendations
    if (this.results.summary.high > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Security Hardening',
        title: 'High-Priority Security Issues',
        description: `${this.results.summary.high} high-priority security issues should be addressed to strengthen overall security posture.`,
        action: 'Resolve high-priority issues within 7 days',
        impact: 'Increased attack surface, potential vulnerabilities'
      });
    }

    // Authentication-specific recommendations
    const authResults = this.results.testSuites.authentication;
    if (authResults && (authResults.critical > 0 || authResults.high > 0)) {
      recommendations.push({
        priority: authResults.critical > 0 ? 'CRITICAL' : 'HIGH',
        category: 'Authentication Security',
        title: 'Authentication System Hardening Required',
        description: 'Authentication vulnerabilities detected that could lead to unauthorized access.',
        action: 'Implement MFA, strengthen JWT validation, add rate limiting',
        impact: 'Account takeover, unauthorized access to sensitive hunting data'
      });
    }

    // Data protection recommendations
    const dataResults = this.results.testSuites.dataProtection;
    if (dataResults && (dataResults.critical > 0 || dataResults.high > 0)) {
      recommendations.push({
        priority: dataResults.critical > 0 ? 'CRITICAL' : 'HIGH',
        category: 'Data Protection',
        title: 'Location Data and Privacy Protection Required',
        description: 'GPS coordinates and sensitive hunting data may be at risk of exposure.',
        action: 'Implement AES-256 encryption, strip EXIF data, add GPS precision reduction',
        impact: 'Hunting spot exposure, privacy violations, GDPR non-compliance'
      });
    }

    // Infrastructure recommendations
    const infraResults = this.results.testSuites.infrastructure;
    if (infraResults && (infraResults.critical > 0 || infraResults.high > 0)) {
      recommendations.push({
        priority: infraResults.critical > 0 ? 'CRITICAL' : 'HIGH',
        category: 'Infrastructure Security',
        title: 'Infrastructure Security Hardening',
        description: 'Cloudflare Workers, database, or secrets management issues detected.',
        action: 'Secure environment variables, implement access controls, audit database security',
        impact: 'System compromise, data exposure, service disruption'
      });
    }

    // General recommendations based on score
    if (this.results.summary.securityScore < 70) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Overall Security',
        title: 'Comprehensive Security Review Required',
        description: `Security score of ${this.results.summary.securityScore.toFixed(1)}/100 indicates significant security gaps.`,
        action: 'Conduct comprehensive security audit and implement security-first development practices',
        impact: 'Multiple attack vectors, increased risk of security incidents'
      });
    }

    this.results.recommendations = recommendations;
  }

  async generateComplianceReports() {
    console.log('📋 Generating compliance reports...\n');

    // GDPR Compliance Assessment
    const dataResults = this.results.testSuites.dataProtection;
    if (dataResults && dataResults.gdprTests) {
      const gdprPassed = dataResults.gdprTests.filter(test => test.compliant !== false).length;
      const gdprTotal = dataResults.gdprTests.length;
      
      this.results.compliance.gdpr = {
        score: gdprTotal > 0 ? (gdprPassed / gdprTotal * 100) : 0,
        issues: dataResults.gdprTests
          .filter(test => test.compliant === false)
          .map(test => ({
            requirement: test.test,
            issue: test.description || 'Non-compliant implementation',
            severity: 'HIGH'
          }))
      };
    }

    // OWASP Top 10 Compliance
    const apiResults = this.results.testSuites.apiSecurity;
    let owaspScore = 100;
    const owaspIssues = [];

    if (apiResults) {
      if (apiResults.critical > 0) {
        owaspScore -= 30;
        owaspIssues.push({
          vulnerability: 'Critical API vulnerabilities',
          category: 'A01:2021 – Broken Access Control',
          severity: 'CRITICAL'
        });
      }
      
      if (apiResults.sqlInjectionTests?.some(test => !test.blocked)) {
        owaspScore -= 25;
        owaspIssues.push({
          vulnerability: 'SQL Injection vulnerabilities',
          category: 'A03:2021 – Injection',
          severity: 'CRITICAL'
        });
      }

      if (apiResults.xssTests?.some(test => !test.sanitized)) {
        owaspScore -= 20;
        owaspIssues.push({
          vulnerability: 'Cross-Site Scripting (XSS)',
          category: 'A03:2021 – Injection',
          severity: 'HIGH'
        });
      }
    }

    this.results.compliance.owasp = {
      score: Math.max(0, owaspScore),
      issues: owaspIssues
    };

    // Privacy Compliance (Hunting-specific)
    const privacyScore = this.calculatePrivacyScore();
    this.results.compliance.privacy = {
      score: privacyScore.score,
      issues: privacyScore.issues
    };
  }

  calculatePrivacyScore() {
    let score = 100;
    const issues = [];

    const locationResults = this.results.testSuites.dataProtection?.locationTests || [];
    const photoResults = this.results.testSuites.dataProtection?.photoTests || [];

    // Location privacy
    const locationIssues = locationResults.filter(test => 
      !test.encrypted || !test.precisionReduced
    );
    if (locationIssues.length > 0) {
      score -= 40;
      issues.push({
        category: 'Location Privacy',
        issue: 'GPS coordinates not properly protected',
        severity: 'CRITICAL'
      });
    }

    // Photo privacy
    const photoIssues = photoResults.filter(test => 
      test.processedHasEXIF || test.test === 'exif_stripping' && !test.strippedMetadata
    );
    if (photoIssues.length > 0) {
      score -= 30;
      issues.push({
        category: 'Photo Privacy',
        issue: 'Photo metadata not properly stripped',
        severity: 'HIGH'
      });
    }

    return { score: Math.max(0, score), issues };
  }

  async generateConsolidatedReport() {
    const reportPath = path.join(this.config.outputDir, 'security-test-report.md');
    
    const report = `# GoHunta.com Security Test Report

## Executive Summary

**Security Score**: ${this.results.summary.securityScore.toFixed(1)}/100
**Test Execution**: ${new Date(this.results.timestamp).toLocaleString()}
**Duration**: ${(this.results.executionTime / 1000).toFixed(2)} seconds

### Results Overview
- **Total Tests**: ${this.results.summary.totalTests}
- **Passed**: ${this.results.summary.passed}
- **Failed**: ${this.results.summary.failed}
- **Pass Rate**: ${this.results.summary.passRate.toFixed(2)}%

### Severity Breakdown
- 🔴 **Critical**: ${this.results.summary.critical}
- 🟠 **High**: ${this.results.summary.high}
- 🟡 **Medium**: ${this.results.summary.medium}
- 🟢 **Low**: ${this.results.summary.low}

## Test Suite Results

### Authentication Security
${this.formatTestSuiteResults(this.results.testSuites.authentication)}

### API Security
${this.formatTestSuiteResults(this.results.testSuites.apiSecurity)}

### Data Protection
${this.formatTestSuiteResults(this.results.testSuites.dataProtection)}

### PWA Security
${this.formatTestSuiteResults(this.results.testSuites.pwaSecurity)}

### Infrastructure Security
${this.formatTestSuiteResults(this.results.testSuites.infrastructure)}

## Security Recommendations

${this.results.recommendations.map(rec => `
### ${rec.title} (${rec.priority})
**Category**: ${rec.category}
**Description**: ${rec.description}
**Action Required**: ${rec.action}
**Potential Impact**: ${rec.impact}
`).join('\n')}

## Compliance Status

### GDPR Compliance
- **Score**: ${this.results.compliance.gdpr.score.toFixed(1)}%
- **Issues**: ${this.results.compliance.gdpr.issues.length}

### OWASP Top 10 Compliance
- **Score**: ${this.results.compliance.owasp.score.toFixed(1)}%
- **Issues**: ${this.results.compliance.owasp.issues.length}

### Privacy Compliance
- **Score**: ${this.results.compliance.privacy.score.toFixed(1)}%
- **Issues**: ${this.results.compliance.privacy.issues.length}

## Next Steps

1. **Immediate Action**: Address all critical vulnerabilities within 24 hours
2. **Short Term**: Resolve high-priority issues within 7 days
3. **Long Term**: Implement comprehensive security monitoring and regular testing

---
*Report generated by GoHunta.com Security Test Suite*
`;

    fs.writeFileSync(reportPath, report);
    console.log(`📄 Consolidated report saved to: ${reportPath}`);
  }

  formatTestSuiteResults(results) {
    if (!results) return 'Not executed';
    if (results.error) return `Error: ${results.error}`;
    
    return `
- **Passed**: ${results.passed}
- **Failed**: ${results.failed}
- **Critical**: ${results.critical}
- **High**: ${results.high}
- **Medium**: ${results.medium}
- **Low**: ${results.low}
`;
  }

  async exportResults() {
    const resultsPath = path.join(this.config.outputDir, 'security-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    console.log(`📊 Results exported to: ${resultsPath}`);
  }

  shouldRunSuite(suiteType) {
    // Allow selective test suite execution via config
    if (this.config.suites && Array.isArray(this.config.suites)) {
      return this.config.suites.includes(suiteType);
    }
    return true; // Run all suites by default
  }
}

// CLI execution support
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = {
    baseUrl: process.env.GOHUNTA_URL || 'https://gohunta.com',
    apiUrl: process.env.GOHUNTA_API_URL || 'https://api.gohunta.com',
    authToken: process.env.GOHUNTA_AUTH_TOKEN,
    adminToken: process.env.GOHUNTA_ADMIN_TOKEN,
    suites: process.env.TEST_SUITES?.split(',') || null
  };

  const runner = new SecurityTestRunner(config);
  
  runner.runComprehensiveSecurityTests()
    .then(results => {
      console.log('\n🎉 Security testing completed successfully!');
      process.exit(results.summary.critical > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n💥 Security testing failed:', error);
      process.exit(1);
    });
}

export default SecurityTestRunner;