# Test Requirements for Rawgle Platform

## Testing Philosophy

All code must be thoroughly tested with three levels of testing:
1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test API endpoints and database interactions
3. **E2E Tests** - Test complete user workflows with Selenium

## Test Coverage Requirements

- **Minimum 80% code coverage** for all new code
- **100% coverage required** for authentication and payment functions
- **All API endpoints** must have integration tests
- **All user workflows** must have E2E tests

## Testing Frameworks

### Backend Testing
- **Jest** for unit and integration tests
- **Supertest** for API endpoint testing
- **Test Database** - separate PostgreSQL database for tests

### Frontend Testing
- **Jest + React Testing Library** for component tests
- **Selenium WebDriver** for E2E browser tests
- **Cross-browser testing** on Chrome and Firefox

## Required Test Patterns

### Unit Test Pattern
```javascript
describe('FeedingCalculator', () => {
  test('should calculate daily food amount for adult dog', () => {
    const calculator = new FeedingCalculator();
    const result = calculator.calculateDailyAmount({
      weight: 25, // kg
      age: 'adult',
      activityLevel: 'moderate'
    });

    expect(result.amount).toBe(500); // grams
    expect(result.meals).toBe(2);
  });
});
```

### Integration Test Pattern
```javascript
describe('POST /api/pets', () => {
  test('should create new pet with valid data', async () => {
    const response = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        weight: 25
      });

    expect(response.status).toBe(201);
    expect(response.body.pet.name).toBe('Buddy');
  });
});
```

### E2E Test Pattern
```javascript
describe('Pet Management Workflow', () => {
  test('user can create and manage pet profile', async () => {
    // Login
    await driver.get('http://localhost:3000/login');
    await driver.findElement(By.id('email')).sendKeys('test@example.com');
    await driver.findElement(By.id('password')).sendKeys('password123');
    await driver.findElement(By.css('[type="submit"]')).click();

    // Navigate to pets
    await driver.findElement(By.css('[data-testid="pets-nav"]')).click();

    // Create new pet
    await driver.findElement(By.css('[data-testid="add-pet"]')).click();
    await driver.findElement(By.id('pet-name')).sendKeys('Buddy');

    // Verify pet was created
    const petCard = await driver.findElement(By.css('[data-testid="pet-card"]'));
    expect(await petCard.getText()).toContain('Buddy');
  });
});
```

## Test Data Management

### Database Setup
```javascript
beforeEach(async () => {
  // Clean database
  await db.query('TRUNCATE TABLE users, pets, stores CASCADE');

  // Seed test data
  await seedTestData();
});
```

### Test User Accounts
All tests use predefined test accounts:
- `test@example.com` / `password123` - Regular user
- `admin@example.com` / `admin123` - Admin user
- `store@example.com` / `store123` - Store owner

## Error Testing Requirements

Every API endpoint must test:
1. **Validation Errors** - Invalid input data
2. **Authentication Errors** - Missing/invalid tokens
3. **Authorization Errors** - Insufficient permissions
4. **Rate Limiting** - Too many requests
5. **Server Errors** - Database failures, external API failures

Example:
```javascript
test('should return 400 for invalid pet data', async () => {
  const response = await request(app)
    .post('/api/pets')
    .set('Authorization', `Bearer ${validToken}`)
    .send({
      name: '', // Invalid - empty name
      species: 'invalid' // Invalid - not in allowed list
    });

  expect(response.status).toBe(400);
  expect(response.body.errors).toContain('Pet name is required');
});
```

## Browser Testing Requirements

### Responsive Testing
Tests must verify functionality on:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

### Cross-Browser Testing
- Chrome (latest)
- Firefox (latest)
- Safari (latest) - manual testing acceptable

### Accessibility Testing
- Keyboard navigation works
- Screen reader compatibility
- Color contrast compliance
- ARIA labels are present

## Performance Testing

### Load Testing Requirements
- **API Endpoints**: Must handle 100 concurrent requests
- **Database Queries**: Must complete within 500ms
- **Page Load**: Must load within 3 seconds

### Test Data Volumes
- **Small Dataset**: 100 users, 500 pets, 50 stores
- **Medium Dataset**: 1,000 users, 5,000 pets, 100 stores
- **Large Dataset**: 10,000 users, 50,000 pets, 500 stores

## Test Environment Setup

### Required Environment Variables
```bash
NODE_ENV=test
DATABASE_URL=postgresql://user:pass@localhost:5432/rawgle_test
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test_secret_key
```

### Docker Test Environment
```yaml
version: '3.8'
services:
  test-db:
    image: postgres:14
    environment:
      POSTGRES_DB: rawgle_test
      POSTGRES_USER: rawgle
      POSTGRES_PASSWORD: testpass

  test-redis:
    image: redis:7
```

## Continuous Integration

### Pre-commit Hooks
- Run linting (ESLint)
- Run type checking (TypeScript)
- Run unit tests
- Check test coverage

### CI Pipeline
1. Install dependencies
2. Run linting and type checking
3. Run unit tests with coverage
4. Run integration tests
5. Run E2E tests
6. Generate test reports
7. Check coverage thresholds

## Test Reporting

### Required Metrics
- Test pass/fail rates
- Code coverage percentages
- Test execution time
- Flaky test identification
- Performance benchmarks

### Test Report Format
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "summary": {
    "total": 150,
    "passed": 145,
    "failed": 5,
    "skipped": 0
  },
  "coverage": {
    "lines": 85.2,
    "functions": 90.1,
    "branches": 78.5
  }
}
```