/**
 * Loading Boundary Component
 * 
 * Provides consistent loading states and suspense fallbacks
 * throughout the application with beautiful loading indicators.
 */

'use client';

import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface LoadingBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minLoadingTime?: number; // Minimum loading time in ms
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: 'pumpkin' | 'sunglow' | 'olivine' | 'zomp' | 'charcoal';
}

export function LoadingBoundary({
  children,
  fallback,
  minLoadingTime = 0,
  showProgress = false,
  size = 'medium',
  color = 'pumpkin',
}: LoadingBoundaryProps) {
  return (
    <Suspense fallback={fallback || <DefaultLoadingFallback size={size} color={color} showProgress={showProgress} />}>
      {children}
    </Suspense>
  );
}

// Default loading fallback
interface DefaultLoadingFallbackProps {
  size: 'small' | 'medium' | 'large';
  color: 'pumpkin' | 'sunglow' | 'olivine' | 'zomp' | 'charcoal';
  showProgress: boolean;
}

function DefaultLoadingFallback({ size, color, showProgress }: DefaultLoadingFallbackProps) {
  const sizeClasses = {
    small: 'h-32',
    medium: 'h-64',
    large: 'min-h-screen',
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} bg-gradient-to-br from-slate-50 to-stone-100`}>
      <div className="text-center space-y-4">
        <LoadingSpinner size={size} color={color} />
        {showProgress && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Loading...</p>
            <div className="w-32 bg-gray-200 rounded-full h-1">
              <div className="bg-pumpkin h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Page-level loading boundary
export function PageLoadingBoundary({ children, ...props }: LoadingBoundaryProps) {
  return (
    <LoadingBoundary
      size="large"
      showProgress={true}
      {...props}
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-stone-100">
          <div className="text-center space-y-6">
            <LoadingSpinner size="large" color="pumpkin" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-charcoal">Loading Page...</h3>
              <p className="text-gray-600">Please wait while we prepare your content.</p>
            </div>
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-pumpkin to-sunglow h-2 rounded-full animate-pulse transition-all duration-1000" 
                style={{ width: '75%' }}
              ></div>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </LoadingBoundary>
  );
}

// Component-level loading boundary
export function ComponentLoadingBoundary({ children, ...props }: LoadingBoundaryProps) {
  return (
    <LoadingBoundary
      size="medium"
      {...props}
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <LoadingSpinner size="medium" color="pumpkin" />
            <p className="text-sm text-gray-500">Loading component...</p>
          </div>
        </div>
      }
    >
      {children}
    </LoadingBoundary>
  );
}

// Data loading boundary with skeleton
export function DataLoadingBoundary({ children, ...props }: LoadingBoundaryProps) {
  return (
    <LoadingBoundary
      {...props}
      fallback={<SkeletonLoader />}
    >
      {children}
    </LoadingBoundary>
  );
}

// Skeleton loader component
function SkeletonLoader() {
  return (
    <div className="space-y-4 p-4">
      <div className="animate-pulse space-y-3">
        {/* Header skeleton */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Loading boundary with timeout
export function TimeoutLoadingBoundary({ 
  children, 
  timeout = 10000, 
  onTimeout,
  ...props 
}: LoadingBoundaryProps & { 
  timeout?: number;
  onTimeout?: () => void;
}) {
  const [isTimeout, setIsTimeout] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimeout(true);
      if (onTimeout) onTimeout();
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, onTimeout]);

  if (isTimeout) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-charcoal">Taking longer than expected</h3>
            <p className="text-sm text-gray-600">The content is taking longer to load than usual.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-pumpkin text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return <LoadingBoundary {...props}>{children}</LoadingBoundary>;
}

// HOC for adding loading boundary to components
export function withLoadingBoundary<P extends object>(
  Component: React.ComponentType<P>,
  boundaryProps?: Omit<LoadingBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <LoadingBoundary {...boundaryProps}>
      <Component {...props} />
    </LoadingBoundary>
  );

  WrappedComponent.displayName = `withLoadingBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}