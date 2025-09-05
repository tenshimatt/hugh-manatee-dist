'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, 
  MapPin, 
  X, 
  Loader2, 
  Navigation,
  Target,
  Clock
} from 'lucide-react'

interface LocationSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void
  onUseCurrentLocation: () => void
  loading?: boolean
  currentLocationLoading?: boolean
  placeholder?: string
  className?: string
  recentSearches?: string[]
  onRecentSearchesChange?: (searches: string[]) => void
}

interface LocationSuggestion {
  id: string
  address: string
  city: string
  state: string
  lat: number
  lng: number
}

// Mock geocoding function - in production, this would use a real API
const mockGeocode = async (address: string): Promise<LocationSuggestion[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const suggestions: LocationSuggestion[] = [
    {
      id: '1',
      address: `${address}, San Francisco`,
      city: 'San Francisco',
      state: 'CA',
      lat: 37.7749,
      lng: -122.4194
    },
    {
      id: '2', 
      address: `${address}, Oakland`,
      city: 'Oakland',
      state: 'CA',
      lat: 37.8044,
      lng: -122.2712
    },
    {
      id: '3',
      address: `${address}, San Jose`,
      city: 'San Jose', 
      state: 'CA',
      lat: 37.3382,
      lng: -121.8863
    }
  ]
  
  return suggestions.filter(suggestion => 
    suggestion.address.toLowerCase().includes(address.toLowerCase()) ||
    suggestion.city.toLowerCase().includes(address.toLowerCase())
  )
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  onUseCurrentLocation,
  loading = false,
  currentLocationLoading = false,
  placeholder = "Enter address, city, or zip code",
  className = '',
  recentSearches = [],
  onRecentSearchesChange
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Debounced search function
  const searchLocations = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setSuggestionsLoading(true)
    try {
      const results = await mockGeocode(term)
      setSuggestions(results)
      setShowSuggestions(true)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Geocoding error:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setSuggestionsLoading(false)
    }
  }, [])

  // Handle input changes with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Set new timeout
    debounceRef.current = setTimeout(() => {
      searchLocations(value)
    }, 300)
  }, [searchLocations])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: LocationSuggestion) => {
    setSearchTerm(suggestion.address)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedIndex(-1)
    
    // Add to recent searches
    if (onRecentSearchesChange) {
      const newRecentSearches = [
        suggestion.address,
        ...recentSearches.filter(search => search !== suggestion.address)
      ].slice(0, 5) // Keep only 5 recent searches
      onRecentSearchesChange(newRecentSearches)
    }
    
    onLocationSelect({
      lat: suggestion.lat,
      lng: suggestion.lng,
      address: suggestion.address
    })
  }, [onLocationSelect, recentSearches, onRecentSearchesChange])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex])
        } else if (searchTerm.trim()) {
          // Use first suggestion or create one from input
          const suggestion = suggestions[0] || {
            id: 'custom',
            address: searchTerm,
            city: '',
            state: '',
            lat: 37.7749,
            lng: -122.4194
          }
          handleSuggestionSelect(suggestion)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }, [showSuggestions, suggestions, selectedIndex, searchTerm, handleSuggestionSelect])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }, [])

  // Handle recent search selection
  const handleRecentSearchSelect = useCallback((search: string) => {
    setSearchTerm(search)
    searchLocations(search)
    inputRef.current?.focus()
  }, [searchLocations])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true)
            }}
            placeholder={placeholder}
            className="pl-10 pr-10"
            disabled={loading}
          />
          
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Use Current Location Button */}
        <Button
          variant="outline"
          onClick={onUseCurrentLocation}
          disabled={currentLocationLoading || loading}
          className="flex-shrink-0"
        >
          {currentLocationLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Target className="h-4 w-4" />
          )}
          <span className="hidden sm:inline ml-2">Near Me</span>
        </Button>
      </div>

      {/* Recent Searches */}
      {!showSuggestions && !searchTerm && recentSearches.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Recent searches:
          </div>
          <div className="flex flex-wrap gap-1">
            {recentSearches.slice(0, 3).map((search, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-gray-50 text-xs"
                onClick={() => handleRecentSearchSelect(search)}
              >
                {search.length > 30 ? `${search.substring(0, 30)}...` : search}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <Card 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg max-h-60 overflow-auto"
        >
          <CardContent className="p-0">
            {suggestionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Searching...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 ${
                      selectedIndex === index ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.address}
                      </div>
                      <div className="text-xs text-gray-500">
                        {suggestion.city}, {suggestion.state}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchTerm.length >= 2 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No locations found for &quot;{searchTerm}&quot;
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default LocationSearch