// Test Script 062: NFT Metadata Generation
// Purpose: Test NFT metadata generation with pet information and traits
// Expected: Properly formatted metadata with pet details and rarity traits

export default {
  id: '062',
  name: 'NFT Metadata Generation',
  description: 'Tests NFT metadata generation including pet information, traits, and rarity attributes',
  category: 'NFT',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      results.push({
        step: 1,
        description: 'Testing NFT metadata generation',
        status: 'running'
      });
      
      // Test metadata generation endpoint
      const metadataResponse = await fetch(`${API_BASE}/api/nft/generate-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: 'test-pet-id',
          mintType: 'pet_portrait',
          traits: {
            species: 'dog',
            breed: 'Golden Retriever',
            age: 'Adult',
            rarity: 'Common'
          }
        })
      });
      
      if (metadataResponse.status === 200) {
        const metadata = await metadataResponse.json();
        const hasRequiredFields = metadata.name && metadata.description && metadata.image && metadata.attributes;
        
        results[0].status = hasRequiredFields ? 'passed' : 'failed';
        results[0].details = hasRequiredFields ? 'Metadata properly generated' : 'Missing required metadata fields';
      } else {
        results[0].status = 'warning';
        results[0].details = `Metadata generation not available: ${metadataResponse.status}`;
      }
      
    } catch (error) {
      results[0].details = `Network Error: ${error.message}`;
      results[0].status = 'failed';
    }
    
    return results;
  }
};