'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Filter, 
  MapPin, 
  Clock, 
  Truck, 
  Car,
  RotateCcw
} from 'lucide-react'
import { StoreType } from '@/types/store'

export interface StoreFilterState {
  radius: number
  storeType?: StoreType
  openNow: boolean
  hasDelivery: boolean
  hasCurbsidePickup: boolean
  sortBy: 'distance' | 'rating' | 'name'
}

interface StoreFiltersProps {
  filters: StoreFilterState
  onFiltersChange: (filters: Partial<StoreFilterState>) => void
  onReset: () => void
  activeFiltersCount?: number
  className?: string
}

const RADIUS_OPTIONS = [
  { value: 5, label: '5 miles' },
  { value: 10, label: '10 miles' },
  { value: 25, label: '25 miles' },
  { value: 50, label: '50 miles' }
]

const STORE_TYPE_OPTIONS = [
  { value: 'pet_store', label: 'Pet Store', icon: '🏪' },
  { value: 'butcher', label: 'Butcher Shop', icon: '🥩' },
  { value: 'farm', label: 'Farm', icon: '🚜' },
  { value: 'co_op', label: 'Co-op', icon: '🤝' }
] as const

const SORT_OPTIONS = [
  { value: 'distance', label: 'Distance' },
  { value: 'rating', label: 'Rating' },
  { value: 'name', label: 'Name' }
] as const

export const StoreFilters: React.FC<StoreFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  activeFiltersCount = 0,
  className = ''
}) => {
  const handleFilterChange = <K extends keyof StoreFilterState>(
    key: K,
    value: StoreFilterState[K]
  ) => {
    onFiltersChange({ [key]: value })
  }

  const getActiveFilterBadges = () => {
    const badges: React.ReactNode[] = []

    if (filters.storeType) {
      const storeTypeOption = STORE_TYPE_OPTIONS.find(opt => opt.value === filters.storeType)
      if (storeTypeOption) {
        badges.push(
          <Badge key="storeType" variant="secondary" className="flex items-center gap-1">
            <span>{storeTypeOption.icon}</span>
            {storeTypeOption.label}
          </Badge>
        )
      }
    }

    if (filters.openNow) {
      badges.push(
        <Badge key="openNow" variant="secondary" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Open Now
        </Badge>
      )
    }

    if (filters.hasDelivery) {
      badges.push(
        <Badge key="delivery" variant="secondary" className="flex items-center gap-1">
          <Truck className="w-3 h-3" />
          Delivery
        </Badge>
      )
    }

    if (filters.hasCurbsidePickup) {
      badges.push(
        <Badge key="curbside" variant="secondary" className="flex items-center gap-1">
          <Car className="w-3 h-3" />
          Curbside
        </Badge>
      )
    }

    return badges
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>

        <Separator />

        {/* Active Filters */}
        {getActiveFilterBadges().length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Active Filters:</div>
            <div className="flex flex-wrap gap-2">
              {getActiveFilterBadges()}
            </div>
          </div>
        )}

        {/* Distance Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Distance Radius
          </Label>
          <Select
            value={filters.radius.toString()}
            onValueChange={(value) => handleFilterChange('radius', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RADIUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Store Type Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Store Type</Label>
          <Select
            value={filters.storeType || ''}
            onValueChange={(value) => 
              handleFilterChange('storeType', value ? value as StoreType : undefined)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All store types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All store types</SelectItem>
              {STORE_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Boolean Filters */}
        <div className="space-y-3">
          {/* Open Now */}
          <div className="flex items-center justify-between">
            <Label 
              htmlFor="openNow" 
              className="text-sm font-medium flex items-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-green-600" />
              Open Now
            </Label>
            <Switch
              id="openNow"
              checked={filters.openNow}
              onCheckedChange={(checked) => handleFilterChange('openNow', checked)}
            />
          </div>

          {/* Has Delivery */}
          <div className="flex items-center justify-between">
            <Label 
              htmlFor="hasDelivery" 
              className="text-sm font-medium flex items-center gap-2 cursor-pointer"
            >
              <Truck className="w-4 h-4 text-blue-600" />
              Delivery Available
            </Label>
            <Switch
              id="hasDelivery"
              checked={filters.hasDelivery}
              onCheckedChange={(checked) => handleFilterChange('hasDelivery', checked)}
            />
          </div>

          {/* Has Curbside Pickup */}
          <div className="flex items-center justify-between">
            <Label 
              htmlFor="hasCurbsidePickup" 
              className="text-sm font-medium flex items-center gap-2 cursor-pointer"
            >
              <Car className="w-4 h-4 text-purple-600" />
              Curbside Pickup
            </Label>
            <Switch
              id="hasCurbsidePickup"
              checked={filters.hasCurbsidePickup}
              onCheckedChange={(checked) => handleFilterChange('hasCurbsidePickup', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Sort By */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Sort By</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => 
              handleFilterChange('sortBy', value as StoreFilterState['sortBy'])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

export default StoreFilters