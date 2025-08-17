# Comprehensive UI/UX Testing Framework

## Overview

The GoHunta.com UI/UX testing framework provides comprehensive validation of design implementations, accessibility compliance, and user experience quality. This framework integrates multiple testing approaches to ensure the hunting application meets both technical standards and real-world field requirements.

## Testing Philosophy

### Multi-Layered Validation
1. **Unit Testing**: Individual component functionality and rendering
2. **Integration Testing**: Component interaction and data flow
3. **Accessibility Testing**: WCAG compliance and assistive technology support
4. **Visual Regression Testing**: Design consistency across updates
5. **Performance Testing**: UI responsiveness and resource usage
6. **Field Usability Testing**: Real-world hunting scenario validation

### Continuous Quality Assurance
- **Automated Testing**: Run on every code commit
- **Manual Testing**: Regular human validation of UX flows
- **User Testing**: Periodic validation with actual hunters
- **Performance Monitoring**: Continuous tracking of UI metrics

## Testing Architecture

### Test Suite Organization
```
design/testing/
├── unit/                    # Component unit tests
├── integration/             # Feature integration tests
├── accessibility/           # A11y compliance tests
├── visual/                  # Screenshot comparison tests
├── performance/             # UI performance tests
├── field-usability/         # Real-world scenario tests
├── cross-browser/           # Browser compatibility tests
├── utils/                   # Testing utilities and helpers
├── fixtures/                # Test data and mock objects
└── reports/                 # Test results and coverage reports
```

### Testing Stack
```json
{
  "frameworks": {
    "unit": "Jest + React Testing Library",
    "e2e": "Playwright",
    "accessibility": "axe-core + jest-axe",
    "visual": "Percy + Playwright",
    "performance": "Lighthouse CI"
  },
  "utilities": {
    "mocking": "MSW (Mock Service Worker)",
    "fixtures": "Faker.js",
    "assertions": "Jest + Custom Matchers",
    "coverage": "Istanbul"
  }
}
```

## Unit Testing Framework

### Component Testing Standards
```typescript
// component-test-template.spec.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { HuntLogCard } from '../HuntLogCard';
import { mockHuntLog } from '../../fixtures/hunt-logs';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('HuntLogCard Component', () => {
  const defaultProps = {
    huntLog: mockHuntLog,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onShare: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all required hunt log information', () => {
      render(<HuntLogCard {...defaultProps} />);
      
      expect(screen.getByText(mockHuntLog.species)).toBeInTheDocument();
      expect(screen.getByText(mockHuntLog.location)).toBeInTheDocument();
      expect(screen.getByText(/success/i)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /hunt photo/i })).toBeInTheDocument();
    });

    it('displays GPS coordinates in correct format', () => {
      render(<HuntLogCard {...defaultProps} />);
      
      const coordinates = screen.getByTestId('gps-coordinates');
      expect(coordinates).toHaveTextContent(/^\d+\.\d+°[NS],\s*\d+\.\d+°[EW]$/);
    });

    it('shows weather information when available', () => {
      const huntLogWithWeather = {
        ...mockHuntLog,
        weather: {
          temperature: 45,
          condition: 'partly-cloudy',
          windSpeed: 8,
          windDirection: 'NW'
        }
      };

      render(<HuntLogCard huntLog={huntLogWithWeather} {...defaultProps} />);
      
      expect(screen.getByText('45°F')).toBeInTheDocument();
      expect(screen.getByText(/8 mph NW/)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<HuntLogCard {...defaultProps} />);
      
      const editButton = screen.getByRole('button', { name: /edit hunt log/i });
      await user.click(editButton);
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockHuntLog.id);
    });

    it('confirms before deleting hunt log', async () => {
      const user = userEvent.setup();
      global.confirm = jest.fn().mockReturnValue(true);
      
      render(<HuntLogCard {...defaultProps} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete hunt log/i });
      await user.click(deleteButton);
      
      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this hunt log? This action cannot be undone.'
      );
      expect(defaultProps.onDelete).toHaveBeenCalledWith(mockHuntLog.id);
    });

    it('opens share dialog when share button is clicked', async () => {
      const user = userEvent.setup();
      render(<HuntLogCard {...defaultProps} />);
      
      const shareButton = screen.getByRole('button', { name: /share hunt/i });
      await user.click(shareButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /share hunt log/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG accessibility standards', async () => {
      const { container } = render(<HuntLogCard {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides appropriate ARIA labels', () => {
      render(<HuntLogCard {...defaultProps} />);
      
      const editButton = screen.getByRole('button', { name: /edit hunt log/i });
      expect(editButton).toHaveAttribute('aria-label');
      
      const huntImage = screen.getByRole('img');
      expect(huntImage).toHaveAttribute('alt');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<HuntLogCard {...defaultProps} />);
      
      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('button', { name: /edit hunt log/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /share hunt/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /delete hunt log/i })).toHaveFocus();
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      render(<HuntLogCard {...defaultProps} />);
      
      const card = screen.getByTestId('hunt-log-card');
      expect(card).toHaveClass('mobile-layout');
    });

    it('shows expanded layout on desktop', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      
      render(<HuntLogCard {...defaultProps} />);
      
      const card = screen.getByTestId('hunt-log-card');
      expect(card).toHaveClass('desktop-layout');
    });
  });

  describe('Performance', () => {
    it('renders within performance budget', () => {
      const startTime = performance.now();
      render(<HuntLogCard {...defaultProps} />);
      const renderTime = performance.now() - startTime;
      
      expect(renderTime).toBeLessThan(16); // 60fps budget
    });

    it('optimizes image loading', () => {
      render(<HuntLogCard {...defaultProps} />);
      
      const huntImage = screen.getByRole('img');
      expect(huntImage).toHaveAttribute('loading', 'lazy');
      expect(huntImage).toHaveAttribute('decoding', 'async');
    });
  });
});
```

### Custom Testing Utilities
```typescript
// utils/testing-helpers.ts
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';

// Custom render with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  user?: User;
  theme?: 'light' | 'dark' | 'high-contrast';
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const {
    initialRoute = '/',
    user = mockUser,
    theme = 'light',
    ...renderOptions
  } = options;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider initialTheme={theme}>
          <AuthProvider initialUser={user}>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );

  return render(ui, {
    wrapper: AllTheProviders,
    ...renderOptions,
  });
};

// Field testing utilities
export const mockGeolocation = (
  position: Partial<GeolocationPosition> = {}
): jest.MockedFunction<typeof navigator.geolocation.getCurrentPosition> => {
  const mockGetCurrentPosition = jest.fn();
  
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: mockGetCurrentPosition,
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    },
    configurable: true,
  });

  mockGetCurrentPosition.mockImplementation((success) => {
    success({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
      ...position,
    });
  });

  return mockGetCurrentPosition;
};

// Touch/glove simulation
export const simulateGloveInteraction = (element: Element) => {
  // Simulate less precise touch events
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // Add some randomness to simulate glove imprecision
  const offsetX = (Math.random() - 0.5) * 10;
  const offsetY = (Math.random() - 0.5) * 10;

  fireEvent.touchStart(element, {
    touches: [{
      clientX: centerX + offsetX,
      clientY: centerY + offsetY,
      identifier: 1,
    }],
  });

  fireEvent.touchEnd(element, {
    changedTouches: [{
      clientX: centerX + offsetX,
      clientY: centerY + offsetY,
      identifier: 1,
    }],
  });
};

// Network condition simulation
export const mockNetworkCondition = (condition: 'online' | 'offline' | 'slow') => {
  const originalOnLine = navigator.onLine;
  
  switch (condition) {
    case 'offline':
      Object.defineProperty(navigator, 'onLine', { value: false });
      break;
    case 'slow':
      Object.defineProperty(navigator, 'onLine', { value: true });
      // Mock slow network responses
      global.fetch = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 3000))
      );
      break;
    default:
      Object.defineProperty(navigator, 'onLine', { value: true });
  }

  return () => {
    Object.defineProperty(navigator, 'onLine', { value: originalOnLine });
    if (global.fetch && jest.isMockFunction(global.fetch)) {
      global.fetch.mockRestore();
    }
  };
};
```

## Integration Testing Framework

### Feature Integration Tests
```typescript
// integration/hunt-logging-flow.spec.ts
describe('Hunt Logging Integration Flow', () => {
  beforeEach(() => {
    mockGeolocation();
    setupMockServer();
  });

  it('completes full hunt logging workflow', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<App />);
    
    // Navigate to hunt logging
    await user.click(screen.getByRole('link', { name: /log hunt/i }));
    
    // Verify GPS acquisition
    await waitFor(() => {
      expect(screen.getByText(/gps.*acquired/i)).toBeInTheDocument();
    });
    
    // Fill out hunt details
    await user.selectOptions(screen.getByLabelText(/species/i), 'mallard');
    await user.type(screen.getByLabelText(/location/i), 'North Marsh');
    await user.click(screen.getByRole('radio', { name: /successful hunt/i }));
    
    // Upload photo
    const photoInput = screen.getByLabelText(/add photo/i);
    const file = new File(['(binary)'], 'hunt-photo.jpg', { type: 'image/jpeg' });
    await user.upload(photoInput, file);
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /save hunt log/i }));
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/hunt log saved successfully/i)).toBeInTheDocument();
    });
    
    // Verify data persistence
    expect(screen.getByText('North Marsh')).toBeInTheDocument();
    expect(screen.getByText('Mallard')).toBeInTheDocument();
  });

  it('handles offline hunt logging with sync', async () => {
    const user = userEvent.setup();
    const restoreNetwork = mockNetworkCondition('offline');
    
    renderWithProviders(<App />);
    
    // Should show offline indicator
    expect(screen.getByText(/working offline/i)).toBeInTheDocument();
    
    // Log hunt while offline
    await user.click(screen.getByRole('link', { name: /log hunt/i }));
    await user.selectOptions(screen.getByLabelText(/species/i), 'pheasant');
    await user.click(screen.getByRole('button', { name: /save hunt log/i }));
    
    // Should queue for sync
    expect(screen.getByText(/will sync when online/i)).toBeInTheDocument();
    
    // Come back online
    restoreNetwork();
    mockNetworkCondition('online');
    
    // Should sync automatically
    await waitFor(() => {
      expect(screen.getByText(/synced successfully/i)).toBeInTheDocument();
    });
  });
});
```

### Cross-Component Integration
```typescript
// integration/gps-weather-integration.spec.ts
describe('GPS and Weather Integration', () => {
  it('fetches weather data when GPS location is acquired', async () => {
    const weatherMock = jest.fn().mockResolvedValue({
      temperature: 42,
      condition: 'overcast',
      windSpeed: 12,
      windDirection: 'NW'
    });

    mockGeolocation({
      coords: { latitude: 45.5152, longitude: -122.6784 }
    });

    renderWithProviders(<HuntingDashboard />);
    
    // GPS should trigger weather fetch
    await waitFor(() => {
      expect(weatherMock).toHaveBeenCalledWith({
        lat: 45.5152,
        lon: -122.6784
      });
    });
    
    // Weather should display
    expect(screen.getByText('42°F')).toBeInTheDocument();
    expect(screen.getByText(/12 mph NW/)).toBeInTheDocument();
  });
});
```

## Visual Regression Testing

### Screenshot Testing Setup
```typescript
// visual/screenshot-tests.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('hunt log card renders consistently', async ({ page }) => {
    await page.goto('/hunt-logs/123');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="hunt-log-card"]');
    
    // Take screenshot
    await expect(page.locator('[data-testid="hunt-log-card"]')).toHaveScreenshot('hunt-log-card.png');
  });

  test('responsive navigation at different breakpoints', async ({ page }) => {
    const breakpoints = [375, 768, 1024, 1440];
    
    for (const width of breakpoints) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      
      await expect(page.locator('nav')).toHaveScreenshot(`navigation-${width}px.png`);
    }
  });

  test('high contrast mode appearance', async ({ page }) => {
    // Enable high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.addStyleTag({
      content: ':root { --contrast-mode: high; }'
    });
    
    await page.goto('/');
    await expect(page.locator('body')).toHaveScreenshot('high-contrast-mode.png');
  });

  test('hunting-specific UI elements', async ({ page }) => {
    await page.goto('/hunt-logs/new');
    
    // GPS indicator
    await expect(page.locator('[data-testid="gps-indicator"]')).toHaveScreenshot('gps-indicator.png');
    
    // Weather widget
    await expect(page.locator('[data-testid="weather-widget"]')).toHaveScreenshot('weather-widget.png');
    
    // Species selector
    await expect(page.locator('[data-testid="species-selector"]')).toHaveScreenshot('species-selector.png');
  });
});
```

### Percy Integration
```javascript
// .percy.yml
version: 2
discovery:
  allowed-hostnames:
    - localhost
    - staging.gohunta.com
snapshot:
  widths:
    - 375   # Mobile
    - 414   # Large Mobile
    - 768   # Tablet
    - 1024  # Desktop
    - 1440  # Large Desktop
  minimum-height: 1024
  percy-css: |
    .percy-hide { display: none !important; }
    .dynamic-timestamp { visibility: hidden; }
```

## Performance Testing Framework

### UI Performance Metrics
```typescript
// performance/ui-performance.spec.ts
describe('UI Performance', () => {
  it('meets Core Web Vitals thresholds', async () => {
    const metrics = await measurePerformanceMetrics('/hunt-logs');
    
    expect(metrics.LCP).toBeLessThan(2500); // Largest Contentful Paint
    expect(metrics.FID).toBeLessThan(100);  // First Input Delay
    expect(metrics.CLS).toBeLessThan(0.1);  // Cumulative Layout Shift
  });

  it('renders hunt log list efficiently', async () => {
    const startTime = performance.now();
    
    renderWithProviders(
      <HuntLogList huntLogs={Array(100).fill(mockHuntLog)} />
    );
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(50); // 50ms budget
  });

  it('handles GPS updates without blocking UI', async () => {
    const { rerender } = renderWithProviders(<GPSTracker />);
    
    const startTime = performance.now();
    
    // Simulate frequent GPS updates
    for (let i = 0; i < 10; i++) {
      rerender(<GPSTracker location={{ lat: 40 + i * 0.01, lng: -74 }} />);
    }
    
    const updateTime = (performance.now() - startTime) / 10;
    expect(updateTime).toBeLessThan(16); // 60fps budget per update
  });
});

// Lighthouse CI integration
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyAudits: [
      'first-contentful-paint',
      'largest-contentful-paint',
      'interactive',
      'cumulative-layout-shift',
    ],
  },
  audits: [
    'hunt-specific-metrics', // Custom audit
  ],
};
```

## Field Usability Test Automation

### Simulated Field Conditions
```typescript
// field-usability/environmental-simulation.spec.ts
describe('Environmental Condition Simulation', () => {
  it('maintains usability in bright sunlight conditions', async ({ page }) => {
    // Simulate bright screen conditions
    await page.addStyleTag({
      content: `
        :root {
          --brightness-multiplier: 3;
          filter: brightness(var(--brightness-multiplier));
        }
      `
    });
    
    await page.goto('/hunt-logs/new');
    
    // Verify high contrast elements are visible
    const submitButton = page.locator('button[type="submit"]');
    const contrast = await getContrastRatio(submitButton);
    
    expect(contrast).toBeGreaterThan(7); // WCAG AAA for bright conditions
  });

  it('supports glove interaction patterns', async ({ page }) => {
    await page.goto('/hunt-logs/new');
    
    // Test large touch targets
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      
      expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(44);
    }
  });

  it('handles network interruptions gracefully', async ({ page }) => {
    await page.goto('/hunt-logs/new');
    
    // Start form submission
    await page.fill('input[name="species"]', 'Duck');
    await page.click('button[type="submit"]');
    
    // Simulate network interruption during submission
    await page.setOffline(true);
    
    // Should show offline message
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Restore network
    await page.setOffline(false);
    
    // Should auto-retry and succeed
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

## Test Data Management

### Fixture Generation
```typescript
// fixtures/hunt-log-fixtures.ts
import { faker } from '@faker-js/faker';

export const generateHuntLog = (overrides: Partial<HuntLog> = {}): HuntLog => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  date: faker.date.recent({ days: 30 }),
  species: faker.helpers.arrayElement(['Mallard', 'Pheasant', 'Deer', 'Turkey']),
  location: {
    name: faker.location.city(),
    coordinates: {
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
    },
  },
  outcome: faker.helpers.arrayElement(['success', 'no-game']),
  weather: {
    temperature: faker.number.int({ min: 20, max: 80 }),
    condition: faker.helpers.arrayElement(['clear', 'cloudy', 'rain', 'snow']),
    windSpeed: faker.number.int({ min: 0, max: 25 }),
    windDirection: faker.helpers.arrayElement(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']),
  },
  dogs: faker.helpers.multiple(() => ({
    id: faker.string.uuid(),
    name: faker.person.firstName(),
    breed: faker.helpers.arrayElement(['Labrador', 'Pointer', 'Setter', 'Retriever']),
  }), { count: { min: 0, max: 3 } }),
  photos: faker.helpers.multiple(() => ({
    id: faker.string.uuid(),
    url: faker.image.animals(),
    caption: faker.lorem.sentence(),
  }), { count: { min: 0, max: 5 } }),
  notes: faker.lorem.paragraph(),
  ...overrides,
});

export const generateMultipleHuntLogs = (count: number): HuntLog[] =>
  Array.from({ length: count }, () => generateHuntLog());
```

## Test Execution and Reporting

### Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:a11y": "jest --testMatch='**/*.a11y.test.{ts,tsx}'",
    "test:integration": "jest --testMatch='**/*.integration.test.{ts,tsx}'",
    "test:e2e": "playwright test",
    "test:visual": "percy exec -- playwright test",
    "test:performance": "lighthouse-ci autorun",
    "test:field": "jest --testMatch='**/*.field.test.{ts,tsx}' --testEnvironment=jsdom",
    "test:all": "npm run test && npm run test:e2e && npm run test:visual"
  }
}
```

### Coverage Requirements
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/test/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/components/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
};
```

### Test Reporting
```typescript
// Custom test reporter for hunting-specific metrics
class HuntingTestReporter {
  onTestResult(test, testResult) {
    const huntingTests = testResult.testResults.filter(t => 
      t.fullName.includes('hunting') || 
      t.fullName.includes('field') ||
      t.fullName.includes('GPS')
    );

    if (huntingTests.length > 0) {
      console.log(`\n🏹 Hunting-specific tests: ${huntingTests.length}`);
      console.log(`✅ Passed: ${huntingTests.filter(t => t.status === 'passed').length}`);
      console.log(`❌ Failed: ${huntingTests.filter(t => t.status === 'failed').length}`);
    }
  }

  generateReport(testResults) {
    return {
      totalTests: testResults.numTotalTests,
      passedTests: testResults.numPassedTests,
      failedTests: testResults.numFailedTests,
      huntingSpecificTests: testResults.testResults
        .flatMap(r => r.testResults)
        .filter(t => this.isHuntingTest(t)).length,
      accessibility: {
        violations: testResults.a11yViolations || 0,
        wcagLevel: 'AA'
      },
      performance: {
        renderTime: testResults.avgRenderTime,
        memoryUsage: testResults.memoryUsage
      }
    };
  }
}
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/ui-testing.yml
name: UI/UX Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:a11y
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:integration

  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:visual
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npm run test:performance
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

## Related Documentation

- [Component Library](../components/README.md)
- [Accessibility Guidelines](../accessibility/README.md)
- [Field Usability Testing](./field-usability-testing.md)
- [Performance Specifications](../../performance/README.md)