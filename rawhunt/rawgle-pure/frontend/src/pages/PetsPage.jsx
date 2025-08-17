import React from 'react';
import { Link } from 'react-router-dom';
import { usePets } from '../hooks/usePets';
import {
  PlusIcon,
  HeartIcon,
  PencilIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { calculateAge, getPetTypeIcon, capitalizeFirst } from '../utils/helpers';

const PetsPage = () => {
  const { pets, isLoading, error } = usePets();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Pets</h1>
          <p className="text-gray-600 mt-1">
            Manage your pet profiles and track their health
          </p>
        </div>
        <Link to="/pets/add" className="btn-primary flex items-center">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Pet
        </Link>
      </div>

      {pets.length === 0 ? (
        <div className="text-center py-16">
          <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No pets yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start by adding your first pet to begin tracking their health,
            feeding schedule, and earning PAWS rewards.
          </p>
          <Link to="/pets/add" className="btn-primary">
            Add Your First Pet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <div key={pet.pet_id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">{getPetTypeIcon(pet.pet_type)}</div>
                <div className="flex space-x-2">
                  <Link
                    to={`/pets/${pet.pet_id}`}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="View details"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/pets/${pet.pet_id}/edit`}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="Edit pet"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {pet.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {capitalizeFirst(pet.pet_type)} • {pet.breed}
                </p>
                <p className="text-sm text-gray-500">
                  {calculateAge(pet.birth_date)}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender:</span>
                  <span className="text-gray-900">{capitalizeFirst(pet.gender || 'Unknown')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="text-gray-900">{pet.weight ? `${pet.weight} kg` : 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Color:</span>
                  <span className="text-gray-900">{pet.color || 'Not specified'}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  <Link
                    to={`/pets/${pet.pet_id}`}
                    className="flex-1 btn-secondary text-center text-sm"
                  >
                    View Profile
                  </Link>
                  <Link
                    to={`/feeding?pet=${pet.pet_id}`}
                    className="flex-1 btn-primary text-center text-sm"
                  >
                    Log Feeding
                  </Link>
                </div>
              </div>

              {/* Health Status Indicator */}
              <div className="mt-3 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Healthy</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pets.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Have another furry friend? 
            <Link to="/pets/add" className="text-primary-600 hover:text-primary-500 font-medium ml-1">
              Add them here
            </Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default PetsPage;