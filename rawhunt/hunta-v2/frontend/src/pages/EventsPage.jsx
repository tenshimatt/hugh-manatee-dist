import React, { useState, useEffect } from 'react'

const EventsPage = ({ apiBase }) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'trial',
    event_date: '',
    location: '',
    entry_fee: '',
    max_participants: ''
  })

  useEffect(() => {
    loadEvents()
  }, [apiBase])

  const loadEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${apiBase}/api/events/list`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setEvents(data.data || [])
      } else {
        throw new Error(data.error || 'API returned error')
      }
    } catch (err) {
      console.error('Failed to load events:', err)
      setError(err.message)
      // Set demo events as fallback
      setEvents([
        {
          id: 'demo1',
          title: 'Demo Field Trial',
          description: 'Demo event - API unavailable',
          event_type: 'trial',
          event_date: '2025-09-15',
          location: 'Demo Location, GA',
          entry_fee: 45,
          max_participants: 50,
          organizer_name: 'Demo Organizer'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleAddEvent = async (e) => {
    e.preventDefault()
    setAddLoading(true)
    
    try {
      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        eventType: newEvent.event_type,
        eventDate: newEvent.event_date,
        location: newEvent.location,
        entryFee: parseFloat(newEvent.entry_fee) || 0,
        maxParticipants: parseInt(newEvent.max_participants) || null
      }
      
      const response = await fetch(`${apiBase}/api/events/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify(eventData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Add the new event to the list
        setEvents([...events, data.data])
        // Reset form
        setNewEvent({
          title: '',
          description: '',
          event_type: 'trial',
          event_date: '',
          location: '',
          entry_fee: '',
          max_participants: ''
        })
        setShowAddForm(false)
        alert('Event created successfully! It will appear in the events list.')
        // Refresh events list to ensure consistency
        loadEvents()
      } else {
        throw new Error(data.error || 'Failed to add event')
      }
    } catch (err) {
      console.error('Failed to add event:', err)
      alert('Error creating event: ' + err.message + '\n\nPlease check your internet connection and try again.')
    } finally {
      setAddLoading(false)
    }
  }

  const getEventTypeColor = (type) => {
    const colors = {
      'trial': 'bg-blue-100 text-blue-800',
      'training': 'bg-green-100 text-green-800', 
      'competition': 'bg-purple-100 text-purple-800',
      'educational': 'bg-yellow-100 text-yellow-800',
      'workshop': 'bg-red-100 text-red-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getEventTypeIcon = (type) => {
    const icons = {
      'trial': '🏆',
      'training': '🎯',
      'competition': '🥇',
      'educational': '📚',
      'workshop': '🔧'
    }
    return icons[type] || '📅'
  }

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true
    return event.event_type === filter
  })

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const handleViewDetails = (event) => {
    // For now, show event details in an alert
    // Later this could open a modal or navigate to a detail page
    const details = `
Event: ${event.title}
Date: ${formatDate(event.event_date)}
Location: ${event.location}
Type: ${event.event_type}
Fee: ${event.entry_fee > 0 ? `$${event.entry_fee}` : 'Free'}
${event.max_participants ? `Max Participants: ${event.max_participants}` : ''}
${event.description ? `Description: ${event.description}` : ''}
Organizer: ${event.organizer_name || 'Event Organizer'}
    `
    alert(details.trim())
  }

  const handleRegister = (event) => {
    // For now, show registration info in an alert
    // Later this could open a registration form or redirect to payment
    const registrationInfo = `
Registration for: ${event.title}
Date: ${formatDate(event.event_date)}
Location: ${event.location}
Fee: ${event.entry_fee > 0 ? `$${event.entry_fee}` : 'Free'}

To complete registration:
1. Contact the organizer: ${event.organizer_name || 'Event Organizer'}
2. Confirm availability and requirements
3. Submit payment if required

This feature will be enhanced with online registration soon!
    `
    alert(registrationInfo.trim())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading events...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-hunta-green">🏆 Events & Trials</h1>
          <p className="text-gray-600 mt-2">
            Find field trials, training workshops, and competitions near you.
          </p>
          {error && (
            <p className="text-error text-sm mt-2">
              ⚠️ API Error: {error} (Showing demo data)
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          Create Event
        </button>
      </div>

      {/* Add Event Form */}
      {showAddForm && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-hunta-green">Create New Event</h3>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                  placeholder="e.g., Spring Field Trial"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  value={newEvent.event_type}
                  onChange={(e) => setNewEvent({...newEvent, event_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                >
                  <option value="trial">Field Trial</option>
                  <option value="training">Training</option>
                  <option value="competition">Competition</option>
                  <option value="educational">Educational</option>
                  <option value="workshop">Workshop</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  required
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                  placeholder="e.g., Pine Ridge Preserve, Georgia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newEvent.entry_fee}
                  onChange={(e) => setNewEvent({...newEvent, entry_fee: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                <input
                  type="number"
                  min="1"
                  value={newEvent.max_participants}
                  onChange={(e) => setNewEvent({...newEvent, max_participants: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                  placeholder="50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green resize-vertical"
                placeholder="Describe the event, requirements, and what participants can expect..."
              />
            </div>
            <div className="flex space-x-3">
              <button 
                type="submit" 
                disabled={addLoading}
                className={`btn-primary ${addLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {addLoading ? 'Creating...' : 'Create Event'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {['all', 'trial', 'training', 'competition', 'educational', 'workshop'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === filterType 
                ? 'bg-hunta-green text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterType === 'all' ? 'All Events' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No events found' : `No ${filter} events found`}
          </h3>
          <p className="text-gray-600 mb-4">
            Check back soon or submit your own event to get the community involved.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Create Event
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {getEventTypeIcon(event.event_type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-hunta-green mb-1">
                      {event.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventTypeColor(event.event_type)}`}>
                      {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="text-right text-gray-600 text-sm">
                  {formatDate(event.event_date)}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {event.location && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">📍</span>
                    <span>{event.location}</span>
                  </div>
                )}

                {event.description && (
                  <p className="text-gray-700 leading-relaxed">
                    {event.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {event.max_participants && (
                    <div className="flex items-center">
                      <span className="mr-1">👥</span>
                      <span>Max {event.max_participants} participants</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="mr-1">💰</span>
                    <span>{event.entry_fee > 0 ? `$${event.entry_fee}` : 'Free'}</span>
                  </div>
                  {event.contact_info && (
                    <div className="flex items-center">
                      <span className="mr-1">📧</span>
                      <span>{event.contact_info}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Organized by: <strong>{event.organizer_name || 'Event Organizer'}</strong>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleViewDetails(event)}
                    className="px-3 py-2 bg-hunta-green text-white text-sm rounded hover:bg-hunta-green-light"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleRegister(event)}
                    className="px-3 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50"
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {events.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">{events.length}</div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">
              {events.filter(e => e.event_type === 'trial').length}
            </div>
            <div className="text-sm text-gray-600">Field Trials</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">
              {events.filter(e => e.event_type === 'training').length}
            </div>
            <div className="text-sm text-gray-600">Training Events</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">
              {events.filter(e => e.entry_fee === 0).length}
            </div>
            <div className="text-sm text-gray-600">Free Events</div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={loadEvents}
          disabled={loading}
          className={`px-4 py-2 border border-gray-300 rounded-md text-sm ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
        >
          {loading ? 'Loading...' : 'Refresh Events'}
        </button>
      </div>
    </div>
  )
}

export default EventsPage