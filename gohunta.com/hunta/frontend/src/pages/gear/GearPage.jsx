import React, { useState } from 'react';
import { motion } from 'framer-motion';

const GearPage = () => {
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('reviews'); // 'reviews' or 'loadouts'

  const sampleGear = [
    {
      id: '1',
      name: 'Garmin Alpha 200i GPS Collar',
      category: 'GPS & Tracking',
      price: 699,
      rating: 4.8,
      reviews: 127,
      brand: 'Garmin',
      image: null,
      pros: ['Excellent GPS accuracy', 'Long battery life', 'InReach messaging'],
      cons: ['Expensive', 'Complex setup'],
      description: 'Professional-grade GPS tracking collar with satellite communication capabilities.',
      recommended_by: 'EliteHunter99'
    },
    {
      id: '2',
      name: 'Filson Tin Cloth Vest',
      category: 'Clothing',
      price: 295,
      rating: 4.6,
      reviews: 89,
      brand: 'Filson',
      image: null,
      pros: ['Extremely durable', 'Weather resistant', 'Classic design'],
      cons: ['Heavy when wet', 'Expensive'],
      description: 'Heavy-duty hunting vest made from waxed cotton for maximum durability.',
      recommended_by: 'TrailMaster'
    },
    {
      id: '3',
      name: 'YETI Hopper M30 Soft Cooler',
      category: 'Storage',
      price: 300,
      rating: 4.7,
      reviews: 203,
      brand: 'YETI',
      image: null,
      pros: ['Excellent insulation', 'Leak-proof', 'Portable'],
      cons: ['Pricey', 'Heavy when full'],
      description: 'Premium soft cooler perfect for day-long hunting expeditions.',
      recommended_by: 'CoolerReviews'
    },
  ];

  const sampleLoadouts = [
    {
      id: '1',
      name: 'Upland Bird Hunting Setup',
      author: 'EliteHunter99',
      terrain: 'Prairie & Fields',
      season: 'Fall',
      items: 12,
      weight: '28 lbs',
      cost: 2450,
      tags: ['Pheasant', 'Quail', 'Day Hunt'],
      description: 'Complete setup for upland bird hunting with pointing dogs.'
    },
    {
      id: '2',
      name: 'Multi-Day Wilderness Pack',
      author: 'TrailMaster',
      terrain: 'Mountain',
      season: 'Early Season',
      items: 18,
      weight: '45 lbs',
      cost: 3200,
      tags: ['Elk', 'Deer', 'Backcountry'],
      description: 'Everything needed for extended backcountry hunts with pack dogs.'
    },
  ];

  const categories = ['all', 'gps_tracking', 'clothing', 'storage', 'training', 'first_aid', 'optics'];

  const filteredGear = sampleGear.filter(item => {
    if (filter === 'all') return true;
    return item.category.toLowerCase().replace(/\s+/g, '_').replace('&_', '') === filter;
  });

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => <span key={i} className="text-yellow-400">★</span>)}
        {hasHalfStar && <span className="text-yellow-400">★</span>}
        {[...Array(emptyStars)].map((_, i) => <span key={i} className="text-gray-300">★</span>)}
        <span className="ml-2 text-sm text-gray-600">({rating})</span>
      </div>
    );
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚡ Gear Reviews & Loadouts</h1>
          <p className="text-gray-600">Professional equipment reviews and custom loadout configurations</p>
        </div>
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2"
          >
            <span>📝</span>
            <span>Write Review</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="border border-green-600 text-green-600 hover:bg-green-50 px-6 py-3 rounded-lg font-medium flex items-center space-x-2"
          >
            <span>🎒</span>
            <span>Create Loadout</span>
          </motion.button>
        </div>
      </motion.div>

      {/* View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center mb-8"
      >
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('reviews')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'reviews' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔍 Gear Reviews
          </button>
          <button
            onClick={() => setView('loadouts')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'loadouts' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎒 Loadouts
          </button>
        </div>
      </motion.div>

      {view === 'reviews' && (
        <>
          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === category
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
              </button>
            ))}
          </motion.div>

          {/* Gear Reviews Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredGear.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Gear Image */}
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl">⚡</span>
                  )}
                </div>

                {/* Gear Info */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.brand} • {item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">${item.price}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mb-4">
                    {getRatingStars(item.rating)}
                    <p className="text-sm text-gray-600 mt-1">{item.reviews} reviews</p>
                  </div>

                  <p className="text-gray-700 text-sm mb-4">{item.description}</p>

                  {/* Pros/Cons */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="font-medium text-green-700 mb-2">✅ Pros:</p>
                      <ul className="space-y-1">
                        {item.pros.slice(0, 2).map((pro, idx) => (
                          <li key={idx} className="text-gray-600">• {pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-red-700 mb-2">❌ Cons:</p>
                      <ul className="space-y-1">
                        {item.cons.slice(0, 2).map((con, idx) => (
                          <li key={idx} className="text-gray-600">• {con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommended By */}
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-600">
                      Recommended by <span className="font-medium text-green-600">{item.recommended_by}</span>
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                      Full Review
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {view === 'loadouts' && (
        <>
          {/* Loadouts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sampleLoadouts.map((loadout, index) => (
              <motion.div
                key={loadout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{loadout.name}</h3>
                  <span className="text-2xl">🎒</span>
                </div>

                <p className="text-gray-700 mb-4">{loadout.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="font-medium text-gray-700">Author:</span>
                    <p className="text-green-600">{loadout.author}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Terrain:</span>
                    <p className="text-gray-600">{loadout.terrain}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Items:</span>
                    <p className="text-gray-600">{loadout.items} pieces</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Weight:</span>
                    <p className="text-gray-600">{loadout.weight}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {loadout.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold text-gray-900">~${loadout.cost.toLocaleString()}</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
                  >
                    View Loadout
                  </motion.button>
                </div>
              </motion.div>
            ))}

            {/* Create New Loadout Card */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + sampleLoadouts.length * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 hover:border-green-400 hover:shadow-lg transition-all flex flex-col items-center justify-center h-64 text-gray-500 hover:text-green-600"
            >
              <span className="text-4xl mb-4">🎒</span>
              <span className="text-lg font-medium">Create New Loadout</span>
              <span className="text-sm mt-2">Share your perfect gear setup</span>
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
};

export default GearPage;