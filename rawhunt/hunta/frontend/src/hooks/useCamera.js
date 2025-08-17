import { useState, useRef, useCallback } from 'react';

/**
 * useCamera Hook
 * Provides camera functionality optimized for field photography
 * Includes photo compression, metadata extraction, and offline support
 */
export const useCamera = (options = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [stream, setStream] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Default options optimized for hunting scenarios
  const defaultOptions = {
    width: 1920,
    height: 1080,
    quality: 0.8, // JPEG quality
    maxFileSize: 2 * 1024 * 1024, // 2MB max
    facingMode: 'environment', // Back camera by default
    includeGeoLocation: true,
    autoCompress: true,
    ...options
  };

  // Check camera support
  const isCameraSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  // Open camera
  const openCamera = useCallback(async () => {
    if (!isCameraSupported()) {
      setError('Camera is not supported on this device');
      return false;
    }

    try {
      setError(null);
      setIsOpen(true);

      // Request camera permissions and stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: defaultOptions.width },
          height: { ideal: defaultOptions.height },
          facingMode: defaultOptions.facingMode
        },
        audio: false
      });

      setStream(mediaStream);

      // Set up video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }

      return true;
    } catch (err) {
      const errorMessage = getCameraError(err);
      setError(errorMessage);
      setIsOpen(false);
      return false;
    }
  }, []);

  // Close camera
  const closeCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsOpen(false);
    setIsCameraReady(false);
    setCapturedPhoto(null);
    setError(null);
  }, [stream]);

  // Capture photo
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) {
      setError('Camera is not ready');
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = canvas.toDataURL('image/jpeg', defaultOptions.quality);
      
      // Create photo object with metadata
      const photo = {
        id: Date.now().toString(),
        dataUrl: imageData,
        timestamp: Date.now(),
        width: canvas.width,
        height: canvas.height,
        size: Math.round(imageData.length * 0.75), // Approximate file size
        quality: defaultOptions.quality
      };

      // Add geolocation if enabled and available
      if (defaultOptions.includeGeoLocation && navigator.geolocation) {
        try {
          const position = await getCurrentPosition();
          photo.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude
          };
        } catch (geoError) {
          console.warn('Could not get location for photo:', geoError);
        }
      }

      // Compress if needed
      if (defaultOptions.autoCompress && photo.size > defaultOptions.maxFileSize) {
        const compressedPhoto = await compressPhoto(photo);
        setCapturedPhoto(compressedPhoto);
        return compressedPhoto;
      }

      setCapturedPhoto(photo);
      return photo;
    } catch (err) {
      setError('Failed to capture photo: ' + err.message);
      return null;
    }
  }, [isCameraReady]);

  // Compress photo to meet size requirements
  const compressPhoto = async (photo) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Create image from data URL
    const img = new Image();
    img.src = photo.dataUrl;
    
    return new Promise((resolve) => {
      img.onload = () => {
        let quality = defaultOptions.quality;
        let dataUrl = photo.dataUrl;
        let size = photo.size;
        
        // Reduce quality until size is acceptable
        while (size > defaultOptions.maxFileSize && quality > 0.1) {
          quality -= 0.1;
          
          // Redraw with new quality
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          size = Math.round(dataUrl.length * 0.75);
        }
        
        resolve({
          ...photo,
          dataUrl,
          size,
          quality,
          compressed: true
        });
      };
    });
  };

  // Convert data URL to blob
  const dataUrlToBlob = (dataUrl) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while(n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  };

  // Save photo to device
  const savePhoto = useCallback((photo = capturedPhoto) => {
    if (!photo) {
      setError('No photo to save');
      return false;
    }

    try {
      // Create download link
      const link = document.createElement('a');
      link.download = `hunt-photo-${new Date(photo.timestamp).toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
      link.href = photo.dataUrl;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (err) {
      setError('Failed to save photo: ' + err.message);
      return false;
    }
  }, [capturedPhoto]);

  // Upload photo to server
  const uploadPhoto = useCallback(async (photo = capturedPhoto, metadata = {}) => {
    if (!photo) {
      setError('No photo to upload');
      return null;
    }

    try {
      // Convert to blob
      const blob = dataUrlToBlob(photo.dataUrl);
      
      // Create form data
      const formData = new FormData();
      formData.append('photo', blob, `hunt-photo-${photo.id}.jpg`);
      formData.append('metadata', JSON.stringify({
        timestamp: photo.timestamp,
        location: photo.location,
        width: photo.width,
        height: photo.height,
        size: photo.size,
        quality: photo.quality,
        ...metadata
      }));

      // Check if online
      if (!navigator.onLine) {
        // Store for offline sync
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_PHOTO',
            data: {
              blob,
              metadata: {
                timestamp: photo.timestamp,
                location: photo.location,
                ...metadata
              }
            }
          });
          
          return { success: true, offline: true, id: photo.id };
        } else {
          throw new Error('Offline and no service worker available');
        }
      }

      // Upload online
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, offline: false, ...result };
    } catch (err) {
      setError('Failed to upload photo: ' + err.message);
      return { success: false, error: err.message };
    }
  }, [capturedPhoto]);

  // Switch camera (front/back)
  const switchCamera = useCallback(async () => {
    if (!isOpen || !stream) return false;

    try {
      // Close current stream
      stream.getTracks().forEach(track => track.stop());
      setIsCameraReady(false);

      // Switch facing mode
      const newFacingMode = defaultOptions.facingMode === 'environment' ? 'user' : 'environment';
      defaultOptions.facingMode = newFacingMode;

      // Open with new facing mode
      return await openCamera();
    } catch (err) {
      setError('Failed to switch camera: ' + err.message);
      return false;
    }
  }, [isOpen, stream, openCamera]);

  // Get current position for photo metadata
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  // Get human-readable camera error
  const getCameraError = (error) => {
    if (error.name === 'NotAllowedError') {
      return 'Camera access denied. Please enable camera permissions for photo capture.';
    } else if (error.name === 'NotFoundError') {
      return 'No camera found on this device.';
    } else if (error.name === 'NotSupportedError') {
      return 'Camera is not supported on this device.';
    } else if (error.name === 'NotReadableError') {
      return 'Camera is being used by another application.';
    } else {
      return `Camera error: ${error.message || 'Unknown error'}`;
    }
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    // State
    isOpen,
    isCameraReady,
    error,
    capturedPhoto,
    
    // Refs for components
    videoRef,
    canvasRef,
    
    // Actions
    openCamera,
    closeCamera,
    capturePhoto,
    savePhoto,
    uploadPhoto,
    switchCamera,
    
    // Utilities
    dataUrlToBlob,
    formatFileSize,
    
    // Computed values
    isSupported: isCameraSupported(),
    currentFacingMode: defaultOptions.facingMode,
    photoCount: capturedPhoto ? 1 : 0
  };
};