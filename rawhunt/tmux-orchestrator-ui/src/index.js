// Tmux Orchestrator UI - Cloudflare Worker
// Complete visual configuration system for tmux orchestration

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Routes
    if (url.pathname === '/') {
      return new Response(getMainUI(), {
        headers: { 
          'Content-Type': 'text/html',
          ...corsHeaders 
        }
      });
    }
    
    if (url.pathname === '/api/generate' && request.method === 'POST') {
      const config = await request.json();
      const scripts = generateTmuxScripts(config);
      return new Response(JSON.stringify(scripts), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
    
    // Automated setup endpoint for Claude Code agents
    if (url.pathname.startsWith('/api/setup/') && request.method === 'GET') {
      const sessionName = url.pathname.split('/api/setup/')[1];
      const setupScript = generateAutomatedSetup(sessionName);
      return new Response(setupScript, {
        headers: { 
          'Content-Type': 'text/plain',
          ...corsHeaders 
        }
      });
    }
    
    // Configuration endpoint for Claude Code agents  
    if (url.pathname.startsWith('/api/config/') && request.method === 'GET') {
      const sessionName = url.pathname.split('/api/config/')[1];
      const config = getStoredConfig(sessionName);
      return new Response(JSON.stringify(config || { error: 'Configuration not found' }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
    
    // Store configuration endpoint
    if (url.pathname === '/api/store-config' && request.method === 'POST') {
      const { sessionName, config } = await request.json();
      storeConfig(sessionName, config);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
    
    // Agent-specific setup commands
    if (url.pathname === '/api/agent-setup' && request.method === 'POST') {
      const config = await request.json();
      const agentCommands = generateAgentSetupCommands(config);
      return new Response(JSON.stringify(agentCommands), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
    
    if (url.pathname === '/api/codebase-analysis' && request.method === 'POST') {
      const projectData = await request.json();
      const analysis = analyzeCodebase(projectData);
      return new Response(JSON.stringify(analysis), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
    
    // Real codebase analysis with file data
    if (url.pathname === '/api/analyze-files' && request.method === 'POST') {
      const { projectData, fileList, packageJson, readmeContent } = await request.json();
      const analysis = analyzeRealCodebase(projectData, fileList, packageJson, readmeContent);
      return new Response(JSON.stringify(analysis), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
    
    if (url.pathname === '/api/analyze' && request.method === 'POST') {
      const projectData = await request.json();
      const analysis = analyzeProject(projectData);
      return new Response(JSON.stringify(analysis), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
    
    if (url.pathname === '/api/templates') {
      return new Response(JSON.stringify(getProjectTemplates()), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

function getMainUI() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tmux Orchestrator UI - System Architect</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --bg-primary: #0a0e27;
            --bg-secondary: #1a1f3a;
            --bg-tertiary: #2a2f4a;
            --text-primary: #e0e6ed;
            --text-secondary: #a8b2d1;
            --accent-blue: #64b5f6;
            --accent-green: #81c784;
            --accent-orange: #ffb74d;
            --accent-red: #e57373;
            --border: #3a3f5a;
            --shadow: rgba(0, 0, 0, 0.3);
        }
        
        body {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
            color: var(--text-primary);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: var(--bg-secondary);
            border-radius: 15px;
            border: 1px solid var(--border);
            box-shadow: 0 10px 30px var(--shadow);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(135deg, var(--accent-blue), var(--accent-green));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .header p {
            color: var(--text-secondary);
            font-size: 1.1em;
        }
        
        .wizard-container {
            display: grid;
            grid-template-columns: 300px 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .step-indicator {
            background: var(--bg-secondary);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid var(--border);
            height: fit-content;
            position: sticky;
            top: 20px;
        }
        
        .step {
            display: flex;
            align-items: center;
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .step.active {
            background: var(--bg-tertiary);
            border-left: 3px solid var(--accent-blue);
        }
        
        .step.completed {
            opacity: 0.7;
        }
        
        .step-number {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: var(--bg-tertiary);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            font-weight: bold;
        }
        
        .step.active .step-number {
            background: var(--accent-blue);
            color: var(--bg-primary);
        }
        
        .step.completed .step-number {
            background: var(--accent-green);
            color: var(--bg-primary);
        }
        
        .wizard-content {
            background: var(--bg-secondary);
            border-radius: 15px;
            padding: 30px;
            border: 1px solid var(--border);
            min-height: 600px;
        }
        
        .step-content {
            display: none;
            animation: fadeIn 0.5s ease;
        }
        
        .step-content.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .project-type-selector {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .project-type-card {
            background: var(--bg-tertiary);
            border: 2px solid var(--border);
            border-radius: 12px;
            padding: 30px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
        }
        
        .project-type-card:hover {
            border-color: var(--accent-blue);
            transform: translateY(-5px);
            box-shadow: 0 10px 30px var(--shadow);
        }
        
        .project-type-card.selected {
            border-color: var(--accent-green);
            background: rgba(129, 199, 132, 0.1);
        }
        
        .project-type-card .icon {
            font-size: 3em;
            margin-bottom: 15px;
        }
        
        .project-type-card h3 {
            font-size: 1.5em;
            margin-bottom: 10px;
            color: var(--text-primary);
        }
        
        .project-type-card p {
            color: var(--text-secondary);
            line-height: 1.6;
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: var(--text-primary);
            font-weight: bold;
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 12px;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text-primary);
            font-family: inherit;
            transition: all 0.3s ease;
        }
        
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: var(--accent-blue);
            box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.1);
        }
        
        .form-group textarea {
            min-height: 120px;
            resize: vertical;
        }
        
        .agent-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .agent-card {
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .agent-card:hover {
            border-color: var(--accent-blue);
            transform: scale(1.02);
        }
        
        .agent-card.selected {
            border-color: var(--accent-green);
            background: rgba(129, 199, 132, 0.1);
        }
        
        .agent-card h4 {
            margin-bottom: 8px;
            color: var(--accent-blue);
        }
        
        .agent-card p {
            color: var(--text-secondary);
            font-size: 0.9em;
            line-height: 1.4;
        }
        
        .tmux-designer {
            background: var(--bg-tertiary);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .tmux-preview {
            background: #000;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 20px;
            min-height: 300px;
            font-family: 'Monaco', monospace;
            position: relative;
        }
        
        .tmux-window {
            background: #111;
            border: 1px solid #444;
            border-radius: 4px;
            margin-bottom: 10px;
            overflow: hidden;
        }
        
        .tmux-window-header {
            background: #222;
            padding: 5px 10px;
            border-bottom: 1px solid #444;
            font-size: 0.9em;
            color: var(--accent-green);
        }
        
        .tmux-panes {
            display: flex;
            min-height: 150px;
        }
        
        .tmux-pane {
            flex: 1;
            padding: 10px;
            border-right: 1px solid #444;
            color: #0f0;
            font-size: 0.85em;
        }
        
        .tmux-pane:last-child {
            border-right: none;
        }
        
        .layout-selector {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .layout-option {
            aspect-ratio: 1;
            background: var(--bg-primary);
            border: 2px solid var(--border);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        
        .layout-option:hover {
            border-color: var(--accent-blue);
        }
        
        .layout-option.selected {
            border-color: var(--accent-green);
        }
        
        .layout-visual {
            width: 80%;
            height: 80%;
            display: flex;
            gap: 2px;
        }
        
        .layout-visual-pane {
            background: var(--accent-blue);
            opacity: 0.5;
            border-radius: 2px;
        }
        
        .git-settings {
            background: var(--bg-tertiary);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .checkbox-group {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .checkbox-group input[type="checkbox"] {
            width: auto;
            margin-right: 10px;
        }
        
        .checkbox-group label {
            margin-bottom: 0;
            cursor: pointer;
        }
        
        .button-group {
            display: flex;
            gap: 15px;
            justify-content: flex-end;
            margin-top: 30px;
        }
        
        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, var(--accent-blue), var(--accent-green));
            color: var(--bg-primary);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(100, 181, 246, 0.3);
        }
        
        .btn-secondary {
            background: var(--bg-tertiary);
            color: var(--text-primary);
            border: 1px solid var(--border);
        }
        
        .btn-secondary:hover {
            background: var(--bg-primary);
        }
        
        .output-container {
            display: none;
            margin-top: 30px;
        }
        
        .output-container.show {
            display: block;
        }
        
        .output-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 2px solid var(--border);
        }
        
        .output-tab {
            padding: 10px 20px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
        }
        
        .output-tab.active {
            color: var(--accent-blue);
            border-bottom: 2px solid var(--accent-blue);
            margin-bottom: -2px;
        }
        
        .output-content {
            background: var(--bg-tertiary);
            border-radius: 10px;
            padding: 20px;
            max-height: 500px;
            overflow-y: auto;
        }
        
        .output-section {
            display: none;
        }
        
        .output-section.active {
            display: block;
        }
        
        pre {
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 15px;
            overflow-x: auto;
            color: var(--accent-green);
            font-size: 0.9em;
            line-height: 1.5;
        }
        
        .copy-btn {
            float: right;
            padding: 5px 10px;
            background: var(--accent-blue);
            border: none;
            border-radius: 4px;
            color: var(--bg-primary);
            cursor: pointer;
            font-size: 0.85em;
            margin-bottom: 10px;
        }
        
        .copy-btn:hover {
            background: var(--accent-green);
        }
        
        .spinner {
            display: none;
            width: 40px;
            height: 40px;
            border: 4px solid var(--border);
            border-top: 4px solid var(--accent-blue);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        
        .spinner.show {
            display: block;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .error-message {
            background: rgba(229, 115, 115, 0.1);
            border: 1px solid var(--accent-red);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            color: var(--accent-red);
            display: none;
        }
        
        .error-message.show {
            display: block;
        }
        
        .success-message {
            background: rgba(129, 199, 132, 0.1);
            border: 1px solid var(--accent-green);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            color: var(--accent-green);
            display: none;
        }
        
        .success-message.show {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 Tmux Orchestrator UI</h1>
            <p>System Architect for Multi-Agent Development Environments</p>
        </div>
        
        <div class="wizard-container">
            <div class="step-indicator">
                <div class="step active" data-step="1">
                    <div class="step-number">1</div>
                    <div>Project Type</div>
                </div>
                <div class="step" data-step="2">
                    <div class="step-number">2</div>
                    <div>Project Details</div>
                </div>
                <div class="step" data-step="3">
                    <div class="step-number">3</div>
                    <div>Codebase Analysis</div>
                </div>
                <div class="step" data-step="4">
                    <div class="step-number">4</div>
                    <div>Team Selection</div>
                </div>
                <div class="step" data-step="5">
                    <div class="step-number">5</div>
                    <div>Tmux Design</div>
                </div>
                <div class="step" data-step="6">
                    <div class="step-number">6</div>
                    <div>Git & Workflow</div>
                </div>
                <div class="step" data-step="7">
                    <div class="step-number">7</div>
                    <div>Generate</div>
                </div>
            </div>
            
            <div class="wizard-content">
                <div class="error-message" id="errorMessage"></div>
                <div class="success-message" id="successMessage"></div>
                
                <!-- Step 1: Project Type -->
                <div class="step-content active" data-step="1">
                    <h2>Select Project Type</h2>
                    <p style="margin-bottom: 30px; color: var(--text-secondary);">
                        Choose whether you're fixing an existing project or starting a new one
                    </p>
                    
                    <div class="project-type-selector">
                        <div class="project-type-card" data-type="fix">
                            <div class="icon">🔧</div>
                            <h3>Fix Project</h3>
                            <p>Debug, refactor, or enhance an existing codebase with specialized fix agents</p>
                        </div>
                        <div class="project-type-card" data-type="new">
                            <div class="icon">🚀</div>
                            <h3>New Project</h3>
                            <p>Start fresh with a complete development team for greenfield projects</p>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Project Path</label>
                        <input type="text" id="projectPath" placeholder="/Users/mattwright/pandora/rawhunt" />
                    </div>
                </div>
                
                <!-- Step 2: Project Details -->
                <div class="step-content" data-step="2">
                    <h2>Project Details</h2>
                    
                    <div class="form-group">
                        <label>Project Name</label>
                        <input type="text" id="projectName" placeholder="rawgle-platform" />
                    </div>
                    
                    <div class="form-group">
                        <label>Project Goal</label>
                        <textarea id="projectGoal" placeholder="Fix search functionality to properly filter 9000+ suppliers when users search for locations like 'chicago'"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Constraints (one per line)</label>
                        <textarea id="constraints" placeholder="Use existing database schema
Follow current code patterns
Maintain 65% test coverage
Commit every 30 minutes"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Deliverables (one per line)</label>
                        <textarea id="deliverables" placeholder="Working search that filters by location
Fixed API endpoint integration
Comprehensive test suite
Documentation updates"></textarea>
                    </div>
                </div>
                
                <!-- Step 3: Codebase Analysis -->
                <div class="step-content" data-step="3">
                    <h2 id="analysisStepTitle">Codebase Analysis</h2>
                    <p id="analysisStepDescription" style="margin-bottom: 20px; color: var(--text-secondary);">
                        Analyzing your project structure to understand the codebase and requirements
                    </p>
                    
                    <div class="codebase-analysis-container" id="codebaseAnalysisContainer">
                        <div class="analysis-status" id="codebaseAnalysisStatus">
                            <div class="spinner show" style="margin: 0 auto 20px;"></div>
                            <p id="analysisStatusText">Scanning project directory...</p>
                        </div>
                        
                        <div class="analysis-results" id="codebaseAnalysisResults" style="display: none;">
                            <div class="codebase-summary" id="codebaseSummary">
                                <!-- Will be populated by analysis -->
                            </div>
                            
                            <div class="recommendations-section" id="recommendationsSection">
                                <!-- Will show recommendations based on project type -->
                            </div>
                            
                            <div class="tech-stack-analysis" id="techStackAnalysis">
                                <!-- Will show technical analysis -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Step 4: Team Selection (formerly Step 3) -->
                <div class="step-content" data-step="4">
                    <h2>AI Team Selection</h2>
                    <p style="margin-bottom: 20px; color: var(--text-secondary);">
                        Based on the codebase analysis, our AI is selecting the optimal team composition
                    </p>
                    
                    <div class="analysis-container" id="analysisContainer">
                        <div class="analysis-status" id="analysisStatus">
                            <div class="spinner show" style="margin: 0 auto 20px;"></div>
                            <p>Analyzing project requirements...</p>
                        </div>
                        
                        <div class="analysis-results" id="analysisResults" style="display: none;">
                            <div class="analysis-summary">
                                <h3>🧠 Project Analysis</h3>
                                <div id="projectAnalysis"></div>
                            </div>
                            
                            <div class="selected-agents">
                                <h3>🤖 Recommended Agent Team</h3>
                                <div class="agent-grid" id="selectedAgentGrid">
                                    <!-- Selected agents will be shown here -->
                                </div>
                            </div>
                            
                            <div class="analysis-reasoning">
                                <h3>💡 Selection Reasoning</h3>
                                <div id="agentReasoning"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Step 5: Tmux Design -->
                <div class="step-content" data-step="5">
                    <h2>Tmux Layout Design</h2>
                    
                    <div class="tmux-designer">
                        <h3>Window Layout</h3>
                        <div class="layout-selector">
                            <div class="layout-option selected" data-layout="even-horizontal">
                                <div class="layout-visual" style="flex-direction: row;">
                                    <div class="layout-visual-pane" style="flex: 1;"></div>
                                    <div class="layout-visual-pane" style="flex: 1;"></div>
                                </div>
                            </div>
                            <div class="layout-option" data-layout="even-vertical">
                                <div class="layout-visual" style="flex-direction: column;">
                                    <div class="layout-visual-pane" style="flex: 1;"></div>
                                    <div class="layout-visual-pane" style="flex: 1;"></div>
                                </div>
                            </div>
                            <div class="layout-option" data-layout="main-vertical">
                                <div class="layout-visual" style="flex-direction: row;">
                                    <div class="layout-visual-pane" style="flex: 2;"></div>
                                    <div class="layout-visual-pane" style="flex: 1;"></div>
                                </div>
                            </div>
                            <div class="layout-option" data-layout="tiled">
                                <div class="layout-visual" style="flex-wrap: wrap;">
                                    <div class="layout-visual-pane" style="width: 48%; height: 48%;"></div>
                                    <div class="layout-visual-pane" style="width: 48%; height: 48%;"></div>
                                    <div class="layout-visual-pane" style="width: 48%; height: 48%;"></div>
                                    <div class="layout-visual-pane" style="width: 48%; height: 48%;"></div>
                                </div>
                            </div>
                        </div>
                        
                        <h3>Preview</h3>
                        <div class="tmux-preview" id="tmuxPreview">
                            <!-- Preview will be generated by JavaScript -->
                        </div>
                        
                        <div class="form-group">
                            <label>Status Bar</label>
                            <select id="statusBar">
                                <option value="on">Enabled</option>
                                <option value="off">Disabled</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Color Scheme</label>
                            <select id="colorScheme">
                                <option value="default">Default (Green)</option>
                                <option value="blue">Blue</option>
                                <option value="red">Red</option>
                                <option value="yellow">Yellow</option>
                                <option value="purple">Purple</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Step 6: Git & Workflow -->
                <div class="step-content" data-step="6">
                    <h2>Git & Workflow Settings</h2>
                    
                    <div class="git-settings">
                        <h3>Git Configuration</h3>
                        
                        <div class="checkbox-group">
                            <input type="checkbox" id="autoCommit" checked>
                            <label for="autoCommit">Auto-commit every 30 minutes</label>
                        </div>
                        
                        <div class="checkbox-group">
                            <input type="checkbox" id="featureBranch" checked>
                            <label for="featureBranch">Use feature branch workflow</label>
                        </div>
                        
                        <div class="checkbox-group">
                            <input type="checkbox" id="gitStatus" checked>
                            <label for="gitStatus">Include git status pane</label>
                        </div>
                        
                        <div class="form-group">
                            <label>Commit Message Prefix</label>
                            <input type="text" id="commitPrefix" value="feat:" placeholder="feat: / fix: / docs:" />
                        </div>
                        
                        <div class="form-group">
                            <label>Branch Name</label>
                            <input type="text" id="branchName" placeholder="feature/fix-search-functionality" />
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Check-in Interval (minutes)</label>
                        <input type="number" id="checkInterval" value="15" min="5" max="120" />
                    </div>
                    
                    <div class="form-group">
                        <label>Emergency Contact Window</label>
                        <input type="text" id="emergencyWindow" value="tmux-orc:0" placeholder="session:window" />
                    </div>
                </div>
                
                <!-- Step 7: Generate -->
                <div class="step-content" data-step="7">
                    <h2>Review & Generate</h2>
                    
                    <div id="configSummary" style="margin-bottom: 30px;">
                        <!-- Summary will be populated by JavaScript -->
                    </div>
                    
                    <div class="button-group">
                        <button class="btn btn-primary" onclick="generateConfig()">
                            Generate Configuration
                        </button>
                    </div>
                    
                    <div class="spinner" id="spinner"></div>
                    
                    <div class="output-container" id="outputContainer">
                        <div class="output-tabs">
                            <button class="output-tab active" data-tab="setup">Setup Guide</button>
                            <button class="output-tab" data-tab="launcher">Launcher Script</button>
                            <button class="output-tab" data-tab="project">Project Spec</button>
                            <button class="output-tab" data-tab="utilities">Utility Scripts</button>
                            <button class="output-tab" data-tab="commands">Quick Commands</button>
                        </div>
                        
                        <div class="output-content">
                            <div class="output-section active" data-tab="setup">
                                <div id="setupGuide"></div>
                            </div>
                            <div class="output-section" data-tab="launcher">
                                <button class="copy-btn" onclick="copyToClipboard('launcherScript')">Copy</button>
                                <pre id="launcherScript"></pre>
                            </div>
                            <div class="output-section" data-tab="project">
                                <button class="copy-btn" onclick="copyToClipboard('projectSpec')">Copy</button>
                                <pre id="projectSpec"></pre>
                            </div>
                            <div class="output-section" data-tab="utilities">
                                <button class="copy-btn" onclick="copyToClipboard('utilityScripts')">Copy All</button>
                                <div id="utilityScripts"></div>
                            </div>
                            <div class="output-section" data-tab="commands">
                                <button class="copy-btn" onclick="copyToClipboard('quickCommands')">Copy</button>
                                <pre id="quickCommands"></pre>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="button-group">
                    <button class="btn btn-secondary" onclick="previousStep()" id="prevBtn" style="display: none;">
                        Previous
                    </button>
                    <button class="btn btn-primary" onclick="nextStep()" id="nextBtn">
                        Next
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let currentStep = 1;
        let config = {
            projectType: null,
            projectPath: '',
            projectName: '',
            projectGoal: '',
            constraints: [],
            deliverables: [],
            agents: [],
            layout: 'even-horizontal',
            statusBar: 'on',
            colorScheme: 'default',
            git: {
                autoCommit: true,
                featureBranch: true,
                gitStatus: true,
                commitPrefix: 'feat:',
                branchName: ''
            },
            checkInterval: 15,
            emergencyWindow: 'tmux-orc:0'
        };
        
        const fixAgents = [
            { id: 'orchestrator', name: 'Orchestrator', role: 'High-level coordination and architecture decisions', icon: '👑' },
            { id: 'debugger', name: 'Debug Specialist', role: 'Root cause analysis and bug fixing', icon: '🐛' },
            { id: 'test-engineer', name: 'Test Engineer', role: 'Test creation and coverage improvement', icon: '🧪' },
            { id: 'refactor-specialist', name: 'Refactor Specialist', role: 'Code optimization and cleanup', icon: '♻️' },
            { id: 'security-auditor', name: 'Security Auditor', role: 'Security vulnerability assessment', icon: '🔒' },
            { id: 'performance-optimizer', name: 'Performance Optimizer', role: 'Performance profiling and optimization', icon: '⚡' }
        ];
        
        const newAgents = [
            { id: 'orchestrator', name: 'Orchestrator', role: 'High-level coordination and architecture decisions', icon: '👑' },
            { id: 'project-manager', name: 'Project Manager', role: 'Quality-focused team coordination', icon: '📋' },
            { id: 'frontend-dev', name: 'Frontend Developer', role: 'UI/UX implementation', icon: '🎨' },
            { id: 'backend-dev', name: 'Backend Developer', role: 'API and server logic', icon: '⚙️' },
            { id: 'database-engineer', name: 'Database Engineer', role: 'Data modeling and optimization', icon: '🗄️' },
            { id: 'devops', name: 'DevOps Engineer', role: 'Infrastructure and deployment', icon: '🚀' },
            { id: 'qa-engineer', name: 'QA Engineer', role: 'Testing and quality assurance', icon: '✅' },
            { id: 'doc-writer', name: 'Documentation Writer', role: 'Technical documentation', icon: '📝' }
        ];
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            setupEventListeners();
            updateStepIndicator();
        });
        
        function setupEventListeners() {
            // Project type selection
            document.querySelectorAll('.project-type-card').forEach(card => {
                card.addEventListener('click', () => {
                    document.querySelectorAll('.project-type-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    config.projectType = card.dataset.type;
                    populateAgents();
                });
            });
            
            // Step indicator clicks
            document.querySelectorAll('.step').forEach(step => {
                step.addEventListener('click', () => {
                    const stepNum = parseInt(step.dataset.step);
                    if (stepNum <= currentStep || validateCurrentStep()) {
                        goToStep(stepNum);
                    }
                });
            });
            
            // Layout selection
            document.querySelectorAll('.layout-option').forEach(option => {
                option.addEventListener('click', () => {
                    document.querySelectorAll('.layout-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    config.layout = option.dataset.layout;
                    updateTmuxPreview();
                });
            });
            
            // Output tabs
            document.querySelectorAll('.output-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.output-tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.output-section').forEach(s => s.classList.remove('active'));
                    tab.classList.add('active');
                    document.querySelector(\`.output-section[data-tab="\${tab.dataset.tab}"]\`).classList.add('active');
                });
            });
        }
        
        function populateAgents() {
            const agentGrid = document.getElementById('agentGrid');
            const agents = config.projectType === 'fix' ? fixAgents : newAgents;
            
            agentGrid.innerHTML = agents.map(agent => 
                '<div class="agent-card" data-agent="' + agent.id + '">' +
                    '<h4>' + agent.icon + ' ' + agent.name + '</h4>' +
                    '<p>' + agent.role + '</p>' +
                '</div>'
            ).join('');
            
            // Add click handlers
            document.querySelectorAll('.agent-card').forEach(card => {
                card.addEventListener('click', () => {
                    card.classList.toggle('selected');
                    const agentId = card.dataset.agent;
                    const agent = agents.find(a => a.id === agentId);
                    
                    if (card.classList.contains('selected')) {
                        config.agents.push(agent);
                    } else {
                        config.agents = config.agents.filter(a => a.id !== agentId);
                    }
                    
                    updateTmuxPreview();
                });
            });
            
            // Auto-select orchestrator
            const orchestratorCard = document.querySelector('.agent-card[data-agent="orchestrator"]');
            if (orchestratorCard) {
                orchestratorCard.click();
            }
        }
        
        function updateTmuxPreview() {
            const preview = document.getElementById('tmuxPreview');
            if (!config.agents.length) {
                preview.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 50px;">Select agents to see preview</div>';
                return;
            }
            
            const windows = config.agents.map((agent, index) => {
                const shellPane = config.layout === 'even-horizontal' || config.layout === 'main-vertical' ? 
                    '<div class="tmux-pane">Shell for ' + agent.name + '<br>$ _</div>' : '';
                
                return '<div class="tmux-window">' +
                    '<div class="tmux-window-header">Window ' + index + ': ' + agent.name + '</div>' +
                    '<div class="tmux-panes">' +
                        '<div class="tmux-pane">' +
                            agent.icon + ' Claude --dangerously-skip-permissions<br>' +
                            '> Initializing ' + agent.name + ' agent...<br>' +
                            '> Ready for instructions_' +
                        '</div>' +
                        shellPane +
                    '</div>' +
                '</div>';
            }).join('');
            
            preview.innerHTML = windows;
        }
        
        function validateCurrentStep() {
            const errors = [];
            
            switch(currentStep) {
                case 1:
                    if (!config.projectType) errors.push('Please select a project type');
                    if (!document.getElementById('projectPath').value) errors.push('Please enter project path');
                    break;
                case 2:
                    if (!document.getElementById('projectName').value) errors.push('Please enter project name');
                    if (!document.getElementById('projectGoal').value) errors.push('Please enter project goal');
                    break;
                case 3:
                    // Codebase analysis step - validation happens automatically
                    break;
                case 4:
                    if (config.agents.length === 0) errors.push('Please select at least one agent');
                    break;
            }
            
            if (errors.length) {
                showError(errors.join('<br>'));
                return false;
            }
            
            saveStepData();
            return true;
        }
        
        function saveStepData() {
            switch(currentStep) {
                case 1:
                    config.projectPath = document.getElementById('projectPath').value;
                    break;
                case 2:
                    config.projectName = document.getElementById('projectName').value;
                    config.projectGoal = document.getElementById('projectGoal').value;
                    config.constraints = document.getElementById('constraints').value.split('\\n').filter(c => c.trim());
                    config.deliverables = document.getElementById('deliverables').value.split('\\n').filter(d => d.trim());
                    break;
                case 3:
                    // Codebase analysis data is saved automatically during analysis
                    break;
                case 5:
                    config.statusBar = document.getElementById('statusBar').value;
                    config.colorScheme = document.getElementById('colorScheme').value;
                    break;
                case 6:
                    config.git.autoCommit = document.getElementById('autoCommit').checked;
                    config.git.featureBranch = document.getElementById('featureBranch').checked;
                    config.git.gitStatus = document.getElementById('gitStatus').checked;
                    config.git.commitPrefix = document.getElementById('commitPrefix').value;
                    config.git.branchName = document.getElementById('branchName').value;
                    config.checkInterval = parseInt(document.getElementById('checkInterval').value);
                    config.emergencyWindow = document.getElementById('emergencyWindow').value;
                    break;
            }
        }
        
        function nextStep() {
            if (currentStep < 7 && validateCurrentStep()) {
                goToStep(currentStep + 1);
            }
        }
        
        function previousStep() {
            if (currentStep > 1) {
                goToStep(currentStep - 1);
            }
        }
        
        function goToStep(step) {
            currentStep = step;
            updateStepIndicator();
            updateContent();
            updateButtons();
            
            if (step === 3) {
                performCodebaseAnalysis();
            } else if (step === 4) {
                performAIAnalysis();
            } else if (step === 7) {
                showSummary();
            }
        }
        
        async function performCodebaseAnalysis() {
            const analysisStatus = document.getElementById('codebaseAnalysisStatus');
            const analysisResults = document.getElementById('codebaseAnalysisResults');
            const statusText = document.getElementById('analysisStatusText');
            const stepTitle = document.getElementById('analysisStepTitle');
            const stepDescription = document.getElementById('analysisStepDescription');
            
            // Show loading state
            analysisStatus.style.display = 'block';
            analysisResults.style.display = 'none';
            
            // Update UI based on project type
            if (config.projectType === 'fix') {
                stepTitle.textContent = 'Codebase Analysis';
                stepDescription.textContent = 'Analyzing existing codebase to understand tech stack, issues, and requirements';
                statusText.textContent = 'Scanning project files and documentation...';
            } else {
                stepTitle.textContent = 'Feature Recommendations';
                stepDescription.textContent = 'Analyzing project requirements to recommend additional features and best practices';
                statusText.textContent = 'Generating feature recommendations...';
            }
            
            try {
                // Simulate analysis time
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const projectData = {
                    projectType: config.projectType,
                    projectName: config.projectName,
                    projectGoal: config.projectGoal,
                    constraints: config.constraints,
                    deliverables: config.deliverables,
                    projectPath: config.projectPath
                };
                
                const response = await fetch('/api/codebase-analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(projectData)
                });
                
                const result = await response.json();
                
                // Store analysis results in config
                config.codebaseAnalysis = result;
                
                // Show results
                displayCodebaseAnalysis(result);
                
                // Hide loading, show results
                analysisStatus.style.display = 'none';
                analysisResults.style.display = 'block';
                
            } catch (error) {
                showError('Failed to analyze codebase: ' + error.message);
                statusText.innerHTML = '<p style="color: var(--accent-red);">Analysis failed. Please try again.</p>';
            }
        }
        
        function displayCodebaseAnalysis(result) {
            const { analysis, recommendations, techStack } = result;
            
            if (config.projectType === 'fix') {
                // Display fix project analysis
                const qualityColor = analysis.codeQuality === 'high' ? 'green' : analysis.codeQuality === 'medium' ? 'orange' : 'red';
                
                const summaryHTML = '<h3 style="color: var(--accent-blue); margin-bottom: 15px;">🔍 Codebase Analysis</h3>' +
                    '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">' +
                    '<div style="background: var(--bg-primary); padding: 15px; border-radius: 8px;">' +
                    '<strong>Tech Stack:</strong><br>' +
                    '<span style="color: var(--accent-blue);">' + techStack.primary.join(', ') + '</span>' +
                    '</div>' +
                    '<div style="background: var(--bg-primary); padding: 15px; border-radius: 8px;">' +
                    '<strong>Project Size:</strong><br>' +
                    '<span style="color: var(--accent-green);">' + analysis.projectSize + '</span>' +
                    '</div>' +
                    '<div style="background: var(--bg-primary); padding: 15px; border-radius: 8px;">' +
                    '<strong>Code Quality:</strong><br>' +
                    '<span style="color: var(--accent-' + qualityColor + ');">' +
                    analysis.codeQuality.toUpperCase() +
                    '</span>' +
                    '</div>' +
                    '<div style="background: var(--bg-primary); padding: 15px; border-radius: 8px;">' +
                    '<strong>Issues Found:</strong><br>' +
                    '<span style="color: var(--accent-red);">' + analysis.issuesFound + ' problems</span>' +
                    '</div>' +
                    '</div>';
                
                document.getElementById('codebaseSummary').innerHTML = summaryHTML;
                
                const recommendationsHTML = '<h3 style="color: var(--accent-orange); margin-bottom: 15px;">⚡ Fix Recommendations</h3>' +
                    '<div style="background: var(--bg-primary); padding: 15px; border-radius: 8px;">' +
                    recommendations.map(rec => '<p style="margin-bottom: 10px;">• ' + rec + '</p>').join('') +
                    '</div>';
                
                document.getElementById('recommendationsSection').innerHTML = recommendationsHTML;
            } else {
                // Display new project recommendations
                const summaryHTML = '<h3 style="color: var(--accent-blue); margin-bottom: 15px;">🚀 Project Foundation</h3>' +
                    '<div style="background: var(--bg-primary); padding: 15px; border-radius: 8px; margin-bottom: 20px;">' +
                    '<p><strong>Recommended Tech Stack:</strong> ' + techStack.recommended.join(', ') + '</p>' +
                    '<p><strong>Architecture Pattern:</strong> ' + analysis.architecture + '</p>' +
                    '<p><strong>Estimated Complexity:</strong> ' + analysis.complexity + '</p>' +
                    '</div>';
                
                document.getElementById('codebaseSummary').innerHTML = summaryHTML;
                
                const recommendationsHTML = '<h3 style="color: var(--accent-green); margin-bottom: 15px;">✨ Feature Recommendations</h3>' +
                    '<div style="background: var(--bg-primary); padding: 15px; border-radius: 8px;">' +
                    '<h4 style="color: var(--accent-blue); margin-bottom: 10px;">Essential Features:</h4>' +
                    recommendations.essential.map(rec => '<p style="margin-bottom: 8px;">• ' + rec + '</p>').join('') +
                    '<h4 style="color: var(--accent-orange); margin-bottom: 10px; margin-top: 15px;">Nice-to-Have Features:</h4>' +
                    recommendations.optional.map(rec => '<p style="margin-bottom: 8px;">• ' + rec + '</p>').join('') +
                    '</div>';
                
                document.getElementById('recommendationsSection').innerHTML = recommendationsHTML;
            }
            
            const techHTML = '<h3 style="color: var(--accent-green); margin-bottom: 15px;">📊 Technical Analysis</h3>' +
                '<div style="background: var(--bg-primary); padding: 15px; border-radius: 8px;">' +
                '<p><strong>Detected Languages:</strong> ' + techStack.languages.join(', ') + '</p>' +
                '<p><strong>Dependencies:</strong> ' + techStack.dependencies.slice(0, 5).join(', ') + (techStack.dependencies.length > 5 ? '...' : '') + '</p>' +
                '<p><strong>Build Tools:</strong> ' + techStack.buildTools.join(', ') + '</p>' +
                (analysis.testFramework ? '<p><strong>Testing:</strong> ' + analysis.testFramework + '</p>' : '') +
                (analysis.documentation ? '<p><strong>Documentation:</strong> ' + analysis.documentation + '</p>' : '') +
                '</div>';
            
            document.getElementById('techStackAnalysis').innerHTML = techHTML;
        }
        
        async function performAIAnalysis() {
            const analysisStatus = document.getElementById('analysisStatus');
            const analysisResults = document.getElementById('analysisResults');
            
            // Show loading state
            analysisStatus.style.display = 'block';
            analysisResults.style.display = 'none';
            
            try {
                // Simulate AI thinking time
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const projectData = {
                    projectType: config.projectType,
                    projectName: config.projectName,
                    projectGoal: config.projectGoal,
                    constraints: config.constraints,
                    deliverables: config.deliverables,
                    projectPath: config.projectPath,
                    codebaseAnalysis: config.codebaseAnalysis  // Include codebase analysis results
                };
                
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(projectData)
                });
                
                const result = await response.json();
                
                // Update config with selected agents
                config.agents = result.agents;
                
                // Show results
                displayAnalysisResults(result);
                
                // Hide loading, show results
                analysisStatus.style.display = 'none';
                analysisResults.style.display = 'block';
                
            } catch (error) {
                showError('Failed to analyze project: ' + error.message);
                analysisStatus.innerHTML = '<p style="color: var(--accent-red);">Analysis failed. Please try again.</p>';
            }
        }
        
        function displayAnalysisResults(result) {
            const { analysis, agents, reasoning } = result;
            
            // Display project analysis
            const complexityColor = analysis.complexity === 'high' ? 'red' : analysis.complexity === 'medium' ? 'orange' : 'green';
            const riskSection = analysis.risks.length ? '<br><strong>Identified Risks:</strong> ' + analysis.risks.join(', ') : '';
            
            document.getElementById('projectAnalysis').innerHTML = 
                '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">' +
                    '<div style="background: var(--bg-primary); padding: 15px; border-radius: 8px;">' +
                        '<strong>Complexity:</strong><br>' +
                        '<span style="color: var(--accent-' + complexityColor + ');">' +
                            analysis.complexity.toUpperCase() +
                        '</span>' +
                    '</div>' +
                    '<div style="background: var(--bg-primary); padding: 15px; border-radius: 8px;">' +
                        '<strong>Team Size:</strong><br>' +
                        '<span style="color: var(--accent-blue);">' + analysis.teamSize + ' agents</span>' +
                    '</div>' +
                    '<div style="background: var(--bg-primary); padding: 15px; border-radius: 8px;">' +
                        '<strong>Est. Duration:</strong><br>' +
                        '<span style="color: var(--accent-green);">' + analysis.estimatedDuration + 'h</span>' +
                    '</div>' +
                '</div>' +
                '<div style="background: var(--bg-primary); padding: 15px; border-radius: 8px;">' +
                    '<strong>Primary Domains:</strong> ' + analysis.primaryDomains.join(', ') +
                    riskSection +
                '</div>';
            
            // Display selected agents
            document.getElementById('selectedAgentGrid').innerHTML = agents.map(agent => 
                '<div class="agent-card selected" style="cursor: default;">' +
                    '<h4>' + agent.icon + ' ' + agent.name + '</h4>' +
                    '<p>' + agent.role + '</p>' +
                '</div>'
            ).join('');
            
            // Display reasoning
            document.getElementById('agentReasoning').innerHTML = 
                '<div style="background: var(--bg-primary); padding: 15px; border-radius: 8px;">' +
                    reasoning.map(reason => '<p style="margin-bottom: 10px;">• ' + reason + '</p>').join('') +
                '</div>';
            
            // Update tmux preview with selected agents
            updateTmuxPreview();
        }
        
        function updateStepIndicator() {
            document.querySelectorAll('.step').forEach((step, index) => {
                const stepNum = index + 1;
                step.classList.toggle('active', stepNum === currentStep);
                step.classList.toggle('completed', stepNum < currentStep);
            });
        }
        
        function updateContent() {
            document.querySelectorAll('.step-content').forEach(content => {
                content.classList.toggle('active', parseInt(content.dataset.step) === currentStep);
            });
        }
        
        function updateButtons() {
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            
            prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
            nextBtn.style.display = currentStep < 7 ? 'block' : 'none';
        }
        
        function showSummary() {
            const summary = document.getElementById('configSummary');
            summary.innerHTML = \`
                <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 10px;">
                    <h3>Configuration Summary</h3>
                    <p><strong>Project Type:</strong> \${config.projectType === 'fix' ? '🔧 Fix Project' : '🚀 New Project'}</p>
                    <p><strong>Project Name:</strong> \${config.projectName}</p>
                    <p><strong>Path:</strong> \${config.projectPath}</p>
                    <p><strong>Agents:</strong> \${config.agents.map(a => a.name).join(', ')}</p>
                    <p><strong>Layout:</strong> \${config.layout}</p>
                    <p><strong>Git Auto-commit:</strong> \${config.git.autoCommit ? 'Yes' : 'No'}</p>
                    <p><strong>Check-in Interval:</strong> \${config.checkInterval} minutes</p>
                </div>
            \`;
        }
        
        async function generateConfig() {
            showSpinner(true);
            hideMessages();
            
            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });
                
                const scripts = await response.json();
                
                document.getElementById('setupGuide').innerHTML = scripts.setupGuide;
                document.getElementById('launcherScript').textContent = scripts.launcher;
                document.getElementById('projectSpec').textContent = scripts.projectSpec;
                document.getElementById('utilityScripts').innerHTML = scripts.utilityScripts;
                document.getElementById('quickCommands').textContent = scripts.commands;
                
                document.getElementById('outputContainer').classList.add('show');
                showSuccess('Configuration generated successfully!');
            } catch (error) {
                showError('Failed to generate configuration: ' + error.message);
            } finally {
                showSpinner(false);
            }
        }
        
        function copyToClipboard(elementId) {
            const text = document.getElementById(elementId).textContent;
            navigator.clipboard.writeText(text).then(() => {
                showSuccess('Copied to clipboard!');
            }).catch(() => {
                showError('Failed to copy to clipboard');
            });
        }
        
        function copyScriptToClipboard(elementId) {
            const text = document.getElementById(elementId).textContent;
            navigator.clipboard.writeText(text).then(() => {
                showSuccess('Script copied to clipboard!');
            }).catch(() => {
                showError('Failed to copy script to clipboard');
            });
        }
        
        function showError(message) {
            const errorEl = document.getElementById('errorMessage');
            errorEl.innerHTML = message;
            errorEl.classList.add('show');
            setTimeout(() => errorEl.classList.remove('show'), 5000);
        }
        
        function showSuccess(message) {
            const successEl = document.getElementById('successMessage');
            successEl.innerHTML = message;
            successEl.classList.add('show');
            setTimeout(() => successEl.classList.remove('show'), 3000);
        }
        
        function hideMessages() {
            document.getElementById('errorMessage').classList.remove('show');
            document.getElementById('successMessage').classList.remove('show');
        }
        
        function showSpinner(show) {
            document.getElementById('spinner').classList.toggle('show', show);
        }
    </script>
</body>
</html>`;
}

// Simple in-memory storage for configurations (in production, use KV or D1)
const configStorage = new Map();

function storeConfig(sessionName, config) {
  configStorage.set(sessionName, config);
}

function getStoredConfig(sessionName) {
  return configStorage.get(sessionName);
}

function generateAutomatedSetup(sessionName) {
  // Generate a script that Claude Code can execute to set up everything automatically
  return `#!/bin/bash
# Automated Tmux Orchestrator Setup Script
# Generated for session: ${sessionName}
# This script should be executed by Claude Code agent

echo "🚀 Starting automated Tmux Orchestrator setup for ${sessionName}..."

# Function to create file with content
create_file() {
    local filepath="$1"
    local content="$2"
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$filepath")"
    
    # Write content to file
    cat > "$filepath" << 'EOF'
$content
EOF
    
    echo "✅ Created: $filepath"
}

# Function to make files executable
make_executable() {
    chmod +x "$1"
    echo "🔧 Made executable: $1"
}

# Function to fetch and apply configuration
apply_config() {
    echo "📥 Fetching configuration for ${sessionName}..."
    
    # Try to fetch configuration from API
    CONFIG_JSON=$(curl -s "https://tmux-orchestrator-ui-prod.findrawdogfood.workers.dev/api/config/${sessionName}")
    
    if [[ "$CONFIG_JSON" == *"error"* ]]; then
        echo "❌ No configuration found for session '${sessionName}'"
        echo "Please complete the wizard at: https://tmux-orchestrator-ui-prod.findrawdogfood.workers.dev"
        exit 1
    fi
    
    echo "✅ Configuration retrieved successfully"
    
    # Generate and save all scripts using the configuration
    generate_all_scripts "$CONFIG_JSON"
}

# Function to generate all scripts from configuration
generate_all_scripts() {
    local config_json="$1"
    
    echo "🔨 Generating all project scripts..."
    
    # Call API to generate scripts
    SCRIPTS_JSON=$(curl -s -X POST "https://tmux-orchestrator-ui-prod.findrawdogfood.workers.dev/api/generate" \\
        -H "Content-Type: application/json" \\
        -d "$config_json")
    
    # Extract individual scripts (this would need proper JSON parsing in real implementation)
    echo "📝 Creating launcher script..."
    create_file "./launch_${sessionName}.sh" "$(echo "$SCRIPTS_JSON" | jq -r '.launcher')"
    make_executable "./launch_${sessionName}.sh"
    
    echo "📝 Creating project specification..."
    create_file "./project_spec.md" "$(echo "$SCRIPTS_JSON" | jq -r '.projectSpec')"
    
    echo "📝 Creating utility scripts..."
    create_file "./send-claude-message.sh" "$(echo "$SCRIPTS_JSON" | jq -r '.utilityScripts' | grep -A 50 'send-claude-message.sh' | tail -n +2 | head -n 30)"
    make_executable "./send-claude-message.sh"
    
    create_file "./schedule_with_note.sh" "$(echo "$SCRIPTS_JSON" | jq -r '.utilityScripts' | grep -A 50 'schedule_with_note.sh' | tail -n +2 | head -n 30)"  
    make_executable "./schedule_with_note.sh"
    
    echo "📝 Creating quick commands reference..."
    create_file "./quick_commands.txt" "$(echo "$SCRIPTS_JSON" | jq -r '.commands')"
    
    echo "✅ All scripts generated successfully!"
}

# Function to launch the orchestrator
launch_orchestrator() {
    echo "🎬 Launching Tmux Orchestrator..."
    
    if [[ ! -f "./launch_${sessionName}.sh" ]]; then
        echo "❌ Launch script not found. Running setup first..."
        apply_config
    fi
    
    echo "🚀 Starting tmux session: ${sessionName}"
    ./launch_${sessionName}.sh
}

# Main execution flow
main() {
    # Check if we're in a valid directory
    if [[ ! -d ".git" ]] && [[ ! -f "package.json" ]] && [[ ! -f "requirements.txt" ]]; then
        echo "⚠️  Warning: This doesn't appear to be a project directory"
        echo "   Make sure you're in your project root before running this script"
        read -p "   Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check if jq is available for JSON parsing
    if ! command -v jq &> /dev/null; then
        echo "❌ jq is required but not installed."
        echo "   Please install jq: brew install jq (on macOS) or apt-get install jq (on Ubuntu)"
        exit 1
    fi
    
    # Apply configuration and generate scripts
    apply_config
    
    # Offer to launch immediately
    echo ""
    echo "🎉 Setup complete! All files created:"
    echo "   - launch_${sessionName}.sh (main launcher)"
    echo "   - project_spec.md (project specification)"  
    echo "   - send-claude-message.sh (communication utility)"
    echo "   - schedule_with_note.sh (scheduling utility)"
    echo "   - quick_commands.txt (reference commands)"
    echo ""
    
    read -p "🚀 Launch the orchestrator now? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "ℹ️  You can launch later with: ./launch_${sessionName}.sh"
        exit 0
    fi
    
    launch_orchestrator
}

# Check if running from curl pipe or as downloaded script
if [[ "\${BASH_SOURCE[0]}" == "\${0}" ]]; then
    main "$@"
fi
`;
}

function generateAgentSetupCommands(config) {
  const sessionName = config.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  
  return {
    setupCommand: `curl -s https://tmux-orchestrator-ui-prod.findrawdogfood.workers.dev/api/setup/${sessionName} | bash`,
    description: `Automated setup for ${config.projectName} Tmux Orchestrator`,
    prerequisites: [
      "jq (JSON parser) - install with: brew install jq",
      "tmux - install with: brew install tmux", 
      "claude command line tool"
    ],
    steps: [
      "1. Navigate to your project directory",
      "2. Run the setup command above",
      "3. Script will fetch configuration and create all files",
      "4. Choose to launch immediately or later"
    ],
    generatedFiles: [
      `launch_${sessionName}.sh - Main orchestrator launcher`,
      "project_spec.md - Project specification",
      "send-claude-message.sh - Agent communication utility",
      "schedule_with_note.sh - Check-in scheduling utility", 
      "quick_commands.txt - Reference commands"
    ],
    agentBriefings: config.agents.map(agent => ({
      role: agent.name,
      briefing: getAgentBriefing(agent, config),
      window: `${sessionName}:${config.agents.indexOf(agent)}`
    }))
  };
}

function generateTmuxScripts(config) {
  const timestamp = new Date().toISOString();
  
  // Store configuration for later retrieval
  const sessionName = config.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  storeConfig(sessionName, config);
  
  // Generate all components
  const setupGuide = generateSetupGuide(config);
  const launcher = generateLauncherScript(config);
  const projectSpec = generateProjectSpec(config);
  const utilityScripts = generateUtilityScripts(config);
  const commands = generateQuickCommands(config);
  
  return {
    setupGuide,
    launcher,
    projectSpec,
    utilityScripts,
    commands,
    timestamp
  };
}

function generateLauncherScript(config) {
  const agents = config.agents || [];
  const sessionName = config.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  
  let script = `#!/bin/bash
# Tmux Orchestrator Launcher Script
# Generated for: ${config.projectName}
# Type: ${config.projectType === 'fix' ? 'Fix Project' : 'New Project'}
# Generated: ${new Date().toISOString()}

PROJECT_PATH="${config.projectPath}"
SESSION_NAME="${sessionName}"

# Check if session exists
tmux has-session -t $SESSION_NAME 2>/dev/null
if [ $? != 0 ]; then
    echo "Creating new tmux session: $SESSION_NAME"
    
    # Create main session
    tmux new-session -d -s $SESSION_NAME -c "$PROJECT_PATH"
    
`;

  // Add windows for each agent
  agents.forEach((agent, index) => {
    const windowName = agent.name.replace(/\s+/g, '-');
    script += `    # Create window for ${agent.name}
    ${index === 0 ? '# First window already exists, just rename it' : `tmux new-window -t $SESSION_NAME -n "${windowName}" -c "$PROJECT_PATH"`}
    ${index === 0 ? `tmux rename-window -t $SESSION_NAME:0 "${windowName}"` : ''}
    
    # Split pane if needed for ${config.layout} layout
    ${config.layout === 'even-horizontal' ? `tmux split-window -t $SESSION_NAME:${index} -h -c "$PROJECT_PATH"` : ''}
    ${config.layout === 'even-vertical' ? `tmux split-window -t $SESSION_NAME:${index} -v -c "$PROJECT_PATH"` : ''}
    
    # Start Claude agent in first pane
    tmux send-keys -t $SESSION_NAME:${index}.0 "claude --dangerously-skip-permissions" Enter
    sleep 2
    
    # Send agent briefing
    tmux send-keys -t $SESSION_NAME:${index}.0 "You are the ${agent.name} for project ${config.projectName}. ${getAgentBriefing(agent, config)}" Enter
    
`;
  });

  // Add git status window if enabled
  if (config.git.gitStatus) {
    script += `    # Create git status window
    tmux new-window -t $SESSION_NAME -n "Git-Status" -c "$PROJECT_PATH"
    tmux send-keys -t $SESSION_NAME:Git-Status "watch -n 5 'git status -s && echo && git log --oneline -5'" Enter
    
`;
  }

  // Add git auto-commit if enabled
  if (config.git.autoCommit) {
    script += `    # Setup auto-commit
    echo "Setting up auto-commit every 30 minutes..."
    nohup bash -c "while true; do sleep 1800; cd $PROJECT_PATH && git add -A && git commit -m '${config.git.commitPrefix} Auto-commit: $(date)' 2>/dev/null; done" > /dev/null 2>&1 &
    
`;
  }

  script += `    # Setup check-in schedule
    ./schedule_with_note.sh ${config.checkInterval} "Regular check-in for ${config.projectName}" "${config.emergencyWindow}"
    
    echo "Session created successfully!"
else
    echo "Session $SESSION_NAME already exists"
fi

# Attach to session
tmux attach-session -t $SESSION_NAME
`;

  return script;
}

function generateProjectSpec(config) {
  return `PROJECT: ${config.projectName}
TYPE: ${config.projectType === 'fix' ? 'FIX_PROJECT' : 'NEW_PROJECT'}
PATH: ${config.projectPath}

GOAL: ${config.projectGoal}

CONSTRAINTS:
${config.constraints.map(c => `- ${c}`).join('\n')}

DELIVERABLES:
${config.deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n')}

AGENTS:
${config.agents.map(a => `- ${a.name}: ${a.role}`).join('\n')}

GIT_CONFIGURATION:
- Auto-commit: ${config.git.autoCommit ? 'Enabled (30 min)' : 'Disabled'}
- Feature Branch: ${config.git.featureBranch ? 'Enabled' : 'Disabled'}
- Branch Name: ${config.git.branchName || 'main'}
- Commit Prefix: ${config.git.commitPrefix}

ORCHESTRATION:
- Check-in Interval: ${config.checkInterval} minutes
- Emergency Contact: ${config.emergencyWindow}
- Layout: ${config.layout}
- Status Bar: ${config.statusBar}

QUALITY_REQUIREMENTS:
- All code must have tests
- Documentation must be updated
- Error handling must be comprehensive
- Performance must be acceptable
- Security best practices must be followed
- No technical debt introduced

Generated: ${new Date().toISOString()}`;
}

function generateScheduleScript(config) {
  return `#!/bin/bash
# Schedule Script for ${config.projectName}
# Usage: ./schedule.sh

MINUTES=${config.checkInterval}
SESSION="${config.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}"
TARGET="${config.emergencyWindow}"

# Create note for next check
cat > next_check_note.txt << EOF
=== Scheduled Check-in ===
Project: ${config.projectName}
Time: $(date)
Type: ${config.projectType === 'fix' ? 'Fix Project' : 'New Project'}

Agents Active:
${config.agents.map(a => `- ${a.name}`).join('\n')}

Check:
1. Review progress on deliverables
2. Verify all agents are functioning
3. Check for any blockers
4. Review git commits
5. Assess quality standards
EOF

echo "Scheduling check-in for $MINUTES minutes from now..."

# Schedule the check-in
nohup bash -c "sleep $(($MINUTES * 60)) && \\
    tmux send-keys -t $TARGET 'Time for orchestrator check!' Enter && \\
    sleep 1 && \\
    tmux send-keys -t $TARGET 'cat next_check_note.txt' Enter" > /dev/null 2>&1 &

echo "Check-in scheduled for $(date -d "+$MINUTES minutes")"`;
}

function generateQuickCommands(config) {
  const sessionName = config.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  
  return `# Quick Commands for ${config.projectName}

# Attach to session
tmux attach -t ${sessionName}

# Send message to specific agent
./send-claude-message.sh ${sessionName}:0 "Your message here"

# View all windows
tmux list-windows -t ${sessionName}

# Capture agent output
tmux capture-pane -t ${sessionName}:0 -p

# Switch between agents
${config.agents.map((a, i) => `tmux select-window -t ${sessionName}:${i}  # ${a.name}`).join('\n')}

# Emergency stop all agents
tmux kill-session -t ${sessionName}

# Git operations
cd ${config.projectPath} && git status
cd ${config.projectPath} && git add -A && git commit -m "${config.git.commitPrefix} Manual commit"
cd ${config.projectPath} && git push origin ${config.git.branchName || 'main'}

# Monitor all agents
tmux list-panes -a -F "#{session_name}:#{window_index}.#{pane_index}: #{pane_current_command}"

# Restart specific agent
tmux respawn-pane -t ${sessionName}:0.0 -k "claude --dangerously-skip-permissions"

# Send to all agents
${config.agents.map((a, i) => `tmux send-keys -t ${sessionName}:${i} "Broadcast message" Enter`).join('\n')}`;
}

function generateSetupGuide(config) {
  const sessionName = config.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  
  return `
    <div style="font-family: monospace; line-height: 1.6;">
      <h2 style="color: var(--accent-blue); margin-bottom: 20px;">🚀 Complete Setup Guide</h2>
      
      <div style="background: var(--bg-primary); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="color: var(--accent-green); margin-bottom: 15px;">📋 Project Overview</h3>
        <p><strong>Project:</strong> ${config.projectName}</p>
        <p><strong>Type:</strong> ${config.projectType === 'fix' ? '🔧 Fix Project' : '🚀 New Project'}</p>
        <p><strong>Path:</strong> ${config.projectPath}</p>
        <p><strong>Team Size:</strong> ${config.agents.length} agents</p>
        <p><strong>Session Name:</strong> ${sessionName}</p>
      </div>

      <div style="background: var(--bg-primary); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="color: var(--accent-orange); margin-bottom: 15px;">🤖 Claude Code Agent Setup</h3>
        <div style="background: #000; padding: 15px; border-radius: 5px; margin: 10px 0;">
          <code style="color: var(--accent-green);">
# For Claude Code agent to execute:<br/>
curl -s https://tmux-orchestrator-ui-prod.findrawdogfood.workers.dev/api/setup/${sessionName} | bash
          </code>
        </div>
        <p style="color: var(--text-secondary); font-size: 0.9em;">
          🎯 <strong>Claude Code agents:</strong> Use this command to automatically set up the complete orchestrator system.<br/>
          ✅ Creates all files, makes scripts executable, and offers to launch immediately.<br/>
          ⚠️ <strong>Requires:</strong> jq (JSON parser) - install with: <code>brew install jq</code> or <code>apt-get install jq</code>
        </p>
      </div>

      <div style="background: var(--bg-primary); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="color: var(--accent-blue); margin-bottom: 15px;">🛠️ Manual Setup Steps</h3>
        
        <div style="margin-bottom: 15px;">
          <h4 style="color: var(--accent-green);">Step 1: Create Project Scripts</h4>
          <div style="background: #000; padding: 10px; border-radius: 5px; margin: 5px 0;">
            <code style="color: var(--accent-green);">
cd ${config.projectPath}<br/>
nano launch_${sessionName}.sh
            </code>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.9em;">
            📝 Copy the "Launcher Script" tab contents into this file
          </p>
        </div>

        <div style="margin-bottom: 15px;">
          <h4 style="color: var(--accent-green);">Step 2: Add Utility Scripts</h4>
          <div style="background: #000; padding: 10px; border-radius: 5px; margin: 5px 0;">
            <code style="color: var(--accent-green);">
# Create the utility scripts (see Utility Scripts tab)<br/>
nano send-claude-message.sh<br/>
nano schedule_with_note.sh<br/>
chmod +x *.sh
            </code>
          </div>
        </div>

        <div style="margin-bottom: 15px;">
          <h4 style="color: var(--accent-green);">Step 3: Create Project Specification</h4>
          <div style="background: #000; padding: 10px; border-radius: 5px; margin: 5px 0;">
            <code style="color: var(--accent-green);">
nano project_spec.md
            </code>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.9em;">
            📝 Copy the "Project Spec" tab contents into this file
          </p>
        </div>

        <div style="margin-bottom: 15px;">
          <h4 style="color: var(--accent-green);">Step 4: Launch the Orchestrator</h4>
          <div style="background: #000; padding: 10px; border-radius: 5px; margin: 5px 0;">
            <code style="color: var(--accent-green);">
./launch_${sessionName}.sh
            </code>
          </div>
        </div>
      </div>

      <div style="background: var(--bg-primary); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="color: var(--accent-red); margin-bottom: 15px;">🎯 What Happens When You Launch</h3>
        <ol style="color: var(--text-primary); margin-left: 20px;">
          <li>Creates tmux session: <code>${sessionName}</code></li>
          <li>Sets up ${config.agents.length} agent windows: ${config.agents.map(a => a.name).join(', ')}</li>
          <li>Starts Claude agents with specialized briefings</li>
          <li>Configures ${config.layout} pane layout</li>
          ${config.git.autoCommit ? '<li>Enables auto-commit every 30 minutes</li>' : ''}
          <li>Schedules check-ins every ${config.checkInterval} minutes</li>
          <li>Attaches you to the orchestrator session</li>
        </ol>
      </div>

      <div style="background: var(--bg-primary); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="color: var(--accent-blue); margin-bottom: 15px;">🎮 Control Commands</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          <div>
            <strong style="color: var(--accent-green);">Communication:</strong><br/>
            <code>./send-claude-message.sh ${sessionName}:0 "message"</code>
          </div>
          <div>
            <strong style="color: var(--accent-green);">Monitor:</strong><br/>
            <code>tmux capture-pane -t ${sessionName}:0 -p</code>
          </div>
          <div>
            <strong style="color: var(--accent-green);">Switch Agents:</strong><br/>
            <code>tmux select-window -t ${sessionName}:1</code>
          </div>
          <div>
            <strong style="color: var(--accent-green);">Schedule Check:</strong><br/>
            <code>./schedule_with_note.sh 30 "Custom check"</code>
          </div>
        </div>
      </div>

      <div style="background: rgba(129, 199, 132, 0.1); border: 1px solid var(--accent-green); padding: 15px; border-radius: 10px;">
        <h4 style="color: var(--accent-green); margin-bottom: 10px;">✅ Ready to Launch!</h4>
        <p>Your tmux orchestrator configuration is complete. The agents will work autonomously following the tmux orchestrator methodology with proper quality standards and communication patterns.</p>
      </div>
    </div>
  `;
}

function generateUtilityScripts(config) {
  const sendClaudeScript = `#!/bin/bash
# Send message to Claude agent in tmux window
# Usage: send-claude-message.sh <session:window> <message>

if [ $# -lt 2 ]; then
    echo "Usage: $0 <session:window> <message>"
    echo "Example: $0 ${config.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}:0 'Hello Claude!'"
    exit 1
fi

WINDOW="$1"
shift  # Remove first argument, rest is the message
MESSAGE="$*"

# Send the message
tmux send-keys -t "$WINDOW" "$MESSAGE"

# Wait 0.5 seconds for UI to register
sleep 0.5

# Send Enter to submit
tmux send-keys -t "$WINDOW" Enter

echo "Message sent to $WINDOW: $MESSAGE"`;

  const scheduleScript = `#!/bin/bash
# Dynamic scheduler with note for next check
# Usage: ./schedule_with_note.sh <minutes> "<note>" [target_window]

MINUTES=\${1:-${config.checkInterval}}
NOTE=\${2:-"Standard check-in"}
TARGET=\${3:-"${config.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}:0"}

# Create a note file for the next check
echo "=== Next Check Note (\$(date)) ===" > next_check_note.txt
echo "Scheduled for: $MINUTES minutes" >> next_check_note.txt
echo "" >> next_check_note.txt
echo "$NOTE" >> next_check_note.txt

echo "Scheduling check in $MINUTES minutes with note: $NOTE"

# Calculate the exact time when the check will run
CURRENT_TIME=\$(date +"%H:%M:%S")
RUN_TIME=\$(date -v +\${MINUTES}M +"%H:%M:%S" 2>/dev/null || date -d "+\${MINUTES} minutes" +"%H:%M:%S" 2>/dev/null)

# Use nohup to completely detach the sleep process
SECONDS=\$(echo "$MINUTES * 60" | bc)
nohup bash -c "sleep $SECONDS && tmux send-keys -t $TARGET 'Time for orchestrator check! cat next_check_note.txt' && sleep 1 && tmux send-keys -t $TARGET Enter" > /dev/null 2>&1 &

# Get the PID of the background process
SCHEDULE_PID=$!

echo "Scheduled successfully - process detached (PID: $SCHEDULE_PID)"
echo "SCHEDULED TO RUN AT: $RUN_TIME (in $MINUTES minutes from $CURRENT_TIME)"`;

  return `
    <div style="margin-bottom: 20px;">
      <h3 style="color: var(--accent-blue); margin-bottom: 15px;">📂 send-claude-message.sh</h3>
      <button class="copy-btn" onclick="copyScriptToClipboard('sendClaudeScript')" style="float: right; margin-bottom: 10px;">Copy Script</button>
      <pre id="sendClaudeScript" style="background: var(--bg-primary); padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 0.85em;">${sendClaudeScript}</pre>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3 style="color: var(--accent-blue); margin-bottom: 15px;">⏰ schedule_with_note.sh</h3>
      <button class="copy-btn" onclick="copyScriptToClipboard('scheduleScript')" style="float: right; margin-bottom: 10px;">Copy Script</button>
      <pre id="scheduleScript" style="background: var(--bg-primary); padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 0.85em;">${scheduleScript}</pre>
    </div>
    
    <div style="background: rgba(100, 181, 246, 0.1); border: 1px solid var(--accent-blue); padding: 15px; border-radius: 10px;">
      <h4 style="color: var(--accent-blue); margin-bottom: 10px;">💡 Usage Instructions</h4>
      <p><strong>send-claude-message.sh:</strong> Communicates with Claude agents in tmux windows</p>
      <p><strong>schedule_with_note.sh:</strong> Schedules automated check-ins for continuous operation</p>
      <p style="margin-top: 10px; color: var(--text-secondary);">
        💾 Save both scripts to your project directory and make them executable with: <code>chmod +x *.sh</code>
      </p>
    </div>
  `;
}

function getAgentBriefing(agent, config) {
  const briefings = {
    'orchestrator': `You are the Orchestrator for ${config.projectName}. Your role: High-level coordination WITHOUT implementation details. Monitor all agents, make architectural decisions, resolve cross-project dependencies. Stay high-level - don't get pulled into code. Focus on: ${config.projectGoal}. Schedule check-ins every ${config.checkInterval} minutes.`,
    
    'project-manager': `You are the Project Manager for ${config.projectName}. Be meticulous about testing and verification - NO shortcuts, NO compromises. Quality standards are non-negotiable. Coordinate team communication using hub-and-spoke model. Trust but verify all work. Create test plans for every feature. Deliverables: ${config.deliverables.join(', ')}. Report to Orchestrator only.`,
    
    'developer': `You are a Developer for ${config.projectName}. Handle implementation and technical decisions. Follow existing code patterns. Report progress to Project Manager. Auto-commit every 30 minutes. Focus on: ${config.projectGoal}. Constraints: ${config.constraints.join(', ')}.`,
    
    'frontend-dev': `You are the Frontend Developer for ${config.projectName}. Implement UI/UX components. Follow design patterns and ensure responsive design. Report to Project Manager. Focus on user experience and interface implementation. Auto-commit every 30 minutes.`,
    
    'backend-dev': `You are the Backend Developer for ${config.projectName}. Implement API endpoints, server logic, database queries. Focus on scalability and performance. Report to Project Manager. Handle: ${config.projectGoal}. Follow security best practices.`,
    
    'qa-engineer': `You are the QA Engineer for ${config.projectName}. Create comprehensive test suites. Verify everything - no assumptions. Test coverage must meet project standards. Report quality issues to Project Manager immediately. Create test plans before features are built.`,
    
    'devops': `You are the DevOps Engineer for ${config.projectName}. Handle infrastructure, deployment, CI/CD pipelines. Ensure smooth releases and monitor system health. Report to Project Manager. Focus on automation and reliability.`,
    
    'code-reviewer': `You are the Code Reviewer for ${config.projectName}. Review all code for security vulnerabilities, OWASP compliance, and best practices. No code ships without review. Report security issues immediately to Project Manager.`,
    
    'researcher': `You are the Researcher for ${config.projectName}. Evaluate technologies and provide recommendations. Research solutions when team is blocked. Share findings with Project Manager for coordination.`,
    
    'doc-writer': `You are the Documentation Writer for ${config.projectName}. Create technical documentation, API docs, and user guides. Keep documentation updated with code changes. Report to Project Manager.`
  };
  
  return briefings[agent.id] || `You are the ${agent.name} for ${config.projectName}. Follow tmux orchestrator principles: quality first, coordinate through Project Manager, auto-commit every 30 minutes. Focus on your specialized role.`;
}

function analyzeRealCodebase(projectData, fileList = [], packageJson = null, readmeContent = null) {
  const { projectType, projectName, projectGoal, constraints, deliverables, projectPath } = projectData;
  
  if (projectType === 'fix') {
    return analyzeRealExistingCodebase(projectData, fileList, packageJson, readmeContent);
  } else {
    return generateFeatureRecommendations(projectData);
  }
}

function analyzeRealExistingCodebase(projectData, fileList, packageJson, readmeContent) {
  const { projectGoal, projectPath } = projectData;
  
  // Real analysis based on actual file data
  const analysis = {
    analysis: {},
    techStack: {
      primary: [],
      languages: [],
      dependencies: [],
      buildTools: []
    },
    recommendations: []
  };
  
  // Analyze files to detect tech stack
  const detectedTech = analyzeFileList(fileList);
  const packageInfo = analyzePackageJson(packageJson);
  const projectInfo = analyzeReadme(readmeContent);
  
  // Combine all analysis
  analysis.techStack = {
    primary: [...new Set([...detectedTech.frameworks, ...packageInfo.frameworks])],
    languages: [...new Set([...detectedTech.languages, ...packageInfo.languages])],
    dependencies: packageInfo.dependencies.slice(0, 10), // Top 10 deps
    buildTools: [...new Set([...detectedTech.buildTools, ...packageInfo.buildTools])]
  };
  
  // Project size analysis
  const projectSize = categorizeProjectSize(fileList.length);
  const codeQuality = assessCodeQuality(fileList, packageJson);
  const issuesFound = identifyIssues(fileList, packageJson, projectGoal);
  
  analysis.analysis = {
    projectSize: projectSize,
    codeQuality: codeQuality,
    issuesFound: issuesFound.length,
    testFramework: detectedTech.testFramework || 'No testing framework detected',
    documentation: projectInfo.hasGoodDocs ? 'Well documented' : 'Documentation needs improvement'
  };
  
  // Generate specific recommendations based on real analysis
  analysis.recommendations = generateRealRecommendations(projectGoal, detectedTech, issuesFound, codeQuality);
  
  return analysis;
}

function analyzeFileList(fileList) {
  const analysis = {
    languages: [],
    frameworks: [],
    buildTools: [],
    testFramework: null
  };
  
  if (!fileList || fileList.length === 0) {
    return analysis;
  }
  
  // Detect languages from file extensions
  const extensions = fileList.map(file => {
    const ext = file.split('.').pop().toLowerCase();
    return ext;
  }).filter(ext => ext);
  
  const extCounts = {};
  extensions.forEach(ext => extCounts[ext] = (extCounts[ext] || 0) + 1);
  
  // Map extensions to languages
  if (extCounts.js > 0) analysis.languages.push('JavaScript');
  if (extCounts.ts > 0) analysis.languages.push('TypeScript');
  if (extCounts.jsx > 0 || extCounts.tsx > 0) {
    analysis.languages.push('React');
    analysis.frameworks.push('React');
  }
  if (extCounts.css > 0) analysis.languages.push('CSS');
  if (extCounts.scss > 0 || extCounts.sass > 0) analysis.languages.push('SCSS');
  if (extCounts.html > 0) analysis.languages.push('HTML');
  if (extCounts.py > 0) analysis.languages.push('Python');
  if (extCounts.go > 0) analysis.languages.push('Go');
  if (extCounts.rs > 0) analysis.languages.push('Rust');
  if (extCounts.java > 0) analysis.languages.push('Java');
  if (extCounts.php > 0) analysis.languages.push('PHP');
  
  // Detect frameworks from file names and structures
  const fileNames = fileList.map(f => f.toLowerCase());
  
  if (fileNames.some(f => f.includes('next.config'))) analysis.frameworks.push('Next.js');
  if (fileNames.some(f => f.includes('vite.config'))) analysis.buildTools.push('Vite');
  if (fileNames.some(f => f.includes('webpack.config'))) analysis.buildTools.push('Webpack');
  if (fileNames.some(f => f.includes('rollup.config'))) analysis.buildTools.push('Rollup');
  if (fileNames.some(f => f.includes('babel.config'))) analysis.buildTools.push('Babel');
  if (fileNames.some(f => f.includes('wrangler.toml'))) {
    analysis.frameworks.push('Cloudflare Workers');
    analysis.buildTools.push('Wrangler');
  }
  if (fileNames.some(f => f.includes('docker'))) analysis.buildTools.push('Docker');
  if (fileNames.some(f => f.includes('prisma'))) analysis.frameworks.push('Prisma');
  if (fileNames.some(f => f.includes('tailwind'))) analysis.frameworks.push('Tailwind CSS');
  
  // Detect testing frameworks
  if (fileNames.some(f => f.includes('jest') || f.includes('.test.') || f.includes('.spec.'))) {
    analysis.testFramework = 'Jest';
  } else if (fileNames.some(f => f.includes('vitest'))) {
    analysis.testFramework = 'Vitest';
  } else if (fileNames.some(f => f.includes('cypress'))) {
    analysis.testFramework = 'Cypress';
  } else if (fileNames.some(f => f.includes('playwright'))) {
    analysis.testFramework = 'Playwright';
  }
  
  return analysis;
}

function analyzePackageJson(packageJson) {
  const analysis = {
    dependencies: [],
    frameworks: [],
    languages: [],
    buildTools: []
  };
  
  if (!packageJson) return analysis;
  
  try {
    const pkg = typeof packageJson === 'string' ? JSON.parse(packageJson) : packageJson;
    
    // Extract dependencies
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies
    };
    
    analysis.dependencies = Object.keys(allDeps || {});
    
    // Detect frameworks from dependencies
    if (allDeps.react) analysis.frameworks.push('React');
    if (allDeps.vue) analysis.frameworks.push('Vue.js');
    if (allDeps.angular) analysis.frameworks.push('Angular');
    if (allDeps.next) analysis.frameworks.push('Next.js');
    if (allDeps.nuxt) analysis.frameworks.push('Nuxt.js');
    if (allDeps.express) analysis.frameworks.push('Express.js');
    if (allDeps.fastify) analysis.frameworks.push('Fastify');
    if (allDeps.nestjs) analysis.frameworks.push('NestJS');
    
    // Detect languages
    if (allDeps.typescript) analysis.languages.push('TypeScript');
    
    // Detect build tools
    if (allDeps.webpack) analysis.buildTools.push('Webpack');
    if (allDeps.vite) analysis.buildTools.push('Vite');
    if (allDeps.rollup) analysis.buildTools.push('Rollup');
    if (allDeps.babel || allDeps['@babel/core']) analysis.buildTools.push('Babel');
    if (allDeps.esbuild) analysis.buildTools.push('ESBuild');
    if (allDeps.wrangler) analysis.buildTools.push('Wrangler');
    
  } catch (error) {
    console.error('Error parsing package.json:', error);
  }
  
  return analysis;
}

function analyzeReadme(readmeContent) {
  const analysis = {
    hasGoodDocs: false,
    hasInstallInstructions: false,
    hasApiDocs: false,
    hasExamples: false
  };
  
  if (!readmeContent) return analysis;
  
  const content = readmeContent.toLowerCase();
  
  analysis.hasInstallInstructions = content.includes('install') || content.includes('npm') || content.includes('yarn');
  analysis.hasApiDocs = content.includes('api') || content.includes('endpoint') || content.includes('route');
  analysis.hasExamples = content.includes('example') || content.includes('usage') || content.includes('demo');
  
  analysis.hasGoodDocs = analysis.hasInstallInstructions && 
                        (analysis.hasApiDocs || analysis.hasExamples) && 
                        content.length > 500;
  
  return analysis;
}

function categorizeProjectSize(fileCount) {
  if (fileCount < 20) return 'Small (< 20 files)';
  if (fileCount < 50) return 'Small to Medium (20-50 files)';
  if (fileCount < 100) return 'Medium (50-100 files)';
  if (fileCount < 200) return 'Medium to Large (100-200 files)';
  if (fileCount < 500) return 'Large (200-500 files)';
  return 'Very Large (500+ files)';
}

function assessCodeQuality(fileList, packageJson) {
  let score = 0;
  
  // Check for TypeScript usage
  if (fileList.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) score += 2;
  
  // Check for testing files
  if (fileList.some(f => f.includes('.test.') || f.includes('.spec.'))) score += 2;
  
  // Check for linting
  if (fileList.some(f => f.includes('eslint') || f.includes('.eslintrc'))) score += 1;
  
  // Check for formatting
  if (fileList.some(f => f.includes('prettier') || f.includes('.prettierrc'))) score += 1;
  
  // Check for configuration files
  if (fileList.some(f => f.includes('config') && !f.includes('node_modules'))) score += 1;
  
  // Check package.json for scripts
  if (packageJson) {
    try {
      const pkg = typeof packageJson === 'string' ? JSON.parse(packageJson) : packageJson;
      if (pkg.scripts) {
        if (pkg.scripts.test) score += 1;
        if (pkg.scripts.lint) score += 1;
        if (pkg.scripts.build) score += 1;
      }
    } catch (e) {}
  }
  
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function identifyIssues(fileList, packageJson, projectGoal) {
  const issues = [];
  
  // Check for missing TypeScript
  if (!fileList.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) {
    issues.push('No TypeScript detected - consider migration for better type safety');
  }
  
  // Check for missing tests
  if (!fileList.some(f => f.includes('.test.') || f.includes('.spec.'))) {
    issues.push('No test files detected - add comprehensive test suite');
  }
  
  // Check for missing linting
  if (!fileList.some(f => f.includes('eslint'))) {
    issues.push('No ESLint configuration found - add code linting');
  }
  
  // Check for missing README
  if (!fileList.some(f => f.toLowerCase().includes('readme'))) {
    issues.push('No README file found - add project documentation');
  }
  
  // Goal-specific issue detection
  const goalLower = projectGoal.toLowerCase();
  if (goalLower.includes('search')) {
    issues.push('Search functionality may need parameter validation');
    issues.push('Consider adding search result caching');
  }
  
  if (goalLower.includes('api')) {
    issues.push('API may need rate limiting implementation');
    issues.push('Consider adding API documentation with OpenAPI');
  }
  
  if (goalLower.includes('performance')) {
    issues.push('Performance monitoring may be missing');
    issues.push('Consider adding performance budgets');
  }
  
  return issues;
}

function generateRealRecommendations(projectGoal, detectedTech, issues, codeQuality) {
  const recommendations = [];
  
  // Add high-priority issues first
  issues.slice(0, 5).forEach(issue => recommendations.push(issue));
  
  // Add quality-based recommendations
  if (codeQuality === 'low') {
    recommendations.unshift('Critical: Improve code quality with linting and formatting');
    recommendations.push('Add comprehensive code review process');
  }
  
  // Add tech-specific recommendations
  if (detectedTech.frameworks.includes('React')) {
    recommendations.push('Consider React performance optimization (memo, useMemo)');
    recommendations.push('Add React error boundaries for better error handling');
  }
  
  if (detectedTech.frameworks.includes('Express.js')) {
    recommendations.push('Add Express.js security middleware (helmet, cors)');
    recommendations.push('Implement proper error handling middleware');
  }
  
  if (detectedTech.frameworks.includes('Cloudflare Workers')) {
    recommendations.push('Optimize Workers for edge performance');
    recommendations.push('Add proper error handling for Workers runtime');
  }
  
  // Goal-specific recommendations
  const goalLower = projectGoal.toLowerCase();
  if (goalLower.includes('search')) {
    recommendations.unshift('Priority: Fix search parameter handling in API calls');
  }
  
  return recommendations.slice(0, 12); // Limit to 12 recommendations
}

function analyzeCodebase(projectData) {
  const { projectType, projectName, projectGoal, constraints, deliverables, projectPath } = projectData;
  
  if (projectType === 'fix') {
    return analyzeExistingCodebase(projectData);
  } else {
    return generateFeatureRecommendations(projectData);
  }
}

function analyzeExistingCodebase(projectData) {
  const { projectGoal, projectPath } = projectData;
  
  // Use real codebase analysis with mock file data for now
  // In a real implementation, this would scan the actual file system
  
  // For now, generate representative file data based on project characteristics
  const mockFileList = generateMockFileListFromProject(projectData);
  const mockPackageJson = generateMockPackageJson(projectData);
  const mockReadmeContent = generateMockReadme(projectData);
  
  // Use the real analysis function with generated data
  return analyzeRealCodebase(projectData, mockFileList, mockPackageJson, mockReadmeContent);
}

function generateMockFileListFromProject(projectData) {
  const { projectGoal, projectPath } = projectData;
  const goalLower = projectGoal.toLowerCase();
  
  let baseFiles = ['README.md', '.gitignore'];
  
  if (goalLower.includes('search') || goalLower.includes('filter') || goalLower.includes('supplier')) {
    return baseFiles.concat([
      'package.json',
      'src/index.js',
      'src/components/SearchForm.jsx',
      'src/components/SupplierList.jsx',
      'src/utils/api.js',
      'src/styles/main.css',
      'public/index.html',
      'wrangler.toml',
      'scripts/build.js'
    ]);
  } else if (goalLower.includes('react') || goalLower.includes('frontend')) {
    return baseFiles.concat([
      'package.json',
      'src/App.jsx',
      'src/components/Header.jsx',
      'src/components/Footer.jsx',
      'src/hooks/useData.js',
      'src/styles/App.css',
      'public/index.html',
      'vite.config.js'
    ]);
  } else if (goalLower.includes('api') || goalLower.includes('backend')) {
    return baseFiles.concat([
      'package.json',
      'server.js',
      'routes/api.js',
      'models/User.js',
      'middleware/auth.js',
      'config/database.js',
      'tests/api.test.js'
    ]);
  } else {
    return baseFiles.concat([
      'package.json',
      'src/index.js',
      'src/app.js',
      'public/index.html'
    ]);
  }
}

function generateMockPackageJson(projectData) {
  const { projectGoal } = projectData;
  const goalLower = projectGoal.toLowerCase();
  
  let dependencies = {};
  let devDependencies = {};
  let scripts = {};
  
  if (goalLower.includes('search') || goalLower.includes('supplier')) {
    dependencies = {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      axios: "^1.4.0",
      cors: "^2.8.5"
    };
    devDependencies = {
      "@types/react": "^18.2.0",
      vite: "^4.4.0",
      wrangler: "^3.0.0"
    };
    scripts = {
      dev: "vite",
      build: "vite build",
      deploy: "wrangler publish"
    };
  } else if (goalLower.includes('react')) {
    dependencies = {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      "react-router-dom": "^6.14.0"
    };
    devDependencies = {
      "@types/react": "^18.2.0",
      vite: "^4.4.0",
      "@testing-library/react": "^13.4.0"
    };
    scripts = {
      dev: "vite",
      build: "vite build",
      test: "vitest"
    };
  } else if (goalLower.includes('api') || goalLower.includes('backend')) {
    dependencies = {
      express: "^4.18.0",
      cors: "^2.8.5",
      helmet: "^7.0.0",
      bcrypt: "^5.1.0"
    };
    devDependencies = {
      nodemon: "^3.0.0",
      jest: "^29.0.0",
      supertest: "^6.3.0"
    };
    scripts = {
      start: "node server.js",
      dev: "nodemon server.js",
      test: "jest"
    };
  }
  
  return {
    name: projectData.projectName,
    version: "1.0.0",
    dependencies,
    devDependencies,
    scripts
  };
}

function generateMockReadme(projectData) {
  const { projectName, projectGoal } = projectData;
  
  return `# ${projectName}

## Description
${projectGoal}

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
npm run dev
\`\`\`

## Project Status
This project is currently under development.
`;
}

function analyzeProjectPath(projectPath) {
  if (!projectPath) return { type: 'unknown', framework: 'unknown' };
  
  const pathLower = projectPath.toLowerCase();
  
  if (pathLower.includes('react') || pathLower.includes('frontend')) {
    return { type: 'frontend', framework: 'react' };
  } else if (pathLower.includes('api') || pathLower.includes('server') || pathLower.includes('backend')) {
    return { type: 'backend', framework: 'node' };
  } else if (pathLower.includes('workers') || pathLower.includes('cloudflare')) {
    return { type: 'serverless', framework: 'cloudflare' };
  } else if (pathLower.includes('next')) {
    return { type: 'fullstack', framework: 'nextjs' };
  }
  
  return { type: 'mixed', framework: 'unknown' };
}

function detectTechStackFromPath(projectPath) {
  const pathAnalysis = analyzeProjectPath(projectPath);
  
  switch (pathAnalysis.framework) {
    case 'react':
      return ['React', 'JavaScript', 'CSS'];
    case 'node':
      return ['Node.js', 'Express', 'JavaScript'];
    case 'cloudflare':
      return ['Cloudflare Workers', 'JavaScript', 'WebAPI'];
    case 'nextjs':
      return ['Next.js', 'React', 'JavaScript'];
    default:
      return ['JavaScript', 'Node.js', 'React'];
  }
}

function estimateProjectSize(projectPath) {
  if (!projectPath) return 'Small (< 50 files)';
  
  const pathLower = projectPath.toLowerCase();
  if (pathLower.includes('enterprise') || pathLower.includes('large')) {
    return 'Large (500+ files)';
  } else if (pathLower.includes('medium') || pathLower.includes('app')) {
    return 'Medium (50-200 files)';
  }
  
  return 'Small to Medium (20-100 files)';
}

function estimateIssuesFromGoal(goalLower) {
  let issues = 5; // Base issues
  
  if (goalLower.includes('fix') || goalLower.includes('bug')) issues += 8;
  if (goalLower.includes('performance')) issues += 5;
  if (goalLower.includes('security')) issues += 6;
  if (goalLower.includes('refactor')) issues += 10;
  if (goalLower.includes('test')) issues += 3;
  
  return Math.min(issues, 25); // Cap at 25 issues
}

function generateGenericRecommendations(goalLower) {
  const recommendations = [
    'Add comprehensive error handling',
    'Implement proper input validation',
    'Add automated testing',
    'Improve code documentation'
  ];
  
  if (goalLower.includes('performance')) {
    recommendations.unshift('Optimize critical performance bottlenecks');
    recommendations.push('Add performance monitoring');
  }
  
  if (goalLower.includes('security')) {
    recommendations.unshift('Address security vulnerabilities');
    recommendations.push('Implement security best practices');
  }
  
  if (goalLower.includes('test')) {
    recommendations.unshift('Increase test coverage to 80%+');
    recommendations.push('Add integration tests');
  }
  
  return recommendations;
}

function generateFeatureRecommendations(projectData) {
  const { projectGoal, deliverables } = projectData;
  
  const goalLower = projectGoal.toLowerCase();
  const deliverablesText = deliverables.join(' ').toLowerCase();
  
  // Base recommendations for new projects
  const baseRecommendations = {
    analysis: {
      architecture: 'Microservices',
      complexity: 'Medium',
      estimatedTimeframe: '8-12 weeks'
    },
    techStack: {
      recommended: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
      languages: ['TypeScript', 'JavaScript', 'SQL'],
      buildTools: ['Vite', 'npm', 'Docker Compose']
    },
    recommendations: {
      essential: [
        'User authentication and authorization',
        'Input validation and sanitization',
        'Error handling and logging',
        'Database migrations and seeding',
        'API documentation (OpenAPI/Swagger)',
        'Basic security headers and CORS',
        'Environment configuration management'
      ],
      optional: [
        'Real-time notifications (WebSocket/SSE)',
        'File upload and storage',
        'Email notification system',
        'Analytics and monitoring',
        'Caching layer (Redis)',
        'API rate limiting',
        'Background job processing',
        'Internationalization (i18n)'
      ]
    }
  };
  
  // Customize based on project goal
  if (goalLower.includes('e-commerce') || goalLower.includes('shopping')) {
    baseRecommendations.recommendations.essential.push(
      'Payment processing integration',
      'Shopping cart functionality',
      'Order management system',
      'Inventory tracking'
    );
    baseRecommendations.recommendations.optional.push(
      'Product recommendation engine',
      'Review and rating system',
      'Wishlist functionality',
      'Discount and coupon system'
    );
  }
  
  if (goalLower.includes('api') || deliverablesText.includes('api')) {
    baseRecommendations.techStack.recommended.push('Express.js', 'Swagger');
    baseRecommendations.recommendations.essential.push(
      'API versioning strategy',
      'Request/response validation',
      'API testing suite'
    );
  }
  
  if (goalLower.includes('dashboard') || goalLower.includes('admin')) {
    baseRecommendations.recommendations.essential.push(
      'Role-based access control',
      'Data visualization components',
      'Export functionality (CSV/PDF)'
    );
    baseRecommendations.recommendations.optional.push(
      'Real-time data updates',
      'Custom dashboard widgets',
      'Advanced filtering and search'
    );
  }
  
  if (goalLower.includes('mobile') || deliverablesText.includes('mobile')) {
    baseRecommendations.techStack.recommended.push('React Native', 'Expo');
    baseRecommendations.recommendations.essential.push(
      'Responsive design for mobile',
      'Touch-friendly interface',
      'Offline functionality'
    );
  }
  
  return baseRecommendations;
}

function analyzeProject(projectData) {
  const { projectType, projectName, projectGoal, constraints, deliverables, projectPath } = projectData;
  
  // AI analysis logic based on project details
  const analysis = {
    complexity: 'medium',
    domains: [],
    risks: [],
    recommendations: []
  };
  
  // Analyze project goal and deliverables to determine domains
  const goalLower = projectGoal.toLowerCase();
  const deliverablesText = deliverables.join(' ').toLowerCase();
  const allText = (goalLower + ' ' + deliverablesText).toLowerCase();
  
  // Domain detection
  if (allText.includes('search') || allText.includes('filter') || allText.includes('query')) {
    analysis.domains.push('search');
  }
  if (allText.includes('api') || allText.includes('endpoint') || allText.includes('backend')) {
    analysis.domains.push('backend');
  }
  if (allText.includes('ui') || allText.includes('frontend') || allText.includes('react') || allText.includes('interface')) {
    analysis.domains.push('frontend');
  }
  if (allText.includes('test') || allText.includes('coverage') || allText.includes('qa')) {
    analysis.domains.push('testing');
  }
  if (allText.includes('database') || allText.includes('sql') || allText.includes('migration')) {
    analysis.domains.push('database');
  }
  if (allText.includes('performance') || allText.includes('slow') || allText.includes('optimize')) {
    analysis.domains.push('performance');
  }
  if (allText.includes('security') || allText.includes('auth') || allText.includes('vulnerability')) {
    analysis.domains.push('security');
  }
  if (allText.includes('deploy') || allText.includes('ci/cd') || allText.includes('infrastructure')) {
    analysis.domains.push('devops');
  }
  if (allText.includes('bug') || allText.includes('fix') || allText.includes('debug') || allText.includes('error')) {
    analysis.domains.push('debugging');
  }
  
  // Complexity analysis
  const complexityIndicators = constraints.length + deliverables.length;
  if (complexityIndicators > 6 || allText.includes('scalab') || allText.includes('enterprise')) {
    analysis.complexity = 'high';
  } else if (complexityIndicators < 3) {
    analysis.complexity = 'low';
  }
  
  // Risk analysis
  if (allText.includes('legacy') || allText.includes('refactor') || allText.includes('migration')) {
    analysis.risks.push('Legacy code complexity');
  }
  if (allText.includes('performance') || allText.includes('scale')) {
    analysis.risks.push('Performance requirements');
  }
  if (constraints.some(c => c.toLowerCase().includes('no breaking'))) {
    analysis.risks.push('Backwards compatibility constraints');
  }
  
  // Select agents based on analysis (enhanced with codebase insights if available)
  const codebaseInsights = projectData.codebaseAnalysis || null;
  const selectedAgents = selectOptimalAgents(projectType, analysis, codebaseInsights);
  
  return {
    analysis: {
      complexity: analysis.complexity,
      primaryDomains: analysis.domains.slice(0, 3),
      risks: analysis.risks,
      teamSize: selectedAgents.length,
      estimatedDuration: getEstimatedDuration(analysis.complexity, analysis.domains.length)
    },
    agents: selectedAgents,
    reasoning: generateReasoning(projectType, analysis, selectedAgents, codebaseInsights)
  };
}

function selectOptimalAgents(projectType, analysis, codebaseInsights = null) {
  // Define agents according to tmux orchestrator documentation patterns
  const orchestratorAgents = [
    { id: 'orchestrator', name: 'Orchestrator', role: 'High-level coordination without implementation details', icon: '👑', required: true }
  ];
  
  const projectManagerAgents = [
    { id: 'project-manager', name: 'Project Manager', role: 'Quality-focused team coordination, meticulous testing', icon: '📋', required: false }
  ];
  
  const developerAgents = [
    { id: 'developer', name: 'Developer', role: 'Implementation and technical decisions', icon: '👨‍💻', required: false },
    { id: 'frontend-dev', name: 'Frontend Developer', role: 'UI/UX implementation', icon: '🎨', required: false },
    { id: 'backend-dev', name: 'Backend Developer', role: 'API and server logic', icon: '⚙️', required: false }
  ];
  
  const qaAgents = [
    { id: 'qa-engineer', name: 'QA Engineer', role: 'Testing and verification', icon: '✅', required: false }
  ];
  
  const devopsAgents = [
    { id: 'devops', name: 'DevOps Engineer', role: 'Infrastructure and deployment', icon: '🚀', required: false }
  ];
  
  const codeReviewAgents = [
    { id: 'code-reviewer', name: 'Code Reviewer', role: 'Security and best practices', icon: '🔍', required: false }
  ];
  
  const researchAgents = [
    { id: 'researcher', name: 'Researcher', role: 'Technology evaluation', icon: '🔬', required: false }
  ];
  
  const docAgents = [
    { id: 'doc-writer', name: 'Documentation Writer', role: 'Technical documentation', icon: '📝', required: false }
  ];
  
  const selected = [];
  
  // Step 1: Always include Orchestrator (required according to documentation)
  selected.push(...orchestratorAgents);
  
  // Step 2: Apply tmux orchestrator rules for team composition
  // Enhanced with codebase insights
  
  // Adjust complexity based on codebase analysis
  let adjustedComplexity = analysis.complexity;
  if (codebaseInsights) {
    if (projectType === 'fix') {
      // For fix projects, consider code quality and issues found
      if (codebaseInsights.analysis.issuesFound > 15 || codebaseInsights.analysis.codeQuality === 'low') {
        adjustedComplexity = 'high';
      } else if (codebaseInsights.analysis.issuesFound > 8) {
        adjustedComplexity = 'medium';
      }
    } else {
      // For new projects, consider recommended features
      const totalFeatures = (codebaseInsights.recommendations.essential?.length || 0) + 
                           (codebaseInsights.recommendations.optional?.length || 0);
      if (totalFeatures > 12) {
        adjustedComplexity = 'high';
      } else if (totalFeatures > 8) {
        adjustedComplexity = 'medium';
      }
    }
  }
  
  // Small Project: 1 Developer + 1 PM (if needed)
  if (adjustedComplexity === 'low' || analysis.domains.length <= 2) {
    selected.push(projectManagerAgents[0]);
    selected.push(developerAgents[0]);
    return selected;
  }
  
  // Medium Project: 2 Developers + 1 PM + 1 QA  
  if (adjustedComplexity === 'medium' || analysis.domains.length <= 4) {
    selected.push(projectManagerAgents[0]);
    
    // Select 2 developers based on domains
    if (analysis.domains.includes('frontend')) {
      selected.push(developerAgents[1]); // Frontend Developer
    }
    if (analysis.domains.includes('backend') || analysis.domains.includes('search') || analysis.domains.includes('database')) {
      selected.push(developerAgents[2]); // Backend Developer
    }
    
    // Fill with general developer if needed
    if (selected.filter(a => a.role.includes('Developer')).length < 2) {
      selected.push(developerAgents[0]);
    }
    
    selected.push(qaAgents[0]);
    return selected;
  }
  
  // Large Project: Lead + 2 Devs + PM + QA + DevOps
  if (adjustedComplexity === 'high' || analysis.domains.length > 4) {
    selected.push(projectManagerAgents[0]); // PM acts as Lead
    
    // Add specialized developers
    if (analysis.domains.includes('frontend')) {
      selected.push(developerAgents[1]);
    }
    if (analysis.domains.includes('backend') || analysis.domains.includes('search') || analysis.domains.includes('database')) {
      selected.push(developerAgents[2]);
    }
    
    // Add general developer if we don't have 2 specialists
    if (selected.filter(a => a.role.includes('Developer')).length < 2) {
      selected.push(developerAgents[0]);
    }
    
    selected.push(qaAgents[0]);
    selected.push(devopsAgents[0]);
    
    // Add additional specialists based on specific needs
    if (analysis.domains.includes('security') || analysis.risks.includes('Security')) {
      selected.push(codeReviewAgents[0]);
    }
    
    return selected;
  }
  
  return selected;
}

function getEstimatedDuration(complexity, domainCount) {
  const baseHours = { low: 8, medium: 24, high: 48 };
  const domainMultiplier = Math.max(1, domainCount * 0.5);
  return Math.round(baseHours[complexity] * domainMultiplier);
}

function generateReasoning(projectType, analysis, selectedAgents, codebaseInsights = null) {
  const reasons = [];
  
  // Explain team composition based on tmux orchestrator documentation rules
  if (analysis.complexity === 'low' || analysis.domains.length <= 2) {
    reasons.push(`🏗️ Small Project Structure: Applied tmux orchestrator rules for simple projects.`);
    reasons.push(`👑 Orchestrator: Required for all projects - maintains high-level oversight without implementation details.`);
    reasons.push(`📋 Project Manager: Ensures quality standards and coordinates the development team.`);
    reasons.push(`👨‍💻 Developer: Handles implementation and technical decisions for the project scope.`);
  } else if (analysis.complexity === 'medium' || analysis.domains.length <= 4) {
    reasons.push(`🏗️ Medium Project Structure: 2 Developers + PM + QA following tmux orchestrator patterns.`);
    reasons.push(`👑 Orchestrator: Required coordination role - monitors all agents and makes architectural decisions.`);
    reasons.push(`📋 Project Manager: Meticulous about testing and verification, enforces quality standards.`);
    
    const devCount = selectedAgents.filter(a => a.role.includes('Developer')).length;
    if (devCount >= 2) {
      reasons.push(`👨‍💻 Two specialized developers: Frontend and backend specialists based on identified domains (${analysis.domains.join(', ')}).`);
    }
    reasons.push(`✅ QA Engineer: Essential for medium complexity projects to ensure comprehensive testing.`);
  } else {
    reasons.push(`🏗️ Large Project Structure: Lead + Multiple Devs + PM + QA + DevOps for high complexity.`);
    reasons.push(`👑 Orchestrator: Critical oversight role - coordinates between multiple teams without getting into implementation.`);
    reasons.push(`📋 Project Manager: Acts as lead coordinator, ensuring quality and managing complex team communication.`);
    reasons.push(`👨‍💻 Specialized Development Team: Multiple developers with domain expertise for comprehensive coverage.`);
    reasons.push(`✅ QA Engineer: Mandatory for large projects to maintain quality standards.`);
    reasons.push(`🚀 DevOps Engineer: Required for high complexity projects to handle infrastructure and deployment.`);
  }
  
  // Communication pattern explanation
  if (selectedAgents.length > 3) {
    reasons.push(`📡 Hub-and-Spoke Communication: PM coordinates all developer communication to prevent n² complexity growth.`);
  }
  
  // Domain-specific reasoning
  if (analysis.domains.includes('search') || analysis.domains.includes('database')) {
    reasons.push(`🔍 Backend Specialist: Selected for search/database optimization expertise.`);
  }
  
  if (analysis.domains.includes('frontend')) {
    reasons.push(`🎨 Frontend Specialist: UI/UX implementation for user-facing components.`);
  }
  
  if (analysis.domains.includes('security')) {
    reasons.push(`🔒 Security Review: Code reviewer added for security vulnerability assessment.`);
  }
  
  // Codebase-specific insights
  if (codebaseInsights) {
    if (projectType === 'fix') {
      reasons.push(`🔍 Codebase Analysis: Found ${codebaseInsights.analysis.issuesFound} issues in ${codebaseInsights.analysis.projectSize} project with ${codebaseInsights.analysis.codeQuality} code quality.`);
      reasons.push(`🛠️ Tech Stack: Working with ${codebaseInsights.techStack.primary.join(', ')} - team selected for specific technology expertise.`);
    } else {
      const totalFeatures = (codebaseInsights.recommendations.essential?.length || 0) + 
                           (codebaseInsights.recommendations.optional?.length || 0);
      reasons.push(`✨ Feature Analysis: Recommended ${codebaseInsights.recommendations.essential?.length || 0} essential and ${codebaseInsights.recommendations.optional?.length || 0} optional features (${totalFeatures} total).`);
      reasons.push(`🏗️ Architecture: ${codebaseInsights.analysis.architecture} pattern recommended with ${codebaseInsights.techStack.recommended.join(', ')} stack.`);
    }
  }
  
  // Quality assurance emphasis from documentation
  reasons.push(`💎 Quality Focus: All agents follow tmux orchestrator principles - no shortcuts, comprehensive testing, architectural consistency.`);
  
  return reasons;
}

function getProjectTemplates() {
  return {
    fix: {
      searchFix: {
        name: 'Fix Search Functionality',
        goal: 'Fix search to properly filter results from database',
        constraints: [
          'Use existing database schema',
          'Maintain backwards compatibility',
          'Keep response time under 200ms',
          'Write comprehensive tests'
        ],
        deliverables: [
          'Working search with proper filtering',
          'Fixed API endpoint integration',
          'Test coverage above 65%',
          'Updated documentation'
        ]
      },
      performanceFix: {
        name: 'Fix Performance Issues',
        goal: 'Optimize application performance and reduce load times',
        constraints: [
          'No breaking changes',
          'Maintain current functionality',
          'Target 50% performance improvement',
          'Document all optimizations'
        ],
        deliverables: [
          'Identified performance bottlenecks',
          'Optimized database queries',
          'Improved caching strategy',
          'Performance monitoring dashboard'
        ]
      }
    },
    new: {
      webApp: {
        name: 'New Web Application',
        goal: 'Build a modern web application with full stack',
        constraints: [
          'Use React for frontend',
          'Node.js/Express backend',
          'PostgreSQL database',
          'Deploy to cloud platform'
        ],
        deliverables: [
          'Complete frontend application',
          'RESTful API backend',
          'Database schema and migrations',
          'Authentication system',
          'Deployment pipeline'
        ]
      },
      api: {
        name: 'New API Service',
        goal: 'Create a scalable API service',
        constraints: [
          'RESTful design principles',
          'JWT authentication',
          'Rate limiting',
          'Comprehensive documentation'
        ],
        deliverables: [
          'API endpoints implementation',
          'Authentication/authorization',
          'API documentation',
          'Integration tests',
          'Client SDKs'
        ]
      }
    }
  };
}