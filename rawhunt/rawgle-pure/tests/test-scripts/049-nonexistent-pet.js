// Test Script 049: Non-Existent Pet Handling
// Purpose: Test handling of medical consultation requests for non-existent pets
// Expected: HTTP 404 with appropriate error message

export default {
  id: '049',
  name: 'Non-Existent Pet Handling',
  description: 'Tests proper handling of medical consultation requests for non-existent pets',
  category: 'AI Medical',
  priority: 'Low',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      results.push({
        step: 1,
        description: 'Testing consultation request for non-existent pet',
        status: 'running'
      });
      
      const response = await fetch(`${API_BASE}/api/medical/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: 'non-existent-pet-id',
          symptoms: ['cough', 'lethargy'],
          duration: '2 days',
          severity: 'mild'
        })
      });
      
      if (response.status === 404) {
        const errorData = await response.json();
        results[0].status = 'passed';
        results[0].details = `Non-existent pet properly handled: ${errorData.error}`;
      } else {
        results[0].status = 'failed';
        results[0].details = `Expected 404, got ${response.status}`;
      }
      
    } catch (error) {
      results[0].details = `Network Error: ${error.message}`;
      results[0].status = 'failed';
    }
    
    return results;
  }
};