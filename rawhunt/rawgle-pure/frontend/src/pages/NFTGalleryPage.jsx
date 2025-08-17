import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PhotoIcon,
  PlusIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { nftService } from '../services/api';
import { formatPawsAmount, formatDate, getPetTypeIcon } from '../utils/helpers';

const NFTGalleryPage = () => {
  const [nftData, setNftData] = useState({
    nfts: [],
    isLoading: true,
  });

  const [showMintModal, setShowMintModal] = useState(false);

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    try {
      const data = await nftService.getUserNFTs();
      setNftData({
        nfts: data.nfts || [],
        isLoading: false,
      });
    } catch (err) {
      console.error('Error loading NFTs:', err);
      setNftData({ nfts: [], isLoading: false });
    }
  };

  const NFTCard = ({ nft }) => (
    <div className="card p-0 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
        {nft.image_url ? (
          <img 
            src={nft.image_url} 
            alt={nft.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-2">{getPetTypeIcon(nft.pet_type)}</div>
            <SparklesIcon className="w-8 h-8 text-primary-500 mx-auto" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{nft.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{nft.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {nft.nft_type.replace('_', ' ').toUpperCase()}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(nft.created_at)}
          </span>
        </div>

        <div className="flex space-x-2">
          <button className="flex-1 btn-secondary text-sm">
            View Details
          </button>
          <Link to="/marketplace" className="flex-1 btn-primary text-sm text-center">
            List for Sale
          </Link>
        </div>
      </div>
    </div>
  );

  if (nftData.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NFT Gallery</h1>
          <p className="text-gray-600 mt-1">
            Your collection of unique pet NFTs and milestones
          </p>
        </div>
        <button
          onClick={() => setShowMintModal(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Mint NFT
        </button>
      </div>

      {nftData.nfts.length === 0 ? (
        <div className="text-center py-16">
          <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No NFTs in your collection yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first NFT to celebrate your pet's milestones and special moments.
          </p>
          <button
            onClick={() => setShowMintModal(true)}
            className="btn-primary"
          >
            Mint Your First NFT
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {nftData.nfts.map((nft) => (
            <NFTCard key={nft.nft_id} nft={nft} />
          ))}
        </div>
      )}

      {/* Coming Soon Modal */}
      {showMintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <SparklesIcon className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">NFT Minting</h3>
              <p className="text-gray-600 mb-6">
                NFT minting functionality is coming soon! Premium subscribers will be able to mint NFTs for free.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMintModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Close
                </button>
                <Link
                  to="/subscription/upgrade"
                  className="flex-1 btn-primary text-center"
                >
                  Upgrade Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTGalleryPage;