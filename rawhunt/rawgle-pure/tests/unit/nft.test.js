import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Miniflare } from 'miniflare';
import { handleNFT } from '../../src/routes/nft.js';

describe('NFT Minting Routes', () => {
  let mf;
  let env;

  beforeEach(async () => {
    mf = new Miniflare({
      modules: false,
      script: `
        addEventListener('fetch', event => {
          event.respondWith(handleRequest(event.request));
        });
        
        async function handleRequest(request) {
          return new Response(JSON.stringify({ test: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      `,
      d1Databases: ['DB'],
      r2Buckets: ['IMAGES'],
      queues: ['RAWGLE_QUEUE'],
      vars: {
        SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
        NFT_COLLECTION_ADDRESS: 'RawgleCollection123'
      }
    });
    
    env = await mf.getBindings();
    
    // Setup test database
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        paws_balance INTEGER DEFAULT 0,
        subscription_tier TEXT DEFAULT 'free',
        nft_holder BOOLEAN DEFAULT FALSE
      );
      
      CREATE TABLE IF NOT EXISTS pet_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        breed TEXT,
        age_category TEXT,
        profile_image_r2_key TEXT,
        memorial_mode BOOLEAN DEFAULT FALSE,
        nft_mint_address TEXT
      );
      
      CREATE TABLE IF NOT EXISTS nft_mints (
        id TEXT PRIMARY KEY,
        pet_id TEXT,
        user_id TEXT,
        solana_mint_address TEXT UNIQUE,
        metadata_r2_key TEXT,
        is_legacy BOOLEAN DEFAULT FALSE,
        mint_cost_paws INTEGER,
        ipfs_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS paws_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        transaction_type TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert test data
    await env.DB.prepare(`
      INSERT INTO users (id, email, paws_balance, subscription_tier)
      VALUES ('user-1', 'user1@rawgle.com', 15000, 'paid')
    `).run();

    await env.DB.prepare(`
      INSERT INTO pet_profiles (id, user_id, name, breed, age_category, profile_image_r2_key)
      VALUES ('pet-1', 'user-1', 'Buddy', 'Golden Retriever', 'adult', 'images/pet-1.jpg')
    `).run();
  });

  describe('NFT Minting Process', () => {
    it('should mint NFT with PAWS payment for subscriber', async () => {
      const request = new Request('http://localhost/api/nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: 'pet-1',
          paymentMethod: 'PAWS',
          walletAddress: 'UserWallet123'
        })
      });

      const response = await handleNFT(request, env);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('mintId');
      expect(data).toHaveProperty('metadataURI');
      expect(data.cost).toBe('1000 PAWS');
      expect(data.status).toBe('queued');

      // Verify PAWS deducted
      const user = await env.DB.prepare('SELECT paws_balance FROM users WHERE id = ?')
        .bind('user-1').first();
      expect(user.paws_balance).toBe(14000);
    });

    it('should mint NFT with different pricing for free users', async () => {
      // Update user to free tier
      await env.DB.prepare(`
        UPDATE users SET subscription_tier = 'free', paws_balance = 20000 WHERE id = 'user-1'
      `).run();

      const request = new Request('http://localhost/api/nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: 'pet-1',
          paymentMethod: 'PAWS',
          walletAddress: 'UserWallet123'
        })
      });

      const response = await handleNFT(request, env);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cost).toBe('10000 PAWS');

      // Verify higher PAWS amount deducted
      const user = await env.DB.prepare('SELECT paws_balance FROM users WHERE id = ?')
        .bind('user-1').first();
      expect(user.paws_balance).toBe(10000);
    });

    it('should reject minting with insufficient PAWS balance', async () => {
      await env.DB.prepare(`
        UPDATE users SET paws_balance = 500 WHERE id = 'user-1'
      `).run();

      const request = new Request('http://localhost/api/nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: 'pet-1',
          paymentMethod: 'PAWS',
          walletAddress: 'UserWallet123'
        })
      });

      const response = await handleNFT(request, env);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Insufficient PAWS');
      expect(data.required).toBe(1000);
      expect(data.current).toBe(500);
    });

    it('should generate correct NFT metadata', async () => {
      const r2Spy = vi.spyOn(env.IMAGES, 'put');

      const request = new Request('http://localhost/api/nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: 'pet-1',
          paymentMethod: 'PAWS',
          walletAddress: 'UserWallet123'
        })
      });

      await handleNFT(request, env);

      expect(r2Spy).toHaveBeenCalledWith(
        expect.stringMatching(/^nft-metadata\/pet-1\/\d+\.json$/),
        expect.stringContaining('Buddy')
      );

      const metadataCall = r2Spy.mock.calls[0];
      const metadata = JSON.parse(metadataCall[1]);
      
      expect(metadata.name).toBe('Buddy - Rawgle NFT');
      expect(metadata.symbol).toBe('RAWGLE');
      expect(metadata.attributes).toContainEqual(
        expect.objectContaining({ trait_type: 'Pet Name', value: 'Buddy' })
      );
      expect(metadata.attributes).toContainEqual(
        expect.objectContaining({ trait_type: 'Breed', value: 'Golden Retriever' })
      );
    });

    it('should handle memorial mode NFTs specially', async () => {
      await env.DB.prepare(`
        UPDATE pet_profiles SET memorial_mode = true WHERE id = 'pet-1'
      `).run();

      const request = new Request('http://localhost/api/nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: 'pet-1',
          paymentMethod: 'PAWS',
          walletAddress: 'UserWallet123'
        })
      });

      const response = await handleNFT(request, env);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Check NFT marked as legacy
      const nftRecord = await env.DB.prepare(`
        SELECT is_legacy FROM nft_mints WHERE pet_id = ?
      `).bind('pet-1').first();
      expect(nftRecord.is_legacy).toBe(1);
    });

    it('should prevent duplicate NFT minting for same pet', async () => {
      // First mint
      await handleNFT(new Request('http://localhost/api/nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: 'pet-1',
          paymentMethod: 'PAWS',
          walletAddress: 'UserWallet123'
        })
      }), env);

      // Update pet with mint address
      await env.DB.prepare(`
        UPDATE pet_profiles SET nft_mint_address = 'ExistingMint123' WHERE id = 'pet-1'
      `).run();

      // Second mint attempt
      const response = await handleNFT(new Request('http://localhost/api/nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: 'pet-1',
          paymentMethod: 'PAWS',
          walletAddress: 'UserWallet123'
        })
      }), env);

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('already minted');
      expect(data.existingMint).toBe('ExistingMint123');
    });
  });

  describe('NFT Queue Processing', () => {
    it('should queue NFT minting job with correct data', async () => {
      const queueSpy = vi.spyOn(env.RAWGLE_QUEUE, 'send');

      const request = new Request('http://localhost/api/nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: 'pet-1',
          paymentMethod: 'USD',
          walletAddress: 'UserWallet123'
        })
      });

      await handleNFT(request, env);

      expect(queueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'process_nft_mint',
          data: expect.objectContaining({
            petId: 'pet-1',
            walletAddress: 'UserWallet123',
            paymentMethod: 'USD',
            metadata: expect.objectContaining({
              name: 'Buddy - Rawgle NFT'
            })
          })
        })
      );
    });

    it('should handle queue failures gracefully', async () => {
      vi.spyOn(env.RAWGLE_QUEUE, 'send').mockRejectedValueOnce(
        new Error('Queue unavailable')
      );

      const request = new Request('http://localhost/api/nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: 'pet-1',
          paymentMethod: 'PAWS',
          walletAddress: 'UserWallet123'
        })
      });

      const response = await handleNFT(request, env);
      expect(response.status).toBe(503);
      
      const data = await response.json();
      expect(data.error).toContain('temporarily unavailable');

      // Verify PAWS not deducted on failure
      const user = await env.DB.prepare('SELECT paws_balance FROM users WHERE id = ?')
        .bind('user-1').first();
      expect(user.paws_balance).toBe(15000);
    });
  });

  describe('NFT Collection Management', () => {
    it('should retrieve user NFT collection', async () => {
      // Create multiple NFTs
      for (let i = 1; i <= 3; i++) {
        await env.DB.prepare(`
          INSERT INTO pet_profiles (id, user_id, name, breed)
          VALUES (?, 'user-1', ?, 'Breed' || ?)
        `).bind(`pet-${i}`, `Pet${i}`, i).run();

        await env.DB.prepare(`
          INSERT INTO nft_mints (id, pet_id, user_id, solana_mint_address, metadata_r2_key)
          VALUES (?, ?, 'user-1', ?, ?)
        `).bind(`mint-${i}`, `pet-${i}`, `Mint${i}`, `metadata-${i}.json`).run();
      }

      const request = new Request('http://localhost/api/nft/collection/user-1', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await handleNFT(request, env);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.nfts).toHaveLength(3);
      expect(data.totalValue).toBeDefined();
      expect(data.nfts[0]).toHaveProperty('mintAddress');
      expect(data.nfts[0]).toHaveProperty('metadata');
    });

    it('should filter NFT collection by legacy status', async () => {
      await env.DB.prepare(`
        INSERT INTO nft_mints (id, pet_id, user_id, solana_mint_address, is_legacy)
        VALUES ('legacy-mint', 'pet-1', 'user-1', 'LegacyMint123', true)
      `).run();

      const request = new Request('http://localhost/api/nft/collection/user-1?legacy=true', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await handleNFT(request, env);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.nfts.every(nft => nft.isLegacy)).toBe(true);
    });
  });

  describe('NFT Transfer Operations', () => {
    beforeEach(async () => {
      await env.DB.prepare(`
        INSERT INTO nft_mints (id, pet_id, user_id, solana_mint_address, metadata_r2_key)
        VALUES ('mint-1', 'pet-1', 'user-1', 'MintAddress123', 'metadata.json')
      `).run();
    });

    it('should initiate NFT transfer to another wallet', async () => {
      const request = new Request('http://localhost/api/nft/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: 'MintAddress123',
          fromWallet: 'UserWallet123',
          toWallet: 'RecipientWallet456',
          userId: 'user-1'
        })
      });

      const response = await handleNFT(request, env);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('transfer_initiated');
      expect(data).toHaveProperty('transactionId');
    });

    it('should verify NFT ownership before transfer', async () => {
      const request = new Request('http://localhost/api/nft/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: 'NotOwnedMint',
          fromWallet: 'UserWallet123',
          toWallet: 'RecipientWallet456',
          userId: 'user-1'
        })
      });

      const response = await handleNFT(request, env);
      expect(response.status).toBe(403);
      
      const data = await response.json();
      expect(data.error).toContain('not owned');
    });

    it('should update NFT holder benefits after transfer', async () => {
      // Set user as NFT holder
      await env.DB.prepare(`
        UPDATE users SET nft_holder = true WHERE id = 'user-1'
      `).run();

      const request = new Request('http://localhost/api/nft/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: 'MintAddress123',
          fromWallet: 'UserWallet123',
          toWallet: 'RecipientWallet456',
          userId: 'user-1',
          isLastNFT: true
        })
      });

      const response = await handleNFT(request, env);
      expect(response.status).toBe(200);

      // Verify NFT holder status removed
      const user = await env.DB.prepare('SELECT nft_holder FROM users WHERE id = ?')
        .bind('user-1').first();
      expect(user.nft_holder).toBe(0);
    });
  });

  describe('NFT Marketplace Integration', () => {
    it('should list NFT for sale', async () => {
      await env.DB.prepare(`
        INSERT INTO nft_mints (id, pet_id, user_id, solana_mint_address)
        VALUES ('mint-1', 'pet-1', 'user-1', 'MintForSale123')
      `).run();

      const request = new Request('http://localhost/api/nft/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: 'MintForSale123',
          userId: 'user-1',
          priceInPAWS: 5000,
          priceInUSD: 50
        })
      });

      const response = await handleNFT(request, env);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.listed).toBe(true);
      expect(data.listingId).toBeDefined();
      expect(data.marketplaceUrl).toBeDefined();
    });

    it('should retrieve NFT marketplace listings', async () => {
      const request = new Request('http://localhost/api/nft/marketplace?sort=price_asc', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await handleNFT(request, env);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data.listings)).toBe(true);
      expect(data).toHaveProperty('totalListings');
      expect(data).toHaveProperty('floorPrice');
    });

    it('should handle NFT purchase from marketplace', async () => {
      // Create buyer
      await env.DB.prepare(`
        INSERT INTO users (id, email, paws_balance)
        VALUES ('buyer-1', 'buyer@rawgle.com', 10000)
      `).run();

      const request = new Request('http://localhost/api/nft/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: 'listing-123',
          buyerId: 'buyer-1',
          paymentMethod: 'PAWS'
        })
      });

      const response = await handleNFT(request, env);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.purchased).toBe(true);
      expect(data).toHaveProperty('transactionHash');
    });
  });

  describe('NFT Metadata Updates', () => {
    it('should update NFT metadata for memorial mode', async () => {
      await env.DB.prepare(`
        INSERT INTO nft_mints (id, pet_id, user_id, solana_mint_address, metadata_r2_key)
        VALUES ('mint-1', 'pet-1', 'user-1', 'UpdateableMint', 'metadata/original.json')
      `).run();

      const request = new Request('http://localhost/api/nft/update-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: 'UpdateableMint',
          userId: 'user-1',
          updates: {
            memorialDate: '2024-01-15',
            memorialMessage: 'Forever in our hearts'
          }
        })
      });

      const response = await handleNFT(request, env);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.updated).toBe(true);
      expect(data.newMetadataUri).toBeDefined();
    });

    it('should prevent unauthorized metadata updates', async () => {
      await env.DB.prepare(`
        INSERT INTO users (id, email) VALUES ('other-user', 'other@rawgle.com')
      `).run();

      await env.DB.prepare(`
        INSERT INTO nft_mints (id, pet_id, user_id, solana_mint_address)
        VALUES ('mint-1', 'pet-1', 'user-1', 'ProtectedMint')
      `).run();

      const request = new Request('http://localhost/api/nft/update-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: 'ProtectedMint',
          userId: 'other-user',
          updates: { memorialMessage: 'Unauthorized update' }
        })
      });

      const response = await handleNFT(request, env);
      expect(response.status).toBe(403);
      
      const data = await response.json();
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('NFT Analytics', () => {
    it('should track NFT minting statistics', async () => {
      const request = new Request('http://localhost/api/nft/analytics', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await handleNFT(request, env);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('totalMinted');
      expect(data).toHaveProperty('totalPAWSSpent');
      expect(data).toHaveProperty('averageMintTime');
      expect(data).toHaveProperty('popularBreeds');
      expect(data).toHaveProperty('memorialNFTCount');
    });

    it('should provide user-specific NFT analytics', async () => {
      const request = new Request('http://localhost/api/nft/analytics/user-1', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await handleNFT(request, env);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('nftsOwned');
      expect(data).toHaveProperty('totalValue');
      expect(data).toHaveProperty('rareTraits');
      expect(data).toHaveProperty('collectionRank');
    });
  });
});