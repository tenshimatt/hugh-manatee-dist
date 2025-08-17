import React from 'react';
import { motion } from 'framer-motion';

const RoutePlannerPage = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-4">🎯 Plan New Route</h1>
        <p className="text-gray-600">Create and plan your next hunting expedition</p>
      </motion.div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Route Planner</h2>
          <p className="text-gray-600 mb-8">Interactive route planning tool coming soon</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="border rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">📍 GPS Integration</h3>
              <p className="text-gray-600 text-sm">Plan routes with precise GPS coordinates</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">⛰️ Elevation Data</h3>
              <p className="text-gray-600 text-sm">Track elevation changes and difficulty</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">📁 GPX Export</h3>
              <p className="text-gray-600 text-sm">Export routes for GPS devices</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutePlannerPage;