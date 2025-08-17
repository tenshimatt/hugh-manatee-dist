import React from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';

const EventDetailPage = () => {
  const { id } = useParams();

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Event Details</h1>
        <p className="text-gray-600">Detailed view for event ID: {id}</p>
        <div className="mt-8 text-6xl">🏆</div>
        <p className="mt-4 text-gray-500">Event details page under construction</p>
      </motion.div>
    </div>
  );
};

export default EventDetailPage;