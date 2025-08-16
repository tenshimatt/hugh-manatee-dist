import { Router } from 'itty-router';
import { ValidationUtils } from '../utils/validation.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { createCorsResponse } from '../middleware/cors.js';
import { DatabaseUtils } from '../utils/database.js';

const aiMedicalRouter = Router({ base: '/api/ai-medical' });

/**
 * POST /api/ai-medical/consultation
 * Get AI-powered medical consultation for pets
 */
aiMedicalRouter.post('/consultation', async (request, env) => {
  try {
    // Allow both authenticated and anonymous consultations
    const auth = await optionalAuth(request, env);
    
    // Rate limiting - stricter for anonymous users
    const rateLimitResponse = await rateLimit(request, env, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: auth.user ? 10 : 3, // More requests for authenticated users
      keyGenerator: (req) => {
        const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
        return auth.user ? `user-${auth.user.id}` : `ip-${ip}`;
      }
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const sanitizedBody = ValidationUtils.sanitizeJson(body);
    
    // Validate required fields
    if (!sanitizedBody.symptoms || !sanitizedBody.petInfo) {
      return createCorsResponse({
        error: 'Symptoms and pet information are required',
        code: 'MISSING_FIELDS'
      }, 400);
    }

    // Validate pet info structure
    const { petInfo, symptoms, urgency = 'normal' } = sanitizedBody;
    
    if (!petInfo.species || !petInfo.age || !petInfo.weight) {
      return createCorsResponse({
        error: 'Pet species, age, and weight are required',
        code: 'INCOMPLETE_PET_INFO'
      }, 400);
    }

    // Build consultation prompt
    const consultationPrompt = buildConsultationPrompt(petInfo, symptoms, urgency);
    
    // Call AI service (OpenAI/Claude)
    const aiResponse = await callAIService(env, consultationPrompt);
    
    // Store consultation record
    const consultationId = await storeConsultation(env, {
      userId: auth.user?.id || null,
      petInfo,
      symptoms,
      urgency,
      aiResponse,
      timestamp: new Date().toISOString()
    });

    // Award PAWS if authenticated user
    if (auth.user) {
      try {
        await awardPawsForConsultation(env, auth.user.id, consultationId);
      } catch (error) {
        console.warn('Failed to award PAWS:', error.message);
      }
    }

    return createCorsResponse({
      success: true,
      data: {
        consultationId,
        recommendation: aiResponse.recommendation,
        urgencyLevel: aiResponse.urgencyLevel,
        suggestedActions: aiResponse.suggestedActions,
        veterinaryAdvice: aiResponse.veterinaryAdvice,
        followUpNeeded: aiResponse.followUpNeeded
      }
    });

  } catch (error) {
    console.error('AI medical consultation error:', error);
    return createCorsResponse({
      error: 'Failed to process consultation',
      code: 'CONSULTATION_ERROR'
    }, 500);
  }
});

/**
 * GET /api/ai-medical/consultations
 * Get user's consultation history
 */
aiMedicalRouter.get('/consultations', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 10, 50);
    const offset = (page - 1) * limit;

    const consultations = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT id, pet_info, symptoms, urgency, ai_response, created_at
       FROM ai_consultations 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [auth.user.id, limit, offset]
    );

    const total = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT COUNT(*) as count FROM ai_consultations WHERE user_id = ?',
      [auth.user.id]
    );

    const processedConsultations = consultations.map(consultation => ({
      id: consultation.id,
      petInfo: JSON.parse(consultation.pet_info),
      symptoms: consultation.symptoms,
      urgency: consultation.urgency,
      aiResponse: JSON.parse(consultation.ai_response),
      createdAt: consultation.created_at
    }));

    return createCorsResponse({
      success: true,
      data: {
        consultations: processedConsultations,
        pagination: {
          page,
          limit,
          total: total.count,
          totalPages: Math.ceil(total.count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get consultations error:', error);
    return createCorsResponse({
      error: 'Failed to get consultation history',
      code: 'HISTORY_ERROR'
    }, 500);
  }
});

/**
 * GET /api/ai-medical/consultation/:id
 * Get specific consultation details
 */
aiMedicalRouter.get('/consultation/:id', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const consultationId = request.params.id;
    
    const consultation = await DatabaseUtils.executeQueryFirst(
      env.DB,
      `SELECT * FROM ai_consultations 
       WHERE id = ? AND user_id = ?`,
      [consultationId, auth.user.id]
    );

    if (!consultation) {
      return createCorsResponse({
        error: 'Consultation not found',
        code: 'CONSULTATION_NOT_FOUND'
      }, 404);
    }

    return createCorsResponse({
      success: true,
      data: {
        id: consultation.id,
        petInfo: JSON.parse(consultation.pet_info),
        symptoms: consultation.symptoms,
        urgency: consultation.urgency,
        aiResponse: JSON.parse(consultation.ai_response),
        createdAt: consultation.created_at
      }
    });

  } catch (error) {
    console.error('Get consultation error:', error);
    return createCorsResponse({
      error: 'Failed to get consultation',
      code: 'CONSULTATION_ERROR'
    }, 500);
  }
});

/**
 * POST /api/ai-medical/emergency-check
 * Quick emergency symptom assessment
 */
aiMedicalRouter.post('/emergency-check', async (request, env) => {
  try {
    // Rate limit emergency checks
    const rateLimitResponse = await rateLimit(request, env, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const sanitizedBody = ValidationUtils.sanitizeJson(body);

    if (!sanitizedBody.symptoms) {
      return createCorsResponse({
        error: 'Symptoms are required',
        code: 'MISSING_SYMPTOMS'
      }, 400);
    }

    const emergencyKeywords = [
      'bleeding', 'choking', 'seizure', 'unconscious', 'not breathing',
      'severe pain', 'poisoning', 'trauma', 'collapse', 'difficulty breathing',
      'bloat', 'twisted stomach', 'pale gums', 'blue gums'
    ];

    const symptoms = sanitizedBody.symptoms.toLowerCase();
    const isEmergency = emergencyKeywords.some(keyword => symptoms.includes(keyword));

    const urgencyLevel = isEmergency ? 'critical' : 'normal';
    const recommendation = isEmergency 
      ? 'URGENT: Seek immediate veterinary care. This could be a life-threatening emergency.'
      : 'Monitor symptoms and consider consulting with a veterinarian if symptoms persist or worsen.';

    return createCorsResponse({
      success: true,
      data: {
        isEmergency,
        urgencyLevel,
        recommendation,
        emergencyActions: isEmergency ? [
          'Contact your nearest emergency veterinary clinic immediately',
          'Keep your pet calm and still',
          'Do not give food or water unless instructed',
          'Transport safely to the veterinary clinic'
        ] : [
          'Monitor your pet closely',
          'Note any changes in symptoms',
          'Keep your pet comfortable',
          'Contact your regular veterinarian if needed'
        ]
      }
    });

  } catch (error) {
    console.error('Emergency check error:', error);
    return createCorsResponse({
      error: 'Failed to process emergency check',
      code: 'EMERGENCY_CHECK_ERROR'
    }, 500);
  }
});

// Helper functions

function buildConsultationPrompt(petInfo, symptoms, urgency) {
  return `You are a veterinary AI assistant. Provide helpful, accurate information while emphasizing that this is not a substitute for professional veterinary care.

Pet Information:
- Species: ${petInfo.species}
- Age: ${petInfo.age}
- Weight: ${petInfo.weight}
- Breed: ${petInfo.breed || 'Not specified'}
- Gender: ${petInfo.gender || 'Not specified'}
- Spayed/Neutered: ${petInfo.fixed || 'Not specified'}

Symptoms: ${symptoms}
Urgency Level: ${urgency}

Please provide:
1. A preliminary assessment of the symptoms
2. Urgency level (low, moderate, high, critical)
3. Suggested immediate actions
4. Whether veterinary consultation is recommended
5. General care recommendations

Important: Always recommend professional veterinary care for serious symptoms and remind that this is informational only.`;
}

async function callAIService(env, prompt) {
  try {
    // This would integrate with OpenAI, Claude, or other AI service
    // For now, return a mock response
    const mockResponse = {
      recommendation: "Based on the symptoms described, I recommend monitoring your pet closely and scheduling a veterinary consultation within 24 hours.",
      urgencyLevel: "moderate",
      suggestedActions: [
        "Monitor eating and drinking habits",
        "Check temperature if possible",
        "Note any changes in behavior",
        "Contact your veterinarian for appointment"
      ],
      veterinaryAdvice: "This assessment is for informational purposes only. Always consult with a qualified veterinarian for proper diagnosis and treatment.",
      followUpNeeded: true
    };

    // TODO: Implement actual AI service call
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     model: 'gpt-4',
    //     messages: [{ role: 'user', content: prompt }],
    //     max_tokens: 500
    //   })
    // });

    return mockResponse;
  } catch (error) {
    console.error('AI service error:', error);
    throw new Error('AI service unavailable');
  }
}

async function storeConsultation(env, consultationData) {
  const result = await DatabaseUtils.executeUpdate(
    env.DB,
    `INSERT INTO ai_consultations (
      user_id, pet_info, symptoms, urgency, ai_response, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      consultationData.userId,
      JSON.stringify(consultationData.petInfo),
      consultationData.symptoms,
      consultationData.urgency,
      JSON.stringify(consultationData.aiResponse),
      consultationData.timestamp
    ]
  );
  
  return result.meta.last_row_id;
}

async function awardPawsForConsultation(env, userId, consultationId) {
  const pawsAmount = 5; // 5 PAWS for using AI consultation
  
  // Get current balance
  const user = await DatabaseUtils.executeQueryFirst(
    env.DB,
    'SELECT paws_balance FROM users WHERE id = ?',
    [userId]
  );
  
  const newBalance = user.paws_balance + pawsAmount;
  
  // Update balance and record transaction
  const operations = [
    env.DB.prepare(`
      UPDATE users 
      SET paws_balance = ?, updated_at = ?
      WHERE id = ?
    `).bind(newBalance, new Date().toISOString(), userId),
    
    env.DB.prepare(`
      INSERT INTO transactions (
        user_id, type, amount, description, reference_type,
        reference_id, balance_after, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId, 'earned', pawsAmount, 'AI medical consultation',
      'ai_consultation', consultationId, newBalance,
      new Date().toISOString()
    )
  ];
  
  await DatabaseUtils.transaction(env.DB, operations);
}

export { aiMedicalRouter };