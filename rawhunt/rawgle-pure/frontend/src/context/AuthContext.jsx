import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('rawgle_token'));

  useEffect(() => {
    if (token) {
      // Verify token and get user data
      validateToken();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const userData = await authService.validateToken(token);
      setUser(userData);
    } catch (error) {
      console.error('Token validation failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { token: newToken, user: userData } = response;
      
      localStorage.setItem('rawgle_token', newToken);
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const { token: newToken, user: userInfo } = response;
      
      localStorage.setItem('rawgle_token', newToken);
      setToken(newToken);
      setUser(userInfo);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('rawgle_token');
    setToken(null);
    setUser(null);
  };

  const linkWallet = async (walletAddress) => {
    try {
      const response = await authService.linkWallet(walletAddress, token);
      setUser({ ...user, wallet_address: walletAddress });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    linkWallet,
    isAuthenticated: !!user,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};