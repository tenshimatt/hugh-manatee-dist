/**
 * Authentication Utilities for Rawgle Platform
 * 
 * Provides utilities for:
 * - JWT token validation
 * - Authentication state management
 * - Session handling
 * - User role/permission checking
 */

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  avatarUrl?: string;
  accountType: 'user' | 'business' | 'admin';
  pawsTokens: number;
  level: string;
  phone?: string;
  dateOfBirth?: string;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Token validation utilities
export const tokenUtils = {
  /**
   * Check if JWT token is expired (client-side estimation)
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true; // Invalid token format
    }
  },

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  },

  /**
   * Extract user data from JWT token
   */
  getUserFromToken(token: string): Partial<User> | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        accountType: payload.role || 'user',
      };
    } catch {
      return null;
    }
  },
};

// Session storage utilities (fallback for when cookies aren't available)
export const sessionUtils = {
  /**
   * Store session data in localStorage
   */
  storeSession(key: string, data: any): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`rawgle_${key}`, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to store session data:', error);
      }
    }
  },

  /**
   * Retrieve session data from localStorage
   */
  getSession<T>(key: string): T | null {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(`rawgle_${key}`);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.warn('Failed to retrieve session data:', error);
        return null;
      }
    }
    return null;
  },

  /**
   * Remove session data
   */
  removeSession(key: string): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`rawgle_${key}`);
      } catch (error) {
        console.warn('Failed to remove session data:', error);
      }
    }
  },

  /**
   * Clear all session data
   */
  clearAllSessions(): void {
    if (typeof window !== 'undefined') {
      try {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('rawgle_'));
        keys.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.warn('Failed to clear session data:', error);
      }
    }
  },
};

// Permission and role utilities
export const permissionUtils = {
  /**
   * Check if user has required account type
   */
  hasAccountType(user: User | null, requiredType: User['accountType']): boolean {
    return user?.accountType === requiredType;
  },

  /**
   * Check if user is admin
   */
  isAdmin(user: User | null): boolean {
    return user?.accountType === 'admin';
  },

  /**
   * Check if user is business account
   */
  isBusiness(user: User | null): boolean {
    return user?.accountType === 'business';
  },

  /**
   * Check if user has verified email
   */
  hasVerifiedEmail(user: User | null): boolean {
    return user?.emailVerified === true;
  },

  /**
   * Check if user can access feature based on level
   */
  canAccessFeature(user: User | null, requiredLevel: string): boolean {
    if (!user) return false;

    const levels = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    const userLevelIndex = levels.indexOf(user.level);
    const requiredLevelIndex = levels.indexOf(requiredLevel);

    return userLevelIndex >= requiredLevelIndex;
  },

  /**
   * Check if user has sufficient PAWS tokens
   */
  hasSufficientTokens(user: User | null, requiredTokens: number): boolean {
    return user ? user.pawsTokens >= requiredTokens : false;
  },
};

// Authentication error handling
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const authErrorCodes = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  REFRESH_FAILED: 'REFRESH_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Validation utilities
export const validationUtils = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   */
  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'fair' | 'strong';
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    const isValid = errors.length === 0;
    
    let strength: 'weak' | 'fair' | 'strong' = 'weak';
    if (password.length >= 12 && errors.length === 0) {
      strength = 'strong';
    } else if (password.length >= 8 && errors.length <= 1) {
      strength = 'fair';
    }

    return { isValid, errors, strength };
  },

  /**
   * Check if passwords match
   */
  passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  },

  /**
   * Validate name
   */
  isValidName(name: string): boolean {
    return name.trim().length >= 2 && name.trim().length <= 100;
  },
};

// Security utilities
export const securityUtils = {
  /**
   * Generate secure random string
   */
  generateSecureRandom(length = 32): string {
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback for environments without crypto API
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  },

  /**
   * Hash data using Web Crypto API (for client-side verification)
   */
  async hashData(data: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer as BufferSource);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Simple fallback (not cryptographically secure)
    return btoa(data).replace(/[^a-zA-Z0-9]/g, '');
  },

  /**
   * Validate origin for CSRF protection
   */
  isValidOrigin(origin: string): boolean {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://192.168.1.153:3000',
      'https://rawgle.com',
      'https://www.rawgle.com',
    ];
    
    return allowedOrigins.includes(origin);
  },
};

// Default auth state
export const defaultAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
};