import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth.jsx';

const HomePage = () => {
  const { user } = useAuth();

  // If user is authenticated, show dashboard
  if (user) {
    return <Dashboard />;
  }

  // If not authenticated, show landing page
  return <LandingPage />;
};

const Dashboard = () => {
  const { user } = useAuth();

  const quickActions = [
    { icon: '🐕', title: 'Add New Dog', description: 'Register a new hunting companion', href: '/packs' },
    { icon: '🗺️', title: 'Plan Route', description: 'Create your next hunting expedition', href: '/routes/new' },
    { icon: '📝', title: 'Log Training', description: 'Record training session progress', href: '/training' },
    { icon: '🏆', title: 'Find Events', description: 'Discover trials and competitions', href: '/events' },
  ];

  const recentActivity = [
    { type: 'training', icon: '📝', title: 'Training session with Rex', time: '2 hours ago' },
    { type: 'route', icon: '🗺️', title: 'Completed Pine Ridge Trail', time: '1 day ago' },
    { type: 'gear', icon: '⚡', title: 'Reviewed new GPS collar', time: '2 days ago' },
    { type: 'post', icon: '📸', title: 'Shared hunting success story', time: '3 days ago' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName || user?.username}! 🎯
        </h1>
        <p className="text-gray-600">Ready for your next hunting adventure?</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dogs in Pack</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
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
              <p className="text-sm font-medium text-gray-600">Routes Planned</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <span className="text-3xl">🗺️</span>
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
              <p className="text-sm font-medium text-gray-600">Training Hours</p>
              <p className="text-2xl font-bold text-gray-900">48</p>
            </div>
            <span className="text-3xl">📝</span>
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
              <p className="text-sm font-medium text-gray-600">Events Joined</p>
              <p className="text-2xl font-bold text-gray-900">7</p>
            </div>
            <span className="text-3xl">🏆</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <motion.a
                key={index}
                href={action.href}
                whileHover={{ x: 4 }}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">{action.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{action.title}</p>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <span className="text-xl">{activity.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold text-white mb-4">🎯 HUNTA</h1>
          <p className="text-2xl text-green-200 mb-4">Elite Dog Hunting Platform</p>
          <p className="text-green-300 text-lg max-w-2xl mx-auto">
            Offline-first wilderness compatibility for dog-assisted hunting enthusiasts
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[
            { icon: '🐕', title: 'Pack Management', desc: 'Complete dog profiles and training records' },
            { icon: '🗺️', title: 'Route Planning', desc: 'GPS integration with offline capabilities' },
            { icon: '🏆', title: 'Events & Trials', desc: 'Find and join hunting competitions' },
            { icon: '⚡', title: 'Gear Reviews', desc: 'Professional equipment recommendations' },
            { icon: '📚', title: 'Ethics Guide', desc: 'Hunting safety and best practices' },
            { icon: '📸', title: 'Community', desc: 'Share stories and achievements' },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6"
            >
              <span className="text-4xl block mb-4">{feature.icon}</span>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-green-200">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <a 
            href="/register"
            className="inline-block bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
          >
            Join the Pack
          </a>
          <p className="text-green-300 mt-4">
            Already a member? <a href="/login" className="text-white underline">Sign in</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;