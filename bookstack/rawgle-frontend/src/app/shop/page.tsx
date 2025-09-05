'use client'

import { motion } from 'framer-motion'
import { 
  ShoppingCart, 
  Plus, 
  Filter,
  Search,
  Star,
  MapPin,
  Truck,
  Shield,
  Heart,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const categories = [
  { name: 'Raw Meat', icon: '🥩', count: 124 },
  { name: 'Organs', icon: '💚', count: 67 },
  { name: 'Bones', icon: '🦴', count: 89 },
  { name: 'Supplements', icon: '💊', count: 45 },
  { name: 'Tools & Equipment', icon: '🔪', count: 78 },
  { name: 'Treats', icon: '🦴', count: 56 }
]

const featuredProducts = [
  {
    id: 1,
    name: 'Premium Ground Beef Mix',
    brand: 'Raw Valley',
    price: 24.99,
    originalPrice: 29.99,
    rating: 4.8,
    reviews: 156,
    image: '/api/placeholder/300/300',
    badge: 'Best Seller',
    inStock: true,
    description: 'High-quality ground beef with heart and liver mix'
  },
  {
    id: 2,
    name: 'Free-Range Chicken Frames',
    brand: 'Farm Fresh',
    price: 18.50,
    rating: 4.7,
    reviews: 89,
    image: '/api/placeholder/300/300',
    badge: 'Organic',
    inStock: true,
    description: 'Perfect for raw feeding, includes necks and backs'
  },
  {
    id: 3,
    name: 'Wild Salmon Oil Supplement',
    brand: 'Ocean Pure',
    price: 32.99,
    rating: 4.9,
    reviews: 203,
    image: '/api/placeholder/300/300',
    badge: 'Premium',
    inStock: false,
    description: 'Rich in Omega-3 fatty acids for coat health'
  },
  {
    id: 4,
    name: 'Raw Feeding Starter Kit',
    brand: 'RAWGLE',
    price: 89.99,
    originalPrice: 119.99,
    rating: 4.9,
    reviews: 312,
    image: '/api/placeholder/300/300',
    badge: 'Kit',
    inStock: true,
    description: 'Everything you need to start raw feeding'
  }
]

const stores = [
  { name: 'Raw Valley Store', distance: '2.3 miles', rating: 4.8, open: true },
  { name: 'Farm Fresh Market', distance: '4.1 miles', rating: 4.6, open: true },
  { name: 'Pet Nutrition Plus', distance: '6.8 miles', rating: 4.7, open: false }
]

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-olivine to-charcoal text-white py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              RAWGLE Marketplace
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Find the best raw food products and local suppliers for your pets
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900"
                  placeholder="Search products..."
                />
              </div>
              <Button size="lg" variant="secondary">
                <Filter className="mr-2 h-5 w-5" />
                Filter
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Categories */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-3xl mb-2">{category.icon}</div>
                  <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                  <p className="text-xs text-muted-foreground">{category.count} items</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Featured Products</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Price</Button>
                <Button variant="outline" size="sm">Rating</Button>
                <Button variant="outline" size="sm">Distance</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <div className="aspect-square bg-gray-100 flex items-center justify-center text-6xl">
                        🥩
                      </div>
                      {product.badge && (
                        <span className={`absolute top-2 left-2 px-2 py-1 text-xs rounded-full ${
                          product.badge === 'Best Seller' ? 'bg-yellow-100 text-yellow-800' :
                          product.badge === 'Organic' ? 'bg-green-100 text-green-800' :
                          product.badge === 'Premium' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {product.badge}
                        </span>
                      )}
                      <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                        <Heart className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="mb-2">
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                      </div>
                      
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm ml-1">{product.rating}</span>
                          <span className="text-xs text-muted-foreground ml-1">({product.reviews})</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-lg font-bold">${product.price}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through ml-2">
                              ${product.originalPrice}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1" 
                          disabled={!product.inStock}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to Cart
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Local Stores */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold">Nearby Stores</h3>
              </div>
              <div className="space-y-3">
                {stores.map((store, index) => (
                  <div key={store.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{store.name}</p>
                      <p className="text-xs text-muted-foreground">{store.distance}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-xs">
                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                        {store.rating}
                      </div>
                      <span className={`text-xs ${
                        store.open ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {store.open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                View All Stores
              </Button>
            </Card>

            {/* Benefits */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Why Shop with RAWGLE?</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-green-500 mr-2" />
                  <span>Quality Guaranteed</span>
                </div>
                <div className="flex items-center">
                  <Truck className="h-4 w-4 text-blue-500 mr-2" />
                  <span>Fast Local Delivery</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-2" />
                  <span>Verified Reviews</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}