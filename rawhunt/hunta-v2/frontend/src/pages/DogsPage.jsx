import React, { useState, useEffect } from 'react'

const DogsPage = ({ apiBase }) => {
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDog, setEditingDog] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [newDog, setNewDog] = useState({
    name: '',
    breed: '',
    age: '',
    trainingLevel: 'basic',
    specialization: 'pointer',
    temperament: ''
  })
  const [editDog, setEditDog] = useState({
    name: '',
    breed: '',
    age: '',
    trainingLevel: 'basic',
    specialization: 'pointer',
    temperament: ''
  })

  useEffect(() => {
    loadDogs()
  }, [])

  const loadDogs = async () => {
    try {
      const response = await fetch(`${apiBase}/api/dogs`, {
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDogs(data.data.dogs || [])
        }
      }
    } catch (error) {
      console.error('Failed to load dogs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDog = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${apiBase}/api/dogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify(newDog)
      })
      
      if (response.ok) {
        await loadDogs()
        setShowAddForm(false)
        setNewDog({
          name: '',
          breed: '',
          age: '',
          trainingLevel: 'basic',
          specialization: 'pointer',
          temperament: ''
        })
      }
    } catch (error) {
      console.error('Failed to add dog:', error)
    }
  }

  const handleEditDog = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${apiBase}/api/dogs/${editingDog.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify(editDog)
      })
      
      if (response.ok) {
        await loadDogs()
        setShowEditForm(false)
        setEditingDog(null)
        setEditDog({
          name: '',
          breed: '',
          age: '',
          trainingLevel: 'basic',
          specialization: 'pointer',
          temperament: ''
        })
      }
    } catch (error) {
      console.error('Failed to update dog:', error)
    }
  }

  const handleDeleteDog = async (dogId) => {
    if (!window.confirm('Are you sure you want to delete this dog profile?')) {
      return
    }
    
    try {
      const response = await fetch(`${apiBase}/api/dogs/${dogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      
      if (response.ok) {
        await loadDogs()
      }
    } catch (error) {
      console.error('Failed to delete dog:', error)
    }
  }

  const startEdit = (dog) => {
    setEditingDog(dog)
    setEditDog({
      name: dog.name || '',
      breed: dog.breed || '',
      age: dog.age || '',
      trainingLevel: dog.trainingLevel || dog.training_level || 'basic',
      specialization: dog.specialization || dog.hunting_style || 'pointer',
      temperament: dog.temperament || dog.description || ''
    })
    setShowEditForm(true)
  }

  const getTrainingLevelColor = (level) => {
    switch (level) {
      case 'puppy': return 'bg-pink-100 text-pink-800'
      case 'basic': return 'bg-yellow-100 text-yellow-800'
      case 'intermediate': return 'bg-blue-100 text-blue-800'
      case 'advanced': return 'bg-green-100 text-green-800'
      case 'competition': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading your pack...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-hunta-green">🐕 Pack Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your hunting dogs, track their training progress, and monitor performance.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          Add Dog
        </button>
      </div>

      {/* Add Dog Form */}
      {showAddForm && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-hunta-green">Add New Dog</h3>
          <form onSubmit={handleAddDog} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newDog.name}
                  onChange={(e) => setNewDog({...newDog, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                <input
                  type="text"
                  required
                  value={newDog.breed}
                  onChange={(e) => setNewDog({...newDog, breed: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="text"
                  placeholder="e.g., 3 years, 18 months"
                  value={newDog.age}
                  onChange={(e) => setNewDog({...newDog, age: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Training Level</label>
                <select
                  value={newDog.trainingLevel}
                  onChange={(e) => setNewDog({...newDog, trainingLevel: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                >
                  <option value="puppy">Puppy</option>
                  <option value="basic">Basic</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="competition">Competition</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <select
                  value={newDog.specialization}
                  onChange={(e) => setNewDog({...newDog, specialization: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                >
                  <option value="pointer">Pointer</option>
                  <option value="retriever">Retriever</option>
                  <option value="flusher">Flusher</option>
                  <option value="hound">Hound</option>
                  <option value="versatile">Versatile</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperament</label>
              <textarea
                value={newDog.temperament}
                onChange={(e) => setNewDog({...newDog, temperament: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                placeholder="Tell us about this dog's temperament, strengths, and personality..."
              />
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Add Dog
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

      {/* Dogs List */}
      {dogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🐕</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No dogs in your pack yet</h3>
          <p className="text-gray-600 mb-4">Add your first hunting dog to get started with pack management.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Add Your First Dog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dogs.map((dog) => (
            <div key={dog.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-hunta-green">{dog.name}</h3>
                  <p className="text-gray-600">{dog.breed}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTrainingLevelColor(dog.trainingLevel || dog.training_level)}`}>
                  {dog.trainingLevel || dog.training_level}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-16 font-medium">Age:</span>
                  <span>{dog.age || 'Not specified'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-16 font-medium">Style:</span>
                  <span className="capitalize">{dog.specialization || dog.hunting_style}</span>
                </div>
              </div>
              
              {(dog.temperament || dog.description) && (
                <p className="text-sm text-gray-600 mb-4">{dog.temperament || dog.description}</p>
              )}
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => startEdit(dog)}
                  className="flex-1 text-sm px-3 py-2 bg-hunta-green text-white rounded hover:bg-hunta-green-light"
                >
                  Edit Profile
                </button>
                <button 
                  onClick={() => handleDeleteDog(dog.id)}
                  className="flex-1 text-sm px-3 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dog Form */}
      {showEditForm && editingDog && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-hunta-green">Edit {editingDog.name}</h3>
          <form onSubmit={handleEditDog} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editDog.name}
                  onChange={(e) => setEditDog({...editDog, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                <input
                  type="text"
                  required
                  value={editDog.breed}
                  onChange={(e) => setEditDog({...editDog, breed: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="text"
                  placeholder="e.g., 3 years, 18 months"
                  value={editDog.age}
                  onChange={(e) => setEditDog({...editDog, age: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Training Level</label>
                <select
                  value={editDog.trainingLevel}
                  onChange={(e) => setEditDog({...editDog, trainingLevel: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                >
                  <option value="puppy">Puppy</option>
                  <option value="basic">Basic</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="competition">Competition</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <select
                  value={editDog.specialization}
                  onChange={(e) => setEditDog({...editDog, specialization: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                >
                  <option value="pointer">Pointer</option>
                  <option value="retriever">Retriever</option>
                  <option value="flusher">Flusher</option>
                  <option value="hound">Hound</option>
                  <option value="versatile">Versatile</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperament</label>
              <textarea
                value={editDog.temperament}
                onChange={(e) => setEditDog({...editDog, temperament: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                placeholder="Tell us about this dog's temperament, strengths, and personality..."
              />
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Update Dog
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false)
                  setEditingDog(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Summary */}
      {dogs.length > 0 && (
        <div className="card bg-hunta-green text-white">
          <h3 className="text-lg font-bold mb-3">Pack Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{dogs.length}</div>
              <div className="text-sm opacity-80">Total Dogs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {dogs.filter(d => (d.trainingLevel || d.training_level) === 'advanced').length}
              </div>
              <div className="text-sm opacity-80">Advanced</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {new Set(dogs.map(d => d.specialization || d.hunting_style)).size}
              </div>
              <div className="text-sm opacity-80">Styles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {new Set(dogs.map(d => d.breed)).size}
              </div>
              <div className="text-sm opacity-80">Breeds</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DogsPage