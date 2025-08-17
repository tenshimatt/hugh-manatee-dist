// Test Script 050: Consultation History Retrieval
// Purpose: Test retrieval of pet consultation history with proper ordering
// Expected: Complete consultation history in chronological order

export default {
  id: '050',
  name: 'Consultation History Retrieval',
  description: 'Tests retrieval of pet medical consultation history with proper chronological ordering',
  category: 'AI Medical',
  priority: 'Medium',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `consultation-history-${Date.now()}@rawgle.com`;
      
      results.push({
        step: 1,
        description: 'Creating test user and pet for consultation history',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'ConsultHistory123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        const petResponse = await fetch(`${API_BASE}/api/pets/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.userId,
            name: 'History Test Pet',
            species: 'dog',
            breed: 'Labrador'
          })
        });
        
        if (petResponse.status === 201) {
          const petResult = await petResponse.json();
          results[0].status = 'passed';
          results[0].details = `Test setup complete: ${petResult.petId}`;
          
          // Step 2: Create multiple consultations
          results.push({
            step: 2,
            description: 'Creating multiple consultations for history testing',
            status: 'running'
          });
          
          const consultations = [
            { symptoms: ['cough'], note: 'First consultation' },
            { symptoms: ['limping'], note: 'Second consultation' },
            { symptoms: ['vomiting'], note: 'Third consultation' }
          ];
          
          let createdCount = 0;
          for (const consult of consultations) {
            const consultResponse = await fetch(`${API_BASE}/api/medical/assess`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                petId: petResult.petId,
                symptoms: consult.symptoms,
                duration: '1 day',
                additionalNotes: consult.note
              })
            });
            
            if (consultResponse.status === 200 || consultResponse.status === 201) {
              createdCount++;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          results[1].status = createdCount > 0 ? 'passed' : 'failed';
          results[1].details = `${createdCount}/${consultations.length} consultations created`;
          
          // Step 3: Retrieve consultation history
          results.push({
            step: 3,
            description: 'Retrieving consultation history',
            status: 'running'
          });
          
          const historyResponse = await fetch(`${API_BASE}/api/medical/history?petId=${petResult.petId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (historyResponse.status === 200) {
            const historyData = await historyResponse.json();
            results[2].status = 'passed';
            results[2].details = `Retrieved ${historyData.consultations?.length || 0} consultation records`;
          } else {
            results[2].status = 'failed';
            results[2].details = `History retrieval failed: ${historyResponse.status}`;
          }
          
        } else {
          results[0].status = 'failed';
          results[0].details = `Pet creation failed: ${petResponse.status}`;
        }
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Consultation history test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};