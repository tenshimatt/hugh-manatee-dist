/**
 * API Test Panel Component
 * 
 * Development utility for testing API integration and connectivity.
 * Only displayed in development mode.
 */

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { blogService } from '@/services/blogService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Server, 
  Database, 
  Shield, 
  MessageSquare,
  Globe,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  duration?: number;
  data?: any;
}

export function ApiTestPanel() {
  const { isAuthenticated, user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);

  // Individual test functions
  const runHealthCheck = async (): Promise<TestResult> => {
    const start = Date.now();
    try {
      const result = await apiClient.healthCheck();
      return {
        name: 'Backend Health Check',
        status: 'success',
        message: `Backend is healthy - ${result.status}`,
        duration: Date.now() - start,
        data: result,
      };
    } catch (error: any) {
      return {
        name: 'Backend Health Check',
        status: 'error',
        message: error.message || 'Health check failed',
        duration: Date.now() - start,
      };
    }
  };

  const runAuthTest = async (): Promise<TestResult> => {
    const start = Date.now();
    try {
      if (isAuthenticated) {
        const userData = await authService.getCurrentUser();
        return {
          name: 'Authentication Test',
          status: 'success',
          message: `Authenticated as ${userData.email}`,
          duration: Date.now() - start,
          data: userData,
        };
      } else {
        return {
          name: 'Authentication Test',
          status: 'success',
          message: 'Not authenticated (expected)',
          duration: Date.now() - start,
        };
      }
    } catch (error: any) {
      return {
        name: 'Authentication Test',
        status: 'error',
        message: error.message || 'Auth test failed',
        duration: Date.now() - start,
      };
    }
  };

  const runBlogTest = async (): Promise<TestResult> => {
    const start = Date.now();
    try {
      const posts = await blogService.getPosts({ limit: 5 });
      return {
        name: 'Blog API Test',
        status: 'success',
        message: `Retrieved ${posts.posts.length} blog posts`,
        duration: Date.now() - start,
        data: posts,
      };
    } catch (error: any) {
      return {
        name: 'Blog API Test',
        status: 'error',
        message: error.message || 'Blog API test failed',
        duration: Date.now() - start,
      };
    }
  };

  const runApiClientTest = async (): Promise<TestResult> => {
    const start = Date.now();
    try {
      // Test basic API client functionality with a simple GET request
      const response = await apiClient.get('/health');
      return {
        name: 'API Client Test',
        status: 'success',
        message: 'API client working correctly',
        duration: Date.now() - start,
        data: response,
      };
    } catch (error: any) {
      return {
        name: 'API Client Test',
        status: 'error',
        message: error.message || 'API client test failed',
        duration: Date.now() - start,
      };
    }
  };

  const runCorsTest = async (): Promise<TestResult> => {
    const start = Date.now();
    try {
      // Test CORS by making a cross-origin request
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          name: 'CORS Test',
          status: 'success',
          message: 'CORS configured correctly',
          duration: Date.now() - start,
          data: data,
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      return {
        name: 'CORS Test',
        status: 'error',
        message: error.message || 'CORS test failed',
        duration: Date.now() - start,
      };
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    setSelectedTest(null);

    const tests = [
      runHealthCheck,
      runCorsTest,
      runApiClientTest,
      runAuthTest,
      runBlogTest,
    ];

    const results: TestResult[] = [];

    for (const test of tests) {
      const result = await test();
      results.push(result);
      setTestResults([...results]);
    }

    setIsRunningTests(false);
    
    const successCount = results.filter(r => r.status === 'success').length;
    const totalCount = results.length;
    
    if (successCount === totalCount) {
      toast.success(`All ${totalCount} tests passed!`);
    } else {
      toast.error(`${totalCount - successCount} of ${totalCount} tests failed`);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  // Connection status indicators
  const ConnectionStatus = () => {
    const { data: healthData, isLoading, error } = useQuery({
      queryKey: ['health-check'],
      queryFn: () => apiClient.healthCheck(),
      refetchInterval: 30000, // Check every 30 seconds
      retry: 1,
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Backend API</span>
              {isLoading ? (
                <Badge variant="secondary">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Checking...
                </Badge>
              ) : error ? (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Authentication</span>
              {isAuthenticated ? (
                <Badge variant="default" className="bg-blue-500">
                  <Shield className="w-3 h-3 mr-1" />
                  Authenticated
                </Badge>
              ) : (
                <Badge variant="outline">
                  Guest
                </Badge>
              )}
            </div>

            {healthData && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground">
                  <div>Status: {healthData.status}</div>
                  <div>Timestamp: {healthData.timestamp}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Server className="w-4 h-4" />
            API Integration Test Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="status" className="space-y-4">
              <ConnectionStatus />
              
              {user && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Current User</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs">
                      <div>Email: {user.email}</div>
                      <div>Name: {user.name}</div>
                      <div>Type: {user.accountType}</div>
                      <div>Level: {user.level}</div>
                      <div>PAWS: {user.pawsTokens}</div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="tests" className="space-y-4">
              <div className="space-y-2">
                <Button 
                  onClick={runAllTests} 
                  disabled={isRunningTests}
                  className="w-full"
                  size="sm"
                >
                  {isRunningTests ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    'Run All Tests'
                  )}
                </Button>

                {testResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className="p-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => setSelectedTest(result)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{result.name}</span>
                          {getStatusIcon(result.status)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {result.message}
                        </div>
                        {result.duration && (
                          <div className="text-xs text-muted-foreground">
                            {result.duration}ms
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedTest && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        {selectedTest.name}
                        {getStatusBadge(selectedTest.status)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs space-y-2">
                        <div>Message: {selectedTest.message}</div>
                        {selectedTest.duration && (
                          <div>Duration: {selectedTest.duration}ms</div>
                        )}
                        {selectedTest.data && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-muted-foreground">
                              Response Data
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(selectedTest.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default ApiTestPanel;