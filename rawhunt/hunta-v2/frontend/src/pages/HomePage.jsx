import React, { useState, useEffect } from 'react'

const HomePage = ({ apiBase }) => {
  const [systemStatus, setSystemStatus] = useState({})
  const [loading, setLoading] = useState(true)
  const [quickStats, setQuickStats] = useState({
    dogs: 0,
    events: 0,
    routes: 0
  })

  useEffect(() => {
    loadSystemStatus()
    loadQuickStats()
  }, [])

  const loadSystemStatus = async () => {
    try {
      const response = await fetch(`${apiBase}/health`)
      const data = await response.json()
      setSystemStatus(data)
    } catch (error) {
      console.error('Failed to load system status:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadQuickStats = async () => {
    try {
      // Load stats from multiple endpoints
      const [dogsRes, eventsRes] = await Promise.all([
        fetch(`${apiBase}/api/dogs/list`),
        fetch(`${apiBase}/api/events/list`)
      ])

      const dogsData = await dogsRes.json()
      const eventsData = await eventsRes.json()

      setQuickStats({
        dogs: dogsData.success ? dogsData.data.length : 0,
        events: eventsData.success ? eventsData.data.length : 0,
        routes: 5 // Demo value
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 hunting-bg rounded-xl text-white">
        <h1 className="text-5xl font-bold mb-4">🎯 HUNTA</h1>
        <p className="text-xl mb-2">Elite Dog Hunting Platform</p>
        <p className="text-white/80 max-w-2xl mx-auto">
          Built for serious hunting dog enthusiasts. Track your pack, plan routes, 
          join events, and connect with the community that understands the lifestyle.
        </p>
        
        {/* System Status */}
        <div className="mt-6 inline-flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          <span className="text-sm">System Online - v{systemStatus.version}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl mb-2">🐕</div>
          <div className="text-2xl font-bold text-hunta-green">{quickStats.dogs}</div>
          <div className="text-gray-600">Demo Dogs</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-2xl font-bold text-hunta-green">{quickStats.events}</div>
          <div className="text-gray-600">Upcoming Events</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">🗺️</div>
          <div className="text-2xl font-bold text-hunta-green">{quickStats.routes}</div>
          <div className="text-gray-600">Hunt Routes</div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card">
          <h3 className="text-xl font-bold mb-3 text-hunta-green">🐕 Pack Management</h3>
          <p className="text-gray-600 mb-4">
            Complete profiles for your hunting dogs. Track training progress, 
            health records, and performance in the field.
          </p>
          <a href="/dogs" className="btn-primary inline-block">View Pack →</a>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-3 text-hunta-green">🏆 Events & Trials</h3>
          <p className="text-gray-600 mb-4">
            Find field trials, training workshops, and competitions. 
            Connect with other hunters and test your dogs' skills.
          </p>
          <a href="/events" className="btn-primary inline-block">Browse Events →</a>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-3 text-hunta-green">🗺️ Route Planning</h3>
          <p className="text-gray-600 mb-4">
            GPS-enabled hunt planning with offline capabilities. 
            Mark productive areas and share routes with trusted friends.
          </p>
          <a href="/routes" className="btn-primary inline-block">Plan Routes →</a>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-3 text-hunta-green">⚡ Gear Reviews</h3>
          <p className="text-gray-600 mb-4">
            Honest reviews from experienced hunters. Find gear that 
            performs when it matters most, from collars to GPS units.
          </p>
          <a href="/gear" className="btn-primary inline-block">Browse Gear →</a>
        </div>
      </div>

      {/* Platform Status */}
      <div className="card bg-green-50 border border-green-200">
        <h3 className="text-lg font-bold mb-3 text-green-800">Platform Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium text-green-700">Backend</div>
            <div className="text-green-600">{systemStatus.database === 'connected' ? '🟢' : '🟡'} {systemStatus.environment}</div>
          </div>
          <div>
            <div className="font-medium text-green-700">API</div>
            <div className="text-green-600">🟢 Operational</div>
          </div>
          <div>
            <div className="font-medium text-green-700">Database</div>
            <div className="text-green-600">{systemStatus.database === 'connected' ? '🟢 Connected' : '🟡 Demo Mode'}</div>
          </div>
          <div>
            <div className="font-medium text-green-700">Cache</div>
            <div className="text-green-600">{systemStatus.cache === 'connected' ? '🟢 Active' : '🟡 Not Configured'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage