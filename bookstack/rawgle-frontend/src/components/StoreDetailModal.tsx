'use client'

import { useState } from 'react'
import { Store } from '@/types/store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Globe,
  Mail,
  Calendar,
  DollarSign,
  Users,
  Zap,
  Shield
} from 'lucide-react'

interface StoreDetailModalProps {
  store: Store
  children: React.ReactNode
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
function getWeeklyHours(hours: any): Array<{ day: string; hours: string; isClosed: boolean; isToday: boolean }> {
  const now = new Date()
  const currentDay = now.getDay()
  
  const dayNames = [
    { key: 'monday', display: 'Monday', dayIndex: 1 },
    { key: 'tuesday', display: 'Tuesday', dayIndex: 2 },
    { key: 'wednesday', display: 'Wednesday', dayIndex: 3 },
    { key: 'thursday', display: 'Thursday', dayIndex: 4 },
    { key: 'friday', display: 'Friday', dayIndex: 5 },
    { key: 'saturday', display: 'Saturday', dayIndex: 6 },
    { key: 'sunday', display: 'Sunday', dayIndex: 0 }
  ]
  
  return dayNames.map(({ key, display, dayIndex }) => {
    const dayHours = hours[key]
    const isClosed = dayHours === 'closed'
    const hoursStr = isClosed 
      ? 'Closed' 
      : typeof dayHours === 'object' 
        ? `${dayHours.open} - ${dayHours.close}`
        : 'Not available'
    
    return { 
      day: display, 
      hours: hoursStr,
      isClosed,
      isToday: currentDay === dayIndex
    }
  })
}

export default function StoreDetailModal({ store, children }: StoreDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const weeklyHours = getWeeklyHours(store.businessHours)

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold pr-8">{store.name}</DialogTitle>
              <DialogDescription className="text-base mt-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="secondary" className="capitalize">
                    {store.storeType.replace('_', ' ')}
                  </Badge>
                  {store.distance && (
                    <span className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      {store.distance} miles away
                    </span>
                  )}
                  {store.rating && (
                    <span className="flex items-center text-sm">
                      <Star className="h-4 w-4 mr-1 fill-current text-yellow-500" />
                      {store.rating} ({store.reviewCount || 0} reviews)
                    </span>
                  )}
                  <Badge variant={store.isOpen ? 'default' : 'destructive'} className="ml-auto">
                    {store.isOpen ? 'Open' : 'Closed'}
                  </Badge>
                </div>
              </DialogDescription>
            </div>
            {store.priceRange && (
              <div className="text-2xl font-bold text-green-600 flex-shrink-0">
                {store.priceRange}
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inventory">
              Inventory
              {store.inventory && (
                <Badge variant="secondary" className="ml-2">
                  {Object.keys(store.inventory).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="hours">Hours</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button 
                className="w-full"
                onClick={() => window.open(`https://maps.google.com/maps?daddr=${store.latitude},${store.longitude}`, '_blank')}
              >
                <Route className="mr-2 h-4 w-4" />
                Directions
              </Button>
              {store.phone && (
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(`tel:${store.phone}`, '_self')}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call
                </Button>
              )}
              {store.website && (
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(store.website, '_blank')}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Website
                </Button>
              )}
              {store.email && (
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(`mailto:${store.email}`, '_self')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
              )}
            </div>

            {/* Address */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                <h4 className="font-semibold">Location</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {store.address}<br />
                {store.city}, {store.state} {store.zipCode}<br />
                {store.country}
              </p>
            </div>

            {/* Specialties & Categories */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-primary" />
                  Specialties
                </h4>
                <div className="flex flex-wrap gap-2">
                  {store.specialties.map((specialty, idx) => (
                    <Badge key={idx} variant="outline">{specialty}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
                  Product Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {store.productCategories.map((category, idx) => (
                    <Badge key={idx} variant="secondary">{category.replace('_', ' ')}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-primary" />
                  Services
                </h4>
                <div className="space-y-2">
                  {store.delivery && (
                    <div className="flex items-center text-sm">
                      <Truck className="h-4 w-4 mr-2 text-green-600" />
                      Delivery Available
                    </div>
                  )}
                  {store.curbsidePickup && (
                    <div className="flex items-center text-sm">
                      <ShoppingCart className="h-4 w-4 mr-2 text-blue-600" />
                      Curbside Pickup
                    </div>
                  )}
                  {store.features?.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  Certifications
                </h4>
                <div className="space-y-2">
                  {store.isVerified && (
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Verified Business
                    </div>
                  )}
                  {store.certifications?.map((cert, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <Award className="h-4 w-4 mr-2 text-purple-600" />
                      {cert}
                    </div>
                  ))}
                  {(!store.certifications || store.certifications.length === 0) && !store.isVerified && (
                    <p className="text-sm text-muted-foreground">No certifications listed</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            {store.inventory && Object.keys(store.inventory).length > 0 ? (
              <div className="grid gap-4">
                {Object.entries(store.inventory).map(([item, details]) => (
                  <div key={item} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item}</h4>
                      <p className="text-2xl font-bold text-green-600">${details.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={details.available ? 'default' : 'destructive'}>
                        {details.available ? `${details.stock} in stock` : 'Out of stock'}
                      </Badge>
                      {details.available && (
                        <Button size="sm">Add to Cart</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Inventory Listed</h3>
                <p className="text-muted-foreground">Contact the store directly for product availability.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="hours" className="space-y-4">
            <div className="grid gap-3">
              {weeklyHours.map(({ day, hours, isClosed, isToday }) => (
                <div 
                  key={day} 
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    isToday ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                  }`}
                >
                  <span className={`font-medium ${isToday ? 'text-primary' : ''}`}>
                    {day} {isToday && '(Today)'}
                  </span>
                  <span className={`${isClosed ? 'text-red-600' : ''}`}>
                    {hours}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <div className="grid gap-4">
              {/* Contact Information */}
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-3 text-muted-foreground" />
                  <div>
                    <div>{store.address}</div>
                    <div>{store.city}, {store.state} {store.zipCode}</div>
                  </div>
                </div>

                {store.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                    <a href={`tel:${store.phone}`} className="text-primary hover:underline">
                      {store.phone}
                    </a>
                  </div>
                )}

                {store.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                    <a href={`mailto:${store.email}`} className="text-primary hover:underline">
                      {store.email}
                    </a>
                  </div>
                )}

                {store.website && (
                  <div className="flex items-center text-sm">
                    <Globe className="h-4 w-4 mr-3 text-muted-foreground" />
                    <a href={store.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Visit Website
                    </a>
                  </div>
                )}
              </div>

              {/* Current Status */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Current Status:</span>
                  <Badge variant={store.isOpen ? 'default' : 'destructive'}>
                    {store.isOpen ? 'Open' : 'Closed'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatBusinessHours(store.businessHours)}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}