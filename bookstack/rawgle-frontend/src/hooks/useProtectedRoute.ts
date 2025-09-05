/**
 * Protected Route Hook
 * 
 * Provides route protection logic for components and pages
 * that require authentication or specific permissions.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User, permissionUtils } from '@/lib/auth';

interface UseProtectedRouteConfig {
  // Authentication requirements
  requireAuth?: boolean; // Default: true
  requireEmailVerification?: boolean; // Default: false
  
  // Permission requirements
  requiredAccountType?: User['accountType'];
  requiredLevel?: string;
  requiredTokens?: number;
  
  // Custom permission check
  customPermissionCheck?: (user: User | null) => boolean;
  
  // Redirect options
  redirectTo?: string; // Default: '/auth/login'
  returnUrl?: boolean; // Store current URL for return after auth
  
  // Loading behavior
  showLoader?: boolean; // Default: true
}

interface UseProtectedRouteReturn {
  isAuthorized: boolean;
  isLoading: boolean;
  user: User | null;
  redirecting: boolean;
}

export function useProtectedRoute(config: UseProtectedRouteConfig = {}): UseProtectedRouteReturn {
  const {
    requireAuth = true,
    requireEmailVerification = false,
    requiredAccountType,
    requiredLevel,
    requiredTokens,
    customPermissionCheck,
    redirectTo = '/auth/login',
    returnUrl = true,
    showLoader = true,
  } = config;

  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();
  
  const [redirecting, setRedirecting] = useState(false);

  // Check if user meets all requirements
  const isAuthorized = (() => {
    // If auth not required, always authorized
    if (!requireAuth) return true;
    
    // If still loading, not yet determined
    if (isLoading) return false;
    
    // If auth required but not authenticated
    if (!isAuthenticated || !user) return false;
    
    // Check email verification requirement
    if (requireEmailVerification && !permissionUtils.hasVerifiedEmail(user)) {
      return false;
    }
    
    // Check account type requirement
    if (requiredAccountType && !permissionUtils.hasAccountType(user, requiredAccountType)) {
      return false;
    }
    
    // Check level requirement
    if (requiredLevel && !permissionUtils.canAccessFeature(user, requiredLevel)) {
      return false;
    }
    
    // Check token requirement
    if (requiredTokens && !permissionUtils.hasSufficientTokens(user, requiredTokens)) {
      return false;
    }
    
    // Check custom permission
    if (customPermissionCheck && !customPermissionCheck(user)) {
      return false;
    }
    
    return true;
  })();

  // Handle redirects when authorization changes
  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return;
    
    // Don't redirect if already authorized
    if (isAuthorized) return;
    
    // Don't redirect if auth not required
    if (!requireAuth) return;
    
    // Don't redirect if already redirecting
    if (redirecting) return;
    
    setRedirecting(true);
    
    // Determine redirect destination
    let redirectPath = redirectTo;
    
    // Special cases for different authorization failures
    if (requireAuth && !isAuthenticated) {
      redirectPath = '/auth/login';
    } else if (requireEmailVerification && user && !user.emailVerified) {
      redirectPath = '/auth/verify-email';
    } else if (requiredAccountType && user && !permissionUtils.hasAccountType(user, requiredAccountType)) {
      redirectPath = '/unauthorized?reason=account_type';
    } else if (requiredLevel && user && !permissionUtils.canAccessFeature(user, requiredLevel)) {
      redirectPath = '/unauthorized?reason=level';
    } else if (requiredTokens && user && !permissionUtils.hasSufficientTokens(user, requiredTokens)) {
      redirectPath = '/unauthorized?reason=tokens';
    }
    
    // Store return URL if requested
    if (returnUrl && typeof window !== 'undefined') {
      sessionStorage.setItem('returnUrl', pathname);
    }
    
    // Perform redirect
    router.push(redirectPath);
  }, [
    isLoading,
    isAuthorized,
    requireAuth,
    redirecting,
    router,
    redirectTo,
    pathname,
    returnUrl,
    isAuthenticated,
    user,
    requireEmailVerification,
    requiredAccountType,
    requiredLevel,
    requiredTokens,
  ]);

  // Reset redirecting state when authorization changes
  useEffect(() => {
    if (redirecting && isAuthorized) {
      setRedirecting(false);
    }
  }, [redirecting, isAuthorized]);

  return {
    isAuthorized,
    isLoading: isLoading || (showLoader && redirecting),
    user,
    redirecting,
  };
}

// Specialized hooks for common protection patterns

export function useRequireAuth() {
  return useProtectedRoute({ requireAuth: true });
}

export function useRequireEmailVerification() {
  return useProtectedRoute({
    requireAuth: true,
    requireEmailVerification: true,
    redirectTo: '/auth/verify-email',
  });
}

export function useRequireAdmin() {
  return useProtectedRoute({
    requireAuth: true,
    requiredAccountType: 'admin',
    redirectTo: '/unauthorized?reason=admin_required',
  });
}

export function useRequireBusiness() {
  return useProtectedRoute({
    requireAuth: true,
    requiredAccountType: 'business',
    redirectTo: '/auth/upgrade?reason=business_required',
  });
}

export function useRequireLevel(level: string) {
  return useProtectedRoute({
    requireAuth: true,
    requiredLevel: level,
    redirectTo: '/unauthorized?reason=level_required',
  });
}

export function useRequireTokens(tokens: number) {
  return useProtectedRoute({
    requireAuth: true,
    requiredTokens: tokens,
    redirectTo: '/tokens/insufficient',
  });
}

// Guest-only routes (redirect if authenticated)
export function useGuestOnly() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !redirecting) {
      setRedirecting(true);
      
      // Get return URL or default to dashboard
      const returnUrl = typeof window !== 'undefined' 
        ? sessionStorage.getItem('returnUrl') || '/dashboard'
        : '/dashboard';
      
      // Clear return URL
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('returnUrl');
      }
      
      router.push(returnUrl);
    }
  }, [isLoading, isAuthenticated, redirecting, router]);

  return {
    isAuthorized: !isAuthenticated && !isLoading,
    isLoading: isLoading || redirecting,
    redirecting,
  };
}

// Role-based access control hook
export function useRoleAccess(roles: User['accountType'][] | User['accountType']) {
  const { user } = useAuth();
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const hasAccess = user ? allowedRoles.includes(user.accountType) : false;
  
  return {
    hasAccess,
    userRole: user?.accountType,
    allowedRoles,
  };
}

// Feature access hook (based on user level)
export function useFeatureAccess(requiredLevel: string) {
  const { user } = useAuth();
  
  const hasAccess = user ? permissionUtils.canAccessFeature(user, requiredLevel) : false;
  
  return {
    hasAccess,
    userLevel: user?.level,
    requiredLevel,
  };
}