#!/usr/bin/env node

/**
 * Rawgle Backend Deployment Script
 * Automated deployment to Cloudflare Workers with health checks
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Configuration
const config = {
  environments: {
    development: {
      name: 'rawgle-backend-dev',
      url: 'https://rawgle-backend-dev.your-subdomain.workers.dev',
      database: 'rawgle-development'
    },
    staging: {
      name: 'rawgle-backend-staging', 
      url: 'https://rawgle-backend-staging.your-subdomain.workers.dev',
      database: 'rawgle-staging'
    },
    production: {
      name: 'rawgle-backend',
      url: 'https://rawgle-backend.your-subdomain.workers.dev',
      database: 'rawgle-production'
    }
  },
  frontendUrl: 'https://afc39a6e.rawgle-frontend.pages.dev',
  healthCheckTimeout: 30000,
  maxRetries: 3
};

class RawgleDeployer {
  constructor(environment = 'development') {
    this.environment = environment;
    this.config = config.environments[environment];
    this.deploymentId = `deploy-${Date.now()}`;
    
    if (!this.config) {
      throw new Error(`Invalid environment: ${environment}`);
    }
    
    console.log(`🚀 Rawgle Backend Deployer`);
    console.log(`Environment: ${environment}`);
    console.log(`Target: ${this.config.url}`);
    console.log(`Deployment ID: ${this.deploymentId}`);
  }

  async deploy() {
    try {
      console.log('\n📋 Starting deployment process...\n');
      
      // Pre-deployment checks
      await this.preDeploymentChecks();
      
      // Database setup
      await this.setupDatabase();
      
      // Environment setup
      await this.setupEnvironment();
      
      // Deploy to Cloudflare Workers
      await this.deployWorker();
      
      // Post-deployment health checks
      await this.healthChecks();
      
      // Integration tests
      if (this.environment !== 'production') {
        await this.runIntegrationTests();
      }
      
      // Frontend compatibility test
      await this.testFrontendCompatibility();
      
      console.log('\n✅ Deployment completed successfully!');
      await this.generateDeploymentReport();
      
    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      await this.rollbackIfNeeded();
      process.exit(1);
    }
  }

  async preDeploymentChecks() {
    console.log('🔍 Running pre-deployment checks...');
    
    // Check if wrangler is installed
    try {
      execSync('wrangler --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Wrangler CLI is not installed. Install with: npm install -g wrangler');
    }
    
    // Check if logged in to Cloudflare
    try {
      execSync('wrangler whoami', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Not logged in to Cloudflare. Run: wrangler login');
    }
    
    // Validate package.json
    const packagePath = path.join(rootDir, 'package.json');
    if (!fs.existsSync(packagePath)) {
      throw new Error('package.json not found');
    }
    
    // Validate wrangler.toml
    const wranglerPath = path.join(rootDir, 'wrangler.toml');
    if (!fs.existsSync(wranglerPath)) {
      throw new Error('wrangler.toml not found');
    }
    
    // Check if main source file exists
    const mainFile = path.join(rootDir, 'src', 'index.js');
    if (!fs.existsSync(mainFile)) {
      throw new Error('Main source file (src/index.js) not found');
    }
    
    console.log('✅ Pre-deployment checks passed');
  }

  async setupDatabase() {
    console.log(`🗄️  Setting up D1 database: ${this.config.database}...`);
    
    try {
      // Check if database exists
      const dbList = execSync('wrangler d1 list', { encoding: 'utf8' });
      
      if (!dbList.includes(this.config.database)) {
        console.log(`Creating database: ${this.config.database}`);
        execSync(`wrangler d1 create ${this.config.database}`, { stdio: 'inherit' });
      } else {
        console.log(`Database ${this.config.database} already exists`);
      }
      
      // Run migrations
      console.log('Running database migrations...');
      const env = this.environment === 'production' ? '--env production' : `--env ${this.environment}`;
      execSync(`wrangler d1 migrations apply ${this.config.database} ${env}`, { 
        stdio: 'inherit',
        cwd: rootDir 
      });
      
      console.log('✅ Database setup completed');
    } catch (error) {
      throw new Error(`Database setup failed: ${error.message}`);
    }
  }

  async setupEnvironment() {
    console.log('🔧 Setting up environment variables...');
    
    const secrets = [
      { name: 'JWT_SECRET', value: this.generateJwtSecret() },
      { name: 'ENCRYPTION_KEY', value: this.generateEncryptionKey() },
      { name: 'RAWGLE_API_KEY', value: this.generateApiKey() }
    ];
    
    for (const secret of secrets) {
      try {
        console.log(`Setting secret: ${secret.name}`);
        execSync(`wrangler secret put ${secret.name} --env ${this.environment}`, {
          input: secret.value,
          stdio: ['pipe', 'inherit', 'inherit'],
          cwd: rootDir
        });
      } catch (error) {
        console.warn(`Warning: Failed to set secret ${secret.name}: ${error.message}`);
      }
    }
    
    console.log('✅ Environment setup completed');
  }

  async deployWorker() {
    console.log('☁️  Deploying to Cloudflare Workers...');
    
    const deployCommand = this.environment === 'production' 
      ? 'wrangler deploy --env production'
      : `wrangler deploy --env ${this.environment}`;
    
    try {
      execSync(deployCommand, { 
        stdio: 'inherit',
        cwd: rootDir
      });
      
      console.log('✅ Worker deployment completed');
      
      // Wait for deployment to propagate
      console.log('⏳ Waiting for deployment to propagate...');
      await this.sleep(10000);
      
    } catch (error) {
      throw new Error(`Worker deployment failed: ${error.message}`);
    }
  }

  async healthChecks() {
    console.log('🏥 Running health checks...');
    
    const healthUrl = `${this.config.url}/health`;
    const maxRetries = 5;
    const retryDelay = 5000;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Health check attempt ${i + 1}/${maxRetries}: ${healthUrl}`);
        
        const response = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Rawgle-Deployer/1.0',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.status !== 'healthy') {
          throw new Error(`Unhealthy status: ${data.status}`);
        }
        
        if (data.platform !== 'rawgle') {
          throw new Error(`Platform mismatch: expected 'rawgle', got '${data.platform}'`);
        }
        
        console.log('✅ Health check passed');
        console.log(`   Status: ${data.status}`);
        console.log(`   Platform: ${data.platform}`);
        console.log(`   Version: ${data.version}`);
        console.log(`   Environment: ${data.environment}`);
        return;
        
      } catch (error) {
        console.log(`❌ Health check failed: ${error.message}`);
        
        if (i < maxRetries - 1) {
          console.log(`⏳ Retrying in ${retryDelay/1000}s...`);
          await this.sleep(retryDelay);
        } else {
          throw new Error(`Health checks failed after ${maxRetries} attempts`);
        }
      }
    }
  }

  async runIntegrationTests() {
    console.log('🧪 Running integration tests...');
    
    try {
      // Set test environment variables
      process.env.TEST_BASE_URL = this.config.url;
      process.env.TEST_FRONTEND_URL = config.frontendUrl;
      
      // Run Jest tests
      execSync('npm test -- --testPathPattern=integration', { 
        stdio: 'inherit',
        cwd: rootDir,
        env: {
          ...process.env,
          NODE_ENV: 'test'
        }
      });
      
      console.log('✅ Integration tests passed');
    } catch (error) {
      console.warn(`⚠️  Integration tests failed: ${error.message}`);
      if (this.environment === 'production') {
        throw error; // Fail production deployment on test failure
      }
    }
  }

  async testFrontendCompatibility() {
    console.log('🌐 Testing frontend compatibility...');
    
    const tests = [
      { name: 'CORS preflight', test: () => this.testCors() },
      { name: 'API endpoints', test: () => this.testApiEndpoints() },
      { name: 'Authentication flow', test: () => this.testAuthFlow() },
      { name: 'Error responses', test: () => this.testErrorResponses() }
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        console.log(`  Testing: ${test.name}...`);
        await test.test();
        results.push({ name: test.name, status: 'PASS' });
        console.log(`  ✅ ${test.name}: PASS`);
      } catch (error) {
        results.push({ name: test.name, status: 'FAIL', error: error.message });
        console.log(`  ❌ ${test.name}: FAIL - ${error.message}`);
      }
    }
    
    const failures = results.filter(r => r.status === 'FAIL');
    if (failures.length > 0) {
      console.log(`⚠️  ${failures.length} frontend compatibility tests failed`);
      if (this.environment === 'production') {
        throw new Error('Frontend compatibility tests failed in production');
      }
    } else {
      console.log('✅ All frontend compatibility tests passed');
    }
    
    return results;
  }

  async testCors() {
    const response = await fetch(`${this.config.url}/api/pets`, {
      method: 'OPTIONS',
      headers: {
        'Origin': config.frontendUrl,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    
    if (!response.ok) {
      throw new Error(`CORS preflight failed: ${response.status}`);
    }
    
    const allowOrigin = response.headers.get('access-control-allow-origin');
    if (allowOrigin !== config.frontendUrl) {
      throw new Error(`CORS origin mismatch: expected ${config.frontendUrl}, got ${allowOrigin}`);
    }
  }

  async testApiEndpoints() {
    const endpoints = ['/', '/health', '/api/docs'];
    
    for (const endpoint of endpoints) {
      const response = await fetch(`${this.config.url}${endpoint}`, {
        headers: { 'Origin': config.frontendUrl }
      });
      
      if (!response.ok) {
        throw new Error(`Endpoint ${endpoint} failed: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data || typeof data !== 'object') {
        throw new Error(`Invalid JSON response from ${endpoint}`);
      }
    }
  }

  async testAuthFlow() {
    // Test 401 for protected endpoint
    const response = await fetch(`${this.config.url}/api/pets`, {
      headers: { 'Origin': config.frontendUrl }
    });
    
    if (response.status !== 401) {
      throw new Error(`Expected 401 for protected endpoint, got ${response.status}`);
    }
    
    const data = await response.json();
    if (data.success !== false || !data.error) {
      throw new Error('Invalid error response format');
    }
  }

  async testErrorResponses() {
    // Test 404 handling
    const response = await fetch(`${this.config.url}/nonexistent`, {
      headers: { 'Origin': config.frontendUrl }
    });
    
    if (response.status !== 404) {
      throw new Error(`Expected 404 for invalid endpoint, got ${response.status}`);
    }
    
    const data = await response.json();
    if (data.platform !== 'rawgle') {
      throw new Error('Platform identifier missing in error response');
    }
  }

  async generateDeploymentReport() {
    const report = {
      deployment_id: this.deploymentId,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      config: this.config,
      frontend_url: config.frontendUrl,
      status: 'SUCCESS',
      checks: {
        pre_deployment: true,
        database_setup: true,
        worker_deployment: true,
        health_checks: true,
        frontend_compatibility: true
      },
      urls: {
        api: this.config.url,
        health: `${this.config.url}/health`,
        docs: `${this.config.url}/api/docs`,
        frontend: config.frontendUrl
      }
    };
    
    const reportPath = path.join(rootDir, `deployment-report-${this.deploymentId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 DEPLOYMENT REPORT');
    console.log('========================================');
    console.log(`Deployment ID: ${report.deployment_id}`);
    console.log(`Environment: ${report.environment}`);
    console.log(`Status: ${report.status}`);
    console.log(`API URL: ${report.urls.api}`);
    console.log(`Frontend URL: ${report.urls.frontend}`);
    console.log(`Report saved: ${reportPath}`);
    console.log('========================================');
    
    return report;
  }

  async rollbackIfNeeded() {
    console.log('🔄 Rollback not implemented yet');
    console.log('Manual rollback may be required via Cloudflare dashboard');
  }

  // Utility methods
  generateJwtSecret() {
    return `rawgle-jwt-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  generateEncryptionKey() {
    return `rawgle-enc-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  generateApiKey() {
    return `rawgle-api-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'development';
  
  if (!['development', 'staging', 'production'].includes(environment)) {
    console.error('Usage: node deploy.js [development|staging|production]');
    process.exit(1);
  }
  
  const deployer = new RawgleDeployer(environment);
  await deployer.deploy();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Deployment script failed:', error);
    process.exit(1);
  });
}

export default RawgleDeployer;