'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navigation } from '@/components/layout/navigation'

interface HealthStatus {
  status: string
  timestamp: string
  uptime: number
  environment: string
  version: string
  services: {
    database: {
      status: string
      latency: number
      connections?: {
        total: number
        idle: number
        waiting: number
      }
    }
    redis: {
      status: string
      latency: number
    }
  }
  system: {
    memory: {
      used: string
      total: string
      percentage: string
    }
    cpu: {
      usage: string
    }
  }
}

export default function DemoPage() {
  const [backendStatus, setBackendStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBackendHealth = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:8000/health')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setBackendStatus(data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch backend health:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchApiInfo = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1')
      const data = await response.json()
      console.log('Backend API Info:', data)
    } catch (err) {
      console.error('Failed to fetch API info:', err)
    }
  }

  useEffect(() => {
    fetchBackendHealth()
    fetchApiInfo()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'unhealthy': return 'text-red-600'
      case 'connected': return 'text-green-600'
      case 'disconnected': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto p-8 space-y-8 pt-20">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">RAWGLE Backend Demo</h1>
        <p className="text-xl text-muted-foreground">
          Testing connection between Next.js frontend and Node.js backend
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Backend Status Card */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Backend Health Status
              <Button 
                onClick={fetchBackendHealth} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </CardTitle>
            <CardDescription>
              Real-time backend API health monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-red-600 space-y-2">
                <p className="font-semibold">❌ Backend Connection Failed</p>
                <p className="text-sm">{error}</p>
                <p className="text-sm text-muted-foreground">
                  Make sure the backend is running on http://localhost:8000
                </p>
              </div>
            ) : backendStatus ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium">Overall Status</p>
                    <p className={`text-lg font-bold ${getStatusColor(backendStatus.status)}`}>
                      {backendStatus.status.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Environment</p>
                    <p className="text-lg">{backendStatus.environment}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Version</p>
                    <p className="text-lg">{backendStatus.version}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Uptime</p>
                    <p className="text-lg">{backendStatus.uptime}s</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  {/* Database Status */}
                  <div className="space-y-2">
                    <h4 className="font-semibold">Database (PostgreSQL)</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={getStatusColor(backendStatus.services.database.status)}>
                          {backendStatus.services.database.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Latency:</span>
                        <span>{backendStatus.services.database.latency}ms</span>
                      </div>
                      {backendStatus.services.database.connections && (
                        <>
                          <div className="flex justify-between">
                            <span>Total Connections:</span>
                            <span>{backendStatus.services.database.connections.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Idle:</span>
                            <span>{backendStatus.services.database.connections.idle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Waiting:</span>
                            <span>{backendStatus.services.database.connections.waiting}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Redis Status */}
                  <div className="space-y-2">
                    <h4 className="font-semibold">Redis Cache</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={getStatusColor(backendStatus.services.redis.status)}>
                          {backendStatus.services.redis.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Latency:</span>
                        <span>{backendStatus.services.redis.latency}ms</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">System Resources</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Memory Used:</span>
                        <span>{backendStatus.system.memory.used}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Memory Total:</span>
                        <span>{backendStatus.system.memory.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Memory %:</span>
                        <span>{backendStatus.system.memory.percentage}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>CPU Usage:</span>
                        <span>{backendStatus.system.cpu.usage}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p>Loading backend status...</p>
            )}
          </CardContent>
        </Card>

        {/* API Endpoints Card */}
        <Card>
          <CardHeader>
            <CardTitle>Available Endpoints</CardTitle>
            <CardDescription>Backend API routes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm space-y-1">
              <a 
                href="http://localhost:8000/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-2 bg-muted rounded hover:bg-muted/80 transition-colors"
              >
                GET /
              </a>
              <a 
                href="http://localhost:8000/health" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-2 bg-muted rounded hover:bg-muted/80 transition-colors"
              >
                GET /health
              </a>
              <a 
                href="http://localhost:8000/health/detailed" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-2 bg-muted rounded hover:bg-muted/80 transition-colors"
              >
                GET /health/detailed
              </a>
              <a 
                href="http://localhost:8000/api/v1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-2 bg-muted rounded hover:bg-muted/80 transition-colors"
              >
                GET /api/v1
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Frontend Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Frontend Info</CardTitle>
            <CardDescription>Next.js application details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Framework:</span>
              <span>Next.js 14</span>
            </div>
            <div className="flex justify-between">
              <span>UI Library:</span>
              <span>Radix UI</span>
            </div>
            <div className="flex justify-between">
              <span>Styling:</span>
              <span>Tailwind CSS</span>
            </div>
            <div className="flex justify-between">
              <span>State Management:</span>
              <span>TanStack Query</span>
            </div>
            <div className="flex justify-between">
              <span>Auth:</span>
              <span>Clerk</span>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
            <CardDescription>Frontend ↔ Backend communication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Backend API:</span>
                <span className={`text-sm font-medium ${error ? 'text-red-600' : 'text-green-600'}`}>
                  {error ? '❌ Disconnected' : '✅ Connected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database:</span>
                <span className={`text-sm font-medium ${
                  backendStatus?.services.database.status === 'connected' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {backendStatus?.services.database.status === 'connected' ? '✅ Connected' : '❌ Disconnected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Redis Cache:</span>
                <span className={`text-sm font-medium ${
                  backendStatus?.services.redis.status === 'connected' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {backendStatus?.services.redis.status === 'connected' ? '✅ Connected' : '⚠️ Degraded'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-muted-foreground">
        <p className="text-sm">
          Last updated: {backendStatus?.timestamp ? new Date(backendStatus.timestamp).toLocaleString() : 'Never'}
        </p>
        </div>
      </div>
    </>
  )
}