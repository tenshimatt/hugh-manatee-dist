/**
 * Pet Service for Rawgle
 * Handles pet profile operations and business logic
 */

import { nanoid } from 'nanoid';

export class PetService {
  constructor(db, kv, r2 = null) {
    this.db = db;
    this.kv = kv;
    this.r2 = r2;
  }

  /**
   * Get user's pets
   * @param {string} userId - User ID
   * @param {Object} filters - Filters for pets
   * @returns {Promise<Array>} List of pets
   */
  async getUserPets(userId, filters = {}) {
    let whereClause = 'WHERE user_id = ? AND active = ?';
    const bindings = [userId, true];
    
    if (filters.species) {
      whereClause += ' AND species = ?';
      bindings.push(filters.species);
    }
    
    const pets = await this.db
      .prepare(`
        SELECT id, name, species, breed, birth_date, gender, weight_lbs,
               color_markings, feeding_type, activity_level, photos,
               nft_minted, nft_token_id, created_at, updated_at
        FROM pets
        ${whereClause}
        ORDER BY created_at DESC
      `)
      .bind(...bindings)
      .all();
    
    return (pets.results || []).map(pet => ({
      ...pet,
      photos: JSON.parse(pet.photos || '[]'),
      allergies: JSON.parse(pet.allergies || '[]'),
      dietary_restrictions: JSON.parse(pet.dietary_restrictions || '[]')
    }));
  }

  /**
   * Create new pet profile
   * @param {string} userId - User ID
   * @param {Object} petData - Pet data
   * @param {string} platform - Platform (rawgle)
   * @returns {Promise<Object>} Created pet
   */
  async createPet(userId, petData, platform = 'rawgle') {
    const petId = nanoid(21);
    const now = new Date().toISOString();
    
    // Calculate age if birth_date provided
    let age_months = null;
    if (petData.birth_date) {
      const birthDate = new Date(petData.birth_date);
      const today = new Date();
      age_months = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24 * 30.44));
    }
    
    // Convert weight to kg if lbs provided
    let weight_kg = null;
    if (petData.weight_lbs) {
      weight_kg = Math.round((petData.weight_lbs / 2.20462) * 100) / 100;
    }
    
    const pet = {
      id: petId,
      user_id: userId,
      name: petData.name,
      species: petData.species || 'dog',
      breed: petData.breed || null,
      birth_date: petData.birth_date || null,
      gender: petData.gender || null,
      weight_lbs: petData.weight_lbs || null,
      weight_kg: weight_kg,
      color_markings: petData.color_markings || null,
      registration_number: petData.registration_number || null,
      microchip_id: petData.microchip_id || null,
      feeding_type: petData.feeding_type || 'raw',
      allergies: JSON.stringify(petData.allergies || []),
      dietary_restrictions: JSON.stringify(petData.dietary_restrictions || []),
      feeding_schedule: JSON.stringify(petData.feeding_schedule || {
        meals_per_day: 2,
        breakfast_time: '07:00',
        dinner_time: '17:00'
      }),
      target_daily_calories: petData.target_daily_calories || null,
      activity_level: petData.activity_level || 'moderate',
      health_records: JSON.stringify(petData.health_records || []),
      vaccination_records: JSON.stringify(petData.vaccination_records || []),
      photos: JSON.stringify([]),
      notes: petData.notes || null,
      active: true,
      created_at: now,
      updated_at: now
    };
    
    await this.db
      .prepare(`
        INSERT INTO pets (
          id, user_id, name, species, breed, birth_date, gender,
          weight_lbs, weight_kg, color_markings, registration_number, microchip_id,
          feeding_type, allergies, dietary_restrictions, feeding_schedule,
          target_daily_calories, activity_level, health_records, vaccination_records,
          photos, notes, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        pet.id, pet.user_id, pet.name, pet.species, pet.breed, pet.birth_date, pet.gender,
        pet.weight_lbs, pet.weight_kg, pet.color_markings, pet.registration_number, pet.microchip_id,
        pet.feeding_type, pet.allergies, pet.dietary_restrictions, pet.feeding_schedule,
        pet.target_daily_calories, pet.activity_level, pet.health_records, pet.vaccination_records,
        pet.photos, pet.notes, pet.active, pet.created_at, pet.updated_at
      )
      .run();
    
    return {
      ...pet,
      photos: [],
      allergies: JSON.parse(pet.allergies),
      dietary_restrictions: JSON.parse(pet.dietary_restrictions),
      feeding_schedule: JSON.parse(pet.feeding_schedule),
      health_records: JSON.parse(pet.health_records),
      vaccination_records: JSON.parse(pet.vaccination_records)
    };
  }

  /**
   * Get pet profile
   * @param {string} petId - Pet ID
   * @param {string} userId - User ID for ownership check
   * @returns {Promise<Object>} Pet profile
   */
  async getPetProfile(petId, userId) {
    const pet = await this.db
      .prepare(`
        SELECT * FROM pets 
        WHERE id = ? AND user_id = ? AND active = 1
      `)
      .bind(petId, userId)
      .first();
    
    if (!pet) {
      throw new Error('Pet not found or access denied');
    }
    
    return {
      ...pet,
      photos: JSON.parse(pet.photos || '[]'),
      allergies: JSON.parse(pet.allergies || '[]'),
      dietary_restrictions: JSON.parse(pet.dietary_restrictions || '[]'),
      feeding_schedule: JSON.parse(pet.feeding_schedule || '{}'),
      health_records: JSON.parse(pet.health_records || '[]'),
      vaccination_records: JSON.parse(pet.vaccination_records || '[]')
    };
  }

  /**
   * Update pet profile
   * @param {string} petId - Pet ID
   * @param {string} userId - User ID for ownership check
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated pet profile
   */
  async updatePet(petId, userId, updates) {
    // Verify ownership
    const existing = await this.db
      .prepare('SELECT user_id FROM pets WHERE id = ? AND active = 1')
      .bind(petId)
      .first();
    
    if (!existing || existing.user_id !== userId) {
      throw new Error('Pet not found or access denied');
    }
    
    const allowedFields = [
      'name', 'breed', 'birth_date', 'gender', 'weight_lbs', 'color_markings',
      'registration_number', 'microchip_id', 'feeding_type', 'allergies',
      'dietary_restrictions', 'feeding_schedule', 'target_daily_calories',
      'activity_level', 'health_records', 'vaccination_records', 'notes'
    ];
    
    const validUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        validUpdates[key] = value;
      }
    }
    
    if (Object.keys(validUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Handle weight conversion
    if (validUpdates.weight_lbs) {
      validUpdates.weight_kg = Math.round((validUpdates.weight_lbs / 2.20462) * 100) / 100;
    }
    
    // Handle JSON fields
    const jsonFields = ['allergies', 'dietary_restrictions', 'feeding_schedule', 'health_records', 'vaccination_records'];
    for (const field of jsonFields) {
      if (field in validUpdates) {
        validUpdates[field] = JSON.stringify(validUpdates[field]);
      }
    }
    
    // Build update query
    const updateFields = Object.keys(validUpdates).map(field => `${field} = ?`);
    updateFields.push('updated_at = ?');
    
    const updateValues = Object.values(validUpdates);
    updateValues.push(new Date().toISOString());
    updateValues.push(petId);
    
    await this.db
      .prepare(`UPDATE pets SET ${updateFields.join(', ')} WHERE id = ?`)
      .bind(...updateValues)
      .run();
    
    return await this.getPetProfile(petId, userId);
  }

  /**
   * Delete pet profile (soft delete)
   * @param {string} petId - Pet ID
   * @param {string} userId - User ID for ownership check
   */
  async deletePet(petId, userId) {
    // Verify ownership
    const existing = await this.db
      .prepare('SELECT user_id FROM pets WHERE id = ? AND active = 1')
      .bind(petId)
      .first();
    
    if (!existing || existing.user_id !== userId) {
      throw new Error('Pet not found or access denied');
    }
    
    await this.db
      .prepare('UPDATE pets SET active = 0, updated_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), petId)
      .run();
  }

  /**
   * Upload pet photos
   * @param {string} petId - Pet ID
   * @param {string} userId - User ID for ownership check
   * @param {Array} files - File objects
   * @param {Array} mimeTypes - MIME types
   * @returns {Promise<Object>} Upload result
   */
  async uploadPhotos(petId, userId, files, mimeTypes) {
    // Verify ownership
    const pet = await this.db
      .prepare('SELECT user_id, photos FROM pets WHERE id = ? AND active = 1')
      .bind(petId)
      .first();
    
    if (!pet || pet.user_id !== userId) {
      throw new Error('Pet not found or access denied');
    }
    
    const currentPhotos = JSON.parse(pet.photos || '[]');
    const maxPhotos = 10;
    
    if (currentPhotos.length + files.length > maxPhotos) {
      throw new Error(`Maximum ${maxPhotos} photos allowed per pet`);
    }
    
    const uploadedUrls = [];
    
    if (this.r2) {
      // Upload to R2 storage
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = nanoid(16);
        const fileExtension = mimeTypes[i] === 'image/jpeg' ? 'jpg' : 
                             mimeTypes[i] === 'image/png' ? 'png' : 'webp';
        const fileName = `pets/${petId}/${fileId}.${fileExtension}`;
        
        try {
          await this.r2.put(fileName, file, {
            httpMetadata: { contentType: mimeTypes[i] }
          });
          
          uploadedUrls.push(`https://your-r2-domain.com/${fileName}`);
        } catch (error) {
          console.error('R2 upload error:', error);
          throw new Error(`Failed to upload file: ${error.message}`);
        }
      }
    } else {
      // Fallback: generate placeholder URLs
      for (let i = 0; i < files.length; i++) {
        const fileId = nanoid(16);
        uploadedUrls.push(`https://placeholder.rawgle.com/pets/${petId}/${fileId}.jpg`);
      }
    }
    
    // Update pet photos array
    const updatedPhotos = [...currentPhotos, ...uploadedUrls];
    
    await this.db
      .prepare('UPDATE pets SET photos = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(updatedPhotos), new Date().toISOString(), petId)
      .run();
    
    return {
      uploaded_urls: uploadedUrls,
      total_photos: updatedPhotos.length
    };
  }

  /**
   * Delete pet photo
   * @param {string} petId - Pet ID
   * @param {string} userId - User ID for ownership check
   * @param {string} photoUrl - Photo URL to delete
   */
  async deletePhoto(petId, userId, photoUrl) {
    // Verify ownership
    const pet = await this.db
      .prepare('SELECT user_id, photos FROM pets WHERE id = ? AND active = 1')
      .bind(petId)
      .first();
    
    if (!pet || pet.user_id !== userId) {
      throw new Error('Pet not found or access denied');
    }
    
    const currentPhotos = JSON.parse(pet.photos || '[]');
    const photoIndex = currentPhotos.indexOf(photoUrl);
    
    if (photoIndex === -1) {
      throw new Error('Photo not found');
    }
    
    // Remove from R2 if configured
    if (this.r2 && photoUrl.includes('your-r2-domain.com')) {
      const fileName = photoUrl.split('your-r2-domain.com/')[1];
      try {
        await this.r2.delete(fileName);
      } catch (error) {
        console.warn('R2 delete warning:', error);
        // Continue even if R2 delete fails
      }
    }
    
    // Remove from photos array
    currentPhotos.splice(photoIndex, 1);
    
    await this.db
      .prepare('UPDATE pets SET photos = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(currentPhotos), new Date().toISOString(), petId)
      .run();
  }
}