/**
 * Authentication Service
 * 
 * Provides authentication API calls for login, registration,
 * password management, and user profile operations.
 */

import { apiClient } from '@/lib/api';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  ResetPasswordData, 
  ChangePasswordData 
} from '@/lib/auth';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthServiceError {
  message: string;
  code?: string;
  field?: string;
}

class AuthService {
  
  /**
   * Login user with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Login failed');
    }
    
    return response.data;
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<{ user: User; message: string }> {
    const response = await apiClient.post<{ user: User; message: string }>('/auth/register', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Registration failed');
    }
    
    return response.data;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/logout');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Logout failed');
    }
    
    return response.data;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch user profile');
    }
    
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/auth/profile', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update profile');
    }
    
    return response.data;
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/change-password', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to change password');
    }
    
    return response.data;
  }

  /**
   * Request password reset
   */
  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to send reset email');
    }
    
    return response.data;
  }

  /**
   * Reset password with token
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password/confirm', {
      token,
      newPassword,
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to reset password');
    }
    
    return response.data;
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/send-verification');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to send verification email');
    }
    
    return response.data;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<User> {
    const response = await apiClient.post<User>('/auth/verify-email', { token });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to verify email');
    }
    
    return response.data;
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to refresh token');
    }
    
    return response.data;
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const response = await apiClient.upload<{ avatarUrl: string }>('/auth/avatar', file);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to upload avatar');
    }
    
    return response.data;
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/delete-account', {
      password,
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to delete account');
    }
    
    return response.data;
  }

  /**
   * Get user activity log
   */
  async getActivityLog(page = 1, limit = 20): Promise<{
    activities: Array<{
      id: string;
      type: string;
      description: string;
      ipAddress: string;
      userAgent: string;
      createdAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await apiClient.get(`/auth/activity?page=${page}&limit=${limit}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch activity log');
    }
    
    return response.data;
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
    reviews: boolean;
    points: boolean;
    blog: boolean;
    marketing: boolean;
  }): Promise<{ message: string }> {
    const response = await apiClient.put<{ message: string }>('/auth/preferences/notifications', preferences);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update preferences');
    }
    
    return response.data;
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(settings: {
    profileVisible: boolean;
    locationVisible: boolean;
    showInSearch: boolean;
    allowMessages: boolean;
  }): Promise<{ message: string }> {
    const response = await apiClient.put<{ message: string }>('/auth/preferences/privacy', settings);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update privacy settings');
    }
    
    return response.data;
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(): Promise<{ qrCode: string; secret: string }> {
    const response = await apiClient.post<{ qrCode: string; secret: string }>('/auth/2fa/enable');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to enable 2FA');
    }
    
    return response.data;
  }

  /**
   * Confirm two-factor authentication setup
   */
  async confirmTwoFactor(code: string): Promise<{ backupCodes: string[] }> {
    const response = await apiClient.post<{ backupCodes: string[] }>('/auth/2fa/confirm', { code });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to confirm 2FA');
    }
    
    return response.data;
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(password: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/2fa/disable', { password });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to disable 2FA');
    }
    
    return response.data;
  }

  /**
   * Get user sessions
   */
  async getUserSessions(): Promise<Array<{
    id: string;
    deviceType: string;
    location: string;
    ipAddress: string;
    lastActivity: string;
    current: boolean;
  }>> {
    const response = await apiClient.get('/auth/sessions');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch sessions');
    }
    
    return response.data;
  }

  /**
   * Revoke user session
   */
  async revokeSession(sessionId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/auth/sessions/${sessionId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to revoke session');
    }
    
    return response.data;
  }

  /**
   * Revoke all other sessions
   */
  async revokeAllOtherSessions(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/sessions/revoke-others');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to revoke sessions');
    }
    
    return response.data;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;