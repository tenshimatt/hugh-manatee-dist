import { Router } from 'itty-router';
import { ValidationUtils } from '../utils/validation.js';
import { requireAuth, optionalAuth, requireAuthWithBypass } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { createCorsResponse } from '../middleware/cors.js';
import { DatabaseUtils } from '../utils/database.js';

const veterinaryRouter = Router({ base: '/api/veterinary' });

/**
 * POST /api/veterinary/authorize-clinic
 * Allow pet owner to authorize veterinary clinic access to their pet's health data
 */
veterinaryRouter.post('/authorize-clinic', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const rateLimitResponse = await rateLimit(request, env, {
      windowMs: 60 * 1000,
      maxRequests: 10
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const sanitizedBody = ValidationUtils.sanitizeJson(body);
    
    const { 
      clinicId, 
      dogId, 
      permissions = {},
      accessEndDate = null,
      emergencyContact = false,
      consentMethod = 'digital'
    } = sanitizedBody;

    if (!clinicId || !dogId) {
      return createCorsResponse({
        error: 'Clinic ID and Dog ID are required',
        code: 'MISSING_REQUIRED_FIELDS'
      }, 400);
    }

    // Verify dog ownership
    const dog = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT id FROM dogs WHERE id = ? AND owner_id = ? AND is_active = TRUE',
      [dogId, auth.user.id]
    );

    if (!dog) {
      return createCorsResponse({
        error: 'Pet not found or access denied',
        code: 'PET_NOT_FOUND'
      }, 404);
    }

    // Verify clinic exists and is active
    const clinic = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT id, clinic_name, is_verified FROM veterinary_clinics WHERE id = ? AND is_active = TRUE',
      [clinicId]
    );

    if (!clinic) {
      return createCorsResponse({
        error: 'Veterinary clinic not found',
        code: 'CLINIC_NOT_FOUND'
      }, 404);
    }

    // Check if permission already exists
    const existingPermission = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT id, is_active FROM health_data_sharing_permissions WHERE dog_id = ? AND clinic_id = ?',
      [dogId, clinicId]
    );

    const permissionData = {
      dog_id: dogId,
      clinic_id: clinicId,
      owner_id: auth.user.id,
      share_basic_info: permissions.shareBasicInfo !== false,
      share_medical_history: permissions.shareMedicalHistory !== false,
      share_vaccination_records: permissions.shareVaccinationRecords !== false,
      share_feeding_logs: permissions.shareFeedingLogs === true,
      share_training_records: permissions.shareTrainingRecords === true,
      share_ai_consultations: permissions.shareAiConsultations === true,
      share_photos: permissions.sharePhotos === true,
      share_location_data: permissions.shareLocationData === true,
      can_add_notes: permissions.canAddNotes !== false,
      emergency_override: emergencyContact,
      access_end_date: accessEndDate,
      consent_method: consentMethod,
      consent_ip_address: request.headers.get('CF-Connecting-IP') || 'unknown',
      is_active: true
    };

    let permissionId;

    if (existingPermission) {
      // Update existing permission
      await DatabaseUtils.executeUpdate(
        env.DB,
        `UPDATE health_data_sharing_permissions 
         SET share_basic_info = ?, share_medical_history = ?, share_vaccination_records = ?,
             share_feeding_logs = ?, share_training_records = ?, share_ai_consultations = ?,
             share_photos = ?, share_location_data = ?, can_add_notes = ?, emergency_override = ?,
             access_end_date = ?, consent_method = ?, consent_ip_address = ?, is_active = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          permissionData.share_basic_info, permissionData.share_medical_history, 
          permissionData.share_vaccination_records, permissionData.share_feeding_logs,
          permissionData.share_training_records, permissionData.share_ai_consultations,
          permissionData.share_photos, permissionData.share_location_data,
          permissionData.can_add_notes, permissionData.emergency_override,
          permissionData.access_end_date, permissionData.consent_method,
          permissionData.consent_ip_address, permissionData.is_active,
          existingPermission.id
        ]
      );
      permissionId = existingPermission.id;
    } else {
      // Create new permission
      const result = await DatabaseUtils.executeUpdate(
        env.DB,
        `INSERT INTO health_data_sharing_permissions (
          dog_id, clinic_id, owner_id, share_basic_info, share_medical_history,
          share_vaccination_records, share_feeding_logs, share_training_records,
          share_ai_consultations, share_photos, share_location_data, can_add_notes,
          emergency_override, access_end_date, consent_method, consent_ip_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          permissionData.dog_id, permissionData.clinic_id, permissionData.owner_id,
          permissionData.share_basic_info, permissionData.share_medical_history,
          permissionData.share_vaccination_records, permissionData.share_feeding_logs,
          permissionData.share_training_records, permissionData.share_ai_consultations,
          permissionData.share_photos, permissionData.share_location_data,
          permissionData.can_add_notes, permissionData.emergency_override,
          permissionData.access_end_date, permissionData.consent_method,
          permissionData.consent_ip_address
        ]
      );
      permissionId = result.meta.last_row_id;
    }

    // Log the authorization event
    await DatabaseUtils.executeUpdate(
      env.DB,
      `INSERT INTO vet_data_requests (
        request_type, requesting_clinic_id, dog_id, data_categories,
        request_purpose, permission_id, authorized, authorization_method,
        response_status, processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'authorization_granted', clinicId, dogId, 
        JSON.stringify(Object.keys(permissions).filter(key => permissions[key])),
        'data_sharing_authorization', permissionId, true, 'owner_consent',
        'fulfilled', new Date().toISOString()
      ]
    );

    return createCorsResponse({
      success: true,
      data: {
        permissionId,
        clinicName: clinic.clinic_name,
        message: 'Veterinary clinic access authorized successfully'
      }
    });

  } catch (error) {
    console.error('Authorize clinic error:', error);
    return createCorsResponse({
      error: 'Failed to authorize clinic access',
      code: 'AUTHORIZATION_ERROR'
    }, 500);
  }
});

/**
 * GET /api/veterinary/pet-health-summary/:dogId
 * Get comprehensive health summary for veterinary access
 */
veterinaryRouter.get('/pet-health-summary/:dogId', async (request, env) => {
  try {
    // This endpoint can be accessed by both pet owners and authorized veterinary staff
    const auth = await optionalAuth(request, env);
    const dogId = request.params.dogId;
    
    // Verify access permissions
    let hasAccess = false;
    let accessType = 'none';

    if (auth.user) {
      // Check if user is pet owner
      const petOwnership = await DatabaseUtils.executeQueryFirst(
        env.DB,
        'SELECT id FROM dogs WHERE id = ? AND owner_id = ?',
        [dogId, auth.user.id]
      );

      if (petOwnership) {
        hasAccess = true;
        accessType = 'owner';
      } else {
        // Check if user is authorized veterinary staff
        const vetAccess = await DatabaseUtils.executeQueryFirst(
          env.DB,
          `SELECT hdsp.* FROM health_data_sharing_permissions hdsp
           JOIN vet_clinic_users vcu ON hdsp.clinic_id = vcu.clinic_id
           WHERE hdsp.dog_id = ? AND vcu.email = ? AND hdsp.is_active = TRUE
           AND vcu.is_active = TRUE AND vcu.can_access_health_data = TRUE
           AND (hdsp.access_end_date IS NULL OR hdsp.access_end_date >= date('now'))`,
          [dogId, auth.user.email]
        );

        if (vetAccess) {
          hasAccess = true;
          accessType = 'veterinary';
        }
      }
    }

    if (!hasAccess) {
      return createCorsResponse({
        error: 'Access denied to pet health data',
        code: 'ACCESS_DENIED'
      }, 403);
    }

    // Get comprehensive health data
    const healthSummary = await DatabaseUtils.executeQueryFirst(
      env.DB,
      `SELECT 
        d.id, d.name, d.breed, d.birth_date, d.gender, d.weight_lbs,
        d.health_conditions, d.allergies, d.vaccination_records,
        u.first_name || ' ' || u.last_name as owner_name,
        u.email as owner_email, u.phone as owner_phone
       FROM dogs d
       JOIN users u ON d.owner_id = u.id
       WHERE d.id = ? AND d.is_active = TRUE`,
      [dogId]
    );

    if (!healthSummary) {
      return createCorsResponse({
        error: 'Pet not found',
        code: 'PET_NOT_FOUND'
      }, 404);
    }

    // Get recent health logs (last 90 days)
    const healthLogs = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT log_date, weight_lbs, body_condition_score, temperature_f,
              heart_rate, notes, vet_visit, vaccinations_given
       FROM dog_health_logs 
       WHERE dog_id = ? AND log_date >= date('now', '-90 days')
       ORDER BY log_date DESC`,
      [dogId]
    );

    // Get recent feeding data (last 30 days) if permitted
    let feedingData = null;
    if (accessType === 'owner' || accessType === 'veterinary') {
      const feedingLogs = await DatabaseUtils.executeQuery(
        env.DB,
        `SELECT feed_date, meal_type, quantity_cups, calories_estimated,
                appetite_rating, stool_quality, notes
         FROM feeding_logs 
         WHERE dog_id = ? AND feed_date >= date('now', '-30 days')
         ORDER BY feed_date DESC, feed_time DESC`,
        [dogId]
      );

      // Aggregate feeding statistics
      const feedingStats = await DatabaseUtils.executeQueryFirst(
        env.DB,
        `SELECT 
          COUNT(DISTINCT feed_date) as days_logged,
          AVG(appetite_rating) as avg_appetite,
          AVG(calories_estimated) as avg_daily_calories,
          AVG(stool_quality) as avg_stool_quality
         FROM feeding_logs 
         WHERE dog_id = ? AND feed_date >= date('now', '-30 days')`,
        [dogId]
      );

      feedingData = {
        recent_logs: feedingLogs,
        statistics: feedingStats
      };
    }

    // Get AI consultations (last 6 months) if permitted
    let aiConsultations = null;
    if (accessType === 'owner' || accessType === 'veterinary') {
      const consultations = await DatabaseUtils.executeQuery(
        env.DB,
        `SELECT id, symptoms, urgency, ai_response, created_at
         FROM ai_consultations 
         WHERE user_id = (SELECT owner_id FROM dogs WHERE id = ?)
         AND created_at >= datetime('now', '-6 months')
         ORDER BY created_at DESC`,
        [dogId]
      );

      aiConsultations = consultations.map(consultation => ({
        id: consultation.id,
        symptoms: consultation.symptoms,
        urgency: consultation.urgency,
        recommendation: JSON.parse(consultation.ai_response || '{}').recommendation,
        date: consultation.created_at
      }));
    }

    // Log the data access
    if (accessType === 'veterinary') {
      await DatabaseUtils.executeUpdate(
        env.DB,
        `INSERT INTO vet_data_requests (
          request_type, requesting_clinic_id, dog_id, data_categories,
          request_purpose, authorized, authorization_method, response_status,
          processed_at, fulfilled_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'view', 
          null, // Would need to get clinic ID from vet user
          dogId,
          JSON.stringify(['health_summary', 'feeding_logs', 'ai_consultations']),
          'health_data_review',
          true,
          'permission_granted',
          'fulfilled',
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
    }

    return createCorsResponse({
      success: true,
      data: {
        pet_info: {
          id: healthSummary.id,
          name: healthSummary.name,
          breed: healthSummary.breed,
          birth_date: healthSummary.birth_date,
          gender: healthSummary.gender,
          current_weight: healthSummary.weight_lbs,
          health_conditions: JSON.parse(healthSummary.health_conditions || '[]'),
          allergies: JSON.parse(healthSummary.allergies || '[]'),
          vaccination_records: JSON.parse(healthSummary.vaccination_records || '[]')
        },
        owner_info: accessType === 'veterinary' ? {
          name: healthSummary.owner_name,
          email: healthSummary.owner_email,
          phone: healthSummary.owner_phone
        } : null,
        health_logs: healthLogs,
        feeding_data: feedingData,
        ai_consultations: aiConsultations,
        access_type: accessType,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Pet health summary error:', error);
    return createCorsResponse({
      error: 'Failed to retrieve pet health summary',
      code: 'HEALTH_SUMMARY_ERROR'
    }, 500);
  }
});

/**
 * POST /api/veterinary/export-health-report
 * Export pet health data in various formats (PDF, JSON, CSV)
 */
veterinaryRouter.post('/export-health-report', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const { dogId, format = 'json', dateRange = 90 } = ValidationUtils.sanitizeJson(body);

    if (!dogId) {
      return createCorsResponse({
        error: 'Dog ID is required',
        code: 'MISSING_DOG_ID'
      }, 400);
    }

    // Verify access (same logic as health summary)
    const dog = await DatabaseUtils.executeQueryFirst(
      env.DB,
      'SELECT id, name, owner_id FROM dogs WHERE id = ? AND is_active = TRUE',
      [dogId]
    );

    if (!dog) {
      return createCorsResponse({
        error: 'Pet not found',
        code: 'PET_NOT_FOUND'
      }, 404);
    }

    // Check ownership or veterinary access
    const isOwner = dog.owner_id === auth.user.id;
    // TODO: Add veterinary access check

    if (!isOwner) {
      return createCorsResponse({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      }, 403);
    }

    // Get comprehensive data for export
    const exportData = await generateHealthReportData(env, dogId, dateRange);

    // Format data based on requested format
    let responseData;
    let contentType;
    
    switch (format.toLowerCase()) {
      case 'json':
        responseData = JSON.stringify(exportData, null, 2);
        contentType = 'application/json';
        break;
      case 'csv':
        responseData = convertToCSV(exportData);
        contentType = 'text/csv';
        break;
      case 'pdf':
        // TODO: Implement PDF generation
        return createCorsResponse({
          error: 'PDF export not yet implemented',
          code: 'FORMAT_NOT_SUPPORTED'
        }, 400);
      default:
        return createCorsResponse({
          error: 'Unsupported export format',
          code: 'INVALID_FORMAT'
        }, 400);
    }

    // Log the export request
    await DatabaseUtils.executeUpdate(
      env.DB,
      `INSERT INTO vet_data_requests (
        request_type, dog_id, data_categories, export_format,
        request_purpose, authorized, authorization_method, response_status,
        processed_at, fulfilled_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'export', dogId, JSON.stringify(['complete_health_report']),
        format, 'health_data_export', true, 'owner_request', 'fulfilled',
        new Date().toISOString(), new Date().toISOString()
      ]
    );

    return createCorsResponse({
      success: true,
      data: {
        report: responseData,
        format: format,
        generated_at: new Date().toISOString(),
        pet_name: dog.name
      }
    }, 200, {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${dog.name}_health_report.${format}"`
    });

  } catch (error) {
    console.error('Export health report error:', error);
    return createCorsResponse({
      error: 'Failed to export health report',
      code: 'EXPORT_ERROR'
    }, 500);
  }
});

/**
 * GET /api/veterinary/permissions
 * Get current veterinary data sharing permissions for user's pets
 */
veterinaryRouter.get('/permissions', async (request, env) => {
  try {
    const auth = await requireAuth(request, env);
    if (auth instanceof Response) return auth;

    const permissions = await DatabaseUtils.executeQuery(
      env.DB,
      `SELECT 
        hdsp.*,
        d.name as pet_name,
        vc.clinic_name,
        vc.phone as clinic_phone,
        vc.email as clinic_email
       FROM health_data_sharing_permissions hdsp
       JOIN dogs d ON hdsp.dog_id = d.id
       JOIN veterinary_clinics vc ON hdsp.clinic_id = vc.id
       WHERE hdsp.owner_id = ? AND hdsp.is_active = TRUE
       ORDER BY hdsp.created_at DESC`,
      [auth.user.id]
    );

    return createCorsResponse({
      success: true,
      data: {
        permissions: permissions.map(perm => ({
          id: perm.id,
          pet_name: perm.pet_name,
          clinic_name: perm.clinic_name,
          clinic_contact: {
            phone: perm.clinic_phone,
            email: perm.clinic_email
          },
          permissions: {
            share_basic_info: perm.share_basic_info,
            share_medical_history: perm.share_medical_history,
            share_vaccination_records: perm.share_vaccination_records,
            share_feeding_logs: perm.share_feeding_logs,
            share_training_records: perm.share_training_records,
            share_ai_consultations: perm.share_ai_consultations,
            share_photos: perm.share_photos,
            share_location_data: perm.share_location_data
          },
          access_end_date: perm.access_end_date,
          emergency_override: perm.emergency_override,
          created_at: perm.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Get permissions error:', error);
    return createCorsResponse({
      error: 'Failed to retrieve permissions',
      code: 'PERMISSIONS_ERROR'
    }, 500);
  }
});

// Helper functions

async function generateHealthReportData(env, dogId, dateRangeDays) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - dateRangeDays);
  
  // Get basic pet information
  const petInfo = await DatabaseUtils.executeQueryFirst(
    env.DB,
    `SELECT d.*, u.first_name || ' ' || u.last_name as owner_name
     FROM dogs d
     JOIN users u ON d.owner_id = u.id
     WHERE d.id = ?`,
    [dogId]
  );

  // Get health logs
  const healthLogs = await DatabaseUtils.executeQuery(
    env.DB,
    'SELECT * FROM dog_health_logs WHERE dog_id = ? AND log_date >= ? ORDER BY log_date DESC',
    [dogId, cutoffDate.toISOString().split('T')[0]]
  );

  // Get feeding logs
  const feedingLogs = await DatabaseUtils.executeQuery(
    env.DB,
    'SELECT * FROM feeding_logs WHERE dog_id = ? AND feed_date >= ? ORDER BY feed_date DESC, feed_time DESC',
    [dogId, cutoffDate.toISOString().split('T')[0]]
  );

  // Get AI consultations
  const aiConsultations = await DatabaseUtils.executeQuery(
    env.DB,
    `SELECT * FROM ai_consultations 
     WHERE user_id = (SELECT owner_id FROM dogs WHERE id = ?)
     AND created_at >= ? 
     ORDER BY created_at DESC`,
    [dogId, cutoffDate.toISOString()]
  );

  return {
    pet_information: petInfo,
    health_logs: healthLogs,
    feeding_logs: feedingLogs,
    ai_consultations: aiConsultations.map(consultation => ({
      ...consultation,
      ai_response: JSON.parse(consultation.ai_response || '{}')
    })),
    report_metadata: {
      generated_at: new Date().toISOString(),
      date_range_days: dateRangeDays,
      records_included: {
        health_logs: healthLogs.length,
        feeding_logs: feedingLogs.length,
        ai_consultations: aiConsultations.length
      }
    }
  };
}

function convertToCSV(data) {
  // Simple CSV conversion for health logs
  const healthLogs = data.health_logs || [];
  if (healthLogs.length === 0) {
    return 'No health data available for export';
  }

  const headers = Object.keys(healthLogs[0]).join(',');
  const rows = healthLogs.map(log => 
    Object.values(log).map(value => 
      typeof value === 'string' && value.includes(',') 
        ? `"${value.replace(/"/g, '""')}"` 
        : value
    ).join(',')
  );

  return [headers, ...rows].join('\n');
}

export { veterinaryRouter };