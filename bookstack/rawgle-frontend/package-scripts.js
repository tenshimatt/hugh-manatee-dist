#!/usr/bin/env node

// Facebook-Grade CI/CD Pipeline Scripts
// Integrates with package.json to enforce quality gates

const scripts = {
  // Build-time quality gates
  "test:facebook-grade": "node facebook-grade-testing.js",
  "test:visual-regression": "node facebook-grade-testing.js --visual-only",
  "test:performance-budget": "node facebook-grade-testing.js --perf-only",
  "test:accessibility": "node facebook-grade-testing.js --a11y-only",
  
  // Pre-commit hooks (fail fast)
  "pre-commit": "npm run test:facebook-grade",
  "pre-push": "npm run test:facebook-grade && npm run build",
  
  // Build pipeline integration
  "build:safe": "npm run test:facebook-grade && npm run build",
  "deploy:production": "npm run build:safe && echo 'Deploying to production...'",
  
  // Development workflow
  "dev:test": "concurrently \"npm run dev\" \"wait-on http://localhost:3001 && npm run test:facebook-grade\"",
  "dev:watch": "nodemon --watch src --ext js,jsx,ts,tsx --exec \"npm run test:facebook-grade\"",
  
  // Report generation
  "report:quality": "node facebook-grade-testing.js --report-only",
  "report:open": "open test-reports/facebook-grade-report.html"
};

// Update package.json with Facebook-grade scripts
const fs = require('fs');
const path = require('path');

try {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Add Facebook-grade scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    ...scripts
  };
  
  // Add required dependencies for testing infrastructure
  const newDevDeps = {
    "concurrently": "^7.6.0",
    "wait-on": "^7.0.1", 
    "nodemon": "^2.0.22",
    "pixelmatch": "^5.3.0",
    "pngjs": "^7.0.0"
  };
  
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    ...newDevDeps
  };
  
  // Add quality gate configuration
  packageJson.qualityGates = {
    visualRegression: { threshold: 0.01 },
    performanceBudget: { maxLoadTime: 2000 },
    accessibilityScore: { minScore: 95 },
    functionalCoverage: { minCoverage: 90 },
    crossBrowserCompat: { minBrowsers: 3 }
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Facebook-grade scripts added to package.json');
  
} catch (error) {
  console.error('❌ Failed to update package.json:', error.message);
}

module.exports = scripts;