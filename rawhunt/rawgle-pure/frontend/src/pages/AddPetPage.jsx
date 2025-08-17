import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePets } from '../hooks/usePets';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { PET_TYPES } from '../utils/constants';
import { capitalizeFirst } from '../utils/helpers';

const AddPetPage = () => {
  const navigate = useNavigate();
  const { createPet } = usePets();
  
  const [formData, setFormData] = useState({
    name: '',
    pet_type: '',
    breed: '',
    birth_date: '',
    gender: '',
    weight: '',
    color: '',
    microchip_id: '',
    medical_conditions: '',
    allergies: '',
    current_medications: '',
    veterinarian_contact: '',
    emergency_contact: '',
    special_instructions: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Pet name is required';
    }

    if (!formData.pet_type) {
      errors.pet_type = 'Pet type is required';
    }

    if (!formData.breed.trim()) {
      errors.breed = 'Breed is required';
    }

    if (!formData.birth_date) {
      errors.birth_date = 'Birth date is required';
    } else {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      if (birthDate > today) {
        errors.birth_date = 'Birth date cannot be in the future';
      }
    }

    if (formData.weight && (isNaN(formData.weight) || parseFloat(formData.weight) <= 0)) {
      errors.weight = 'Weight must be a positive number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: '',
      });
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    // Prepare data for API
    const petData = {
      ...formData,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      medical_conditions: formData.medical_conditions || null,
      allergies: formData.allergies || null,
      current_medications: formData.current_medications || null,
      veterinarian_contact: formData.veterinarian_contact || null,
      emergency_contact: formData.emergency_contact || null,
      special_instructions: formData.special_instructions || null,
      microchip_id: formData.microchip_id || null,
    };

    try {
      const result = await createPet(petData);

      if (result.success) {
        navigate('/pets', { 
          state: { message: `${formData.name} has been added successfully!` }
        });
      } else {
        setError(result.error || 'Failed to add pet. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Pet</h1>
          <p className="text-gray-600 mt-1">
            Create a profile for your furry friend
          </p>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Pet Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className={`mt-1 input-field ${validationErrors.name ? 'border-red-500' : ''}`}
                  placeholder="Enter pet's name"
                  value={formData.name}
                  onChange={handleChange}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="pet_type" className="block text-sm font-medium text-gray-700">
                  Pet Type *
                </label>
                <select
                  id="pet_type"
                  name="pet_type"
                  required
                  className={`mt-1 input-field ${validationErrors.pet_type ? 'border-red-500' : ''}`}
                  value={formData.pet_type}
                  onChange={handleChange}
                >
                  <option value="">Select pet type</option>
                  {Object.values(PET_TYPES).map((type) => (
                    <option key={type} value={type}>
                      {capitalizeFirst(type.replace('_', ' '))}
                    </option>
                  ))}
                </select>
                {validationErrors.pet_type && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.pet_type}</p>
                )}
              </div>

              <div>
                <label htmlFor="breed" className="block text-sm font-medium text-gray-700">
                  Breed *
                </label>
                <input
                  type="text"
                  id="breed"
                  name="breed"
                  required
                  className={`mt-1 input-field ${validationErrors.breed ? 'border-red-500' : ''}`}
                  placeholder="e.g., Golden Retriever"
                  value={formData.breed}
                  onChange={handleChange}
                />
                {validationErrors.breed && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.breed}</p>
                )}
              </div>

              <div>
                <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                  Birth Date *
                </label>
                <input
                  type="date"
                  id="birth_date"
                  name="birth_date"
                  required
                  className={`mt-1 input-field ${validationErrors.birth_date ? 'border-red-500' : ''}`}
                  value={formData.birth_date}
                  onChange={handleChange}
                />
                {validationErrors.birth_date && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.birth_date}</p>
                )}
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  className="mt-1 input-field"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="weight"
                  name="weight"
                  className={`mt-1 input-field ${validationErrors.weight ? 'border-red-500' : ''}`}
                  placeholder="e.g., 25.5"
                  value={formData.weight}
                  onChange={handleChange}
                />
                {validationErrors.weight && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.weight}</p>
                )}
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                  Color
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  className="mt-1 input-field"
                  placeholder="e.g., Golden, Black & White"
                  value={formData.color}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="microchip_id" className="block text-sm font-medium text-gray-700">
                  Microchip ID
                </label>
                <input
                  type="text"
                  id="microchip_id"
                  name="microchip_id"
                  className="mt-1 input-field"
                  placeholder="Enter microchip number"
                  value={formData.microchip_id}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Health Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Health Information</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="medical_conditions" className="block text-sm font-medium text-gray-700">
                  Medical Conditions
                </label>
                <textarea
                  id="medical_conditions"
                  name="medical_conditions"
                  rows="3"
                  className="mt-1 input-field"
                  placeholder="List any known medical conditions..."
                  value={formData.medical_conditions}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">
                  Allergies
                </label>
                <textarea
                  id="allergies"
                  name="allergies"
                  rows="2"
                  className="mt-1 input-field"
                  placeholder="List any known allergies..."
                  value={formData.allergies}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="current_medications" className="block text-sm font-medium text-gray-700">
                  Current Medications
                </label>
                <textarea
                  id="current_medications"
                  name="current_medications"
                  rows="2"
                  className="mt-1 input-field"
                  placeholder="List current medications and dosages..."
                  value={formData.current_medications}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="veterinarian_contact" className="block text-sm font-medium text-gray-700">
                  Veterinarian Contact
                </label>
                <textarea
                  id="veterinarian_contact"
                  name="veterinarian_contact"
                  rows="3"
                  className="mt-1 input-field"
                  placeholder="Vet name, phone, address..."
                  value={formData.veterinarian_contact}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700">
                  Emergency Contact
                </label>
                <textarea
                  id="emergency_contact"
                  name="emergency_contact"
                  rows="3"
                  className="mt-1 input-field"
                  placeholder="Emergency contact name and phone..."
                  value={formData.emergency_contact}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label htmlFor="special_instructions" className="block text-sm font-medium text-gray-700">
              Special Care Instructions
            </label>
            <textarea
              id="special_instructions"
              name="special_instructions"
              rows="3"
              className="mt-1 input-field"
              placeholder="Any special care instructions, dietary requirements, behavioral notes..."
              value={formData.special_instructions}
              onChange={handleChange}
            />
          </div>

          {/* Form Actions */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span className="ml-2">Adding Pet...</span>
                </>
              ) : (
                'Add Pet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPetPage;