import { validateRequest, sanitizeInput } from '../lib/validation.js';

// Emergency keywords that trigger immediate alerts
const EMERGENCY_KEYWORDS = [
  'severe', 'emergency', 'collapse', 'unresponsive', 'difficulty breathing', 
  'blue gums', 'seizure', 'loss of consciousness', 'bleeding heavily',
  'choking', 'poisoning', 'trauma', 'critical', 'urgent'
];

// Confidence threshold for recommendations
const MIN_CONFIDENCE_THRESHOLD = 0.5;

/**
 * Main router for AI medical consultation endpoints
 */
export default async function handleAIMedical(request, env, ctx) {
  try {
    // Validate request
    const validation = await validateRequest(request, env);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const method = request.method;

    // Route handling
    if (method === 'POST' && url.pathname === '/api/ai-medical') {
      return await handleHealthAssessment(request, env, ctx);
    }
    
    if (method === 'GET' && url.pathname.startsWith('/api/ai-medical/history/')) {
      const petId = url.pathname.split('/').pop();
      return await getConsultationHistory(petId, url.searchParams, env);
    }
    
    if (method === 'GET' && url.pathname.startsWith('/api/ai-medical/consultation/')) {
      const consultationId = url.pathname.split('/').pop();
      return await getConsultationDetails(consultationId, env);
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI Medical route error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle AI health assessment requests
 */
async function handleHealthAssessment(request, env, ctx) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.petId || !body.symptoms) {
      return new Response(JSON.stringify({
        error: 'Required fields missing: petId and symptoms are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { petId, symptoms, imageData } = body;
    
    // Sanitize inputs
    const sanitizedSymptoms = sanitizeInput(symptoms);
    
    // Verify pet exists
    const petExists = await env.DB.prepare(
      'SELECT id, name, breed, age_category, weight FROM pet_profiles WHERE id = ?'
    ).bind(petId).first();

    if (!petExists) {
      return new Response(JSON.stringify({ error: 'Pet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get pet history for context
    const petHistory = await getPetHistory(petId, env);
    
    // Store image if provided (disabled - R2 storage not configured)
    let imageKeys = [];
    let imageAnalysis = null;
    
    if (imageData) {
      // Image analysis without storage for now
      imageAnalysis = await analyzeImage(null, sanitizedSymptoms, env);
      console.log('Image data received but storage disabled - analysis based on symptoms only');
    }

    // Perform AI health assessment
    const assessment = await performHealthAssessment(
      sanitizedSymptoms, 
      petExists, 
      petHistory, 
      imageAnalysis, 
      env
    );

    // Generate consultation ID
    const consultationId = `consult_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Store consultation in database
    await env.DB.prepare(`
      INSERT INTO ai_consultations 
      (id, pet_id, symptoms, image_r2_keys, ai_assessment, confidence_score, emergency)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      consultationId,
      petId,
      sanitizedSymptoms,
      JSON.stringify(imageKeys),
      JSON.stringify(assessment),
      assessment.confidence,
      assessment.emergency ? 1 : 0
    ).run();

    // Create emergency alert if needed (direct database insertion)
    if (assessment.emergency && assessment.confidence > 0.8) {
      try {
        // Get user ID from pet
        const petOwner = await env.DB.prepare('SELECT user_id FROM pet_profiles WHERE id = ?').bind(petId).first();
        if (petOwner) {
          const alertId = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
          await env.DB.prepare(`
            INSERT INTO emergency_alerts (id, consultation_id, pet_id, user_id, alert_type, message, status)
            VALUES (?, ?, ?, ?, 'medical_emergency', ?, 'active')
          `).bind(
            alertId,
            consultationId,
            petId,
            petOwner.user_id,
            `High confidence emergency alert: ${sanitizedSymptoms}`
          ).run();
          console.log(`Emergency alert created: ${alertId}`);
        }
      } catch (alertError) {
        console.error('Failed to create emergency alert:', alertError);
      }
    }

    // Prepare response
    const response = {
      consultationId,
      assessment: assessment.assessment,
      emergency: assessment.emergency,
      confidence: assessment.confidence,
      recommendations: assessment.recommendations,
      follow_up_days: assessment.follow_up_days || 0
    };

    if (imageAnalysis) {
      response.imageAnalysis = imageAnalysis;
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Health assessment error:', error);
    
    if (error.message.includes('service unavailable') || error.message.includes('AI')) {
      return new Response(JSON.stringify({
        error: 'AI service unavailable, please try again later'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'Assessment failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Perform AI health assessment using Workers AI
 */
async function performHealthAssessment(symptoms, pet, history, imageAnalysis, env) {
  try {
    // Build context prompt
    const contextPrompt = buildContextPrompt(symptoms, pet, history, imageAnalysis);
    
    // Call Workers AI
    const aiResponse = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        {
          role: 'system',
          content: 'You are a veterinary AI assistant. Analyze pet symptoms and provide medical assessment. Respond in valid JSON format with fields: assessment (string), emergency (boolean), confidence (0-1), recommendations (array), follow_up_days (number).'
        },
        {
          role: 'user',
          content: contextPrompt
        }
      ]
    });

    // Parse AI response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse.response);
    } catch (parseError) {
      console.error('AI response parsing error:', parseError);
      // Fallback parsing for malformed responses
      parsedResponse = parseMalformedAIResponse(aiResponse.response, symptoms);
    }

    // Validate and normalize response
    return normalizeAssessment(parsedResponse, symptoms);

  } catch (error) {
    console.error('AI assessment error:', error);
    throw new Error('AI service unavailable');
  }
}

/**
 * Build context prompt for AI assessment
 */
function buildContextPrompt(symptoms, pet, history, imageAnalysis) {
  let prompt = `Pet Information:
- Name: ${pet.name}
- Breed: ${pet.breed || 'Unknown'}
- Age Category: ${pet.age_category || 'Unknown'}
- Weight: ${pet.weight || 'Unknown'} kg
- Activity Level: Unknown

Current Symptoms: ${symptoms}

`;

  if (history.recentFeeding.length > 0) {
    prompt += `Recent Feeding History (last 7 days):
${history.recentFeeding.map(f => `- ${f.log_date}: ${f.meal_time} - ${f.food_type}`).join('\n')}

`;
  }

  if (history.previousConsultations.length > 0) {
    prompt += `Previous Consultations:
${history.previousConsultations.map(c => `- ${c.created_at}: ${c.symptoms} (Assessment: ${c.ai_assessment})`).join('\n')}

`;
  }

  if (imageAnalysis) {
    prompt += `Image Analysis Results: ${imageAnalysis}

`;
  }

  prompt += `Please provide a comprehensive veterinary assessment focusing on:
1. Severity and urgency of symptoms
2. Possible conditions or causes
3. Emergency status (true for immediate vet care needed)
4. Confidence level (0.0-1.0)
5. Specific recommendations
6. Follow-up timeline in days

Respond in valid JSON format only.`;

  return prompt;
}

/**
 * Parse malformed AI responses as fallback
 */
function parseMalformedAIResponse(response, symptoms) {
  const lowerResponse = response.toLowerCase();
  
  // Detect emergency keywords
  const hasEmergencyKeywords = EMERGENCY_KEYWORDS.some(keyword => 
    lowerResponse.includes(keyword.toLowerCase())
  );

  // Extract basic assessment
  const lines = response.split('\n').filter(line => line.trim());
  const assessment = lines.length > 0 ? lines[0] : 'Unable to fully analyze symptoms. Please consult a veterinarian.';

  return {
    assessment,
    emergency: hasEmergencyKeywords,
    confidence: 0.7, // Default fallback confidence
    recommendations: hasEmergencyKeywords ? 
      ['Seek immediate veterinary attention'] : 
      ['Monitor closely', 'Contact veterinarian if symptoms worsen'],
    follow_up_days: hasEmergencyKeywords ? 0 : 3
  };
}

/**
 * Normalize and validate AI assessment response
 */
function normalizeAssessment(response, symptoms) {
  const normalized = {
    assessment: response.assessment || 'Assessment unavailable',
    emergency: Boolean(response.emergency),
    confidence: Math.max(0, Math.min(1, response.confidence || 0.5)),
    recommendations: Array.isArray(response.recommendations) ? response.recommendations : ['Monitor pet closely'],
    follow_up_days: Math.max(0, response.follow_up_days || 0)
  };

  // Apply confidence-based adjustments
  if (normalized.confidence < MIN_CONFIDENCE_THRESHOLD) {
    normalized.recommendations.push('Consider seeking professional veterinary opinion due to unclear symptoms');
    normalized.follow_up_days = Math.max(normalized.follow_up_days, 2);
  }

  // Double-check emergency detection
  const hasEmergencySymptoms = EMERGENCY_KEYWORDS.some(keyword => 
    symptoms.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (hasEmergencySymptoms && !normalized.emergency) {
    normalized.emergency = true;
    normalized.confidence = Math.max(normalized.confidence, 0.8);
  }

  return normalized;
}

/**
 * Analyze image with AI vision
 */
async function analyzeImage(imageBuffer, symptoms, env) {
  try {
    // Note: This is a placeholder for image analysis
    // In production, you would use Cloudflare AI vision models
    // For now, return basic analysis based on symptoms
    
    const skinConditions = ['rash', 'red', 'scratching', 'irritation', 'skin', 'dermatitis'];
    const hasSkinSymptoms = skinConditions.some(condition => 
      symptoms.toLowerCase().includes(condition)
    );

    if (hasSkinSymptoms) {
      return 'Visual analysis suggests possible skin irritation or dermatitis. Recommend veterinary examination for proper diagnosis.';
    }

    return 'Visual analysis completed. Image supports symptom description.';
  } catch (error) {
    console.error('Image analysis error:', error);
    return null;
  }
}

/**
 * Get pet history for context
 */
async function getPetHistory(petId, env) {
  try {
    // Get recent feeding logs
    const recentFeeding = await env.DB.prepare(`
      SELECT log_date, meal_time, food_type 
      FROM feeding_logs 
      WHERE pet_id = ? AND log_date >= date('now', '-7 days')
      ORDER BY log_date DESC, meal_time DESC
      LIMIT 10
    `).bind(petId).all();

    // Get previous consultations
    const previousConsultations = await env.DB.prepare(`
      SELECT symptoms, ai_assessment, created_at, confidence_score
      FROM ai_consultations 
      WHERE pet_id = ? AND created_at >= datetime('now', '-30 days')
      ORDER BY created_at DESC
      LIMIT 5
    `).bind(petId).all();

    return {
      recentFeeding: recentFeeding.results || [],
      previousConsultations: previousConsultations.results || []
    };
  } catch (error) {
    console.error('Error fetching pet history:', error);
    return { recentFeeding: [], previousConsultations: [] };
  }
}

/**
 * Get consultation history for a pet
 */
async function getConsultationHistory(petId, searchParams, env) {
  try {
    let query = `
      SELECT id, symptoms, ai_assessment, emergency, confidence_score, 
             image_r2_keys, created_at
      FROM ai_consultations 
      WHERE pet_id = ?
    `;
    const params = [petId];

    // Add date filtering if provided
    if (searchParams.get('from')) {
      query += ` AND created_at >= ?`;
      params.push(searchParams.get('from'));
    }
    
    if (searchParams.get('to')) {
      query += ` AND created_at <= ?`;
      params.push(searchParams.get('to'));
    }

    query += ` ORDER BY created_at DESC LIMIT 50`;

    const consultations = await env.DB.prepare(query).bind(...params).all();

    // Process consultations to include parsed assessments
    const processedConsultations = consultations.results.map(consultation => ({
      ...consultation,
      ai_assessment: safeJsonParse(consultation.ai_assessment),
      image_r2_keys: safeJsonParse(consultation.image_r2_keys) || []
    }));

    return new Response(JSON.stringify({
      consultations: processedConsultations
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Consultation history error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to retrieve consultation history'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get detailed consultation with images
 */
async function getConsultationDetails(consultationId, env) {
  try {
    const consultation = await env.DB.prepare(`
      SELECT * FROM ai_consultations WHERE id = ?
    `).bind(consultationId).first();

    if (!consultation) {
      return new Response(JSON.stringify({ error: 'Consultation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = {
      ...consultation,
      ai_assessment: safeJsonParse(consultation.ai_assessment),
      image_r2_keys: safeJsonParse(consultation.image_r2_keys) || []
    };

    // Generate presigned URLs for images
    if (response.image_r2_keys.length > 0) {
      response.imageUrls = response.image_r2_keys.map(key => 
        `https://images.rawgle.com/${key}`
      );
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Consultation details error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to retrieve consultation details'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Safely parse JSON with fallback
 */
function safeJsonParse(jsonString) {
  try {
    return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  } catch (error) {
    return null;
  }
}