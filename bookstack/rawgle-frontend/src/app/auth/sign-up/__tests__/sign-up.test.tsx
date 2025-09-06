import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import SignUpPage from '../page'
import EnhancedRegistration from '@/components/auth/enhanced-registration'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
}))

jest.mock('@clerk/nextjs', () => ({
  useSignUp: jest.fn(),
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Dog: () => <div data-testid="dog-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  User: () => <div data-testid="user-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  ArrowRight: () => <div data-testid="arrow-right-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Chrome: () => <div data-testid="chrome-icon" />,
  Apple: () => <div data-testid="apple-icon" />,
  Check: () => <div data-testid="check-icon" />,
  X: () => <div data-testid="x-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  Wifi: () => <div data-testid="wifi-icon" />,
  WifiOff: () => <div data-testid="wifi-off-icon" />,
}))

// Mock validation utilities
jest.mock('@/lib/validation', () => ({
  registrationSchema: {
    safeParse: jest.fn(),
  },
  validateEmail: jest.fn(),
  calculatePasswordStrength: jest.fn(() => ({ percentage: 80, color: 'green' })),
  checkPasswordBreach: jest.fn(() => Promise.resolve(false)),
  debounce: jest.fn((fn) => fn),
  getFieldAriaProps: jest.fn(() => ({})),
  sanitizeInput: jest.fn((input) => input),
  getRateLimitState: jest.fn(() => ({ isBlocked: false, resetTime: 0 })),
  updateRateLimitState: jest.fn(),
  passwordRequirements: [
    { id: 'length', label: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
    { id: 'uppercase', label: 'One uppercase letter', test: (pwd: string) => /[A-Z]/.test(pwd) },
    { id: 'lowercase', label: 'One lowercase letter', test: (pwd: string) => /[a-z]/.test(pwd) },
    { id: 'number', label: 'One number', test: (pwd: string) => /\d/.test(pwd) },
  ],
}))

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}

const mockSignUp = {
  isLoaded: true,
  signUp: jest.fn(),
  setActive: jest.fn(),
}

const mockClerkUseSignUp = jest.requireMock('@clerk/nextjs').useSignUp

// Mock fetch for API calls
global.fetch = jest.fn()

describe('Sign Up Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    mockClerkUseSignUp.mockReturnValue(mockSignUp)
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })
  })

  describe('Page Rendering', () => {
    test('should render sign up form with all required elements', () => {
      render(<SignUpPage />)
      
      // Header elements
      expect(screen.getByText('RAWGLE')).toBeInTheDocument()
      expect(screen.getByText('Create Your Account')).toBeInTheDocument()
      expect(screen.getByText('Join the raw feeding revolution')).toBeInTheDocument()
      
      // OAuth buttons
      expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign up with apple/i })).toBeInTheDocument()
      
      // Form elements
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/terms of service/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/newsletter/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    test('should have proper accessibility attributes', () => {
      render(<SignUpPage />)
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      
      expect(firstNameInput).toHaveAttribute('type', 'text')
      expect(firstNameInput).toHaveAttribute('autoComplete', 'given-name')
      expect(firstNameInput).toHaveAttribute('required')
      
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('autoComplete', 'email')
      expect(emailInput).toHaveAttribute('required')
      
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('autoComplete', 'new-password')
      expect(passwordInput).toHaveAttribute('required')
    })

    test('should show password strength indicator', async () => {
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'TestPassword123')
      
      expect(screen.getByText(/password strength/i)).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('should show password requirements checklist', () => {
      render(<SignUpPage />)
      
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument()
      expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument()
      expect(screen.getByText(/one number/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    test('should validate required fields on submission', async () => {
      const { registrationSchema } = require('@/lib/validation')
      registrationSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          errors: [
            { path: ['firstName'], message: 'First name is required' },
            { path: ['lastName'], message: 'Last name is required' },
            { path: ['email'], message: 'Email is required' },
            { path: ['password'], message: 'Password is required' },
          ]
        }
      })
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      // This will FAIL initially - validation error display not fully implemented
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })

    test('should validate email format in real-time', async () => {
      const { validateEmail } = require('@/lib/validation')
      validateEmail.mockReturnValue({ 
        isValid: false, 
        error: 'Please enter a valid email address' 
      })
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid-email')
      await user.tab() // Trigger blur
      
      // This will FAIL initially - real-time validation display not working in current disabled state
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })
    })

    test('should validate password strength requirements', async () => {
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      
      // Test weak password
      await user.type(passwordInput, 'weak')
      
      // Requirements should not be met (This will FAIL - visual feedback not implemented in current state)
      const requirements = screen.getAllByRole('generic', { name: /password requirement/i })
      requirements.forEach(req => {
        expect(req).toHaveClass('text-charcoal-500') // Not satisfied
      })
    })

    test('should validate password confirmation match', async () => {
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      
      await user.type(passwordInput, 'TestPassword123')
      await user.type(confirmPasswordInput, 'DifferentPassword123')
      await user.tab() // Trigger blur
      
      // This will FAIL initially - password match validation display not working
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    test('should check for password breaches', async () => {
      const { checkPasswordBreach } = require('@/lib/validation')
      checkPasswordBreach.mockResolvedValue(true)
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'password123')
      
      // This will FAIL - breach checking not working in current state
      await waitFor(() => {
        expect(screen.getByText(/password has been found in data breaches/i)).toBeInTheDocument()
      })
    })

    test('should validate terms and conditions checkbox', async () => {
      const { registrationSchema } = require('@/lib/validation')
      registrationSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          errors: [{ path: ['agreedToTerms'], message: 'You must agree to the terms' }]
        }
      })
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      // Fill out form but don't check terms
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'TestPassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'TestPassword123')
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      // This will FAIL - terms validation not implemented
      expect(screen.getByText(/you must agree to the terms/i)).toBeInTheDocument()
    })
  })

  describe('OAuth Authentication (Future Implementation)', () => {
    test('should handle Google OAuth sign-up', async () => {
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const googleButton = screen.getByRole('button', { name: /sign up with google/i })
      await user.click(googleButton)
      
      // This will FAIL initially - OAuth not implemented, currently shows toast.info
      expect(toast.info).toHaveBeenCalledWith('OAuth signup would redirect to provider')
      
      // Future implementation should call:
      // expect(mockSignUp.authenticateWithRedirect).toHaveBeenCalledWith({
      //   strategy: 'oauth_google',
      //   redirectUrl: '/sso-callback',
      //   redirectUrlComplete: '/dashboard'
      // })
    })

    test('should handle Apple OAuth sign-up', async () => {
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const appleButton = screen.getByRole('button', { name: /sign up with apple/i })
      await user.click(appleButton)
      
      // This will FAIL initially - OAuth not implemented
      expect(toast.info).toHaveBeenCalledWith('OAuth signup would redirect to provider')
    })

    test('should handle OAuth errors', async () => {
      const user = userEvent.setup()
      
      // Mock OAuth error for future implementation
      mockSignUp.authenticateWithRedirect = jest.fn().mockRejectedValue({
        errors: [{ message: 'OAuth provider unavailable' }]
      })
      
      render(<SignUpPage />)
      
      const googleButton = screen.getByRole('button', { name: /sign up with google/i })
      await user.click(googleButton)
      
      // This will FAIL - OAuth error handling not implemented yet
      // await waitFor(() => {
      //   expect(toast.error).toHaveBeenCalledWith('Failed to sign up with provider')
      // })
    })
  })

  describe('Registration API Integration (Future Implementation)', () => {
    test('should successfully register user with valid data', async () => {
      const { registrationSchema } = require('@/lib/validation')
      const mockData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123',
        agreedToTerms: true,
        wantsNewsletter: true
      }
      
      registrationSchema.safeParse.mockReturnValue({
        success: true,
        data: mockData
      })
      
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          user: { id: '123', email: 'john@example.com' }
        })
      })
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'TestPassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'TestPassword123')
      await user.click(screen.getByLabelText(/terms of service/i))
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      // This will FAIL initially - API integration not working due to disabled auth
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(mockData)
        })
      })
      
      expect(toast.success).toHaveBeenCalledWith('Account created successfully! Please check your email for verification.')
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/verify-email?email=john%40example.com')
    })

    test('should handle registration API errors', async () => {
      const { registrationSchema } = require('@/lib/validation')
      registrationSchema.safeParse.mockReturnValue({
        success: true,
        data: { email: 'john@example.com' }
      })
      
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ 
          success: false,
          errors: { email: ['Email already exists'] }
        })
      })
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      // Fill out valid form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'TestPassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'TestPassword123')
      await user.click(screen.getByLabelText(/terms of service/i))
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      // This will FAIL initially - API error handling not fully implemented
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
      })
    })

    test('should handle network errors during registration', async () => {
      const { registrationSchema } = require('@/lib/validation')
      registrationSchema.safeParse.mockReturnValue({
        success: true,
        data: { email: 'john@example.com' }
      })
      
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'TestPassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'TestPassword123')
      await user.click(screen.getByLabelText(/terms of service/i))
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      // This will FAIL initially - network error handling not implemented
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to create account. Please try again.')
      })
    })
  })

  describe('Form Interactions', () => {
    test('should toggle password visibility', async () => {
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      const showPasswordButton = screen.getByLabelText(/show password/i)
      
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      await user.click(showPasswordButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      const hidePasswordButton = screen.getByLabelText(/hide password/i)
      await user.click(hidePasswordButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('should toggle confirm password visibility', async () => {
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const showConfirmPasswordButton = screen.getByLabelText(/show confirm password/i)
      
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      
      await user.click(showConfirmPasswordButton)
      expect(confirmPasswordInput).toHaveAttribute('type', 'text')
    })

    test('should show loading state during registration', async () => {
      const { registrationSchema } = require('@/lib/validation')
      registrationSchema.safeParse.mockReturnValue({
        success: true,
        data: { email: 'john@example.com' }
      })
      
      // Mock delayed API response
      ;(global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        }), 1000))
      )
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'TestPassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'TestPassword123')
      await user.click(screen.getByLabelText(/terms of service/i))
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      // This will FAIL initially - loading state not properly implemented
      expect(screen.getByText(/creating account/i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    test('should clear field errors when user starts typing', async () => {
      const { registrationSchema } = require('@/lib/validation')
      registrationSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          errors: [{ path: ['firstName'], message: 'First name is required' }]
        }
      })
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      // Trigger validation error
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      // Start typing in first name field
      const firstNameInput = screen.getByLabelText(/first name/i)
      await user.type(firstNameInput, 'John')
      
      // This will FAIL initially - error clearing not implemented
      expect(screen.queryByText(/first name is required/i)).not.toBeInTheDocument()
    })

    test('should disable submit button when form is invalid', () => {
      render(<SignUpPage />)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      // Button should be disabled when form is empty
      expect(submitButton).toBeDisabled()
    })

    test('should enable submit button when form is valid', async () => {
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      // Fill out complete form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'TestPassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'TestPassword123')
      await user.click(screen.getByLabelText(/terms of service/i))
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      // This will FAIL initially - form validation not properly connected to button state
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Rate Limiting', () => {
    test('should prevent submission when rate limited', async () => {
      const { getRateLimitState } = require('@/lib/validation')
      getRateLimitState.mockReturnValue({
        isBlocked: true,
        resetTime: Date.now() + 300000 // 5 minutes from now
      })
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      // This will FAIL initially - rate limiting not fully implemented
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Too many attempts'))
    })

    test('should update rate limit state on failed attempts', async () => {
      const { updateRateLimitState, registrationSchema } = require('@/lib/validation')
      registrationSchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [{ path: ['email'], message: 'Invalid email' }] }
      })
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      // This will FAIL initially - rate limit tracking not implemented
      expect(updateRateLimitState).toHaveBeenCalledWith('registration', false)
    })
  })

  describe('Offline/Online Status', () => {
    test('should show offline indicator when offline', () => {
      // Mock offline status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })
      
      render(<SignUpPage />)
      
      expect(screen.getByText(/you're offline/i)).toBeInTheDocument()
    })

    test('should disable form when offline', async () => {
      // Mock offline status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      const googleButton = screen.getByRole('button', { name: /sign up with google/i })
      
      expect(submitButton).toBeDisabled()
      expect(googleButton).toBeDisabled()
    })

    test('should show network error message when offline during submission', async () => {
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      
      // Mock going offline during submission
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      // This will FAIL initially - offline handling during submission not implemented
      expect(toast.error).toHaveBeenCalledWith('Please check your internet connection and try again')
    })
  })

  describe('Security Features', () => {
    test('should sanitize input fields', async () => {
      const { sanitizeInput } = require('@/lib/validation')
      const maliciousInput = '<script>alert("xss")</script>John'
      const sanitizedInput = 'John'
      sanitizeInput.mockReturnValue(sanitizedInput)
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      await user.type(firstNameInput, maliciousInput)
      
      // This will FAIL initially if sanitization is not properly implemented
      expect(sanitizeInput).toHaveBeenCalledWith(maliciousInput)
      expect(firstNameInput).toHaveValue(sanitizedInput)
    })

    test('should include CSRF protection headers', async () => {
      const { registrationSchema } = require('@/lib/validation')
      registrationSchema.safeParse.mockReturnValue({
        success: true,
        data: { email: 'john@example.com' }
      })
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'TestPassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'TestPassword123')
      await user.click(screen.getByLabelText(/terms of service/i))
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      // This will FAIL initially - CSRF header might not be implemented
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-Requested-With': 'XMLHttpRequest'
            })
          })
        )
      })
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      render(<SignUpPage />)
      
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
      expect(form).toHaveAttribute('noValidate')
      
      const requiredInputs = [
        screen.getByLabelText(/first name/i),
        screen.getByLabelText(/last name/i),
        screen.getByLabelText(/email address/i),
        screen.getByLabelText(/^password$/i),
        screen.getByLabelText(/confirm password/i),
      ]
      
      requiredInputs.forEach(input => {
        expect(input).toHaveAttribute('required')
      })
    })

    test('should show error messages with proper ARIA attributes', async () => {
      const { registrationSchema } = require('@/lib/validation')
      registrationSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          errors: [{ path: ['firstName'], message: 'First name is required' }]
        }
      })
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      // This will FAIL initially - ARIA error attributes not implemented
      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toHaveAttribute('aria-live', 'polite')
    })

    test('should focus first error field after validation failure', async () => {
      const { registrationSchema } = require('@/lib/validation')
      registrationSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          errors: [{ path: ['firstName'], message: 'First name is required' }]
        }
      })
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)
      
      // This will FAIL initially - focus management not implemented
      const firstNameInput = screen.getByLabelText(/first name/i)
      expect(firstNameInput).toHaveFocus()
    })

    test('should have proper password strength progressbar attributes', async () => {
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'TestPassword123')
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '80')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
      expect(progressBar).toHaveAttribute('aria-label', expect.stringContaining('Password strength'))
    })
  })

  describe('Performance', () => {
    test('should debounce email validation', async () => {
      const { debounce } = require('@/lib/validation')
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      
      // Type rapidly
      await user.type(emailInput, 'test@example.com')
      
      // This will FAIL initially if debouncing is not properly implemented
      expect(debounce).toHaveBeenCalled()
    })

    test('should prevent double submission', async () => {
      const { registrationSchema } = require('@/lib/validation')
      registrationSchema.safeParse.mockReturnValue({
        success: true,
        data: { email: 'john@example.com' }
      })
      
      // Mock delayed response
      ;(global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      const user = userEvent.setup()
      render(<SignUpPage />)
      
      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'TestPassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'TestPassword123')
      await user.click(screen.getByLabelText(/terms of service/i))
      
      const submitButton = screen.getByRole('button', { name: /create account/i })
      
      // Click twice rapidly
      await user.click(submitButton)
      await user.click(submitButton)
      
      // This will FAIL initially - double submission prevention not implemented
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })
})