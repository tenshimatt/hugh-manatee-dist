import React, { useState } from 'react';
import { motion } from 'framer-motion';

const EventsPage = () => {
  const [filter, setFilter] = useState('all');

  const sampleEvents = [
    {
      id: '1',
      name: 'Rocky Mountain Field Trial',
      date: '2024-02-15',
      location: 'Colorado Springs, CO',
      type: 'Field Trial',
      difficulty: 'Advanced',
      max_participants: 50,
      current_participants: 32,
      entry_fee: 125,
      organizer: 'Colorado Hunting Club',
      description: 'Annual field trial testing pointing, retrieving, and steadiness skills.',
      status: 'open'
    },
    {
      id: '2',
      name: 'Whitetail Training Camp',
      date: '2024-02-22',
      location: 'Montana Wilderness',
      type: 'Training',
      difficulty: 'Intermediate',
      max_participants: 20,
      current_participants: 18,
      entry_fee: 200,
      organizer: 'Wild West Trainers',
      description: 'Three-day intensive training camp for whitetail hunting techniques.',
      status: 'almost_full'
    },
    {
      id: '3',
      name: 'Spring Hunt Test',
      date: '2024-03-05',
      location: 'Wyoming High Country',
      type: 'Hunt Test',
      difficulty: 'All Levels',
      max_participants: 75,
      current_participants: 12,
      entry_fee: 75,
      organizer: 'High Country Hunting Association',
      description: 'AKC-sanctioned hunt test for all skill levels.',
      status: 'open'
    },
  ];

  const filteredEvents = sampleEvents.filter(event => {
    if (filter === 'all') return true;
    return event.type.toLowerCase().replace(' ', '_') === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'almost_full': return 'bg-yellow-100 text-yellow-800';
      case 'full': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-purple-100 text-purple-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      case 'all levels': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏆 Trial & Event Listings</h1>
          <p className="text-gray-600">Discover field trials, hunt tests, and training events</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2"
        >
          <span>📅</span>
          <span>Create Event</span>
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
              <p className="text-2xl font-bold text-gray-900">{sampleEvents.length}</p>
            </div>
            <span className="text-3xl">📅</span>
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
              <p className="text-sm font-medium text-gray-600">Events Joined</p>
              <p className="text-2xl font-bold text-gray-900">7</p>
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
              <p className="text-sm font-medium text-gray-600">Awards Won</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
            <span className="text-3xl">🏆</span>
          </div>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6"
      >
        {[
          { key: 'all', label: 'All Events' },
          { key: 'field_trial', label: 'Field Trials' },
          { key: 'hunt_test', label: 'Hunt Tests' },
          { key: 'training', label: 'Training' },
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
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Events List */}
      <div className="space-y-6">
        {filteredEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            whileHover={{ y: -2 }}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{event.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center">
                        <span className="mr-1">📅</span>
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1">📍</span>
                        {event.location}
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1">👥</span>
                        {event.organizer}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{event.description}</p>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                      {event.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getDifficultyColor(event.difficulty)}`}>
                      {event.difficulty}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <p className="text-gray-600">{event.type}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Entry Fee:</span>
                    <p className="text-gray-600">${event.entry_fee}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Participants:</span>
                    <p className="text-gray-600">{event.current_participants}/{event.max_participants}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Spots Left:</span>
                    <p className="text-gray-600">{event.max_participants - event.current_participants}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-3 mt-4 lg:mt-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  Register
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium"
                >
                  View Details
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <span className="text-6xl mb-4 block">🏆</span>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600 mb-8">Try adjusting your filter or check back later for new events</p>
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium">
            Create First Event
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default EventsPage;