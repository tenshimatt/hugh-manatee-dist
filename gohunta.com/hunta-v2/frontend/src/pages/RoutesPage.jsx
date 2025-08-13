import React, { useState, useEffect } from 'react'

const RoutesPage = ({ apiBase }) => {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [newRoute, setNewRoute] = useState({
    name: '',
    location: '',
    difficulty: 'moderate',
    terrain_type: 'mixed',
    game_type: 'upland',
    description: '',
    notes: ''
  })

  useEffect(() => {
    loadRoutes()
  }, [])

  const loadRoutes = async () => {
    try {
      const response = await fetch(`${apiBase}/api/routes/list`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRoutes(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to load routes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoute = async (e) => {
    e.preventDefault()
    try {
      const url = editingRoute 
        ? `${apiBase}/api/routes/update/${editingRoute.id}`
        : `${apiBase}/api/routes/create`
      
      const method = editingRoute ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRoute)
      })
      
      if (response.ok) {
        await loadRoutes()
        setShowCreateForm(false)
        setEditingRoute(null)
        setNewRoute({
          name: '',
          location: '',
          difficulty: 'moderate',
          terrain_type: 'mixed',
          game_type: 'upland',
          description: '',
          notes: ''
        })
      } else {
        console.error('Failed to save route:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to save route:', error)
    }
  }

  const handleViewMap = (route) => {
    // Open map view for this route
    alert(`Opening map view for "${route.name}"\n\nLocation: ${route.location}\nTerrain: ${route.terrain_type}\nDifficulty: ${route.difficulty}\n\nMap integration coming soon!`)
  }

  const handleEditRoute = (route) => {
    setEditingRoute(route)
    setNewRoute({
      name: route.name,
      location: route.location,
      difficulty: route.difficulty,
      terrain_type: route.terrain_type,
      game_type: route.game_type,
      description: route.description || '',
      notes: route.notes || ''
    })
    setShowCreateForm(true)
  }

  const handleShareRoute = (route) => {
    // Generate shareable link or export route data
    const routeData = {
      name: route.name,
      location: route.location,
      difficulty: route.difficulty,
      terrain_type: route.terrain_type,
      game_type: route.game_type,
      description: route.description
    }
    
    if (navigator.share) {
      navigator.share({
        title: `Hunt Route: ${route.name}`,
        text: `Check out this hunting route: ${route.name} at ${route.location}`,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `Hunt Route: ${route.name}\nLocation: ${route.location}\nDifficulty: ${route.difficulty}\nTerrain: ${route.terrain_type}\nGame Type: ${route.game_type}\n\n${route.description || 'No description available'}`
      )
      alert('Route details copied to clipboard!')
    }
  }

  const handleGPSTracker = () => {
    alert('GPS Tracker\n\nThis feature will allow you to:\n• Record new routes while hunting\n• Track waypoints and landmarks\n• Save GPS coordinates\n\nComing soon!')
  }

  const handleOfflineMaps = () => {
    alert('Offline Maps\n\nThis feature will allow you to:\n• Download maps for offline use\n• View terrain and satellite imagery\n• Access maps without cell service\n\nComing soon!')
  }

  const handleShareRoutes = () => {
    alert('Share Routes\n\nThis feature will allow you to:\n• Share routes with trusted hunting partners\n• Create group hunts\n• Export route data\n\nComing soon!')
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'moderate': return 'bg-yellow-100 text-yellow-800'
      case 'difficult': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '🟢'
      case 'moderate': return '🟡'
      case 'difficult': return '🔴'
      default: return '⚪'
    }
  }

  const getTerrainIcon = (terrain) => {
    switch (terrain) {
      case 'forest': return '🌲'
      case 'field': return '🌾'
      case 'marsh': return '🏞️'
      case 'hills': return '⛰️'
      case 'mixed': return '🗺️'
      default: return '🗺️'
    }
  }

  const getGameTypeIcon = (gameType) => {
    switch (gameType) {
      case 'upland': return '🦆'
      case 'waterfowl': return '🦢'
      case 'small_game': return '🐰'
      case 'big_game': return '🦌'
      default: return '🎯'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading hunt routes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-hunta-green">🗺️ Hunt Route Planner</h1>
          <p className="text-gray-600 mt-2">
            Plan and track your hunting routes with GPS precision and offline capabilities.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          Create Route
        </button>
      </div>

      {/* Create Route Form */}
      {showCreateForm && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-hunta-green">{editingRoute ? 'Edit Route' : 'Create New Route'}</h3>
          <form onSubmit={handleCreateRoute} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
                <input
                  type="text"
                  required
                  value={newRoute.name}
                  onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                  placeholder="e.g., North Ridge Trail"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={newRoute.location}
                  onChange={(e) => setNewRoute({...newRoute, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                  placeholder="e.g., State Park, County, State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={newRoute.difficulty}
                  onChange={(e) => setNewRoute({...newRoute, difficulty: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                >
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="difficult">Difficult</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terrain Type</label>
                <select
                  value={newRoute.terrain_type}
                  onChange={(e) => setNewRoute({...newRoute, terrain_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                >
                  <option value="forest">Forest</option>
                  <option value="field">Field</option>
                  <option value="marsh">Marsh</option>
                  <option value="hills">Hills</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Game Type</label>
                <select
                  value={newRoute.game_type}
                  onChange={(e) => setNewRoute({...newRoute, game_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                >
                  <option value="upland">Upland Birds</option>
                  <option value="waterfowl">Waterfowl</option>
                  <option value="small_game">Small Game</option>
                  <option value="big_game">Big Game</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newRoute.description}
                onChange={(e) => setNewRoute({...newRoute, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                placeholder="Describe the route, access points, and what to expect..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={newRoute.notes}
                onChange={(e) => setNewRoute({...newRoute, notes: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                placeholder="Private notes, GPS coordinates, permissions needed..."
              />
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                {editingRoute ? 'Update Route' : 'Create Route'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingRoute(null)
                  setNewRoute({
                    name: '',
                    location: '',
                    difficulty: 'moderate',
                    terrain_type: 'mixed',
                    game_type: 'upland',
                    description: '',
                    notes: ''
                  })
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Routes List */}
      {routes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No routes planned yet</h3>
          <p className="text-gray-600 mb-4">Create your first hunt route to start planning successful outings.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            Create Your First Route
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {routes.map((route) => (
            <div key={route.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-hunta-green mb-1">{route.name}</h3>
                  <div className="flex items-center text-gray-600 text-sm">
                    <span className="mr-2">📍</span>
                    <span>{route.location}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(route.difficulty)}`}>
                  {getDifficultyIcon(route.difficulty)} {route.difficulty}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <span>{getTerrainIcon(route.terrain_type)}</span>
                    <span className="capitalize text-gray-600">{route.terrain_type} terrain</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>{getGameTypeIcon(route.game_type)}</span>
                    <span className="capitalize text-gray-600">{route.game_type.replace('_', ' ')}</span>
                  </div>
                </div>

                {route.description && (
                  <p className="text-gray-700 text-sm">{route.description}</p>
                )}

                {route.distance && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📏</span>
                    <span>{route.distance} miles</span>
                  </div>
                )}

                <div className="flex items-center text-xs text-gray-500">
                  <span className="mr-2">📅</span>
                  <span>Created {new Date(route.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-gray-200">
                <button 
                  onClick={() => handleViewMap(route)}
                  className="flex-1 text-sm px-3 py-2 bg-hunta-green text-white rounded hover:bg-hunta-green-light transition-colors"
                >
                  View Map
                </button>
                <button 
                  onClick={() => handleEditRoute(route)}
                  className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Edit Route
                </button>
                <button 
                  onClick={() => handleShareRoute(route)}
                  className="text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  title="Share Route"
                >
                  📤
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Route Planning Tools */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="text-lg font-bold mb-3 text-blue-800">🛠️ Planning Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleGPSTracker}
            className="p-4 bg-white rounded border hover:shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            <div className="text-2xl mb-2">🛰️</div>
            <div className="font-medium text-gray-900">GPS Tracker</div>
            <div className="text-sm text-gray-600">Record new routes</div>
          </button>
          <button 
            onClick={handleOfflineMaps}
            className="p-4 bg-white rounded border hover:shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            <div className="text-2xl mb-2">📱</div>
            <div className="font-medium text-gray-900">Offline Maps</div>
            <div className="text-sm text-gray-600">Download for field use</div>
          </button>
          <button 
            onClick={handleShareRoutes}
            className="p-4 bg-white rounded border hover:shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            <div className="text-2xl mb-2">🤝</div>
            <div className="font-medium text-gray-900">Share Routes</div>
            <div className="text-sm text-gray-600">With trusted friends</div>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {routes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">{routes.length}</div>
            <div className="text-sm text-gray-600">Total Routes</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">
              {new Set(routes.map(r => r.location)).size}
            </div>
            <div className="text-sm text-gray-600">Locations</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">
              {routes.filter(r => r.difficulty === 'easy').length}
            </div>
            <div className="text-sm text-gray-600">Easy Routes</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">
              {new Set(routes.map(r => r.game_type)).size}
            </div>
            <div className="text-sm text-gray-600">Game Types</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoutesPage