/**
 * Error Handling and Transformation Utilities
 * 
 * Provides centralized error handling for:
 * - API errors
 * - Network failures
 * - Validation errors
 * - User-friendly error messages
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
  timestamp?: string;
  requestId?: string;
}

export interface NetworkError {
  type: 'network';
  message: string;
  isOffline: boolean;
  retryable: boolean;
}

export interface ValidationError {
  type: 'validation';
  field: string;
  message: string;
  value?: any;
}

export type AppError = ApiError | NetworkError | ValidationError;

// Error type guards
export const errorUtils = {
  isApiError(error: any): error is ApiError {
    return error && typeof error.message === 'string' && error.status !== undefined;
  },

  isNetworkError(error: any): error is NetworkError {
    return error && error.type === 'network';
  },

  isValidationError(error: any): error is ValidationError {
    return error && error.type === 'validation';
  },

  isRetryable(error: any): boolean {
    if (this.isNetworkError(error)) {
      return error.retryable;
    }
    
    if (this.isApiError(error)) {
      // Retry on 5xx server errors
      return error.status ? error.status >= 500 : false;
    }
    
    return false;
  },
};

// Error message mapping
export const errorMessages = {
  // Network errors
  NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  OFFLINE_ERROR: 'You appear to be offline. Please check your connection.',
  
  // Authentication errors
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before continuing.',
  ACCOUNT_LOCKED: 'Your account has been temporarily locked. Please contact support.',
  
  // Validation errors
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, number, and special character.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_DATE: 'Please enter a valid date.',
  
  // Server errors
  INTERNAL_ERROR: 'Something went wrong on our end. Please try again later.',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  
  // Form errors
  FORM_INVALID: 'Please correct the errors below and try again.',
  UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  UPLOAD_TOO_LARGE: 'File is too large. Please choose a smaller file.',
  INVALID_FILE_TYPE: 'Invalid file type. Please choose a different file.',
  
  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  RETRY_ERROR: 'Failed after multiple attempts. Please try again later.',
} as const;

// Error transformation utilities
export class ErrorTransformer {
  /**
   * Transform any error into a user-friendly message
   */
  static toUserMessage(error: any): string {
    // Handle API errors
    if (errorUtils.isApiError(error)) {
      return this.apiErrorToMessage(error);
    }

    // Handle network errors
    if (errorUtils.isNetworkError(error)) {
      return error.message;
    }

    // Handle validation errors
    if (errorUtils.isValidationError(error)) {
      return error.message;
    }

    // Handle axios errors
    if (error?.response) {
      return this.httpStatusToMessage(error.response.status);
    }

    // Handle network connection errors
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
      return errorMessages.NETWORK_ERROR;
    }

    // Handle timeout errors
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return errorMessages.TIMEOUT_ERROR;
    }

    // Fallback to error message or generic message
    return error?.message || errorMessages.UNKNOWN_ERROR;
  }

  /**
   * Transform API error to user message
   */
  private static apiErrorToMessage(error: ApiError): string {
    // Use provided message if it's user-friendly
    if (error.message && this.isUserFriendlyMessage(error.message)) {
      return error.message;
    }

    // Map by status code
    if (error.status) {
      return this.httpStatusToMessage(error.status);
    }

    // Map by error code
    if (error.code && error.code in errorMessages) {
      return errorMessages[error.code as keyof typeof errorMessages];
    }

    return error.message || errorMessages.UNKNOWN_ERROR;
  }

  /**
   * Map HTTP status codes to user messages
   */
  private static httpStatusToMessage(status: number): string {
    const statusMessages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: errorMessages.UNAUTHORIZED,
      403: errorMessages.FORBIDDEN,
      404: 'The requested resource was not found.',
      409: 'A conflict occurred. The resource may already exist.',
      422: errorMessages.FORM_INVALID,
      429: errorMessages.RATE_LIMITED,
      500: errorMessages.INTERNAL_ERROR,
      502: 'Service temporarily unavailable. Please try again.',
      503: errorMessages.SERVICE_UNAVAILABLE,
      504: errorMessages.TIMEOUT_ERROR,
    };

    return statusMessages[status] || errorMessages.UNKNOWN_ERROR;
  }

  /**
   * Check if message is user-friendly (not technical)
   */
  private static isUserFriendlyMessage(message: string): boolean {
    const technicalTerms = [
      'stack trace',
      'undefined',
      'null',
      'TypeError',
      'ReferenceError',
      'SyntaxError',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
    ];

    return !technicalTerms.some(term => 
      message.toLowerCase().includes(term.toLowerCase())
    );
  }

  /**
   * Extract field-specific validation errors
   */
  static extractValidationErrors(error: any): Record<string, string> {
    const fieldErrors: Record<string, string> = {};

    if (errorUtils.isApiError(error) && error.errors) {
      error.errors.forEach(err => {
        if (err.field) {
          fieldErrors[err.field] = err.message;
        }
      });
    }

    return fieldErrors;
  }

  /**
   * Format multiple errors into a single message
   */
  static formatMultipleErrors(errors: string[]): string {
    if (errors.length === 0) return '';
    if (errors.length === 1) return errors[0];
    
    return `Multiple issues found: ${errors.join(', ')}`;
  }
}

// Error logging utilities
export class ErrorLogger {
  private static isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log error with context
   */
  static logError(error: any, context?: string, additionalData?: any) {
    const timestamp = new Date().toISOString();
    const errorData = {
      timestamp,
      context,
      error: this.serializeError(error),
      additionalData,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    if (this.isDevelopment) {
      console.error('Error logged:', errorData);
    } else {
      // In production, send to error tracking service
      this.sendToErrorService(errorData);
    }
  }

  /**
   * Serialize error for logging
   */
  private static serializeError(error: any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return error;
  }

  /**
   * Send error to external error tracking service
   */
  private static sendToErrorService(errorData: any) {
    // Implement integration with error tracking service (e.g., Sentry, LogRocket)
    // For now, just store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('rawgle_errors') || '[]');
      existingErrors.push(errorData);
      
      // Keep only last 50 errors
      const recentErrors = existingErrors.slice(-50);
      localStorage.setItem('rawgle_errors', JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('Failed to store error data:', e);
    }
  }
}

// Custom error classes
export class RawgleError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: any
  ) {
    super(message);
    this.name = 'RawgleError';
    
    // Log the error
    ErrorLogger.logError(this, 'RawgleError', { code, context });
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public isOffline: boolean = false,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Error recovery utilities
export const errorRecovery = {
  /**
   * Check if device is offline
   */
  isOffline(): boolean {
    return typeof navigator !== 'undefined' && !navigator.onLine;
  },

  /**
   * Wait for connection to be restored
   */
  waitForConnection(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isOffline()) {
        resolve();
        return;
      }

      const handleOnline = () => {
        window.removeEventListener('online', handleOnline);
        resolve();
      };

      window.addEventListener('online', handleOnline);
    });
  },

  /**
   * Retry operation with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let attempt = 1;

    while (attempt <= maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts || !errorUtils.isRetryable(error)) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }

    throw new Error('Max retry attempts exceeded');
  },
};