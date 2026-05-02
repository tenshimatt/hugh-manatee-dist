// Automagic Console — Express server with API routes and SSE
const express = require('express');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { getDb } = require('./lib/db');
const { search } = require('./lib/search');
const n8n = require('./lib/n8n-reader');
const { runFullIndex } = require('./indexer');

const app = express();
const PORT = process.env.PORT || 3100;

// SSE clients
const sseClients = new Set();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --------------- API Routes ---------------

// Dashboard stats
app.get('/api/stats', (req, res) => {
  const db = getDb();
  const hours = parseInt(req.query.hours) || 24;

  const transcriptionCount = db.prepare('SELECT COUNT(*) as cnt FROM transcriptions').get().cnt;
  const issueCount = db.prepare('SELECT COUNT(*) as cnt FROM plane_issues').get().cnt;
  const projectCount = db.prepare('SELECT COUNT(*) as cnt FROM plane_projects').get().cnt;
  const linkCount = db.prepare('SELECT COUNT(*) as cnt FROM transcription_issue_links').get().cnt;

  const execStats = n8n.getExecutionStats(hours);
  const lastExec = n8n.getLastExecution();
  const wfBreakdown = n8n.getWorkflowBreakdown(hours);

  // Recent activity — last 20 transcriptions and issues interleaved
  const recentTranscriptions = db.prepare(
    'SELECT id, filepath, title, date, time, project_folder, classification FROM transcriptions ORDER BY date DESC, time DESC LIMIT 10'
  ).all();

  const recentIssues = db.prepare(`
    SELECT i.id, i.project_id, i.name, i.state_name, i.state_group, i.priority, i.created_at,
           p.name as project_name, p.identifier as project_identifier
    FROM plane_issues i
    LEFT JOIN plane_projects p ON p.id = i.project_id
    ORDER BY i.created_at DESC LIMIT 10
  `).all();

  // Project distribution
  const projectDist = db.prepare(`
    SELECT project_folder, COUNT(*) as cnt
    FROM transcriptions
    WHERE project_folder IS NOT NULL
    GROUP BY project_folder
    ORDER BY cnt DESC
  `).all();

  // Classification breakdown (legacy — WF-2 classifier field; kept for compatibility)
  const classDist = db.prepare(`
    SELECT classification, COUNT(*) as cnt
    FROM transcriptions
    WHERE classification IS NOT NULL
    GROUP BY classification
    ORDER BY cnt DESC
  `).all();

  // Top tags — expands JSON tags array and counts, excluding generic system tags.
  // This is what the UI actually shows: the semantic project/topic tags assigned by the LLM.
  let tagDist = [];
  try {
    tagDist = db.prepare(`
      SELECT je.value AS tag, COUNT(*) AS cnt
      FROM transcriptions, json_each(transcriptions.tags) AS je
      WHERE transcriptions.tags IS NOT NULL
        AND je.value NOT IN ('voice-note', 'plaud', 'local-drop', 'recording', 'auto-summary', 'transcript', 'note')
      GROUP BY je.value
      ORDER BY cnt DESC
      LIMIT 12
    `).all();
  } catch (e) {
    // tags column may not be JSON on older rows — ignore
  }

  res.json({
    counts: { transcriptions: transcriptionCount, issues: issueCount, projects: projectCount, links: linkCount },
    pipeline: { stats: execStats, lastExecution: lastExec, workflows: wfBreakdown },
    recent: { transcriptions: recentTranscriptions, issues: recentIssues },
    distributions: { projects: projectDist, classifications: classDist, tags: tagDist },
  });
});

// Transcriptions list with filtering
app.get('/api/transcriptions', (req, res) => {
  const db = getDb();
  const { project, dateFrom, dateTo, tag, classification, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE 1=1';
  const params = [];

  if (project) { where += ' AND project_folder = ?'; params.push(project); }
  if (dateFrom) { where += ' AND date >= ?'; params.push(dateFrom); }
  if (dateTo) { where += ' AND date <= ?'; params.push(dateTo); }
  if (tag) { where += ' AND tags LIKE ?'; params.push(`%"${tag}"%`); }
  if (classification) { where += ' AND classification = ?'; params.push(classification); }

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM transcriptions ${where}`).get(...params).cnt;

  const rows = db.prepare(`
    SELECT id, filepath, title, date, time, duration_mins, tags, project_folder,
           classification, executive_summary, file_size_bytes
    FROM transcriptions ${where}
    ORDER BY date DESC, time DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ total, page: parseInt(page), limit: parseInt(limit), results: rows });
});

// Single transcription detail
app.get('/api/transcriptions/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM transcriptions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });

  // Get linked issues
  const links = db.prepare(`
    SELECT l.confidence, l.link_method, i.id, i.project_id, i.name, i.state_name, i.state_group, i.priority,
           p.name as project_name, p.identifier as project_identifier
    FROM transcription_issue_links l
    JOIN plane_issues i ON i.id = l.issue_id
    LEFT JOIN plane_projects p ON p.id = i.project_id
    WHERE l.transcription_id = ?
    ORDER BY l.confidence DESC
  `).all(req.params.id);

  res.json({ ...row, linked_issues: links });
});

// Filter options
app.get('/api/filters', (req, res) => {
  const db = getDb();

  const projects = db.prepare(
    'SELECT DISTINCT project_folder FROM transcriptions WHERE project_folder IS NOT NULL ORDER BY project_folder'
  ).all().map(r => r.project_folder);

  const tags = new Set();
  const tagRows = db.prepare('SELECT tags FROM transcriptions WHERE tags IS NOT NULL').all();
  for (const row of tagRows) {
    try {
      const arr = JSON.parse(row.tags);
      arr.forEach(t => tags.add(t));
    } catch (e) { /* skip */ }
  }

  const classifications = db.prepare(
    'SELECT DISTINCT classification FROM transcriptions WHERE classification IS NOT NULL ORDER BY classification'
  ).all().map(r => r.classification);

  const dateRange = db.prepare(
    'SELECT MIN(date) as min_date, MAX(date) as max_date FROM transcriptions'
  ).get();

  res.json({
    projects,
    tags: [...tags].sort(),
    classifications,
    dateRange,
  });
});

// Search
app.get('/api/search', (req, res) => {
  const { q, source, project, dateFrom, dateTo, tag, classification, limit } = req.query;
  if (!q) return res.json({ transcriptions: [], issues: [] });

  const results = search(q, {
    source: source || 'all',
    project, dateFrom, dateTo, tag, classification,
    limit: parseInt(limit) || 50,
  });

  res.json(results);
});

// Plane projects list
app.get('/api/projects', (req, res) => {
  const db = getDb();
  const projects = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM transcriptions t WHERE t.project_folder = p.name) as transcription_count
    FROM plane_projects p
    ORDER BY p.total_issues DESC
  `).all();

  res.json(projects);
});

// Single project detail with issues
app.get('/api/projects/:id', (req, res) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM plane_projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });

  const issues = db.prepare(`
    SELECT * FROM plane_issues
    WHERE project_id = ?
    ORDER BY
      CASE state_group
        WHEN 'started' THEN 1
        WHEN 'unstarted' THEN 2
        WHEN 'backlog' THEN 3
        WHEN 'completed' THEN 4
        WHEN 'cancelled' THEN 5
        ELSE 6
      END,
      sequence_id DESC
  `).all(req.params.id);

  // Get transcriptions that match this project name
  const transcriptions = db.prepare(`
    SELECT id, filepath, title, date, time, duration_mins, classification, executive_summary
    FROM transcriptions
    WHERE project_folder = ?
    ORDER BY date DESC, time DESC
  `).all(project.name);

  // Get correlation links for these transcriptions
  const tIds = transcriptions.map(t => t.id);
  let links = [];
  if (tIds.length > 0) {
    links = db.prepare(`
      SELECT * FROM transcription_issue_links
      WHERE transcription_id IN (${tIds.map(() => '?').join(',')})
    `).all(...tIds);
  }

  res.json({ project, issues, transcriptions, links });
});

// Pipeline executions
app.get('/api/pipeline', (req, res) => {
  const { limit = 50 } = req.query;
  const executions = n8n.getRecentExecutions(parseInt(limit));
  const stats = n8n.getExecutionStats(24);
  const breakdown = n8n.getWorkflowBreakdown(24);

  res.json({ executions, stats, breakdown });
});

// --------------- Admin Routes ---------------

// Static pricing fallback for models not covered by LiteLLM's cost DB (USD per 1M tokens)
const STATIC_PRICING = {
  'deepseek/deepseek-reasoner':              { input: 0.55,  output: 2.19 },
  'gemini/gemini-2.5-pro-preview-03-25':     { input: 1.25,  output: 10.0 },
  'gemini/gemini-2.5-flash-preview-04-17':   { input: 0.15,  output: 0.60 },
  'ollama_chat/gpt-oss:20b':                 { input: 0,     output: 0    },
  'ollama_chat/qwen3:8b':                    { input: 0,     output: 0    },
  'ollama_chat/gemma4:e4b':                  { input: 0,     output: 0    },
};

const EXCLUDED_PROJECTS_PATH = path.join(__dirname, 'data', 'excluded-projects.json');

function readExcludedProjects() {
  try {
    if (fs.existsSync(EXCLUDED_PROJECTS_PATH)) {
      return JSON.parse(fs.readFileSync(EXCLUDED_PROJECTS_PATH, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return [];
}

function writeExcludedProjects(list) {
  fs.writeFileSync(EXCLUDED_PROJECTS_PATH, JSON.stringify(list, null, 2) + '\n');
}

const LLM_CONFIG_PATH = path.join(__dirname, 'data', 'llm-config.json');

function readLlmConfig() {
  try {
    if (fs.existsSync(LLM_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(LLM_CONFIG_PATH, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return null;
}

function deriveProvider(model) {
  if (!model) return null;
  if (model.startsWith('deepseek')) return 'DeepSeek';
  if (model.startsWith('anthropic') || model.includes('claude')) return 'Anthropic';
  if (model.startsWith('gpt') || model.startsWith('o3') || model.startsWith('o1')) return 'OpenAI';
  if (model.startsWith('gemini')) return 'Google';
  if (model.startsWith('ollama')) return 'Ollama';
  return 'LiteLLM';
}

// GET /api/admin/llm-config — local config takes precedence; falls back to n8n workflow parse
app.get('/api/admin/llm-config', (req, res) => {
  const saved = readLlmConfig();
  if (saved) return res.json({ provider: saved.provider, model: saved.model });

  // Fallback: parse model from rsynced n8n.sqlite
  let model = null;
  try {
    const n8nPath = path.join(__dirname, 'data', 'n8n.sqlite');
    if (fs.existsSync(n8nPath)) {
      const Database = require('better-sqlite3');
      const ndb = new Database(n8nPath, { readonly: true });
      const row = ndb.prepare(
        `SELECT nodes FROM workflow_entity WHERE name LIKE '%WF-1a%' OR name LIKE '%Transcribe%' ORDER BY updatedAt DESC LIMIT 1`
      ).get();
      ndb.close();
      if (row) {
        const nodes = JSON.parse(row.nodes);
        for (const node of nodes) {
          const body = node.parameters?.jsonBody || node.parameters?.jsCode || '';
          const match = String(body).match(/"model"\s*:\s*"([^"]+)"/);
          if (match) { model = match[1]; break; }
        }
      }
    }
  } catch (e) {
    console.warn('[admin] Could not read n8n model config:', e.message);
  }

  res.json({ provider: deriveProvider(model), model });
});

// POST /api/admin/llm-config — save provider + model selection
app.post('/api/admin/llm-config', (req, res) => {
  const { provider, model } = req.body;
  if (!provider || !model) return res.status(400).json({ error: 'provider and model required' });
  fs.writeFileSync(LLM_CONFIG_PATH, JSON.stringify({ provider, model }, null, 2) + '\n');
  console.log('[admin] LLM config saved:', { provider, model });
  res.json({ provider, model });
});

// GET /api/admin/model-pricing — fetch live costs from LiteLLM, merge static fallbacks
app.get('/api/admin/model-pricing', async (req, res) => {
  const LITELLM_URL = process.env.LITELLM_URL || 'http://10.90.10.23:4000';
  const LITELLM_KEY = process.env.LITELLM_MASTER_KEY || 'sk-admin-1234';

  // Build lookup: litellm model_name → {input, output} per 1M tokens
  const liveMap = {};
  try {
    const r = await fetch(`${LITELLM_URL}/model/info`, {
      headers: { Authorization: `Bearer ${LITELLM_KEY}` },
    });
    if (r.ok) {
      const data = await r.json();
      for (const m of data.data || []) {
        const inp = m.model_info?.input_cost_per_token;
        const out = m.model_info?.output_cost_per_token;
        if (inp != null && out != null) {
          liveMap[m.model_name] = {
            input: Math.round(inp * 1e6 * 10000) / 10000,
            output: Math.round(out * 1e6 * 10000) / 10000,
            source: 'litellm',
          };
        }
      }
    }
  } catch (e) {
    console.warn('[admin] LiteLLM pricing fetch failed:', e.message);
  }

  // For each model in our UI: try exact match, then openai/model fallback, then static
  const MODEL_IDS = [
    'deepseek-v4-pro', 'deepseek/deepseek-reasoner',
    'anthropic/claude-opus-4-7', 'anthropic/claude-sonnet-4-6', 'anthropic/claude-haiku-4-5-20251001',
    'gpt-4o', 'gpt-4o-mini', 'o3-mini',
    'gemini/gemini-2.5-pro-preview-03-25', 'gemini/gemini-2.5-flash-preview-04-17',
    'ollama_chat/gpt-oss:20b', 'ollama_chat/qwen3:8b', 'ollama_chat/gemma4:e4b',
  ];

  const result = {};
  for (const id of MODEL_IDS) {
    if (liveMap[id]) {
      result[id] = liveMap[id];
    } else if (liveMap[`openai/${id}`]) {
      result[id] = { ...liveMap[`openai/${id}`], source: 'litellm' };
    } else if (STATIC_PRICING[id]) {
      result[id] = { ...STATIC_PRICING[id], source: 'provider-docs' };
    }
  }

  res.json(result);
});

// GET /api/admin/excluded-projects
app.get('/api/admin/excluded-projects', (req, res) => {
  res.json(readExcludedProjects());
});

// POST /api/admin/excluded-projects — add an identifier
app.post('/api/admin/excluded-projects', (req, res) => {
  const { identifier } = req.body;
  if (!identifier || typeof identifier !== 'string') {
    return res.status(400).json({ error: 'identifier required' });
  }
  const list = readExcludedProjects();
  if (!list.includes(identifier)) {
    list.push(identifier);
    writeExcludedProjects(list);
    // Also remove from SQLite immediately
    try {
      const db = getDb();
      const proj = db.prepare('SELECT id FROM plane_projects WHERE identifier = ?').get(identifier);
      if (proj) {
        db.prepare('DELETE FROM plane_issues WHERE project_id = ?').run(proj.id);
        db.prepare('DELETE FROM plane_projects WHERE identifier = ?').run(identifier);
      }
    } catch (e) { /* ignore */ }
  }
  res.json(list);
});

// DELETE /api/admin/excluded-projects/:identifier — remove from exclusion list
app.delete('/api/admin/excluded-projects/:identifier', (req, res) => {
  const list = readExcludedProjects().filter(id => id !== req.params.identifier);
  writeExcludedProjects(list);
  res.json(list);
});

// SSE endpoint for live pipeline status
app.get('/api/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send initial state
  const stats = n8n.getExecutionStats(1);
  const lastExec = n8n.getLastExecution();
  res.write(`data: ${JSON.stringify({ type: 'init', stats, lastExecution: lastExec })}\n\n`);

  const client = { res };
  sseClients.add(client);

  req.on('close', () => {
    sseClients.delete(client);
  });
});

// Manual reindex trigger
app.post('/api/reindex', async (req, res) => {
  try {
    const result = await runFullIndex();
    broadcastSSE({ type: 'reindex', result });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), clients: sseClients.size });
});

// --------------- SSE Broadcasting ---------------

function broadcastSSE(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try { client.res.write(msg); } catch (e) { sseClients.delete(client); }
  }
}

// Periodic SSE heartbeat + pipeline status check (every 30s)
setInterval(() => {
  if (sseClients.size === 0) return;
  const stats = n8n.getExecutionStats(1);
  const lastExec = n8n.getLastExecution();
  broadcastSSE({ type: 'heartbeat', stats, lastExecution: lastExec, time: new Date().toISOString() });
}, 30000);

// --------------- Scheduled Indexing ---------------

// Run full index every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('[cron] Running scheduled index...');
  try {
    const result = await runFullIndex();
    broadcastSSE({ type: 'reindex', result });
  } catch (e) {
    console.error('[cron] Index failed:', e.message);
  }
});

// --------------- Upload route (audio drops) ---------------
require('./upload-route').registerUploadRoute(app);
require('./queue-route').registerQueueRoute(app);

// --------------- Start ---------------

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[server] Automagic Console listening on port ${PORT}`);

  // Run initial index on startup
  try {
    await runFullIndex();
    console.log('[server] Initial index complete');
  } catch (e) {
    console.error('[server] Initial index failed:', e.message);
  }
});
