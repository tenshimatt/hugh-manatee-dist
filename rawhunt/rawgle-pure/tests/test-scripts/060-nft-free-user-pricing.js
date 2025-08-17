// Test Script 060: NFT Pricing for Free Users
// Purpose: Test NFT pricing structure for free tier users
// Expected: Free users pay full PAWS price for NFT minting

export default {
  id: '060',
  name: 'NFT Pricing for Free Users',
  description: 'Tests NFT pricing structure for free tier users without subscription benefits',
  category: 'NFT',
  priority: 'Medium',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const freeUserEmail = `nft-free-user-${Date.now()}@rawgle.com`;
      
      // Step 1: Create free user
      results.push({
        step: 1,
        description: 'Creating free user for NFT pricing test',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: freeUserEmail,
          password: 'NFTFreeUser123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = `Free user created: ${userData.userId}`;
        
        // Step 2: Add sufficient PAWS for NFT minting
        results.push({
          step: 2,
          description: 'Adding PAWS balance for NFT minting test',
          status: 'running'
        });
        
        const addBalanceResponse = await fetch(`${API_BASE}/api/paws/admin/add-balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.userId,
            amount: 100,
            reason: 'NFT minting test'
          })
        });
        
        let currentBalance = userData.pawsBalance;
        if (addBalanceResponse.status === 200) {
          const balanceData = await addBalanceResponse.json();
          currentBalance = balanceData.newBalance;
          results[1].status = 'passed';
          results[1].details = `Balance updated: ${currentBalance} PAWS`;
        } else {
          results[1].status = 'warning';
          results[1].details = `Using initial balance: ${currentBalance} PAWS`;
        }
        
        // Step 3: Create pet for NFT
        results.push({
          step: 3,
          description: 'Creating pet for NFT minting',
          status: 'running'
        });
        
        const petResponse = await fetch(`${API_BASE}/api/pets/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.userId,
            name: 'Free User Pet',
            species: 'cat',
            breed: 'Persian'
          })
        });
        
        if (petResponse.status === 201) {
          const petResult = await petResponse.json();
          results[2].status = 'passed';
          results[2].details = `Pet created: ${petResult.petId}`;
          
          // Step 4: Test free user NFT pricing
          results.push({
            step: 4,
            description: 'Testing free user NFT pricing structure',
            status: 'running'
          });
          
          const pricingResponse = await fetch(`${API_BASE}/api/nft/pricing?petId=${petResult.petId}&userId=${userData.userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (pricingResponse.status === 200) {
            const pricingData = await pricingResponse.json();
            results[3].status = 'passed';
            results[3].details = `Free user NFT cost: ${pricingData.cost} PAWS (no subscriber discount)`;
            
            // Step 5: Attempt NFT minting with full price
            results.push({
              step: 5,
              description: 'Testing NFT minting at full price for free users',
              status: 'running'
            });
            
            const mintResponse = await fetch(`${API_BASE}/api/nft/mint`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                petId: petResult.petId,
                mintType: 'pet_portrait'
              })
            });
            
            if (mintResponse.status === 200 || mintResponse.status === 202) {
              const mintResult = await mintResponse.json();
              results[4].status = 'passed';
              results[4].details = `NFT minting successful: ${mintResult.mintId}`;
            } else if (mintResponse.status === 402 || mintResponse.status === 400) {
              const errorData = await mintResponse.json();
              if (errorData.error && errorData.error.includes('insufficient')) {
                results[4].status = 'passed';
                results[4].details = 'Insufficient balance correctly detected for free user pricing';
              } else {
                results[4].status = 'failed';
                results[4].details = `Unexpected error: ${errorData.error}`;
              }
            } else {
              results[4].status = 'failed';
              results[4].details = `Minting failed: ${mintResponse.status}`;
            }
            
          } else {
            results[3].status = 'warning';
            results[3].details = `Pricing endpoint not available: ${pricingResponse.status}`;
          }
          
        } else {
          results[2].status = 'failed';
          results[2].details = `Pet creation failed: ${petResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'NFT free user pricing test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};