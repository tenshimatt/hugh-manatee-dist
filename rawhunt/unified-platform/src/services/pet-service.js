// Pet Service
// Manages pet profiles for both Rawgle (all pets) and GoHunta (dogs) platforms

export class PetService {
  constructor(db, kv, r2 = null) {
    this.db = db;
    this.kv = kv;
    this.r2 = r2; // For photo uploads
  }

  /**
   * Create a new pet profile
   * @param {string} userId 
   * @param {Object} petData 
   * @param {'rawgle' | 'gohunta'} platform 
   * @returns {Promise<Object>}
   */
  async createPet(userId, petData, platform) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Validate required fields
    const { name, species = 'dog', breed } = petData;
    if (!name) {
      throw new Error('Pet name is required');
    }

    if (name.length < 1 || name.length > 50) {
      throw new Error('Pet name must be between 1 and 50 characters');
    }

    // Platform-specific validations
    if (platform === 'gohunta' && species !== 'dog') {
      throw new Error('GoHunta platform only supports dogs');
    }

    // Validate GoHunta-specific fields
    if (platform === 'gohunta' && petData.hunting_style) {
      const validHuntingStyles = ['pointing', 'flushing', 'retrieving', 'tracking', 'coursing'];
      if (!validHuntingStyles.includes(petData.hunting_style)) {
        throw new Error('Invalid hunting style');
      }
    }

    if (platform === 'gohunta' && petData.training_level) {
      const validTrainingLevels = ['puppy', 'started', 'seasoned', 'finished', 'master'];
      if (!validTrainingLevels.includes(petData.training_level)) {
        throw new Error('Invalid training level');
      }
    }

    // Validate common fields
    if (petData.gender && !['male', 'female', 'unknown'].includes(petData.gender)) {
      throw new Error('Invalid gender');
    }

    if (petData.birth_date && !this.isValidDate(petData.birth_date)) {
      throw new Error('Invalid birth date');
    }

    if (petData.weight_lbs && (petData.weight_lbs < 0 || petData.weight_lbs > 300)) {
      throw new Error('Weight must be between 0 and 300 pounds');
    }

    try {
      // Verify user exists
      const user = await this.db
        .prepare('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL')
        .bind(userId)
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      const petId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Convert weight if provided
      const weightKg = petData.weight_lbs ? petData.weight_lbs * 0.453592 : null;

      await this.db
        .prepare(`
          INSERT INTO pets (
            id, user_id, name, species, breed, birth_date, gender,
            weight_lbs, weight_kg, color_markings, registration_number, microchip_id,
            feeding_type, allergies, dietary_restrictions, feeding_schedule,
            hunting_style, training_level, energy_level,
            health_records, vaccination_records, insurance_info, photos, notes,
            active, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
        `)
        .bind(
          petId, userId, name, species, breed, petData.birth_date, petData.gender,
          petData.weight_lbs, weightKg, petData.color_markings, petData.registration_number, petData.microchip_id,
          petData.feeding_type, this.jsonStringify(petData.allergies), this.jsonStringify(petData.dietary_restrictions), this.jsonStringify(petData.feeding_schedule),
          petData.hunting_style, petData.training_level, petData.energy_level,
          this.jsonStringify(petData.health_records), this.jsonStringify(petData.vaccination_records), this.jsonStringify(petData.insurance_info),
          JSON.stringify([]), petData.notes,
          1, now, now
        )
        .run();

      // Create default training goals for GoHunta dogs
      if (platform === 'gohunta') {
        await this.createDefaultTrainingGoals(petId);
      }

      // Log pet creation
      await this.logPetAction(userId, petId, 'pet_created', { platform });

      return await this.getPetProfile(petId, userId);
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('Invalid') || error.message === 'User not found') {
        throw error;
      }
      console.error('Create pet error:', error);
      throw new Error('Failed to create pet profile');
    }
  }

  /**
   * Get pet profile by ID
   * @param {string} petId 
   * @param {string} requestingUserId 
   * @returns {Promise<Object>}
   */
  async getPetProfile(petId, requestingUserId) {
    if (!petId) {
      throw new Error('Pet ID is required');
    }

    try {
      const pet = await this.db
        .prepare(`
          SELECT p.*, u.name as owner_name
          FROM pets p
          LEFT JOIN users u ON p.user_id = u.id
          WHERE p.id = ? AND p.active = 1
        `)
        .bind(petId)
        .first();

      if (!pet) {
        throw new Error('Pet not found');
      }

      // Check access permissions
      if (requestingUserId !== pet.user_id) {
        // TODO: Check if user has permission to view this pet (e.g., shared with them)
        // For now, only owner can view
        throw new Error('Access denied');
      }

      const profile = {
        id: pet.id,
        userId: pet.user_id,
        ownerName: pet.owner_name,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        birthDate: pet.birth_date,
        gender: pet.gender,
        weightLbs: pet.weight_lbs,
        weightKg: pet.weight_kg,
        colorMarkings: pet.color_markings,
        registrationNumber: pet.registration_number,
        microchipId: pet.microchip_id,
        // Rawgle-specific fields
        feedingType: pet.feeding_type,
        allergies: this.jsonParse(pet.allergies),
        dietaryRestrictions: this.jsonParse(pet.dietary_restrictions),
        feedingSchedule: this.jsonParse(pet.feeding_schedule),
        // GoHunta-specific fields
        huntingStyle: pet.hunting_style,
        trainingLevel: pet.training_level,
        energyLevel: pet.energy_level,
        // Shared fields
        healthRecords: this.jsonParse(pet.health_records),
        vaccinationRecords: this.jsonParse(pet.vaccination_records),
        insuranceInfo: this.jsonParse(pet.insurance_info),
        photos: this.jsonParse(pet.photos),
        notes: pet.notes,
        createdAt: pet.created_at,
        updatedAt: pet.updated_at
      };

      // Calculate age if birth date is provided
      if (pet.birth_date) {
        profile.age = this.calculateAge(pet.birth_date);
      }

      return profile;
    } catch (error) {
      if (error.message === 'Pet not found' || error.message === 'Access denied') {
        throw error;
      }
      console.error('Get pet profile error:', error);
      throw new Error('Failed to retrieve pet profile');
    }
  }

  /**
   * Update pet profile
   * @param {string} petId 
   * @param {string} userId 
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  async updatePet(petId, userId, updates) {
    if (!petId || !userId) {
      throw new Error('Pet ID and User ID are required');
    }

    // Check ownership
    const existingPet = await this.db
      .prepare('SELECT user_id FROM pets WHERE id = ? AND active = 1')
      .bind(petId)
      .first();

    if (!existingPet) {
      throw new Error('Pet not found');
    }

    if (existingPet.user_id !== userId) {
      throw new Error('Access denied');
    }

    // Validate updates
    const allowedFields = [
      'name', 'breed', 'birth_date', 'gender', 'weight_lbs', 'color_markings',
      'registration_number', 'microchip_id', 'feeding_type', 'allergies',
      'dietary_restrictions', 'feeding_schedule', 'hunting_style', 'training_level',
      'energy_level', 'health_records', 'vaccination_records', 'insurance_info', 'notes'
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

    // Validate specific fields
    if (validUpdates.name && (validUpdates.name.length < 1 || validUpdates.name.length > 50)) {
      throw new Error('Pet name must be between 1 and 50 characters');
    }

    if (validUpdates.gender && !['male', 'female', 'unknown'].includes(validUpdates.gender)) {
      throw new Error('Invalid gender');
    }

    if (validUpdates.birth_date && !this.isValidDate(validUpdates.birth_date)) {
      throw new Error('Invalid birth date');
    }

    if (validUpdates.weight_lbs && (validUpdates.weight_lbs < 0 || validUpdates.weight_lbs > 300)) {
      throw new Error('Weight must be between 0 and 300 pounds');
    }

    if (validUpdates.hunting_style) {
      const validHuntingStyles = ['pointing', 'flushing', 'retrieving', 'tracking', 'coursing'];
      if (!validHuntingStyles.includes(validUpdates.hunting_style)) {
        throw new Error('Invalid hunting style');
      }
    }

    if (validUpdates.training_level) {
      const validTrainingLevels = ['puppy', 'started', 'seasoned', 'finished', 'master'];
      if (!validTrainingLevels.includes(validUpdates.training_level)) {
        throw new Error('Invalid training level');
      }
    }

    if (validUpdates.energy_level && (validUpdates.energy_level < 1 || validUpdates.energy_level > 5)) {
      throw new Error('Energy level must be between 1 and 5');
    }

    try {
      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];

      for (const [key, value] of Object.entries(validUpdates)) {
        if (['allergies', 'dietary_restrictions', 'feeding_schedule', 'health_records', 'vaccination_records', 'insurance_info'].includes(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(this.jsonStringify(value));
        } else if (key === 'weight_lbs') {
          updateFields.push('weight_lbs = ?', 'weight_kg = ?');
          updateValues.push(value, value * 0.453592);
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date().toISOString());
      updateValues.push(petId);

      await this.db
        .prepare(`UPDATE pets SET ${updateFields.join(', ')} WHERE id = ?`)
        .bind(...updateValues)
        .run();

      // Log pet update
      await this.logPetAction(userId, petId, 'pet_updated', { updatedFields: Object.keys(validUpdates) });

      return await this.getPetProfile(petId, userId);
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('must be')) {
        throw error;
      }
      console.error('Update pet error:', error);
      throw new Error('Failed to update pet profile');
    }
  }

  /**
   * Upload pet photos
   * @param {string} petId 
   * @param {string} userId 
   * @param {Array} imageFiles 
   * @param {Array} contentTypes 
   * @returns {Promise<Object>}
   */
  async uploadPhotos(petId, userId, imageFiles, contentTypes) {
    if (!petId || !userId) {
      throw new Error('Pet ID and User ID are required');
    }

    if (!imageFiles || imageFiles.length === 0) {
      throw new Error('At least one image file is required');
    }

    if (imageFiles.length > 10) {
      throw new Error('Maximum 10 photos allowed');
    }

    // Check ownership
    const pet = await this.db
      .prepare('SELECT user_id, photos FROM pets WHERE id = ? AND active = 1')
      .bind(petId)
      .first();

    if (!pet) {
      throw new Error('Pet not found');
    }

    if (pet.user_id !== userId) {
      throw new Error('Access denied');
    }

    // Validate content types and sizes
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const contentType = contentTypes[i];

      if (!allowedTypes.includes(contentType)) {
        throw new Error(`Invalid image format for file ${i + 1}. Allowed: JPEG, PNG, WEBP`);
      }

      if (file.size && file.size > maxSize) {
        throw new Error(`Image file ${i + 1} too large. Maximum size: 5MB`);
      }
    }

    try {
      const currentPhotos = this.jsonParse(pet.photos) || [];
      
      if (currentPhotos.length + imageFiles.length > 10) {
        throw new Error(`Cannot exceed 10 total photos. Current: ${currentPhotos.length}`);
      }

      const uploadedPhotos = [];

      // Upload files
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const contentType = contentTypes[i];
        
        let photoUrl = null;

        if (this.r2) {
          const fileName = `pets/${petId}/${Date.now()}_${i}.${this.getFileExtension(contentType)}`;
          
          await this.r2.put(fileName, file, {
            httpMetadata: {
              contentType: contentType
            }
          });

          photoUrl = `https://your-r2-domain.com/${fileName}`;
        } else {
          // For testing, create a mock URL
          photoUrl = `mock://pet-photo/${petId}_${i}.${this.getFileExtension(contentType)}`;
        }

        uploadedPhotos.push({
          url: photoUrl,
          contentType,
          uploadedAt: new Date().toISOString(),
          fileName: `photo_${Date.now()}_${i}`
        });
      }

      // Update pet photos
      const allPhotos = [...currentPhotos, ...uploadedPhotos];
      
      await this.db
        .prepare('UPDATE pets SET photos = ?, updated_at = ? WHERE id = ?')
        .bind(JSON.stringify(allPhotos), new Date().toISOString(), petId)
        .run();

      // Log photo upload
      await this.logPetAction(userId, petId, 'photos_uploaded', { 
        photoCount: uploadedPhotos.length,
        totalPhotos: allPhotos.length 
      });

      return {
        uploadedPhotos,
        totalPhotos: allPhotos.length
      };
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('Maximum') || error.message.includes('Cannot exceed')) {
        throw error;
      }
      console.error('Upload photos error:', error);
      throw new Error('Failed to upload photos');
    }
  }

  /**
   * Delete pet photo
   * @param {string} petId 
   * @param {string} userId 
   * @param {string} photoUrl 
   * @returns {Promise<void>}
   */
  async deletePhoto(petId, userId, photoUrl) {
    if (!petId || !userId || !photoUrl) {
      throw new Error('Pet ID, User ID, and photo URL are required');
    }

    // Check ownership
    const pet = await this.db
      .prepare('SELECT user_id, photos FROM pets WHERE id = ? AND active = 1')
      .bind(petId)
      .first();

    if (!pet) {
      throw new Error('Pet not found');
    }

    if (pet.user_id !== userId) {
      throw new Error('Access denied');
    }

    try {
      const currentPhotos = this.jsonParse(pet.photos) || [];
      const photoIndex = currentPhotos.findIndex(photo => photo.url === photoUrl);

      if (photoIndex === -1) {
        throw new Error('Photo not found');
      }

      // Delete from R2 if exists
      if (this.r2 && photoUrl.includes('pets/')) {
        try {
          const fileName = photoUrl.split('/').pop();
          await this.r2.delete(`pets/${petId}/${fileName}`);
        } catch (error) {
          console.warn('Failed to delete photo from R2:', error);
        }
      }

      // Remove from photos array
      currentPhotos.splice(photoIndex, 1);

      await this.db
        .prepare('UPDATE pets SET photos = ?, updated_at = ? WHERE id = ?')
        .bind(JSON.stringify(currentPhotos), new Date().toISOString(), petId)
        .run();

      // Log photo deletion
      await this.logPetAction(userId, petId, 'photo_deleted', { photoUrl });

    } catch (error) {
      if (error.message === 'Pet not found' || error.message === 'Photo not found' || error.message === 'Access denied') {
        throw error;
      }
      console.error('Delete photo error:', error);
      throw new Error('Failed to delete photo');
    }
  }

  /**
   * Get user's pets
   * @param {string} userId 
   * @param {Object} options 
   * @returns {Promise<Array>}
   */
  async getUserPets(userId, options = {}) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { species, active = true } = options;

    try {
      let query = 'SELECT * FROM pets WHERE user_id = ?';
      const params = [userId];

      if (active) {
        query += ' AND active = 1';
      }

      if (species) {
        query += ' AND species = ?';
        params.push(species);
      }

      query += ' ORDER BY name ASC';

      const pets = await this.db
        .prepare(query)
        .bind(...params)
        .all();

      return pets.results.map(pet => ({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        birthDate: pet.birth_date,
        age: pet.birth_date ? this.calculateAge(pet.birth_date) : null,
        gender: pet.gender,
        huntingStyle: pet.hunting_style,
        trainingLevel: pet.training_level,
        photos: this.jsonParse(pet.photos),
        createdAt: pet.created_at,
        updatedAt: pet.updated_at
      }));
    } catch (error) {
      console.error('Get user pets error:', error);
      throw new Error('Failed to retrieve pets');
    }
  }

  /**
   * Soft delete pet
   * @param {string} petId 
   * @param {string} userId 
   * @returns {Promise<void>}
   */
  async deletePet(petId, userId) {
    if (!petId || !userId) {
      throw new Error('Pet ID and User ID are required');
    }

    // Check ownership
    const pet = await this.db
      .prepare('SELECT user_id FROM pets WHERE id = ? AND active = 1')
      .bind(petId)
      .first();

    if (!pet) {
      throw new Error('Pet not found');
    }

    if (pet.user_id !== userId) {
      throw new Error('Access denied');
    }

    try {
      await this.db
        .prepare('UPDATE pets SET active = 0, updated_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), petId)
        .run();

      // Log pet deletion
      await this.logPetAction(userId, petId, 'pet_deleted');

      // TODO: Handle related data cleanup (training sessions, feeding logs, etc.)
    } catch (error) {
      console.error('Delete pet error:', error);
      throw new Error('Failed to delete pet');
    }
  }

  /**
   * Create default training goals for GoHunta dogs
   * @param {string} petId 
   * @returns {Promise<void>}
   */
  async createDefaultTrainingGoals(petId) {
    const defaultGoals = [
      {
        goal_type: 'obedience',
        target_skill: 'basic_commands',
        description: 'Master basic commands: sit, stay, come, heel',
        priority: 'high'
      },
      {
        goal_type: 'pointing',
        target_skill: 'steady_point',
        description: 'Hold point steadily until released',
        priority: 'medium'
      },
      {
        goal_type: 'retrieving',
        target_skill: 'soft_mouth',
        description: 'Retrieve game with gentle mouth delivery',
        priority: 'medium'
      }
    ];

    try {
      for (const goal of defaultGoals) {
        const goalId = crypto.randomUUID();
        await this.db
          .prepare(`
            INSERT INTO training_goals (
              id, dog_id, goal_type, target_skill, description, priority,
              current_level, target_level, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            goalId, petId, goal.goal_type, goal.target_skill, goal.description, goal.priority,
            1, 5, new Date().toISOString(), new Date().toISOString()
          )
          .run();
      }
    } catch (error) {
      console.warn('Failed to create default training goals:', error);
      // Don't throw error for this non-critical operation
    }
  }

  // Helper methods

  /**
   * Validate date format
   * @param {string} dateString 
   * @returns {boolean}
   */
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date <= new Date();
  }

  /**
   * Calculate age from birth date
   * @param {string} birthDate 
   * @returns {Object}
   */
  calculateAge(birthDate) {
    const birth = new Date(birthDate);
    const now = new Date();
    const diffTime = Math.abs(now - birth);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    return {
      years,
      months,
      totalDays: diffDays,
      formatted: years > 0 ? `${years} year${years > 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}` : `${months} month${months !== 1 ? 's' : ''}`
    };
  }

  /**
   * Get file extension from content type
   * @param {string} contentType 
   * @returns {string}
   */
  getFileExtension(contentType) {
    const extensions = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    };
    return extensions[contentType] || 'jpg';
  }

  /**
   * Safe JSON stringify
   * @param {any} value 
   * @returns {string|null}
   */
  jsonStringify(value) {
    if (value === undefined || value === null) {
      return null;
    }
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  /**
   * Safe JSON parse
   * @param {string} value 
   * @returns {any}
   */
  jsonParse(value) {
    if (!value) return null;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      return null;
    }
  }

  /**
   * Log pet action for analytics
   * @param {string} userId 
   * @param {string} petId 
   * @param {string} action 
   * @param {Object} details 
   * @returns {Promise<void>}
   */
  async logPetAction(userId, petId, action, details = {}) {
    try {
      const logEntry = {
        userId,
        petId,
        action,
        details,
        timestamp: new Date().toISOString()
      };

      await this.kv.put(
        `pet_action:${userId}:${petId}:${Date.now()}`,
        JSON.stringify(logEntry),
        { expirationTtl: 24 * 60 * 60 } // 24 hours
      );
    } catch (error) {
      console.warn('Failed to log pet action:', error);
      // Don't throw error for logging failures
    }
  }
}