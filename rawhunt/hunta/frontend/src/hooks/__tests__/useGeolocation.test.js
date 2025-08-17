import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from '../useGeolocation';

describe('useGeolocation Hook', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock navigator.geolocation
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('getCurrentPosition', () => {
    it('should get current position successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
          altitude: 100,
          altitudeAccuracy: 5,
          heading: 90,
          speed: 0,
        },
        timestamp: Date.now(),
      };

      navigator.geolocation.getCurrentPosition.mockImplementationOnce(
        (success) => success(mockPosition)
      );

      const { result } = renderHook(() => useGeolocation());

      let position;
      await act(async () => {
        position = await result.current.getCurrentPosition();
      });

      expect(position).toEqual({
        latitude: mockPosition.coords.latitude,
        longitude: mockPosition.coords.longitude,
        accuracy: mockPosition.coords.accuracy,
        altitude: mockPosition.coords.altitude,
        altitudeAccuracy: mockPosition.coords.altitudeAccuracy,
        heading: mockPosition.coords.heading,
        speed: mockPosition.coords.speed,
        timestamp: mockPosition.timestamp,
      });

      expect(result.current.position).toEqual(position);
      expect(result.current.error).toBeNull();
    });

    it('should handle geolocation errors', async () => {
      const mockError = {
        code: 1,
        message: 'User denied Geolocation',
      };

      navigator.geolocation.getCurrentPosition.mockImplementationOnce(
        (success, error) => error(mockError)
      );

      const { result } = renderHook(() => useGeolocation());

      await act(async () => {
        try {
          await result.current.getCurrentPosition();
        } catch (error) {
          expect(error.message).toContain('Location access denied');
        }
      });

      expect(result.current.error).toContain('Location access denied');
    });

    it('should handle different error codes correctly', async () => {
      const testCases = [
        {
          code: 1,
          expected: 'Location access denied',
        },
        {
          code: 2,
          expected: 'Location information unavailable',
        },
        {
          code: 3,
          expected: 'Location request timed out',
        },
        {
          code: 99,
          expected: 'An unknown location error occurred',
        },
      ];

      for (const testCase of testCases) {
        navigator.geolocation.getCurrentPosition.mockImplementationOnce(
          (success, error) => error({ code: testCase.code })
        );

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
          try {
            await result.current.getCurrentPosition();
          } catch (error) {
            // Expected to throw
          }
        });

        expect(result.current.error).toContain(testCase.expected);
      }
    });
  });

  describe('startTracking', () => {
    it('should start tracking position', () => {
      const mockWatchId = 123;
      navigator.geolocation.watchPosition.mockReturnValue(mockWatchId);

      const { result } = renderHook(() => useGeolocation({ trackRoute: true }));

      act(() => {
        result.current.startTracking();
      });

      expect(result.current.isTracking).toBe(true);
      expect(navigator.geolocation.watchPosition).toHaveBeenCalled();
    });

    it('should stop tracking position', () => {
      const mockWatchId = 123;
      navigator.geolocation.watchPosition.mockReturnValue(mockWatchId);

      const { result } = renderHook(() => useGeolocation({ trackRoute: true }));

      act(() => {
        result.current.startTracking();
      });

      expect(result.current.isTracking).toBe(true);

      act(() => {
        result.current.stopTracking();
      });

      expect(result.current.isTracking).toBe(false);
      expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(mockWatchId);
    });

    it('should add positions to route when tracking', () => {
      const mockPositions = [
        {
          coords: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 10,
          },
          timestamp: Date.now(),
        },
        {
          coords: {
            latitude: 40.7130,
            longitude: -74.0062,
            accuracy: 10,
          },
          timestamp: Date.now() + 1000,
        },
      ];

      let positionCallback;
      navigator.geolocation.watchPosition.mockImplementation((callback) => {
        positionCallback = callback;
        return 123;
      });

      const { result } = renderHook(() => 
        useGeolocation({ trackRoute: true, minDistance: 1 })
      );

      act(() => {
        result.current.startTracking();
      });

      // Simulate position updates
      act(() => {
        positionCallback(mockPositions[0]);
      });

      expect(result.current.route).toHaveLength(1);
      expect(result.current.route[0].latitude).toBe(40.7128);

      act(() => {
        positionCallback(mockPositions[1]);
      });

      expect(result.current.route).toHaveLength(2);
      expect(result.current.route[1].latitude).toBe(40.7130);
    });
  });

  describe('waypoint management', () => {
    it('should add waypoint at current location', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
          altitude: 100,
        },
        timestamp: Date.now(),
      };

      navigator.geolocation.getCurrentPosition.mockImplementationOnce(
        (success) => success(mockPosition)
      );

      const { result } = renderHook(() => useGeolocation());

      let waypoint;
      await act(async () => {
        waypoint = await result.current.addWaypoint('Test Point', 'custom');
      });

      expect(waypoint).toMatchObject({
        name: 'Test Point',
        type: 'custom',
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        elevation: 100,
      });

      expect(result.current.waypoints).toHaveLength(1);
      expect(result.current.waypoints[0]).toEqual(waypoint);
    });

    it('should remove waypoint by id', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      navigator.geolocation.getCurrentPosition.mockImplementationOnce(
        (success) => success(mockPosition)
      );

      const { result } = renderHook(() => useGeolocation());

      let waypoint;
      await act(async () => {
        waypoint = await result.current.addWaypoint('Test Point');
      });

      expect(result.current.waypoints).toHaveLength(1);

      act(() => {
        result.current.removeWaypoint(waypoint.id);
      });

      expect(result.current.waypoints).toHaveLength(0);
    });

    it('should clear all waypoints', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      navigator.geolocation.getCurrentPosition
        .mockImplementationOnce((success) => success(mockPosition))
        .mockImplementationOnce((success) => success(mockPosition));

      const { result } = renderHook(() => useGeolocation());

      // Add multiple waypoints
      await act(async () => {
        await result.current.addWaypoint('Point 1');
        await result.current.addWaypoint('Point 2');
      });

      expect(result.current.waypoints).toHaveLength(2);

      act(() => {
        result.current.clearWaypoints();
      });

      expect(result.current.waypoints).toHaveLength(0);
    });
  });

  describe('distance calculations', () => {
    it('should calculate distance between two points', () => {
      const { result } = renderHook(() => useGeolocation());

      const point1 = { latitude: 40.7128, longitude: -74.0060 };
      const point2 = { latitude: 40.7614, longitude: -73.9776 };

      const distance = result.current.calculateDistance(point1, point2);

      // Distance between NYC coordinates should be roughly 5.2 km
      expect(distance).toBeGreaterThan(5000);
      expect(distance).toBeLessThan(6000);
    });

    it('should calculate total route distance', () => {
      const { result } = renderHook(() => useGeolocation({ trackRoute: true }));

      const mockRoute = [
        { latitude: 40.7128, longitude: -74.0060, timestamp: Date.now() },
        { latitude: 40.7130, longitude: -74.0062, timestamp: Date.now() + 1000 },
        { latitude: 40.7132, longitude: -74.0064, timestamp: Date.now() + 2000 },
      ];

      // Manually set route for testing
      act(() => {
        result.current.route.push(...mockRoute);
      });

      const totalDistance = result.current.getRouteDistance();
      expect(totalDistance).toBeGreaterThan(0);
    });
  });

  describe('GPX export', () => {
    it('should export route as GPX', async () => {
      const { result } = renderHook(() => useGeolocation());

      // Set up mock route and waypoints
      const mockRoute = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          altitude: 100,
          timestamp: Date.now(),
        },
        {
          latitude: 40.7130,
          longitude: -74.0062,
          altitude: 102,
          timestamp: Date.now() + 1000,
        },
      ];

      const mockWaypoint = {
        id: '1',
        name: 'Test Point',
        type: 'custom',
        latitude: 40.7129,
        longitude: -74.0061,
        elevation: 101,
        timestamp: Date.now(),
      };

      // Manually set route and waypoints
      act(() => {
        result.current.route.push(...mockRoute);
        result.current.waypoints.push(mockWaypoint);
      });

      const gpx = result.current.exportRouteGPX();

      expect(gpx).toContain('<?xml version="1.0"');
      expect(gpx).toContain('<gpx');
      expect(gpx).toContain('<trkpt lat="40.7128" lon="-74.0060">');
      expect(gpx).toContain('<trkpt lat="40.7130" lon="-74.0062">');
      expect(gpx).toContain('<wpt lat="40.7129" lon="-74.0061">');
      expect(gpx).toContain('<name>Test Point</name>');
    });

    it('should return null for empty route', () => {
      const { result } = renderHook(() => useGeolocation());

      const gpx = result.current.exportRouteGPX();
      expect(gpx).toBeNull();
    });
  });

  describe('utility functions', () => {
    it('should generate Google Maps URL', () => {
      const { result } = renderHook(() => useGeolocation());

      const url = result.current.getGoogleMapsUrl(40.7128, -74.0060);
      expect(url).toBe('https://maps.google.com/?q=40.7128,-74.0060');
    });

    it('should return null for invalid coordinates', () => {
      const { result } = renderHook(() => useGeolocation());

      const url = result.current.getGoogleMapsUrl(null, null);
      expect(url).toBeNull();
    });

    it('should check if geolocation is supported', () => {
      const { result } = renderHook(() => useGeolocation());

      expect(result.current.isLocationSupported).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', () => {
      const mockWatchId = 123;
      navigator.geolocation.watchPosition.mockReturnValue(mockWatchId);

      const { result, unmount } = renderHook(() => useGeolocation());

      act(() => {
        result.current.startTracking();
      });

      expect(result.current.isTracking).toBe(true);

      unmount();

      expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(mockWatchId);
    });
  });
});