/**
 * Mock Setup Index
 * 
 * Central export for all testing mocks
 */

import React from 'react'

export * from './auth'

// Global mock setup for Jest environment
export const setupGlobalMocks = () => {
  // Mock Next.js router
  jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(),
    useSearchParams: jest.fn(),
  }))

  // Mock Clerk authentication
  jest.mock('@clerk/nextjs', () => ({
    useSignIn: jest.fn(),
    useSignUp: jest.fn(),
    useUser: jest.fn(),
    useAuth: jest.fn(),
    SignIn: ({ children }: any) => React.createElement('div', { 'data-testid': 'clerk-sign-in' }, children),
    SignUp: ({ children }: any) => React.createElement('div', { 'data-testid': 'clerk-sign-up' }, children),
    UserButton: () => React.createElement('div', { 'data-testid': 'clerk-user-button' }),
    ClerkProvider: ({ children }: any) => React.createElement('div', { 'data-testid': 'clerk-provider' }, children),
  }))

  // Mock Sonner toast
  jest.mock('sonner', () => ({
    toast: {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warning: jest.fn(),
      loading: jest.fn(),
      dismiss: jest.fn(),
    },
    Toaster: () => React.createElement('div', { 'data-testid': 'sonner-toaster' }),
  }))

  // Mock Framer Motion
  jest.mock('framer-motion', () => ({
    motion: {
      div: ({ children, ...props }: any) => React.createElement('div', props, children),
      button: ({ children, ...props }: any) => React.createElement('button', props, children),
      form: ({ children, ...props }: any) => React.createElement('form', props, children),
      input: ({ children, ...props }: any) => React.createElement('input', props, children),
    },
    AnimatePresence: ({ children }: any) => children,
  }))

  // Mock Lucide React icons
  jest.mock('lucide-react', () => {
    const MockIcon = ({ className, ...props }: any) => 
      React.createElement('div', {
        'data-testid': `icon-${props['data-testid'] || 'generic'}`,
        className,
        ...props
      })
    
    return new Proxy({}, {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          const IconComponent = (props: any) => React.createElement(MockIcon, { ...props, 'data-testid': prop.toLowerCase() })
          IconComponent.displayName = `Mock${prop}`
          return IconComponent
        }
        return target[prop as keyof typeof target]
      }
    })
  })
}

// Mock environment variables
export const mockEnvVars = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_mock_clerk_key',
  CLERK_SECRET_KEY: 'sk_test_mock_clerk_secret',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_API_URL: 'http://localhost:3000/api',
}

// Setup environment variables for testing
export const setupTestEnv = () => {
  Object.entries(mockEnvVars).forEach(([key, value]) => {
    process.env[key] = value
  })
}

const mockSetup = {
  setupGlobalMocks,
  setupTestEnv,
  mockEnvVars
}

export default mockSetup