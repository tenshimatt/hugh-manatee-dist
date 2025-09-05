/**
 * Protected Route Component
 * 
 * A wrapper component that protects routes based on authentication
 * and permission requirements. Provides loading states and redirects.
 */

'use client';

import React from 'react';
import { useProtectedRoute, UseProtectedRouteConfig } from '@/hooks/useProtectedRoute';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ProtectedRouteProps extends UseProtectedRouteConfig {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  fallback,
  errorFallback,
  ...config
}: ProtectedRouteProps) {
  const { isAuthorized, isLoading } = useProtectedRoute(config);

  // Show loading state
  if (isLoading) {
    return fallback || <DefaultLoadingFallback />;
  }

  // Show error if not authorized and not redirecting
  if (!isAuthorized) {
    return errorFallback || <DefaultErrorFallback />;
  }

  // Render children with error boundary
  return (
    <ErrorBoundary fallback={errorFallback}>
      {children}
    </ErrorBoundary>
  );
}

// Default loading fallback
function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-stone-100">
      <div className="text-center space-y-4">
        <LoadingSpinner size="large" color="pumpkin" />
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-charcoal">Loading...</h3>
          <p className="text-sm text-gray-600">Please wait while we verify your access.</p>
        </div>
      </div>
    </div>
  );
}

// Default error fallback
function DefaultErrorFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-stone-100">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-charcoal">Access Denied</h3>
          <p className="text-sm text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    </div>
  );
}

// Specialized wrapper components
export function RequireAuth({ children, ...props }: { children: React.ReactNode } & Omit<ProtectedRouteProps, 'requireAuth'>) {
  return (
    <ProtectedRoute requireAuth={true} {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function RequireEmailVerification({ children, ...props }: { children: React.ReactNode } & Omit<ProtectedRouteProps, 'requireEmailVerification'>) {
  return (
    <ProtectedRoute 
      requireAuth={true}
      requireEmailVerification={true}
      redirectTo="/auth/verify-email"
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function RequireAdmin({ children, ...props }: { children: React.ReactNode } & Omit<ProtectedRouteProps, 'requiredAccountType'>) {
  return (
    <ProtectedRoute 
      requireAuth={true}
      requiredAccountType="admin"
      redirectTo="/unauthorized?reason=admin_required"
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function RequireBusiness({ children, ...props }: { children: React.ReactNode } & Omit<ProtectedRouteProps, 'requiredAccountType'>) {
  return (
    <ProtectedRoute 
      requireAuth={true}
      requiredAccountType="business"
      redirectTo="/auth/upgrade?reason=business_required"
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}