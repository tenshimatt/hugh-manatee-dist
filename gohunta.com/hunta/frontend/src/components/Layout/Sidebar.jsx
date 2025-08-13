import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/packs', icon: '🐕', label: 'Pack & Profiles' },
    { path: '/routes', icon: '🗺️', label: 'Route Planner' },
    { path: '/events', icon: '🏆', label: 'Events & Trials' },
    { path: '/gear', icon: '⚡', label: 'Gear & Loadouts' },
    { path: '/ethics', icon: '📚', label: 'Ethics & Safety' },
    { path: '/bragboard', icon: '📸', label: 'Brag Board' },
  ];

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 lg:hidden bg-black bg-opacity-50"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="fixed left-0 top-16 bottom-0 z-40 w-64 bg-white shadow-xl border-r border-gray-200 lg:translate-x-0"
      >
        <div className="flex flex-col h-full">
          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => (
              <motion.a
                key={item.path}
                href={item.path}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActivePath(item.path)
                    ? 'bg-green-100 text-green-800 border-r-2 border-green-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={onClose}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </motion.a>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">🏔️</span>
                <span className="text-sm font-medium text-green-800">Offline Ready</span>
              </div>
              <p className="text-xs text-green-600">
                Your data syncs when you're back in range
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;