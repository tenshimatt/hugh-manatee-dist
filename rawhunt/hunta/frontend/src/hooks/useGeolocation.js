import { useState, useEffect, useRef } from 'react';

/**
 * useGeolocation Hook
 * Provides GPS location services optimized for hunting scenarios
 * Includes route tracking, waypoint management, and battery optimization
 */
export const useGeolocation = (options = {}) => {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [route, setRoute] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const watchIdRef = useRef(null);
  const routeIntervalRef = useRef(null);

  // Default options optimized for hunting scenarios
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 30000, // 30 seconds cache for battery optimization
    trackRoute: false,
    routeInterval: 10000, // Track route every 10 seconds
    minDistance: 5, // Only update if moved 5+ meters
    ...options
  };

  // Get current position
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const location = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp
          };
          
          setPosition(location);
          setError(null);
          resolve(location);
        },
        (err) => {
          const errorMessage = getGeolocationError(err);
          setError(errorMessage);
          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  };

  // Start watching position (for route tracking)
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }

    setIsTracking(true);
    setError(null);

    // Clear any existing watch
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp
        };

        setPosition(location);
        setError(null);

        // Add to route if tracking and moved minimum distance
        if (defaultOptions.trackRoute) {
          setRoute(prevRoute => {
            const lastPoint = prevRoute[prevRoute.length - 1];
            if (!lastPoint || calculateDistance(lastPoint, location) >= defaultOptions.minDistance) {
              return [...prevRoute, location];
            }
            return prevRoute;
          });
        }
      },
      (err) => {
        const errorMessage = getGeolocationError(err);
        setError(errorMessage);
        setIsTracking(false);
      },
      defaultOptions
    );

    // Set up route tracking interval if enabled
    if (defaultOptions.trackRoute && defaultOptions.routeInterval) {
      routeIntervalRef.current = setInterval(() => {
        getCurrentPosition().catch(() => {
          // Silent fail for interval updates
        });
      }, defaultOptions.routeInterval);
    }
  };

  // Stop watching position
  const stopTracking = () => {
    setIsTracking(false);
    
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (routeIntervalRef.current) {
      clearInterval(routeIntervalRef.current);
      routeIntervalRef.current = null;
    }
  };

  // Add waypoint at current location
  const addWaypoint = async (name = '', type = 'custom') => {
    try {
      const currentPos = await getCurrentPosition();
      const waypoint = {
        id: Date.now().toString(),
        name: name || `Waypoint ${waypoints.length + 1}`,
        type, // 'game', 'blind', 'parking', 'water', 'custom'
        latitude: currentPos.latitude,
        longitude: currentPos.longitude,
        accuracy: currentPos.accuracy,
        timestamp: Date.now(),
        elevation: currentPos.altitude
      };
      
      setWaypoints(prev => [...prev, waypoint]);
      return waypoint;
    } catch (error) {
      throw new Error(`Failed to add waypoint: ${error.message}`);
    }
  };

  // Remove waypoint
  const removeWaypoint = (waypointId) => {
    setWaypoints(prev => prev.filter(wp => wp.id !== waypointId));
  };

  // Clear route data
  const clearRoute = () => {
    setRoute([]);
  };

  // Clear all waypoints
  const clearWaypoints = () => {
    setWaypoints([]);
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (point1, point2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Get total route distance
  const getRouteDistance = () => {
    if (route.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < route.length; i++) {
      totalDistance += calculateDistance(route[i - 1], route[i]);
    }
    return totalDistance;
  };

  // Get route duration
  const getRouteDuration = () => {
    if (route.length < 2) return 0;
    return route[route.length - 1].timestamp - route[0].timestamp;
  };

  // Convert position to Google Maps URL
  const getGoogleMapsUrl = (lat = position?.latitude, lng = position?.longitude) => {
    if (!lat || !lng) return null;
    return `https://maps.google.com/?q=${lat},${lng}`;
  };

  // Export route as GPX
  const exportRouteGPX = () => {
    if (route.length === 0) return null;

    const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GoHunta" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Hunt Route</name>
    <desc>Route tracked by GoHunta</desc>
    <time>${new Date(route[0].timestamp).toISOString()}</time>
  </metadata>
  <trk>
    <name>Hunt Track</name>
    <trkseg>`;

    const trackPoints = route.map(point => 
      `      <trkpt lat="${point.latitude}" lon="${point.longitude}">
        <ele>${point.altitude || 0}</ele>
        <time>${new Date(point.timestamp).toISOString()}</time>
      </trkpt>`
    ).join('\n');

    const waypointData = waypoints.map(wp => 
      `  <wpt lat="${wp.latitude}" lon="${wp.longitude}">
    <ele>${wp.elevation || 0}</ele>
    <time>${new Date(wp.timestamp).toISOString()}</time>
    <name>${wp.name}</name>
    <type>${wp.type}</type>
  </wpt>`
    ).join('\n');

    const gpxFooter = `    </trkseg>
  </trk>
${waypointData}
</gpx>`;

    return gpxHeader + '\n' + trackPoints + '\n' + gpxFooter;
  };

  // Get human-readable error message
  const getGeolocationError = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access denied. Please enable location permissions for field use.';
      case error.POSITION_UNAVAILABLE:
        return 'Location information unavailable. Try moving to an area with better GPS signal.';
      case error.TIMEOUT:
        return 'Location request timed out. Check your device\'s GPS settings.';
      default:
        return 'An unknown location error occurred.';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return {
    // Current state
    position,
    error,
    isTracking,
    route,
    waypoints,
    
    // Actions
    getCurrentPosition,
    startTracking,
    stopTracking,
    addWaypoint,
    removeWaypoint,
    clearRoute,
    clearWaypoints,
    
    // Utilities
    calculateDistance,
    getRouteDistance,
    getRouteDuration,
    getGoogleMapsUrl,
    exportRouteGPX,
    
    // Computed values
    routeDistance: getRouteDistance(),
    routeDuration: getRouteDuration(),
    isLocationSupported: 'geolocation' in navigator
  };
};