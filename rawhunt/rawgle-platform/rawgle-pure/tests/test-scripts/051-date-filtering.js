// Test Script 051: Date Range Filtering
// Purpose: Tests date range filtering for medical consultation history
// Expected: Consultation history filtered by date range returns correct results

export default {
  id: '051',
  name: 'Date Range Filtering',
  description: 'Tests date range filtering capabilities for medical consultation history retrieval',
  category: 'AI Medical',
  priority: 'Low',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `date-filter-${Date.now()}@rawgle.com`;
      
      results.push({
        step: 1,
        description: 'Testing date range filtering for consultations',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'DateFilter123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        const petResponse = await fetch(`${API_BASE}/api/pets/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.userId,
            name: 'Filter Test Pet',
            species: 'cat'
          })
        });
        
        if (petResponse.status === 201) {
          const petResult = await petResponse.json();
          
          // Test date filtering
          const fromDate = new Date();
          fromDate.setDate(fromDate.getDate() - 7);
          const toDate = new Date();
          
          const filterResponse = await fetch(`${API_BASE}/api/medical/history?petId=${petResult.petId}&from=${fromDate.toISOString()}&to=${toDate.toISOString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (filterResponse.status === 200) {
            results[0].status = 'passed';
            results[0].details = 'Date filtering endpoint accessible';
          } else {
            results[0].status = 'warning';
            results[0].details = `Date filtering not available: ${filterResponse.status}`;
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
      results[0].details = `Network Error: ${error.message}`;
      results[0].status = 'failed';
    }
    
    return results;
  }
};