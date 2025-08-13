import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext();

const API_BASE_URL = 'https://hunta-backend-prod.findrawdogfood.workers.dev/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('huntaToken'));

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const storedToken = localStorage.getItem('huntaToken');
    const storedUser = localStorage.getItem('huntaUser');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        logout();
      }
    }
    
    setIsLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        const { user: userData, token: authToken } = data.data;
        
        setUser(userData);
        setToken(authToken);
        
        localStorage.setItem('huntaToken', authToken);
        localStorage.setItem('huntaUser', JSON.stringify(userData));
        
        return { success: true, user: userData };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        const { user: newUser, token: authToken } = data.data;
        
        setUser(newUser);
        setToken(authToken);
        
        localStorage.setItem('huntaToken', authToken);
        localStorage.setItem('huntaUser', JSON.stringify(newUser));
        
        return { success: true, user: newUser };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('huntaToken');
    localStorage.removeItem('huntaUser');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('huntaUser', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};