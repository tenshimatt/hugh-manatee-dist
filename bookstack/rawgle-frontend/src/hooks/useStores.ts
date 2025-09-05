import { useState, useCallback, useEffect } from 'react'
import { Store, StoreSearchResponse, LocationSearchParams, StoreType } from '@/types/store'
import { storeService } from '@/services/storeService'

interface UseStoresState {
  stores: Store[]
  loading: boolean
  error: string | null
  total: number
  lastQuery: LocationSearchParams | null
}

interface UseStoresReturn extends UseStoresState {
  searchNearbyStores: (params: LocationSearchParams) => Promise<void>
  searchStoresByAddress: (address: string, params: Omit<LocationSearchParams, 'latitude' | 'longitude'>) => Promise<void>
  getStoreById: (id: string) => Store | null
  clearStores: () => void
  clearError: () => void
  refreshStores: () => Promise<void>
}

/**
 * Hook for managing store searches and data
 */
export function useStores(): UseStoresReturn {
  const [state, setState] = useState<UseStoresState>({
    stores: [],
    loading: false,
    error: null,
    total: 0,
    lastQuery: null
  })

  const searchNearbyStores = useCallback(async (params: LocationSearchParams) => {
    setState(prev => ({ ...prev, loading: true, error: null, lastQuery: params }))
    
    try {
      const result = await storeService.searchNearbyStores(params)
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          stores: result.stores,
          total: result.total,
          loading: false,
          error: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          stores: [],
          total: 0,
          loading: false,
          error: result.error || 'Failed to search stores'
        }))
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        stores: [],
        total: 0,
        loading: false,
        error: error.message || 'Failed to search stores'
      }))
    }
  }, [])

  const searchStoresByAddress = useCallback(async (
    address: string, 
    params: Omit<LocationSearchParams, 'latitude' | 'longitude'>
  ) => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      lastQuery: { ...params, address, latitude: 0, longitude: 0 }
    }))
    
    try {
      const result = await storeService.searchStoresByAddress(address, params)
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          stores: result.stores,
          total: result.total,
          loading: false,
          error: null,
          lastQuery: result.query
        }))
      } else {
        setState(prev => ({
          ...prev,
          stores: [],
          total: 0,
          loading: false,
          error: result.error || 'Failed to search stores by address'
        }))
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        stores: [],
        total: 0,
        loading: false,
        error: error.message || 'Failed to search stores by address'
      }))
    }
  }, [])

  const getStoreById = useCallback((id: string): Store | null => {
    return state.stores.find(store => store.id === id) || storeService.getStoreById(id)
  }, [state.stores])

  const clearStores = useCallback(() => {
    setState(prev => ({
      ...prev,
      stores: [],
      total: 0,
      error: null,
      lastQuery: null
    }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const refreshStores = useCallback(async () => {
    if (!state.lastQuery) {
      return
    }

    if (state.lastQuery.address) {
      await searchStoresByAddress(state.lastQuery.address, {
        radius: state.lastQuery.radius,
        storeType: state.lastQuery.storeType,
        openNow: state.lastQuery.openNow,
        hasDelivery: state.lastQuery.hasDelivery,
        hasCurbsidePickup: state.lastQuery.hasCurbsidePickup,
        limit: state.lastQuery.limit,
        sortBy: state.lastQuery.sortBy
      })
    } else {
      await searchNearbyStores(state.lastQuery)
    }
  }, [state.lastQuery, searchNearbyStores, searchStoresByAddress])

  return {
    ...state,
    searchNearbyStores,
    searchStoresByAddress,
    getStoreById,
    clearStores,
    clearError,
    refreshStores
  }
}

/**
 * Hook for getting store metadata and statistics
 */
export function useStoreMetadata() {
  const [storeTypes, setStoreTypes] = useState<StoreType[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])
  const [productCategories, setProductCategories] = useState<string[]>([])
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    // Load metadata on mount
    setStoreTypes(storeService.getStoreTypes())
    setSpecialties(storeService.getSpecialties())
    setProductCategories(storeService.getProductCategories())
    setStats(storeService.getStoreStats())
  }, [])

  return {
    storeTypes,
    specialties,
    productCategories,
    stats
  }
}

/**
 * Hook for managing store filters
 */
export function useStoreFilters() {
  const [filters, setFilters] = useState<Partial<LocationSearchParams>>({
    radius: 25,
    sortBy: 'distance',
    limit: 50
  })

  const updateFilter = useCallback(<K extends keyof LocationSearchParams>(
    key: K,
    value: LocationSearchParams[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateFilters = useCallback((newFilters: Partial<LocationSearchParams>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      radius: 25,
      sortBy: 'distance',
      limit: 50
    })
  }, [])

  const getSearchParams = useCallback((baseParams: { latitude: number; longitude: number }): LocationSearchParams => {
    return {
      ...baseParams,
      radius: filters.radius || 25,
      storeType: filters.storeType,
      openNow: filters.openNow,
      hasDelivery: filters.hasDelivery,
      hasCurbsidePickup: filters.hasCurbsidePickup,
      limit: filters.limit || 50,
      sortBy: filters.sortBy || 'distance'
    }
  }, [filters])

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    getSearchParams
  }
}

export default useStores