var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-cTiWbj/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-cTiWbj/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/index.js
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (url.pathname === "/") {
      return new Response(getMainUI(), {
        headers: {
          "Content-Type": "text/html",
          ...corsHeaders
        }
      });
    }
    if (url.pathname === "/api/generate" && request.method === "POST") {
      const config = await request.json();
      const scripts = generateTmuxScripts(config);
      return new Response(JSON.stringify(scripts), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    if (url.pathname === "/api/templates") {
      return new Response(JSON.stringify(getProjectTemplates()), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    return new Response("Not Found", { status: 404 });
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
            <h1>\u{1F3AD} Tmux Orchestrator UI</h1>
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
                    <div>Agent Selection</div>
                </div>
                <div class="step" data-step="4">
                    <div class="step-number">4</div>
                    <div>Tmux Design</div>
                </div>
                <div class="step" data-step="5">
                    <div class="step-number">5</div>
                    <div>Git & Workflow</div>
                </div>
                <div class="step" data-step="6">
                    <div class="step-number">6</div>
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
                            <div class="icon">\u{1F527}</div>
                            <h3>Fix Project</h3>
                            <p>Debug, refactor, or enhance an existing codebase with specialized fix agents</p>
                        </div>
                        <div class="project-type-card" data-type="new">
                            <div class="icon">\u{1F680}</div>
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
                
                <!-- Step 3: Agent Selection -->
                <div class="step-content" data-step="3">
                    <h2>Select Agents</h2>
                    <p style="margin-bottom: 20px; color: var(--text-secondary);">
                        Choose the agents needed for your project
                    </p>
                    
                    <div class="agent-grid" id="agentGrid">
                        <!-- Agents will be populated by JavaScript -->
                    </div>
                </div>
                
                <!-- Step 4: Tmux Design -->
                <div class="step-content" data-step="4">
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
                
                <!-- Step 5: Git & Workflow -->
                <div class="step-content" data-step="5">
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
                
                <!-- Step 6: Generate -->
                <div class="step-content" data-step="6">
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
                            <button class="output-tab active" data-tab="launcher">Launcher Script</button>
                            <button class="output-tab" data-tab="project">Project Spec</button>
                            <button class="output-tab" data-tab="schedule">Schedule Script</button>
                            <button class="output-tab" data-tab="commands">Quick Commands</button>
                        </div>
                        
                        <div class="output-content">
                            <div class="output-section active" data-tab="launcher">
                                <button class="copy-btn" onclick="copyToClipboard('launcherScript')">Copy</button>
                                <pre id="launcherScript"></pre>
                            </div>
                            <div class="output-section" data-tab="project">
                                <button class="copy-btn" onclick="copyToClipboard('projectSpec')">Copy</button>
                                <pre id="projectSpec"></pre>
                            </div>
                            <div class="output-section" data-tab="schedule">
                                <button class="copy-btn" onclick="copyToClipboard('scheduleScript')">Copy</button>
                                <pre id="scheduleScript"></pre>
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
            { id: 'orchestrator', name: 'Orchestrator', role: 'High-level coordination and architecture decisions', icon: '\u{1F451}' },
            { id: 'debugger', name: 'Debug Specialist', role: 'Root cause analysis and bug fixing', icon: '\u{1F41B}' },
            { id: 'test-engineer', name: 'Test Engineer', role: 'Test creation and coverage improvement', icon: '\u{1F9EA}' },
            { id: 'refactor-specialist', name: 'Refactor Specialist', role: 'Code optimization and cleanup', icon: '\u267B\uFE0F' },
            { id: 'security-auditor', name: 'Security Auditor', role: 'Security vulnerability assessment', icon: '\u{1F512}' },
            { id: 'performance-optimizer', name: 'Performance Optimizer', role: 'Performance profiling and optimization', icon: '\u26A1' }
        ];
        
        const newAgents = [
            { id: 'orchestrator', name: 'Orchestrator', role: 'High-level coordination and architecture decisions', icon: '\u{1F451}' },
            { id: 'project-manager', name: 'Project Manager', role: 'Quality-focused team coordination', icon: '\u{1F4CB}' },
            { id: 'frontend-dev', name: 'Frontend Developer', role: 'UI/UX implementation', icon: '\u{1F3A8}' },
            { id: 'backend-dev', name: 'Backend Developer', role: 'API and server logic', icon: '\u2699\uFE0F' },
            { id: 'database-engineer', name: 'Database Engineer', role: 'Data modeling and optimization', icon: '\u{1F5C4}\uFE0F' },
            { id: 'devops', name: 'DevOps Engineer', role: 'Infrastructure and deployment', icon: '\u{1F680}' },
            { id: 'qa-engineer', name: 'QA Engineer', role: 'Testing and quality assurance', icon: '\u2705' },
            { id: 'doc-writer', name: 'Documentation Writer', role: 'Technical documentation', icon: '\u{1F4DD}' }
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
            
            agentGrid.innerHTML = agents.map(agent => \`
                <div class="agent-card" data-agent="\${agent.id}">
                    <h4>\${agent.icon} \${agent.name}</h4>
                    <p>\${agent.role}</p>
                </div>
            \`).join('');
            
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
            
            const windows = config.agents.map((agent, index) => \`
                <div class="tmux-window">
                    <div class="tmux-window-header">Window \${index}: \${agent.name}</div>
                    <div class="tmux-panes">
                        <div class="tmux-pane">
                            \${agent.icon} Claude --dangerously-skip-permissions<br>
                            > Initializing \${agent.name} agent...<br>
                            > Ready for instructions_
                        </div>
                        \${config.layout === 'even-horizontal' || config.layout === 'main-vertical' ? 
                            '<div class="tmux-pane">Shell for ' + agent.name + '<br>$ _</div>' : ''}
                    </div>
                </div>
            \`).join('');
            
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
                case 4:
                    config.statusBar = document.getElementById('statusBar').value;
                    config.colorScheme = document.getElementById('colorScheme').value;
                    break;
                case 5:
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
            if (currentStep < 6 && validateCurrentStep()) {
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
            
            if (step === 6) {
                showSummary();
            }
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
            nextBtn.style.display = currentStep < 6 ? 'block' : 'none';
        }
        
        function showSummary() {
            const summary = document.getElementById('configSummary');
            summary.innerHTML = \`
                <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 10px;">
                    <h3>Configuration Summary</h3>
                    <p><strong>Project Type:</strong> \${config.projectType === 'fix' ? '\u{1F527} Fix Project' : '\u{1F680} New Project'}</p>
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
                
                document.getElementById('launcherScript').textContent = scripts.launcher;
                document.getElementById('projectSpec').textContent = scripts.projectSpec;
                document.getElementById('scheduleScript').textContent = scripts.schedule;
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
    <\/script>
</body>
</html>`;
}
__name(getMainUI, "getMainUI");
function generateTmuxScripts(config) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const launcher = generateLauncherScript(config);
  const projectSpec = generateProjectSpec(config);
  const schedule = generateScheduleScript(config);
  const commands = generateQuickCommands(config);
  return {
    launcher,
    projectSpec,
    schedule,
    commands,
    timestamp
  };
}
__name(generateTmuxScripts, "generateTmuxScripts");
function generateLauncherScript(config) {
  const agents = config.agents || [];
  const sessionName = config.projectName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  let script = `#!/bin/bash
# Tmux Orchestrator Launcher Script
# Generated for: ${config.projectName}
# Type: ${config.projectType === "fix" ? "Fix Project" : "New Project"}
# Generated: ${(/* @__PURE__ */ new Date()).toISOString()}

PROJECT_PATH="${config.projectPath}"
SESSION_NAME="${sessionName}"

# Check if session exists
tmux has-session -t $SESSION_NAME 2>/dev/null
if [ $? != 0 ]; then
    echo "Creating new tmux session: $SESSION_NAME"
    
    # Create main session
    tmux new-session -d -s $SESSION_NAME -c "$PROJECT_PATH"
    
`;
  agents.forEach((agent, index) => {
    const windowName = agent.name.replace(/\s+/g, "-");
    script += `    # Create window for ${agent.name}
    ${index === 0 ? "# First window already exists, just rename it" : `tmux new-window -t $SESSION_NAME -n "${windowName}" -c "$PROJECT_PATH"`}
    ${index === 0 ? `tmux rename-window -t $SESSION_NAME:0 "${windowName}"` : ""}
    
    # Split pane if needed for ${config.layout} layout
    ${config.layout === "even-horizontal" ? `tmux split-window -t $SESSION_NAME:${index} -h -c "$PROJECT_PATH"` : ""}
    ${config.layout === "even-vertical" ? `tmux split-window -t $SESSION_NAME:${index} -v -c "$PROJECT_PATH"` : ""}
    
    # Start Claude agent in first pane
    tmux send-keys -t $SESSION_NAME:${index}.0 "claude --dangerously-skip-permissions" Enter
    sleep 2
    
    # Send agent briefing
    tmux send-keys -t $SESSION_NAME:${index}.0 "You are the ${agent.name} for project ${config.projectName}. ${getAgentBriefing(agent, config)}" Enter
    
`;
  });
  if (config.git.gitStatus) {
    script += `    # Create git status window
    tmux new-window -t $SESSION_NAME -n "Git-Status" -c "$PROJECT_PATH"
    tmux send-keys -t $SESSION_NAME:Git-Status "watch -n 5 'git status -s && echo && git log --oneline -5'" Enter
    
`;
  }
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
__name(generateLauncherScript, "generateLauncherScript");
function generateProjectSpec(config) {
  return `PROJECT: ${config.projectName}
TYPE: ${config.projectType === "fix" ? "FIX_PROJECT" : "NEW_PROJECT"}
PATH: ${config.projectPath}

GOAL: ${config.projectGoal}

CONSTRAINTS:
${config.constraints.map((c) => `- ${c}`).join("\n")}

DELIVERABLES:
${config.deliverables.map((d, i) => `${i + 1}. ${d}`).join("\n")}

AGENTS:
${config.agents.map((a) => `- ${a.name}: ${a.role}`).join("\n")}

GIT_CONFIGURATION:
- Auto-commit: ${config.git.autoCommit ? "Enabled (30 min)" : "Disabled"}
- Feature Branch: ${config.git.featureBranch ? "Enabled" : "Disabled"}
- Branch Name: ${config.git.branchName || "main"}
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

Generated: ${(/* @__PURE__ */ new Date()).toISOString()}`;
}
__name(generateProjectSpec, "generateProjectSpec");
function generateScheduleScript(config) {
  return `#!/bin/bash
# Schedule Script for ${config.projectName}
# Usage: ./schedule.sh

MINUTES=${config.checkInterval}
SESSION="${config.projectName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}"
TARGET="${config.emergencyWindow}"

# Create note for next check
cat > next_check_note.txt << EOF
=== Scheduled Check-in ===
Project: ${config.projectName}
Time: $(date)
Type: ${config.projectType === "fix" ? "Fix Project" : "New Project"}

Agents Active:
${config.agents.map((a) => `- ${a.name}`).join("\n")}

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
__name(generateScheduleScript, "generateScheduleScript");
function generateQuickCommands(config) {
  const sessionName = config.projectName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
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
${config.agents.map((a, i) => `tmux select-window -t ${sessionName}:${i}  # ${a.name}`).join("\n")}

# Emergency stop all agents
tmux kill-session -t ${sessionName}

# Git operations
cd ${config.projectPath} && git status
cd ${config.projectPath} && git add -A && git commit -m "${config.git.commitPrefix} Manual commit"
cd ${config.projectPath} && git push origin ${config.git.branchName || "main"}

# Monitor all agents
tmux list-panes -a -F "#{session_name}:#{window_index}.#{pane_index}: #{pane_current_command}"

# Restart specific agent
tmux respawn-pane -t ${sessionName}:0.0 -k "claude --dangerously-skip-permissions"

# Send to all agents
${config.agents.map((a, i) => `tmux send-keys -t ${sessionName}:${i} "Broadcast message" Enter`).join("\n")}`;
}
__name(generateQuickCommands, "generateQuickCommands");
function getAgentBriefing(agent, config) {
  const briefings = {
    "orchestrator": `Your role is high-level coordination. Monitor all agents, make architectural decisions, and ensure project goals are met. Focus on: ${config.projectGoal}`,
    "debugger": `You are debugging ${config.projectName}. Focus on finding and fixing bugs, especially: ${config.projectGoal}`,
    "test-engineer": `Create comprehensive tests for ${config.projectName}. Ensure ${config.constraints.includes("coverage") ? "required coverage" : "80% coverage"}.`,
    "project-manager": `Coordinate the team for ${config.projectName}. Ensure quality standards and timely delivery of: ${config.deliverables.join(", ")}`,
    "frontend-dev": `Develop the frontend for ${config.projectName}. Focus on UI/UX and user experience.`,
    "backend-dev": `Develop backend services for ${config.projectName}. Ensure scalability and performance.`,
    "devops": `Handle infrastructure and deployment for ${config.projectName}. Ensure smooth CI/CD.`,
    "qa-engineer": `Test all aspects of ${config.projectName}. Ensure quality and catch bugs early.`
  };
  return briefings[agent.id] || `You are the ${agent.name} for this project. Focus on your specialized role.`;
}
__name(getAgentBriefing, "getAgentBriefing");
function getProjectTemplates() {
  return {
    fix: {
      searchFix: {
        name: "Fix Search Functionality",
        goal: "Fix search to properly filter results from database",
        constraints: [
          "Use existing database schema",
          "Maintain backwards compatibility",
          "Keep response time under 200ms",
          "Write comprehensive tests"
        ],
        deliverables: [
          "Working search with proper filtering",
          "Fixed API endpoint integration",
          "Test coverage above 65%",
          "Updated documentation"
        ]
      },
      performanceFix: {
        name: "Fix Performance Issues",
        goal: "Optimize application performance and reduce load times",
        constraints: [
          "No breaking changes",
          "Maintain current functionality",
          "Target 50% performance improvement",
          "Document all optimizations"
        ],
        deliverables: [
          "Identified performance bottlenecks",
          "Optimized database queries",
          "Improved caching strategy",
          "Performance monitoring dashboard"
        ]
      }
    },
    new: {
      webApp: {
        name: "New Web Application",
        goal: "Build a modern web application with full stack",
        constraints: [
          "Use React for frontend",
          "Node.js/Express backend",
          "PostgreSQL database",
          "Deploy to cloud platform"
        ],
        deliverables: [
          "Complete frontend application",
          "RESTful API backend",
          "Database schema and migrations",
          "Authentication system",
          "Deployment pipeline"
        ]
      },
      api: {
        name: "New API Service",
        goal: "Create a scalable API service",
        constraints: [
          "RESTful design principles",
          "JWT authentication",
          "Rate limiting",
          "Comprehensive documentation"
        ],
        deliverables: [
          "API endpoints implementation",
          "Authentication/authorization",
          "API documentation",
          "Integration tests",
          "Client SDKs"
        ]
      }
    }
  };
}
__name(getProjectTemplates, "getProjectTemplates");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-cTiWbj/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-cTiWbj/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
