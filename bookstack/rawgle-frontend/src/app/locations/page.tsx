'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  MapPin, 
  Search, 
  Filter,
  Navigation,
  Clock,
  Phone,
  Star,
  Loader2,
  X,
  MapIcon,
  List,
  Target,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useLocation, useAutoLocation } from '@/hooks/useLocation'
import { useStores, useStoreFilters } from '@/hooks/useStores'
import { Store } from '@/types/store'

// Import our new components
import StoreMap from '@/components/store-locator/store-map'
import StoreList from '@/components/store-locator/store-list'
import StoreFilters, { StoreFilterState } from '@/components/store-locator/store-filters'
import LocationSearch from '@/components/store-locator/location-search'
import StoreDetailModal from '@/components/store-locator/store-detail-modal'

interface LocationState {
  lat: number
  lng: number
  address: string
}

interface ViewState {
  type: 'list' | 'map'
  selectedStore: Store | null
  detailModalOpen: boolean
}

export default function LocationsPage() {
  // Hooks for location and store management following Archon specifications
  const location = useAutoLocation({ enableGPS: true, enableIP: true, enableAutoDetect: true })
  const stores = useStores()
  const storeFilters = useStoreFilters()
  
  // Local state following Archon US005 requirements
  const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null)
  const [viewState, setViewState] = useState<ViewState>({
    type: 'list',
    selectedStore: null,
    detailModalOpen: false
  })
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Perform store search based on location (Archon requirement: nearby store search)
  const handleLocationSearch = useCallback(async (locationData: LocationState) => {
    const searchParams = storeFilters.getSearchParams({
      latitude: locationData.lat,
      longitude: locationData.lng
    })
    
    try {
      await stores.searchNearbyStores(searchParams)
    } catch (error) {
      console.error('Store search failed:', error)
    }
  }, [stores, storeFilters])

  // Initialize location and search when available (Archon requirement: IP-based + GPS fallback)
  useEffect(() => {
    if (location.location?.latitude && location.location?.longitude) {
      const locationData = {
        lat: location.location.latitude,
        lng: location.location.longitude,
        address: location.location.city ? 
          `${location.location.city}${location.location.region ? `, ${location.location.region}` : ''}` : 
          'Current Location'
      }
      setCurrentLocation(locationData)
      handleLocationSearch(locationData)
    }
  }, [location.location, handleLocationSearch])

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('store-locator-recent-searches')
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error)
    }
  }, [])

  // Save recent searches to localStorage
  const updateRecentSearches = useCallback((searches: string[]) => {
    setRecentSearches(searches)
    try {
      localStorage.setItem('store-locator-recent-searches', JSON.stringify(searches))
    } catch (error) {
      console.error('Failed to save recent searches:', error)
    }
  }, [])

  // Handle location selection from search (Archon requirement: address search + geocoding)
  const handleLocationSelect = useCallback(async (locationData: LocationState) => {
    setCurrentLocation(locationData)
    await handleLocationSearch(locationData)
  }, [handleLocationSearch])

  // Handle current location detection (Archon requirement: GPS + IP fallback)
  const handleUseCurrentLocation = useCallback(async () => {
    try {
      if (location.permission === 'denied') {
        // Fallback to IP location if GPS denied
        await location.getIPLocation()
      } else {
        await location.getCurrentLocation()
      }
    } catch (error) {
      console.error('Location detection failed:', error)
    }
  }, [location])

  // Handle filter changes (Archon requirement: comprehensive filtering)
  const handleFiltersChange = useCallback((newFilters: Partial<StoreFilterState>) => {
    storeFilters.updateFilters(newFilters)
    
    // Re-search with new filters if we have a location
    if (currentLocation) {
      handleLocationSearch(currentLocation)
    }
  }, [storeFilters, currentLocation, handleLocationSearch])

  // Handle store selection (Archon requirement: store detail view)
  const handleStoreClick = useCallback((store: Store) => {
    setViewState(prev => ({
      ...prev,
      selectedStore: store,
      detailModalOpen: true
    }))
  }, [])

  // Handle map center change
  const getMapCenter = (): [number, number] => {
    if (currentLocation) {
      return [currentLocation.lat, currentLocation.lng]
    }
    // Default to San Francisco Bay Area
    return [37.7749, -122.4194]
  }

  // Get active filters count for UI
  const getActiveFiltersCount = () => {
    let count = 0
    if (storeFilters.filters.storeType) count++
    if (storeFilters.filters.openNow) count++
    if (storeFilters.filters.hasDelivery) count++
    if (storeFilters.filters.hasCurbsidePickup) count++
    return count
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Archon US005 Requirements */}
      <header className="bg-gradient-to-r from-charcoal via-pumpkin to-sunglow text-white py-12" role="banner">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Find Raw Pet Food Stores Near You
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Discover verified suppliers, butcher shops, farms, and co-ops for quality raw pet food
            </p>
            
            {/* Location Search - Archon Specification */}
            <div className="max-w-2xl mx-auto">
              <LocationSearch
                onLocationSelect={handleLocationSelect}
                onUseCurrentLocation={handleUseCurrentLocation}
                loading={stores.loading}
                currentLocationLoading={location.loading}
                placeholder="Enter address, city, or zip code"
                recentSearches={recentSearches}
                onRecentSearchesChange={updateRecentSearches}
                className="mb-4"
              />
              
              {location.error && (
                <div className="text-red-100 text-sm mt-2 flex items-center gap-2" role="alert">
                  <AlertCircle className="w-4 h-4" />
                  {location.error}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {currentLocation && stores.stores.length > 0 && (
              <div className="mt-6 flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{stores.stores.length} stores found</span>
                </div>
                {stores.stores.some(s => s.isOpen) && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{stores.stores.filter(s => s.isOpen).length} open now</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Filters Sidebar - Archon US005 Requirements */}
          <div className="lg:w-1/4">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="w-full"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
            </div>

            <div className={`lg:block ${showMobileFilters ? 'block' : 'hidden'}`}>
              <StoreFilters
                filters={{
                  radius: storeFilters.filters.radius || 25,
                  storeType: storeFilters.filters.storeType,
                  openNow: storeFilters.filters.openNow || false,
                  hasDelivery: storeFilters.filters.hasDelivery || false,
                  hasCurbsidePickup: storeFilters.filters.hasCurbsidePickup || false,
                  sortBy: (storeFilters.filters.sortBy as 'distance' | 'rating' | 'name') || 'distance'
                }}
                onFiltersChange={handleFiltersChange}
                onReset={storeFilters.resetFilters}
                activeFiltersCount={getActiveFiltersCount()}
                className="lg:sticky lg:top-4"
              />
            </div>
          </div>

          {/* Results Section - Archon US005 Specifications */}
          <main className="lg:w-3/4" role="main">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold" id="results-heading">
                  {stores.stores.length} Results
                  {currentLocation && (
                    <span className="text-lg text-gray-600 font-normal ml-2">
                      near {currentLocation.address}
                    </span>
                  )}
                </h2>
                
                {stores.stores.length > 0 && (
                  <p className="text-gray-600 text-sm mt-1">
                    Sorted by {storeFilters.filters.sortBy || 'distance'} • 
                    Within {storeFilters.filters.radius || 25} miles
                  </p>
                )}
                
                {stores.error && (
                  <div className="text-red-600 text-sm mt-2 flex items-center gap-2" role="alert">
                    <AlertCircle className="w-4 h-4" />
                    {stores.error}
                  </div>
                )}
              </div>
              
              {/* View Toggle */}
              <div className="flex gap-2" role="group" aria-label="View options">
                <Button
                  variant={viewState.type === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewState(prev => ({ ...prev, type: 'list' }))}
                  aria-pressed={viewState.type === 'list'}
                >
                  <List className="mr-2 h-4 w-4" />
                  List
                </Button>
                <Button
                  variant={viewState.type === 'map' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewState(prev => ({ ...prev, type: 'map' }))}
                  aria-pressed={viewState.type === 'map'}
                >
                  <MapIcon className="mr-2 h-4 w-4" />
                  Map
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {stores.loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-pumpkin" />
                  <p className="text-gray-600">Finding stores near you...</p>
                </div>
              </div>
            )}

            {/* Store List View - Archon US005 List View Requirements */}
            {viewState.type === 'list' && !stores.loading && (
              <StoreList
                stores={stores.stores}
                loading={stores.loading}
                onStoreClick={handleStoreClick}
                className="space-y-4"
              />
            )}

            {/* Store Map View - Archon US005 Map View Requirements */}
            {viewState.type === 'map' && !stores.loading && stores.stores.length > 0 && (
              <div className="rounded-lg overflow-hidden">
                <StoreMap
                  stores={stores.stores}
                  center={getMapCenter()}
                  zoom={12}
                  height="600px"
                  onStoreClick={handleStoreClick}
                  className="w-full"
                />
              </div>
            )}

            {/* No Results State */}
            {!stores.loading && stores.stores.length === 0 && currentLocation && (
              <Card className="p-12 text-center">
                <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">No Stores Found</h3>
                <p className="text-gray-600 mb-4">
                  No raw pet food stores found within {storeFilters.filters.radius || 25} miles of your location.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => handleFiltersChange({ radius: Math.min((storeFilters.filters.radius || 25) * 2, 100) })}
                  >
                    Expand Search Radius
                  </Button>
                  <Button onClick={storeFilters.resetFilters}>
                    Reset Filters
                  </Button>
                </div>
              </Card>
            )}

            {/* Welcome State - No Location Yet */}
            {!stores.loading && stores.stores.length === 0 && !currentLocation && (
              <Card className="p-12 text-center">
                <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Find Stores Near You</h3>
                <p className="text-gray-600 mb-4">
                  Enter your location above or use your current location to discover raw pet food stores in your area.
                </p>
                <Button onClick={handleUseCurrentLocation} disabled={location.loading}>
                  {location.loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Detecting Location...
                    </>
                  ) : (
                    <>
                      <Target className="mr-2 h-4 w-4" />
                      Use My Location
                    </>
                  )}
                </Button>
              </Card>
            )}
          </main>
        </div>
      </div>

      {/* Store Detail Modal - Archon US005 Store Detail Requirements */}
      {viewState.selectedStore && (
        <StoreDetailModal
          store={viewState.selectedStore}
          open={viewState.detailModalOpen && !!viewState.selectedStore}
          onOpenChange={(open) => 
            setViewState(prev => ({ ...prev, detailModalOpen: open }))
          }
        />
      )}
    </div>
  )
}