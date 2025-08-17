import React, { useState, useEffect } from 'react'

const TrainingPage = ({ apiBase }) => {
  const [activeTab, setActiveTab] = useState('sessions')
  const [trainingSessions, setTrainingSessions] = useState([])
  const [trainingGoals, setTrainingGoals] = useState([])
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedDog, setSelectedDog] = useState('')
  const [availableDogs, setAvailableDogs] = useState([])
  const [formData, setFormData] = useState({
    dog_id: '',
    session_date: '',
    exercise_type: '',
    duration_minutes: 0,
    performance_rating: 3,
    skills_practiced: [],
    improvements_noted: '',
    challenges: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
    loadAvailableDogs()
    loadExercises()
  }, [])

  useEffect(() => {
    if (activeTab === 'sessions') {
      loadTrainingSessions()
    } else if (activeTab === 'goals') {
      loadTrainingGoals()
    }
  }, [activeTab, selectedDog])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([
      loadTrainingSessions(),
      loadTrainingGoals()
    ])
    setLoading(false)
  }

  const loadTrainingSessions = async () => {
    try {
      const url = selectedDog 
        ? `${apiBase}/api/training/sessions?dog_id=${selectedDog}`
        : `${apiBase}/api/training/sessions`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      const data = await response.json()
      if (data.success) {
        setTrainingSessions(data.data)
      }
    } catch (error) {
      console.error('Failed to load training sessions:', error)
    }
  }

  const loadTrainingGoals = async () => {
    try {
      const url = selectedDog 
        ? `${apiBase}/api/training/goals?dog_id=${selectedDog}`
        : `${apiBase}/api/training/goals`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      const data = await response.json()
      if (data.success) {
        setTrainingGoals(data.data)
      }
    } catch (error) {
      console.error('Failed to load training goals:', error)
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

  const loadExercises = async () => {
    try {
      const response = await fetch(`${apiBase}/api/training/exercises`)
      const data = await response.json()
      if (data.success) {
        setExercises(data.data.exercises)
      }
    } catch (error) {
      console.error('Failed to load exercises:', error)
    }
  }

  const handleCreateSession = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`${apiBase}/api/training/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      if (data.success) {
        setTrainingSessions([data.data, ...trainingSessions])
        setShowCreateForm(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to create training session:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      dog_id: '',
      session_date: '',
      exercise_type: '',
      duration_minutes: 0,
      performance_rating: 3,
      skills_practiced: [],
      improvements_noted: '',
      challenges: '',
      notes: ''
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

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-yellow-500'
    if (progress >= 30) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading training data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-hunta-green">🏋️ Training Center</h1>
          <p className="text-gray-600">Track your dogs' training progress and goals</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          + Log Training Session
        </button>
      </div>

      {/* Dog Filter */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <label className="font-medium text-gray-700">Filter by Dog:</label>
          <select
            value={selectedDog}
            onChange={(e) => setSelectedDog(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hunta-green focus:border-transparent"
          >
            <option value="">All Dogs</option>
            {availableDogs.map(dog => (
              <option key={dog.id} value={dog.id}>
                {dog.name} - {dog.breed}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`pb-2 px-4 font-medium border-b-2 transition-colors ${
            activeTab === 'sessions'
              ? 'border-hunta-green text-hunta-green'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Training Sessions
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`pb-2 px-4 font-medium border-b-2 transition-colors ${
            activeTab === 'goals'
              ? 'border-hunta-green text-hunta-green'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Training Goals
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`pb-2 px-4 font-medium border-b-2 transition-colors ${
            activeTab === 'exercises'
              ? 'border-hunta-green text-hunta-green'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Exercise Library
        </button>
      </div>

      {/* Create Session Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Log Training Session</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dog
                  </label>
                  <select
                    value={formData.dog_id}
                    onChange={(e) => setFormData({...formData, dog_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hunta-green focus:border-transparent"
                    required
                  >
                    <option value="">Select Dog</option>
                    {availableDogs.map(dog => (
                      <option key={dog.id} value={dog.id}>
                        {dog.name} - {dog.breed}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Date
                  </label>
                  <input
                    type="date"
                    value={formData.session_date}
                    onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hunta-green focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exercise Type
                  </label>
                  <select
                    value={formData.exercise_type}
                    onChange={(e) => setFormData({...formData, exercise_type: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hunta-green focus:border-transparent"
                    required
                  >
                    <option value="">Select Exercise</option>
                    <option value="pointing_drill">Pointing Drill</option>
                    <option value="retrieve_training">Retrieve Training</option>
                    <option value="water_work">Water Work</option>
                    <option value="steadiness_training">Steadiness Training</option>
                    <option value="obedience">Obedience</option>
                    <option value="field_work">Field Work</option>
                    <option value="other">Other</option>
                  </select>
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
                  Performance Rating (1-5)
                </label>
                <select
                  value={formData.performance_rating}
                  onChange={(e) => setFormData({...formData, performance_rating: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hunta-green focus:border-transparent"
                >
                  <option value={1}>1 - Poor</option>
                  <option value={2}>2 - Below Average</option>
                  <option value={3}>3 - Average</option>
                  <option value={4}>4 - Good</option>
                  <option value={5}>5 - Excellent</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Improvements Noted
                  </label>
                  <textarea
                    value={formData.improvements_noted}
                    onChange={(e) => setFormData({...formData, improvements_noted: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hunta-green focus:border-transparent"
                    rows="3"
                    placeholder="What improvements did you see?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Challenges
                  </label>
                  <textarea
                    value={formData.challenges}
                    onChange={(e) => setFormData({...formData, challenges: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-hunta-green focus:border-transparent"
                    rows="3"
                    placeholder="What challenges did you encounter?"
                  />
                </div>
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
                  placeholder="Additional notes about the session..."
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
                  Log Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {trainingSessions.length === 0 ? (
            <div className="card text-center py-8">
              <div className="text-4xl mb-4">🏋️</div>
              <h3 className="text-lg font-semibold mb-2">No Training Sessions Yet</h3>
              <p className="text-gray-600 mb-4">Start logging your training sessions!</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                Log First Session
              </button>
            </div>
          ) : (
            trainingSessions.map(session => (
              <div key={session.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-hunta-green">
                      {session.dog_name} - {session.exercise_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    <p className="text-gray-600">
                      {new Date(session.session_date).toLocaleDateString()}
                      {session.duration_minutes > 0 && ` • ${formatDuration(session.duration_minutes)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-500 text-lg">
                      {getRatingStars(session.performance_rating)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {session.performance_rating}/5 performance
                    </div>
                  </div>
                </div>

                {session.skills_practiced && session.skills_practiced.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-1">Skills Practiced</div>
                    <div className="flex flex-wrap gap-2">
                      {session.skills_practiced.map((skill, index) => (
                        <span key={index} className="bg-hunta-green/10 text-hunta-green px-2 py-1 rounded-full text-xs">
                          {skill.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {session.improvements_noted && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Improvements</div>
                      <div className="text-gray-600 text-sm">{session.improvements_noted}</div>
                    </div>
                  )}
                  
                  {session.challenges && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Challenges</div>
                      <div className="text-gray-600 text-sm">{session.challenges}</div>
                    </div>
                  )}
                </div>

                {session.notes && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Notes</div>
                    <p className="text-gray-600 text-sm">{session.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="space-y-4">
          {trainingGoals.length === 0 ? (
            <div className="card text-center py-8">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-2">No Training Goals Set</h3>
              <p className="text-gray-600 mb-4">Set training goals to track progress!</p>
            </div>
          ) : (
            trainingGoals.map(goal => (
              <div key={goal.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-hunta-green">
                      {goal.dog_name} - {goal.skill_category}
                    </h3>
                    <p className="text-gray-600">{goal.goal_description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-hunta-green">
                      {goal.current_progress}%
                    </div>
                    <div className="text-sm text-gray-500">Progress</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{goal.current_progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getProgressColor(goal.current_progress)}`}
                      style={{ width: `${goal.current_progress}%` }}
                    />
                  </div>
                </div>

                {goal.target_date && (
                  <div className="text-sm text-gray-600 mb-4">
                    Target Date: {new Date(goal.target_date).toLocaleDateString()}
                  </div>
                )}

                {goal.milestones && goal.milestones.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Milestones</div>
                    <div className="space-y-2">
                      {goal.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            milestone.completed 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-300'
                          }`}>
                            {milestone.completed && '✓'}
                          </div>
                          <span className={milestone.completed ? 'line-through text-gray-500' : ''}>
                            {milestone.description}
                          </span>
                          {milestone.completed && milestone.date_completed && (
                            <span className="text-gray-400 text-xs">
                              {new Date(milestone.date_completed).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'exercises' && (
        <div className="space-y-4">
          {exercises.length === 0 ? (
            <div className="card text-center py-8">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-semibold mb-2">Loading Exercise Library...</h3>
            </div>
          ) : (
            exercises.map(exercise => (
              <div key={exercise.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-hunta-green">{exercise.name}</h3>
                    <div className="flex space-x-4 text-sm text-gray-600">
                      <span>Category: {exercise.category}</span>
                      <span>Level: {exercise.skill_level}</span>
                      <span>Duration: {exercise.duration_minutes}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{exercise.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Equipment Needed</div>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {exercise.equipment_needed.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Success Criteria</div>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {exercise.success_criteria.map((criteria, index) => (
                        <li key={index}>{criteria}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Steps</div>
                  <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                    {exercise.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>

                {exercise.common_mistakes && exercise.common_mistakes.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Common Mistakes</div>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {exercise.common_mistakes.map((mistake, index) => (
                        <li key={index}>{mistake}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default TrainingPage