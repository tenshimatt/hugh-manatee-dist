'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Store } from '@/types/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Clock, ExternalLink, Navigation, Maximize2, Minimize2 } from 'lucide-react'

// Lazy load Leaflet components to avoid SSR issues
const MapContainer = React.lazy(() => 
  import('react-leaflet').then(module => ({ default: module.MapContainer }))
)
const TileLayer = React.lazy(() => 
  import('react-leaflet').then(module => ({ default: module.TileLayer }))
)
const Marker = React.lazy(() => 
  import('react-leaflet').then(module => ({ default: module.Marker }))
)
const Popup = React.lazy(() => 
  import('react-leaflet').then(module => ({ default: module.Popup }))
)

interface StoreMapProps {
  stores: Store[]
  center: [number, number]
  zoom?: number
  height?: string
  onStoreClick?: (store: Store) => void
  className?: string
}

interface StorePopupProps {
  store: Store
  onViewDetails?: (store: Store) => void
  onGetDirections?: (store: Store) => void
}

const StorePopup: React.FC<StorePopupProps> = ({ 
  store, 
  onViewDetails, 
  onGetDirections 
}) => (
  <div className="min-w-[280px] p-2">
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 text-sm mb-1">
          {store.name}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          {store.isVerified && (
            <Badge variant="secondary" className="text-xs">
              Verified
            </Badge>
          )}
          {store.isOpen ? (
            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
              Open Now
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Closed
            </Badge>
          )}
        </div>
      </div>
      {store.rating && (
        <div className="flex items-center gap-1 text-xs">
          <span className="text-yellow-500">★</span>
          <span className="font-medium">{store.rating}</span>
          <span className="text-gray-500">({store.reviewCount})</span>
        </div>
      )}
    </div>

    <div className="space-y-1 mb-3 text-xs text-gray-600">
      <div className="flex items-start gap-1">
        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <div>
          <div>{store.address}</div>
          <div>{store.city}, {store.state} {store.zipCode}</div>
          {store.distance && (
            <div className="text-gray-500 font-medium">
              {store.distance} miles away
            </div>
          )}
        </div>
      </div>

      {store.phone && (
        <div className="flex items-center gap-1">
          <Phone className="w-3 h-3 flex-shrink-0" />
          <a 
            href={`tel:${store.phone}`} 
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {store.phone}
          </a>
        </div>
      )}

      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3 flex-shrink-0" />
        <span>
          {store.isOpen ? 'Open Now' : 'Currently Closed'}
        </span>
      </div>
    </div>

    {store.specialties && store.specialties.length > 0 && (
      <div className="mb-3">
        <div className="flex flex-wrap gap-1">
          {store.specialties.slice(0, 3).map((specialty, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="text-xs text-gray-600"
            >
              {specialty}
            </Badge>
          ))}
        </div>
      </div>
    )}

    <div className="flex gap-1">
      <Button
        size="sm"
        variant="outline"
        className="text-xs h-7 flex-1"
        onClick={(e) => {
          e.stopPropagation()
          onViewDetails?.(store)
        }}
      >
        <ExternalLink className="w-3 h-3 mr-1" />
        Details
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-xs h-7 flex-1"
        onClick={(e) => {
          e.stopPropagation()
          onGetDirections?.(store)
        }}
      >
        <Navigation className="w-3 h-3 mr-1" />
        Directions
      </Button>
    </div>
  </div>
)

export const StoreMap: React.FC<StoreMapProps> = ({
  stores = [],
  center,
  zoom = 12,
  height = '400px',
  onStoreClick,
  className = ''
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Load Leaflet CSS
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      // Fix marker icons issue
      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })
        setIsMapLoaded(true)
      })
    }
  }, [])

  const handleStoreClick = useCallback((store: Store) => {
    onStoreClick?.(store)
  }, [onStoreClick])

  const handleGetDirections = useCallback((store: Store) => {
    const query = encodeURIComponent(`${store.address}, ${store.city}, ${store.state} ${store.zipCode}`)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${query}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen && mapContainerRef.current) {
      if (mapContainerRef.current.requestFullscreen) {
        mapContainerRef.current.requestFullscreen()
      }
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
    }
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (!isMapLoaded) {
    return (
      <div 
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <div>Loading map...</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={mapContainerRef}
      className={`relative rounded-lg overflow-hidden border ${className}`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* Map Controls */}
      <div className="absolute top-2 right-2 z-[1000] flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="bg-white shadow-md"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </Button>
      </div>

      <React.Suspense fallback={
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="animate-pulse">Loading map...</div>
        </div>
      }>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {stores.map((store) => (
            <Marker
              key={store.id}
              position={[store.latitude, store.longitude]}
              eventHandlers={{
                click: () => handleStoreClick(store),
              }}
            >
              <Popup>
                <StorePopup
                  store={store}
                  onViewDetails={handleStoreClick}
                  onGetDirections={handleGetDirections}
                />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </React.Suspense>
    </div>
  )
}

export default StoreMap