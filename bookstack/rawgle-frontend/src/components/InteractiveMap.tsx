'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Store } from '@/types/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Star, 
  Phone, 
  Route, 
  ExternalLink,
  Clock,
  Truck,
  ShoppingCart,
  Award
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom marker icons for different store types
const createCustomIcon = (storeType: string, isSelected: boolean = false, isHovered: boolean = false) => {
  const colors = {
    pet_store: isSelected || isHovered ? '#15803d' : '#16a34a', // green
    butcher: isSelected || isHovered ? '#dc2626' : '#ef4444', // red
    co_op: isSelected || isHovered ? '#2563eb' : '#3b82f6', // blue
    farm: isSelected || isHovered ? '#ca8a04' : '#eab308', // yellow
    online: isSelected || isHovered ? '#7c3aed' : '#8b5cf6', // purple
  }
  
  const color = colors[storeType as keyof typeof colors] || colors.pet_store
  const size = isSelected || isHovered ? 32 : 25
  
  return new L.DivIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transform: rotate(-45deg);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${getStoreIcon(storeType)}
        </div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  })
}

// Get store type icon
const getStoreIcon = (storeType: string): string => {
  const icons = {
    pet_store: '🏪',
    butcher: '🥩', 
    co_op: '🤝',
    farm: '🚜',
    online: '🌐'
  }
  return icons[storeType as keyof typeof icons] || '📍'
}

// Helper component to handle map updates
function MapController({ 
  stores, 
  userLocation, 
  selectedStore,
  onStoreSelect 
}: {
  stores: Store[]
  userLocation: { latitude: number; longitude: number } | null
  selectedStore: string | null
  onStoreSelect: (id: string | null) => void
}) {
  const map = useMap()
  
  useEffect(() => {
    if (stores.length > 0) {
      const bounds = L.latLngBounds([])
      
      // Add user location to bounds if available
      if (userLocation) {
        bounds.extend([userLocation.latitude, userLocation.longitude])
      }
      
      // Add all store locations to bounds
      stores.forEach(store => {
        bounds.extend([store.latitude, store.longitude])
      })
      
      // Fit map to show all markers with padding
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    } else if (userLocation) {
      // If no stores but user location available, center on user
      map.setView([userLocation.latitude, userLocation.longitude], 13)
    }
  }, [stores, userLocation, map])
  
  // Handle selected store centering
  useEffect(() => {
    if (selectedStore) {
      const store = stores.find(s => s.id === selectedStore)
      if (store) {
        map.setView([store.latitude, store.longitude], 15, {
          animate: true,
          duration: 0.5
        })
      }
    }
  }, [selectedStore, stores, map])
  
  return null
}

interface InteractiveMapProps {
  stores: Store[]
  userLocation: { latitude: number; longitude: number } | null
  selectedStore: string | null
  hoveredStore: string | null
  onStoreSelect: (id: string | null) => void
  onStoreHover: (id: string | null) => void
  className?: string
}

export default function InteractiveMap({
  stores,
  userLocation,
  selectedStore,
  hoveredStore,
  onStoreSelect,
  onStoreHover,
  className = ""
}: InteractiveMapProps) {
  const [mapReady, setMapReady] = useState(false)
  
  // Default center (San Francisco Bay Area)
  const defaultCenter: [number, number] = [37.7749, -122.4194]
  const center = userLocation ? [userLocation.latitude, userLocation.longitude] as [number, number] : defaultCenter
  
  // Format business hours for popup
  const formatBusinessHours = (hours: any): string => {
    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = dayNames[now.getDay()]
    const todayHours = hours[today]
    
    if (todayHours === 'closed') {
      return 'Closed today'
    }
    
    if (typeof todayHours === 'object') {
      return `Today: ${todayHours.open} - ${todayHours.close}`
    }
    
    return 'Hours not available'
  }

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={userLocation ? 13 : 10}
        className="w-full h-full rounded-lg z-0"
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController 
          stores={stores}
          userLocation={userLocation}
          selectedStore={selectedStore}
          onStoreSelect={onStoreSelect}
        />
        
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={new L.DivIcon({
              html: `
                <div style="
                  background: linear-gradient(45deg, #3b82f6, #1d4ed8);
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  position: relative;
                ">
                  <div style="
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 10px;
                    height: 10px;
                    background: white;
                    border-radius: 50%;
                  "></div>
                </div>
              `,
              className: 'user-location-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          >
            <Popup>
              <div className="text-center">
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Store markers */}
        {stores.map((store) => (
          <Marker
            key={store.id}
            position={[store.latitude, store.longitude]}
            icon={createCustomIcon(
              store.storeType, 
              selectedStore === store.id,
              hoveredStore === store.id
            )}
            eventHandlers={{
              mouseover: () => onStoreHover(store.id),
              mouseout: () => onStoreHover(null),
              click: () => onStoreSelect(selectedStore === store.id ? null : store.id)
            }}
          >
            <Popup className="store-popup" maxWidth={350}>
              <Card className="border-0 shadow-none p-0">
                <div className="space-y-3">
                  {/* Store Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{store.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        store.storeType === 'pet_store' ? 'bg-green-100 text-green-800' :
                        store.storeType === 'butcher' ? 'bg-red-100 text-red-800' :
                        store.storeType === 'farm' ? 'bg-yellow-100 text-yellow-800' :
                        store.storeType === 'co_op' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {store.storeType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {store.distance ? `${store.distance} mi` : 'N/A'}
                      </div>
                      {store.rating && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1 fill-current text-yellow-500" />
                          {store.rating} ({store.reviewCount || 0} reviews)
                        </div>
                      )}
                    </div>
                    
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      store.isOpen 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-1 ${
                        store.isOpen ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      {store.isOpen ? 'Open' : 'Closed'}
                    </div>
                  </div>

                  {/* Address and Contact */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      {store.address}, {store.city}, {store.state} {store.zipCode}
                    </div>
                    {store.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        {store.phone}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {formatBusinessHours(store.businessHours)}
                    </div>
                  </div>

                  {/* Specialties */}
                  {store.specialties.length > 0 && (
                    <div>
                      <div className="flex flex-wrap gap-1">
                        {store.specialties.slice(0, 3).map((specialty, idx) => (
                          <span key={idx} className="px-2 py-1 bg-muted text-xs rounded-full">
                            {specialty}
                          </span>
                        ))}
                        {store.specialties.length > 3 && (
                          <span className="px-2 py-1 bg-muted text-xs rounded-full">
                            +{store.specialties.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {store.delivery && (
                      <div className="flex items-center text-green-600">
                        <Truck className="h-3 w-3 mr-1" />
                        Delivery
                      </div>
                    )}
                    {store.curbsidePickup && (
                      <div className="flex items-center text-blue-600">
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Curbside
                      </div>
                    )}
                    {store.certifications && store.certifications.length > 0 && (
                      <div className="flex items-center text-purple-600">
                        <Award className="h-3 w-3 mr-1" />
                        Certified
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => window.open(`https://maps.google.com/maps?daddr=${store.latitude},${store.longitude}`, '_blank')}
                    >
                      <Route className="mr-2 h-4 w-4" />
                      Directions
                    </Button>
                    {store.phone && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(`tel:${store.phone}`, '_self')}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                    {store.website && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(store.website, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-10 max-w-xs">
        <h4 className="font-semibold text-sm mb-2">Store Types</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            Pet Stores ({stores.filter(s => s.storeType === 'pet_store').length})
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            Butcher Shops ({stores.filter(s => s.storeType === 'butcher').length})
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            Co-ops ({stores.filter(s => s.storeType === 'co_op').length})
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
            Farms ({stores.filter(s => s.storeType === 'farm').length})
          </div>
          {userLocation && (
            <div className="flex items-center pt-1 border-t">
              <div className="w-4 h-4 bg-blue-600 rounded-full mr-2 relative">
                <div className="w-2 h-2 bg-white rounded-full absolute top-1 left-1"></div>
              </div>
              Your Location
            </div>
          )}
        </div>
      </div>
    </div>
  )
}