import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { nftService } from '../services/api';
import { formatPawsAmount, formatDate, getPetTypeIcon } from '../utils/helpers';

const MarketplacePage = () => {
  const [marketplace, setMarketplace] = useState({
    listings: [],
    isLoading: true,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadMarketplace();
  }, []);

  const loadMarketplace = async () => {
    try {
      const data = await nftService.getMarketplaceListings();
      setMarketplace({
        listings: data.listings || [],
        isLoading: false,
      });
    } catch (err) {
      console.error('Error loading marketplace:', err);
      setMarketplace({ listings: [], isLoading: false });
    }
  };

  const categories = [
    { value: 'all', label: 'All Items' },
    { value: 'pet_profile', label: 'Pet Profiles' },
    { value: 'milestone', label: 'Milestones' },
    { value: 'memorial', label: 'Memorials' },
    { value: 'achievement', label: 'Achievements' },
  ];

  const filteredListings = marketplace.listings.filter((listing) => {
    const matchesSearch = listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || listing.nft_type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const MarketplaceCard = ({ listing }) => (
    <div className="card p-0 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
        {listing.image_url ? (
          <img 
            src={listing.image_url} 
            alt={listing.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-2">{getPetTypeIcon(listing.pet_type)}</div>
            <SparklesIcon className="w-8 h-8 text-primary-500 mx-auto" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{listing.name}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{listing.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {listing.nft_type.replace('_', ' ').toUpperCase()}
          </span>
          <span className="text-sm font-semibold text-primary-600">
            {formatPawsAmount(listing.price)} PAWS
          </span>
        </div>

        <div className="text-xs text-gray-500 mb-3">
          By {listing.seller_name || 'Anonymous'} • Listed {formatDate(listing.created_at)}
        </div>

        <button className="w-full btn-primary text-sm">
          Purchase NFT
        </button>
      </div>
    </div>
  );

  if (marketplace.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">NFT Marketplace</h1>
        <p className="text-gray-600 mt-1">
          Discover and trade unique pet NFTs from the community
        </p>
      </div>

      {/* Search and Filter */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search NFTs..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <FunnelIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              className="input-field pl-10 appearance-none bg-white"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-primary-500 mb-2">
            {filteredListings.length}
          </div>
          <p className="text-gray-600 text-sm">Items Listed</p>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-secondary-500 mb-2">
            {formatPawsAmount(Math.min(...filteredListings.map(l => l.price), 0))}
          </div>
          <p className="text-gray-600 text-sm">Floor Price</p>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-accent-500 mb-2">
            {new Set(filteredListings.map(l => l.seller_id)).size}
          </div>
          <p className="text-gray-600 text-sm">Sellers</p>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl font-bold text-purple-500 mb-2">
            {formatPawsAmount(filteredListings.reduce((sum, l) => sum + l.price, 0))}
          </div>
          <p className="text-gray-600 text-sm">Total Value</p>
        </div>
      </div>

      {/* Marketplace Grid */}
      {filteredListings.length === 0 ? (
        <div className="text-center py-16">
          <CurrencyDollarIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchTerm || selectedCategory !== 'all' ? 'No NFTs match your search' : 'Marketplace Coming Soon'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search terms or category filter.'
              : 'The NFT marketplace will be available once users start minting and listing their pet NFTs.'
            }
          </p>
          {searchTerm || selectedCategory !== 'all' ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          ) : (
            <div className="space-x-4">
              <button className="btn-primary">
                Mint Your First NFT
              </button>
              <button className="btn-secondary">
                Learn More
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map((listing) => (
            <MarketplaceCard key={listing.listing_id} listing={listing} />
          ))}
        </div>
      )}

      {/* Featured Collections */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Featured Collections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-4xl mb-2">🐕</div>
            <h3 className="font-medium text-gray-900">Golden Memories</h3>
            <p className="text-sm text-gray-600">Celebrating Golden Retrievers</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-4xl mb-2">🐱</div>
            <h3 className="font-medium text-gray-900">Feline Milestones</h3>
            <p className="text-sm text-gray-600">Cat achievement NFTs</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="font-medium text-gray-900">Achievement Badges</h3>
            <p className="text-sm text-gray-600">Rare accomplishment NFTs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;