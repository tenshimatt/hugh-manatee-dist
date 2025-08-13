import React from 'react';
import { motion } from 'framer-motion';

const ProfilePage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-4">👤 User Profile</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
        <div className="mt-8 text-6xl">👤</div>
        <p className="mt-4 text-gray-500">Profile page under construction</p>
      </motion.div>
    </div>
  );
};

export default ProfilePage;