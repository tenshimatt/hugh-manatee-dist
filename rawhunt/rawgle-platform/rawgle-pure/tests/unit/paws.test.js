import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Miniflare } from 'miniflare';

describe('PAWS Cryptocurrency Routes', () => {
  let mf;
  let env;

  beforeEach(async () => {
    mf = new Miniflare({
      modules: true,
      script: `
        // Simple UUID generation function
        function uuidv4() {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
        
        // Constants
        const EXCHANGE_RATE = 1000;
        const DAILY_LIMIT = 500;
        const RISK_THRESHOLD = 75;
        const SUBSCRIBER_MULTIPLIER = 1.5;
        
        const REWARD_AMOUNTS = {
          profile_completion: 50,
          daily_feeding: 1,
          weekly_consistency: 10,
          monthly_health_report: 100,
          community_engagement: 5,
          nft_holder_bonus: 25
        };
        
        async function getUser(userId, env) {
          return await env.DB.prepare(
            'SELECT * FROM users WHERE id = ?'
          ).bind(userId).first();
        }
        
        async function updateUserBalance(userId, amount, env) {
          await env.DB.prepare(
            'UPDATE users SET paws_balance = paws_balance + ? WHERE id = ?'
          ).bind(amount, userId).run();
        }
        
        async function createTransaction(data, env) {
          const transactionId = uuidv4();
          await env.DB.prepare(\`
            INSERT INTO paws_transactions (id, user_id, amount, transaction_type, description, status, queue_job_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          \`).bind(
            transactionId,
            data.userId,
            data.amount,
            data.type,
            data.description,
            data.status || 'pending',
            data.queueJobId || null
          ).run();
          return transactionId;
        }
        
        async function checkDailyLimit(userId, amount, env) {
          const today = new Date().toDateString();
          const limitKey = \`limit:\${userId}:\${today}\`;
          
          const currentEarnings = await env.RAWGLE_KV.get(limitKey);
          const todaysEarnings = currentEarnings ? parseInt(currentEarnings) : 0;
          
          if (todaysEarnings + amount > DAILY_LIMIT) {
            return {
              allowed: false,
              current: todaysEarnings,
              limit: DAILY_LIMIT,
              requested: amount
            };
          }
          
          await env.RAWGLE_KV.put(limitKey, (todaysEarnings + amount).toString(), {
            expirationTtl: 24 * 60 * 60
          });
          
          return {
            allowed: true,
            current: todaysEarnings + amount,
            limit: DAILY_LIMIT
          };
        }
        
        async function detectBotBehavior(userId, activityData, env) {
          try {
            const prompt = \`Analyze this user activity for bot-like behavior:
User ID: \${userId}
Recent activity: \${JSON.stringify(activityData)}
Time patterns, frequency, and metadata suggest automation?
Return JSON: {"riskScore": 0-100, "reasoning": "explanation"}\`;

            const aiResponse = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
              messages: [
                { role: 'user', content: prompt }
              ]
            });

            const analysis = JSON.parse(aiResponse.response || '{"riskScore": 0, "reasoning": "Analysis failed"}');
            return {
              riskScore: analysis.riskScore || 0,
              reasoning: analysis.reasoning || 'Unknown'
            };
          } catch (error) {
            console.error('AI bot detection failed:', error);
            return { riskScore: 0, reasoning: 'AI detection unavailable' };
          }
        }
        
        async function getBalance(request, env) {
          try {
            const url = new URL(request.url);
            const userId = url.searchParams.get('userId');
            
            if (!userId) {
              return new Response(JSON.stringify({ 
                error: 'userId parameter is required' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const user = await getUser(userId, env);
            if (!user) {
              return new Response(JSON.stringify({ 
                error: 'User not found' 
              }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const exchangeRate = env.PAWS_EXCHANGE_RATE || EXCHANGE_RATE;
            const usdValue = user.paws_balance / exchangeRate;
            
            return new Response(JSON.stringify({
              userId: user.id,
              balance: user.paws_balance,
              exchangeRate: exchangeRate.toString(),
              usdValue: parseFloat(usdValue.toFixed(2))
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error('Balance retrieval error:', error);
            return new Response(JSON.stringify({ 
              error: 'Internal server error' 
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        async function awardReward(request, env) {
          try {
            const body = await request.json();
            const { userId, type, metadata } = body;
            
            if (!userId || !type) {
              return new Response(JSON.stringify({ 
                error: 'userId and type are required' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            if (!REWARD_AMOUNTS.hasOwnProperty(type)) {
              return new Response(JSON.stringify({ 
                error: 'Invalid reward type' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const user = await getUser(userId, env);
            if (!user) {
              return new Response(JSON.stringify({ 
                error: 'User not found' 
              }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            let baseAmount = REWARD_AMOUNTS[type];
            
            let multiplier = 1;
            let subscriberBonus = false;
            if (user.subscription_tier === 'paid' || user.subscription_tier === 'premium') {
              multiplier = SUBSCRIBER_MULTIPLIER;
              subscriberBonus = true;
            }
            
            const finalAmount = Math.round(baseAmount * multiplier);
            
            const limitCheck = await checkDailyLimit(userId, finalAmount, env);
            if (!limitCheck.allowed) {
              return new Response(JSON.stringify({ 
                error: 'Daily limit exceeded',
                current: limitCheck.current,
                limit: limitCheck.limit,
                requested: limitCheck.requested
              }), { 
                status: 429,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const activityData = {
              type,
              timestamp: Date.now(),
              metadata: metadata || {},
              userId
            };
            
            const botAnalysis = await detectBotBehavior(userId, activityData, env);
            if (botAnalysis.riskScore > RISK_THRESHOLD) {
              return new Response(JSON.stringify({ 
                error: 'Suspicious activity detected',
                riskScore: botAnalysis.riskScore,
                reasoning: botAnalysis.reasoning
              }), { 
                status: 429,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const transactionId = await createTransaction({
              userId,
              amount: finalAmount,
              type: 'reward',
              description: \`\${type.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())} reward\`,
              status: 'pending'
            }, env);
            
            await updateUserBalance(userId, finalAmount, env);
            
            const response = {
              transactionId,
              amount: baseAmount,
              status: 'pending'
            };
            
            if (subscriberBonus) {
              response.subscriberBonus = true;
              response.multiplier = multiplier;
              response.totalAwarded = finalAmount;
            }
            
            return new Response(JSON.stringify(response), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error('Reward awarding error:', error);
            return new Response(JSON.stringify({ 
              error: 'Internal server error' 
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        async function transferPaws(request, env) {
          try {
            const body = await request.json();
            const { fromUserId, toUserId, amount, reason } = body;
            
            if (!fromUserId || !toUserId || !amount) {
              return new Response(JSON.stringify({ 
                error: 'fromUserId, toUserId, and amount are required' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            if (amount <= 0) {
              return new Response(JSON.stringify({ 
                error: 'Invalid amount' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            if (fromUserId === toUserId) {
              return new Response(JSON.stringify({ 
                error: 'Cannot transfer to self' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const fromUser = await getUser(fromUserId, env);
            const toUser = await getUser(toUserId, env);
            
            if (!fromUser || !toUser) {
              return new Response(JSON.stringify({ 
                error: 'One or both users not found' 
              }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            if (fromUser.paws_balance < amount) {
              return new Response(JSON.stringify({ 
                error: 'Insufficient balance' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const transactionId = uuidv4();
            
            try {
              await env.DB.prepare(
                'UPDATE users SET paws_balance = paws_balance - ? WHERE id = ?'
              ).bind(amount, fromUserId).run();
              
              await env.DB.prepare(
                'UPDATE users SET paws_balance = paws_balance + ? WHERE id = ?'
              ).bind(amount, toUserId).run();
              
              await createTransaction({
                userId: fromUserId,
                amount: -amount,
                type: 'transfer_out',
                description: \`Transfer to \${toUser.email}: \${reason || 'No reason provided'}\`,
                status: 'completed'
              }, env);
              
              await createTransaction({
                userId: toUserId,
                amount: amount,
                type: 'transfer_in',
                description: \`Transfer from \${fromUser.email}: \${reason || 'No reason provided'}\`,
                status: 'completed'
              }, env);
              
              return new Response(JSON.stringify({
                transactionId,
                transferred: amount,
                fromBalance: fromUser.paws_balance - amount,
                toBalance: toUser.paws_balance + amount
              }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
              
            } catch (dbError) {
              console.error('Transfer database error:', dbError);
              return new Response(JSON.stringify({ 
                error: 'Transfer failed' 
              }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
          } catch (error) {
            console.error('Transfer error:', error);
            return new Response(JSON.stringify({ 
              error: 'Internal server error' 
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        async function mintPaws(request, env) {
          try {
            const body = await request.json();
            const { userId, amount, walletAddress } = body;
            
            const adminToken = request.headers.get('X-Admin-Token');
            const isLargeAmount = amount > 1000;
            
            if (isLargeAmount && (!adminToken || adminToken !== env.ADMIN_TOKEN)) {
              return new Response(JSON.stringify({ 
                error: 'Unauthorized' 
              }), { 
                status: 403,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            if (!userId || !amount || !walletAddress) {
              return new Response(JSON.stringify({ 
                error: 'userId, amount, and walletAddress are required' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const user = await getUser(userId, env);
            if (!user) {
              return new Response(JSON.stringify({ 
                error: 'User not found' 
              }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            const queueJobId = uuidv4();
            
            const transactionId = await createTransaction({
              userId,
              amount,
              type: 'mint',
              description: 'Blockchain minting',
              status: 'queued',
              queueJobId
            }, env);
            
            await env.RAWGLE_QUEUE.send({
              type: 'mint_paws',
              data: {
                userId,
                amount,
                walletAddress,
                transactionId,
                queueJobId
              }
            });
            
            return new Response(JSON.stringify({
              status: 'queued',
              transactionId,
              queueJobId,
              estimatedTime: '3-5 minutes'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error('Minting error:', error);
            return new Response(JSON.stringify({ 
              error: 'Internal server error' 
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        async function getTransactions(request, env) {
          try {
            const url = new URL(request.url);
            const userId = url.searchParams.get('userId');
            const type = url.searchParams.get('type');
            const status = url.searchParams.get('status');
            const limit = parseInt(url.searchParams.get('limit')) || 50;
            const offset = parseInt(url.searchParams.get('offset')) || 0;
            
            if (!userId) {
              return new Response(JSON.stringify({ 
                error: 'userId parameter is required' 
              }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            let query = 'SELECT * FROM paws_transactions WHERE user_id = ?';
            let bindings = [userId];
            
            if (type) {
              query += ' AND transaction_type = ?';
              bindings.push(type);
            }
            
            if (status) {
              query += ' AND status = ?';
              bindings.push(status);
            }
            
            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            bindings.push(limit, offset);
            
            const transactions = await env.DB.prepare(query).bind(...bindings).all();
            
            const totalsQuery = \`
              SELECT 
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_earned,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_spent,
                SUM(amount) as net_balance
              FROM paws_transactions 
              WHERE user_id = ? AND status = 'completed'
            \`;
            
            const totals = await env.DB.prepare(totalsQuery).bind(userId).first();
            
            let countQuery = 'SELECT COUNT(*) as count FROM paws_transactions WHERE user_id = ?';
            let countBindings = [userId];
            
            if (type) {
              countQuery += ' AND transaction_type = ?';
              countBindings.push(type);
            }
            
            if (status) {
              countQuery += ' AND status = ?';
              countBindings.push(status);
            }
            
            const totalCount = await env.DB.prepare(countQuery).bind(...countBindings).first();
            const hasMore = (offset + limit) < totalCount.count;
            
            return new Response(JSON.stringify({
              transactions: transactions.results || [],
              totalEarned: totals.total_earned || 0,
              totalSpent: totals.total_spent || 0,
              netBalance: totals.net_balance || 0,
              hasMore,
              totalCount: totalCount.count
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error('Transaction history error:', error);
            return new Response(JSON.stringify({ 
              error: 'Internal server error' 
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        export default {
          async fetch(request, env, ctx) {
            const url = new URL(request.url);
            const path = url.pathname;
            
            const corsHeaders = {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
            };
            
            if (request.method === 'OPTIONS') {
              return new Response(null, { headers: corsHeaders });
            }
            
            try {
              let response;
              
              if (path.includes('/balance') && request.method === 'GET') {
                response = await getBalance(request, env);
              } else if (path.includes('/reward') && request.method === 'POST') {
                response = await awardReward(request, env);
              } else if (path.includes('/transfer') && request.method === 'POST') {
                response = await transferPaws(request, env);
              } else if (path.includes('/mint') && request.method === 'POST') {
                response = await mintPaws(request, env);
              } else if (path.includes('/transactions') && request.method === 'GET') {
                response = await getTransactions(request, env);
              } else {
                response = new Response(JSON.stringify({ 
                  error: 'Not found',
                  availableEndpoints: [
                    'GET /paws/balance?userId=xxx',
                    'POST /paws/reward',
                    'POST /paws/transfer',
                    'POST /paws/mint',
                    'GET /paws/transactions?userId=xxx'
                  ]
                }), { 
                  status: 404,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
              
              Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
              });
              
              return response;
              
            } catch (error) {
              console.error('PAWS handler error:', error);
              const response = new Response(JSON.stringify({ 
                error: 'Internal server error' 
              }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              });
              
              Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
              });
              
              return response;
            }
          }
        }
      `,
      d1Databases: ['DB'],
      kvNamespaces: ['RAWGLE_KV'],
      queues: ['RAWGLE_QUEUE'],
      ai: true,
      vars: {
        SOLANA_MASTER_WALLET: 'E9mnWdbp97pGaUTGRP743KhppWkYzkagWo7JM3hRJsHA',
        PAWS_EXCHANGE_RATE: '1000'
      }
    });
    
    env = await mf.getBindings();
    
    // Setup test database
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        wallet_address TEXT UNIQUE,
        paws_balance INTEGER DEFAULT 0,
        subscription_tier TEXT DEFAULT 'free',
        nft_holder BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
      
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS paws_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        amount INTEGER NOT NULL,
        transaction_type TEXT,
        description TEXT,
        solana_tx_hash TEXT,
        status TEXT DEFAULT 'pending',
        queue_job_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME
      )
    `).run();

    // Insert test user
    await env.DB.prepare(`
      INSERT INTO users (id, email, wallet_address, paws_balance, subscription_tier)
      VALUES ('test-user-id', 'test@rawgle.com', 'TestWallet123', 5000, 'paid')
    `).run();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PAWS Balance Management', () => {
    it('should retrieve user PAWS balance', async () => {
      const response = await mf.dispatchFetch('http://localhost/api/paws/balance?userId=test-user-id', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.balance).toBe(5000);
      expect(data.userId).toBe('test-user-id');
      expect(data.exchangeRate).toBe('1000');
      expect(data.usdValue).toBe(5);
    });

    it('should handle non-existent user balance query', async () => {
      const response = await mf.dispatchFetch('http://localhost/api/paws/balance?userId=non-existent', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toContain('User not found');
    });
  });

  describe('PAWS Rewards System', () => {
    it('should award PAWS for profile completion', async () => {
      const response = await mf.dispatchFetch('http://localhost/api/paws/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          type: 'profile_completion',
          metadata: { walletAddress: 'TestWallet123' }
        })
      });
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.amount).toBe(50);
      expect(data.status).toBe('pending');
      expect(data).toHaveProperty('transactionId');
    });

    it('should award PAWS for daily feeding logs', async () => {
      const response = await mf.dispatchFetch('http://localhost/api/paws/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          type: 'daily_feeding',
          metadata: { petId: 'pet-123', logCount: 3 }
        })
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.amount).toBe(1);
      expect(data.status).toBe('pending');
    });

    it('should award bonus PAWS for weekly consistency', async () => {
      const request = new Request('http://localhost/api/paws/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          type: 'weekly_consistency',
          metadata: { daysLogged: 7 }
        })
      });

      const response = await mf.dispatchFetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.amount).toBe(10);
    });

    it('should award PAWS for monthly health reports', async () => {
      const request = new Request('http://localhost/api/paws/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          type: 'monthly_health_report',
          metadata: { reportId: 'report-456' }
        })
      });

      const response = await mf.dispatchFetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.amount).toBe(100);
    });

    it('should reject invalid reward types', async () => {
      const request = new Request('http://localhost/api/paws/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          type: 'invalid_type',
          metadata: {}
        })
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Invalid reward type');
    });
  });

  describe('Daily Limits and Anti-Bot Protection', () => {
    it('should enforce daily PAWS earning limits', async () => {
      // Mock KV to simulate reaching daily limit
      await env.RAWGLE_KV.put(`limit:test-user-id:${new Date().toDateString()}`, '499');

      const request = new Request('http://localhost/api/paws/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          type: 'community_engagement',
          metadata: {}
        })
      });

      // This should succeed (499 + 5 = 504, just over limit)
      const response1 = await mf.dispatchFetch(request);
      expect(response1.status).toBe(200);

      // Update limit to exactly 500
      await env.RAWGLE_KV.put(`limit:test-user-id:${new Date().toDateString()}`, '500');

      // This should fail (already at limit)
      const response2 = await mf.dispatchFetch(request);
      expect(response2.status).toBe(429);
      
      const data = await response2.json();
      expect(data.error).toContain('Daily limit exceeded');
    });

    it('should detect bot-like behavior patterns', async () => {
      // Mock AI to return high risk score
      vi.spyOn(env.AI, 'run').mockResolvedValueOnce({
        response: JSON.stringify({ riskScore: 85, reasoning: 'Rapid repeated actions' })
      });

      const request = new Request('http://localhost/api/paws/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          type: 'daily_feeding',
          metadata: { timestamp: Date.now() }
        })
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(429);
      
      const data = await response.json();
      expect(data.error).toContain('Suspicious activity');
    });

    it('should allow legitimate rapid actions with low risk', async () => {
      // Mock AI to return low risk score
      vi.spyOn(env.AI, 'run').mockResolvedValueOnce({
        response: JSON.stringify({ riskScore: 15, reasoning: 'Normal user behavior' })
      });

      const request = new Request('http://localhost/api/paws/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          type: 'daily_feeding',
          metadata: {}
        })
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(200);
    });

    it('should reset daily limits at midnight', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Set yesterday's limit
      await env.RAWGLE_KV.put(`limit:test-user-id:${yesterday.toDateString()}`, '500');

      // Today's request should work
      const request = new Request('http://localhost/api/paws/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          type: 'daily_feeding',
          metadata: {}
        })
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(200);
    });
  });

  describe('PAWS Transfer Operations', () => {
    beforeEach(async () => {
      // Create recipient user
      await env.DB.prepare(`
        INSERT INTO users (id, email, wallet_address, paws_balance)
        VALUES ('recipient-id', 'recipient@rawgle.com', 'RecipientWallet456', 1000)
      `).run();
    });

    it('should transfer PAWS between users', async () => {
      const request = new Request('http://localhost/api/paws/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: 'test-user-id',
          toUserId: 'recipient-id',
          amount: 500,
          reason: 'Gift to friend'
        })
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.transferred).toBe(500);
      expect(data).toHaveProperty('transactionId');

      // Verify balances updated
      const sender = await env.DB.prepare('SELECT paws_balance FROM users WHERE id = ?')
        .bind('test-user-id').first();
      const recipient = await env.DB.prepare('SELECT paws_balance FROM users WHERE id = ?')
        .bind('recipient-id').first();

      expect(sender.paws_balance).toBe(4500);
      expect(recipient.paws_balance).toBe(1500);
    });

    it('should prevent transfer with insufficient balance', async () => {
      const request = new Request('http://localhost/api/paws/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: 'test-user-id',
          toUserId: 'recipient-id',
          amount: 10000,
          reason: 'Too much'
        })
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Insufficient balance');
    });

    it('should prevent negative transfers', async () => {
      const request = new Request('http://localhost/api/paws/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: 'test-user-id',
          toUserId: 'recipient-id',
          amount: -100,
          reason: 'Invalid'
        })
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Invalid amount');
    });

    it('should prevent self-transfers', async () => {
      const request = new Request('http://localhost/api/paws/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: 'test-user-id',
          toUserId: 'test-user-id',
          amount: 100,
          reason: 'Self transfer'
        })
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Cannot transfer to self');
    });
  });

  describe('PAWS Minting Operations', () => {
    it('should queue PAWS minting for blockchain processing', async () => {
      const queueSpy = vi.spyOn(env.RAWGLE_QUEUE, 'send');

      const request = new Request('http://localhost/api/paws/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          amount: 1000,
          walletAddress: 'TestWallet123'
        })
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('queued');
      expect(data.estimatedTime).toContain('minutes');

      expect(queueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'mint_paws',
          data: expect.objectContaining({
            userId: 'test-user-id',
            amount: 1000,
            walletAddress: 'TestWallet123'
          })
        })
      );
    });

    it('should require admin privileges for manual minting', async () => {
      const request = new Request('http://localhost/api/paws/mint', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Admin-Token': 'invalid-token'
        },
        body: JSON.stringify({
          userId: 'test-user-id',
          amount: 10000,
          walletAddress: 'TestWallet123'
        })
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(403);
      
      const data = await response.json();
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('Transaction History', () => {
    beforeEach(async () => {
      // Create transaction history
      const transactions = [
        { id: 'tx-1', user_id: 'test-user-id', amount: 100, transaction_type: 'reward', description: 'Daily login', status: 'completed', solana_tx_hash: 'hash1' },
        { id: 'tx-2', user_id: 'test-user-id', amount: -50, transaction_type: 'purchase', description: 'Store purchase', status: 'completed', solana_tx_hash: 'hash2' },
        { id: 'tx-3', user_id: 'test-user-id', amount: 200, transaction_type: 'reward', description: 'Weekly bonus', status: 'pending', solana_tx_hash: null }
      ];

      for (const tx of transactions) {
        await env.DB.prepare(`
          INSERT INTO paws_transactions (id, user_id, amount, transaction_type, description, status, solana_tx_hash)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(tx.id, tx.user_id, tx.amount, tx.transaction_type, tx.description, tx.status, tx.solana_tx_hash).run();
      }
    });

    it('should retrieve user transaction history', async () => {
      const request = new Request('http://localhost/api/paws/transactions?userId=test-user-id', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await mf.dispatchFetch(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data.transactions)).toBe(true);
      expect(data.transactions).toHaveLength(3);
      expect(data.totalEarned).toBe(300);
      expect(data.totalSpent).toBe(50);
      expect(data.netBalance).toBe(250);
    });

    it('should filter transactions by type', async () => {
      const request = new Request('http://localhost/api/paws/transactions?userId=test-user-id&type=reward', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await mf.dispatchFetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transactions).toHaveLength(2);
      expect(data.transactions.every(tx => tx.transaction_type === 'reward')).toBe(true);
    });

    it('should filter transactions by status', async () => {
      const request = new Request('http://localhost/api/paws/transactions?userId=test-user-id&status=completed', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await mf.dispatchFetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transactions).toHaveLength(2);
      expect(data.transactions.every(tx => tx.status === 'completed')).toBe(true);
    });

    it('should paginate transaction history', async () => {
      const request = new Request('http://localhost/api/paws/transactions?userId=test-user-id&limit=2&offset=0', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await mf.dispatchFetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transactions).toHaveLength(2);
      expect(data.hasMore).toBe(true);
    });
  });

  describe('Subscription Benefits', () => {
    it('should apply subscriber multipliers to rewards', async () => {
      const request = new Request('http://localhost/api/paws/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id', // paid subscriber
          type: 'community_engagement',
          metadata: {}
        })
      });

      const response = await mf.dispatchFetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.amount).toBe(5); // Base amount
      expect(data.subscriberBonus).toBe(true);
      expect(data.multiplier).toBe(1.5);
      expect(data.totalAwarded).toBe(7); // 5 * 1.5 rounded
    });

    it('should not apply multipliers to free users', async () => {
      // Create free user
      await env.DB.prepare(`
        INSERT INTO users (id, email, paws_balance, subscription_tier)
        VALUES ('free-user', 'free@rawgle.com', 0, 'free')
      `).run();

      const request = new Request('http://localhost/api/paws/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'free-user',
          type: 'community_engagement',
          metadata: {}
        })
      });

      const response = await mf.dispatchFetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.amount).toBe(5);
      expect(data.subscriberBonus).toBe(false);
      expect(data.multiplier).toBe(1);
    });
  });
});