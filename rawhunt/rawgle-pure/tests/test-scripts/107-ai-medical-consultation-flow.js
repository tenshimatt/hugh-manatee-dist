// Test Script 107: AI Medical Consultation Flow
// Purpose: Tests complete AI medical consultation workflow with emergency detection
// User Story: User submits pet symptoms and receives AI medical assessment

export default {
  id: '107',
  name: 'AI Medical Consultation Flow',
  description: 'Complete AI medical consultation with emergency detection and recommendations',
  category: 'Integration',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    // Setup test user and pet for consultation
    const testUser = {
      email: `vet-user-${Date.now()}@rawgle.com`,
      password: 'VetUser123!',
      name: 'Veterinary Test User'
    };
    
    try {
      // Step 1: Setup user and pet for medical consultation
      results.push({
        step: 1,
        description: 'Setup user and pet for AI medical consultation',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      });
      
      if (!registerResponse.ok) {
        results[0].status = 'failed';
        results[0].details = `User setup failed: ${registerResponse.status}`;
        return results;
      }
      
      const userData = await registerResponse.json();
      
      // Login and create pet
      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });
      
      const loginData = await loginResponse.json();
      const authToken = loginData.sessionToken;
      
      // Create pet for consultation
      const petData = {
        name: 'Sick Pet',
        breed: 'Beagle',
        age: '5',
        weight: '20'
      };
      
      const petResponse = await fetch(`${API_BASE}/api/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(petData)
      });
      
      const petResult = await petResponse.json();
      const petId = petResult.pet.id;
      
      results[0].status = 'passed';
      results[0].details = `Setup complete: User ${userData.userId}, Pet ${petId}`;
      
      // Step 2: Submit non-emergency symptoms
      results.push({
        step: 2,
        description: 'Submit non-emergency symptoms for AI analysis',
        status: 'running'
      });
      
      const normalSymptoms = {
        petId: petId,
        symptoms: 'My dog has been drinking more water than usual and seems a bit tired'
      };
      
      const consultResponse = await fetch(`${API_BASE}/api/ai-medical`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(normalSymptoms)
      });
      
      if (consultResponse.ok) {
        const consultResult = await consultResponse.json();
        results[1].status = 'passed';
        results[1].details = `Consultation ID: ${consultResult.consultationId}, Emergency: ${consultResult.emergency}`;
        
        // Step 3: Verify AI assessment quality
        results.push({
          step: 3,
          description: 'Verify AI assessment quality and confidence',
          status: 'running'
        });
        
        if (consultResult.assessment && consultResult.confidence !== undefined) {
          results[2].status = 'passed';
          results[2].details = `Assessment received with ${(consultResult.confidence * 100).toFixed(1)}% confidence`;
        } else {
          results[2].status = 'failed';
          results[2].details = 'Missing assessment or confidence score';
        }
        
        // Step 4: Test emergency symptom detection
        results.push({
          step: 4,
          description: 'Test emergency symptom detection',
          status: 'running'
        });
        
        const emergencySymptoms = {
          petId: petId,
          symptoms: 'My dog collapsed and is having difficulty breathing, blue gums'
        };
        
        const emergencyResponse = await fetch(`${API_BASE}/api/ai-medical`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(emergencySymptoms)
        });
        
        if (emergencyResponse.ok) {
          const emergencyResult = await emergencyResponse.json();
          if (emergencyResult.emergency === true) {
            results[3].status = 'passed';
            results[3].details = `Emergency correctly detected: ${emergencyResult.consultationId}`;
          } else {
            results[3].status = 'warning';
            results[3].details = 'Emergency symptoms not detected as emergency';
          }
        } else {
          results[3].status = 'failed';
          results[3].details = `Emergency consultation failed: ${emergencyResponse.status}`;
        }
        
        // Step 5: Verify recommendations provided
        results.push({
          step: 5,
          description: 'Verify medical recommendations provided',
          status: 'running'
        });
        
        if (consultResult.recommendations && Array.isArray(consultResult.recommendations)) {
          results[4].status = 'passed';
          results[4].details = `Recommendations provided: ${consultResult.recommendations.length} items`;
        } else {
          results[4].status = 'failed';
          results[4].details = 'No recommendations provided';
        }
        
        // Step 6: Test consultation history retrieval
        results.push({
          step: 6,
          description: 'Retrieve consultation history',
          status: 'running'
        });
        
        const historyResponse = await fetch(`${API_BASE}/api/ai-medical/history/${petId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          if (historyData.consultations && historyData.consultations.length > 0) {
            results[5].status = 'passed';
            results[5].details = `History retrieved: ${historyData.consultations.length} consultation(s)`;
          } else {
            results[5].status = 'warning';
            results[5].details = 'No consultation history found';
          }
        } else {
          results[5].status = 'failed';
          results[5].details = `History retrieval failed: ${historyResponse.status}`;
        }
        
      } else {
        results[1].status = 'failed';
        results[1].details = `AI consultation failed: ${consultResponse.status}`;
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length - 1 : 0;
      results[currentStep] = results[currentStep] || { step: currentStep + 1, description: 'AI medical consultation test', status: 'failed' };
      results[currentStep].status = 'failed';
      results[currentStep].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};