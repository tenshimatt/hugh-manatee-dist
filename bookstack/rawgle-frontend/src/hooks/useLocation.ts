import { useState, useEffect, useCallback } from 'react'
import { LocationData, LocationDetectionResponse } from '@/types/store'
import { locationService } from '@/services/locationService'

interface UseLocationState {
  location: LocationData | null
  loading: boolean
  error: string | null
  permission: 'granted' | 'denied' | 'prompt' | 'unsupported'
}

interface UseLocationReturn extends UseLocationState {
  getCurrentLocation: () => Promise<void>
  getIPLocation: () => Promise<void>
  geocodeAddress: (address: string) => Promise<LocationData | null>
  clearLocation: () => void
  clearError: () => void
}

/**
 * Hook for managing user location detection
 */
export function useLocation(): UseLocationReturn {
  const [state, setState] = useState<UseLocationState>({
    location: null,
    loading: false,
    error: null,
    permission: 'prompt'
  })

  // Check geolocation permission status
  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, permission: 'unsupported' }))
      return
    }

    // Check permission if available
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setState(prev => ({ ...prev, permission: result.state as any }))
      }).catch(() => {
        // Permission API not available, keep as 'prompt'
      })
    }
  }, [])

  const getCurrentLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await locationService.getCurrentLocation()
      
      if (result.success && result.location) {
        setState(prev => ({
          ...prev,
          location: result.location!,
          loading: false,
          error: null,
          permission: 'granted'
        }))
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || result.message,
          permission: result.error === 'Permission denied' ? 'denied' : prev.permission
        }))
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to get location'
      }))
    }
  }, [])

  const getIPLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await locationService.getIPLocation()
      
      if (result.success && result.location) {
        setState(prev => ({
          ...prev,
          location: result.location!,
          loading: false,
          error: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || result.message
        }))
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to get IP location'
      }))
    }
  }, [])

  const geocodeAddress = useCallback(async (address: string): Promise<LocationData | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await locationService.geocodeAddress(address)
      
      if (result.success && result.location) {
        setState(prev => ({
          ...prev,
          location: result.location!,
          loading: false,
          error: null
        }))
        return result.location
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || result.message
        }))
        return null
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to geocode address'
      }))
      return null
    }
  }, [])

  const clearLocation = useCallback(() => {
    setState(prev => ({
      ...prev,
      location: null,
      error: null
    }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    getCurrentLocation,
    getIPLocation,
    geocodeAddress,
    clearLocation,
    clearError
  }
}

/**
 * Hook for automatically getting user location on mount
 */
export function useAutoLocation(options: { 
  enableGPS?: boolean
  enableIP?: boolean
  enableAutoDetect?: boolean
} = {}): UseLocationReturn {
  const {
    enableGPS = true,
    enableIP = true,
    enableAutoDetect = true
  } = options

  const location = useLocation()

  useEffect(() => {
    if (!enableAutoDetect || location.location || location.loading) {
      return
    }

    const detectLocation = async () => {
      if (enableGPS) {
        // Try GPS first
        await location.getCurrentLocation()
        
        // If GPS worked, we're done
        if (location.location) {
          return
        }
      }

      if (enableIP) {
        // Fallback to IP location
        await location.getIPLocation()
      }
    }

    detectLocation()
  }, [enableAutoDetect, enableGPS, enableIP, location])

  return location
}

export default useLocation