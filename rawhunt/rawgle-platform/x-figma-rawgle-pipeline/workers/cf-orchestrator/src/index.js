// cf-orchestrator.js - Cloudflare-native pipeline orchestration (replaces n8n)
// Uses Durable Objects for stateful workflow management

export { PipelineOrchestrator } from './pipeline-orchestrator.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle webhook triggers (like n8n)
    if (url.pathname === '/webhook/figma-import' && request.method === 'POST') {
      return await this.triggerPipeline(request, env);
    }
    
    // Handle workflow status checks
    if (url.pathname.startsWith('/status/')) {
      const workflowId = url.pathname.split('/')[2];
      return await this.getWorkflowStatus(workflowId, env);
    }
    
    // Handle manual workflow triggers
    if (url.pathname === '/trigger' && request.method === 'POST') {
      return await this.triggerPipeline(request, env);
    }
    
    return new Response('Cloudflare Pipeline Orchestrator', { status: 200 });
  },

  async triggerPipeline(request, env) {
    try {
      const payload = await request.json();
      const workflowId = crypto.randomUUID();
      
      // Get Durable Object instance for this workflow
      const id = env.PIPELINE_ORCHESTRATOR.idFromName(workflowId);
      const orchestrator = env.PIPELINE_ORCHESTRATOR.get(id);
      
      // Start the pipeline
      const response = await orchestrator.fetch(request.url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'start',
          workflowId,
          payload
        })
      });
      
      return new Response(JSON.stringify({
        success: true,
        workflowId,
        status: 'started',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  async getWorkflowStatus(workflowId, env) {
    try {
      const id = env.PIPELINE_ORCHESTRATOR.idFromName(workflowId);
      const orchestrator = env.PIPELINE_ORCHESTRATOR.get(id);
      
      const response = await orchestrator.fetch(request.url, {
        method: 'GET'
      });
      
      return response;
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Workflow not found'
      }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
