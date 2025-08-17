import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Filter, Phone, Clock, ChevronRight, DollarSign, Truck, Shield, Award } from 'lucide-react';

// PAWS Token Display Component
const PAWSBalance = ({ balance = 1250 }) => {
  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-2 rounded-lg border border-amber-200">
      <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
        <span className="text-xs">🐾</span>
      </div>
      <div>
        <div className="text-xs text-amber-600">PAWS Balance</div>
        <div className="font-bold text-amber-900">{balance.toLocaleString()}</div>
      </div>
    </div>
  );
};

// Navigation Bar
const Navigation = () => {
  const [user, setUser] = useState(null);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Rawgle</h1>
                <p className="text-xs text-gray-500">Premium Raw Dog Food Directory</p>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <PAWSBalance />
            <button className="text-gray-600 hover:text-gray-900 p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                <img className="w-8 h-8 rounded-full" src="/api/placeholder/32/32" alt="User" />
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
              </div>
            ) : (
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Hero Search Section
const HeroSearch = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Categories', icon: '🍖' },
    { id: 'beef', name: 'Raw Beef', icon: '🥩' },
    { id: 'chicken', name: 'Raw Chicken', icon: '🍗' },
    { id: 'fish', name: 'Raw Fish', icon: '🐟' },
    { id: 'freeze-dried', name: 'Freeze-Dried', icon: '❄️' },
    { id: 'organic', name: 'Organic', icon: '🌿' },
    { id: 'supplements', name: 'Supplements', icon: '💊' },
  ];

  const handleSearch = () => {
    onSearch({ query: searchQuery, location, category: selectedCategory });
  };

  return (
    <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Premium Raw Dog Food Near You
          </h1>
          <p className="text-xl text-emerald-100">
            Discover trusted suppliers, earn PAWS rewards, and give your dog the nutrition they deserve
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-2">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 flex items-center px-4 py-3 border-r border-gray-200">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Search for suppliers, brands, or products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 outline-none text-gray-900"
                />
              </div>
              <div className="flex items-center px-4 py-3 md:w-64">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Location or ZIP"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1 outline-none text-gray-900"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Quick Category Filters */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full border transition-all ${
                  selectedCategory === category.id
                    ? 'bg-white text-emerald-700 border-white'
                    : 'border-white/30 text-white hover:bg-white/10'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex justify-center gap-8 mt-12">
          <div className="text-center">
            <div className="text-3xl font-bold">5,000+</div>
            <div className="text-emerald-100">Verified Suppliers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">50,000+</div>
            <div className="text-emerald-100">Happy Dogs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">4.9/5</div>
            <div className="text-emerald-100">Average Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Supplier Card Component
const SupplierCard = ({ supplier }) => {
  const earnRate = Math.round(supplier.avgPrice * 0.1); // 10% PAWS back

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="relative">
        <img 
          src={supplier.image || '/api/placeholder/400/200'} 
          alt={supplier.name}
          className="w-full h-48 object-cover"
        />
        {supplier.featured && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            Featured Partner
          </div>
        )}
        {supplier.delivery && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium text-gray-700">
            <Truck className="w-4 h-4 inline mr-1" />
            Delivery
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{supplier.name}</h3>
            <p className="text-sm text-gray-500">{supplier.distance} · {supplier.type}</p>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-gray-900">{supplier.rating}</span>
            <span className="text-sm text-gray-500">({supplier.reviews})</span>
          </div>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">{supplier.description}</p>

        {/* Specialties */}
        <div className="flex flex-wrap gap-2 mb-4">
          {supplier.specialties.map((specialty, idx) => (
            <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm">
              {specialty}
            </span>
          ))}
        </div>

        {/* PAWS Rewards */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🐾</span>
              <span className="font-medium text-amber-900">Earn {earnRate} PAWS per order</span>
            </div>
            <span className="text-sm text-amber-600">~${supplier.avgPrice} avg</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
            View Details
          </button>
          <button className="flex-1 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-2 px-4 rounded-lg font-medium transition-colors">
            Get Directions
          </button>
        </div>
      </div>
    </div>
  );
};

// Filter Sidebar
const FilterSidebar = ({ filters, onFilterChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Filters</h3>
        <button className="text-sm text-emerald-600 hover:text-emerald-700">Clear all</button>
      </div>

      {/* Distance */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Distance</h4>
        <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
          <option>Within 5 miles</option>
          <option>Within 10 miles</option>
          <option>Within 25 miles</option>
          <option>Within 50 miles</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Price Range</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-gray-600">$ · Budget-friendly</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-gray-600">$$ · Mid-range</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-gray-600">$$$ · Premium</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-gray-600">$$$$ · Luxury</span>
          </label>
        </div>
      </div>

      {/* Services */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Services</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-gray-600">Home Delivery</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-gray-600">Subscription Plans</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-gray-600">Nutritional Consultation</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-gray-600">Custom Meal Plans</span>
          </label>
        </div>
      </div>

      {/* Certifications */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Certifications</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-gray-600">USDA Organic</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-gray-600">Grass-Fed</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-gray-600">Human-Grade</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-gray-600">AAFCO Certified</span>
          </label>
        </div>
      </div>

      <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors">
        Apply Filters
      </button>
    </div>
  );
};

// Main App Component
const RawgleApp = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({});

  // Mock data for demonstration
  const mockSuppliers = [
    {
      id: 1,
      name: "Premium Raw Pet Foods",
      rating: 4.9,
      reviews: 234,
      distance: "1.2 miles",
      type: "Specialty Store",
      description: "Family-owned business specializing in locally-sourced, human-grade raw dog food with custom meal plans.",
      specialties: ["Raw Beef", "Organic", "Custom Plans"],
      avgPrice: 45,
      featured: true,
      delivery: true,
      image: "/api/placeholder/400/200"
    },
    {
      id: 2,
      name: "Natural K9 Nutrition",
      rating: 4.8,
      reviews: 189,
      distance: "2.5 miles",
      type: "Boutique",
      description: "Holistic pet nutrition center offering raw diets, supplements, and nutritional consultations.",
      specialties: ["Raw Chicken", "Supplements", "Consultations"],
      avgPrice: 38,
      featured: false,
      delivery: true,
      image: "/api/placeholder/400/200"
    },
    {
      id: 3,
      name: "Wild Origins Pet Supply",
      rating: 4.7,
      reviews: 156,
      distance: "3.8 miles",
      type: "Warehouse",
      description: "Large selection of raw and freeze-dried foods at wholesale prices with bulk buying options.",
      specialties: ["Freeze-Dried", "Bulk Orders", "Raw Fish"],
      avgPrice: 32,
      featured: false,
      delivery: false,
      image: "/api/placeholder/400/200"
    },
    {
      id: 4,
      name: "Organic Paws Market",
      rating: 5.0,
      reviews: 98,
      distance: "4.2 miles",
      type: "Organic Store",
      description: "100% organic, grass-fed raw food options with sustainability focus and eco-friendly packaging.",
      specialties: ["Organic", "Grass-Fed", "Eco-Friendly"],
      avgPrice: 55,
      featured: true,
      delivery: true,
      image: "/api/placeholder/400/200"
    },
    {
      id: 5,
      name: "The Raw Bar for Dogs",
      rating: 4.6,
      reviews: 212,
      distance: "5.1 miles",
      type: "Restaurant-Style",
      description: "Unique dining experience for dogs with fresh-prepared raw meals and treats made to order.",
      specialties: ["Fresh Prepared", "Treats", "Dine-In"],
      avgPrice: 42,
      featured: false,
      delivery: false,
      image: "/api/placeholder/400/200"
    },
    {
      id: 6,
      name: "Carnivore's Choice",
      rating: 4.8,
      reviews: 301,
      distance: "6.3 miles",
      type: "Chain Store",
      description: "National chain with consistent quality, subscription services, and loyalty rewards program.",
      specialties: ["Subscriptions", "Loyalty Program", "All Types"],
      avgPrice: 40,
      featured: false,
      delivery: true,
      image: "/api/placeholder/400/200"
    }
  ];

  const handleSearch = (params) => {
    setLoading(true);
    setSearchParams(params);
    
    // Simulate API call
    setTimeout(() => {
      setSuppliers(mockSuppliers);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    // Load initial suppliers
    setSuppliers(mockSuppliers);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <HeroSearch onSearch={handleSearch} />
      
      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block w-80">
            <FilterSidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {suppliers.length} Suppliers Found
                </h2>
                <p className="text-gray-600">Premium raw dog food suppliers in your area</p>
              </div>
              <select className="border border-gray-300 rounded-lg px-4 py-2">
                <option>Sort by: Recommended</option>
                <option>Distance: Nearest</option>
                <option>Rating: Highest</option>
                <option>Price: Low to High</option>
                <option>PAWS Rewards: Highest</option>
              </select>
            </div>

            {/* Results Grid */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {suppliers.map((supplier) => (
                  <SupplierCard key={supplier.id} supplier={supplier} />
                ))}
              </div>
            )}

            {/* Load More */}
            {suppliers.length > 0 && (
              <div className="text-center mt-8">
                <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
                  Load More Suppliers
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PAWS Rewards Banner */}
      <div className="bg-gradient-to-r from-amber-400 to-yellow-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h3 className="text-3xl font-bold mb-4">Join PAWS Rewards</h3>
            <p className="text-xl mb-6">Earn points on every purchase and unlock exclusive discounts</p>
            <button className="bg-white text-amber-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition-colors">
              Start Earning PAWS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RawgleApp;