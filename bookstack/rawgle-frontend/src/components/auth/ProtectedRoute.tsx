/**
 * Protected Route Component
 * 
 * Wrapper component for protecting routes that require authentication
 * or specific permissions. Handles loading states and redirects.
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { User } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  
  // Authentication requirements
  requireAuth?: boolean;
  requireEmailVerification?: boolean;
  
  // Permission requirements
  requiredAccountType?: User['accountType'];
  requiredLevel?: string;
  requiredTokens?: number;
  
  // Custom permission check
  customPermissionCheck?: (user: User | null) => boolean;
  
  // Redirect options
  redirectTo?: string;
  returnUrl?: boolean;
  
  // Loading behavior
  showLoader?: boolean;
  loadingComponent?: React.ComponentType;
  
  // Fallback components
  unauthorizedComponent?: React.ComponentType<{ reason?: string }>;
  loadingComponent?: React.ComponentType;
}

interface LoadingScreenProps {
  message?: string;
}

// Default loading screen
function DefaultLoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-pumpkin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{message}</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we verify your access...
          </p>
        </div>
      </div>
    </div>
  );
}

// Default unauthorized screen
interface UnauthorizedScreenProps {
  reason?: string;
}

function DefaultUnauthorizedScreen({ reason }: UnauthorizedScreenProps) {
  const router = useRouter();
  
  const getTitle = () => {
    switch (reason) {
      case 'account_type':
        return 'Account Type Required';
      case 'level':
        return 'Higher Level Required';
      case 'tokens':
        return 'Insufficient PAWS Tokens';
      case 'email_verification':
        return 'Email Verification Required';
      default:
        return 'Access Denied';
    }
  };

  const getMessage = () => {
    switch (reason) {
      case 'account_type':
        return 'This feature requires a different account type. Please upgrade your account or contact support.';
      case 'level':
        return 'This feature requires a higher user level. Complete more activities to unlock this feature.';
      case 'tokens':
        return 'You need more PAWS tokens to access this feature. Earn tokens by participating in the community.';
      case 'email_verification':
        return 'Please verify your email address to continue using this feature.';
      default:
        return 'You do not have permission to access this page.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md mx-auto text-center space-y-6 p-6">
        <div className="text-6xl">🚫</div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">{getTitle()}</h1>
          <p className="text-muted-foreground">{getMessage()}</p>
        </div>
        
        <div className="space-y-3">
          {reason === 'email_verification' && (
            <button
              onClick={() => router.push('/auth/verify-email')}
              className="w-full bg-pumpkin hover:bg-pumpkin/90 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Verify Email
            </button>
          )}
          
          {reason === 'account_type' && (
            <button
              onClick={() => router.push('/auth/upgrade')}
              className="w-full bg-pumpkin hover:bg-pumpkin/90 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Upgrade Account
            </button>
          )}
          
          {reason === 'tokens' && (
            <button
              onClick={() => router.push('/paws/earn')}
              className="w-full bg-pumpkin hover:bg-pumpkin/90 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Earn PAWS Tokens
            </button>
          )}
          
          <button
            onClick={() => router.back()}
            className="w-full border border-border hover:bg-muted text-foreground px-4 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full text-muted-foreground hover:text-foreground transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireEmailVerification = false,
  requiredAccountType,
  requiredLevel,
  requiredTokens,
  customPermissionCheck,
  redirectTo,
  returnUrl = true,
  showLoader = true,
  loadingComponent: CustomLoadingComponent,
  unauthorizedComponent: CustomUnauthorizedComponent,
}: ProtectedRouteProps) {
  const { isAuthorized, isLoading, user, redirecting } = useProtectedRoute({
    requireAuth,
    requireEmailVerification,
    requiredAccountType,
    requiredLevel,
    requiredTokens,
    customPermissionCheck,
    redirectTo,
    returnUrl,
    showLoader,
  });

  // Show loading screen while checking authorization
  if (isLoading || redirecting) {
    if (CustomLoadingComponent) {
      return <CustomLoadingComponent />;
    }
    
    if (showLoader) {
      const message = redirecting 
        ? 'Redirecting...' 
        : requireAuth && !user
          ? 'Checking authentication...'
          : 'Verifying permissions...';
      
      return <DefaultLoadingScreen message={message} />;
    }
    
    return null;
  }

  // Show unauthorized screen if not authorized and not redirecting
  if (!isAuthorized) {
    if (CustomUnauthorizedComponent) {
      const reason = !user 
        ? 'authentication'
        : requireEmailVerification && !user?.emailVerified
          ? 'email_verification'
          : requiredAccountType && user?.accountType !== requiredAccountType
            ? 'account_type'
            : requiredLevel
              ? 'level'
              : requiredTokens
                ? 'tokens'
                : 'permission';
                
      return <CustomUnauthorizedComponent reason={reason} />;
    }
    
    // Don't show anything if we're going to redirect
    return null;
  }

  // Render protected content
  return <>{children}</>;
}

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  protectionConfig?: Omit<ProtectedRouteProps, 'children'>
) {
  const displayName = Component.displayName || Component.name || 'Component';
  
  function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...protectionConfig}>
        <Component {...props} />
      </ProtectedRoute>
    );
  }
  
  ProtectedComponent.displayName = `withProtectedRoute(${displayName})`;
  
  return ProtectedComponent;
}

// Specialized components for common protection scenarios

export function AuthenticatedRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requireAuth'>) {
  return (
    <ProtectedRoute requireAuth={true} {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function VerifiedRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requireAuth' | 'requireEmailVerification'>) {
  return (
    <ProtectedRoute 
      requireAuth={true} 
      requireEmailVerification={true} 
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requireAuth' | 'requiredAccountType'>) {
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

export function BusinessRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requireAuth' | 'requiredAccountType'>) {
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

export function PremiumRoute({ 
  children, 
  requiredLevel = 'Silver',
  ...props 
}: Omit<ProtectedRouteProps, 'requireAuth' | 'requiredLevel'> & { requiredLevel?: string }) {
  return (
    <ProtectedRoute 
      requireAuth={true} 
      requiredLevel={requiredLevel}
      redirectTo="/unauthorized?reason=level_required"
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function TokenGatedRoute({ 
  children, 
  requiredTokens,
  ...props 
}: Omit<ProtectedRouteProps, 'requireAuth' | 'requiredTokens'> & { requiredTokens: number }) {
  return (
    <ProtectedRoute 
      requireAuth={true} 
      requiredTokens={requiredTokens}
      redirectTo="/tokens/insufficient"
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export default ProtectedRoute;