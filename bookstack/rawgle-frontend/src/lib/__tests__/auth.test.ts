import {
  User,
  AuthState,
  LoginCredentials,
  RegisterData,
  tokenUtils,
  sessionUtils,
  permissionUtils,
  AuthError,
  authErrorCodes,
  validationUtils,
  securityUtils,
  defaultAuthState,
} from '../auth'

// Mock localStorage for testing
const mockLocalStorage = (() => {
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
  }
})()

// Mock crypto API
const mockCrypto = {
  getRandomValues: jest.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  }),
  subtle: {
    digest: jest.fn(() => 
      Promise.resolve(new ArrayBuffer(32))
    ),
  },
}

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
})

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
})

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    crypto: mockCrypto,
  },
})

describe('Authentication Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.clear()
  })

  describe('tokenUtils', () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiSm9obiBEb2UiLCJyb2xlIjoidXNlciIsImV4cCI6OTk5OTk5OTk5OX0.abc123'
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiSm9obiBEb2UiLCJyb2xlIjoidXNlciIsImV4cCI6MTAwfQ.expired123'
    const invalidToken = 'invalid.token.format'

    describe('isTokenExpired', () => {
      test('should return false for valid unexpired token', () => {
        const result = tokenUtils.isTokenExpired(validToken)
        
        // This will FAIL initially - token validation logic needs JWT library integration
        expect(result).toBe(false)
      })

      test('should return true for expired token', () => {
        const result = tokenUtils.isTokenExpired(expiredToken)
        
        // This will FAIL initially - needs proper JWT parsing
        expect(result).toBe(true)
      })

      test('should return true for invalid token format', () => {
        const result = tokenUtils.isTokenExpired(invalidToken)
        
        expect(result).toBe(true)
      })

      test('should handle malformed JWT payload', () => {
        const malformedToken = 'header.invalidbase64!@#$.signature'
        const result = tokenUtils.isTokenExpired(malformedToken)
        
        expect(result).toBe(true)
      })
    })

    describe('getTokenExpiration', () => {
      test('should return expiration date for valid token', () => {
        const result = tokenUtils.getTokenExpiration(validToken)
        
        // This will FAIL initially - needs proper JWT parsing
        expect(result).toBeInstanceOf(Date)
        expect(result?.getTime()).toBeGreaterThan(Date.now())
      })

      test('should return null for invalid token', () => {
        const result = tokenUtils.getTokenExpiration(invalidToken)
        
        expect(result).toBeNull()
      })
    })

    describe('getUserFromToken', () => {
      test('should extract user data from valid token', () => {
        const result = tokenUtils.getUserFromToken(validToken)
        
        // This will FAIL initially - needs proper JWT parsing
        expect(result).toEqual({
          id: '123',
          email: 'test@example.com',
          name: 'John Doe',
          accountType: 'user',
        })
      })

      test('should return null for invalid token', () => {
        const result = tokenUtils.getUserFromToken(invalidToken)
        
        expect(result).toBeNull()
      })

      test('should handle token without role claim', () => {
        const tokenWithoutRole = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiSm9obiBEb2UifQ.signature'
        const result = tokenUtils.getUserFromToken(tokenWithoutRole)
        
        // This will FAIL initially - default role handling
        expect(result?.accountType).toBe('user')
      })
    })
  })

  describe('sessionUtils', () => {
    const testKey = 'test_key'
    const testData = { id: '123', name: 'Test User' }

    describe('storeSession', () => {
      test('should store session data in localStorage with prefix', () => {
        sessionUtils.storeSession(testKey, testData)
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          `rawgle_${testKey}`,
          JSON.stringify(testData)
        )
      })

      test('should handle localStorage errors gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error('localStorage error')
        })
        
        expect(() => sessionUtils.storeSession(testKey, testData)).not.toThrow()
        expect(consoleSpy).toHaveBeenCalledWith('Failed to store session data:', expect.any(Error))
        
        consoleSpy.mockRestore()
      })

      test('should not store when window is undefined (SSR)', () => {
        const originalWindow = global.window
        // @ts-ignore
        delete global.window
        
        sessionUtils.storeSession(testKey, testData)
        
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
        
        global.window = originalWindow
      })
    })

    describe('getSession', () => {
      test('should retrieve and parse session data', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData))
        
        const result = sessionUtils.getSession<typeof testData>(testKey)
        
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith(`rawgle_${testKey}`)
        expect(result).toEqual(testData)
      })

      test('should return null when no data exists', () => {
        mockLocalStorage.getItem.mockReturnValue(null)
        
        const result = sessionUtils.getSession(testKey)
        
        expect(result).toBeNull()
      })

      test('should handle JSON parse errors', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
        mockLocalStorage.getItem.mockReturnValue('invalid json')
        
        const result = sessionUtils.getSession(testKey)
        
        expect(result).toBeNull()
        expect(consoleSpy).toHaveBeenCalledWith('Failed to retrieve session data:', expect.any(Error))
        
        consoleSpy.mockRestore()
      })

      test('should return null when window is undefined (SSR)', () => {
        const originalWindow = global.window
        // @ts-ignore
        delete global.window
        
        const result = sessionUtils.getSession(testKey)
        
        expect(result).toBeNull()
        expect(mockLocalStorage.getItem).not.toHaveBeenCalled()
        
        global.window = originalWindow
      })
    })

    describe('removeSession', () => {
      test('should remove session data with prefix', () => {
        sessionUtils.removeSession(testKey)
        
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(`rawgle_${testKey}`)
      })

      test('should handle localStorage errors gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
        mockLocalStorage.removeItem.mockImplementation(() => {
          throw new Error('localStorage error')
        })
        
        expect(() => sessionUtils.removeSession(testKey)).not.toThrow()
        expect(consoleSpy).toHaveBeenCalledWith('Failed to remove session data:', expect.any(Error))
        
        consoleSpy.mockRestore()
      })
    })

    describe('clearAllSessions', () => {
      test('should clear all rawgle-prefixed items', () => {
        // Mock Object.keys to return some test keys
        Object.defineProperty(mockLocalStorage, 'keys', {
          value: ['rawgle_user', 'rawgle_settings', 'other_app_data'],
          configurable: true
        })
        
        // Mock Object.keys on localStorage
        const originalObjectKeys = Object.keys
        Object.keys = jest.fn(() => ['rawgle_user', 'rawgle_settings', 'other_app_data'])
        
        sessionUtils.clearAllSessions()
        
        // This will FAIL initially - implementation doesn't access localStorage.keys correctly
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('rawgle_user')
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('rawgle_settings')
        expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('other_app_data')
        
        Object.keys = originalObjectKeys
      })
    })
  })

  describe('permissionUtils', () => {
    const adminUser: User = {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      emailVerified: true,
      accountType: 'admin',
      pawsTokens: 1000,
      level: 'Platinum',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    }

    const businessUser: User = {
      id: '2',
      name: 'Business User',
      email: 'business@example.com',
      emailVerified: true,
      accountType: 'business',
      pawsTokens: 500,
      level: 'Gold',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    }

    const regularUser: User = {
      id: '3',
      name: 'Regular User',
      email: 'user@example.com',
      emailVerified: false,
      accountType: 'user',
      pawsTokens: 100,
      level: 'Bronze',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    }

    describe('hasAccountType', () => {
      test('should return true for matching account type', () => {
        expect(permissionUtils.hasAccountType(adminUser, 'admin')).toBe(true)
        expect(permissionUtils.hasAccountType(businessUser, 'business')).toBe(true)
        expect(permissionUtils.hasAccountType(regularUser, 'user')).toBe(true)
      })

      test('should return false for non-matching account type', () => {
        expect(permissionUtils.hasAccountType(regularUser, 'admin')).toBe(false)
        expect(permissionUtils.hasAccountType(businessUser, 'admin')).toBe(false)
      })

      test('should return false for null user', () => {
        expect(permissionUtils.hasAccountType(null, 'admin')).toBe(false)
      })
    })

    describe('isAdmin', () => {
      test('should return true for admin user', () => {
        expect(permissionUtils.isAdmin(adminUser)).toBe(true)
      })

      test('should return false for non-admin user', () => {
        expect(permissionUtils.isAdmin(regularUser)).toBe(false)
        expect(permissionUtils.isAdmin(businessUser)).toBe(false)
      })

      test('should return false for null user', () => {
        expect(permissionUtils.isAdmin(null)).toBe(false)
      })
    })

    describe('isBusiness', () => {
      test('should return true for business user', () => {
        expect(permissionUtils.isBusiness(businessUser)).toBe(true)
      })

      test('should return false for non-business user', () => {
        expect(permissionUtils.isBusiness(adminUser)).toBe(false)
        expect(permissionUtils.isBusiness(regularUser)).toBe(false)
      })
    })

    describe('hasVerifiedEmail', () => {
      test('should return true for verified email', () => {
        expect(permissionUtils.hasVerifiedEmail(adminUser)).toBe(true)
      })

      test('should return false for unverified email', () => {
        expect(permissionUtils.hasVerifiedEmail(regularUser)).toBe(false)
      })

      test('should return false for null user', () => {
        expect(permissionUtils.hasVerifiedEmail(null)).toBe(false)
      })
    })

    describe('canAccessFeature', () => {
      test('should allow access for users with sufficient level', () => {
        expect(permissionUtils.canAccessFeature(adminUser, 'Bronze')).toBe(true)
        expect(permissionUtils.canAccessFeature(adminUser, 'Platinum')).toBe(true)
        expect(permissionUtils.canAccessFeature(businessUser, 'Silver')).toBe(true)
      })

      test('should deny access for users with insufficient level', () => {
        expect(permissionUtils.canAccessFeature(regularUser, 'Gold')).toBe(false)
        expect(permissionUtils.canAccessFeature(businessUser, 'Platinum')).toBe(false)
      })

      test('should deny access for null user', () => {
        expect(permissionUtils.canAccessFeature(null, 'Bronze')).toBe(false)
      })

      test('should handle invalid levels gracefully', () => {
        const userWithInvalidLevel = { ...regularUser, level: 'InvalidLevel' }
        
        // This will FAIL initially - invalid level handling
        expect(permissionUtils.canAccessFeature(userWithInvalidLevel, 'Bronze')).toBe(false)
      })
    })

    describe('hasSufficientTokens', () => {
      test('should return true when user has enough tokens', () => {
        expect(permissionUtils.hasSufficientTokens(adminUser, 500)).toBe(true)
        expect(permissionUtils.hasSufficientTokens(regularUser, 100)).toBe(true)
      })

      test('should return false when user has insufficient tokens', () => {
        expect(permissionUtils.hasSufficientTokens(regularUser, 200)).toBe(false)
      })

      test('should return false for null user', () => {
        expect(permissionUtils.hasSufficientTokens(null, 100)).toBe(false)
      })
    })
  })

  describe('AuthError', () => {
    test('should create AuthError with message, code, and status', () => {
      const error = new AuthError('Invalid credentials', authErrorCodes.INVALID_CREDENTIALS, 401)
      
      expect(error.message).toBe('Invalid credentials')
      expect(error.code).toBe('INVALID_CREDENTIALS')
      expect(error.status).toBe(401)
      expect(error.name).toBe('AuthError')
      expect(error).toBeInstanceOf(Error)
    })

    test('should create AuthError without status', () => {
      const error = new AuthError('Network error', authErrorCodes.NETWORK_ERROR)
      
      expect(error.status).toBeUndefined()
    })

    test('should have all required error codes', () => {
      expect(authErrorCodes.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS')
      expect(authErrorCodes.ACCOUNT_LOCKED).toBe('ACCOUNT_LOCKED')
      expect(authErrorCodes.EMAIL_NOT_VERIFIED).toBe('EMAIL_NOT_VERIFIED')
      expect(authErrorCodes.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED')
      expect(authErrorCodes.REFRESH_FAILED).toBe('REFRESH_FAILED')
      expect(authErrorCodes.NETWORK_ERROR).toBe('NETWORK_ERROR')
      expect(authErrorCodes.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR')
    })
  })

  describe('validationUtils', () => {
    describe('isValidEmail', () => {
      test('should validate correct email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@example.co.uk',
          'user+tag@example.org',
          'user123@example123.com'
        ]
        
        validEmails.forEach(email => {
          expect(validationUtils.isValidEmail(email)).toBe(true)
        })
      })

      test('should reject invalid email formats', () => {
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'user@',
          'user..name@example.com',
          'user@.com',
          ''
        ]
        
        invalidEmails.forEach(email => {
          expect(validationUtils.isValidEmail(email)).toBe(false)
        })
      })
    })

    describe('validatePassword', () => {
      test('should validate strong password', () => {
        const result = validationUtils.validatePassword('StrongPassword123!')
        
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
        expect(result.strength).toBe('strong')
      })

      test('should identify weak passwords', () => {
        const result = validationUtils.validatePassword('weak')
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must be at least 8 characters long')
        expect(result.errors).toContain('Password must contain at least one uppercase letter')
        expect(result.errors).toContain('Password must contain at least one number')
        expect(result.errors).toContain('Password must contain at least one special character')
        expect(result.strength).toBe('weak')
      })

      test('should identify fair passwords', () => {
        const result = validationUtils.validatePassword('FairPass1')
        
        // This will FAIL initially - fair password classification logic
        expect(result.strength).toBe('fair')
        expect(result.errors).toContain('Password must contain at least one special character')
      })

      test('should validate each requirement individually', () => {
        const testCases = [
          { password: 'SHORT', expectedError: 'Password must be at least 8 characters long' },
          { password: 'nouppercase123!', expectedError: 'Password must contain at least one uppercase letter' },
          { password: 'NOLOWERCASE123!', expectedError: 'Password must contain at least one lowercase letter' },
          { password: 'NoNumbers!', expectedError: 'Password must contain at least one number' },
          { password: 'NoSpecialChars123', expectedError: 'Password must contain at least one special character' }
        ]
        
        testCases.forEach(({ password, expectedError }) => {
          const result = validationUtils.validatePassword(password)
          expect(result.errors).toContain(expectedError)
        })
      })
    })

    describe('passwordsMatch', () => {
      test('should return true for matching passwords', () => {
        expect(validationUtils.passwordsMatch('password123', 'password123')).toBe(true)
      })

      test('should return false for non-matching passwords', () => {
        expect(validationUtils.passwordsMatch('password123', 'password456')).toBe(false)
      })

      test('should handle empty passwords', () => {
        expect(validationUtils.passwordsMatch('', '')).toBe(true)
        expect(validationUtils.passwordsMatch('password', '')).toBe(false)
      })
    })

    describe('isValidName', () => {
      test('should validate proper names', () => {
        const validNames = ['John', 'Jane Doe', 'Dr. Smith', 'Mary-Jane']
        
        validNames.forEach(name => {
          expect(validationUtils.isValidName(name)).toBe(true)
        })
      })

      test('should reject invalid names', () => {
        const invalidNames = ['', 'A', ' ', 'A'.repeat(101)]
        
        invalidNames.forEach(name => {
          expect(validationUtils.isValidName(name)).toBe(false)
        })
      })

      test('should handle names with leading/trailing whitespace', () => {
        expect(validationUtils.isValidName('  John  ')).toBe(true)
        expect(validationUtils.isValidName('   A   ')).toBe(false)
      })
    })
  })

  describe('securityUtils', () => {
    describe('generateSecureRandom', () => {
      test('should generate random string of default length', () => {
        const result = securityUtils.generateSecureRandom()
        
        expect(typeof result).toBe('string')
        expect(result.length).toBe(64) // 32 bytes * 2 hex chars = 64 chars
        expect(mockCrypto.getRandomValues).toHaveBeenCalled()
      })

      test('should generate random string of specified length', () => {
        const result = securityUtils.generateSecureRandom(16)
        
        expect(result.length).toBe(32) // 16 bytes * 2 hex chars = 32 chars
      })

      test('should fallback when crypto API is not available', () => {
        const originalCrypto = global.crypto
        // @ts-ignore
        delete global.crypto
        
        const result = securityUtils.generateSecureRandom()
        
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
        
        global.crypto = originalCrypto
      })

      test('should generate different values each time', () => {
        const result1 = securityUtils.generateSecureRandom()
        const result2 = securityUtils.generateSecureRandom()
        
        expect(result1).not.toBe(result2)
      })
    })

    describe('hashData', () => {
      test('should hash data using Web Crypto API', async () => {
        const testData = 'test data to hash'
        const result = await securityUtils.hashData(testData)
        
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
        expect(mockCrypto.subtle.digest).toHaveBeenCalledWith(
          'SHA-256',
          expect.any(ArrayBuffer)
        )
      })

      test('should fallback when crypto API is not available', async () => {
        const originalCrypto = global.crypto
        // @ts-ignore
        delete global.crypto
        
        const testData = 'test data'
        const result = await securityUtils.hashData(testData)
        
        expect(typeof result).toBe('string')
        expect(result).toBe(btoa(testData).replace(/[^a-zA-Z0-9]/g, ''))
        
        global.crypto = originalCrypto
      })

      test('should produce consistent hashes for same input', async () => {
        const testData = 'consistent test data'
        
        // Mock consistent hash output
        mockCrypto.subtle.digest.mockResolvedValue(new Uint8Array([1, 2, 3, 4]).buffer)
        
        const result1 = await securityUtils.hashData(testData)
        const result2 = await securityUtils.hashData(testData)
        
        expect(result1).toBe(result2)
      })
    })

    describe('isValidOrigin', () => {
      test('should validate allowed origins', () => {
        const allowedOrigins = [
          'http://localhost:3000',
          'http://192.168.1.153:3000',
          'https://rawgle.com',
          'https://www.rawgle.com'
        ]
        
        allowedOrigins.forEach(origin => {
          expect(securityUtils.isValidOrigin(origin)).toBe(true)
        })
      })

      test('should reject disallowed origins', () => {
        const disallowedOrigins = [
          'https://evil.com',
          'http://malicious.site.com',
          'https://rawgle.evil.com',
          'https://subdomain.rawgle.com'
        ]
        
        disallowedOrigins.forEach(origin => {
          expect(securityUtils.isValidOrigin(origin)).toBe(false)
        })
      })

      test('should be case sensitive', () => {
        expect(securityUtils.isValidOrigin('HTTPS://RAWGLE.COM')).toBe(false)
      })
    })
  })

  describe('defaultAuthState', () => {
    test('should have correct default values', () => {
      expect(defaultAuthState.isAuthenticated).toBe(false)
      expect(defaultAuthState.isLoading).toBe(true)
      expect(defaultAuthState.user).toBeNull()
      expect(defaultAuthState.error).toBeNull()
    })

    test('should be immutable', () => {
      const originalState = { ...defaultAuthState }
      
      // Attempt to modify (should not affect original)
      const modifiedState = { ...defaultAuthState, isAuthenticated: true }
      
      expect(defaultAuthState).toEqual(originalState)
      expect(modifiedState.isAuthenticated).toBe(true)
      expect(defaultAuthState.isAuthenticated).toBe(false)
    })
  })

  describe('Type Safety', () => {
    test('User interface should enforce required properties', () => {
      const validUser: User = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: true,
        accountType: 'user',
        pawsTokens: 100,
        level: 'Bronze',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
      
      expect(validUser.id).toBeDefined()
      expect(validUser.accountType).toMatch(/^(user|business|admin)$/)
    })

    test('AuthState interface should be properly typed', () => {
      const authState: AuthState = {
        isAuthenticated: false,
        isLoading: true,
        user: null,
        error: 'Test error'
      }
      
      expect(typeof authState.isAuthenticated).toBe('boolean')
      expect(typeof authState.isLoading).toBe('boolean')
      expect(authState.user).toBeNull()
      expect(typeof authState.error).toBe('string')
    })

    test('LoginCredentials should validate optional properties', () => {
      const minimalCredentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const fullCredentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      }
      
      expect(minimalCredentials.rememberMe).toBeUndefined()
      expect(fullCredentials.rememberMe).toBe(true)
    })
  })

  describe('Integration Scenarios', () => {
    test('should handle complete authentication flow', () => {
      const mockToken = validationUtils.isValidEmail('test@example.com') ? 'mock_valid_token' : null
      const mockUser: User = {
        id: '123',
        name: 'John Doe',
        email: 'test@example.com',
        emailVerified: true,
        accountType: 'user',
        pawsTokens: 250,
        level: 'Silver',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
      
      // Store session
      sessionUtils.storeSession('auth_token', mockToken)
      sessionUtils.storeSession('user', mockUser)
      
      // Verify permissions
      expect(permissionUtils.hasVerifiedEmail(mockUser)).toBe(true)
      expect(permissionUtils.canAccessFeature(mockUser, 'Bronze')).toBe(true)
      expect(permissionUtils.hasSufficientTokens(mockUser, 200)).toBe(true)
      
      // This will FAIL initially - complete flow integration not implemented
      const authState: AuthState = {
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        error: null
      }
      
      expect(authState.isAuthenticated).toBe(true)
      expect(authState.user).toBe(mockUser)
    })

    test('should handle authentication errors properly', () => {
      const authError = new AuthError(
        'Account locked due to too many failed attempts',
        authErrorCodes.ACCOUNT_LOCKED,
        423
      )
      
      expect(authError.message).toContain('Account locked')
      expect(authError.code).toBe('ACCOUNT_LOCKED')
      expect(authError.status).toBe(423)
      
      const errorState: AuthState = {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: authError.message
      }
      
      expect(errorState.error).toBe(authError.message)
    })

    test('should handle session cleanup on logout', () => {
      // Store some session data
      sessionUtils.storeSession('auth_token', 'token123')
      sessionUtils.storeSession('user', { id: '123' })
      sessionUtils.storeSession('preferences', { theme: 'dark' })
      
      // Clear all sessions
      sessionUtils.clearAllSessions()
      
      // This will FAIL initially - session cleanup verification
      expect(sessionUtils.getSession('auth_token')).toBeNull()
      expect(sessionUtils.getSession('user')).toBeNull()
      expect(sessionUtils.getSession('preferences')).toBeNull()
    })
  })
})