import React, { useState } from 'react';
import { motion } from 'framer-motion';

const EthicsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const sampleArticles = [
    {
      id: '1',
      title: 'Fair Chase Principles in Modern Hunting',
      category: 'Ethics',
      author: 'Dr. Sarah Johnson',
      read_time: '8 min read',
      excerpt: 'Understanding the fundamental principles of fair chase and how technology impacts ethical hunting practices.',
      tags: ['Fair Chase', 'Ethics', 'Technology'],
      image: null,
      published: '2024-01-15',
      views: 1247
    },
    {
      id: '2',
      title: 'Wilderness Safety: Essential Protocols',
      category: 'Safety',
      author: 'Mountain Rescue Team',
      read_time: '12 min read',
      excerpt: 'Comprehensive safety protocols for hunting in remote wilderness areas with your dogs.',
      tags: ['Safety', 'Wilderness', 'Emergency'],
      image: null,
      published: '2024-01-20',
      views: 892
    },
    {
      id: '3',
      title: 'Conservation Through Hunting: A Modern Perspective',
      category: 'Conservation',
      author: 'Wildlife Foundation',
      read_time: '15 min read',
      excerpt: 'How responsible hunting contributes to wildlife conservation and habitat preservation.',
      tags: ['Conservation', 'Wildlife', 'Habitat'],
      image: null,
      published: '2024-01-25',
      views: 2105
    },
    {
      id: '4',
      title: 'Training Dogs: Ethical Considerations',
      category: 'Training',
      author: 'Professional Trainer Network',
      read_time: '10 min read',
      excerpt: 'Balancing effective training methods with humane treatment and respect for your hunting companions.',
      tags: ['Training', 'Dog Welfare', 'Methods'],
      image: null,
      published: '2024-01-30',
      views: 567
    },
  ];

  const categories = [
    { key: 'all', label: 'All Topics', icon: '📚' },
    { key: 'ethics', label: 'Ethics', icon: '⚖️' },
    { key: 'safety', label: 'Safety', icon: '🛡️' },
    { key: 'conservation', label: 'Conservation', icon: '🌿' },
    { key: 'training', label: 'Training', icon: '🎯' },
  ];

  const filteredArticles = sampleArticles.filter(article => {
    if (selectedCategory === 'all') return true;
    return article.category.toLowerCase() === selectedCategory;
  });

  const getCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case 'ethics': return 'bg-purple-100 text-purple-800';
      case 'safety': return 'bg-red-100 text-red-800';
      case 'conservation': return 'bg-green-100 text-green-800';
      case 'training': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">📚 Ethics Knowledge Base</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Comprehensive hunting ethics, safety protocols, conservation practices, and best practices from expert contributors
        </p>
      </motion.div>

      {/* Featured Article */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 text-white mb-12"
      >
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">⭐</span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">Featured Article</span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold mb-4">
          {sampleArticles[0].title}
        </h2>
        <p className="text-green-100 text-lg mb-6">
          {sampleArticles[0].excerpt}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-green-200">By {sampleArticles[0].author}</span>
          <span className="text-green-200">•</span>
          <span className="text-green-200">{sampleArticles[0].read_time}</span>
          <span className="text-green-200">•</span>
          <span className="text-green-200">{sampleArticles[0].views.toLocaleString()} views</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="ml-auto bg-white text-green-700 px-6 py-2 rounded-lg font-medium hover:bg-green-50"
          >
            Read Article
          </motion.button>
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap justify-center gap-4 mb-12"
      >
        {categories.map((category) => (
          <motion.button
            key={category.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedCategory(category.key)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedCategory === category.key
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-green-400 hover:text-green-600'
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredArticles.slice(1).map((article, index) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          >
            {/* Article Image */}
            <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              {article.image ? (
                <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">📖</span>
              )}
            </div>

            {/* Article Content */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getCategoryColor(article.category)}`}>
                  {article.category}
                </span>
                <span className="text-sm text-gray-500">{article.read_time}</span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                {article.title}
              </h3>

              <p className="text-gray-600 mb-4 line-clamp-3">
                {article.excerpt}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Article Meta */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>By {article.author}</span>
                  <span>•</span>
                  <span>{new Date(article.published).toLocaleDateString()}</span>
                </div>
                <span>{article.views.toLocaleString()} views</span>
              </div>

              {/* Read Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium"
              >
                Read Full Article
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Contribute Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-green-50 rounded-lg p-8 mt-12 text-center"
      >
        <span className="text-4xl block mb-4">✍️</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Share Your Knowledge</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Have expertise in hunting ethics, safety, or conservation? Contribute to our knowledge base and help fellow hunters make informed decisions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Submit Article
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="border border-green-600 text-green-600 hover:bg-green-50 px-6 py-3 rounded-lg font-medium"
          >
            Become Contributor
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Access */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
      >
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <span className="text-3xl block mb-3">🚨</span>
          <h3 className="font-bold text-gray-900 mb-2">Emergency Protocols</h3>
          <p className="text-gray-600 text-sm mb-4">Quick access to safety procedures and emergency contacts</p>
          <button className="text-green-600 hover:text-green-700 font-medium">View Guidelines</button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <span className="text-3xl block mb-3">📋</span>
          <h3 className="font-bold text-gray-900 mb-2">Hunting Regulations</h3>
          <p className="text-gray-600 text-sm mb-4">Current hunting laws and regulations by state/region</p>
          <button className="text-green-600 hover:text-green-700 font-medium">Check Laws</button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <span className="text-3xl block mb-3">🤝</span>
          <h3 className="font-bold text-gray-900 mb-2">Code of Ethics</h3>
          <p className="text-gray-600 text-sm mb-4">Community guidelines and ethical hunting standards</p>
          <button className="text-green-600 hover:text-green-700 font-medium">Read Code</button>
        </div>
      </motion.div>
    </div>
  );
};

export default EthicsPage;