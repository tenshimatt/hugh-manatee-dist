import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock mediaDevices
const mockMediaDevices = {
  getUserMedia: vi.fn(),
  enumerateDevices: vi.fn(),
  getSupportedConstraints: vi.fn(),
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true,
});

// Mock navigator.onLine
Object.defineProperty(global.navigator, 'onLine', {
  value: true,
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock URL.createObjectURL
Object.defineProperty(global.URL, 'createObjectURL', {
  value: vi.fn(() => 'mock-object-url'),
  writable: true,
});

Object.defineProperty(global.URL, 'revokeObjectURL', {
  value: vi.fn(),
  writable: true,
});

// Mock MediaRecorder
global.MediaRecorder = vi.fn(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  ondataavailable: null,
  onstop: null,
  onerror: null,
  state: 'inactive',
}));

// Mock SpeechRecognition
const mockSpeechRecognition = vi.fn(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  onresult: null,
  onerror: null,
  onend: null,
}));

global.SpeechRecognition = mockSpeechRecognition;
global.webkitSpeechRecognition = mockSpeechRecognition;

// Mock service worker
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
    register: vi.fn(() => Promise.resolve({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      sync: {
        register: vi.fn(() => Promise.resolve()),
      },
      pushManager: {
        subscribe: vi.fn(() => Promise.resolve({
          endpoint: 'mock-endpoint',
          keys: {
            p256dh: 'mock-p256dh',
            auth: 'mock-auth',
          },
        })),
      },
    }),
    controller: {
      postMessage: vi.fn(),
    },
  },
  writable: true,
});

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      objectStoreNames: {
        contains: vi.fn(() => false),
      },
      createObjectStore: vi.fn(() => ({
        createIndex: vi.fn(),
      })),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          get: vi.fn(),
          put: vi.fn(),
          delete: vi.fn(),
          getAll: vi.fn(),
          clear: vi.fn(),
        })),
      })),
    },
  })),
};

Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

// Mock Notification
global.Notification = {
  permission: 'default',
  requestPermission: vi.fn(() => Promise.resolve('granted')),
};

// Mock performance
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
  },
  writable: true,
});

// Mock canvas context
const mockCanvasContext = {
  drawImage: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  toDataURL: vi.fn(() => 'data:image/png;base64,mock-data'),
};

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext);
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock-data');

// Mock video element
Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
  get: vi.fn(() => 640),
});

Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
  get: vi.fn(() => 480),
});

// Global test utilities
global.mockGeolocationSuccess = (position) => {
  mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
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
};

global.mockGeolocationError = (error) => {
  mockGeolocation.getCurrentPosition.mockImplementationOnce((success, errorCallback) => {
    errorCallback({
      code: 1,
      message: 'User denied Geolocation',
      ...error,
    });
  });
};

global.mockCameraSuccess = () => {
  mockMediaDevices.getUserMedia.mockResolvedValueOnce({
    getTracks: vi.fn(() => [{
      stop: vi.fn(),
    }]),
  });
};

global.mockCameraError = () => {
  mockMediaDevices.getUserMedia.mockRejectedValueOnce(
    new Error('Camera access denied')
  );
};

global.mockOfflineMode = () => {
  Object.defineProperty(global.navigator, 'onLine', {
    value: false,
    writable: true,
  });
  
  window.dispatchEvent(new Event('offline'));
};

global.mockOnlineMode = () => {
  Object.defineProperty(global.navigator, 'onLine', {
    value: true,
    writable: true,
  });
  
  window.dispatchEvent(new Event('online'));
};

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});