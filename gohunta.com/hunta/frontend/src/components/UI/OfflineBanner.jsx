import React from 'react';
import { motion } from 'framer-motion';

const OfflineBanner = () => {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center shadow-lg"
    >
      <div className="flex items-center justify-center space-x-2">
        <span className="text-lg">🏔️</span>
        <span className="font-medium">Offline Mode Active</span>
        <span className="text-sm opacity-90">- Wilderness Ready</span>
      </div>
    </motion.div>
  );
};

export default OfflineBanner;