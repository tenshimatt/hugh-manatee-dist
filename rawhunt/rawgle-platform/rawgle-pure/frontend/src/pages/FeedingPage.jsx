import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePets } from '../hooks/usePets';
import {
  PlusIcon,
  CameraIcon,
  ClockIcon,
  ScaleIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { feedingService, pawsService } from '../services/api';
import { formatDateTime, formatDate, getPetTypeIcon } from '../utils/helpers';
import { FEEDING_TYPES } from '../utils/constants';

const FeedingPage = () => {
  const [searchParams] = useSearchParams();
  const selectedPetId = searchParams.get('pet');
  
  const { pets, isLoading: petsLoading } = usePets();
  
  const [feedingData, setFeedingData] = useState({
    feedings: [],
    isLoading: true,
  });
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    pet_id: selectedPetId || '',
    food_type: '',
    portion_size: '',
    feeding_time: new Date().toISOString().slice(0, 16),
    notes: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedPetId && pets.length > 0) {
      loadFeedingHistory(selectedPetId);
    } else if (pets.length > 0 && !selectedPetId) {
      loadAllFeedings();
    }
  }, [selectedPetId, pets]);

  const loadFeedingHistory = async (petId) => {
    try {
      setFeedingData({ feedings: [], isLoading: true });
      const data = await feedingService.getFeedingHistory(petId, 30);
      setFeedingData({ 
        feedings: data.feedings || [], 
        isLoading: false 
      });
    } catch (err) {
      console.error('Error loading feeding history:', err);
      setFeedingData({ feedings: [], isLoading: false });
    }
  };

  const loadAllFeedings = async () => {
    try {
      setFeedingData({ feedings: [], isLoading: true });
      // Load recent feedings for all pets
      const allFeedings = [];
      for (const pet of pets.slice(0, 3)) { // Limit to first 3 pets for performance
        try {
          const data = await feedingService.getFeedingHistory(pet.pet_id, 7);
          allFeedings.push(...(data.feedings || []).map(f => ({ ...f, pet_name: pet.name })));
        } catch (err) {
          console.error(`Error loading feedings for pet ${pet.pet_id}:`, err);
        }
      }
      allFeedings.sort((a, b) => new Date(b.feeding_time) - new Date(a.feeding_time));
      setFeedingData({ 
        feedings: allFeedings, 
        isLoading: false 
      });
    } catch (err) {
      console.error('Error loading all feedings:', err);
      setFeedingData({ feedings: [], isLoading: false });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const feedingPayload = {
        ...formData,
        pet_id: parseInt(formData.pet_id),
        feeding_time: new Date(formData.feeding_time).toISOString(),
      };

      await feedingService.logFeeding(feedingPayload);
      
      // Try to earn reward for daily feeding
      try {
        await pawsService.earnReward('daily_feeding', { pet_id: feedingPayload.pet_id });
      } catch (rewardErr) {
        // Reward earning failed, but feeding was logged successfully
        console.log('Reward earning failed:', rewardErr);
      }

      // Reset form
      setFormData({
        pet_id: selectedPetId || '',
        food_type: '',
        portion_size: '',
        feeding_time: new Date().toISOString().slice(0, 16),
        notes: '',
      });
      
      setShowAddForm(false);
      
      // Reload feeding data
      if (selectedPetId) {
        loadFeedingHistory(selectedPetId);
      } else {
        loadAllFeedings();
      }
      
    } catch (err) {
      setError(err.message || 'Failed to log feeding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const selectedPet = selectedPetId ? pets.find(p => p.pet_id === parseInt(selectedPetId)) : null;

  if (petsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="text-center py-16">
        <CameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">No pets found</h3>
        <p className="text-gray-600 mb-6">You need to add a pet first before logging feedings.</p>
        <a href="/pets/add" className="btn-primary">
          Add Your First Pet
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feeding Tracker</h1>
          <p className="text-gray-600 mt-1">
            {selectedPet 
              ? `Feeding history for ${selectedPet.name}` 
              : 'Track daily feeding activities for all your pets'
            }
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Log Feeding
        </button>
      </div>

      {/* Pet Selector */}
      {!selectedPetId && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Pet</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pets.map((pet) => (
              <a
                key={pet.pet_id}
                href={`/feeding?pet=${pet.pet_id}`}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-2xl">{getPetTypeIcon(pet.pet_type)}</div>
                <div>
                  <p className="font-medium text-gray-900">{pet.name}</p>
                  <p className="text-sm text-gray-600">{pet.breed}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Add Feeding Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Feeding</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Pet *</label>
                <select
                  name="pet_id"
                  required
                  className="mt-1 input-field"
                  value={formData.pet_id}
                  onChange={handleChange}
                >
                  <option value="">Select a pet</option>
                  {pets.map((pet) => (
                    <option key={pet.pet_id} value={pet.pet_id}>
                      {pet.name} ({pet.breed})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Food Type *</label>
                <select
                  name="food_type"
                  required
                  className="mt-1 input-field"
                  value={formData.food_type}
                  onChange={handleChange}
                >
                  <option value="">Select food type</option>
                  {Object.values(FEEDING_TYPES).map((type) => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Portion Size *</label>
                <input
                  type="text"
                  name="portion_size"
                  required
                  className="mt-1 input-field"
                  placeholder="e.g., 1 cup, 200g, 2 scoops"
                  value={formData.portion_size}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Feeding Time *</label>
                <input
                  type="datetime-local"
                  name="feeding_time"
                  required
                  className="mt-1 input-field"
                  value={formData.feeding_time}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  name="notes"
                  rows="3"
                  className="mt-1 input-field"
                  placeholder="Any additional notes about this feeding..."
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span className="ml-2">Logging...</span>
                    </>
                  ) : (
                    'Log Feeding'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feeding History */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Feedings
          {selectedPet && ` for ${selectedPet.name}`}
        </h2>

        {feedingData.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : feedingData.feedings.length === 0 ? (
          <div className="text-center py-12">
            <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feeding records yet</h3>
            <p className="text-gray-600 mb-4">
              Start tracking your pet's feeding schedule to earn PAWS rewards!
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Log First Feeding
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {feedingData.feedings.map((feeding, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <ScaleIcon className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {feeding.food_type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">{feeding.portion_size}</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
                      <ClockIcon className="w-4 h-4" />
                      <span>{formatDateTime(feeding.feeding_time)}</span>
                      {feeding.pet_name && (
                        <>
                          <span>•</span>
                          <span>{feeding.pet_name}</span>
                        </>
                      )}
                    </div>
                    
                    {feeding.notes && (
                      <p className="text-sm text-gray-600 bg-gray-100 rounded p-2 mt-2">
                        {feeding.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {feedingData.feedings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-primary-500 mb-2">
              {feedingData.feedings.length}
            </div>
            <p className="text-gray-600">Total Feedings</p>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </div>
          
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-secondary-500 mb-2">
              {new Set(feedingData.feedings.map(f => formatDate(f.feeding_time))).size}
            </div>
            <p className="text-gray-600">Days Tracked</p>
            <p className="text-xs text-gray-500 mt-1">Consistency matters!</p>
          </div>
          
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-accent-500 mb-2">
              {Math.round(feedingData.feedings.length / 30 * 10) * 10}
            </div>
            <p className="text-gray-600">PAWS Earned</p>
            <p className="text-xs text-gray-500 mt-1">From feeding logs</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedingPage;