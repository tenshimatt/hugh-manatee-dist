/**
 * Custom React Hook for API Interactions
 * 
 * Provides a unified interface for API calls with:
 * - Loading state management
 * - Error handling
 * - Data caching
 * - Request cancellation
 * - Optimistic updates
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient, ApiResponse, RequestConfig } from '@/lib/api';
import { ErrorTransformer, ErrorLogger } from '@/lib/errors';

// Hook configuration interface
interface UseApiConfig<T = any> extends RequestConfig {
  // Data fetching options
  immediate?: boolean; // Execute request immediately on mount
  dependencies?: any[]; // Re-fetch when dependencies change
  cacheKey?: string; // Cache key for data caching
  cacheDuration?: number; // Cache duration in milliseconds
  
  // Loading and error handling
  defaultData?: T; // Default data while loading
  onSuccess?: (data: T) => void; // Success callback
  onError?: (error: any) => void; // Error callback
  
  // Optimistic updates
  optimisticUpdate?: (data: T) => T; // Optimistic data transformation
  revertOnError?: boolean; // Revert optimistic updates on error
}

// Hook return type
interface UseApiReturn<T = any> {
  // Data and state
  data: T | null;
  loading: boolean;
  error: string | null;
  
  // Request functions
  execute: (params?: any) => Promise<T | null>;
  refresh: () => Promise<T | null>;
  cancel: () => void;
  
  // State management
  setData: (data: T | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Status flags
  isSuccess: boolean;
  isError: boolean;
}

// Simple cache implementation
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; duration: number }>();

  set(key: string, data: any, duration: number = 5 * 60 * 1000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      duration,
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > cached.duration;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

const apiCache = new ApiCache();

// Generic API hook
export function useApi<T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  config: UseApiConfig<T> = {}
): UseApiReturn<T> {
  const {
    immediate = false,
    dependencies = [],
    cacheKey,
    cacheDuration,
    defaultData = null,
    onSuccess,
    onError,
    optimisticUpdate,
    revertOnError = true,
    ...requestConfig
  } = config;

  // State management
  const [data, setData] = useState<T | null>(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for cleanup and cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousDataRef = useRef<T | null>(null);

  // Cancel any ongoing requests
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Execute API request
  const execute = useCallback(async (params?: any): Promise<T | null> => {
    // Cancel any ongoing request
    cancel();

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const effectiveCacheKey = cacheKey || `${method}:${url}:${JSON.stringify(params)}`;
      const cachedData = cacheKey ? apiCache.get(effectiveCacheKey) : null;
      
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return cachedData;
      }

      // Apply optimistic update if provided
      if (optimisticUpdate && data) {
        previousDataRef.current = data;
        setData(optimisticUpdate(data));
      }

      // Prepare request config
      const finalConfig: RequestConfig = {
        ...requestConfig,
        signal: abortControllerRef.current.signal,
      };

      // Execute request based on method
      let response: ApiResponse<T>;
      
      switch (method) {
        case 'GET':
          response = await apiClient.get<T>(url, finalConfig);
          break;
        case 'POST':
          response = await apiClient.post<T>(url, params, finalConfig);
          break;
        case 'PUT':
          response = await apiClient.put<T>(url, params, finalConfig);
          break;
        case 'PATCH':
          response = await apiClient.patch<T>(url, params, finalConfig);
          break;
        case 'DELETE':
          response = await apiClient.delete<T>(url, finalConfig);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      if (response.success && response.data !== undefined) {
        const responseData = response.data;
        setData(responseData);

        // Cache the response if cache key is provided
        if (cacheKey) {
          apiCache.set(effectiveCacheKey, responseData, cacheDuration);
        }

        // Call success callback
        if (onSuccess) {
          onSuccess(responseData);
        }

        setLoading(false);
        return responseData;
      } else {
        throw new Error(response.message || 'Request failed');
      }
    } catch (err: any) {
      // Don't handle aborted requests as errors
      if (err.name === 'AbortError') {
        return null;
      }

      // Revert optimistic update on error
      if (optimisticUpdate && revertOnError && previousDataRef.current !== null) {
        setData(previousDataRef.current);
      }

      const errorMessage = ErrorTransformer.toUserMessage(err);
      setError(errorMessage);

      // Log error
      ErrorLogger.logError(err, `API Hook: ${method} ${url}`, { params });

      // Call error callback
      if (onError) {
        onError(err);
      }

      setLoading(false);
      return null;
    }
  }, [url, method, cacheKey, cacheDuration, data, optimisticUpdate, revertOnError, onSuccess, onError, requestConfig, cancel]);

  // Refresh function (re-execute with same parameters)
  const refresh = useCallback(async (): Promise<T | null> => {
    // Clear cache for this request
    if (cacheKey) {
      apiCache.clear(cacheKey);
    }
    
    return execute();
  }, [execute, cacheKey]);

  // Execute request immediately on mount if specified
  useEffect(() => {
    if (immediate) {
      execute();
    }

    // Cleanup on unmount
    return () => {
      cancel();
    };
  }, [immediate, execute, cancel]);

  // Re-execute when dependencies change
  useEffect(() => {
    if (dependencies.length > 0 && !immediate) {
      execute();
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  // Computed status flags
  const isSuccess = data !== null && !error && !loading;
  const isError = error !== null;

  return {
    data,
    loading,
    error,
    execute,
    refresh,
    cancel,
    setData,
    setError,
    clearError,
    isSuccess,
    isError,
  };
}

// Specialized hooks for common patterns

// GET request hook
export function useGet<T = any>(url: string, config: UseApiConfig<T> = {}) {
  return useApi<T>(url, 'GET', { immediate: true, ...config });
}

// POST request hook
export function usePost<T = any>(url: string, config: UseApiConfig<T> = {}) {
  return useApi<T>(url, 'POST', config);
}

// PUT request hook
export function usePut<T = any>(url: string, config: UseApiConfig<T> = {}) {
  return useApi<T>(url, 'PUT', config);
}

// PATCH request hook
export function usePatch<T = any>(url: string, config: UseApiConfig<T> = {}) {
  return useApi<T>(url, 'PATCH', config);
}

// DELETE request hook
export function useDelete<T = any>(url: string, config: UseApiConfig<T> = {}) {
  return useApi<T>(url, 'DELETE', config);
}

// File upload hook
export function useUpload<T = any>(url: string, config: UseApiConfig<T> = {}) {
  const [uploadProgress, setUploadProgress] = useState(0);

  const upload = useCallback(async (file: File): Promise<T | null> => {
    setUploadProgress(0);
    
    try {
      const response = await apiClient.upload<T>(
        url,
        file,
        (progress) => setUploadProgress(progress),
        config
      );

      if (response.success && response.data !== undefined) {
        return response.data;
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      ErrorLogger.logError(error, `Upload: ${url}`, { fileName: file.name });
      throw error;
    }
  }, [url, config]);

  return {
    upload,
    uploadProgress,
  };
}

// Infinite scroll/pagination hook
export function usePagination<T = any>(
  url: string,
  config: UseApiConfig<T[]> & {
    pageSize?: number;
    initialPage?: number;
  } = {}
) {
  const { pageSize = 20, initialPage = 1, ...apiConfig } = config;
  const [page, setPage] = useState(initialPage);
  const [allData, setAllData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { execute, loading, error } = useApi<T[]>(
    `${url}?page=${page}&limit=${pageSize}`,
    'GET',
    {
      ...apiConfig,
      onSuccess: (newData) => {
        if (page === 1) {
          setAllData(newData);
        } else {
          setAllData(prev => [...prev, ...newData]);
        }
        
        setHasMore(newData.length === pageSize);
        config.onSuccess?.(newData);
      }
    }
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setAllData([]);
    setHasMore(true);
  }, [initialPage]);

  useEffect(() => {
    execute();
  }, [page, execute]);

  return {
    data: allData,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    page,
  };
}