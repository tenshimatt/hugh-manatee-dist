/**
 * React Query Provider
 * 
 * Provides React Query client for API state management, caching,
 * and data synchronization across the application.
 */

'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { toast } from 'sonner';
import { ErrorTransformer, ErrorLogger } from '@/lib/errors';

// Default query client configuration
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 5 minutes cache time
        staleTime: 5 * 60 * 1000,
        // 10 minutes garbage collection time
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 3 times
        retry: 3,
        // Retry with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus only for critical data
        refetchOnWindowFocus: false,
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Network mode
        networkMode: 'online',
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        // Network mode for mutations
        networkMode: 'online',
      },
    },
    queryCache: new QueryCache({
      onError: (error: any, query) => {
        // Only show error toasts for background refetches if the query has data
        // This prevents error toasts when initial queries fail
        if (query.state.data !== undefined) {
          const message = ErrorTransformer.toUserMessage(error);
          toast.error('Query Error', {
            description: message,
          });
        }
        
        // Log all query errors
        ErrorLogger.logError(error, 'React Query - Query Error', {
          queryKey: query.queryKey,
          queryHash: query.queryHash,
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error: any, variables, context, mutation) => {
        // Show user-friendly error message for mutations
        const message = ErrorTransformer.toUserMessage(error);
        toast.error('Operation Failed', {
          description: message,
        });
        
        // Log mutation errors
        ErrorLogger.logError(error, 'React Query - Mutation Error', {
          mutationKey: mutation.options.mutationKey,
          variables,
        });
      },
      onSuccess: (data, variables, context, mutation) => {
        // Show success message for mutations if specified
        const mutationKey = mutation.options.mutationKey?.[0] as string;
        
        // Success messages for common operations
        const successMessages: Record<string, string> = {
          'auth-login': 'Welcome back!',
          'auth-register': 'Account created successfully!',
          'auth-logout': 'Logged out successfully',
          'auth-update-profile': 'Profile updated successfully',
          'auth-change-password': 'Password changed successfully',
          'blog-add-comment': 'Comment added successfully',
          'blog-like-post': 'Post liked!',
          'blog-unlike-post': 'Post unliked',
          'store-add-review': 'Review submitted successfully',
        };
        
        if (mutationKey && successMessages[mutationKey]) {
          toast.success(successMessages[mutationKey]);
        }
      },
    }),
  });
};

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a stable query client instance
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

// Custom hooks for common query patterns

/**
 * Hook for queries that require authentication
 */
export function useAuthenticatedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: any
) {
  // This would typically check auth status and only run if authenticated
  // For now, we'll implement basic functionality
  return {
    queryKey,
    queryFn,
    ...options,
    enabled: options?.enabled !== false, // Can be overridden
  };
}

/**
 * Hook for queries that should be cached longer (for relatively static data)
 */
export function useCachedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: any
) {
  return {
    queryKey,
    queryFn,
    ...options,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour
  };
}

/**
 * Hook for real-time queries (frequently updated data)
 */
export function useRealTimeQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: any
) {
  return {
    queryKey,
    queryFn,
    ...options,
    staleTime: 0,              // Always stale
    gcTime: 5 * 60 * 1000,     // 5 minutes
    refetchInterval: 30000,    // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  };
}

/**
 * Query key factories for consistent cache management
 */
export const queryKeys = {
  // Auth related
  auth: {
    all: ['auth'] as const,
    user: () => ['auth', 'user'] as const,
    profile: () => ['auth', 'profile'] as const,
    sessions: () => ['auth', 'sessions'] as const,
    activity: (page: number) => ['auth', 'activity', page] as const,
  },
  
  // Blog related
  blog: {
    all: ['blog'] as const,
    posts: (params: any) => ['blog', 'posts', params] as const,
    post: (id: string) => ['blog', 'post', id] as const,
    postBySlug: (slug: string) => ['blog', 'post', 'slug', slug] as const,
    comments: (postId: string, page: number) => ['blog', 'comments', postId, page] as const,
    categories: () => ['blog', 'categories'] as const,
    tags: () => ['blog', 'tags'] as const,
    featured: (limit: number) => ['blog', 'featured', limit] as const,
    recent: (limit: number) => ['blog', 'recent', limit] as const,
    popular: (limit: number, timeframe: string) => ['blog', 'popular', limit, timeframe] as const,
    related: (postId: string, limit: number) => ['blog', 'related', postId, limit] as const,
    stats: () => ['blog', 'stats'] as const,
  },
  
  // Store related
  stores: {
    all: ['stores'] as const,
    nearby: (params: any) => ['stores', 'nearby', params] as const,
    store: (id: string) => ['stores', 'store', id] as const,
    reviews: (storeId: string, page: number) => ['stores', 'reviews', storeId, page] as const,
    categories: () => ['stores', 'categories'] as const,
    types: () => ['stores', 'types'] as const,
    specialties: () => ['stores', 'specialties'] as const,
    stats: () => ['stores', 'stats'] as const,
  },
  
  // Chat related
  chat: {
    all: ['chat'] as const,
    conversations: () => ['chat', 'conversations'] as const,
    conversation: (id: string) => ['chat', 'conversation', id] as const,
    messages: (conversationId: string) => ['chat', 'messages', conversationId] as const,
  },
  
  // User data
  user: {
    all: ['user'] as const,
    pets: () => ['user', 'pets'] as const,
    pet: (id: string) => ['user', 'pet', id] as const,
    feedingEntries: (petId: string, date?: string) => ['user', 'feeding', petId, date] as const,
    healthRecords: (petId: string) => ['user', 'health', petId] as const,
    notifications: (page: number) => ['user', 'notifications', page] as const,
    pawsTransactions: (page: number) => ['user', 'paws', page] as const,
  },
} as const;

/**
 * Mutation keys for consistent mutation management
 */
export const mutationKeys = {
  // Auth mutations
  auth: {
    login: ['auth-login'] as const,
    register: ['auth-register'] as const,
    logout: ['auth-logout'] as const,
    updateProfile: ['auth-update-profile'] as const,
    changePassword: ['auth-change-password'] as const,
    resetPassword: ['auth-reset-password'] as const,
    verifyEmail: ['auth-verify-email'] as const,
    uploadAvatar: ['auth-upload-avatar'] as const,
  },
  
  // Blog mutations
  blog: {
    likePost: ['blog-like-post'] as const,
    unlikePost: ['blog-unlike-post'] as const,
    sharePost: ['blog-share-post'] as const,
    addComment: ['blog-add-comment'] as const,
    updateComment: ['blog-update-comment'] as const,
    deleteComment: ['blog-delete-comment'] as const,
    voteComment: ['blog-vote-comment'] as const,
    reportComment: ['blog-report-comment'] as const,
    subscribeNewsletter: ['blog-subscribe-newsletter'] as const,
  },
  
  // Store mutations
  stores: {
    addReview: ['store-add-review'] as const,
    updateReview: ['store-update-review'] as const,
    deleteReview: ['store-delete-review'] as const,
    reportStore: ['store-report'] as const,
  },
  
  // Chat mutations
  chat: {
    sendMessage: ['chat-send-message'] as const,
    createConversation: ['chat-create-conversation'] as const,
    updateConversation: ['chat-update-conversation'] as const,
    deleteConversation: ['chat-delete-conversation'] as const,
  },
  
  // Pet management mutations
  pets: {
    createPet: ['pet-create'] as const,
    updatePet: ['pet-update'] as const,
    deletePet: ['pet-delete'] as const,
    addFeedingEntry: ['pet-add-feeding'] as const,
    updateFeedingEntry: ['pet-update-feeding'] as const,
    deleteFeedingEntry: ['pet-delete-feeding'] as const,
    addHealthRecord: ['pet-add-health'] as const,
    updateHealthRecord: ['pet-update-health'] as const,
    deleteHealthRecord: ['pet-delete-health'] as const,
  },
} as const;

export default QueryProvider;