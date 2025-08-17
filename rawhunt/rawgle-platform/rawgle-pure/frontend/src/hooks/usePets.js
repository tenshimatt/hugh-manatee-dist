import { useState, useEffect } from 'react';
import { petService } from '../services/api';

export const usePets = () => {
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPets = async () => {
    try {
      setIsLoading(true);
      const data = await petService.getPets();
      setPets(data.pets || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load pets');
      setPets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createPet = async (petData) => {
    try {
      const newPet = await petService.createPet(petData);
      setPets(prev => [...prev, newPet]);
      return { success: true, pet: newPet };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to create pet' };
    }
  };

  const updatePet = async (petId, petData) => {
    try {
      const updatedPet = await petService.updatePet(petId, petData);
      setPets(prev => prev.map(pet => 
        pet.pet_id === petId ? { ...pet, ...updatedPet } : pet
      ));
      return { success: true, pet: updatedPet };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to update pet' };
    }
  };

  const deletePet = async (petId) => {
    try {
      await petService.deletePet(petId);
      setPets(prev => prev.filter(pet => pet.pet_id !== petId));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to delete pet' };
    }
  };

  const getPet = (petId) => {
    return pets.find(pet => pet.pet_id === parseInt(petId));
  };

  useEffect(() => {
    loadPets();
  }, []);

  return {
    pets,
    isLoading,
    error,
    loadPets,
    createPet,
    updatePet,
    deletePet,
    getPet,
  };
};