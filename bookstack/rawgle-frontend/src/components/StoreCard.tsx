'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Store } from '@/types/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import StoreDetailModal from '@/components/StoreDetailModal'
import {
  MapPin,
  Star,
  Phone,
  Clock,
  Route,
  ExternalLink,
  Truck,
  ShoppingCart,
  Award,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface StoreCardProps {
  store: Store
  index: number
  isSelected?: boolean
  isHovered?: boolean
  onSelect?: (id: string) => void
  onHover?: (id: string | null) => void
  showDistance?: boolean
  className?: string
}

// Helper function to format business hours
function formatBusinessHours(hours: any): string {
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

// Get full week hours display
function getWeeklyHours(hours: any): Array<{ day: string; hours: string }> {
  const dayNames = [
    { key: 'monday', display: 'Monday' },
    { key: 'tuesday', display: 'Tuesday' },
    { key: 'wednesday', display: 'Wednesday' },
    { key: 'thursday', display: 'Thursday' },
    { key: 'friday', display: 'Friday' },
    { key: 'saturday', display: 'Saturday' },
    { key: 'sunday', display: 'Sunday' }
  ]
  
  return dayNames.map(({ key, display }) => {
    const dayHours = hours[key]
    const hoursStr = dayHours === 'closed' 
      ? 'Closed' 
      : typeof dayHours === 'object' 
        ? `${dayHours.open} - ${dayHours.close}`
        : 'Not available'
    
    return { day: display, hours: hoursStr }
  })
}

export default function StoreCard({
  store,
  index,
  isSelected = false,
  isHovered = false,
  onSelect,
  onHover,
  showDistance = true,
  className = ''
}: StoreCardProps) {
  const [expanded, setExpanded] = useState(isSelected)
  const [showFullHours, setShowFullHours] = useState(false)

  const handleToggleExpanded = () => {
    const newExpanded = !expanded
    setExpanded(newExpanded)
    if (onSelect && newExpanded) {
      onSelect(store.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={className}
      onMouseEnter={() => onHover?.(store.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <Card className={`p-4 lg:p-6 transition-all duration-200 ${
        isSelected || isHovered ? 'shadow-lg ring-2 ring-primary/20' : 'hover:shadow-md'
      }`}>
        {/* Main Store Info */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg lg:text-xl font-semibold truncate">{store.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                  store.storeType === 'pet_store' ? 'bg-green-100 text-green-800 dark:bg-green-900/20' :
                  store.storeType === 'butcher' ? 'bg-red-100 text-red-800 dark:bg-red-900/20' :
                  store.storeType === 'farm' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20' :
                  store.storeType === 'co_op' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20' :
                  'bg-purple-100 text-purple-800 dark:bg-purple-900/20'
                }`}>
                  {store.storeType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              
              {/* Rating and Distance */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                {showDistance && store.distance && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {store.distance} mi
                  </div>
                )}
                {store.rating && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 fill-current text-yellow-500" />
                    {store.rating} ({store.reviewCount || 0})
                  </div>
                )}
              </div>
              
              {/* Open/Closed Status */}
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                store.isOpen 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  store.isOpen ? 'bg-green-500' : 'bg-red-500'
                }`} />
                {store.isOpen ? 'Open' : 'Closed'}
              </div>
            </div>
            
            {/* Price Range */}
            {store.priceRange && (
              <div className="text-lg font-bold text-green-600 ml-4">
                {store.priceRange}
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{store.address}, {store.city}, {store.state} {store.zipCode}</span>
            </div>
            
            {store.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                <span>{store.phone}</span>
              </div>
            )}
            
            <div className="flex items-center sm:col-span-2">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
              <span>{formatBusinessHours(store.businessHours)}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-6 px-2 text-xs"
                onClick={() => setShowFullHours(!showFullHours)}
              >
                {showFullHours ? 'Less' : 'More'}
              </Button>
            </div>
          </div>

          {/* Full Hours Display */}
          {showFullHours && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-muted/50 rounded-lg p-3"
            >
              <h4 className="font-medium text-sm mb-2">Business Hours</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                {getWeeklyHours(store.businessHours).map(({ day, hours }) => (
                  <div key={day} className="flex justify-between">
                    <span className="text-muted-foreground">{day}:</span>
                    <span className={hours === 'Closed' ? 'text-red-600' : ''}>{hours}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Specialties */}
          <div className="flex flex-wrap gap-2">
            {store.specialties.slice(0, 4).map((specialty, idx) => (
              <span key={idx} className="px-2 py-1 bg-muted text-xs rounded-full">
                {specialty}
              </span>
            ))}
            {store.specialties.length > 4 && (
              <span className="px-2 py-1 bg-muted text-xs rounded-full">
                +{store.specialties.length - 4} more
              </span>
            )}
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-3 text-xs">
            {store.delivery && (
              <div className="flex items-center text-green-600">
                <Truck className="h-3 w-3 mr-1" />
                Delivery
              </div>
            )}
            {store.curbsidePickup && (
              <div className="flex items-center text-blue-600">
                <ShoppingCart className="h-3 w-3 mr-1" />
                Curbside Pickup
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
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => window.open(`https://maps.google.com/maps?daddr=${store.latitude},${store.longitude}`, '_blank')}
            >
              <Route className="mr-2 h-4 w-4" />
              Get Directions
            </Button>
            
            <div className="flex gap-2">
              {store.phone && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(`tel:${store.phone}`, '_self')}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call
                </Button>
              )}
              {store.website && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(store.website, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Website
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleToggleExpanded}
                className="sm:w-auto"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Less Info
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    More Info
                  </>
                )}
              </Button>
              
              <StoreDetailModal store={store}>
                <Button size="sm" variant="secondary">
                  Full Details
                </Button>
              </StoreDetailModal>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Inventory */}
              {store.inventory && Object.keys(store.inventory).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Current Inventory</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {Object.entries(store.inventory).map(([item, details]) => (
                      <div key={item} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{item}</div>
                          <div className="text-sm text-muted-foreground">${details.price.toFixed(2)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            details.available 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20'
                          }`}>
                            {details.available ? `${details.stock} left` : 'Out of Stock'}
                          </span>
                          {details.available && (
                            <Button size="sm" variant="outline">Add to Cart</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features & Certifications */}
              <div>
                <h4 className="font-semibold mb-3">Features & Certifications</h4>
                <div className="space-y-2">
                  {store.features?.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {store.certifications?.map((cert, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <Award className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                      <span>{cert}</span>
                    </div>
                  ))}
                  
                  {(!store.features || store.features.length === 0) && 
                   (!store.certifications || store.certifications.length === 0) && (
                    <p className="text-sm text-muted-foreground">No additional features or certifications listed.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  )
}