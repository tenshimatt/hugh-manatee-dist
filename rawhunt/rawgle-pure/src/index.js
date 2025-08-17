// Main API router - handles all requests
export { AnalyticsDurableObject } from './durable-objects/analytics.js';

import handleAuth from './routes/auth.js';
import handlePets from './routes/pets.js';
import handleFeeding from './routes/feeding.js';
import handlePaws from './routes/paws.js';
import handleAIMedical from './routes/ai-medical.js';
import handleNFT from './routes/nft.js';
import handleStore from './routes/store.js';
import handleAnalytics from './routes/analytics.js';
import handleSubscription from './routes/subscription.js';
import handleTestManagement from './routes/test-management.js';
import { corsHeaders, addSecurityHeaders } from './lib/cors.js';
import { rateLimit } from './lib/rate-limit.js';
import { validateRequest } from './lib/validation.js';
import { logger } from './lib/logger.js';

const routes = {
  '/api/auth': handleAuth,
  '/api/pets': handlePets,
  '/api/feeding': handleFeeding,
  '/api/paws': handlePaws,
  '/api/ai-medical': handleAIMedical,
  '/api/nft': handleNFT,
  '/api/store': handleStore,
  '/api/analytics': handleAnalytics,
  '/api/subscription': handleSubscription,
  '/api/test-management': handleTestManagement,
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      // Health check endpoint
      if (path === '/api/health') {
        return new Response(JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          version: env.API_VERSION || 'v1'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Database health check
      if (path === '/api/health/db') {
        try {
          await env.DB.prepare('SELECT 1').first();
          return new Response(JSON.stringify({ status: 'healthy', database: 'connected' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ status: 'unhealthy', database: 'disconnected' }), {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Rate limiting
      const rateLimitResult = await rateLimit(request, env);
      if (!rateLimitResult.allowed) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Request validation
      const validationResult = await validateRequest(request, env);
      if (!validationResult.valid) {
        return new Response(JSON.stringify({ error: validationResult.error }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Find matching route
      for (const [route, handler] of Object.entries(routes)) {
        if (path.startsWith(route)) {
          try {
            const response = await handler(request, env, ctx);
            
            // Add security headers to response
            const secureResponse = addSecurityHeaders(response);
            
            // Log successful request
            logger.info(`${request.method} ${path} - ${response.status}`, {
              userAgent: request.headers.get('user-agent'),
              ip: request.headers.get('cf-connecting-ip'),
              country: request.headers.get('cf-ipcountry'),
              duration: Date.now() - ctx.startTime
            });
            
            return secureResponse;
          } catch (error) {
            logger.error(`Error in ${route}:`, error);
            
            return new Response(JSON.stringify({ 
              error: 'Internal server error',
              requestId: crypto.randomUUID()
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
      }
      
      // 404 for unmatched routes
      return new Response(JSON.stringify({ error: 'Not Found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      logger.error('Global error handler:', error);
      
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        requestId: crypto.randomUUID()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
  
  // Cron trigger handler
  async scheduled(controller, env, ctx) {
    const cron = controller.cron;
    
    try {
      switch (cron) {
        case "0 1 * * *":
          // Daily reports
          await env.RAWGLE_QUEUE.send({
            type: 'generate_daily_report',
            data: { date: new Date().toISOString() }
          });
          logger.info('Daily report job queued');
          break;
          
        case "0 */6 * * *":
          // Health monitoring batch job
          await env.RAWGLE_QUEUE.send({
            type: 'health_monitoring_batch',
            data: {}
          });
          logger.info('Health monitoring batch job queued');
          break;
          
        case "*/15 * * * *":
          // Process PAWS transactions
          await env.RAWGLE_QUEUE.send({
            type: 'process_paws_queue',
            data: {}
          });
          logger.info('PAWS processing job queued');
          break;
      }
    } catch (error) {
      logger.error('Cron job error:', error);
    }
  },
  
  // Queue consumer
  async queue(batch, env) {
    for (const message of batch.messages) {
      const { type, data } = message.body;
      
      try {
        switch (type) {
          case 'mint_paws':
            await mintPAWSTokens(data.userId, data.amount, env);
            break;
            
          case 'generate_daily_report':
            await generateDailyReport(env);
            break;
            
          case 'process_nft_mint':
            await processNFTMint(data.petId, data.metadata, env);
            break;
            
          case 'health_monitoring_batch':
            await runHealthMonitoringBatch(env);
            break;
            
          case 'process_paws_queue':
            await processPendingPAWSTransactions(env);
            break;
            
          case 'emergency_alert':
            await sendEmergencyAlert(data, env);
            break;
        }
        
        message.ack();
        logger.info(`Queue job completed: ${type}`);
      } catch (error) {
        logger.error(`Queue job failed: ${type}`, error);
        message.retry();
      }
    }
  }
};

// Helper functions
async function mintPAWSTokens(userId, amount, env) {
  logger.info(`Minting ${amount} PAWS for user ${userId}`);
  
  try {
    // Update user balance
    await env.DB.prepare(`
      UPDATE users 
      SET paws_balance = paws_balance + ? 
      WHERE id = ?
    `).bind(amount, userId).run();
    
    // Update transaction status
    await env.DB.prepare(`
      UPDATE paws_transactions 
      SET status = 'completed', processed_at = CURRENT_TIMESTAMP 
      WHERE user_id = ? AND status = 'pending'
    `).bind(userId).run();
    
    logger.info(`Successfully minted ${amount} PAWS for user ${userId}`);
  } catch (error) {
    logger.error(`Failed to mint PAWS for user ${userId}:`, error);
    throw error;
  }
}

async function generateDailyReport(env) {
  try {
    // Get daily metrics
    const metrics = await env.DB.prepare(`
      SELECT * FROM daily_metrics 
      WHERE metric_date = date('now')
    `).first();
    
    if (!metrics) {
      logger.warn('No metrics found for today');
      return;
    }
    
    // Generate AI report
    const aiReport = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      prompt: `Generate executive summary for these daily metrics: ${JSON.stringify(metrics)}`,
      max_tokens: 500
    });
    
    // Store report in R2
    const reportKey = `daily-reports/${new Date().toISOString().split('T')[0]}.json`;
    await env.REPORTS.put(
      reportKey,
      JSON.stringify({ 
        metrics, 
        report: aiReport.response,
        generated_at: new Date().toISOString()
      })
    );
    
    logger.info(`Daily report generated: ${reportKey}`);
  } catch (error) {
    logger.error('Failed to generate daily report:', error);
    throw error;
  }
}

async function processNFTMint(petId, metadata, env) {
  logger.info(`Minting NFT for pet ${petId}`);
  
  try {
    // Simulate Solana NFT minting process
    const mintAddress = `MINT_${crypto.randomUUID().replace(/-/g, '')}`;
    
    // Update NFT record
    await env.DB.prepare(`
      UPDATE nft_mints 
      SET solana_mint_address = ?, processed_at = CURRENT_TIMESTAMP
      WHERE pet_id = ? AND solana_mint_address IS NULL
    `).bind(mintAddress, petId).run();
    
    // Update pet profile
    await env.DB.prepare(`
      UPDATE pet_profiles 
      SET nft_mint_address = ? 
      WHERE id = ?
    `).bind(mintAddress, petId).run();
    
    logger.info(`NFT minted successfully: ${mintAddress}`);
  } catch (error) {
    logger.error(`Failed to mint NFT for pet ${petId}:`, error);
    throw error;
  }
}

async function runHealthMonitoringBatch(env) {
  try {
    const activePets = await env.DB.prepare(`
      SELECT p.*, u.email FROM pet_profiles p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.created_at > datetime('now', '-30 days')
    `).all();
    
    for (const pet of activePets.results) {
      // Queue individual health checks
      await env.RAWGLE_QUEUE.send({
        type: 'health_check_individual',
        data: { petId: pet.id }
      });
    }
    
    logger.info(`Queued health checks for ${activePets.results.length} pets`);
  } catch (error) {
    logger.error('Failed to run health monitoring batch:', error);
    throw error;
  }
}

async function processPendingPAWSTransactions(env) {
  try {
    const pending = await env.DB.prepare(`
      SELECT * FROM paws_transactions 
      WHERE status = 'pending' 
      LIMIT 100
    `).all();
    
    let processed = 0;
    
    for (const transaction of pending.results) {
      try {
        // Simulate blockchain processing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Update status to completed
        await env.DB.prepare(`
          UPDATE paws_transactions 
          SET status = 'completed', processed_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).bind(transaction.id).run();
        
        processed++;
      } catch (error) {
        logger.error(`Failed to process transaction ${transaction.id}:`, error);
      }
    }
    
    logger.info(`Processed ${processed} PAWS transactions`);
  } catch (error) {
    logger.error('Failed to process PAWS transactions:', error);
    throw error;
  }
}

async function sendEmergencyAlert(data, env) {
  try {
    logger.error(`EMERGENCY ALERT: Pet ${data.petId} requires immediate attention`);
    
    // In a real implementation, this would send notifications
    // via email, SMS, push notifications, etc.
    
    // Store emergency alert
    await env.DB.prepare(`
      INSERT INTO emergency_alerts (id, consultation_id, pet_id, alert_type, created_at)
      VALUES (?, ?, ?, 'medical_emergency', CURRENT_TIMESTAMP)
    `).bind(crypto.randomUUID(), data.consultationId, data.petId).run();
    
    logger.info(`Emergency alert processed for pet ${data.petId}`);
  } catch (error) {
    logger.error('Failed to send emergency alert:', error);
    throw error;
  }
}