import React, { useState, useEffect } from 'react'

const HuntLogsPage = ({ apiBase }) => {
  const [hunts, setHunts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    hunt_date: '',
    location: '',
    dogs_present: [],
    duration_minutes: 0,
    success_rating: 3,
    notes: '',
    game_harvested: [],
    weather_conditions: {}
  })
  const [availableDogs, setAvailableDogs] = useState([])

  useEffect(() => {
    loadHunts()
    loadAvailableDogs()
  }, [])

  const loadHunts = async () => {
    try {
      const response = await fetch(`${apiBase}/api/hunts/list`, {
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      const data = await response.json()
      if (data.success) {
        setHunts(data.data)
      }
    } catch (error) {
      console.error('Failed to load hunts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableDogs = async () => {
    try {
      const response = await fetch(`${apiBase}/api/dogs/list`, {
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      const data = await response.json()
      if (data.success) {
        setAvailableDogs(data.data)
      }
    } catch (error) {
      console.error('Failed to load dogs:', error)
    }
  }

  const handleCreateHunt = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`${apiBase}/api/hunts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      if (data.success) {
        setHunts([data.data, ...hunts])
        setShowCreateForm(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to create hunt:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      hunt_date: '',
      location: '',
      dogs_present: [],
      duration_minutes: 0,
      success_rating: 3,
      notes: '',
      game_harvested: [],
      weather_conditions: {}
    })
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getRatingStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const formatGameHarvest = (gameArray) => {
    if (!gameArray || gameArray.length === 0) return 'No game harvested'
    return gameArray.map(game => `${game.count} ${game.species}`).join(', ')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading hunt logs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-hunta-green">🎯 Hunt Logs</h1>
          <p className="text-gray-600">Track your hunting expeditions and performance</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          + Log New Hunt
        </button>
      </div>

      {/* Create Hunt Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Log New Hunt</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHunt} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hunt Date
                  </label>
                  <input
                    type="date"
                    value={formData.hunt_date}
                    onChange={(e) => setFormData({...formData, hunt_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hunta-green focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hunta-green focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hunta-green focus:border-transparent"
                  placeholder="e.g., Pine Ridge Preserve, GA"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dogs Present
                </label>
                <div className="space-y-2">
                  {availableDogs.map(dog => (
                    <label key={dog.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.dogs_present.includes(dog.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              dogs_present: [...formData.dogs_present, dog.name]
                            })
                          } else {
                            setFormData({
                              ...formData,
                              dogs_present: formData.dogs_present.filter(name => name !== dog.name)
                            })
                          }
                        }}
                        className="mr-2"
                      />
                      {dog.name} - {dog.breed}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Success Rating (1-5)
                </label>
                <select
                  value={formData.success_rating}
                  onChange={(e) => setFormData({...formData, success_rating: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hunta-green focus:border-transparent"
                >
                  <option value={1}>1 - Poor</option>
                  <option value={2}>2 - Below Average</option>
                  <option value={3}>3 - Average</option>
                  <option value={4}>4 - Good</option>
                  <option value={5}>5 - Excellent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hunta-green focus:border-transparent"
                  rows="3"
                  placeholder="Describe how the hunt went, dog performance, conditions, etc."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Log Hunt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hunt Logs List */}
      <div className="space-y-4">
        {hunts.length === 0 ? (
          <div className="card text-center py-8">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">No Hunt Logs Yet</h3>
            <p className="text-gray-600 mb-4">Start tracking your hunting adventures!</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              Log Your First Hunt
            </button>
          </div>
        ) : (
          hunts.map(hunt => (
            <div key={hunt.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-hunta-green">
                    {hunt.location}
                  </h3>
                  <p className="text-gray-600">
                    {new Date(hunt.hunt_date).toLocaleDateString()} 
                    {hunt.duration_minutes > 0 && ` • ${formatDuration(hunt.duration_minutes)}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-yellow-500 text-lg">
                    {getRatingStars(hunt.success_rating)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {hunt.success_rating}/5 rating
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Dogs Present</div>
                  <div className="text-gray-600">
                    {hunt.dogs_present && hunt.dogs_present.length > 0 
                      ? hunt.dogs_present.join(', ') 
                      : 'None specified'
                    }
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700">Game Harvested</div>
                  <div className="text-gray-600">
                    {formatGameHarvest(hunt.game_harvested)}
                  </div>
                </div>
              </div>

              {hunt.weather_conditions && Object.keys(hunt.weather_conditions).length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-1">Weather Conditions</div>
                  <div className="text-gray-600 text-sm">
                    {hunt.weather_conditions.temperature && `${hunt.weather_conditions.temperature}°F`}
                    {hunt.weather_conditions.wind_speed && `, Wind: ${hunt.weather_conditions.wind_speed}mph`}
                    {hunt.weather_conditions.conditions && `, ${hunt.weather_conditions.conditions}`}
                  </div>
                </div>
              )}

              {hunt.gps_route && hunt.gps_route.distance_miles && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700">Route Info</div>
                  <div className="text-gray-600 text-sm">
                    Distance: {hunt.gps_route.distance_miles} miles
                    {hunt.gps_route.waypoints && ` • ${hunt.gps_route.waypoints.length} GPS points recorded`}
                  </div>
                </div>
              )}

              {hunt.notes && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Notes</div>
                  <p className="text-gray-600 text-sm">{hunt.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default HuntLogsPage