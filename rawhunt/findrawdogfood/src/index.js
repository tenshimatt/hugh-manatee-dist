import { rateLimiter, RateLimitError } from './utils/rate-limiter.js';
import { apiMonitor } from './utils/api-monitor.js';
import { cacheManager } from './utils/cache-manager.js';
import { apiCostTracker } from './utils/api-cost-tracker.js';

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // Initialize cache manager with KV namespace
      if (env.VOICE_TRANSCRIPTS) {
        cacheManager.kv = env.VOICE_TRANSCRIPTS;
      }
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    
    // Voice processing endpoint
    if (url.pathname === '/voice' && request.method === 'POST') {
      try {
        console.log('🎤 Voice request received');
        
        const audioData = await request.arrayBuffer();
        console.log(`📥 Received audio: ${audioData.byteLength} bytes`);
        
        // Speech to text
        const transcription = await speechToText(audioData, env);
        console.log(`🎤 Transcription: ${transcription}`);
        
        // Send to Claude with fixed API call
        const claudeResponse = await callClaude(transcription, env);
        console.log(`🧠 Claude response: ${claudeResponse.slice(0, 100)}...`);
        
        // Text to speech
        const audioResponse = await textToSpeech(claudeResponse, env);
        console.log(`🔊 Audio response: ${audioResponse.byteLength} bytes`);
        
        return new Response(audioResponse, {
          headers: { 
            'Content-Type': 'audio/mpeg',
            'X-Transcript': transcription,
            ...corsHeaders
          }
        });
        
      } catch (error) {
        console.error('❌ Voice processing error:', error);
        return new Response(JSON.stringify({ 
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // Voice interface (keeping existing working UI)
    if (url.pathname === '/voice-ui' || url.pathname === '/voice-test') {
      return new Response(`<!DOCTYPE html>
<html>
<head>
    <title>Claude Voice Interface</title>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 20px; 
            min-height: 100vh;
            margin: 0;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.1); 
            padding: 30px; 
            border-radius: 15px; 
            backdrop-filter: blur(10px);
        }
        .success {
            background: rgba(0,255,0,0.2);
            border: 2px solid #00ff00;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            margin: 20px 0;
            font-weight: bold;
        }
        .status { 
            background: rgba(0,255,0,0.1); 
            padding: 15px; 
            border-radius: 10px; 
            margin: 20px 0; 
            text-align: center;
        }
        .status.error {
            background: rgba(255,0,0,0.1);
            border: 1px solid rgba(255,0,0,0.3);
        }
        .record-btn { 
            background: linear-gradient(45deg, #ff6b6b, #ee5a24); 
            color: white; 
            border: none; 
            padding: 20px 40px; 
            border-radius: 50px; 
            font-size: 18px; 
            cursor: pointer; 
            margin: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        .record-btn:hover {
            transform: translateY(-2px);
        }
        .record-btn.recording {
            background: linear-gradient(45deg, #ff4757, #c44569);
            animation: pulse 1.5s infinite;
        }
        .record-btn:disabled {
            background: #666;
            cursor: not-allowed;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(255, 71, 87, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0); }
        }
        .section {
            background: rgba(255,255,255,0.1); 
            padding: 15px; 
            border-radius: 10px; 
            margin: 20px 0;
            border-left: 4px solid #00d2d3;
        }
        .loading {
            display: none;
            text-align: center;
            margin: 20px 0;
        }
        .loading.active {
            display: block;
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid white;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Claude Voice Interface</h1>
        
        <div class="success">
            Voice Interface - Claude API Fixed!
        </div>
        
        <div class="status" id="status">
            <h3>Checking APIs...</h3>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
            <button class="record-btn" id="recordBtn" disabled>Start Recording</button>
            <button class="record-btn" id="stopBtn" style="display:none;">Stop Recording</button>
        </div>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Processing your voice command...</p>
        </div>
        
        <div class="section">
            <h4>What You Said:</h4>
            <p id="transcript">Click record and speak...</p>
        </div>
        
        <div class="section">
            <h4>Claude's Response:</h4>
            <p id="response">Claude will respond here...</p>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
            <button id="playResponseBtn" style="display:none; padding: 10px 20px; background: #00d2d3; color: white; border: none; border-radius: 5px; cursor: pointer;">Play Response</button>
        </div>
        
        <div class="section">
            <h4>Voice Commands to Try:</h4>
            <p>"Deploy a hello world worker"</p>
            <p>"Create a KV store for sessions"</p>
            <p>"List all my workers"</p>
            <p>"Help me debug this code"</p>
        </div>
    </div>
    
    <script>
        let mediaRecorder;
        let recordedChunks = [];
        let currentResponseAudio = null;
        
        const recordBtn = document.getElementById('recordBtn');
        const stopBtn = document.getElementById('stopBtn');
        const status = document.getElementById('status');
        const loading = document.getElementById('loading');
        const transcript = document.getElementById('transcript');
        const response = document.getElementById('response');
        const playResponseBtn = document.getElementById('playResponseBtn');
        
        // Test connection
        fetch('/health')
            .then(res => res.json())
            .then(data => {
                updateStatus('Connected!', 'All APIs ready for voice commands', false);
                setupMicrophone();
            })
            .catch(err => {
                updateStatus('Interface Ready', 'Setting up voice...', false);
                setupMicrophone();
            });
        
        function setupMicrophone() {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    setupRecording(stream);
                    updateStatus('Everything Ready!', 'Click "Start Recording" and speak to Claude', false);
                    recordBtn.disabled = false;
                })
                .catch(err => {
                    updateStatus('Microphone Needed', 'Please allow microphone access', true);
                });
        }
        
        function setupRecording(stream) {
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
                recordedChunks = [];
                sendAudioToClaude(audioBlob);
            };
        }
        
        recordBtn.addEventListener('click', startRecording);
        stopBtn.addEventListener('click', stopRecording);
        
        function startRecording() {
            recordedChunks = [];
            mediaRecorder.start();
            
            recordBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            stopBtn.classList.add('recording');
            
            updateStatus('Recording...', 'Speak your command now!', false);
            transcript.textContent = 'Listening...';
        }
        
        function stopRecording() {
            mediaRecorder.stop();
            
            stopBtn.style.display = 'none';
            recordBtn.style.display = 'inline-block';
            stopBtn.classList.remove('recording');
            
            updateStatus('Processing...', 'Sending to Claude...', false);
            loading.classList.add('active');
        }
        
        async function sendAudioToClaude(audioBlob) {
            try {
                const response_fetch = await fetch('/voice', {
                    method: 'POST',
                    body: audioBlob
                });
                
                if (response_fetch.ok) {
                    const audioResponseBlob = await response_fetch.blob();
                    const transcriptText = response_fetch.headers.get('X-Transcript') || 'Voice processed';
                    
                    transcript.textContent = transcriptText;
                    
                    // Create audio for Claude's response
                    currentResponseAudio = URL.createObjectURL(audioResponseBlob);
                    playResponseBtn.style.display = 'inline-block';
                    
                    // Auto-play Claude's response
                    const audio = new Audio(currentResponseAudio);
                    audio.play();
                    
                    updateStatus('Success!', 'Claude responded!', false);
                    response.textContent = 'Claude has responded via audio. Click "Play Response" to hear again.';
                    
                } else {
                    const errorText = await response_fetch.text();
                    let errorData;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch {
                        errorData = { error: errorText };
                    }
                    throw new Error(errorData.error || 'API Error: ' + response_fetch.status);
                }
                
            } catch (error) {
                updateStatus('Error', error.message, true);
                response.textContent = 'Error: ' + error.message;
            } finally {
                loading.classList.remove('active');
            }
        }
        
        playResponseBtn.addEventListener('click', () => {
            if (currentResponseAudio) {
                const audio = new Audio(currentResponseAudio);
                audio.play();
            }
        });
        
        function updateStatus(title, message, isError) {
            status.className = isError ? 'status error' : 'status';
            status.innerHTML = '<h3>' + title + '</h3><p>' + message + '</p>';
        }
    </script>
</body>
</html>`, { 
        headers: { 'Content-Type': 'text/html', ...corsHeaders }
      });
    }
    
    // API monitoring dashboard
    if (url.pathname === '/monitor' || url.pathname === '/api-monitor') {
      try {
        // Get real-time costs for dashboard
        apiCostTracker.integrateWithMonitor(apiMonitor);
        const realTimeCosts = await apiCostTracker.getAllCosts(env);
        
        const html = apiMonitor.generateDashboardHTML(realTimeCosts);
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders }
        });
      } catch (error) {
        console.warn('Failed to fetch real-time costs for dashboard:', error.message);
        const html = apiMonitor.generateDashboardHTML();
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders }
        });
      }
    }
    
    // API usage stats endpoint
    if (url.pathname === '/api/usage') {
      const report = apiMonitor.getUsageReport();
      return new Response(JSON.stringify(report, null, 2), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Cache stats endpoint
    if (url.pathname === '/api/cache') {
      const cacheStats = cacheManager.getStats();
      const cacheConfig = cacheManager.getConfig();
      return new Response(JSON.stringify({ stats: cacheStats, config: cacheConfig }, null, 2), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Test API usage simulation
    if (url.pathname === '/test-usage') {
      // Simulate some API usage for testing
      apiMonitor.recordUsage('openai_whisper', { requests: 1, minutes: 0.5 });
      apiMonitor.recordUsage('anthropic_claude', { requests: 1, tokens: 100, inputTokens: 70, outputTokens: 30 });
      apiMonitor.recordUsage('elevenlabs_tts', { requests: 1, characters: 50 });
      apiMonitor.recordUsage('google_places', { requests: 1 });
      
      return new Response(JSON.stringify({
        message: 'Test usage recorded',
        instructions: 'Check /health or /api/costs to see updated costs'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Real-time costs endpoint
    if (url.pathname === '/api/costs') {
      try {
        // Integrate with existing monitor
        apiCostTracker.integrateWithMonitor(apiMonitor);
        
        // Get real-time costs from all APIs
        const allCosts = await apiCostTracker.getAllCosts(env);
        
        return new Response(JSON.stringify(allCosts, null, 2), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch costs', 
          message: error.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // Health check
    if (url.pathname === '/health') {
      const report = apiMonitor.getUsageReport();
      
      // Get real-time costs for health check
      let realTimeCosts = null;
      try {
        apiCostTracker.integrateWithMonitor(apiMonitor);
        realTimeCosts = await apiCostTracker.getAllCosts(env);
      } catch (error) {
        console.warn('Failed to fetch real-time costs for health check:', error.message);
      }
      
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        costs: {
          daily: report.summary.totalDailyCost,
          monthly: report.summary.totalMonthlyCost,
          realTime: realTimeCosts?.totalCost || 0,
          lastUpdated: realTimeCosts?.lastUpdated
        },
        alerts: report.alerts.length
      }), { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Homepage
    return new Response(`<!DOCTYPE html>
<html>
<head>
    <title>FindRawDogFood API Dashboard</title>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.1); 
            padding: 30px; 
            border-radius: 15px; 
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        h1 { 
            text-align: center; 
            margin-bottom: 30px; 
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .section {
            background: rgba(255,255,255,0.1);
            margin: 20px 0;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #00d2d3;
        }
        .section h2 {
            margin-top: 0;
            color: #00d2d3;
            font-size: 1.4em;
        }
        .link-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .link-item {
            background: rgba(255,255,255,0.2);
            padding: 15px;
            border-radius: 8px;
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.3);
        }
        .link-item:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .link-item a {
            color: white;
            text-decoration: none;
            font-weight: 500;
            display: block;
            font-size: 1.1em;
        }
        .link-item .description {
            font-size: 0.9em;
            opacity: 0.8;
            margin-top: 5px;
        }
        .primary {
            background: rgba(0,210,211,0.3);
            border-color: #00d2d3;
        }
        .api {
            background: rgba(255,107,107,0.3);
            border-color: #ff6b6b;
        }
        .test {
            background: rgba(255,206,84,0.3);
            border-color: #ffce54;
        }
        .status {
            text-align: center;
            padding: 15px;
            background: rgba(0,255,0,0.2);
            border: 1px solid #00ff00;
            border-radius: 8px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>FindRawDogFood API Dashboard</h1>
        
        <div class="status">
            <strong>System Status: Online</strong> - All services ready
        </div>
        
        <div class="section">
            <h2>Main Interface</h2>
            <div class="link-grid">
                <div class="link-item primary">
                    <a href="/voice-ui">Voice Interface</a>
                    <div class="description">Interactive voice commands with Claude AI</div>
                </div>
                <div class="link-item primary">
                    <a href="/monitor">API Usage Monitor</a>
                    <div class="description">Real-time dashboard with costs and usage stats</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>API Endpoints (JSON)</h2>
            <div class="link-grid">
                <div class="link-item api">
                    <a href="/health">Health Check</a>
                    <div class="description">System status and cost summary</div>
                </div>
                <div class="link-item api">
                    <a href="/api/usage">Usage Statistics</a>
                    <div class="description">Detailed API usage metrics and projections</div>
                </div>
                <div class="link-item api">
                    <a href="/api/costs">Real-time Costs</a>
                    <div class="description">Live cost tracking from all API providers</div>
                </div>
                <div class="link-item api">
                    <a href="/api/cache">Cache Performance</a>
                    <div class="description">Cache hit rates and cost savings</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>Testing & Development</h2>
            <div class="link-grid">
                <div class="link-item test">
                    <a href="/test-usage">Simulate API Usage</a>
                    <div class="description">Generate test data to see monitoring in action</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>System Features</h2>
            <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Rate Limiting:</strong> Prevents API quota exhaustion</li>
                <li><strong>Cost Monitoring:</strong> Real-time tracking and alerts</li>
                <li><strong>Smart Caching:</strong> Reduces API costs automatically</li>
                <li><strong>Security:</strong> Environment variable protection</li>
                <li><strong>Voice Interface:</strong> Speech-to-text with Claude AI</li>
            </ul>
        </div>
    </div>
</body>
</html>`, { 
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders }
    });
    
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

async function speechToText(audioData, env) {
  // Try cache first
  const cachedResult = await cacheManager.cacheWhisperResult(
    audioData, 
    async () => {
      // Check rate limit before making request
      try {
        await rateLimiter.checkLimit('openai_whisper');
      } catch (error) {
        if (error instanceof RateLimitError) {
          console.log(`⏳ OpenAI rate limit: ${error.message}`);
          await rateLimiter.waitForAvailability('openai_whisper');
        } else {
          throw error;
        }
      }

      const formData = new FormData();
      formData.append('file', new Blob([audioData], { type: 'audio/webm' }), 'audio.webm');
      formData.append('model', 'whisper-1');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`
        },
        body: formData
      });
      
      // Record usage after successful request
      rateLimiter.recordUsage('openai_whisper');
      
      // Monitor API usage and costs
      const audioLengthMinutes = audioData.byteLength / (16000 * 2 * 60); // Rough estimate
      apiMonitor.recordUsage('openai_whisper', { 
        requests: 1, 
        minutes: audioLengthMinutes 
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper API failed (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      return result.text;
    }
  );
  
  return cachedResult;
}

async function callClaude(message, env) {
  // Check rate limit before making request
  const promptTokens = Math.ceil(message.length / 4); // Rough token estimate
  const maxTokens = 150;
  
  try {
    await rateLimiter.checkLimit('anthropic_claude', { 
      tokens: promptTokens + maxTokens 
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log(`⏳ Claude rate limit: ${error.message}`);
      await rateLimiter.waitForAvailability('anthropic_claude');
    } else {
      throw error;
    }
  }

  // Fixed Claude API call with correct format
  const requestBody = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: maxTokens,
    messages: [{ 
      role: 'user', 
      content: `Voice command: "${message}"\n\nYou are a helpful Cloudflare development assistant. Respond conversationally in under 25 words for voice output.` 
    }]
  };
  
  console.log('🧠 Calling Claude API...');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Claude API error:', response.status, errorText);
    throw new Error(`Claude API failed (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  console.log('✅ Claude response received');
  
  // Record actual token usage from response
  const actualTokens = data.usage ? 
    (data.usage.input_tokens + data.usage.output_tokens) : 
    (promptTokens + maxTokens);
  
  rateLimiter.recordUsage('anthropic_claude', { tokens: actualTokens });
  
  // Monitor API usage and costs
  const inputTokens = data.usage?.input_tokens || promptTokens;
  const outputTokens = data.usage?.output_tokens || maxTokens;
  apiMonitor.recordUsage('anthropic_claude', { 
    requests: 1,
    tokens: actualTokens,
    inputTokens: inputTokens,
    outputTokens: outputTokens
  });
  
  return data.content[0].text;
}

async function textToSpeech(text, env) {
  const processedText = text.length > 150 ? text.substring(0, 150) + "..." : text;
  const charCount = processedText.length;
  
  const voiceSettings = {
    stability: 0.5,
    similarity_boost: 0.5
  };
  
  // Try cache first
  const cachedResult = await cacheManager.cacheTTSAudio(
    processedText,
    voiceSettings,
    async () => {
      // Check rate limit before making request
      try {
        await rateLimiter.checkLimit('elevenlabs_tts', { 
          characters: charCount 
        });
      } catch (error) {
        if (error instanceof RateLimitError) {
          console.log(`⏳ ElevenLabs rate limit: ${error.message}`);
          await rateLimiter.waitForAvailability('elevenlabs_tts');
        } else {
          throw error;
        }
      }

      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: processedText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: voiceSettings
        })
      });
      
      // Record usage after successful request
      rateLimiter.recordUsage('elevenlabs_tts', { characters: charCount });
      
      // Monitor API usage and costs
      apiMonitor.recordUsage('elevenlabs_tts', { 
        requests: 1,
        characters: charCount
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API failed (${response.status}): ${errorText}`);
      }
      
      return await response.arrayBuffer();
    }
  );
  
  return cachedResult;
}
