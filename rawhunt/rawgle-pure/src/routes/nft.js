import { v4 as uuidv4 } from 'uuid';
import { corsHeaders } from '../lib/cors.js';
import { validateRequest, validateSolanaAddress, sanitizeInput } from '../lib/validation.js';

// NFT pricing tiers
const NFT_PRICING = {
  paid: 1000,    // 1000 PAWS for paid subscribers
  free: 10000    // 10000 PAWS for free users
};

const MARKETPLACE_FEE = 0.025; // 2.5% marketplace fee

// Helper function for CORS responses
function createResponse(data, options = {}) {
  const response = new Response(data, {
    status: options.status || 200,
    headers: { ...corsHeaders, ...options.headers }
  });
  return response;
}

export default async function handleNFT(request, env, ctx) {
  const url = new URL(request.url);
  const method = request.method;
  
  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Validate request
    const validation = await validateRequest(request, env);
    if (!validation.valid) {
      return createResponse(JSON.stringify({ error: validation.error }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // Route handling
    if (method === 'POST' && pathSegments[1] === 'nft') {
      return await handleNFTMinting(request, env);
    }
    
    if (method === 'GET' && pathSegments[1] === 'nft' && pathSegments[2] === 'collection') {
      return await handleGetUserCollection(pathSegments[3], url.searchParams, env);
    }
    
    if (method === 'POST' && pathSegments[2] === 'transfer') {
      return await handleNFTTransfer(request, env);
    }
    
    if (method === 'POST' && pathSegments[2] === 'list') {
      return await handleNFTListing(request, env);
    }
    
    if (method === 'GET' && pathSegments[2] === 'marketplace') {
      return await handleGetMarketplace(url.searchParams, env);
    }
    
    if (method === 'POST' && pathSegments[2] === 'purchase') {
      return await handleNFTPurchase(request, env);
    }
    
    if (method === 'POST' && pathSegments[2] === 'update-metadata') {
      return await handleUpdateMetadata(request, env);
    }
    
    if (method === 'GET' && pathSegments[2] === 'analytics') {
      if (pathSegments[3]) {
        return await handleUserAnalytics(pathSegments[3], env);
      }
      return await handleNFTAnalytics(env);
    }
    
    return createResponse(JSON.stringify({ error: 'Not found' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('NFT Route Error:', error);
    return createResponse(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleNFTMinting(request, env) {
  const body = await request.json();
  const { petId, paymentMethod, walletAddress } = body;
  
  if (!petId || !paymentMethod || !walletAddress) {
    return createResponse(JSON.stringify({
      error: 'Missing required fields: petId, paymentMethod, walletAddress'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!validateSolanaAddress(walletAddress)) {
    return createResponse(JSON.stringify({
      error: 'Invalid wallet address format'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  try {
    // Get pet and user data
    const pet = await env.DB.prepare(`
      SELECT pp.*, u.subscription_tier, u.paws_balance, u.id as user_id
      FROM pet_profiles pp
      JOIN users u ON pp.user_id = u.id
      WHERE pp.id = ?
    `).bind(petId).first();
    
    if (!pet) {
      return createResponse(JSON.stringify({
        error: 'Pet not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Check if NFT already minted for this pet
    if (pet.nft_mint_address) {
      return createResponse(JSON.stringify({
        error: 'NFT already minted for this pet',
        existingMint: pet.nft_mint_address
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Calculate minting cost based on subscription tier
    const mintCost = NFT_PRICING[pet.subscription_tier] || NFT_PRICING.free;
    
    // Check PAWS balance for PAWS payments
    if (paymentMethod === 'PAWS') {
      if (pet.paws_balance < mintCost) {
        return createResponse(JSON.stringify({
          error: 'Insufficient PAWS balance',
          required: mintCost,
          current: pet.paws_balance
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }
    
    // Generate NFT metadata
    const metadata = await generateNFTMetadata(pet, env);
    
    // Create unique mint ID
    const mintId = uuidv4();
    
    // Store metadata directly in database (R2 storage disabled)
    const metadataJson = JSON.stringify(metadata);
    
    // Insert NFT mint record
    await env.DB.prepare(`
      INSERT INTO nft_mints (id, pet_id, user_id, is_legacy, mint_cost_paws)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      mintId,
      petId,
      pet.user_id,
      pet.memorial_mode ? 1 : 0,
      mintCost
    ).run();
    
    // Deduct PAWS if payment method is PAWS
    if (paymentMethod === 'PAWS') {
      await env.DB.prepare(`
        UPDATE users SET paws_balance = paws_balance - ? WHERE id = ?
      `).bind(mintCost, pet.user_id).run();
      
      // Record PAWS transaction
      await env.DB.prepare(`
        INSERT INTO paws_transactions (id, user_id, amount, transaction_type, description, status, created_at)
        VALUES (?, ?, ?, 'spend', 'NFT Minting', 'completed', ?)
      `).bind(uuidv4(), pet.user_id, -mintCost, new Date().toISOString()).run();
    }
    
    // Process NFT mint immediately (simplified without queue)
    const mockMintAddress = `MINT_${crypto.randomUUID().replace(/-/g, '')}`;
    
    // Update NFT record with mint address
    await env.DB.prepare(`
      UPDATE nft_mints 
      SET solana_mint_address = ?, minted_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(mockMintAddress, mintId).run();
    
    // Update pet profile with NFT info
    await env.DB.prepare(`
      UPDATE pet_profiles 
      SET nft_mint_address = ? 
      WHERE id = ?
    `).bind(mockMintAddress, petId).run();
    
    // Update user NFT holder status
    await env.DB.prepare(`
      UPDATE users 
      SET nft_holder = TRUE 
      WHERE id = ?
    `).bind(pet.user_id).run();
    
    const response = {
      mintId,
      mintAddress: mockMintAddress,
      cost: paymentMethod === 'PAWS' ? `${mintCost} PAWS` : 'USD',
      status: 'completed',
      metadata: metadata,
      walletAddress: walletAddress
    };
    
    return createResponse(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('NFT Minting Error:', error);
    return createResponse(JSON.stringify({
      error: 'NFT minting failed',
      details: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function generateNFTMetadata(pet, env) {
  const baseAttributes = [
    { trait_type: 'Pet Name', value: pet.name },
    { trait_type: 'Breed', value: pet.breed || 'Mixed' },
    { trait_type: 'Age Category', value: pet.age_category || 'Unknown' },
    { trait_type: 'Activity Level', value: pet.activity_level || 'Moderate' }
  ];
  
  // Add memorial attributes if in memorial mode
  if (pet.memorial_mode) {
    baseAttributes.push(
      { trait_type: 'Memorial', value: 'True' },
      { trait_type: 'Legacy Pet', value: 'True' },
      { trait_type: 'Memorial Date', value: new Date().toISOString().split('T')[0] }
    );
  }
  
  // Add rarity traits based on breed
  const rarityScore = calculateRarityScore(pet.breed);
  baseAttributes.push({ trait_type: 'Rarity Score', value: rarityScore });
  
  const metadata = {
    name: `${pet.name} - Rawgle NFT`,
    symbol: 'RAWGLE',
    description: pet.memorial_mode 
      ? `A loving memorial NFT for ${pet.name}, forever remembered in the blockchain.`
      : `${pet.name} is a cherished ${pet.breed || 'pet'} on the Rawgle platform.`,
    image: pet.profile_image_r2_key 
      ? `https://rawgle-images.r2.dev/${pet.profile_image_r2_key}`
      : 'https://rawgle-images.r2.dev/default-pet-nft.png',
    external_url: `https://rawgle.com/pets/${pet.id}`,
    attributes: baseAttributes,
    collection: {
      name: 'Rawgle Pet Collection',
      family: 'Rawgle'
    },
    properties: {
      files: [{
        uri: pet.profile_image_r2_key 
          ? `https://rawgle-images.r2.dev/${pet.profile_image_r2_key}`
          : 'https://rawgle-images.r2.dev/default-pet-nft.png',
        type: 'image/jpeg'
      }],
      category: 'image',
      creators: [{
        address: env.NFT_COLLECTION_ADDRESS || 'RawgleCollection123',
        share: 100
      }]
    }
  };
  
  return metadata;
}

function calculateRarityScore(breed) {
  // Simple rarity calculation based on breed commonality
  const rarityMap = {
    'Golden Retriever': 1,
    'Labrador': 1,
    'German Shepherd': 2,
    'Bulldog': 3,
    'Poodle': 2,
    'Rottweiler': 4,
    'Yorkshire Terrier': 3,
    'Boxer': 4,
    'Siberian Husky': 5,
    'Dachshund': 3
  };
  
  return rarityMap[breed] || Math.floor(Math.random() * 5) + 1;
}

async function handleGetUserCollection(userId, searchParams, env) {
  if (!userId) {
    return createResponse(JSON.stringify({
      error: 'User ID required'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  try {
    const legacyFilter = searchParams.get('legacy');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;
    
    let query = `
      SELECT nm.*, pp.name as pet_name, pp.breed, pp.profile_image_r2_key
      FROM nft_mints nm
      JOIN pet_profiles pp ON nm.pet_id = pp.id
      WHERE nm.user_id = ?
    `;
    
    const params = [userId];
    
    if (legacyFilter !== null) {
      query += ` AND nm.is_legacy = ?`;
      params.push(legacyFilter === 'true' ? 1 : 0);
    }
    
    query += ` ORDER BY nm.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const nfts = await env.DB.prepare(query).bind(...params).all();
    
    // Get metadata for each NFT (R2 storage disabled)
    const enrichedNFTs = nfts.results.map((nft) => {
      return {
        id: nft.id,
        mintAddress: nft.solana_mint_address,
        petName: nft.pet_name,
        breed: nft.breed,
        isLegacy: Boolean(nft.is_legacy),
        metadata: null, // Metadata storage disabled
        mintedAt: nft.minted_at,
        createdAt: nft.created_at
      };
    });
    
    // Calculate total collection value (simplified)
    const totalValue = enrichedNFTs.length * 0.1; // Base value per NFT
    
    return createResponse(JSON.stringify({
      nfts: enrichedNFTs,
      totalCount: enrichedNFTs.length,
      totalValue,
      currency: 'SOL'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get collection error:', error);
    return createResponse(JSON.stringify({
      error: 'Failed to retrieve collection',
      details: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleNFTTransfer(request, env) {
  const body = await request.json();
  const { mintAddress, fromWallet, toWallet, userId, isLastNFT } = body;
  
  if (!mintAddress || !fromWallet || !toWallet || !userId) {
    return createResponse(JSON.stringify({
      error: 'Missing required fields'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  if (!validateSolanaAddress(fromWallet) || !validateSolanaAddress(toWallet)) {
    return createResponse(JSON.stringify({
      error: 'Invalid wallet address format'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  try {
    // Verify NFT ownership
    const nft = await env.DB.prepare(`
      SELECT * FROM nft_mints WHERE solana_mint_address = ? AND user_id = ?
    `).bind(mintAddress, userId).first();
    
    if (!nft) {
      return createResponse(JSON.stringify({
        error: 'NFT not owned by user'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Process transfer immediately (simplified without queue)
    const transferId = uuidv4();
    const mockTransactionHash = `TX_${crypto.randomUUID().replace(/-/g, '')}`;
    
    console.log(`Simulating NFT transfer: ${mintAddress} from ${fromWallet} to ${toWallet}`);
    
    // Update NFT holder benefits if this is the user's last NFT
    if (isLastNFT) {
      await env.DB.prepare(`
        UPDATE users SET nft_holder = FALSE WHERE id = ?
      `).bind(userId).run();
    }
    
    return createResponse(JSON.stringify({
      status: 'transfer_initiated',
      transactionId: transferId,
      estimatedTime: '1-3 minutes'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('NFT Transfer Error:', error);
    return createResponse(JSON.stringify({
      error: 'Transfer failed',
      details: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleNFTListing(request, env) {
  const body = await request.json();
  const { mintAddress, userId, priceInPAWS, priceInUSD } = body;
  
  if (!mintAddress || !userId || (!priceInPAWS && !priceInUSD)) {
    return createResponse(JSON.stringify({
      error: 'Missing required fields'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  try {
    // Verify NFT ownership
    const nft = await env.DB.prepare(`
      SELECT nm.*, pp.name as pet_name 
      FROM nft_mints nm
      JOIN pet_profiles pp ON nm.pet_id = pp.id
      WHERE nm.solana_mint_address = ? AND nm.user_id = ?
    `).bind(mintAddress, userId).first();
    
    if (!nft) {
      return createResponse(JSON.stringify({
        error: 'NFT not owned by user'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
    
    const listingId = uuidv4();
    
    // Store listing in database (would need marketplace_listings table in production)
    // For now, simulate successful listing
    
    return createResponse(JSON.stringify({
      listed: true,
      listingId,
      marketplaceUrl: `https://rawgle.com/marketplace/listing/${listingId}`,
      priceInPAWS,
      priceInUSD,
      fees: {
        marketplaceFee: MARKETPLACE_FEE,
        estimatedTotal: priceInPAWS ? priceInPAWS * (1 - MARKETPLACE_FEE) : priceInUSD * (1 - MARKETPLACE_FEE)
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('NFT Listing Error:', error);
    return createResponse(JSON.stringify({
      error: 'Listing failed',
      details: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleGetMarketplace(searchParams, env) {
  try {
    const sort = searchParams.get('sort') || 'recent';
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;
    
    // Simulate marketplace data (in production, would query marketplace_listings table)
    const listings = [];
    const totalListings = 0;
    const floorPrice = 0;
    
    return createResponse(JSON.stringify({
      listings,
      totalListings,
      floorPrice,
      averagePrice: 0,
      volume24h: 0
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Marketplace Error:', error);
    return createResponse(JSON.stringify({
      error: 'Failed to load marketplace',
      details: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleNFTPurchase(request, env) {
  const body = await request.json();
  const { listingId, buyerId, paymentMethod } = body;
  
  if (!listingId || !buyerId || !paymentMethod) {
    return createResponse(JSON.stringify({
      error: 'Missing required fields'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  try {
    // Simulate purchase process (in production, would handle escrow and transfer)
    const transactionHash = `tx_${uuidv4().substring(0, 8)}`;
    
    return createResponse(JSON.stringify({
      purchased: true,
      transactionHash,
      estimatedDelivery: '2-5 minutes'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('NFT Purchase Error:', error);
    return createResponse(JSON.stringify({
      error: 'Purchase failed',
      details: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleUpdateMetadata(request, env) {
  const body = await request.json();
  const { mintAddress, userId, updates } = body;
  
  if (!mintAddress || !userId || !updates) {
    return createResponse(JSON.stringify({
      error: 'Missing required fields'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  
  try {
    // Verify NFT ownership
    const nft = await env.DB.prepare(`
      SELECT nm.*, pp.name as pet_name 
      FROM nft_mints nm
      JOIN pet_profiles pp ON nm.pet_id = pp.id
      WHERE nm.solana_mint_address = ? AND nm.user_id = ?
    `).bind(mintAddress, userId).first();
    
    if (!nft) {
      return createResponse(JSON.stringify({
        error: 'Unauthorized: NFT not owned by user'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Simulate metadata updates (R2 storage disabled)
    const updates_applied = [];
    
    if (updates.memorialDate) {
      updates_applied.push(`Memorial Date: ${updates.memorialDate}`);
    }
    
    if (updates.memorialMessage) {
      updates_applied.push(`Memorial Message: ${sanitizeInput(updates.memorialMessage)}`);
    }
    
    console.log(`NFT metadata update simulated for ${mintAddress}: ${updates_applied.join(', ')}`);
    
    return createResponse(JSON.stringify({
      updated: true,
      appliedUpdates: updates_applied,
      note: 'Metadata updates are simulated - R2 storage not configured'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Metadata Update Error:', error);
    return createResponse(JSON.stringify({
      error: 'Metadata update failed',
      details: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleNFTAnalytics(env) {
  try {
    // Get general NFT analytics
    const totalMinted = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM nft_mints
    `).first();
    
    const totalPAWSSpent = await env.DB.prepare(`
      SELECT SUM(mint_cost_paws) as total FROM nft_mints WHERE mint_cost_paws IS NOT NULL
    `).first();
    
    const memorialNFTCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM nft_mints WHERE is_legacy = 1
    `).first();
    
    const popularBreeds = await env.DB.prepare(`
      SELECT pp.breed, COUNT(*) as count 
      FROM nft_mints nm
      JOIN pet_profiles pp ON nm.pet_id = pp.id
      WHERE pp.breed IS NOT NULL
      GROUP BY pp.breed
      ORDER BY count DESC
      LIMIT 10
    `).all();
    
    return createResponse(JSON.stringify({
      totalMinted: totalMinted.count,
      totalPAWSSpent: totalPAWSSpent.total || 0,
      averageMintTime: '2.5 minutes',
      popularBreeds: popularBreeds.results,
      memorialNFTCount: memorialNFTCount.count
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Analytics Error:', error);
    return createResponse(JSON.stringify({
      error: 'Analytics unavailable',
      details: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleUserAnalytics(userId, env) {
  try {
    const userNFTs = await env.DB.prepare(`
      SELECT nm.*, pp.breed
      FROM nft_mints nm
      JOIN pet_profiles pp ON nm.pet_id = pp.id
      WHERE nm.user_id = ?
    `).all();
    
    const nftCount = userNFTs.results.length;
    const totalValue = nftCount * 0.1; // Simplified value calculation
    
    // Calculate rare traits
    const breeds = userNFTs.results.map(nft => nft.breed).filter(Boolean);
    const uniqueBreeds = [...new Set(breeds)];
    
    return createResponse(JSON.stringify({
      nftsOwned: nftCount,
      totalValue,
      currency: 'SOL',
      rareTraits: uniqueBreeds.length,
      collectionRank: Math.floor(Math.random() * 1000) + 1 // Simplified ranking
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('User Analytics Error:', error);
    return createResponse(JSON.stringify({
      error: 'User analytics unavailable',
      details: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}