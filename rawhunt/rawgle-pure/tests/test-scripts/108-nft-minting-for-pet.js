// Test Script 108: NFT Minting for Pet
// Purpose: Tests complete NFT minting workflow with PAWS payment
// User Story: User mints NFT of their pet using PAWS balance

export default {
  id: '108',
  name: 'NFT Minting for Pet',
  description: 'Complete NFT minting workflow with PAWS payment validation',
  category: 'Integration',
  priority: 'Medium',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    // Setup test user with sufficient PAWS for minting
    const testUser = {
      email: `nft-minter-${Date.now()}@rawgle.com`,
      password: 'NFTMinter123!',
      name: 'NFT Minter Test'
    };
    
    try {
      // Step 1: Setup user and pet for NFT minting
      results.push({
        step: 1,
        description: 'Setup user and pet for NFT minting',
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
      
      // Login to get auth token
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
      
      // Create pet for NFT minting
      const petData = {
        name: 'NFT Pet',
        breed: 'Border Collie',
        age: '4',
        weight: '22',
        description: 'Beautiful pet ready for NFT minting'
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
      
      // Step 2: Check initial PAWS balance
      results.push({
        step: 2,
        description: 'Check initial PAWS balance for minting',
        status: 'running'
      });
      
      const balanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${userData.userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        results[1].status = 'passed';
        results[1].details = `Initial PAWS balance: ${balanceData.balance}`;
        
        // Step 3: Check NFT minting cost
        results.push({
          step: 3,
          description: 'Check NFT minting cost requirements',
          status: 'running'
        });
        
        const costResponse = await fetch(`${API_BASE}/api/nft/mint-cost`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (costResponse.ok) {
          const costData = await costResponse.json();
          results[2].status = 'passed';
          results[2].details = `NFT minting cost: ${costData.cost} PAWS`;
          
          // Step 4: Mint NFT if sufficient balance
          results.push({
            step: 4,
            description: 'Mint NFT for pet',
            status: 'running'
          });
          
          if (balanceData.balance >= costData.cost) {
            const mintData = {
              petId: petId,
              nftName: `${petData.name} NFT`,
              description: `Unique NFT of ${petData.name}, a ${petData.breed}`,
              attributes: {
                breed: petData.breed,
                age: petData.age,
                weight: petData.weight
              }
            };
            
            const mintResponse = await fetch(`${API_BASE}/api/nft/mint`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify(mintData)
            });
            
            if (mintResponse.ok) {
              const mintResult = await mintResponse.json();
              results[3].status = 'passed';
              results[3].details = `NFT minted successfully: ${mintResult.nft.tokenId}`;
              
              // Step 5: Verify PAWS deduction
              results.push({
                step: 5,
                description: 'Verify PAWS deducted from balance',
                status: 'running'
              });
              
              const newBalanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${userData.userId}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${authToken}`
                }
              });
              
              if (newBalanceResponse.ok) {
                const newBalanceData = await newBalanceResponse.json();
                const expectedBalance = balanceData.balance - costData.cost;
                
                if (newBalanceData.balance === expectedBalance) {
                  results[4].status = 'passed';
                  results[4].details = `PAWS correctly deducted: ${newBalanceData.balance} remaining`;
                } else {
                  results[4].status = 'failed';
                  results[4].details = `PAWS deduction error: Expected ${expectedBalance}, got ${newBalanceData.balance}`;
                }
              } else {
                results[4].status = 'failed';
                results[4].details = `Balance check failed: ${newBalanceResponse.status}`;
              }
              
              // Step 6: Verify NFT in user's collection
              results.push({
                step: 6,
                description: 'Verify NFT appears in user collection',
                status: 'running'
              });
              
              const collectionResponse = await fetch(`${API_BASE}/api/nft/collection/${userData.userId}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${authToken}`
                }
              });
              
              if (collectionResponse.ok) {
                const collectionData = await collectionResponse.json();
                const mintedNFT = collectionData.nfts.find(nft => nft.tokenId === mintResult.nft.tokenId);
                
                if (mintedNFT) {
                  results[5].status = 'passed';
                  results[5].details = `NFT found in collection: ${mintedNFT.name}`;
                } else {
                  results[5].status = 'failed';
                  results[5].details = 'NFT not found in user collection';
                }
              } else {
                results[5].status = 'failed';
                results[5].details = `Collection query failed: ${collectionResponse.status}`;
              }
              
            } else {
              results[3].status = 'failed';
              results[3].details = `NFT minting failed: ${mintResponse.status}`;
            }
            
          } else {
            results[3].status = 'warning';
            results[3].details = `Insufficient PAWS: Need ${costData.cost}, have ${balanceData.balance}`;
          }
          
        } else {
          results[2].status = 'failed';
          results[2].details = `Cost query failed: ${costResponse.status}`;
        }
        
      } else {
        results[1].status = 'failed';
        results[1].details = `Balance check failed: ${balanceResponse.status}`;
      }
      
    } catch (error) {
      const currentStep = results.length > 0 ? results.length - 1 : 0;
      results[currentStep] = results[currentStep] || { step: currentStep + 1, description: 'NFT minting test', status: 'failed' };
      results[currentStep].status = 'failed';
      results[currentStep].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};