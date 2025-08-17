import { validateEmail, sanitizeInput } from '../lib/validation.js';
import { v4 as uuidv4 } from 'uuid';

// Constants
const EXCHANGE_RATE = 1000; // 1000 PAWS = 1 token
const DAILY_LIMIT = 500; // 500 PAWS per day
const RISK_THRESHOLD = 75; // AI risk score threshold for bot detection
const SUBSCRIBER_MULTIPLIER = 1.5; // Multiplier for paid subscribers

// Reward amounts by type
const REWARD_AMOUNTS = {
  profile_completion: 50,
  daily_feeding: 1,
  weekly_consistency: 10,
  monthly_health_report: 100,
  community_engagement: 5,
  nft_holder_bonus: 25
};

// Helper function to get user from database
async function getUser(userId, env) {
  return await env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(userId).first();
}

// Helper function to update user balance
async function updateUserBalance(userId, amount, env) {
  await env.DB.prepare(
    'UPDATE users SET paws_balance = paws_balance + ? WHERE id = ?'
  ).bind(amount, userId).run();
}

// Helper function to create transaction record
async function createTransaction(data, env) {
  const transactionId = uuidv4();
  await env.DB.prepare(`
    INSERT INTO paws_transactions (id, user_id, amount, transaction_type, description, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    transactionId,
    data.userId,
    data.amount,
    data.type,
    data.description,
    data.status || 'completed'
  ).run();
  return transactionId;
}

// Check daily earning limits using database
async function checkDailyLimit(userId, amount, env) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Get today's earnings from database
  const todaysEarnings = await env.DB.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total_earned 
    FROM paws_transactions 
    WHERE user_id = ? 
    AND transaction_type = 'reward' 
    AND status = 'completed' 
    AND date(created_at) = date(?)
  `).bind(userId, today).first();
  
  const currentTotal = todaysEarnings.total_earned || 0;
  
  if (currentTotal + amount > DAILY_LIMIT) {
    return {
      allowed: false,
      current: currentTotal,
      limit: DAILY_LIMIT,
      requested: amount
    };
  }
  
  return {
    allowed: true,
    current: currentTotal + amount,
    limit: DAILY_LIMIT
  };
}

// AI-powered bot detection
async function detectBotBehavior(userId, activityData, env) {
  try {
    const prompt = `Analyze this user activity for bot-like behavior:
User ID: ${userId}
Recent activity: ${JSON.stringify(activityData)}
Time patterns, frequency, and metadata suggest automation?
Return JSON: {"riskScore": 0-100, "reasoning": "explanation"}`;

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

// Get PAWS balance
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

// Award PAWS rewards
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
    
    // Validate reward type
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
    
    // Apply subscriber multiplier
    let multiplier = 1;
    let subscriberBonus = false;
    if (user.subscription_tier === 'paid' || user.subscription_tier === 'premium') {
      multiplier = SUBSCRIBER_MULTIPLIER;
      subscriberBonus = true;
    }
    
    const finalAmount = Math.round(baseAmount * multiplier);
    
    // Check daily limits
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
    
    // AI bot detection for suspicious patterns
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
    
    // Create transaction record
    const transactionId = await createTransaction({
      userId,
      amount: finalAmount,
      type: 'reward',
      description: `${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} reward`,
      status: 'completed'
    }, env);
    
    // Update user balance
    await updateUserBalance(userId, finalAmount, env);
    
    const response = {
      transactionId,
      amount: baseAmount,
      status: 'completed'
    };
    
    // Add subscriber bonus info if applicable
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

// Transfer PAWS between users
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
    
    // Begin transaction
    const transactionId = uuidv4();
    
    try {
      // Deduct from sender
      await env.DB.prepare(
        'UPDATE users SET paws_balance = paws_balance - ? WHERE id = ?'
      ).bind(amount, fromUserId).run();
      
      // Add to recipient
      await env.DB.prepare(
        'UPDATE users SET paws_balance = paws_balance + ? WHERE id = ?'
      ).bind(amount, toUserId).run();
      
      // Record transactions for both users
      await createTransaction({
        userId: fromUserId,
        amount: -amount,
        type: 'transfer_out',
        description: `Transfer to ${toUser.email}: ${reason || 'No reason provided'}`,
        status: 'completed'
      }, env);
      
      await createTransaction({
        userId: toUserId,
        amount: amount,
        type: 'transfer_in',
        description: `Transfer from ${fromUser.email}: ${reason || 'No reason provided'}`,
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

// Mint PAWS to blockchain (simplified without queue)
async function mintPaws(request, env) {
  try {
    const body = await request.json();
    const { userId, amount, walletAddress } = body;
    
    // Check for admin privileges for large amounts
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
    
    if (user.paws_balance < amount) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient balance' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Simulate blockchain minting (immediate processing)
    const mockTxHash = `SOL_${crypto.randomUUID().replace(/-/g, '')}`;
    
    // Deduct from user balance
    await env.DB.prepare(
      'UPDATE users SET paws_balance = paws_balance - ? WHERE id = ?'
    ).bind(amount, userId).run();
    
    // Create transaction record
    const transactionId = await createTransaction({
      userId,
      amount: -amount, // Negative because it's being spent
      type: 'mint',
      description: `Blockchain minting to ${walletAddress}`,
      status: 'completed'
    }, env);
    
    // Update the transaction with Solana tx hash
    await env.DB.prepare(
      'UPDATE paws_transactions SET solana_tx_hash = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(mockTxHash, transactionId).run();
    
    return new Response(JSON.stringify({
      status: 'completed',
      transactionId,
      solanaTransactionHash: mockTxHash,
      mintedAmount: amount,
      walletAddress,
      remainingBalance: user.paws_balance - amount
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

// Get transaction history
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
    
    // Calculate totals
    const totalsQuery = `
      SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_earned,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_spent,
        SUM(amount) as net_balance
      FROM paws_transactions 
      WHERE user_id = ? AND status = 'completed'
    `;
    
    const totals = await env.DB.prepare(totalsQuery).bind(userId).first();
    
    // Check if there are more transactions
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

// Main handler
export default async function handlePaws(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Add CORS headers
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
    
    // Add CORS headers to response
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
