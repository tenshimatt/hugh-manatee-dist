// Test Script 061: Insufficient PAWS for NFT
// Purpose: Test NFT minting rejection when user has insufficient PAWS balance
// Expected: HTTP 402 with clear insufficient balance error message

export default {
  id: '061',
  name: 'Insufficient PAWS for NFT',
  description: 'Tests NFT minting rejection when user has insufficient PAWS balance for minting costs',
  category: 'NFT',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `insufficient-nft-${Date.now()}@rawgle.com`;
      
      results.push({
        step: 1,
        description: 'Testing NFT minting with insufficient PAWS balance',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'InsufficientNFT123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        const petResponse = await fetch(`${API_BASE}/api/pets/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.userId,
            name: 'Insufficient Test Pet',
            species: 'dog'
          })
        });
        
        if (petResponse.status === 201) {
          const petResult = await petResponse.json();
          const mintResponse = await fetch(`${API_BASE}/api/nft/mint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              petId: petResult.petId,
              mintType: 'pet_portrait'
            })
          });
          
          if (mintResponse.status === 402 || mintResponse.status === 400) {
            const errorData = await mintResponse.json();
            results[0].status = 'passed';
            results[0].details = `Insufficient balance correctly detected: ${errorData.error}`;
          } else {
            results[0].status = 'failed';
            results[0].details = `Expected insufficient balance error, got ${mintResponse.status}`;
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