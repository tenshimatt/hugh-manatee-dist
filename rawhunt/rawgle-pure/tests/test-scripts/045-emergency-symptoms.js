// Test Script 045: Emergency Symptom Detection
// Purpose: Test AI system's ability to detect emergency symptoms requiring immediate veterinary care
// Expected: Emergency symptoms should trigger high urgency alerts and immediate care recommendations

export default {
  id: '045',
  name: 'Emergency Symptom Detection',
  description: 'Tests AI system\'s ability to detect emergency symptoms and trigger appropriate urgent care alerts',
  category: 'AI Medical',
  priority: 'Critical',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `emergency-test-${Date.now()}@rawgle.com`;
      
      // Step 1: Create test user
      results.push({
        step: 1,
        description: 'Creating test user for emergency symptom testing',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'EmergencyTest123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = `Test user created: ${userData.userId}`;
        
        // Step 2: Create pet profile
        results.push({
          step: 2,
          description: 'Creating pet profile for emergency testing',
          status: 'running'
        });
        
        const petData = {
          userId: userData.userId,
          name: 'Emergency Test Dog',
          species: 'dog',
          breed: 'Mixed',
          age: 3,
          weight: 25,
          gender: 'female'
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
          
          // Step 3: Test severe emergency symptoms - difficulty breathing
          results.push({
            step: 3,
            description: 'Testing emergency detection: difficulty breathing',
            status: 'running'
          });
          
          const breathingEmergency = {
            petId: petResult.petId,
            symptoms: ['difficulty breathing', 'gasping', 'blue gums'],
            duration: '30 minutes',
            severity: 'severe',
            additionalNotes: 'Dog is struggling to breathe, gums appear bluish'
          };
          
          const breathingResponse = await fetch(`${API_BASE}/api/medical/assess`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(breathingEmergency)
          });
          
          if (breathingResponse.status === 200 || breathingResponse.status === 201) {
            const breathingResult = await breathingResponse.json();
            const isEmergency = breathingResult.urgency && breathingResult.urgency.toLowerCase() === 'emergency';
            
            results[2].status = isEmergency ? 'passed' : 'failed';
            results[2].details = `Breathing emergency detected: ${isEmergency}, urgency: ${breathingResult.urgency}`;
            
            // Check for emergency alert queue
            if (isEmergency && breathingResult.alertQueued) {
              results[2].details += ', alert queued for immediate attention';
            }
          } else {
            results[2].status = 'failed';
            results[2].details = `Emergency assessment failed: ${breathingResponse.status}`;
          }
          
          // Step 4: Test poisoning symptoms
          results.push({
            step: 4,
            description: 'Testing emergency detection: poisoning symptoms',
            status: 'running'
          });
          
          const poisoningEmergency = {
            petId: petResult.petId,
            symptoms: ['vomiting', 'diarrhea', 'seizures', 'drooling'],
            duration: '1 hour',
            severity: 'severe',
            additionalNotes: 'Dog ate chocolate, now having seizures and excessive drooling'
          };
          
          const poisoningResponse = await fetch(`${API_BASE}/api/medical/assess`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(poisoningEmergency)
          });
          
          if (poisoningResponse.status === 200 || poisoningResponse.status === 201) {
            const poisoningResult = await poisoningResponse.json();
            const isEmergency = poisoningResult.urgency && poisoningResult.urgency.toLowerCase() === 'emergency';
            
            results[3].status = isEmergency ? 'passed' : 'failed';
            results[3].details = `Poisoning emergency detected: ${isEmergency}, urgency: ${poisoningResult.urgency}`;
          } else {
            results[3].status = 'failed';
            results[3].details = `Poisoning assessment failed: ${poisoningResponse.status}`;
          }
          
          // Step 5: Test trauma symptoms
          results.push({
            step: 5,
            description: 'Testing emergency detection: trauma symptoms',
            status: 'running'
          });
          
          const traumaEmergency = {
            petId: petResult.petId,
            symptoms: ['bleeding', 'unconscious', 'not responsive'],
            duration: 'just happened',
            severity: 'critical',
            additionalNotes: 'Dog was hit by car, bleeding heavily and unconscious'
          };
          
          const traumaResponse = await fetch(`${API_BASE}/api/medical/assess`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(traumaEmergency)
          });
          
          if (traumaResponse.status === 200 || traumaResponse.status === 201) {
            const traumaResult = await traumaResponse.json();
            const isEmergency = traumaResult.urgency && traumaResult.urgency.toLowerCase() === 'emergency';
            
            results[4].status = isEmergency ? 'passed' : 'failed';
            results[4].details = `Trauma emergency detected: ${isEmergency}, urgency: ${traumaResult.urgency}`;
          } else {
            results[4].status = 'failed';
            results[4].details = `Trauma assessment failed: ${traumaResponse.status}`;
          }
          
          // Step 6: Test emergency alert notification system
          results.push({
            step: 6,
            description: 'Testing emergency alert notification system',
            status: 'running'
          });
          
          const alertsResponse = await fetch(`${API_BASE}/api/medical/emergency-alerts?userId=${userData.userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (alertsResponse.status === 200) {
            const alertsData = await alertsResponse.json();
            const hasAlerts = alertsData.alerts && alertsData.alerts.length > 0;
            
            results[5].status = hasAlerts ? 'passed' : 'warning';
            results[5].details = hasAlerts ? `${alertsData.alerts.length} emergency alerts generated` : 'No emergency alerts found - check alert generation';
          } else {
            results[5].status = 'warning';
            results[5].details = `Emergency alerts endpoint not accessible: ${alertsResponse.status}`;
          }
          
          // Step 7: Test non-emergency symptoms don't trigger false alarms
          results.push({
            step: 7,
            description: 'Testing non-emergency symptoms don\'t trigger false alarms',
            status: 'running'
          });
          
          const nonEmergency = {
            petId: petResult.petId,
            symptoms: ['mild cough', 'slightly tired'],
            duration: '3 days',
            severity: 'mild',
            additionalNotes: 'Dog has occasional cough but otherwise normal'
          };
          
          const nonEmergencyResponse = await fetch(`${API_BASE}/api/medical/assess`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nonEmergency)
          });
          
          if (nonEmergencyResponse.status === 200 || nonEmergencyResponse.status === 201) {
            const nonEmergencyResult = await nonEmergencyResponse.json();
            const isNotEmergency = nonEmergencyResult.urgency && 
                                  !['emergency', 'critical'].includes(nonEmergencyResult.urgency.toLowerCase());
            
            results[6].status = isNotEmergency ? 'passed' : 'warning';
            results[6].details = `Non-emergency properly classified: ${isNotEmergency}, urgency: ${nonEmergencyResult.urgency}`;
          } else {
            results[6].status = 'failed';
            results[6].details = `Non-emergency assessment failed: ${nonEmergencyResponse.status}`;
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
      results[0] = results[0] || { step: 1, description: 'Emergency symptom detection test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};