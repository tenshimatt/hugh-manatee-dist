/**
 * Custom Authentication Hook
 * 
 * Provides a convenient interface for authentication operations
 * and state management throughout the application.
 */

'use client';

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

// Re-export the useAuth hook from AuthContext
export { useAuth } from '@/contexts/AuthContext';

// Additional authentication utilities and hooks
export function useAuthStatus() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    user,
    isGuest: !isAuthenticated && !isLoading,
    isLoggedIn: isAuthenticated && !isLoading,
  };
}

export function useUser() {
  const { user, updateProfile, refreshUser } = useAuth();
  
  return {
    user,
    updateProfile,
    refreshUser,
    isAdmin: user?.accountType === 'admin',
    isBusiness: user?.accountType === 'business',
    hasVerifiedEmail: user?.emailVerified === true,
  };
}

export function useAuthActions() {
  const {
    login,
    register,
    logout,
    resetPassword,
    changePassword,
    sendVerificationEmail,
    verifyEmail,
  } = useAuth();
  
  return {
    login,
    register,
    logout,
    resetPassword,
    changePassword,
    sendVerificationEmail,
    verifyEmail,
  };
}