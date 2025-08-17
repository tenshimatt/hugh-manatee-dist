import React from 'react';
import { motion } from 'framer-motion';

const TrainingPage = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-4">📝 Training Logs</h1>
        <p className="text-gray-600">Track your dog training progress</p>
        <div className="mt-8 text-6xl">📝</div>
        <p className="mt-4 text-gray-500">Training logs page under construction</p>
      </motion.div>
    </div>
  );
};

export default TrainingPage;