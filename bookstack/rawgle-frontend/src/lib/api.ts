/**
 * API Client for Rawgle Backend Integration
 * 
 * Provides a centralized HTTP client with:
 * - JWT authentication handling
 * - Request/response interceptors
 * - Error handling and retry logic
 * - Request timeout management
 * - CSRF protection
 */

import axios from 'axios';

// Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.rawgle.com/api/v1'  // Production API URL
  : 'http://localhost:8000/api/v1';  // Development API URL

const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Array<{ field?: string; message: string }>;
}

export interface RequestConfig {
  skipAuthRefresh?: boolean; // Skip automatic token refresh on 401
  retryCount?: number; // Internal retry counter
  signal?: AbortSignal; // AbortController signal for request cancellation
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      withCredentials: true, // Include HTTP-only cookies
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add request ID for debugging
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        // Add CSRF token if available
        const csrfToken = this.getCSRFToken();
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }

        console.debug('API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          requestId: config.headers['X-Request-ID'],
        });

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.debug('API Response:', {
          status: response.status,
          url: response.config.url,
          requestId: response.config.headers?.['X-Request-ID'],
        });
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as RequestConfig;

        // Handle 401 Unauthorized with token refresh
        if (error.response?.status === 401 && !originalRequest.skipAuthRefresh) {
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            
            try {
              await this.refreshToken();
              this.processQueue(null);
              return this.client(originalRequest);
            } catch (refreshError) {
              this.processQueue(refreshError);
              this.handleAuthFailure();
              return Promise.reject(this.transformError(error));
            } finally {
              this.isRefreshing = false;
            }
          }

          // Queue the request while token is being refreshed
          return new Promise((resolve, reject) => {
            this.failedQueue.push({
              resolve: () => resolve(this.client(originalRequest)),
              reject: (err) => reject(err),
            });
          });
        }

        // Retry logic for network failures
        if (this.shouldRetry(error, originalRequest)) {
          return this.retryRequest(originalRequest);
        }

        console.error('API Error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });

        return Promise.reject(this.transformError(error));
      }
    );
  }

  private async refreshToken(): Promise<void> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: { 'X-Skip-Auth-Refresh': 'true' } // Prevent infinite loop
        }
      );
      
      if (response.data?.success) {
        console.debug('Token refreshed successfully');
        return;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  private processQueue(error: any) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve('refreshed');
      }
    });
    
    this.failedQueue = [];
  }

  private handleAuthFailure() {
    // Clear any stored auth state and redirect to login
    if (typeof window !== 'undefined') {
      // Dispatch custom event for auth failure
      window.dispatchEvent(new CustomEvent('auth:failure'));
      
      // Redirect to login page if not already there
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login?reason=session_expired';
      }
    }
  }

  private shouldRetry(error: AxiosError, config: RequestConfig): boolean {
    const retryCount = config.retryCount || 0;
    
    // Don't retry if max attempts reached
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      return false;
    }

    // Only retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500);
  }

  private async retryRequest(config: RequestConfig): Promise<AxiosResponse> {
    const retryCount = (config.retryCount || 0) + 1;
    const delay = RETRY_DELAY * Math.pow(2, retryCount - 1); // Exponential backoff

    console.debug(`Retrying request (attempt ${retryCount}/${MAX_RETRY_ATTEMPTS}) after ${delay}ms`);

    await new Promise(resolve => setTimeout(resolve, delay));

    return this.client({
      ...config,
      retryCount,
    });
  }

  private transformError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      const data = error.response.data as any;
      return {
        message: data?.message || 'Request failed',
        status: error.response.status,
        errors: data?.errors || [],
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error. Please check your connection and try again.',
        status: 0,
      };
    } else {
      // Request configuration error
      return {
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCSRFToken(): string | null {
    if (typeof document === 'undefined') return null;
    
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta?.getAttribute('content') || null;
  }

  // Public API methods
  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // Upload files with progress tracking
  async upload<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        ...(config?.headers || {}),
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api/v1', '')}/health`, {
        timeout: 5000,
      });
      return response.data || { status: 'unknown', timestamp: new Date().toISOString() };
    } catch (error) {
      throw new Error('Backend health check failed');
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;