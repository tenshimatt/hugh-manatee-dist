// Test Script 044: Basic Health Assessment
// Purpose: Test AI medical consultation for basic pet health assessment
// Expected: AI provides health assessment based on symptoms and pet information

export default {
  id: '044',
  name: 'Basic Health Assessment',
  description: 'Tests AI medical consultation system for basic pet health assessment functionality',
  category: 'AI Medical',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `health-assessment-${Date.now()}@rawgle.com`;
      
      // Step 1: Create test user
      results.push({
        step: 1,
        description: 'Creating test user for health assessment',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'HealthTest123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = `Test user created: ${userData.userId}`;
        
        // Step 2: Create pet profile for health assessment
        results.push({
          step: 2,
          description: 'Creating pet profile for health assessment',
          status: 'running'
        });
        
        const petData = {
          userId: userData.userId,
          name: 'Buddy',
          species: 'dog',
          breed: 'Golden Retriever',
          age: 5,
          weight: 30,
          gender: 'male',
          medicalHistory: 'No previous issues'
        };
        
        const petResponse = await fetch(`${API_BASE}/api/pets/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(petData)
        });
        
        if (petResponse.status === 201) {
          const petResult = await petResponse.json();
          results[1].status = 'passed';
          results[1].details = `Pet profile created: ${petResult.petId}`;
          
          // Step 3: Submit basic health assessment request
          results.push({
            step: 3,
            description: 'Submitting basic health assessment request',
            status: 'running'
          });
          
          const assessmentData = {
            petId: petResult.petId,
            symptoms: ['lethargy', 'decreased appetite'],
            duration: '2 days',
            severity: 'moderate',
            additionalNotes: 'Pet seems less energetic than usual, eating about half normal amount'
          };
          
          const assessmentResponse = await fetch(`${API_BASE}/api/medical/assess`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assessmentData)
          });
          
          if (assessmentResponse.status === 200 || assessmentResponse.status === 201) {
            const assessmentResult = await assessmentResponse.json();
            results[2].status = 'passed';
            results[2].details = `Assessment completed: ${assessmentResult.consultationId}`;
            
            // Step 4: Validate assessment response structure
            results.push({
              step: 4,
              description: 'Validating assessment response structure',
              status: 'running'
            });
            
            const requiredFields = ['consultationId', 'assessment', 'recommendations', 'urgency', 'confidence'];
            const hasAllFields = requiredFields.every(field => assessmentResult[field] !== undefined);
            
            if (hasAllFields) {
              results[3].status = 'passed';
              results[3].details = `All required fields present: ${requiredFields.join(', ')}`;
            } else {
              const missingFields = requiredFields.filter(field => assessmentResult[field] === undefined);
              results[3].status = 'failed';
              results[3].details = `Missing required fields: ${missingFields.join(', ')}`;
            }
            
            // Step 5: Verify assessment content quality
            results.push({
              step: 5,
              description: 'Verifying assessment content quality',
              status: 'running'
            });
            
            const assessment = assessmentResult.assessment;
            const recommendations = assessmentResult.recommendations;
            
            const hasSubstantialContent = assessment && assessment.length > 50 && 
                                        recommendations && recommendations.length > 30;
            
            if (hasSubstantialContent) {
              results[4].status = 'passed';
              results[4].details = `Assessment: ${assessment.substring(0, 100)}... Recommendations: ${recommendations.substring(0, 100)}...`;
            } else {
              results[4].status = 'warning';
              results[4].details = 'Assessment content appears minimal - may need AI model improvement';
            }
            
            // Step 6: Check urgency level assignment
            results.push({
              step: 6,
              description: 'Checking urgency level assignment',
              status: 'running'
            });
            
            const validUrgencyLevels = ['low', 'moderate', 'high', 'emergency'];
            const urgencyValid = validUrgencyLevels.includes(assessmentResult.urgency.toLowerCase());
            
            if (urgencyValid) {
              results[5].status = 'passed';
              results[5].details = `Urgency level assigned: ${assessmentResult.urgency}`;
            } else {
              results[5].status = 'failed';
              results[5].details = `Invalid urgency level: ${assessmentResult.urgency}`;
            }
            
            // Step 7: Verify confidence score
            results.push({
              step: 7,
              description: 'Verifying confidence score validity',
              status: 'running'
            });
            
            const confidence = parseFloat(assessmentResult.confidence);
            const confidenceValid = confidence >= 0 && confidence <= 1;
            
            if (confidenceValid) {
              results[6].status = 'passed';
              results[6].details = `Confidence score: ${(confidence * 100).toFixed(1)}%`;
            } else {
              results[6].status = 'failed';
              results[6].details = `Invalid confidence score: ${assessmentResult.confidence}`;
            }
            
          } else {
            const errorData = await assessmentResponse.json();
            results[2].status = 'failed';
            results[2].details = `Assessment failed: ${errorData.error}`;
          }
          
        } else {
          results[1].status = 'failed';
          results[1].details = `Pet creation failed: ${petResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Basic health assessment test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};