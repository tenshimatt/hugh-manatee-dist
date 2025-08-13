import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const RoutesPage = () => {
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Simulate loading with sample data
    setTimeout(() => {
      setRoutes(sampleRoutes);
      setIsLoading(false);
    }, 1000);
  }, []);

  const sampleRoutes = [
    {
      id: '1',
      name: 'Pine Ridge Trail',
      location: 'Colorado Rockies',
      distance: 8.5,
      difficulty: 'Moderate',
      elevation_gain: 1200,
      duration: '4-6 hours',
      terrain: 'Forest, Ridge',
      wildlife_spotted: ['Deer', 'Elk', 'Grouse'],
      created_at: '2024-01-15',
      image: null,
      status: 'completed'
    },
    {
      id: '2',
      name: 'Whitetail Valley Loop',
      location: 'Montana Wilderness',
      distance: 12.3,
      difficulty: 'Challenging',
      elevation_gain: 2100,
      duration: '6-8 hours',
      terrain: 'Valley, Creek, Meadow',
      wildlife_spotted: ['Whitetail Deer', 'Turkey', 'Pheasant'],
      created_at: '2024-01-20',
      image: null,
      status: 'planned'
    },
    {
      id: '3',
      name: 'Sage Brush Flats',
      location: 'Wyoming High Country',
      distance: 6.2,
      difficulty: 'Easy',
      elevation_gain: 400,
      duration: '2-3 hours',
      terrain: 'Prairie, Sagebrush',
      wildlife_spotted: ['Sage Grouse', 'Antelope', 'Prairie Dogs'],
      created_at: '2024-01-25',
      image: null,
      status: 'in_progress'
    },
  ];

  const filteredRoutes = routes.filter(route => {
    if (filter === 'all') return true;
    return route.status === filter;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'challenging': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🗺️ Hunt Route Planner</h1>
          <p className="text-gray-600">Plan, track, and share your hunting expeditions</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.href = '/routes/new'}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2"
        >
          <span>🎯</span>
          <span>Plan New Route</span>
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Routes</p>
              <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
            </div>
            <span className="text-3xl">🗺️</span>
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
              <p className="text-sm font-medium text-gray-600">Miles Covered</p>
              <p className="text-2xl font-bold text-gray-900">
                {routes.reduce((sum, route) => sum + route.distance, 0).toFixed(1)}
              </p>
            </div>
            <span className="text-3xl">📏</span>
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
              <p className="text-sm font-medium text-gray-600">Elevation Gained</p>
              <p className="text-2xl font-bold text-gray-900">
                {routes.reduce((sum, route) => sum + route.elevation_gain, 0).toLocaleString()}ft
              </p>
            </div>
            <span className="text-3xl">⛰️</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Wildlife Spotted</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(routes.flatMap(r => r.wildlife_spotted)).size}
              </p>
            </div>
            <span className="text-3xl">🦌</span>
          </div>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6"
      >
        {[
          { key: 'all', label: 'All Routes', count: routes.length },
          { key: 'planned', label: 'Planned', count: routes.filter(r => r.status === 'planned').length },
          { key: 'in_progress', label: 'In Progress', count: routes.filter(r => r.status === 'in_progress').length },
          { key: 'completed', label: 'Completed', count: routes.filter(r => r.status === 'completed').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </motion.div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRoutes.map((route, index) => (
          <motion.div
            key={route.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => window.location.href = `/routes/${route.id}`}
          >
            {/* Route Image */}
            <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
              {route.image ? (
                <img 
                  src={route.image} 
                  alt={route.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl">🏔️</span>
              )}
            </div>

            {/* Route Info */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{route.name}</h3>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(route.difficulty)}`}>
                    {route.difficulty}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(route.status)}`}>
                    {route.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">📍 {route.location}</p>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-medium">Distance:</span> {route.distance} miles
                </div>
                <div>
                  <span className="font-medium">Duration:</span> {route.duration}
                </div>
                <div>
                  <span className="font-medium">Elevation:</span> +{route.elevation_gain}ft
                </div>
                <div>
                  <span className="font-medium">Terrain:</span> {route.terrain}
                </div>
              </div>

              {/* Wildlife Tags */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Wildlife Spotted:</p>
                <div className="flex flex-wrap gap-1">
                  {route.wildlife_spotted.map((animal, idx) => (
                    <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                      {animal}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
                >
                  View Details
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm"
                >
                  📍 GPS
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add New Route Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + filteredRoutes.length * 0.1 }}
          whileHover={{ y: -4 }}
          onClick={() => window.location.href = '/routes/new'}
          className="bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 hover:border-green-400 hover:shadow-lg transition-all flex flex-col items-center justify-center h-64 text-gray-500 hover:text-green-600"
        >
          <span className="text-4xl mb-4">🎯</span>
          <span className="text-lg font-medium">Plan New Route</span>
          <span className="text-sm mt-2">Create your next adventure</span>
        </motion.button>
      </div>
    </div>
  );
};

export default RoutesPage;