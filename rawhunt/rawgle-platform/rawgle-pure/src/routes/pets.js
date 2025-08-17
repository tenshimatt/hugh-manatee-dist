import { validateEmail, sanitizeInput } from '../lib/validation.js';
import { corsHeaders } from '../lib/cors.js';
import { v4 as uuidv4 } from 'uuid';

// Constants
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const PROFILE_COMPLETION_FIELDS = ['name', 'breed', 'age_category', 'weight', 'activity_level'];

// Authentication helper
async function authenticateUser(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' };
  }
  
  const token = authHeader.substring(7);
  const sessionData = await env.SESSIONS.get(token);
  
  if (!sessionData) {
    return { valid: false, error: 'Invalid or expired session' };
  }
  
  const session = JSON.parse(sessionData);
  
  // Check if session is expired
  if (new Date() > new Date(session.expiresAt)) {
    await env.SESSIONS.delete(token);
    return { valid: false, error: 'Session expired' };
  }
  
  return { valid: true, userId: session.userId, email: session.email };
}

// Check profile completion percentage
function calculateProfileCompletion(petData) {
  let completedFields = 0;
  let totalFields = PROFILE_COMPLETION_FIELDS.length;
  
  PROFILE_COMPLETION_FIELDS.forEach(field => {
    if (petData[field] && petData[field].toString().trim() !== '') {
      completedFields++;
    }
  });
  
  // Bonus points for profile image
  if (petData.profile_image_r2_key) {
    completedFields += 0.5;
    totalFields += 0.5;
  }
  
  return Math.round((completedFields / totalFields) * 100);
}

// Image upload functions disabled until R2 storage is configured
// (uploadProfileImage function removed)

// Get all pets for a user
async function getUserPets(request, env) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const pets = await env.DB.prepare(`
      SELECT 
        p.*,
        COUNT(f.id) as feeding_logs_count,
        COUNT(c.id) as consultation_count,
        n.solana_mint_address
      FROM pet_profiles p
      LEFT JOIN feeding_logs f ON p.id = f.pet_id
      LEFT JOIN ai_consultations c ON p.id = c.pet_id
      LEFT JOIN nft_mints n ON p.id = n.pet_id
      WHERE p.user_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).bind(auth.userId).all();
    
    const petsWithCompletion = pets.results.map(pet => ({
      ...pet,
      profileCompletion: calculateProfileCompletion(pet),
      hasNFT: !!pet.solana_mint_address
    }));
    
    return new Response(JSON.stringify({
      pets: petsWithCompletion,
      totalCount: pets.results.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get user pets error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Create new pet profile
async function createPetProfile(request, env) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { name, breed, age_category, weight, activity_level, private_bio } = body;
    
    // Validate required fields
    if (!name || !breed) {
      return new Response(JSON.stringify({ error: 'Name and breed are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(name),
      breed: sanitizeInput(breed),
      age_category: age_category ? sanitizeInput(age_category) : null,
      weight: weight ? parseFloat(weight) : null,
      activity_level: activity_level ? sanitizeInput(activity_level) : 'moderate',
      private_bio: private_bio ? sanitizeInput(private_bio) : null
    };
    
    // Validate weight
    if (sanitizedData.weight && (sanitizedData.weight <= 0 || sanitizedData.weight > 200)) {
      return new Response(JSON.stringify({ error: 'Weight must be between 0 and 200 kg' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate activity level
    const validActivityLevels = ['low', 'moderate', 'high', 'very_high'];
    if (!validActivityLevels.includes(sanitizedData.activity_level)) {
      sanitizedData.activity_level = 'moderate';
    }
    
    const petId = uuidv4();
    
    // Create pet profile
    await env.DB.prepare(`
      INSERT INTO pet_profiles (id, user_id, name, breed, age_category, weight, activity_level, private_bio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      petId,
      auth.userId,
      sanitizedData.name,
      sanitizedData.breed,
      sanitizedData.age_category,
      sanitizedData.weight,
      sanitizedData.activity_level,
      sanitizedData.private_bio
    ).run();
    
    // Get the created pet with completion percentage
    const createdPet = await env.DB.prepare('SELECT * FROM pet_profiles WHERE id = ?')
      .bind(petId).first();
    
    const petWithCompletion = {
      ...createdPet,
      profileCompletion: calculateProfileCompletion(createdPet),
      hasNFT: false
    };
    
    // Award PAWS for creating profile (direct implementation)
    try {
      // Update user balance directly
      await env.DB.prepare('UPDATE users SET paws_balance = paws_balance + 25 WHERE id = ?')
        .bind(auth.userId).run();
      
      // Create transaction record
      await env.DB.prepare(`
        INSERT INTO paws_transactions (id, user_id, amount, transaction_type, description, status)
        VALUES (?, ?, 25, 'reward', ?, 'completed')
      `).bind(uuidv4(), auth.userId, `Created profile for ${sanitizedData.name}`).run();
    } catch (pawsError) {
      console.warn('Failed to award PAWS for pet creation:', pawsError);
    }
    
    return new Response(JSON.stringify({
      pet: petWithCompletion,
      message: 'Pet profile created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Create pet profile error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get specific pet profile
async function getPetProfile(request, env) {
  try {
    const url = new URL(request.url);
    const petId = url.pathname.split('/').pop();
    
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get pet with additional data
    const pet = await env.DB.prepare(`
      SELECT 
        p.*,
        COUNT(f.id) as feeding_logs_count,
        COUNT(c.id) as consultation_count,
        n.solana_mint_address,
        n.metadata_r2_key
      FROM pet_profiles p
      LEFT JOIN feeding_logs f ON p.id = f.pet_id
      LEFT JOIN ai_consultations c ON p.id = c.pet_id
      LEFT JOIN nft_mints n ON p.id = n.pet_id
      WHERE p.id = ? AND p.user_id = ?
      GROUP BY p.id
    `).bind(petId, auth.userId).first();
    
    if (!pet) {
      return new Response(JSON.stringify({ error: 'Pet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get recent feeding logs
    const recentFeedings = await env.DB.prepare(`
      SELECT * FROM feeding_logs 
      WHERE pet_id = ? 
      ORDER BY log_date DESC, created_at DESC 
      LIMIT 5
    `).bind(petId).all();
    
    // Get recent consultations
    const recentConsultations = await env.DB.prepare(`
      SELECT id, symptoms, confidence_score, emergency, created_at 
      FROM ai_consultations 
      WHERE pet_id = ? 
      ORDER BY created_at DESC 
      LIMIT 3
    `).bind(petId).all();
    
    const petWithData = {
      ...pet,
      profileCompletion: calculateProfileCompletion(pet),
      hasNFT: !!pet.solana_mint_address,
      recentFeedings: recentFeedings.results || [],
      recentConsultations: recentConsultations.results || []
    };
    
    return new Response(JSON.stringify({ pet: petWithData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get pet profile error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Update pet profile
async function updatePetProfile(request, env) {
  try {
    const url = new URL(request.url);
    const petId = url.pathname.split('/').pop();
    
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verify pet ownership
    const existingPet = await env.DB.prepare(
      'SELECT * FROM pet_profiles WHERE id = ? AND user_id = ?'
    ).bind(petId, auth.userId).first();
    
    if (!existingPet) {
      return new Response(JSON.stringify({ error: 'Pet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { name, breed, age_category, weight, activity_level, private_bio, memorial_mode } = body;
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(sanitizeInput(name));
    }
    
    if (breed !== undefined) {
      updateFields.push('breed = ?');
      updateValues.push(sanitizeInput(breed));
    }
    
    if (age_category !== undefined) {
      updateFields.push('age_category = ?');
      updateValues.push(age_category ? sanitizeInput(age_category) : null);
    }
    
    if (weight !== undefined) {
      const numWeight = weight ? parseFloat(weight) : null;
      if (numWeight && (numWeight <= 0 || numWeight > 200)) {
        return new Response(JSON.stringify({ error: 'Weight must be between 0 and 200 kg' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      updateFields.push('weight = ?');
      updateValues.push(numWeight);
    }
    
    if (activity_level !== undefined) {
      const validLevels = ['low', 'moderate', 'high', 'very_high'];
      const level = validLevels.includes(activity_level) ? activity_level : 'moderate';
      updateFields.push('activity_level = ?');
      updateValues.push(level);
    }
    
    if (private_bio !== undefined) {
      updateFields.push('private_bio = ?');
      updateValues.push(private_bio ? sanitizeInput(private_bio) : null);
    }
    
    if (memorial_mode !== undefined) {
      updateFields.push('memorial_mode = ?');
      updateValues.push(!!memorial_mode);
    }
    
    if (updateFields.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(petId); // For WHERE clause
    
    const updateQuery = `
      UPDATE pet_profiles 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;
    
    await env.DB.prepare(updateQuery).bind(...updateValues).run();
    
    // Get updated pet
    const updatedPet = await env.DB.prepare('SELECT * FROM pet_profiles WHERE id = ?')
      .bind(petId).first();
    
    const petWithCompletion = {
      ...updatedPet,
      profileCompletion: calculateProfileCompletion(updatedPet)
    };
    
    // Award PAWS for profile completion milestones
    const oldCompletion = calculateProfileCompletion(existingPet);
    const newCompletion = petWithCompletion.profileCompletion;
    
    if (oldCompletion < 100 && newCompletion === 100) {
      try {
        // Update user balance directly
        await env.DB.prepare('UPDATE users SET paws_balance = paws_balance + 50 WHERE id = ?')
          .bind(auth.userId).run();
        
        // Create transaction record
        await env.DB.prepare(`
          INSERT INTO paws_transactions (id, user_id, amount, transaction_type, description, status)
          VALUES (?, ?, 50, 'reward', ?, 'completed')
        `).bind(uuidv4(), auth.userId, `Completed profile for ${updatedPet.name}`).run();
      } catch (pawsError) {
        console.warn('Failed to award PAWS for profile completion:', pawsError);
      }
    }
    
    return new Response(JSON.stringify({
      pet: petWithCompletion,
      message: 'Pet profile updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Update pet profile error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Upload pet profile image (disabled - R2 storage not configured)
async function uploadPetImage(request, env) {
  return new Response(JSON.stringify({
    error: 'Image upload temporarily disabled - R2 storage not configured',
    message: 'Image upload functionality will be available once R2 buckets are set up'
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Delete pet profile
async function deletePetProfile(request, env) {
  try {
    const url = new URL(request.url);
    const petId = url.pathname.split('/').pop();
    
    const auth = await authenticateUser(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verify pet ownership and get pet data
    const pet = await env.DB.prepare(
      'SELECT * FROM pet_profiles WHERE id = ? AND user_id = ?'
    ).bind(petId, auth.userId).first();
    
    if (!pet) {
      return new Response(JSON.stringify({ error: 'Pet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if pet has NFT
    const nftMint = await env.DB.prepare(
      'SELECT solana_mint_address FROM nft_mints WHERE pet_id = ?'
    ).bind(petId).first();
    
    if (nftMint && nftMint.solana_mint_address) {
      return new Response(JSON.stringify({ 
        error: 'Cannot delete pet profile with minted NFT. Consider memorial mode instead.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      // Begin transaction-like operations
      // Delete associated records first
      await env.DB.prepare('DELETE FROM feeding_logs WHERE pet_id = ?').bind(petId).run();
      await env.DB.prepare('DELETE FROM ai_consultations WHERE pet_id = ?').bind(petId).run();
      await env.DB.prepare('DELETE FROM nft_mints WHERE pet_id = ?').bind(petId).run();
      await env.DB.prepare('DELETE FROM emergency_alerts WHERE pet_id = ?').bind(petId).run();
      
      // Delete the pet profile
      await env.DB.prepare('DELETE FROM pet_profiles WHERE id = ?').bind(petId).run();
      
      // Note: Profile images would be deleted from R2 storage when configured
      if (pet.profile_image_r2_key) {
        console.log('Profile image key found but R2 deletion skipped:', pet.profile_image_r2_key);
      }
      
      return new Response(JSON.stringify({
        message: `Pet profile for ${pet.name} has been deleted successfully`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (dbError) {
      console.error('Database deletion error:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to delete pet profile' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Delete pet profile error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Main handler
export default async function handlePets(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    let response;
    
    // GET /api/pets - Get all user pets
    if (path === '/api/pets' && method === 'GET') {
      response = await getUserPets(request, env);
    }
    // POST /api/pets - Create new pet profile
    else if (path === '/api/pets' && method === 'POST') {
      response = await createPetProfile(request, env);
    }
    // GET /api/pets/{petId} - Get specific pet profile
    else if (path.match(/^\/api\/pets\/[a-f0-9-]+$/) && method === 'GET') {
      response = await getPetProfile(request, env);
    }
    // PUT /api/pets/{petId} - Update pet profile
    else if (path.match(/^\/api\/pets\/[a-f0-9-]+$/) && method === 'PUT') {
      response = await updatePetProfile(request, env);
    }
    // DELETE /api/pets/{petId} - Delete pet profile
    else if (path.match(/^\/api\/pets\/[a-f0-9-]+$/) && method === 'DELETE') {
      response = await deletePetProfile(request, env);
    }
    // POST /api/pets/{petId}/image - Upload pet profile image
    else if (path.match(/^\/api\/pets\/[a-f0-9-]+\/image$/) && method === 'POST') {
      response = await uploadPetImage(request, env);
    }
    else {
      response = new Response(JSON.stringify({
        error: 'Not found',
        availableEndpoints: [
          'GET /api/pets - Get all user pets',
          'POST /api/pets - Create new pet profile',
          'GET /api/pets/{petId} - Get specific pet profile',
          'PUT /api/pets/{petId} - Update pet profile',
          'DELETE /api/pets/{petId} - Delete pet profile',
          'POST /api/pets/{petId}/image - Upload profile image'
        ]
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
    
  } catch (error) {
    console.error('Pets handler error:', error);
    const response = new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
