'use client'

import React, { useState } from 'react'
import { Store } from '@/types/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
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
  X,
  Globe,
  Calendar,
  Package,
  Award,
  DollarSign
} from 'lucide-react'

interface StoreDetailModalProps {
  store: Store
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

interface BusinessHoursDisplayProps {
  businessHours: Store['businessHours']
  className?: string
}

const BusinessHoursDisplay: React.FC<BusinessHoursDisplayProps> = ({ 
  businessHours,
  className = ''
}) => {
  const dayNames = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ]

  return (
    <div className={`space-y-2 ${className}`}>
      {dayNames.map(day => {
        const hours = businessHours[day.key]
        const isToday = new Date().getDay() === 
          (day.key === 'sunday' ? 0 : dayNames.findIndex(d => d.key === day.key))

        return (
          <div 
            key={day.key}
            className={`flex justify-between text-sm ${
              isToday ? 'font-semibold text-gray-900' : 'text-gray-600'
            }`}
          >
            <span>{day.label}</span>
            <span>
              {hours === 'closed' ? (
                <span className="text-red-600">Closed</span>
              ) : typeof hours === 'object' ? (
                `${hours.open} - ${hours.close}`
              ) : (
                'Hours not available'
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

interface InventoryDisplayProps {
  inventory: Store['inventory']
  className?: string
}

const InventoryDisplay: React.FC<InventoryDisplayProps> = ({ 
  inventory,
  className = ''
}) => {
  if (!inventory || Object.keys(inventory).length === 0) {
    return (
      <div className={`text-center text-gray-500 py-4 ${className}`}>
        <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Inventory information not available</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {Object.entries(inventory).map(([product, info]) => (
        <div key={product} className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium text-sm">{product}</div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {info.available ? (
                <>
                  <Check className="w-3 h-3 text-green-500" />
                  <span>In Stock ({info.stock} available)</span>
                </>
              ) : (
                <>
                  <X className="w-3 h-3 text-red-500" />
                  <span>Out of Stock</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-sm">${info.price}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export const StoreDetailModal: React.FC<StoreDetailModalProps> = ({
  store,
  trigger,
  open,
  onOpenChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hours' | 'inventory'>('overview')
  
  // Early return if no store or modal is not open
  if (!store || !open) {
    return trigger ? (
      <Dialog open={false} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      </Dialog>
    ) : null
  }

  const handleGetDirections = () => {
    const query = encodeURIComponent(`${store.address}, ${store.city}, ${store.state} ${store.zipCode}`)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${query}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleVisitWebsite = () => {
    if (store.website) {
      window.open(store.website, '_blank', 'noopener,noreferrer')
    }
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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'hours', label: 'Hours' },
    { id: 'inventory', label: 'Products' }
  ] as const

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <span>{store.name}</span>
                <span className="text-2xl">{getStoreTypeIcon(store.storeType)}</span>
              </DialogTitle>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">
                  {getStoreTypeLabel(store.storeType)}
                </Badge>
                
                {store.isVerified && (
                  <Badge variant="outline" className="text-green-700 border-green-200">
                    <Check className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                
                {store.isOpen ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Open Now
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    <X className="w-3 h-3 mr-1" />
                    Closed
                  </Badge>
                )}
              </div>
            </div>

            {/* Rating */}
            {store.rating && (
              <div className="flex items-center gap-1 ml-4">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-lg">{store.rating}</span>
                <span className="text-gray-500">({store.reviewCount} reviews)</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleGetDirections} className="flex-1">
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
            
            {store.phone && (
              <Button variant="outline" asChild className="flex-1">
                <a href={`tel:${store.phone}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  Call Store
                </a>
              </Button>
            )}
            
            {store.website && (
              <Button variant="outline" onClick={handleVisitWebsite} className="flex-1">
                <Globe className="w-4 h-4 mr-2" />
                Website
              </Button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact & Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium">{store.address}</div>
                      <div className="text-gray-600">{store.city}, {store.state} {store.zipCode}</div>
                      {store.distance && (
                        <div className="text-blue-600 font-medium mt-1">
                          {store.distance} miles away
                        </div>
                      )}
                    </div>
                  </div>

                  {store.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <a href={`tel:${store.phone}`} className="text-blue-600 hover:underline">
                        {store.phone}
                      </a>
                    </div>
                  )}

                  {store.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-500" />
                      <a 
                        href={store.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Services & Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Services & Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Truck className={`w-4 h-4 ${store.delivery ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className={store.delivery ? 'text-gray-900' : 'text-gray-500'}>
                        Delivery {store.delivery ? 'Available' : 'Not Available'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Car className={`w-4 h-4 ${store.curbsidePickup ? 'text-purple-500' : 'text-gray-300'}`} />
                      <span className={store.curbsidePickup ? 'text-gray-900' : 'text-gray-500'}>
                        Curbside {store.curbsidePickup ? 'Available' : 'Not Available'}
                      </span>
                    </div>

                    {store.priceRange && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span>Price Range: {store.priceRange}</span>
                      </div>
                    )}
                  </div>

                  {store.features && store.features.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Additional Features:</div>
                      <div className="flex flex-wrap gap-1">
                        {store.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Specialties & Certifications */}
              {(store.specialties?.length || store.certifications?.length) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Specialties & Certifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {store.specialties && store.specialties.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Specialties:</div>
                        <div className="flex flex-wrap gap-2">
                          {store.specialties.map((specialty, index) => (
                            <Badge key={index} variant="secondary">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {store.certifications && store.certifications.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          Certifications:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {store.certifications.map((cert, index) => (
                            <Badge key={index} variant="outline" className="text-green-700 border-green-200">
                              <Check className="w-3 h-3 mr-1" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'hours' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BusinessHoursDisplay businessHours={store.businessHours} />
              </CardContent>
            </Card>
          )}

          {activeTab === 'inventory' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Available Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InventoryDisplay inventory={store.inventory} />
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default StoreDetailModal