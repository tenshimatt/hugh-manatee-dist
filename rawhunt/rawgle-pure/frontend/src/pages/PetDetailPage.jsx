import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePets } from '../hooks/usePets';
import {
  ArrowLeftIcon,
  PencilIcon,
  HeartIcon,
  CameraIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { calculateAge, getPetTypeIcon, capitalizeFirst, formatDate } from '../utils/helpers';
import { feedingService } from '../services/api';

const PetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPet, deletePet, isLoading: petsLoading } = usePets();
  
  const [pet, setPet] = useState(null);
  const [recentFeedings, setRecentFeedings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPetDetails();
  }, [id, petsLoading]);

  const loadPetDetails = async () => {
    if (petsLoading) return;

    const petData = getPet(id);
    if (!petData) {
      navigate('/pets');
      return;
    }

    setPet(petData);

    try {
      const feedingData = await feedingService.getFeedingHistory(id, 7);
      setRecentFeedings(feedingData.feedings || []);
    } catch (error) {
      console.error('Error loading feeding history:', error);
      setRecentFeedings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePet = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePet(pet.pet_id);
      if (result.success) {
        navigate('/pets', { 
          state: { message: `${pet.name} has been removed successfully.` }
        });
      } else {
        alert('Failed to delete pet: ' + result.error);
      }
    } catch (error) {
      alert('An error occurred while deleting the pet.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading || petsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Pet not found</p>
        <Link to="/pets" className="btn-primary">
          Back to Pets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/pets')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="text-4xl">{getPetTypeIcon(pet.pet_type)}</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{pet.name}</h1>
              <p className="text-gray-600">
                {capitalizeFirst(pet.pet_type)} • {pet.breed} • {calculateAge(pet.birth_date)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Link
            to={`/pets/${pet.pet_id}/edit`}
            className="btn-secondary flex items-center"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn-secondary flex items-center text-red-600 border-red-200 hover:bg-red-50"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-medium text-gray-900">{pet.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <p className="font-medium text-gray-900">{capitalizeFirst(pet.pet_type)}</p>
              </div>
              <div>
                <span className="text-gray-600">Breed:</span>
                <p className="font-medium text-gray-900">{pet.breed}</p>
              </div>
              <div>
                <span className="text-gray-600">Age:</span>
                <p className="font-medium text-gray-900">{calculateAge(pet.birth_date)}</p>
              </div>
              <div>
                <span className="text-gray-600">Birth Date:</span>
                <p className="font-medium text-gray-900">{formatDate(pet.birth_date)}</p>
              </div>
              <div>
                <span className="text-gray-600">Gender:</span>
                <p className="font-medium text-gray-900">{capitalizeFirst(pet.gender || 'Unknown')}</p>
              </div>
              <div>
                <span className="text-gray-600">Weight:</span>
                <p className="font-medium text-gray-900">{pet.weight ? `${pet.weight} kg` : 'Not recorded'}</p>
              </div>
              <div>
                <span className="text-gray-600">Color:</span>
                <p className="font-medium text-gray-900">{pet.color || 'Not specified'}</p>
              </div>
              {pet.microchip_id && (
                <div className="col-span-2">
                  <span className="text-gray-600">Microchip ID:</span>
                  <p className="font-medium text-gray-900">{pet.microchip_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Health Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Information</h2>
            <div className="space-y-4 text-sm">
              {pet.medical_conditions && (
                <div>
                  <span className="text-gray-600 font-medium">Medical Conditions:</span>
                  <p className="text-gray-900 mt-1">{pet.medical_conditions}</p>
                </div>
              )}
              {pet.allergies && (
                <div>
                  <span className="text-gray-600 font-medium">Allergies:</span>
                  <p className="text-gray-900 mt-1">{pet.allergies}</p>
                </div>
              )}
              {pet.current_medications && (
                <div>
                  <span className="text-gray-600 font-medium">Current Medications:</span>
                  <p className="text-gray-900 mt-1">{pet.current_medications}</p>
                </div>
              )}
              {!pet.medical_conditions && !pet.allergies && !pet.current_medications && (
                <p className="text-gray-500 italic">No health information recorded</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          {(pet.veterinarian_contact || pet.emergency_contact) && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4 text-sm">
                {pet.veterinarian_contact && (
                  <div>
                    <span className="text-gray-600 font-medium">Veterinarian:</span>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{pet.veterinarian_contact}</p>
                  </div>
                )}
                {pet.emergency_contact && (
                  <div>
                    <span className="text-gray-600 font-medium">Emergency Contact:</span>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{pet.emergency_contact}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          {pet.special_instructions && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Care Instructions</h2>
              <p className="text-gray-900 text-sm whitespace-pre-wrap">{pet.special_instructions}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to={`/feeding?pet=${pet.pet_id}`}
                className="btn-primary w-full flex items-center justify-center"
              >
                <CameraIcon className="w-4 h-4 mr-2" />
                Log Feeding
              </Link>
              <Link
                to={`/ai-medical?pet=${pet.pet_id}`}
                className="btn-secondary w-full flex items-center justify-center"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                AI Consultation
              </Link>
              <Link
                to={`/analytics?pet=${pet.pet_id}`}
                className="btn-secondary w-full flex items-center justify-center"
              >
                <HeartIcon className="w-4 h-4 mr-2" />
                View Analytics
              </Link>
            </div>
          </div>

          {/* Recent Feeding */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Feedings</h3>
            {recentFeedings.length > 0 ? (
              <div className="space-y-3">
                {recentFeedings.slice(0, 5).map((feeding, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-900">{feeding.food_type}</span>
                      <span className="text-gray-500">{formatDate(feeding.feeding_time)}</span>
                    </div>
                    <p className="text-gray-600 text-xs">{feeding.portion_size} • {feeding.notes}</p>
                  </div>
                ))}
                <Link
                  to={`/feeding?pet=${pet.pet_id}`}
                  className="text-primary-600 hover:text-primary-500 text-sm font-medium block text-center pt-2 border-t border-gray-200"
                >
                  View All Feedings
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <CameraIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm mb-3">No feeding records yet</p>
                <Link
                  to={`/feeding?pet=${pet.pet_id}`}
                  className="btn-primary text-sm"
                >
                  Log First Feeding
                </Link>
              </div>
            )}
          </div>

          {/* Health Status */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Status</h3>
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-700 font-medium">Healthy</span>
            </div>
            <p className="text-gray-600 text-sm">
              Last updated: {formatDate(pet.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Pet Profile</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{pet.name}</strong>? This action cannot be undone and will remove all associated data including feeding records and health history.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePet}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span className="ml-2">Deleting...</span>
                  </>
                ) : (
                  'Delete Pet'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetDetailPage;