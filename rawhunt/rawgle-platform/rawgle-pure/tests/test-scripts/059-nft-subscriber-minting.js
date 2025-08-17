// Test Script 059: NFT Minting for Subscribers
// Purpose: Test NFT minting functionality for premium subscribers
// Expected: Subscribers should receive discounted or free NFT minting

export default {
  id: '059',
  name: 'NFT Minting for Subscribers',
  description: 'Tests NFT minting functionality with subscriber benefits and pricing tiers',
  category: 'NFT',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const subscriberEmail = `nft-subscriber-${Date.now()}@rawgle.com`;
      
      // Step 1: Create subscriber user
      results.push({
        step: 1,
        description: 'Creating premium subscriber for NFT minting',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: subscriberEmail,
          password: 'NFTSubscriber123!',
          subscriptionTier: 'premium'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = `Premium subscriber created: ${userData.userId}`;
        
        // Step 2: Create pet for NFT minting
        results.push({
          step: 2,
          description: 'Creating pet profile for NFT minting',
          status: 'running'
        });
        
        const petData = {
          userId: userData.userId,
          name: 'NFT Pet',
          species: 'dog',
          breed: 'Golden Retriever',
          age: 3,
          photoUrl: 'https://example.com/pet-photo.jpg'
        };
        
        const petResponse = await fetch(`${API_BASE}/api/pets/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(petData)
        });
        
        if (petResponse.status === 201) {
          const petResult = await petResponse.json();
          results[1].status = 'passed';
          results[1].details = `Pet created for NFT: ${petResult.petId}`;
          
          // Step 3: Test subscriber NFT minting
          results.push({
            step: 3,
            description: 'Testing subscriber NFT minting with benefits',
            status: 'running'
          });
          
          const mintRequest = {
            petId: petResult.petId,
            mintType: 'pet_portrait',
            subscriberBenefits: true
          };
          
          const mintResponse = await fetch(`${API_BASE}/api/nft/mint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mintRequest)
          });
          
          if (mintResponse.status === 200 || mintResponse.status === 202) {
            const mintResult = await mintResponse.json();
            results[2].status = 'passed';
            results[2].details = `NFT minting initiated: ${mintResult.mintId}, cost: ${mintResult.cost} PAWS`;
            
            // Step 4: Verify subscriber pricing
            results.push({
              step: 4,
              description: 'Verifying subscriber pricing benefits',
              status: 'running'
            });
            
            const subscriberCost = mintResult.cost || 0;
            const expectedDiscount = subscriberCost < 50; // Assuming regular price is 50+ PAWS
            
            results[3].status = expectedDiscount || subscriberCost === 0 ? 'passed' : 'warning';
            results[3].details = `Subscriber cost: ${subscriberCost} PAWS (discount applied: ${expectedDiscount})`;
            
          } else {
            const errorData = await mintResponse.json();
            results[2].status = 'failed';
            results[2].details = `NFT minting failed: ${errorData.error}`;
          }
          
        } else {
          results[1].status = 'failed';
          results[1].details = `Pet creation failed: ${petResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `Subscriber registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'NFT subscriber minting test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};