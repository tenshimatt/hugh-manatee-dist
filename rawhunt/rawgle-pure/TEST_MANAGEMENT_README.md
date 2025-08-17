# Test Management System

A comprehensive test management and monitoring solution for the Rawgle platform that provides real-time test execution tracking, historical analysis, and a web-based dashboard for managing all test activities.

## Features

### 🧪 Test Execution Management
- **Integrated Test Runner**: Automated test execution with real-time reporting
- **Multi-Suite Support**: Unit, Integration, E2E, Security, and Performance tests
- **Git Integration**: Automatic branch and commit tracking
- **Environment Detection**: Automatic environment and platform detection
- **Real-time Status**: Live test execution monitoring

### 📊 Analytics & Reporting
- **Historical Data**: Complete test run history with detailed metrics
- **Success Rate Tracking**: Monitor test reliability over time
- **Performance Metrics**: Execution duration and coverage analysis
- **Trend Analysis**: Visual charts showing test performance trends
- **Failure Analysis**: Detailed failure tracking and categorization

### 🖥️ Web Dashboard
- **Real-time Dashboard**: Live view of test status and metrics
- **Interactive Charts**: Visual representation of test trends
- **Filtering & Search**: Advanced filtering by suite, status, branch, and time
- **Test Details**: Detailed view of individual test runs
- **Administrative Actions**: Test cleanup and management functions

### 🔧 API Integration
- **RESTful API**: Complete API for test data management
- **Admin Controls**: Secure admin-only endpoints for management
- **Data Persistence**: Cloudflare KV-based storage with TTL management
- **Real-time Updates**: Live data updates and status monitoring

## Quick Start

### 1. Set Up Environment
```bash
# Set your admin token
export ADMIN_TOKEN=your-secure-admin-token

# Set API URL (optional, defaults to localhost:8787)
export TEST_MANAGEMENT_API=https://your-api-domain.com
```

### 2. Run Tests with Management
```bash
# Run all test suites with management tracking
npm run test:managed:all

# Run specific test suite
npm run test:managed:unit
npm run test:managed:integration
npm run test:managed:e2e
npm run test:managed:security
npm run test:managed:performance

# Run with verbose output
node scripts/test-runner.js all --verbose

# Run without API reporting (local testing)
node scripts/test-runner.js unit --no-report
```

### 3. Access the Dashboard
```bash
# Open the test management dashboard
npm run test:dashboard

# Or serve the HTML file with a local server
python -m http.server 8080
# Then open http://localhost:8080/test-management-ui.html
```

## API Endpoints

### Test Management API (`/api/test-management`)

#### Store Test Run
```http
POST /api/test-management/runs
X-Admin-Token: your-admin-token
Content-Type: application/json

{
  "runId": "test-1234567890-abc123",
  "testSuite": "unit",
  "testType": "unit",
  "status": "passed",
  "startTime": "2024-01-15T10:30:00Z",
  "endTime": "2024-01-15T10:32:30Z",
  "duration": 150000,
  "passed": 45,
  "failed": 2,
  "skipped": 1,
  "coverage": {
    "statements": 85.5,
    "branches": 78.2,
    "functions": 92.1,
    "lines": 86.7
  },
  "environment": "development",
  "branch": "feature/new-tests",
  "commit": "abc123def456",
  "errors": ["Test timeout in user.test.js"],
  "warnings": ["Deprecated API usage detected"],
  "metadata": {
    "command": "npm run test:unit",
    "nodeVersion": "v18.19.0",
    "platform": "darwin"
  }
}
```

#### Get Test Run Details
```http
GET /api/test-management/runs/{runId}
```

#### Get Test History
```http
GET /api/test-management/history?suite=unit&status=failed&branch=main&limit=50
```

#### Get Dashboard Data
```http
GET /api/test-management/dashboard?timeframe=7d
```

#### Delete Test Run (Admin)
```http
DELETE /api/test-management/runs/{runId}
X-Admin-Token: your-admin-token
```

## Test Runner Options

The test runner (`scripts/test-runner.js`) supports various options:

```bash
# Show help
node scripts/test-runner.js --help

# Run with verbose output
node scripts/test-runner.js unit --verbose

# Run without API reporting
node scripts/test-runner.js integration --no-report

# Run specific suite
node scripts/test-runner.js --suite=e2e

# Environment variables
TEST_MANAGEMENT_API=https://api.example.com node scripts/test-runner.js
ADMIN_TOKEN=your-token node scripts/test-runner.js
NODE_ENV=production node scripts/test-runner.js
```

## Dashboard Features

### 📈 Real-time Metrics
- **Total Test Runs**: Overall test execution count
- **Success Rate**: Percentage of passing tests
- **Average Duration**: Mean execution time
- **Coverage**: Code coverage percentage
- **Running Tests**: Currently executing tests

### 📊 Interactive Charts
- **Trends Chart**: Visual representation of test performance over time
- **Success/Failure Tracking**: Historical pass/fail rates
- **Duration Analysis**: Performance trends

### 🔍 Filtering & Search
- **Time Range**: 24h, 7d, 30d, 90d
- **Test Suite**: Filter by unit, integration, e2e, security, performance
- **Status**: Filter by passed, failed, running
- **Branch**: Filter by Git branch name
- **Real-time Updates**: Auto-refresh every 30 seconds

### 📋 Test History
- **Detailed View**: Complete test run information
- **Status Indicators**: Visual status representation
- **Metadata**: Git branch, commit, environment info
- **Results Breakdown**: Passed/failed/skipped counts
- **Coverage Information**: Code coverage percentages

## Architecture

### Data Storage
- **Cloudflare KV**: Primary storage for test data
- **TTL Management**: Automatic cleanup of old data
- **History Tracking**: Per-suite history with limits
- **Efficient Queries**: Optimized for dashboard performance

### Security
- **Admin Token**: Secure admin-only operations
- **CORS Headers**: Proper cross-origin resource sharing
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Built-in rate limiting protection

### Integration
- **Git Integration**: Automatic branch and commit detection
- **CI/CD Ready**: Easy integration with build systems
- **Environment Detection**: Automatic environment classification
- **Multi-platform**: Works on all major platforms

## Configuration

### Environment Variables
```bash
# Required for API reporting
ADMIN_TOKEN=your-secure-admin-token

# Optional - API endpoint (defaults to localhost:8787)
TEST_MANAGEMENT_API=https://your-api-domain.com

# Optional - Environment classification
NODE_ENV=development|staging|production

# Optional - Maximum payload size (defaults to 10MB)
MAX_PAYLOAD_SIZE=10485760
```

### Wrangler Configuration
Add these bindings to your `wrangler.toml`:

```toml
# KV Namespace for test data storage
[[kv_namespaces]]
binding = "RAWGLE_KV"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"

# Environment variables
[env.production.vars]
ADMIN_TOKEN = "your-production-admin-token"
TEST_MANAGEMENT_API = "https://your-production-api.com"

[env.staging.vars]
ADMIN_TOKEN = "your-staging-admin-token"
TEST_MANAGEMENT_API = "https://your-staging-api.com"
```

## Best Practices

### Test Naming
- Use descriptive test suite names
- Include environment in metadata
- Tag tests with relevant information

### Data Management
- Regular cleanup of old test data
- Monitor storage usage
- Archive important test results

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
name: Tests with Management
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run managed tests
        env:
          ADMIN_TOKEN: ${{ secrets.ADMIN_TOKEN }}
          TEST_MANAGEMENT_API: ${{ secrets.TEST_MANAGEMENT_API }}
        run: npm run test:managed:all
```

### Monitoring
- Set up alerts for test failures
- Monitor success rates
- Track performance regressions
- Review coverage trends

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check `ADMIN_TOKEN` environment variable
   - Verify `TEST_MANAGEMENT_API` URL
   - Ensure Cloudflare Worker is deployed

2. **Test Runner Failures**
   - Verify Node.js version (18+ required)
   - Check test suite configurations
   - Review console output for errors

3. **Dashboard Loading Issues**
   - Check admin token in localStorage
   - Verify API endpoints are accessible
   - Review browser console for errors

4. **Data Not Persisting**
   - Confirm KV namespace binding
   - Check TTL settings
   - Verify admin permissions

### Debug Mode
```bash
# Enable verbose logging
DEBUG=test-runner node scripts/test-runner.js --verbose

# Check API connectivity
curl -H "X-Admin-Token: $ADMIN_TOKEN" $TEST_MANAGEMENT_API/api/test-management/dashboard
```

## Contributing

1. **Adding New Test Types**
   - Update `TEST_SUITES` in `test-runner.js`
   - Add corresponding npm scripts
   - Update dashboard filtering

2. **Extending Analytics**
   - Modify dashboard API endpoints
   - Update chart rendering logic
   - Add new metric calculations

3. **UI Improvements**
   - Edit `test-management-ui.html`
   - Add new chart types
   - Enhance filtering options

## License

This test management system is part of the Rawgle platform and follows the same MIT license terms.