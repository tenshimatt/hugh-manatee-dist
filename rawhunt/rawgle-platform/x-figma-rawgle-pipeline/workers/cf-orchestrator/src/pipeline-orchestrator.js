// pipeline-orchestrator.js - Durable Object for managing pipeline workflows

export class PipelineOrchestrator {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    if (request.method === 'POST') {
      const data = await request.json();
      
      if (data.action === 'start') {
        return await this.startPipeline(data);
      }
    }
    
    if (request.method === 'GET') {
      return await this.getStatus();
    }
    
    return new Response('Pipeline Orchestrator DO', { status: 200 });
  }

  async startPipeline(data) {
    const { workflowId, payload } = data;
    
    // Store initial workflow state
    const workflow = {
      id: workflowId,
      status: 'running',
      stages: {
        figmaExtract: { status: 'pending', startTime: null, endTime: null },
        reactTransform: { status: 'pending', startTime: null, endTime: null },
        rawgleDeploy: { status: 'pending', startTime: null, endTime: null },
        generateReport: { status: 'pending', startTime: null, endTime: null }
      },
      payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await this.state.storage.put('workflow', workflow);
    
    // Start the pipeline execution
    this.executePipeline(workflow);
    
    return new Response(JSON.stringify({
      success: true,
      workflowId,
      status: 'started'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async executePipeline(workflow) {
    try {
      // Stage 1: Extract Figma Data
      await this.updateStageStatus('figmaExtract', 'running');
      const figmaData = await this.callFigmaExtractor(workflow.payload);
      await this.updateStageStatus('figmaExtract', 'completed', { data: figmaData });

      // Stage 2: Transform to React
      await this.updateStageStatus('reactTransform', 'running');
      const reactComponents = await this.callReactTransformer(figmaData);
      await this.updateStageStatus('reactTransform', 'completed', { data: reactComponents });

      // Stage 3: Deploy to Rawgle
      await this.updateStageStatus('rawgleDeploy', 'running');
      const deployment = await this.callRawgleDeployer(reactComponents);
      await this.updateStageStatus('rawgleDeploy', 'completed', { data: deployment });

      // Stage 4: Generate Report
      await this.updateStageStatus('generateReport', 'running');
      const report = await this.callGptReporter(deployment, figmaData);
      await this.updateStageStatus('generateReport', 'completed', { data: report });

      // Update overall workflow status
      const updatedWorkflow = await this.state.storage.get('workflow');
      updatedWorkflow.status = 'completed';
      updatedWorkflow.completedAt = new Date().toISOString();
      await this.state.storage.put('workflow', updatedWorkflow);

      // Send notification (Slack, etc.)
      await this.sendNotification('success', deployment, report);

    } catch (error) {
      // Mark workflow as failed
      const workflow = await this.state.storage.get('workflow');
      workflow.status = 'failed';
      workflow.error = error.message;
      workflow.failedAt = new Date().toISOString();
      await this.state.storage.put('workflow', workflow);

      // Send error notification
      await this.sendNotification('error', null, null, error);
    }
  }

  async updateStageStatus(stageName, status, result = null) {
    const workflow = await this.state.storage.get('workflow');
    
    workflow.stages[stageName].status = status;
    workflow.updatedAt = new Date().toISOString();
    
    if (status === 'running') {
      workflow.stages[stageName].startTime = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      workflow.stages[stageName].endTime = new Date().toISOString();
      if (result) {
        workflow.stages[stageName].result = result;
      }
    }
    
    await this.state.storage.put('workflow', workflow);
  }

  async callFigmaExtractor(payload) {
    const response = await fetch(`https://figma-extractor.${this.env.CUSTOM_DOMAIN}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Figma extraction failed: ${response.status}`);
    }
    
    return await response.json();
  }

  async callReactTransformer(figmaData) {
    const response = await fetch(`https://react-transformer.${this.env.CUSTOM_DOMAIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: figmaData.fileKey,
        components: figmaData.components
      })
    });
    
    if (!response.ok) {
      throw new Error(`React transformation failed: ${response.status}`);
    }
    
    return await response.json();
  }

  async callRawgleDeployer(reactComponents) {
    const response = await fetch(`https://rawgle-deployer.${this.env.CUSTOM_DOMAIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: reactComponents.templateId,
        reactComponents: reactComponents.components
      })
    });
    
    if (!response.ok) {
      throw new Error(`Rawgle deployment failed: ${response.status}`);
    }
    
    return await response.json();
  }

  async callGptReporter(deployment, template) {
    const response = await fetch(`https://gpt-reporter.${this.env.CUSTOM_DOMAIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment,
        template
      })
    });
    
    if (!response.ok) {
      throw new Error(`Report generation failed: ${response.status}`);
    }
    
    return await response.json();
  }

  async sendNotification(type, deployment, report, error = null) {
    if (!this.env.SLACK_WEBHOOK_URL) return;
    
    let message;
    if (type === 'success') {
      message = `🚀 Pipeline completed successfully!\n📊 Report: ${report?.reportUrl}\n🔗 Live URL: ${deployment?.deploymentUrl}`;
    } else {
      message = `❌ Pipeline failed: ${error?.message}`;
    }
    
    await fetch(this.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
  }

  async getStatus() {
    const workflow = await this.state.storage.get('workflow');
    
    if (!workflow) {
      return new Response(JSON.stringify({ error: 'Workflow not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(workflow), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
