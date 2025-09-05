/**
 * Authentication Context Provider
 * 
 * Provides centralized authentication state management for the entire application.
 * Handles login, logout, registration, and automatic token refresh.
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { 
  User, 
  AuthState, 
  LoginCredentials, 
  RegisterData, 
  ResetPasswordData, 
  ChangePasswordData,
  defaultAuthState,
  AuthError,
  authErrorCodes,
  sessionUtils 
} from '@/lib/auth';
import { ErrorTransformer, ErrorLogger } from '@/lib/errors';

// Auth Actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

// Auth Context Interface
interface AuthContextType extends AuthState {
  // Authentication actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  
  // Password management
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  
  // User management
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  
  // Email verification
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  
  // Token management
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

// Auth Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case 'LOGOUT':
      return {
        ...defaultAuthState,
        isLoading: false,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    
    default:
      return state;
  }
}

// Create Auth Context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, defaultAuthState);

  // Helper function to handle API errors
  const handleAuthError = useCallback((error: any, context: string) => {
    const message = ErrorTransformer.toUserMessage(error);
    dispatch({ type: 'SET_ERROR', payload: message });
    ErrorLogger.logError(error, `Auth: ${context}`, { userId: state.user?.id });
    
    // Handle specific error codes
    if (error.status === 401) {
      dispatch({ type: 'LOGOUT' });
    }
  }, [state.user?.id]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await apiClient.post<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>('/auth/login', credentials);

      if (response.success && response.data) {
        const { user } = response.data;
        
        // Store user session data
        sessionUtils.storeSession('user', user);
        sessionUtils.storeSession('login_timestamp', Date.now());
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        
        // Redirect to intended destination or dashboard
        const returnUrl = sessionStorage.getItem('returnUrl') || '/dashboard';
        sessionStorage.removeItem('returnUrl');
        window.location.href = returnUrl;
      } else {
        throw new AuthError(
          response.message || 'Login failed',
          authErrorCodes.INVALID_CREDENTIALS
        );
      }
    } catch (error) {
      handleAuthError(error, 'login');
    }
  }, [handleAuthError]);

  // Register function
  const register = useCallback(async (data: RegisterData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await apiClient.post<{
        user: User;
        message: string;
      }>('/auth/register', data);

      if (response.success && response.data) {
        // Store user session data
        sessionUtils.storeSession('user', response.data.user);
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.user });
        
        // Redirect to email verification page
        window.location.href = '/auth/verify-email?registered=true';
      } else {
        throw new AuthError(
          response.message || 'Registration failed',
          authErrorCodes.UNKNOWN_ERROR
        );
      }
    } catch (error) {
      handleAuthError(error, 'register');
    }
  }, [handleAuthError]);

  // Logout function
  const logout = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Call logout endpoint to invalidate tokens
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Log error but don't prevent logout
      ErrorLogger.logError(error, 'Auth: logout');
    }

    // Clear local session data
    sessionUtils.clearAllSessions();
    
    // Update state
    dispatch({ type: 'LOGOUT' });
    
    // Redirect to home page
    window.location.href = '/';
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated) return;

    try {
      const response = await apiClient.get<User>('/auth/me');
      
      if (response.success && response.data) {
        sessionUtils.storeSession('user', response.data);
        dispatch({ type: 'SET_USER', payload: response.data });
      } else {
        throw new AuthError('Failed to refresh user data', authErrorCodes.UNKNOWN_ERROR);
      }
    } catch (error) {
      handleAuthError(error, 'refreshUser');
    }
  }, [state.isAuthenticated, handleAuthError]);

  // Update user profile
  const updateProfile = useCallback(async (data: Partial<User>) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await apiClient.put<User>('/auth/profile', data);
      
      if (response.success && response.data) {
        sessionUtils.storeSession('user', response.data);
        dispatch({ type: 'UPDATE_USER', payload: response.data });
      } else {
        throw new AuthError(
          response.message || 'Failed to update profile',
          authErrorCodes.UNKNOWN_ERROR
        );
      }
    } catch (error) {
      handleAuthError(error, 'updateProfile');
    }
  }, [handleAuthError]);

  // Send verification email
  const sendVerificationEmail = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await apiClient.post('/auth/send-verification');
      
      if (response.success) {
        dispatch({ type: 'SET_LOADING', payload: false });
        // Show success message via toast or notification
      } else {
        throw new AuthError(
          response.message || 'Failed to send verification email',
          authErrorCodes.UNKNOWN_ERROR
        );
      }
    } catch (error) {
      handleAuthError(error, 'sendVerificationEmail');
    }
  }, [handleAuthError]);

  // Verify email
  const verifyEmail = useCallback(async (token: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await apiClient.post<User>('/auth/verify-email', { token });
      
      if (response.success && response.data) {
        sessionUtils.storeSession('user', response.data);
        dispatch({ type: 'SET_USER', payload: response.data });
      } else {
        throw new AuthError(
          response.message || 'Email verification failed',
          authErrorCodes.UNKNOWN_ERROR
        );
      }
    } catch (error) {
      handleAuthError(error, 'verifyEmail');
    }
  }, [handleAuthError]);

  // Reset password
  const resetPassword = useCallback(async (data: ResetPasswordData) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await apiClient.post('/auth/reset-password', data);
      
      if (response.success) {
        dispatch({ type: 'SET_LOADING', payload: false });
        // Redirect to success page
        window.location.href = '/auth/reset-password-sent';
      } else {
        throw new AuthError(
          response.message || 'Failed to reset password',
          authErrorCodes.UNKNOWN_ERROR
        );
      }
    } catch (error) {
      handleAuthError(error, 'resetPassword');
    }
  }, [handleAuthError]);

  // Change password
  const changePassword = useCallback(async (data: ChangePasswordData) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await apiClient.post('/auth/change-password', data);
      
      if (response.success) {
        dispatch({ type: 'SET_LOADING', payload: false });
        // Show success message
      } else {
        throw new AuthError(
          response.message || 'Failed to change password',
          authErrorCodes.UNKNOWN_ERROR
        );
      }
    } catch (error) {
      handleAuthError(error, 'changePassword');
    }
  }, [handleAuthError]);

  // Refresh authentication token
  const refreshToken = useCallback(async () => {
    try {
      const response = await apiClient.post('/auth/refresh');
      
      if (!response.success) {
        throw new AuthError('Token refresh failed', authErrorCodes.REFRESH_FAILED);
      }
    } catch (error) {
      ErrorLogger.logError(error, 'Auth: refreshToken');
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        // Check if user session exists
        const storedUser = sessionUtils.getSession<User>('user');
        
        if (storedUser) {
          // Verify session is still valid
          const response = await apiClient.get<User>('/auth/me');
          
          if (response.success && response.data) {
            dispatch({ type: 'SET_USER', payload: response.data });
          } else {
            // Invalid session, clear stored data
            sessionUtils.clearAllSessions();
            dispatch({ type: 'SET_USER', payload: null });
          }
        } else {
          dispatch({ type: 'SET_USER', payload: null });
        }
      } catch (error) {
        // Session invalid or network error
        sessionUtils.clearAllSessions();
        dispatch({ type: 'SET_USER', payload: null });
      }
    };

    initializeAuth();

    // Listen for auth failure events from API client
    const handleAuthFailure = () => {
      dispatch({ type: 'LOGOUT' });
    };

    window.addEventListener('auth:failure', handleAuthFailure);

    return () => {
      window.removeEventListener('auth:failure', handleAuthFailure);
    };
  }, []);

  // Auto-refresh user data periodically
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const refreshInterval = setInterval(() => {
      refreshUser();
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated, refreshUser]);

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    resetPassword,
    changePassword,
    refreshUser,
    updateProfile,
    sendVerificationEmail,
    verifyEmail,
    refreshToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// HOC for components that require authentication
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pumpkin"></div>
      </div>;
    }

    if (!isAuthenticated) {
      // Store intended destination
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('returnUrl', window.location.pathname);
        window.location.href = '/auth/login';
      }
      return null;
    }

    return <Component {...props} />;
  };
}