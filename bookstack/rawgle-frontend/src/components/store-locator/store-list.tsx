'use client'

import React, { useState } from 'react'
import { Store } from '@/types/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  ExternalLink, 
  Navigation,
  Truck,
  Car,
  Check,
  X
} from 'lucide-react'

interface StoreListProps {
  stores: Store[]
  loading?: boolean
  onStoreClick?: (store: Store) => void
  onGetDirections?: (store: Store) => void
  className?: string
}

interface StoreCardProps {
  store: Store
  onClick?: (store: Store) => void
  onGetDirections?: (store: Store) => void
}

const StoreCard: React.FC<StoreCardProps> = ({ 
  store, 
  onClick, 
  onGetDirections 
}) => {
  const [imageError, setImageError] = useState(false)

  const handleGetDirections = (e: React.MouseEvent) => {
    e.stopPropagation()
    onGetDirections?.(store)
  }

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const getStoreTypeIcon = (storeType: string) => {
    switch (storeType) {
      case 'pet_store': return '🏪'
      case 'butcher': return '🥩'
      case 'farm': return '🚜'
      case 'co_op': return '🤝'
      default: return '🏬'
    }
  }

  const getStoreTypeLabel = (storeType: string) => {
    switch (storeType) {
      case 'pet_store': return 'Pet Store'
      case 'butcher': return 'Butcher Shop'
      case 'farm': return 'Farm'
      case 'co_op': return 'Co-op'
      default: return 'Store'
    }
  }

  const getBusinessHoursToday = () => {
    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = dayNames[now.getDay()]
    const todayHours = store.businessHours[today]

    if (todayHours === 'closed') {
      return 'Closed today'
    }

    if (typeof todayHours === 'object') {
      return `${todayHours.open} - ${todayHours.close}`
    }

    return 'Hours not available'
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4 border-l-transparent hover:border-l-blue-500"
      onClick={() => onClick?.(store)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 text-lg truncate">
                {store.name}
              </h3>
              <span className="text-lg">{getStoreTypeIcon(store.storeType)}</span>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant={store.storeType === 'pet_store' ? 'default' : 'secondary'} 
                className="text-xs"
              >
                {getStoreTypeLabel(store.storeType)}
              </Badge>
              
              {store.isVerified && (
                <Badge variant="outline" className="text-xs text-green-700 border-green-200">
                  <Check className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              
              {store.isOpen ? (
                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Open Now
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                  <X className="w-3 h-3 mr-1" />
                  Closed
                </Badge>
              )}
            </div>
          </div>

          {/* Rating */}
          {store.rating && (
            <div className="flex items-center gap-1 ml-4">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-gray-900">{store.rating}</span>
              <span className="text-sm text-gray-500">({store.reviewCount})</span>
            </div>
          )}
        </div>

        {/* Address and Distance */}
        <div className="space-y-2 mb-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-600 min-w-0">
              <div className="truncate">{store.address}</div>
              <div>{store.city}, {store.state} {store.zipCode}</div>
              {store.distance && (
                <div className="font-semibold text-blue-600 mt-1">
                  {store.distance} miles away
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          {store.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <a 
                href={`tel:${store.phone}`}
                className="text-sm text-blue-600 hover:underline"
                onClick={handlePhoneClick}
              >
                {store.phone}
              </a>
            </div>
          )}

          {/* Business Hours */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {getBusinessHoursToday()}
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="flex items-center gap-3 mb-3 text-sm">
          {store.delivery && (
            <div className="flex items-center gap-1 text-green-600">
              <Truck className="w-4 h-4" />
              <span>Delivery</span>
            </div>
          )}
          
          {store.curbsidePickup && (
            <div className="flex items-center gap-1 text-purple-600">
              <Car className="w-4 h-4" />
              <span>Curbside</span>
            </div>
          )}
          
          {store.priceRange && (
            <div className="text-gray-600">
              <span className="font-mono">{store.priceRange}</span>
            </div>
          )}
        </div>

        {/* Specialties */}
        {store.specialties && store.specialties.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {store.specialties.slice(0, 4).map((specialty, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs text-gray-600"
                >
                  {specialty}
                </Badge>
              ))}
              {store.specialties.length > 4 && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  +{store.specialties.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onClick?.(store)
            }}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            View Details
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleGetDirections}
          >
            <Navigation className="w-4 h-4 mr-1" />
            Directions
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export const StoreList: React.FC<StoreListProps> = ({
  stores,
  loading = false,
  onStoreClick,
  onGetDirections,
  className = ''
}) => {
  const handleGetDirections = (store: Store) => {
    const query = encodeURIComponent(`${store.address}, ${store.city}, ${store.state} ${store.zipCode}`)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${query}`
    window.open(url, '_blank', 'noopener,noreferrer')
    onGetDirections?.(store)
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500 mb-2">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">No stores found</h3>
          <p className="text-sm">Try adjusting your search criteria or location.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {stores.map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          onClick={onStoreClick}
          onGetDirections={handleGetDirections}
        />
      ))}
    </div>
  )
}

export default StoreList