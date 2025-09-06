import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import SignInPage from '../page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
  },
}))

jest.mock('@clerk/nextjs', () => ({
  useSignIn: jest.fn(),
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Dog: () => <div data-testid="dog-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  ArrowRight: () => <div data-testid="arrow-right-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Chrome: () => <div data-testid="chrome-icon" />,
  Apple: () => <div data-testid="apple-icon" />,
  Wallet: () => <div data-testid="wallet-icon" />,
}))

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}

const mockSignIn = {
  isLoaded: true,
  signIn: jest.fn(),
  setActive: jest.fn(),
}

const mockClerkUseSignIn = jest.requireMock('@clerk/nextjs').useSignIn

describe('Sign In Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    mockClerkUseSignIn.mockReturnValue(mockSignIn)
  })

  describe('Page Rendering', () => {
    test('should render sign in form with all required elements', () => {
      render(<SignInPage />)
      
      // Header elements
      expect(screen.getByText('RAWGLE')).toBeInTheDocument()
      expect(screen.getByText('Welcome Back')).toBeInTheDocument()
      expect(screen.getByText('Sign in to access your pet dashboard')).toBeInTheDocument()
      
      // OAuth buttons
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /continue with apple/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /connect web3 wallet/i })).toBeInTheDocument()
      
      // Form elements
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      
      // Navigation links
      expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /sign up for free/i })).toBeInTheDocument()
    })

    test('should have proper accessibility attributes', () => {
      render(<SignInPage />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('autoComplete', 'email')
      expect(emailInput).toHaveAttribute('required')
      
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
      expect(passwordInput).toHaveAttribute('required')
    })
  })

  describe('Authentication State (Currently Disabled)', () => {
    test('should show error when authentication is temporarily disabled', async () => {
      const user = userEvent.setup()
      render(<SignInPage />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)
      
      expect(screen.getByText(/authentication temporarily disabled for styling fixes/i)).toBeInTheDocument()
    })

    test('should show error for OAuth when temporarily disabled', async () => {
      const user = userEvent.setup()
      render(<SignInPage />)
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i })
      await user.click(googleButton)
      
      expect(screen.getByText(/oauth authentication temporarily disabled for styling fixes/i)).toBeInTheDocument()
    })
  })

  describe('Email/Password Authentication (Future Implementation)', () => {
    beforeEach(() => {
      // These tests will FAIL initially - they test the desired functionality
      mockSignIn.isLoaded = true
      mockSignIn.signIn.mockClear()
    })

    test('should sign in user with valid credentials', async () => {
      const user = userEvent.setup()
      
      // Mock successful sign-in
      mockSignIn.signIn.mockResolvedValue({
        status: 'complete',
        createdSessionId: 'session_123'
      })
      
      render(<SignInPage />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'validPassword123')
      await user.click(signInButton)
      
      // This will FAIL - functionality not implemented yet
      await waitFor(() => {
        expect(mockSignIn.signIn).toHaveBeenCalledWith({
          identifier: 'test@example.com',
          password: 'validPassword123'
        })
      })
      
      expect(mockSignIn.setActive).toHaveBeenCalledWith({
        session: 'session_123'
      })
      
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })

    test('should handle invalid credentials error', async () => {
      const user = userEvent.setup()
      
      mockSignIn.signIn.mockRejectedValue({
        errors: [{ code: 'form_identifier_not_found' }]
      })
      
      render(<SignInPage />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'invalid@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(signInButton)
      
      // This will FAIL - error handling not implemented
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
      })
    })

    test('should handle incorrect password error', async () => {
      const user = userEvent.setup()
      
      mockSignIn.signIn.mockRejectedValue({
        errors: [{ code: 'form_password_incorrect' }]
      })
      
      render(<SignInPage />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(signInButton)
      
      // This will FAIL - error handling not implemented
      await waitFor(() => {
        expect(screen.getByText(/incorrect password/i)).toBeInTheDocument()
      })
    })

    test('should show loading state during sign-in', async () => {
      const user = userEvent.setup()
      
      // Mock delayed response
      mockSignIn.signIn.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ status: 'complete', createdSessionId: 'session_123' }), 1000)
      }))
      
      render(<SignInPage />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'validPassword123')
      await user.click(signInButton)
      
      // This will FAIL - loading state not implemented
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      expect(signInButton).toBeDisabled()
    })

    test('should validate email format', async () => {
      const user = userEvent.setup()
      render(<SignInPage />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'invalid-email')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)
      
      // This will FAIL - validation not implemented
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })

    test('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<SignInPage />)
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(signInButton)
      
      // This will FAIL - validation not implemented
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  describe('OAuth Authentication (Future Implementation)', () => {
    test('should handle Google OAuth sign-in', async () => {
      const user = userEvent.setup()
      
      mockSignIn.authenticateWithRedirect = jest.fn().mockResolvedValue(undefined)
      
      render(<SignInPage />)
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i })
      await user.click(googleButton)
      
      // This will FAIL - OAuth not implemented
      await waitFor(() => {
        expect(mockSignIn.authenticateWithRedirect).toHaveBeenCalledWith({
          strategy: 'oauth_google',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/dashboard'
        })
      })
    })

    test('should handle Apple OAuth sign-in', async () => {
      const user = userEvent.setup()
      
      mockSignIn.authenticateWithRedirect = jest.fn().mockResolvedValue(undefined)
      
      render(<SignInPage />)
      
      const appleButton = screen.getByRole('button', { name: /continue with apple/i })
      await user.click(appleButton)
      
      // This will FAIL - OAuth not implemented
      await waitFor(() => {
        expect(mockSignIn.authenticateWithRedirect).toHaveBeenCalledWith({
          strategy: 'oauth_apple',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/dashboard'
        })
      })
    })

    test('should handle OAuth error', async () => {
      const user = userEvent.setup()
      
      mockSignIn.authenticateWithRedirect = jest.fn().mockRejectedValue({
        errors: [{ message: 'OAuth provider error' }]
      })
      
      render(<SignInPage />)
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i })
      await user.click(googleButton)
      
      // This will FAIL - error handling not implemented
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('OAuth provider error')
      })
    })

    test('should disable Web3 wallet button with coming soon message', () => {
      render(<SignInPage />)
      
      const web3Button = screen.getByRole('button', { name: /connect web3 wallet/i })
      expect(web3Button).toBeDisabled()
      expect(web3Button).toHaveTextContent(/coming soon/i)
    })
  })

  describe('Form Interactions', () => {
    test('should toggle password visibility', async () => {
      const user = userEvent.setup()
      render(<SignInPage />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      const toggleButton = screen.getByRole('button', { name: /show password/i })
      
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      await user.click(toggleButton)
      
      // This will FAIL - toggle functionality not implemented without Clerk
      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument()
    })

    test('should handle remember me checkbox', async () => {
      const user = userEvent.setup()
      render(<SignInPage />)
      
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i)
      expect(rememberMeCheckbox).not.toBeChecked()
      
      await user.click(rememberMeCheckbox)
      expect(rememberMeCheckbox).toBeChecked()
    })

    test('should clear errors when user starts typing', async () => {
      const user = userEvent.setup()
      render(<SignInPage />)
      
      // First, trigger an error by submitting empty form
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(signInButton)
      
      // This assumes error messages will be shown (FAIL initially)
      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'test@example.com')
      
      // Errors should be cleared (FAIL initially)
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
    })
  })

  describe('Session Management', () => {
    test('should redirect to dashboard when already signed in', async () => {
      const mockUser = { id: 'user_123', emailAddress: 'test@example.com' }
      
      mockClerkUseSignIn.mockReturnValue({
        ...mockSignIn,
        isSignedIn: true,
        user: mockUser
      })
      
      render(<SignInPage />)
      
      // This will FAIL - redirect logic not implemented
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
      })
    })

    test('should handle session creation after sign-in', async () => {
      const user = userEvent.setup()
      
      mockSignIn.signIn.mockResolvedValue({
        status: 'complete',
        createdSessionId: 'session_123'
      })
      
      render(<SignInPage />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)
      
      // This will FAIL - session management not implemented
      await waitFor(() => {
        expect(mockSignIn.setActive).toHaveBeenCalledWith({
          session: 'session_123'
        })
        expect(toast.success).toHaveBeenCalledWith('Welcome back!')
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      const user = userEvent.setup()
      
      mockSignIn.signIn.mockRejectedValue(new Error('Network error'))
      
      render(<SignInPage />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)
      
      // This will FAIL - network error handling not implemented
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    test('should handle rate limiting', async () => {
      const user = userEvent.setup()
      
      mockSignIn.signIn.mockRejectedValue({
        errors: [{ code: 'form_identifier_exists' }]
      })
      
      render(<SignInPage />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      
      // Simulate multiple attempts
      for (let i = 0; i < 3; i++) {
        await user.clear(emailInput)
        await user.clear(passwordInput)
        await user.type(emailInput, `test${i}@example.com`)
        await user.type(passwordInput, 'wrongpassword')
        await user.click(signInButton)
      }
      
      // This will FAIL - rate limiting not implemented
      await waitFor(() => {
        expect(screen.getByText(/too many attempts/i)).toBeInTheDocument()
        expect(signInButton).toBeDisabled()
      })
    })

    test('should handle account locked error', async () => {
      const user = userEvent.setup()
      
      mockSignIn.signIn.mockRejectedValue({
        errors: [{ code: 'form_password_incorrect_too_many_attempts' }]
      })
      
      render(<SignInPage />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(signInButton)
      
      // This will FAIL - account locked handling not implemented
      await waitFor(() => {
        expect(screen.getByText(/account temporarily locked/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      render(<SignInPage />)
      
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      
      expect(emailInput).toHaveAttribute('aria-required', 'true')
      expect(passwordInput).toHaveAttribute('aria-required', 'true')
    })

    test('should show error messages with proper ARIA attributes', async () => {
      const user = userEvent.setup()
      render(<SignInPage />)
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(signInButton)
      
      // This will FAIL - ARIA error handling not implemented
      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toHaveAttribute('aria-live', 'polite')
    })

    test('should focus first error field after validation failure', async () => {
      const user = userEvent.setup()
      render(<SignInPage />)
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(signInButton)
      
      // This will FAIL - focus management not implemented
      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveFocus()
    })
  })

  describe('Performance', () => {
    test('should debounce email validation', async () => {
      const user = userEvent.setup()
      render(<SignInPage />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      
      // Type rapidly
      await user.type(emailInput, 'test@example.com')
      
      // This will FAIL - debounced validation not implemented
      expect(mockSignIn.signIn).not.toHaveBeenCalled()
    })

    test('should prevent double submission', async () => {
      const user = userEvent.setup()
      
      mockSignIn.signIn.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      render(<SignInPage />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      // Click twice rapidly
      await user.click(signInButton)
      await user.click(signInButton)
      
      // This will FAIL - double submission prevention not implemented
      expect(mockSignIn.signIn).toHaveBeenCalledTimes(1)
    })
  })

  describe('Responsive Design', () => {
    test('should be responsive on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<SignInPage />)
      
      // This will depend on the actual implementation
      const container = screen.getByTestId('sign-in-container') // This will FAIL - testid not added
      expect(container).toHaveClass('mobile-responsive')
    })
  })
})