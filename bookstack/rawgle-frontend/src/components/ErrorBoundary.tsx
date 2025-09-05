/**
 * Error Boundary Component
 * 
 * React Error Boundary for catching and handling JavaScript errors
 * in the component tree. Provides graceful error recovery.
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorLogger } from '@/lib/errors';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error tracking service
    ErrorLogger.logError(error, 'ErrorBoundary', {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
    });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback 
          error={this.state.error}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
interface DefaultErrorFallbackProps {
  error?: Error;
  onRetry: () => void;
  onReload: () => void;
}

function DefaultErrorFallback({ error, onRetry, onReload }: DefaultErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center space-y-6">
          {/* Error Icon */}
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-10 h-10 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-charcoal">Oops! Something went wrong</h2>
            <p className="text-gray-600">
              We&apos;re sorry, but something unexpected happened. Please try again.
            </p>
          </div>

          {/* Error Details in Development */}
          {isDevelopment && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <h3 className="font-medium text-red-800 mb-2">Error Details (Development Only):</h3>
              <div className="text-sm text-red-700 space-y-1">
                <p><strong>Error:</strong> {error.name}</p>
                <p><strong>Message:</strong> {error.message}</p>
                {error.stack && (
                  <div className="mt-2">
                    <p><strong>Stack Trace:</strong></p>
                    <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-pumpkin text-white font-medium rounded-lg hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-pumpkin focus:ring-offset-2"
            >
              Try Again
            </button>
            <button
              onClick={onReload}
              className="px-6 py-3 bg-gray-200 text-charcoal font-medium rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Reload Page
            </button>
          </div>

          {/* Contact Support Link */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              If this problem persists,{' '}
              <a 
                href="mailto:support@rawgle.com" 
                className="text-pumpkin hover:text-orange-600 font-medium"
              >
                contact our support team
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Functional error boundary hook for modern React patterns
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    ErrorLogger.logError(error, 'useErrorHandler', errorInfo);
  }, []);
}

// Error boundary wrapper for specific components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Async error boundary for handling async errors
export class AsyncErrorBoundary extends ErrorBoundary {
  componentDidMount() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    // Create an error from the unhandled rejection
    const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
    
    // Update state to trigger error boundary
    this.setState({
      hasError: true,
      error,
    });

    // Prevent the default browser handling
    event.preventDefault();
  };
}