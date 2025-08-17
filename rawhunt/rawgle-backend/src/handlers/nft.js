/**
 * NFT Handler for Rawgle
 * Handles pet profile NFT minting and management
 */

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const app = new Hono();

// All routes require authentication
app.use('*', authMiddleware);

// Validation schemas
const mintPetNftSchema = z.object({
  pet_id: z.string().uuid('Invalid pet ID'),
  nft_type: z.enum(['pet_profile', 'achievement', 'memorial', 'special_edition']).default('pet_profile'),
  custom_attributes: z.object({
    background: z.string().optional(),
    frame: z.string().optional(),
    special_effects: z.array(z.string()).optional()
  }).optional()
});

// POST /api/nft/pets/:petId - Mint pet profile NFT
app.post('/pets/:petId', validateRequest(mintPetNftSchema), async (c) => {
  try {
    const user = c.get('user');
    const petId = c.req.param('petId');
    const { nft_type, custom_attributes } = c.get('validatedData');
    
    // Verify pet ownership and that NFT hasn't been minted
    const pet = await c.env.DB
      .prepare(`
        SELECT id, name, species, breed, birth_date, weight_lbs, photos, 
               nft_minted, user_id
        FROM pets 
        WHERE id = ? AND active = 1
      `)
      .bind(petId)
      .first();
    
    if (!pet || pet.user_id !== user.id) {
      return c.json({
        success: false,
        error: 'PET_NOT_FOUND',
        message: 'Pet not found or access denied'
      }, 404);
    }
    
    if (pet.nft_minted) {
      return c.json({
        success: false,
        error: 'NFT_ALREADY_MINTED',
        message: 'NFT has already been minted for this pet'
      }, 409);
    }
    
    // Check if user has enough PAWS tokens
    const mintCost = 100; // Cost in PAWS tokens
    const userBalance = await c.env.DB
      .prepare('SELECT paws_balance FROM users WHERE id = ?')
      .bind(user.id)
      .first();
    
    if (!userBalance || userBalance.paws_balance < mintCost) {
      return c.json({
        success: false,
        error: 'INSUFFICIENT_PAWS',
        message: `Insufficient PAWS tokens. Need ${mintCost} PAWS to mint NFT.`
      }, 402);
    }
    
    // Generate NFT metadata
    const tokenId = nanoid(21);
    const nftId = nanoid(21);
    
    const metadata = {
      name: `${pet.name} - Rawgle Pet Profile`,
      description: `Digital collectible pet profile for ${pet.name}, a ${pet.species}${pet.breed ? ` (${pet.breed})` : ''} on the Rawgle raw feeding platform.`,
      image: pet.photos ? JSON.parse(pet.photos)[0] : null,
      external_url: `https://rawgle.com/pets/${petId}`,
      attributes: [
        { trait_type: 'Species', value: pet.species },
        { trait_type: 'Platform', value: 'Rawgle' },
        { trait_type: 'NFT Type', value: nft_type },
        ...(pet.breed ? [{ trait_type: 'Breed', value: pet.breed }] : []),
        ...(pet.weight_lbs ? [{ trait_type: 'Weight (lbs)', value: pet.weight_lbs.toString() }] : []),
        { trait_type: 'Mint Date', value: new Date().toISOString().split('T')[0] }
      ],
      ...(custom_attributes || {})
    };
    
    // Calculate rarity score (simplified)
    let rarityScore = 100;
    if (pet.breed) rarityScore += 20;
    if (nft_type === 'special_edition') rarityScore += 50;
    if (custom_attributes?.special_effects?.length > 0) rarityScore += 30;
    
    try {
      // Create NFT record
      const now = new Date().toISOString();
      await c.env.DB
        .prepare(`
          INSERT INTO nft_records (
            id, user_id, pet_id, nft_type, token_id, blockchain, name, description,
            image_url, external_url, attributes, metadata, rarity_score,
            mint_cost_paws, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          nftId, user.id, petId, nft_type, tokenId, 'solana',
          metadata.name, metadata.description, metadata.image, metadata.external_url,
          JSON.stringify(metadata.attributes), JSON.stringify(metadata),
          rarityScore, mintCost, 'pending', now
        )
        .run();
      
      // Deduct PAWS tokens
      await c.env.DB
        .prepare(`
          UPDATE users 
          SET paws_balance = paws_balance - ?, 
              paws_lifetime_spent = paws_lifetime_spent + ?,
              updated_at = ?
          WHERE id = ?
        `)
        .bind(mintCost, mintCost, now, user.id)
        .run();
      
      // Record PAWS transaction
      const transactionId = nanoid(21);
      await c.env.DB
        .prepare(`
          INSERT INTO paws_transactions (
            id, user_id, transaction_type, amount, balance_before, balance_after,
            reason, related_entity_type, related_entity_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          transactionId, user.id, 'spent', -mintCost, 
          userBalance.paws_balance, userBalance.paws_balance - mintCost,
          'NFT minting', 'nft', nftId, now
        )
        .run();
      
      // Update pet NFT status (simulate minting for now)
      await c.env.DB
        .prepare('UPDATE pets SET nft_minted = TRUE, nft_token_id = ?, updated_at = ? WHERE id = ?')
        .bind(tokenId, now, petId)
        .run();
      
      // Update NFT record status (simulate successful minting)
      await c.env.DB
        .prepare('UPDATE nft_records SET status = ?, minted_at = ? WHERE id = ?')
        .bind('minted', now, nftId)
        .run();
      
      const nftRecord = {
        id: nftId,
        token_id: tokenId,
        nft_type,
        blockchain: 'solana',
        status: 'minted',
        metadata,
        rarity_score: rarityScore,
        mint_cost_paws: mintCost,
        minted_at: now,
        created_at: now
      };
      
      return c.json({
        success: true,
        message: 'NFT minted successfully',
        data: {
          nft: nftRecord,
          remaining_paws: userBalance.paws_balance - mintCost
        }
      }, 201);
    } catch (error) {
      console.error('NFT minting error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Mint pet NFT error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return c.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message
      }, 400);
    }
    
    return c.json({
      success: false,
      error: 'NFT_MINT_FAILED',
      message: 'Failed to mint NFT'
    }, 500);
  }
});

// GET /api/nft/collection - Get user's NFT collection
app.get('/collection', async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const { 
      limit = 20, 
      offset = 0, 
      nft_type, 
      sort = 'minted_at',
      order = 'desc' 
    } = query;
    
    let whereClause = 'WHERE user_id = ?';
    const bindings = [user.id];
    
    if (nft_type) {
      whereClause += ' AND nft_type = ?';
      bindings.push(nft_type);
    }
    
    const nfts = await c.env.DB
      .prepare(`
        SELECT nr.id, nr.nft_type, nr.token_id, nr.blockchain, nr.name, 
               nr.description, nr.image_url, nr.external_url, nr.attributes,
               nr.rarity_score, nr.rarity_rank, nr.status, nr.minted_at,
               nr.created_at, p.name as pet_name, p.species
        FROM nft_records nr
        JOIN pets p ON nr.pet_id = p.id
        ${whereClause}
        ORDER BY ${sort} ${order.toUpperCase()}
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, parseInt(limit), parseInt(offset))
      .all();
    
    const totalCount = await c.env.DB
      .prepare(`SELECT COUNT(*) as count FROM nft_records ${whereClause}`)
      .bind(...bindings.slice(0, -2)) // Remove limit and offset
      .first();
    
    const collection = (nfts.results || []).map(nft => ({
      ...nft,
      attributes: JSON.parse(nft.attributes || '[]')
    }));
    
    return c.json({
      success: true,
      data: {
        nfts: collection,
        pagination: {
          total: totalCount?.count || 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          pages: Math.ceil((totalCount?.count || 0) / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get NFT collection error:', error);
    return c.json({
      success: false,
      error: 'COLLECTION_FETCH_FAILED',
      message: 'Failed to retrieve NFT collection'
    }, 500);
  }
});

// GET /api/nft/:id - Get specific NFT details
app.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const nftId = c.req.param('id');
    
    const nft = await c.env.DB
      .prepare(`
        SELECT nr.*, p.name as pet_name, p.species, p.breed,
               u.name as owner_name
        FROM nft_records nr
        JOIN pets p ON nr.pet_id = p.id
        JOIN users u ON nr.user_id = u.id
        WHERE nr.id = ? AND nr.user_id = ?
      `)
      .bind(nftId, user.id)
      .first();
    
    if (!nft) {
      return c.json({
        success: false,
        error: 'NFT_NOT_FOUND',
        message: 'NFT not found or access denied'
      }, 404);
    }
    
    const nftData = {
      ...nft,
      attributes: JSON.parse(nft.attributes || '[]'),
      metadata: JSON.parse(nft.metadata || '{}')
    };
    
    return c.json({
      success: true,
      data: {
        nft: nftData
      }
    });
  } catch (error) {
    console.error('Get NFT details error:', error);
    return c.json({
      success: false,
      error: 'NFT_FETCH_FAILED',
      message: 'Failed to retrieve NFT details'
    }, 500);
  }
});

// GET /api/nft/marketplace - Get marketplace NFTs (public view)
app.get('/marketplace', async (c) => {
  try {
    const query = c.req.query();
    const { 
      limit = 20, 
      offset = 0, 
      nft_type,
      min_rarity,
      max_rarity,
      species,
      sort = 'minted_at',
      order = 'desc' 
    } = query;
    
    let whereClause = 'WHERE nr.status = ?';
    const bindings = ['minted'];
    
    if (nft_type) {
      whereClause += ' AND nr.nft_type = ?';
      bindings.push(nft_type);
    }
    
    if (min_rarity) {
      whereClause += ' AND nr.rarity_score >= ?';
      bindings.push(parseFloat(min_rarity));
    }
    
    if (max_rarity) {
      whereClause += ' AND nr.rarity_score <= ?';
      bindings.push(parseFloat(max_rarity));
    }
    
    if (species) {
      whereClause += ' AND p.species = ?';
      bindings.push(species);
    }
    
    const nfts = await c.env.DB
      .prepare(`
        SELECT nr.id, nr.nft_type, nr.token_id, nr.blockchain, nr.name,
               nr.description, nr.image_url, nr.rarity_score, nr.rarity_rank,
               nr.minted_at, p.name as pet_name, p.species, p.breed,
               u.name as owner_name
        FROM nft_records nr
        JOIN pets p ON nr.pet_id = p.id
        JOIN users u ON nr.user_id = u.id
        ${whereClause}
        ORDER BY ${sort} ${order.toUpperCase()}
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, parseInt(limit), parseInt(offset))
      .all();
    
    const totalCount = await c.env.DB
      .prepare(`
        SELECT COUNT(*) as count 
        FROM nft_records nr
        JOIN pets p ON nr.pet_id = p.id
        ${whereClause}
      `)
      .bind(...bindings.slice(0, -2))
      .first();
    
    return c.json({
      success: true,
      data: {
        nfts: nfts.results || [],
        pagination: {
          total: totalCount?.count || 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          pages: Math.ceil((totalCount?.count || 0) / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get NFT marketplace error:', error);
    return c.json({
      success: false,
      error: 'MARKETPLACE_FETCH_FAILED',
      message: 'Failed to retrieve marketplace NFTs'
    }, 500);
  }
});

// GET /api/nft/stats - Get NFT statistics
app.get('/stats', async (c) => {
  try {
    const user = c.get('user');
    
    const userStats = await c.env.DB
      .prepare(`
        SELECT 
          COUNT(*) as total_nfts,
          COUNT(CASE WHEN status = 'minted' THEN 1 END) as minted_nfts,
          AVG(rarity_score) as avg_rarity,
          SUM(mint_cost_paws) as total_paws_spent
        FROM nft_records 
        WHERE user_id = ?
      `)
      .bind(user.id)
      .first();
    
    const globalStats = await c.env.DB
      .prepare(`
        SELECT 
          COUNT(*) as total_minted,
          COUNT(DISTINCT user_id) as unique_owners,
          AVG(rarity_score) as avg_rarity,
          MAX(rarity_score) as max_rarity
        FROM nft_records 
        WHERE status = 'minted'
      `)
      .first();
    
    const stats = {
      user: userStats || {
        total_nfts: 0,
        minted_nfts: 0,
        avg_rarity: 0,
        total_paws_spent: 0
      },
      global: globalStats || {
        total_minted: 0,
        unique_owners: 0,
        avg_rarity: 0,
        max_rarity: 0
      }
    };
    
    return c.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get NFT stats error:', error);
    return c.json({
      success: false,
      error: 'STATS_FETCH_FAILED',
      message: 'Failed to retrieve NFT statistics'
    }, 500);
  }
});

export default app;