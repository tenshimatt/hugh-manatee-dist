// Periodic indexer: parse markdown files, sync Plane data, read n8n executions
const path = require('path');
const fs = require('fs');
const { getDb } = require('./lib/db');
const { parseMarkdownFile, findMarkdownFiles } = require('./lib/markdown-parser');
const { fetchProjects, fetchProjectIssues, fetchProjectStates } = require('./lib/plane-client');
const { getRecentExecutions } = require('./lib/n8n-reader');
const { correlateAll } = require('./lib/correlator');

const PLAUD_DIR = path.join(__dirname, 'data', 'plaud-notes');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Index all markdown files from PLAUD_NOTES directory
 */
function indexTranscriptions() {
  const db = getDb();
  const files = findMarkdownFiles(PLAUD_DIR);
  console.log(`[indexer] Found ${files.length} markdown files`);

  const upsert = db.prepare(`
    INSERT INTO transcriptions (id, filepath, title, date, time, duration_mins, tags,
      project_folder, classification, executive_summary, raw_transcript,
      file_size_bytes, file_mtime, indexed_at)
    VALUES (@id, @filepath, @title, @date, @time, @duration_mins, @tags,
      @project_folder, @classification, @executive_summary, @raw_transcript,
      @file_size_bytes, @file_mtime, @indexed_at)
    ON CONFLICT(id) DO UPDATE SET
      title=@title, date=@date, time=@time, duration_mins=@duration_mins,
      tags=@tags, project_folder=@project_folder, classification=@classification,
      executive_summary=@executive_summary, raw_transcript=@raw_transcript,
      file_size_bytes=@file_size_bytes, file_mtime=@file_mtime, indexed_at=@indexed_at
  `);

  // Rebuild FTS index
  const ftsDelete = db.prepare(
    "INSERT INTO transcriptions_fts(transcriptions_fts, rowid, title, executive_summary, raw_transcript) VALUES('delete', ?, ?, ?, ?)"
  );
  const ftsInsert = db.prepare(
    'INSERT INTO transcriptions_fts(rowid, title, executive_summary, raw_transcript) VALUES(?, ?, ?, ?)'
  );

  let indexed = 0;
  let errors = 0;

  const indexAll = db.transaction(() => {
    for (const filepath of files) {
      try {
        const parsed = parseMarkdownFile(filepath);
        parsed.indexed_at = new Date().toISOString();

        // Get existing row to delete old FTS entry
        const existing = db.prepare('SELECT rowid, title, executive_summary, raw_transcript FROM transcriptions WHERE id = ?').get(parsed.id);
        if (existing) {
          ftsDelete.run(existing.rowid, existing.title || '', existing.executive_summary || '', existing.raw_transcript || '');
        }

        upsert.run(parsed);

        // Insert new FTS entry
        const row = db.prepare('SELECT rowid FROM transcriptions WHERE id = ?').get(parsed.id);
        if (row) {
          ftsInsert.run(row.rowid, parsed.title || '', parsed.executive_summary || '', parsed.raw_transcript || '');
        }

        indexed++;
      } catch (e) {
        console.error(`[indexer] Error parsing ${filepath}:`, e.message);
        errors++;
      }
    }
  });

  indexAll();
  console.log(`[indexer] Indexed ${indexed} transcriptions, ${errors} errors`);
  return { indexed, errors };
}

/**
 * Sync projects and issues from Plane API
 */
async function syncPlane() {
  const db = getDb();
  const now = new Date().toISOString();

  // Load excluded project identifiers (zombie/inaccessible projects)
  let excludedIdentifiers = [];
  try {
    const excludedPath = path.join(__dirname, 'data', 'excluded-projects.json');
    if (fs.existsSync(excludedPath)) {
      excludedIdentifiers = JSON.parse(fs.readFileSync(excludedPath, 'utf8'));
    }
  } catch (e) {
    console.warn('[indexer] Could not load excluded-projects.json:', e.message);
  }

  try {
    const allProjects = await fetchProjects();
    const projects = allProjects.filter(p => !excludedIdentifiers.includes(p.identifier));
    if (allProjects.length !== projects.length) {
      console.log(`[indexer] Skipping ${allProjects.length - projects.length} excluded projects: ${excludedIdentifiers.join(', ')}`);
    }
    console.log(`[indexer] Fetched ${projects.length} Plane projects`);

    const upsertProject = db.prepare(`
      INSERT INTO plane_projects (id, identifier, name, description, total_issues, synced_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        identifier=excluded.identifier, name=excluded.name,
        description=excluded.description, total_issues=excluded.total_issues,
        synced_at=excluded.synced_at
    `);

    const upsertIssue = db.prepare(`
      INSERT INTO plane_issues (id, project_id, sequence_id, name, description_text,
        priority, state_name, state_group, parent_id, created_at, updated_at, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name, description_text=excluded.description_text,
        priority=excluded.priority, state_name=excluded.state_name,
        state_group=excluded.state_group, parent_id=excluded.parent_id,
        updated_at=excluded.updated_at, synced_at=excluded.synced_at
    `);

    // FTS for issues
    const issueFtsDelete = db.prepare(
      "INSERT INTO plane_issues_fts(plane_issues_fts, rowid, name, description_text) VALUES('delete', ?, ?, ?)"
    );
    const issueFtsInsert = db.prepare(
      'INSERT INTO plane_issues_fts(rowid, name, description_text) VALUES(?, ?, ?)'
    );

    let totalIssues = 0;

    for (const proj of projects) {
      // Fetch states for this project
      let statesMap = {};
      try {
        await sleep(500); // Rate limit protection
        const states = await fetchProjectStates(proj.id);
        for (const s of states) {
          statesMap[s.id] = { name: s.name, group: s.group };
        }
      } catch (e) {
        console.error(`[indexer] Failed to fetch states for ${proj.identifier}:`, e.message);
      }

      // Fetch all issues (cursor-based pagination)
      let cursor = null;
      let issueCount = 0;

      while (true) {
        try {
          await sleep(500); // Rate limit protection
          const data = await fetchProjectIssues(proj.id, cursor);
          const issues = data.results || data;
          if (!Array.isArray(issues) || issues.length === 0) break;

          const syncBatch = db.transaction(() => {
            for (const issue of issues) {
              const stateDetail = issue.state_detail || statesMap[issue.state] || {};
              const descText = typeof issue.description_stripped === 'string'
                ? issue.description_stripped
                : (typeof issue.description === 'string' ? issue.description : '');

              // Delete old FTS entry
              const existing = db.prepare('SELECT rowid, name, description_text FROM plane_issues WHERE id = ?').get(issue.id);
              if (existing) {
                issueFtsDelete.run(existing.rowid, existing.name || '', existing.description_text || '');
              }

              upsertIssue.run(
                issue.id, proj.id, issue.sequence_id, issue.name,
                descText.slice(0, 10000),
                issue.priority === 0 ? 'none' : issue.priority === 1 ? 'urgent' : issue.priority === 2 ? 'high' : issue.priority === 3 ? 'medium' : 'low',
                stateDetail.name || 'Unknown',
                stateDetail.group || 'unstarted',
                issue.parent || null,
                issue.created_at, issue.updated_at, now
              );

              // Insert FTS
              const row = db.prepare('SELECT rowid FROM plane_issues WHERE id = ?').get(issue.id);
              if (row) {
                issueFtsInsert.run(row.rowid, issue.name || '', descText.slice(0, 10000));
              }

              issueCount++;
            }
          });

          syncBatch();

          // Check for next page via cursor
          if (data.next_page_results === false || !data.next_cursor) break;
          cursor = data.next_cursor;
        } catch (e) {
          console.error(`[indexer] Failed to fetch issues for ${proj.identifier}:`, e.message);
          break;
        }
      }

      upsertProject.run(proj.id, proj.identifier, proj.name, proj.description || '', issueCount, now);
      totalIssues += issueCount;
    }

    console.log(`[indexer] Synced ${projects.length} projects, ${totalIssues} issues`);
    return { projects: projects.length, issues: totalIssues };
  } catch (e) {
    console.error('[indexer] Plane sync failed:', e.message);
    return { projects: 0, issues: 0, error: e.message };
  }
}

/**
 * Sync n8n execution data into the index
 */
function syncN8nExecutions() {
  const db = getDb();
  const executions = getRecentExecutions(500);

  if (executions.length === 0) {
    console.log('[indexer] No n8n executions found (n8n.sqlite missing?)');
    return 0;
  }

  const upsert = db.prepare(`
    INSERT INTO pipeline_executions (id, workflow_id, workflow_name, status, started_at, finished_at, duration_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status=excluded.status, finished_at=excluded.finished_at, duration_ms=excluded.duration_ms
  `);

  const insertAll = db.transaction(() => {
    for (const exec of executions) {
      upsert.run(exec.id, exec.workflow_id, exec.workflow_name, exec.status,
        exec.started_at, exec.finished_at, exec.duration_ms);
    }
  });

  insertAll();
  console.log(`[indexer] Synced ${executions.length} n8n executions`);
  return executions.length;
}

/**
 * Run full index cycle
 */
async function runFullIndex() {
  const startTime = Date.now();
  console.log(`[indexer] Starting full index at ${new Date().toISOString()}`);

  const tResult = indexTranscriptions();
  const pResult = await syncPlane();
  const nCount = syncN8nExecutions();
  const lCount = correlateAll();

  const elapsed = Date.now() - startTime;
  console.log(`[indexer] Full index complete in ${elapsed}ms — ${tResult.indexed} transcriptions, ${pResult.issues} issues, ${nCount} executions, ${lCount} correlations`);

  return { transcriptions: tResult, plane: pResult, executions: nCount, correlations: lCount, elapsed };
}

// Allow running directly: node indexer.js
if (require.main === module) {
  runFullIndex().catch(e => {
    console.error('[indexer] Fatal:', e);
    process.exit(1);
  });
}

module.exports = { runFullIndex, indexTranscriptions, syncPlane, syncN8nExecutions };
