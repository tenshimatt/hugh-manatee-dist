import React, { useState } from 'react';
import { motion } from 'framer-motion';

const BragBoardPage = () => {
  const [filter, setFilter] = useState('all');

  const samplePosts = [
    {
      id: '1',
      author: 'EliteHunter99',
      avatar: null,
      title: 'Perfect Point on Opening Day',
      content: 'Rex locked up solid on this rooster - couldn\'t have asked for a better start to the season! 3 birds in the bag before noon.',
      images: [null, null],
      location: 'South Dakota Fields',
      date: '2024-01-15',
      likes: 47,
      comments: 12,
      tags: ['Pheasant', 'Opening Day', 'German Shorthair'],
      type: 'success_story'
    },
    {
      id: '2',
      author: 'TrailMaster',
      avatar: null,
      title: 'Training Breakthrough with Bella',
      content: 'After months of work, Bella finally mastered her blind retrieve! The persistence paid off - she\'s ready for the season.',
      images: [null],
      location: 'Training Grounds',
      date: '2024-01-18',
      likes: 32,
      comments: 8,
      tags: ['Training', 'English Setter', 'Retrieve'],
      type: 'training_log'
    },
    {
      id: '3',
      author: 'WildernessGuide',
      avatar: null,
      title: 'Epic Backcountry Adventure',
      content: 'Five days in the mountains with Duke - tracked elk for miles and finally connected on this bull. What an incredible experience!',
      images: [null, null, null],
      location: 'Colorado Rockies',
      date: '2024-01-20',
      likes: 89,
      comments: 23,
      tags: ['Elk', 'Backcountry', 'Labrador'],
      type: 'success_story'
    },
  ];

  const postTypes = [
    { key: 'all', label: 'All Posts', icon: '📸' },
    { key: 'success_story', label: 'Success Stories', icon: '🏆' },
    { key: 'training_log', label: 'Training Logs', icon: '📝' },
    { key: 'gear_photo', label: 'Gear Photos', icon: '⚡' },
    { key: 'scenery', label: 'Scenery', icon: '🏔️' },
  ];

  const filteredPosts = samplePosts.filter(post => {
    if (filter === 'all') return true;
    return post.type === filter;
  });

  const getTypeColor = (type) => {
    switch (type) {
      case 'success_story': return 'bg-green-100 text-green-800';
      case 'training_log': return 'bg-blue-100 text-blue-800';
      case 'gear_photo': return 'bg-purple-100 text-purple-800';
      case 'scenery': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📸 Brag Board & Journal</h1>
        <p className="text-gray-600">Share hunting stories, training achievements, and photos with the community</p>
      </motion.div>

      {/* Create Post Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-md p-6 mb-8"
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-800 font-medium text-lg">U</span>
          </div>
          <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-500 text-left px-4 py-3 rounded-lg transition-colors">
            Share your hunting success, training progress, or beautiful scenery...
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2"
          >
            <span>📸</span>
            <span>Create Post</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap justify-center gap-2 mb-8"
      >
        {postTypes.map((type) => (
          <button
            key={type.key}
            onClick={() => setFilter(type.key)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === type.key
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{type.icon}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {filteredPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            {/* Post Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    {post.avatar ? (
                      <img src={post.avatar} alt={post.author} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-green-800 font-medium">{post.author[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{post.author}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(post.date).toLocaleDateString()} • {post.location}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getTypeColor(post.type)}`}>
                  {post.type.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h2>
              <p className="text-gray-700 mb-4">{post.content}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Post Images */}
            {post.images && post.images.length > 0 && (
              <div className={`grid ${post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-1`}>
                {post.images.map((image, idx) => (
                  <div key={idx} className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {image ? (
                      <img src={image} alt={`Post image ${idx + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">📷</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Post Actions */}
            <div className="p-6 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <span className="text-lg">❤️</span>
                    <span className="text-sm font-medium">{post.likes}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
                  >
                    <span className="text-lg">💬</span>
                    <span className="text-sm font-medium">{post.comments}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors"
                  >
                    <span className="text-lg">📤</span>
                    <span className="text-sm font-medium">Share</span>
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-lg">🔖</span>
                </motion.button>
              </div>

              {/* Quick Comment */}
              <div className="mt-4 flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-800 font-medium text-sm">U</span>
                </div>
                <input
                  type="text"
                  placeholder="Write a comment..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button className="text-green-600 hover:text-green-700 font-medium text-sm">
                  Post
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center mt-8"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium"
        >
          Load More Posts
        </motion.button>
      </motion.div>

      {/* Community Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-green-50 rounded-lg p-6 mt-12"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Community Highlights</h3>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">1,247</p>
            <p className="text-sm text-gray-600">Success Stories</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">3,891</p>
            <p className="text-sm text-gray-600">Training Logs</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">567</p>
            <p className="text-sm text-gray-600">Active Members</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BragBoardPage;