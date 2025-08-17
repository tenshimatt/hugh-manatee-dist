// Test Script 048: Required Field Validation
// Purpose: Test validation of required fields in medical consultation requests
// Expected: Missing required fields should return validation errors

export default {
  id: '048',
  name: 'Required Field Validation',
  description: 'Tests validation of required fields in AI medical consultation requests',
  category: 'AI Medical',
  priority: 'Medium',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      // Step 1: Test missing pet ID
      results.push({
        step: 1,
        description: 'Testing missing pet ID validation',
        status: 'running'
      });
      
      const noPetIdResponse = await fetch(`${API_BASE}/api/medical/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: ['cough'],
          duration: '2 days'
        })
      });
      
      results[0].status = noPetIdResponse.status === 400 ? 'passed' : 'failed';
      results[0].details = `Missing pet ID validation: ${noPetIdResponse.status}`;
      
      // Step 2: Test empty symptoms array
      results.push({
        step: 2,
        description: 'Testing empty symptoms validation',
        status: 'running'
      });
      
      const noSymptomsResponse = await fetch(`${API_BASE}/api/medical/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: 'test-pet-id',
          symptoms: [],
          duration: '2 days'
        })
      });
      
      results[1].status = noSymptomsResponse.status === 400 ? 'passed' : 'failed';
      results[1].details = `Empty symptoms validation: ${noSymptomsResponse.status}`;
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Field validation test', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};