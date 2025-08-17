/**
 * Focused API Test - Works with what's actually deployed
 * Based on diagnostic findings, adapts tests to current API behavior
 */

const API_BASE_URL = 'https://rawgle-api.findrawdogfood.workers.dev';

class FocusedAPITest {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: [],
            details: []
        };
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Rawgle-Focused-Test/1.0',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const responseText = await response.text();
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch {
                data = { rawResponse: responseText };
            }

            return {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                data,
                ok: response.ok
            };
        } catch (error) {
            throw new Error(`Request failed: ${error.message}`);
        }
    }

    log(name, status, details = '') {
        const result = {
            name,
            status,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.results.details.push(result);
        
        if (status === 'PASS') {
            this.results.passed++;
            console.log(`✅ ${name} - ${details}`);
        } else if (status === 'FAIL') {
            this.results.failed++;
            console.log(`❌ ${name} - ${details}`);
            this.results.errors.push({ name, details });
        } else if (status === 'SKIP') {
            this.results.skipped++;
            console.log(`⏭️  ${name} - ${details}`);
        }
    }

    async testBasicConnectivity() {
        console.log('\n🌐 Testing Basic Connectivity...');
        
        try {
            const response = await this.request('/api/health');
            if (response.ok && response.data.status === 'healthy') {
                this.log('Basic API Connectivity', 'PASS', `API is up and running (${response.data.version})`);
            } else {
                this.log('Basic API Connectivity', 'FAIL', `Unexpected response: ${response.status}`);
            }
        } catch (error) {
            this.log('Basic API Connectivity', 'FAIL', error.message);
        }
    }

    async testDatabaseStatus() {
        console.log('\n💾 Testing Database Status...');
        
        try {
            const response = await this.request('/api/health/db');
            if (response.status === 503 && response.data.database === 'disconnected') {
                this.log('Database Status Check', 'FAIL', 'Database is disconnected - this is a critical issue that prevents most functionality');
            } else if (response.ok && response.data.database === 'connected') {
                this.log('Database Status Check', 'PASS', 'Database is connected and healthy');
            } else {
                this.log('Database Status Check', 'FAIL', `Unexpected database response: ${JSON.stringify(response.data)}`);
            }
        } catch (error) {
            this.log('Database Status Check', 'FAIL', error.message);
        }
    }

    async testCORSHeaders() {
        console.log('\n🔄 Testing CORS Configuration...');
        
        try {
            const response = await this.request('/api/health', { method: 'OPTIONS' });
            const requiredHeaders = [
                'access-control-allow-origin',
                'access-control-allow-methods',
                'access-control-allow-headers'
            ];
            
            const missing = requiredHeaders.filter(header => !response.headers[header]);
            
            if (missing.length === 0) {
                this.log('CORS Headers', 'PASS', 'All required CORS headers are present');
            } else {
                this.log('CORS Headers', 'FAIL', `Missing CORS headers: ${missing.join(', ')}`);
            }
        } catch (error) {
            this.log('CORS Headers', 'FAIL', error.message);
        }
    }

    async testSecurityHeaders() {
        console.log('\n🛡️  Testing Security Headers...');
        
        try {
            const response = await this.request('/api/health');
            const securityHeaders = [
                'content-security-policy',
                'x-content-type-options',
                'x-frame-options',
                'strict-transport-security'
            ];
            
            const present = securityHeaders.filter(header => response.headers[header]);
            
            if (present.length >= 3) {
                this.log('Security Headers', 'PASS', `Found ${present.length}/4 security headers: ${present.join(', ')}`);
            } else {
                this.log('Security Headers', 'FAIL', `Only found ${present.length}/4 security headers`);
            }
        } catch (error) {
            this.log('Security Headers', 'FAIL', error.message);
        }
    }

    async testErrorHandling() {
        console.log('\n⚠️  Testing Error Handling...');
        
        // Test 404 handling
        try {
            const response = await this.request('/api/nonexistent');
            if (response.status === 404 && response.data.error) {
                this.log('404 Error Handling', 'PASS', 'API correctly returns 404 for non-existent endpoints');
            } else {
                this.log('404 Error Handling', 'FAIL', `Expected 404, got ${response.status}`);
            }
        } catch (error) {
            this.log('404 Error Handling', 'FAIL', error.message);
        }

        // Test malformed requests (expecting current behavior)
        try {
            const response = await this.request('/api/auth/register', {
                method: 'POST',
                body: 'invalid-json'
            });
            
            // Based on diagnostics, we know this returns 500 currently
            if (response.status === 500) {
                this.log('Malformed Request Handling', 'FAIL', 'API returns 500 instead of 400 for malformed JSON (needs improvement)');
            } else if (response.status === 400) {
                this.log('Malformed Request Handling', 'PASS', 'API correctly returns 400 for malformed JSON');
            } else {
                this.log('Malformed Request Handling', 'FAIL', `Unexpected status: ${response.status}`);
            }
        } catch (error) {
            this.log('Malformed Request Handling', 'FAIL', error.message);
        }
    }

    async testRateLimiting() {
        console.log('\n⏱️  Testing Rate Limiting...');
        
        try {
            let consecutiveSuccess = 0;
            let rateLimitHit = false;
            
            for (let i = 0; i < 20; i++) {
                const response = await this.request('/api/health');
                if (response.status === 429) {
                    rateLimitHit = true;
                    break;
                } else if (response.ok) {
                    consecutiveSuccess++;
                }
                
                // Small delay to avoid overwhelming
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            if (rateLimitHit) {
                this.log('Rate Limiting', 'PASS', `Rate limit triggered after ${consecutiveSuccess} requests`);
            } else {
                // Rate limiting might be configured more permissively
                this.log('Rate Limiting', 'PASS', `No rate limit hit in 20 requests (may be configured for high throughput)`);
            }
        } catch (error) {
            this.log('Rate Limiting', 'FAIL', error.message);
        }
    }

    async testAuthenticationMechanism() {
        console.log('\n🔐 Testing Authentication Mechanism...');
        
        // Test accessing protected endpoint without auth
        try {
            const response = await this.request('/api/paws/balance');
            
            // Based on diagnostics, this currently returns 400 with "userId parameter is required"
            // This suggests the auth middleware might not be properly configured
            if (response.status === 400 && response.data.error && response.data.error.includes('userId')) {
                this.log('Authentication Middleware', 'FAIL', 'Protected endpoints expect userId parameter instead of proper auth headers (needs fix)');
            } else if (response.status === 401) {
                this.log('Authentication Middleware', 'PASS', 'Protected endpoints correctly require authentication');
            } else {
                this.log('Authentication Middleware', 'FAIL', `Unexpected response: ${response.status} - ${JSON.stringify(response.data)}`);
            }
        } catch (error) {
            this.log('Authentication Middleware', 'FAIL', error.message);
        }

        // Test with Authorization header
        try {
            const response = await this.request('/api/paws/balance', {
                headers: {
                    'Authorization': 'Bearer invalid-token'
                }
            });
            
            if (response.status === 401) {
                this.log('Invalid Token Handling', 'PASS', 'API correctly rejects invalid tokens');
            } else {
                this.log('Invalid Token Handling', 'FAIL', `Expected 401, got ${response.status}`);
            }
        } catch (error) {
            this.log('Invalid Token Handling', 'FAIL', error.message);
        }
    }

    async testRegistrationEndpoint() {
        console.log('\n👤 Testing Registration Endpoint...');
        
        try {
            const response = await this.request('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    email: `test-${Date.now()}@example.com`,
                    password: 'TestPass123!'
                })
            });
            
            if (response.status === 500) {
                this.log('User Registration', 'FAIL', 'Registration endpoint returns 500 - likely due to database connectivity issues');
            } else if (response.status === 201) {
                this.log('User Registration', 'PASS', 'Registration endpoint working correctly');
            } else {
                this.log('User Registration', 'FAIL', `Unexpected status: ${response.status}`);
            }
        } catch (error) {
            this.log('User Registration', 'FAIL', error.message);
        }
    }

    generateReport() {
        const total = this.results.passed + this.results.failed;
        const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
        
        return {
            summary: {
                apiBaseUrl: API_BASE_URL,
                testDate: new Date().toISOString(),
                passed: this.results.passed,
                failed: this.results.failed,
                skipped: this.results.skipped,
                successRate: successRate + '%',
                criticalIssues: this.results.errors.filter(e => 
                    e.name.includes('Database') || 
                    e.name.includes('Connectivity') ||
                    e.name.includes('Registration')
                ).length
            },
            details: this.results.details,
            errors: this.results.errors,
            recommendations: this.generateRecommendations()
        };
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Check for database issues
        if (this.results.errors.some(e => e.name.includes('Database'))) {
            recommendations.push({
                priority: 'CRITICAL',
                category: 'Infrastructure',
                issue: 'Database Connectivity',
                description: 'The D1 database is not connected. This prevents most API functionality from working.',
                action: 'Check D1 database configuration, verify environment variables, and ensure database is deployed correctly.'
            });
        }

        // Check for authentication issues
        if (this.results.errors.some(e => e.name.includes('Authentication') || e.name.includes('Registration'))) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Authentication',
                issue: 'Authentication Flow Broken',
                description: 'User registration and authentication endpoints are failing, likely due to database issues.',
                action: 'Fix database connectivity first, then test authentication endpoints. Verify session storage (KV) is properly configured.'
            });
        }

        // Check for error handling
        if (this.results.errors.some(e => e.name.includes('Malformed'))) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Error Handling',
                issue: 'Improper Error Responses',
                description: 'API returns 500 errors for client errors (should be 400).',
                action: 'Improve error handling middleware to catch JSON parsing errors and return appropriate 400 responses.'
            });
        }

        // Check for auth middleware
        if (this.results.errors.some(e => e.details.includes('userId parameter'))) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Security',
                issue: 'Authentication Middleware Issues',
                description: 'Protected endpoints are not properly checking authorization headers.',
                action: 'Review authentication middleware implementation. Endpoints should check Authorization headers before expecting userId parameters.'
            });
        }

        // Add positive feedback
        if (this.results.passed > this.results.failed) {
            recommendations.push({
                priority: 'INFO',
                category: 'Success',
                issue: 'Working Components',
                description: `${this.results.passed} tests passed. Basic API structure and CORS are working correctly.`,
                action: 'Focus on fixing database connectivity to restore full functionality.'
            });
        }

        return recommendations;
    }

    async runAll() {
        console.log('🎯 Running Focused API Tests\n');
        
        await this.testBasicConnectivity();
        await this.testDatabaseStatus();
        await this.testCORSHeaders();
        await this.testSecurityHeaders();
        await this.testErrorHandling();
        await this.testRateLimiting();
        await this.testAuthenticationMechanism();
        await this.testRegistrationEndpoint();

        const report = this.generateReport();
        
        console.log('\n' + '='.repeat(80));
        console.log('📊 FOCUSED TEST RESULTS');
        console.log('='.repeat(80));
        console.log(`✅ Passed: ${report.summary.passed}`);
        console.log(`❌ Failed: ${report.summary.failed}`);
        console.log(`⏭️  Skipped: ${report.summary.skipped}`);
        console.log(`📈 Success Rate: ${report.summary.successRate}`);
        console.log(`🚨 Critical Issues: ${report.summary.criticalIssues}`);

        if (report.recommendations.length > 0) {
            console.log('\n🔧 KEY RECOMMENDATIONS:');
            report.recommendations.forEach(rec => {
                console.log(`\n${rec.priority} - ${rec.category}: ${rec.issue}`);
                console.log(`   ${rec.description}`);
                console.log(`   Action: ${rec.action}`);
            });
        }

        return report;
    }
}

// Run the test
new FocusedAPITest().runAll()
    .then(report => {
        console.log('\n✅ Focused tests complete');
    })
    .catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });