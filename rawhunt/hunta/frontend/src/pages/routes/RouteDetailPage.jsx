import React from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';

const RouteDetailPage = () => {
  const { id } = useParams();

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Route Details</h1>
        <p className="text-gray-600">Detailed view for route ID: {id}</p>
        <div className="mt-8 text-6xl">🗺️</div>
        <p className="mt-4 text-gray-500">This page is under construction</p>
      </motion.div>
    </div>
  );
};

export default RouteDetailPage;