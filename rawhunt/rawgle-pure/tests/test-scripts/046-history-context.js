// Test Script 046: Pet History Context Analysis
// Purpose: Test AI's ability to use pet medical history for better assessments
// Expected: AI should reference previous conditions and treatments in new assessments

export default {
  id: '046',
  name: 'Pet History Context Analysis',
  description: 'Tests AI system\'s ability to analyze pet medical history for contextual health assessments',
  category: 'AI Medical',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `history-context-${Date.now()}@rawgle.com`;
      
      // Step 1: Create test user and pet with medical history
      results.push({
        step: 1,
        description: 'Creating test user and pet with medical history',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'HistoryTest123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        const petData = {
          userId: userData.userId,
          name: 'History Dog',
          species: 'dog',
          breed: 'German Shepherd',
          age: 7,
          weight: 35,
          medicalHistory: 'Previous hip dysplasia, arthritis diagnosis 2 years ago, currently on joint supplements'
        };
        
        const petResponse = await fetch(`${API_BASE}/api/pets/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(petData)
        });
        
        if (petResponse.status === 201) {
          const petResult = await petResponse.json();
          results[0].status = 'passed';
          results[0].details = `Pet with medical history created: ${petResult.petId}`;
          
          // Step 2: Submit assessment for related symptoms
          results.push({
            step: 2,
            description: 'Testing assessment with history-related symptoms',
            status: 'running'
          });
          
          const assessmentData = {
            petId: petResult.petId,
            symptoms: ['limping', 'stiffness', 'reluctance to walk'],
            duration: '1 week',
            severity: 'moderate'
          };
          
          const assessmentResponse = await fetch(`${API_BASE}/api/medical/assess`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assessmentData)
          });
          
          if (assessmentResponse.status === 200) {
            const result = await assessmentResponse.json();
            const mentionsHistory = result.assessment.toLowerCase().includes('arthritis') || 
                                   result.assessment.toLowerCase().includes('hip') ||
                                   result.assessment.toLowerCase().includes('history');
            
            results[1].status = mentionsHistory ? 'passed' : 'warning';
            results[1].details = `AI referenced medical history: ${mentionsHistory}`;
          } else {
            results[1].status = 'failed';
            results[1].details = `Assessment failed: ${assessmentResponse.status}`;
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
      results[0] = results[0] || { step: 1, description: 'History context test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};