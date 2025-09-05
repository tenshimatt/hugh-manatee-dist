/**
 * API Integration Test Page
 * 
 * A simple test page to verify frontend-backend integration
 * and demonstrate the authentication flow.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ApiTestPage() {
  const { isAuthenticated, user, login, logout, isLoading: authLoading } = useAuth();
  const [healthData, setHealthData] = useState<any>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);

  // Test backend health check
  const testHealthCheck = async () => {
    try {
      setHealthError(null);
      const health = await apiClient.healthCheck();
      setHealthData(health);
    } catch (error: any) {
      setHealthError(error.message || 'Health check failed');
      console.error('Health check error:', error);
    }
  };

  // Test API endpoints with authentication
  const { data: apiData, loading: apiLoading, execute: testApiCall } = useApi('/auth/status', 'GET');

  // Test health check on page load
  useEffect(() => {
    testHealthCheck();
  }, []);

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    try {
      await login(loginForm);
    } catch (error: any) {
      setLoginError(error.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-charcoal">API Integration Test</h1>
          <p className="text-gray-600">Testing frontend-backend integration and authentication</p>
        </div>

        {/* Authentication Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-charcoal mb-4">Authentication Status</h2>
          
          {authLoading ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="small" />
              <span>Checking authentication...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="font-medium">
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>

              {user && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h3 className="font-medium text-charcoal">User Information:</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Name:</strong> {user.name}</div>
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>Account Type:</strong> {user.accountType}</div>
                    <div><strong>Level:</strong> {user.level}</div>
                    <div><strong>PAWS Tokens:</strong> {user.pawsTokens}</div>
                    <div><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                {isAuthenticated ? (
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Logout
                  </button>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="email"
                        placeholder="Email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pumpkin"
                        required
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pumpkin"
                        required
                      />
                    </div>
                    {loginError && (
                      <div className="text-red-600 text-sm">{loginError}</div>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-2 bg-pumpkin text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Test Login
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Backend Health Check */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-charcoal mb-4">Backend Health Check</h2>
          
          <div className="space-y-4">
            <button
              onClick={testHealthCheck}
              className="px-4 py-2 bg-olivine text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Test Health Check
            </button>

            {healthError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-800">Health Check Failed:</h3>
                <p className="text-red-700">{healthError}</p>
              </div>
            ) : healthData ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800">Backend Status:</h3>
                <pre className="text-sm text-green-700 mt-2 overflow-auto">
                  {JSON.stringify(healthData, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-gray-500">No health data available</div>
            )}
          </div>
        </div>

        {/* API Test Calls */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-charcoal mb-4">API Test Calls</h2>
          
          <div className="space-y-4">
            <button
              onClick={() => testApiCall()}
              disabled={apiLoading}
              className="px-4 py-2 bg-zomp text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
            >
              {apiLoading ? 'Testing...' : 'Test Auth Status Endpoint'}
            </button>

            {apiData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800">API Response:</h3>
                <pre className="text-sm text-blue-700 mt-2 overflow-auto">
                  {JSON.stringify(apiData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Integration Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-charcoal mb-4">Integration Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${healthData ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <h3 className="font-medium">Backend Connection</h3>
              <p className="text-sm text-gray-600">
                {healthData ? 'Connected to localhost:8000' : 'Connection Failed'}
              </p>
            </div>
            
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${isAuthenticated ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <h3 className="font-medium">Authentication</h3>
              <p className="text-sm text-gray-600">
                {isAuthenticated ? 'User logged in' : 'No active session'}
              </p>
            </div>
            
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${apiData ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <h3 className="font-medium">API Calls</h3>
              <p className="text-sm text-gray-600">
                {apiData ? 'API responding' : 'No API data'}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Test Instructions</h2>
          <ul className="text-yellow-700 space-y-1 text-sm">
            <li>• Ensure the backend server is running on localhost:8000</li>
            <li>• Check that CORS is properly configured for frontend origin</li>
            <li>• Test the health check to verify basic connectivity</li>
            <li>• Use the login form to test authentication (email: admin@rawgle.com, password: admin123)</li>
            <li>• Test authenticated API calls after logging in</li>
            <li>• Check browser console for detailed error information</li>
          </ul>
        </div>
      </div>
    </div>
  );
}