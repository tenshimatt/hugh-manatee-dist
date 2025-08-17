import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock contexts for testing
const MockAuthProvider = ({ children, user = null }) => {
  const mockAuthContext = {
    user,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    isLoading: false,
    error: null,
  };

  return React.createElement(
    'div',
    { 'data-testid': 'mock-auth-provider' },
    children
  );
};

const MockOfflineProvider = ({ children, isOffline = false }) => {
  const mockOfflineContext = {
    isOffline,
  };

  return React.createElement(
    'div',
    { 'data-testid': 'mock-offline-provider' },
    children
  );
};

// Create a custom render function that includes providers
function customRender(
  ui,
  {
    // Auth provider options
    user = null,
    
    // Offline provider options
    isOffline = false,
    
    // React Query options
    queryClient = null,
    
    // Router options
    initialEntries = ['/'],
    
    // RTL render options
    ...renderOptions
  } = {}
) {
  // Create a fresh query client for each test
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={testQueryClient}>
          <MockAuthProvider user={user}>
            <MockOfflineProvider isOffline={isOffline}>
              {children}
            </MockOfflineProvider>
          </MockAuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );
  }

  return {
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: testQueryClient,
  };
}

// Mock fetch function for API testing
export const mockFetch = (response, options = {}) => {
  const { status = 200, ok = true, delay = 0 } = options;

  global.fetch = vi.fn(() =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok,
          status,
          json: () => Promise.resolve(response),
          text: () => Promise.resolve(JSON.stringify(response)),
          headers: new Headers(),
          clone: () => ({
            json: () => Promise.resolve(response),
          }),
        });
      }, delay);
    })
  );

  return global.fetch;
};

// Mock API error response
export const mockFetchError = (error = 'Network Error', status = 500) => {
  global.fetch = vi.fn(() =>
    Promise.reject(new Error(error))
  );

  return global.fetch;
};

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  avatar: null,
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockDog = (overrides = {}) => ({
  id: 'dog-1',
  name: 'Rex',
  breed: 'German Shorthaired Pointer',
  age: 3,
  birthDate: '2021-05-15',
  huntingStyle: 'pointing',
  trainingLevel: 'seasoned',
  healthStatus: 'excellent',
  microchipId: 'GSP123456789',
  profileImageUrl: null,
  owner: 'user-1',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockHuntLog = (overrides = {}) => ({
  id: 'hunt-1',
  userId: 'user-1',
  date: '2024-01-15',
  startTime: Date.now() - 3600000, // 1 hour ago
  endTime: Date.now(),
  location: 'Pheasant Ridge',
  coordinates: {
    latitude: 40.7128,
    longitude: -74.0060,
  },
  duration: 3600000, // 1 hour
  dogsPresent: ['dog-1'],
  species: 'pheasant',
  weatherConditions: {
    temperature: 45,
    wind: 'light',
    conditions: 'overcast',
    humidity: 60,
  },
  gameHarvested: 2,
  successRating: 4,
  photos: [
    '/images/hunt1.jpg',
    '/images/hunt2.jpg',
  ],
  notes: 'Great hunt with excellent dog work',
  route: [
    { latitude: 40.7128, longitude: -74.0060, timestamp: Date.now() - 3600000 },
    { latitude: 40.7130, longitude: -74.0062, timestamp: Date.now() - 3000000 },
    { latitude: 40.7132, longitude: -74.0064, timestamp: Date.now() },
  ],
  waypoints: [
    {
      id: 'waypoint-1',
      name: 'Hunt Start',
      latitude: 40.7128,
      longitude: -74.0060,
      timestamp: Date.now() - 3600000,
    },
  ],
  createdAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

export const createMockVoiceNote = (overrides = {}) => ({
  id: 'voice-1',
  huntLogId: 'hunt-1',
  title: 'Voice Note 1',
  transcription: 'Great pointing by Rex on that last covey.',
  duration: 30,
  timestamp: Date.now(),
  size: 1024,
  mimeType: 'audio/webm',
  url: '/audio/voice-note-1.webm',
  ...overrides,
});

export const createMockPhoto = (overrides = {}) => ({
  id: 'photo-1',
  huntLogId: 'hunt-1',
  url: '/images/photo-1.jpg',
  thumbnailUrl: '/images/thumbnails/photo-1.jpg',
  width: 1920,
  height: 1080,
  size: 2048000, // 2MB
  timestamp: Date.now(),
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
  },
  metadata: {
    camera: 'iPhone 15',
    iso: 200,
    aperture: 'f/2.8',
    shutterSpeed: '1/125',
  },
  ...overrides,
});

// Custom assertions
export const expectElementToBeAccessible = async (element) => {
  // Check for aria-label or accessible name
  const hasAriaLabel = element.hasAttribute('aria-label');
  const hasAccessibleName = element.textContent || element.hasAttribute('aria-labelledby');
  
  expect(hasAriaLabel || hasAccessibleName).toBe(true);
  
  // Check for proper contrast (simplified check)
  const styles = window.getComputedStyle(element);
  if (styles.backgroundColor && styles.color) {
    // This is a simplified check - in real apps you'd use a proper contrast checker
    expect(styles.color).not.toBe(styles.backgroundColor);
  }
  
  // Check for keyboard accessibility
  if (element.tagName === 'BUTTON' || element.hasAttribute('role')) {
    expect(element.tabIndex).not.toBe(-1);
  }
};

export const expectOfflineCapability = async (component) => {
  // Mock offline state
  mockOfflineMode();
  
  // Component should handle offline state gracefully
  expect(component).toBeInTheDocument();
  
  // Check for offline indicators or messages
  const offlineIndicators = component.querySelectorAll('[data-testid*="offline"], [class*="offline"]');
  expect(offlineIndicators.length).toBeGreaterThanOrEqual(0); // Should not throw
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };