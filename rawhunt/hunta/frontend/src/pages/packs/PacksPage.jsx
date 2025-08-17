import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth.jsx';

const PacksPage = () => {
  const { user, token } = useAuth();
  const [dogs, setDogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDogs();
  }, []);

  const fetchDogs = async () => {
    try {
      const response = await fetch('https://hunta-backend-prod.findrawdogfood.workers.dev/api/dogs/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDogs(data.data || []);
      } else {
        // For demo, show sample data
        setDogs(sampleDogs);
      }
    } catch (error) {
      console.error('Failed to fetch dogs:', error);
      // Show sample data for demo
      setDogs(sampleDogs);
    } finally {
      setIsLoading(false);
    }
  };

  // Sample data for demo
  const sampleDogs = [
    {
      id: '1',
      name: 'Rex',
      breed: 'German Shorthaired Pointer',
      age: 3,
      profile_image_url: null,
      training_level: 'Advanced',
      health_status: 'Excellent',
      microchip_id: 'GSP123456789',
    },
    {
      id: '2',
      name: 'Bella',
      breed: 'English Setter',
      age: 2,
      profile_image_url: null,
      training_level: 'Intermediate',
      health_status: 'Good',
      microchip_id: 'ES987654321',
    },
    {
      id: '3',
      name: 'Duke',
      breed: 'Labrador Retriever',
      age: 5,
      profile_image_url: null,
      training_level: 'Expert',
      health_status: 'Excellent',
      microchip_id: 'LR555444333',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🐕 Pack & Profile Management</h1>
          <p className="text-gray-600">Manage your hunting pack and individual dog profiles</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Add New Dog</span>
        </motion.button>
      </motion.div>

      {/* Pack Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Dogs</p>
              <p className="text-2xl font-bold text-gray-900">{dogs.length}</p>
            </div>
            <span className="text-3xl">🐕</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Training Hours</p>
              <p className="text-2xl font-bold text-gray-900">124</p>
            </div>
            <span className="text-3xl">🎯</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Health Checkups</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <span className="text-3xl">🏥</span>
          </div>
        </motion.div>
      </div>

      {/* Dogs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dogs.map((dog, index) => (
          <motion.div
            key={dog.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Dog Image */}
            <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
              {dog.profile_image_url ? (
                <img 
                  src={dog.profile_image_url} 
                  alt={dog.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl">🐕</span>
              )}
            </div>

            {/* Dog Info */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{dog.name}</h3>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  {dog.training_level || 'Beginner'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Breed:</span> {dog.breed}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Age:</span> {dog.age} years
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Health:</span> {dog.health_status || 'Good'}
                </p>
                {dog.microchip_id && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Chip:</span> {dog.microchip_id}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.href = `/packs/dog/${dog.id}`}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
                >
                  View Profile
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm"
                >
                  📝 Log
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add New Dog Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + dogs.length * 0.1 }}
          whileHover={{ y: -4 }}
          onClick={() => setShowAddForm(true)}
          className="bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 hover:border-green-400 hover:shadow-lg transition-all flex flex-col items-center justify-center h-64 text-gray-500 hover:text-green-600"
        >
          <span className="text-4xl mb-4">➕</span>
          <span className="text-lg font-medium">Add New Dog</span>
          <span className="text-sm mt-2">Expand your pack</span>
        </motion.button>
      </div>

      {/* Add Dog Modal */}
      {showAddForm && <AddDogModal onClose={() => setShowAddForm(false)} onSave={fetchDogs} />}
    </div>
  );
};

const AddDogModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    training_level: 'Beginner',
    health_status: 'Good',
    microchip_id: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // For demo, just close the modal
    alert('Dog profile would be saved here!');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Dog</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dog Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Rex"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Breed
            </label>
            <input
              type="text"
              value={formData.breed}
              onChange={(e) => setFormData(prev => ({...prev, breed: e.target.value}))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="German Shorthaired Pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age (years)
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({...prev, age: e.target.value}))}
                min="0"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Training Level
              </label>
              <select
                value={formData.training_level}
                onChange={(e) => setFormData(prev => ({...prev, training_level: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Microchip ID (Optional)
            </label>
            <input
              type="text"
              value={formData.microchip_id}
              onChange={(e) => setFormData(prev => ({...prev, microchip_id: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="ABC123456789"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add Dog
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PacksPage;