#!/usr/bin/env node

/**
 * QUALITY VELOCITY - Fast Health Check Script
 * 
 * Provides immediate feedback on system health in under 10 seconds
 * Run with: node quality-check.js
 */

const http = require('http');
const https = require('https');

console.log('🔍 QUALITY VELOCITY - Health Check Starting...\n');

const startTime = Date.now();

// Color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function logStatus(status, message, time = null) {
  const statusColor = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  const timeStr = time ? ` (${time}ms)` : '';
  console.log(`${statusColor}${status}${colors.reset} ${message}${timeStr}`);
}

function checkEndpoint(url, name, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    
    const req = lib.get(url, { timeout }, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (res.statusCode === 200) {
        logStatus('PASS', `${name} HTTP connectivity`, responseTime);
        
        // For health endpoint, also read the response
        if (url.includes('/health')) {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const healthData = JSON.parse(data);
              if (healthData.status === 'healthy') {
                logStatus('PASS', `${name} health status: ${healthData.status}`);
              } else {
                logStatus('WARN', `${name} health status: ${healthData.status || 'unknown'}`);
              }
              resolve({ success: true, responseTime, data: healthData });
            } catch (e) {
              logStatus('WARN', `${name} health data parsing failed`);
              resolve({ success: true, responseTime, data: null });
            }
          });
        } else {
          resolve({ success: true, responseTime, data: null });
        }
      } else {
        logStatus('FAIL', `${name} returned status ${res.statusCode}`, responseTime);
        resolve({ success: false, responseTime, error: `Status ${res.statusCode}` });
      }
    });
    
    req.on('error', (err) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      logStatus('FAIL', `${name} connection failed: ${err.code || err.message}`, responseTime);
      resolve({ success: false, responseTime, error: err.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      logStatus('FAIL', `${name} timed out after ${timeout}ms`);
      resolve({ success: false, responseTime: timeout, error: 'Timeout' });
    });
    
    req.setTimeout(timeout);
  });
}

async function runHealthChecks() {
  console.log('Testing system connectivity...\n');
  
  // Test endpoints in parallel for speed
  const checks = await Promise.all([
    checkEndpoint('http://localhost:3000', 'Frontend'),
    checkEndpoint('http://localhost:8000/health', 'Backend'),
  ]);
  
  const [frontendResult, backendResult] = checks;
  
  console.log('\n' + '='.repeat(50));
  console.log(colors.bold + 'HEALTH CHECK SUMMARY' + colors.reset);
  console.log('='.repeat(50));
  
  const totalTime = Date.now() - startTime;
  
  let passCount = 0;
  let failCount = 0;
  
  // Frontend summary
  if (frontendResult.success) {
    logStatus('✅ PASS', `Frontend (localhost:3000) - ${frontendResult.responseTime}ms`);
    passCount++;
  } else {
    logStatus('❌ FAIL', `Frontend (localhost:3000) - ${frontendResult.error}`);
    failCount++;
  }
  
  // Backend summary
  if (backendResult.success) {
    logStatus('✅ PASS', `Backend (localhost:8000) - ${backendResult.responseTime}ms`);
    passCount++;
  } else {
    logStatus('❌ FAIL', `Backend (localhost:8000) - ${backendResult.error}`);
    failCount++;
  }
  
  console.log('='.repeat(50));
  console.log(`${colors.bold}Results:${colors.reset} ${colors.green}${passCount} PASSED${colors.reset}, ${colors.red}${failCount} FAILED${colors.reset}`);
  console.log(`${colors.bold}Total Time:${colors.reset} ${totalTime}ms`);
  
  if (failCount === 0) {
    console.log(`\n${colors.green}🎉 ALL SYSTEMS OPERATIONAL${colors.reset}`);
    console.log('Ready to run tests with: npm run test:skip-servers\n');
  } else {
    console.log(`\n${colors.red}⚠️  ISSUES DETECTED${colors.reset}`);
    console.log('Fix connectivity issues before running tests\n');
  }
  
  // Recommendations
  console.log(colors.blue + 'QUICK TEST OPTIONS:' + colors.reset);
  console.log('• npm run test:fast     - Basic connectivity (Level 1 only)');
  console.log('• npm run test:medium   - Page loads (Level 2 only)'); 
  console.log('• npm run test:full     - Complete functionality (All levels)');
  console.log('• npm run test:skip-servers - Skip server startup, use existing servers\n');
  
  // Quality gates advice
  if (failCount > 0) {
    console.log(colors.yellow + 'TROUBLESHOOTING:' + colors.reset);
    if (!frontendResult.success) {
      console.log('• Frontend: Check if "npm run dev" is running in rawgle-frontend');
    }
    if (!backendResult.success) {
      console.log('• Backend: Check if "npm run dev" is running in rawgle-backend');
      console.log('• Backend: Verify health endpoint returns {"status": "healthy"}');
    }
    console.log('');
  }
  
  // Exit with appropriate code
  process.exit(failCount > 0 ? 1 : 0);
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\nHealth check interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\nHealth check terminated');
  process.exit(1);
});

// Run the checks
runHealthChecks().catch(error => {
  console.error('Health check failed with error:', error);
  process.exit(1);
});