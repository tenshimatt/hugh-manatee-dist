/**
 * Authentication Mocks for Testing
 * 
 * Provides comprehensive mocking for:
 * - Clerk authentication hooks and methods
 * - OAuth providers (Google, Apple, Web3)
 * - API endpoints for registration/login
 * - Session management
 * - Error scenarios
 */

import React from 'react'
import { User } from '@/lib/auth'

// Mock user data for testing scenarios
export const mockUsers = {
  validUser: {
    id: 'user_2024_test_001',
    firstName: 'John',
    lastName: 'Doe',
    emailAddress: 'john.doe@example.com',
    hasImage: false,
    imageUrl: '',
    createdAt: new Date('2024-01-01').getTime(),
    updatedAt: new Date('2024-01-01').getTime(),
    emailAddresses: [
      {
        id: 'email_001',
        emailAddress: 'john.doe@example.com',
        verification: {
          status: 'verified',
          strategy: 'email_code'
        }
      }
    ],
    publicMetadata: {
      accountType: 'user',
      pawsTokens: 250,
      level: 'Silver'
    }
  },
  adminUser: {
    id: 'user_2024_admin_001',
    firstName: 'Jane',
    lastName: 'Admin',
    emailAddress: 'admin@rawgle.com',
    hasImage: true,
    imageUrl: 'https://example.com/admin-avatar.jpg',
    createdAt: new Date('2024-01-01').getTime(),
    updatedAt: new Date('2024-01-01').getTime(),
    emailAddresses: [
      {
        id: 'email_002',
        emailAddress: 'admin@rawgle.com',
        verification: {
          status: 'verified',
          strategy: 'email_code'
        }
      }
    ],
    publicMetadata: {
      accountType: 'admin',
      pawsTokens: 10000,
      level: 'Platinum'
    }
  },
  unverifiedUser: {
    id: 'user_2024_unverified_001',
    firstName: 'Bob',
    lastName: 'Unverified',
    emailAddress: 'bob.unverified@example.com',
    hasImage: false,
    imageUrl: '',
    createdAt: new Date('2024-01-01').getTime(),
    updatedAt: new Date('2024-01-01').getTime(),
    emailAddresses: [
      {
        id: 'email_003',
        emailAddress: 'bob.unverified@example.com',
        verification: {
          status: 'unverified',
          strategy: 'email_code'
        }
      }
    ],
    publicMetadata: {
      accountType: 'user',
      pawsTokens: 0,
      level: 'Bronze'
    }
  }
}

// Mock authentication responses
export const mockAuthResponses = {
  signInSuccess: {
    status: 'complete',
    createdSessionId: 'sess_2024_test_001',
    createdUserId: mockUsers.validUser.id
  },
  signInPending: {
    status: 'needs_verification',
    verifications: {
      emailAddress: {
        status: 'unverified',
        strategy: 'email_code'
      }
    }
  },
  signUpSuccess: {
    status: 'complete',
    createdUserId: mockUsers.validUser.id,
    createdSessionId: 'sess_2024_test_002'
  },
  signUpPending: {
    status: 'missing_requirements',
    missingFields: ['password'],
    unverifiedFields: ['email_address']
  }
}

// Mock authentication errors
export const mockAuthErrors = {
  invalidCredentials: {
    errors: [
      {
        code: 'form_identifier_not_found',
        message: 'Invalid email or password',
        longMessage: 'Couldn\'t find your account with that email address.',
        meta: { paramName: 'identifier' }
      }
    ]
  },
  incorrectPassword: {
    errors: [
      {
        code: 'form_password_incorrect',
        message: 'Incorrect password',
        longMessage: 'Password is incorrect. Try again, or use another method.',
        meta: { paramName: 'password' }
      }
    ]
  },
  accountLocked: {
    errors: [
      {
        code: 'form_password_incorrect_too_many_attempts',
        message: 'Account temporarily locked',
        longMessage: 'Your account has been temporarily locked due to too many failed sign in attempts.',
        meta: { paramName: 'password' }
      }
    ]
  },
  emailExists: {
    errors: [
      {
        code: 'form_identifier_exists',
        message: 'Email already exists',
        longMessage: 'That email address is taken. Please try another.',
        meta: { paramName: 'email_address' }
      }
    ]
  },
  weakPassword: {
    errors: [
      {
        code: 'form_password_pwned',
        message: 'Password is too common',
        longMessage: 'This password has been found in an online data breach. For your security, please use a different password.',
        meta: { paramName: 'password' }
      }
    ]
  },
  networkError: new Error('Network request failed'),
  rateLimited: {
    errors: [
      {
        code: 'form_password_incorrect_too_many_attempts',
        message: 'Too many attempts. Please try again later.',
        longMessage: 'You\'ve made too many unsuccessful attempts in a short period of time. Please wait before trying again.',
        meta: { paramName: 'global' }
      }
    ]
  },
  oauthError: {
    errors: [
      {
        code: 'oauth_access_denied',
        message: 'OAuth access denied',
        longMessage: 'The OAuth provider denied access. Please try again or use a different sign in method.',
        meta: { paramName: 'oauth' }
      }
    ]
  }
}

// Mock Clerk useSignIn hook
export const createMockUseSignIn = (scenario: 'success' | 'error' | 'loading' = 'success') => {
  const mockSignIn = jest.fn()
  const mockSetActive = jest.fn()

  switch (scenario) {
    case 'success':
      mockSignIn.mockResolvedValue(mockAuthResponses.signInSuccess)
      mockSetActive.mockResolvedValue(undefined)
      break
    case 'error':
      mockSignIn.mockRejectedValue(mockAuthErrors.invalidCredentials)
      break
    case 'loading':
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 2000)))
      break
  }

  return {
    isLoaded: scenario !== 'loading',
    signIn: mockSignIn,
    setActive: mockSetActive
  }
}

// Mock Clerk useSignUp hook
export const createMockUseSignUp = (scenario: 'success' | 'error' | 'loading' = 'success') => {
  const mockSignUp = jest.fn()
  const mockSetActive = jest.fn()

  switch (scenario) {
    case 'success':
      mockSignUp.mockResolvedValue(mockAuthResponses.signUpSuccess)
      mockSetActive.mockResolvedValue(undefined)
      break
    case 'error':
      mockSignUp.mockRejectedValue(mockAuthErrors.emailExists)
      break
    case 'loading':
      mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 2000)))
      break
  }

  return {
    isLoaded: scenario !== 'loading',
    signUp: mockSignUp,
    setActive: mockSetActive
  }
}

// Mock Clerk useUser hook
export const createMockUseUser = (userType: 'valid' | 'admin' | 'unverified' | 'none' = 'none') => {
  let user = null
  let isSignedIn = false

  switch (userType) {
    case 'valid':
      user = mockUsers.validUser
      isSignedIn = true
      break
    case 'admin':
      user = mockUsers.adminUser
      isSignedIn = true
      break
    case 'unverified':
      user = mockUsers.unverifiedUser
      isSignedIn = true
      break
  }

  return {
    isLoaded: true,
    isSignedIn,
    user
  }
}

// Mock OAuth authentication
export const createMockOAuthSignIn = (provider: 'google' | 'apple', scenario: 'success' | 'error' = 'success') => {
  const mockAuthenticateWithRedirect = jest.fn()

  if (scenario === 'success') {
    mockAuthenticateWithRedirect.mockResolvedValue(undefined) // OAuth redirects, no return value
  } else {
    mockAuthenticateWithRedirect.mockRejectedValue(mockAuthErrors.oauthError)
  }

  return mockAuthenticateWithRedirect
}

// Mock API responses for registration/login
export const mockApiResponses = {
  registerSuccess: {
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      success: true,
      user: {
        id: mockUsers.validUser.id,
        email: mockUsers.validUser.emailAddress
      },
      message: 'Account created successfully'
    })
  },
  registerError: {
    ok: false,
    status: 400,
    json: () => Promise.resolve({
      success: false,
      errors: {
        email: ['Email address already exists']
      },
      message: 'Validation failed'
    })
  },
  networkError: {
    ok: false,
    status: 0,
    json: () => Promise.reject(new Error('Network error'))
  }
}

// Mock fetch for API calls
export const createMockFetch = (scenario: 'success' | 'error' | 'network-error' = 'success') => {
  const mockFetch = jest.fn()

  switch (scenario) {
    case 'success':
      mockFetch.mockResolvedValue(mockApiResponses.registerSuccess)
      break
    case 'error':
      mockFetch.mockResolvedValue(mockApiResponses.registerError)
      break
    case 'network-error':
      mockFetch.mockRejectedValue(new Error('Network error'))
      break
  }

  return mockFetch
}

// Mock navigation/router
export const createMockRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/auth/sign-in',
  query: {},
  asPath: '/auth/sign-in'
})

// Mock toast notifications
export const createMockToast = () => ({
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn()
})

// Mock validation utilities for registration
export const createMockValidation = (scenario: 'valid' | 'invalid' = 'valid') => {
  const mockRegistrationSchema = {
    safeParse: jest.fn()
  }
  
  const mockValidateEmail = jest.fn()
  const mockCalculatePasswordStrength = jest.fn()
  const mockCheckPasswordBreach = jest.fn()
  const mockGetRateLimitState = jest.fn()
  const mockUpdateRateLimitState = jest.fn()

  if (scenario === 'valid') {
    mockRegistrationSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        agreedToTerms: true,
        wantsNewsletter: true
      }
    })
    mockValidateEmail.mockReturnValue({ isValid: true, error: undefined })
    mockCalculatePasswordStrength.mockReturnValue({ percentage: 85, color: 'green' })
    mockCheckPasswordBreach.mockResolvedValue(false)
    mockGetRateLimitState.mockReturnValue({ isBlocked: false, resetTime: 0 })
  } else {
    mockRegistrationSchema.safeParse.mockReturnValue({
      success: false,
      error: {
        errors: [
          { path: ['firstName'], message: 'First name is required' },
          { path: ['email'], message: 'Invalid email format' },
          { path: ['password'], message: 'Password is too weak' }
        ]
      }
    })
    mockValidateEmail.mockReturnValue({ isValid: false, error: 'Invalid email format' })
    mockCalculatePasswordStrength.mockReturnValue({ percentage: 25, color: 'red' })
    mockCheckPasswordBreach.mockResolvedValue(true)
    mockGetRateLimitState.mockReturnValue({ isBlocked: true, resetTime: Date.now() + 300000 })
  }

  return {
    registrationSchema: mockRegistrationSchema,
    validateEmail: mockValidateEmail,
    calculatePasswordStrength: mockCalculatePasswordStrength,
    checkPasswordBreach: mockCheckPasswordBreach,
    getRateLimitState: mockGetRateLimitState,
    updateRateLimitState: mockUpdateRateLimitState,
    debounce: jest.fn(fn => fn),
    getFieldAriaProps: jest.fn(() => ({})),
    sanitizeInput: jest.fn(input => input),
    passwordRequirements: [
      { id: 'length', label: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
      { id: 'uppercase', label: 'One uppercase letter', test: (pwd: string) => /[A-Z]/.test(pwd) },
      { id: 'lowercase', label: 'One lowercase letter', test: (pwd: string) => /[a-z]/.test(pwd) },
      { id: 'number', label: 'One number', test: (pwd: string) => /\d/.test(pwd) },
    ]
  }
}

// Mock localStorage for session testing
export const createMockLocalStorage = () => {
  let store: { [key: string]: string } = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length
    }
  }
}

// Mock crypto API for security testing
export const createMockCrypto = () => ({
  getRandomValues: jest.fn((array: Uint8Array) => {
    // Fill with predictable test values
    for (let i = 0; i < array.length; i++) {
      array[i] = i % 256
    }
    return array
  }),
  subtle: {
    digest: jest.fn((algorithm: string, data: BufferSource) => {
      // Return a predictable hash for testing
      const testHash = new Uint8Array(32).fill(42) // Fill with 42 for predictable results
      return Promise.resolve(testHash.buffer)
    })
  }
})

// Mock framer-motion for animation testing
export const createMockFramerMotion = () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
    button: ({ children, ...props }: any) => React.createElement('button', props, children),
    form: ({ children, ...props }: any) => React.createElement('form', props, children)
  },
  AnimatePresence: ({ children }: any) => children
})

// Helper functions for test scenarios
export const authTestHelpers = {
  /**
   * Setup standard authentication test scenario
   */
  setupAuthTest: (scenario: 'signin' | 'signup' | 'oauth' = 'signin') => {
    const mockRouter = createMockRouter()
    const mockToast = createMockToast()
    const mockFetch = createMockFetch('success')
    const mockValidation = createMockValidation('valid')

    let mockAuth
    if (scenario === 'signin') {
      mockAuth = createMockUseSignIn('success')
    } else if (scenario === 'signup') {
      mockAuth = createMockUseSignUp('success')
    }

    return {
      mockRouter,
      mockToast,
      mockFetch,
      mockValidation,
      mockAuth
    }
  },

  /**
   * Setup error scenario for testing
   */
  setupErrorScenario: (errorType: 'network' | 'validation' | 'auth' | 'rate-limit') => {
    const mockRouter = createMockRouter()
    const mockToast = createMockToast()

    let mockFetch, mockValidation, mockAuth

    switch (errorType) {
      case 'network':
        mockFetch = createMockFetch('network-error')
        mockValidation = createMockValidation('valid')
        mockAuth = createMockUseSignIn('success')
        break
      case 'validation':
        mockFetch = createMockFetch('success')
        mockValidation = createMockValidation('invalid')
        mockAuth = createMockUseSignIn('success')
        break
      case 'auth':
        mockFetch = createMockFetch('success')
        mockValidation = createMockValidation('valid')
        mockAuth = createMockUseSignIn('error')
        break
      case 'rate-limit':
        mockFetch = createMockFetch('success')
        mockValidation = createMockValidation('valid')
        mockValidation.getRateLimitState.mockReturnValue({ 
          isBlocked: true, 
          resetTime: Date.now() + 300000 
        })
        mockAuth = createMockUseSignIn('success')
        break
    }

    return {
      mockRouter,
      mockToast,
      mockFetch,
      mockValidation,
      mockAuth
    }
  },

  /**
   * Mock user interaction helpers
   */
  createUserInteractions: () => ({
    typeInField: async (field: HTMLElement, text: string) => {
      // Simulate user typing
      field.focus()
      field.setAttribute('value', text)
      return field
    },
    clickButton: async (button: HTMLElement) => {
      // Simulate button click
      button.click()
      return button
    }
  })
}

const authMocks = {
  mockUsers,
  mockAuthResponses,
  mockAuthErrors,
  createMockUseSignIn,
  createMockUseSignUp,
  createMockUseUser,
  createMockOAuthSignIn,
  mockApiResponses,
  createMockFetch,
  createMockRouter,
  createMockToast,
  createMockValidation,
  createMockLocalStorage,
  createMockCrypto,
  createMockFramerMotion,
  authTestHelpers
}

export default authMocks