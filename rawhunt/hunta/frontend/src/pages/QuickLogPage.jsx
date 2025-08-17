import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGeolocation } from '../hooks/useGeolocation';
import { useCamera } from '../hooks/useCamera';
import { useVoiceNotes } from '../hooks/useVoiceNotes';
import { useOffline } from '../hooks/useOffline';

/**
 * QuickLogPage Component
 * Optimized for field use with minimal interface and maximum functionality
 * Includes GPS tracking, photo capture, and voice notes for rapid hunt logging
 */
const QuickLogPage = () => {
  const [huntData, setHuntData] = useState({
    startTime: null,
    endTime: null,
    dogs: [],
    species: '',
    weather: '',
    notes: '',
    success: false,
    gameHarvested: 0
  });
  const [isLogging, setIsLogging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [voiceNotes, setVoiceNotes] = useState([]);

  // Hooks
  const {
    position,
    error: gpsError,
    isTracking,
    route,
    waypoints,
    startTracking,
    stopTracking,
    addWaypoint,
    getRouteDistance,
    getRouteDuration
  } = useGeolocation({ trackRoute: true, routeInterval: 15000 });

  const {
    isOpen: cameraOpen,
    capturePhoto,
    openCamera,
    closeCamera,
    capturedPhoto,
    videoRef,
    canvasRef,
    error: cameraError
  } = useCamera({ includeGeoLocation: true });

  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    transcription,
    recordingTime,
    formatTime,
    error: voiceError
  } = useVoiceNotes({ enableTranscription: true });

  const { isOffline } = useOffline();

  // Initialize hunt logging
  const startHunt = async () => {
    setIsLogging(true);
    setHuntData(prev => ({
      ...prev,
      startTime: Date.now()
    }));
    
    // Start GPS tracking
    startTracking();
    
    // Add starting waypoint
    try {
      await addWaypoint('Hunt Start', 'start');
    } catch (error) {
      console.warn('Could not add start waypoint:', error);
    }
  };

  // End hunt logging
  const endHunt = async () => {
    setIsLogging(false);
    setHuntData(prev => ({
      ...prev,
      endTime: Date.now()
    }));
    
    // Stop GPS tracking
    stopTracking();
    
    // Add ending waypoint
    try {
      await addWaypoint('Hunt End', 'end');
    } catch (error) {
      console.warn('Could not add end waypoint:', error);
    }
    
    // Save hunt log
    await saveHuntLog();
  };

  // Handle photo capture
  const handlePhotoCapture = async () => {
    try {
      const photo = await capturePhoto();
      if (photo) {
        setPhotos(prev => [...prev, photo]);
        closeCamera();
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Failed to capture photo:', error);
    }
  };

  // Handle voice note completion
  const handleVoiceNoteComplete = async () => {
    if (audioBlob && transcription) {
      const voiceNote = {
        id: Date.now().toString(),
        blob: audioBlob,
        transcription,
        duration: recordingTime,
        timestamp: Date.now(),
        location: position
      };
      
      setVoiceNotes(prev => [...prev, voiceNote]);
      setShowVoiceRecorder(false);
    }
  };

  // Add waypoint at current location
  const addCurrentWaypoint = async () => {
    try {
      const waypoint = await addWaypoint(`Waypoint ${waypoints.length + 1}`, 'custom');
      // Show success feedback
      console.log('Waypoint added:', waypoint);
    } catch (error) {
      console.error('Failed to add waypoint:', error);
    }
  };

  // Save hunt log
  const saveHuntLog = async () => {
    const huntLog = {
      id: Date.now().toString(),
      startTime: huntData.startTime,
      endTime: huntData.endTime,
      duration: huntData.endTime - huntData.startTime,
      location: {
        start: route[0],
        end: route[route.length - 1]
      },
      route: route,
      waypoints: waypoints,
      distance: getRouteDistance(),
      dogs: huntData.dogs,
      species: huntData.species,
      weather: huntData.weather,
      notes: huntData.notes,
      success: huntData.success,
      gameHarvested: huntData.gameHarvested,
      photos: photos,
      voiceNotes: voiceNotes,
      offline: isOffline,
      timestamp: Date.now()
    };

    try {
      if (isOffline) {
        // Store locally and sync when online
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_HUNT_LOG',
            data: huntLog
          });
        }
        
        // Store in localStorage as backup
        const existingLogs = JSON.parse(localStorage.getItem('offlineHuntLogs') || '[]');
        existingLogs.push(huntLog);
        localStorage.setItem('offlineHuntLogs', JSON.stringify(existingLogs));
        
        alert('Hunt log saved offline. Will sync when connection is restored.');
      } else {
        // Send to server
        const response = await fetch('/api/hunt-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(huntLog)
        });
        
        if (response.ok) {
          alert('Hunt log saved successfully!');
        } else {
          throw new Error('Server error');
        }
      }
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Failed to save hunt log:', error);
      alert('Failed to save hunt log. Please try again.');
    }
  };

  // Reset form
  const resetForm = () => {
    setHuntData({
      startTime: null,
      endTime: null,
      dogs: [],
      species: '',
      weather: '',
      notes: '',
      success: false,
      gameHarvested: 0
    });
    setPhotos([]);
    setVoiceNotes([]);
    setIsLogging(false);
  };

  // Auto-detect weather (placeholder)
  useEffect(() => {
    if (position && !huntData.weather) {
      // In a real app, this would call a weather API
      setHuntData(prev => ({
        ...prev,
        weather: 'Clear, 45°F, Light wind'
      }));
    }
  }, [position]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6"
      >
        <h1 className="text-3xl font-bold text-green-800 mb-2">🎯 Quick Hunt Log</h1>
        <p className="text-gray-600">Rapid field logging with GPS, photos, and voice notes</p>
        
        {/* Status Indicators */}
        <div className="flex justify-center space-x-4 mt-4 text-sm">
          <div className={`flex items-center ${position ? 'text-green-600' : 'text-red-600'}`}>
            📍 GPS: {position ? 'Active' : 'Searching...'}
          </div>
          <div className={`flex items-center ${isOffline ? 'text-orange-600' : 'text-green-600'}`}>
            {isOffline ? '📱 Offline' : '🌐 Online'}
          </div>
          {isTracking && (
            <div className="flex items-center text-blue-600">
              🗺️ Tracking: {Math.round(getRouteDistance())}m
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {!isLogging ? (
          /* Pre-Hunt Setup */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Hunt Setup</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Species
                </label>
                <input
                  type="text"
                  value={huntData.species}
                  onChange={(e) => setHuntData(prev => ({ ...prev, species: e.target.value }))}
                  placeholder="Pheasant, Quail, Duck..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weather Conditions
                </label>
                <input
                  type="text"
                  value={huntData.weather}
                  onChange={(e) => setHuntData(prev => ({ ...prev, weather: e.target.value }))}
                  placeholder="Auto-detected or manual entry"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dogs Present
              </label>
              <input
                type="text"
                value={huntData.dogs.join(', ')}
                onChange={(e) => setHuntData(prev => ({ ...prev, dogs: e.target.value.split(', ').filter(d => d.trim()) }))}
                placeholder="Rex, Bella, Duke..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startHunt}
              disabled={!position}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg ${
                position
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {position ? '🏁 Start Hunt Logging' : '📍 Waiting for GPS...'}
            </motion.button>
          </motion.div>
        ) : (
          /* During Hunt */
          <div className="space-y-6">
            {/* Hunt Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Hunt in Progress</h2>
                <div className="text-sm text-gray-500">
                  {huntData.startTime && `Started: ${new Date(huntData.startTime).toLocaleTimeString()}`}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{Math.round(getRouteDistance())}m</div>
                  <div className="text-xs text-gray-600">Distance</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{waypoints.length}</div>
                  <div className="text-xs text-gray-600">Waypoints</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">{photos.length}</div>
                  <div className="text-xs text-gray-600">Photos</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-600">{voiceNotes.length}</div>
                  <div className="text-xs text-gray-600">Voice Notes</div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCamera(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center"
                >
                  <div className="text-2xl mb-1">📸</div>
                  <div className="text-sm">Photo</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowVoiceRecorder(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-center"
                >
                  <div className="text-2xl mb-1">🎤</div>
                  <div className="text-sm">Voice Note</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addCurrentWaypoint}
                  className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg text-center"
                >
                  <div className="text-2xl mb-1">📍</div>
                  <div className="text-sm">Waypoint</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setHuntData(prev => ({ ...prev, gameHarvested: prev.gameHarvested + 1 }))}
                  className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-center"
                >
                  <div className="text-2xl mb-1">🦆</div>
                  <div className="text-sm">Game +1</div>
                </motion.button>
              </div>
            </motion.div>

            {/* End Hunt */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Ready to finish?</h3>
                  <p className="text-gray-600 text-sm">Save your hunt log with all captured data</p>
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsLogging(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={endHunt}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                  >
                    🏁 End Hunt
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold mb-4">Capture Photo</h3>
              
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      closeCamera();
                      setShowCamera(false);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openCamera}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    📹 Start Camera
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePhotoCapture}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    📸 Capture
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Recorder Modal */}
      <AnimatePresence>
        {showVoiceRecorder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold mb-4">Voice Note</h3>
              
              <div className="text-center space-y-4">
                <div className="text-4xl">
                  {isRecording ? '🔴' : '🎤'}
                </div>
                
                <div className="text-2xl font-mono">
                  {formatTime(recordingTime)}
                </div>
                
                {transcription && (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-left">
                    <strong>Transcription:</strong><br />
                    {transcription}
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowVoiceRecorder(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </motion.button>
                  
                  {!isRecording ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startRecording}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      🎤 Start
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={stopRecording}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      ⏹️ Stop
                    </motion.button>
                  )}
                  
                  {audioBlob && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleVoiceNoteComplete}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      ✅ Save
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickLogPage;