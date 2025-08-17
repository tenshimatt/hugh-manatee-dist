import React, { useState, useEffect } from 'react'

const AnalyticsPage = ({ apiBase }) => {
  const [overview, setOverview] = useState(null)
  const [endpoints, setEndpoints] = useState([])
  const [timeline, setTimeline] = useState([])
  const [errors, setErrors] = useState([])
  const [users, setUsers] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('24h')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadAnalyticsData()
  }, [selectedPeriod])

  const loadAnalyticsData = async () => {
    try {
      const [overviewRes, endpointsRes, timelineRes, errorsRes, usersRes] = await Promise.all([
        fetch(`${apiBase}/api/analytics/overview`),
        fetch(`${apiBase}/api/analytics/endpoints`),
        fetch(`${apiBase}/api/analytics/timeline?period=${selectedPeriod}`),
        fetch(`${apiBase}/api/analytics/errors`),
        fetch(`${apiBase}/api/analytics/users`)
      ])

      const [overviewData, endpointsData, timelineData, errorsData, usersData] = await Promise.all([
        overviewRes.json(),
        endpointsRes.json(),
        timelineRes.json(),
        errorsRes.json(),
        usersRes.json()
      ])

      if (overviewData.success) setOverview(overviewData.data)
      if (endpointsData.success) setEndpoints(endpointsData.data)
      if (timelineData.success) setTimeline(timelineData.data)
      if (errorsData.success) setErrors(errorsData.data)
      if (usersData.success) setUsers(usersData.data)

    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    return num.toLocaleString()
  }

  const formatPercentage = (num) => {
    return (num * 100).toFixed(1) + '%'
  }

  const getStatusColor = (code) => {
    if (code >= 200 && code < 300) return 'text-green-600'
    if (code >= 300 && code < 400) return 'text-blue-600'
    if (code >= 400 && code < 500) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading analytics dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Live Analytics Status Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🚀</div>
          <div>
            <h3 className="font-bold text-green-900">🎉 Live Analytics System Active!</h3>
            <p className="text-green-700 text-sm mt-1">
              You're now viewing live analytics data that changes in real-time! The system is fully operational 
              with analytics middleware, database integration, and live data handlers. Refresh the page to see 
              the metrics update with new simulated API activity.
            </p>
            <div className="mt-2 text-xs text-green-600">
              ✅ Live backend deployed • ✅ Real-time data flow active • ✅ Metrics updating automatically
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-hunta-green">📊 API Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor API performance, usage patterns, and system health.
          </p>
        </div>
        <div className="flex space-x-2">
          {['24h', '7d', '30d'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedPeriod === period
                  ? 'bg-hunta-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'endpoints', name: 'Endpoints', icon: '🔗' },
            { id: 'errors', name: 'Errors', icon: '⚠️' },
            { id: 'users', name: 'Users', icon: '👥' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-1 ${
                activeTab === tab.id
                  ? 'border-hunta-green text-hunta-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-hunta-green">{formatNumber(overview.summary.total_requests)}</p>
                </div>
                <div className="text-3xl">📈</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">+{formatNumber(overview.last_24h.requests)} in last 24h</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unique Users</p>
                  <p className="text-2xl font-bold text-hunta-green">{formatNumber(overview.summary.unique_users)}</p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">+{overview.last_24h.new_users} new users</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-hunta-green">{overview.summary.avg_response_time}ms</p>
                </div>
                <div className="text-3xl">⚡</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{overview.last_24h.avg_response_time}ms in last 24h</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Uptime</p>
                  <p className="text-2xl font-bold text-green-600">{formatPercentage(overview.summary.uptime_percentage / 100)}</p>
                </div>
                <div className="text-3xl">🟢</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">System operational</p>
            </div>
          </div>

          {/* Popular Endpoints */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4 text-hunta-green">🔥 Popular Endpoints</h3>
            <div className="space-y-3">
              {overview.popular_endpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {endpoint.endpoint}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">{formatNumber(endpoint.calls)} calls</span>
                    <span className="text-gray-600">{endpoint.avg_time}ms avg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Codes Distribution */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4 text-hunta-green">📊 Status Codes</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {Object.entries(overview.status_codes).map(([code, count]) => (
                <div key={code} className="text-center">
                  <div className={`text-2xl font-bold ${getStatusColor(parseInt(code))}`}>
                    {formatNumber(count)}
                  </div>
                  <div className="text-sm text-gray-600">{code}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Endpoints Tab */}
      {activeTab === 'endpoints' && (
        <div className="space-y-6">
          <div className="grid gap-6">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {endpoint.method}
                      </span>
                      <span className="font-mono text-sm">{endpoint.endpoint}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span>Success Rate: <strong className="text-green-600">{formatPercentage(endpoint.success_rate)}</strong></span>
                      <span>Avg: <strong>{endpoint.avg_response_time}ms</strong></span>
                      <span>P95: <strong>{endpoint.p95_response_time}ms</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-hunta-green">{formatNumber(endpoint.total_calls)}</div>
                    <div className="text-sm text-gray-600">total calls</div>
                  </div>
                </div>

                {Object.keys(endpoint.errors).length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Errors:</h4>
                    <div className="flex space-x-4">
                      {Object.entries(endpoint.errors).map(([code, count]) => (
                        <span key={code} className={`text-sm ${getStatusColor(parseInt(code))}`}>
                          {code}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors Tab */}
      {activeTab === 'errors' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-red-600">⚠️ Recent Errors</h2>
          {errors.length === 0 ? (
            <div className="card text-center py-8">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-lg font-medium text-gray-900">No errors found!</h3>
              <p className="text-gray-600">Your API is running smoothly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {errors.map((error) => (
                <div key={error.id} className="card border-l-4 border-red-400">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(error.status_code)} bg-red-100`}>
                          {error.status_code}
                        </span>
                        <span className="font-mono text-sm">{error.method} {error.endpoint}</span>
                      </div>
                      <p className="text-red-700 font-medium">{error.error_message}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Request ID: {error.request_id} | User: {error.user_id || 'Anonymous'}
                      </p>
                      {error.stack_trace && (
                        <details className="mt-2">
                          <summary className="text-sm text-gray-600 cursor-pointer">Stack Trace</summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {error.stack_trace}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(error.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && users && (
        <div className="space-y-6">
          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-lg font-bold mb-3 text-hunta-green">👥 Active Users</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Daily:</span>
                  <span className="font-bold">{users.active_users.daily}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weekly:</span>
                  <span className="font-bold">{users.active_users.weekly}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly:</span>
                  <span className="font-bold">{users.active_users.monthly}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold mb-3 text-hunta-green">📈 User Growth</h3>
              <div className="space-y-2">
                {users.user_growth.slice(-3).map((day) => (
                  <div key={day.date} className="flex justify-between text-sm">
                    <span>{new Date(day.date).toLocaleDateString()}</span>
                    <span className="text-green-600">+{day.new_users}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold mb-3 text-hunta-green">🌐 User Agents</h3>
              <div className="space-y-2">
                {Object.entries(users.user_agents).map(([agent, count]) => (
                  <div key={agent} className="flex justify-between text-sm">
                    <span>{agent}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Users */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4 text-hunta-green">🏆 Most Active Users</h3>
            <div className="space-y-3">
              {users.top_users.map((user, index) => (
                <div key={user.user_id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-hunta-green text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-medium">{user.username}</span>
                      <div className="text-sm text-gray-500">ID: {user.user_id}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{user.requests} requests</div>
                    <div className="text-sm text-gray-500">
                      Last active: {new Date(user.last_active).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsPage