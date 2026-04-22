// Correlate transcriptions with Plane issues.
// Primary signal: voice note's `project_folder` matches Plane project name/identifier.
// Within matched projects, pairs are scored by title/content similarity + date proximity.
// Cross-project fallback uses pure title similarity with a higher bar.

const { getDb } = require('./db');

function normalize(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '').trim();
}

function trigrams(str) {
  const s = ` ${String(str || '').toLowerCase().replace(/[^a-z0-9 ]/g, '')} `;
  const set = new Set();
  for (let i = 0; i < s.length - 2; i++) set.add(s.slice(i, i + 3));
  return set;
}

function similarity(a, b) {
  const tA = trigrams(a);
  const tB = trigrams(b);
  if (tA.size === 0 || tB.size === 0) return 0;
  let inter = 0;
  for (const t of tA) if (tB.has(t)) inter++;
  return inter / Math.max(tA.size, tB.size);
}

function parseTags(raw) {
  if (!raw) return [];
  try {
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

function daysBetween(tDateStr, tTimeStr, iCreatedAt) {
  if (!tDateStr || !iCreatedAt) return Infinity;
  const tDate = new Date(`${tDateStr}T${(tTimeStr || '00:00').slice(0, 5)}:00Z`);
  const iDate = new Date(iCreatedAt);
  if (Number.isNaN(+tDate) || Number.isNaN(+iDate)) return Infinity;
  return Math.abs(+tDate - +iDate) / 86400000;
}

function correlateAll() {
  const db = getDb();
  const transcriptions = db.prepare(
    'SELECT id, title, date, time, tags, project_folder, executive_summary, raw_transcript FROM transcriptions'
  ).all();
  const issues = db.prepare(
    'SELECT id, project_id, name, description_text, created_at FROM plane_issues'
  ).all();
  const projects = db.prepare('SELECT id, name, identifier FROM plane_projects').all();

  if (!transcriptions.length || !issues.length) return 0;

  // Build a project-match index: project_folder-normalized → project_id(s)
  const folderToProject = new Map(); // normalized name → project_id
  for (const p of projects) {
    const keys = new Set([normalize(p.name), normalize(p.identifier)]);
    for (const k of keys) if (k) folderToProject.set(k, p.id);
  }

  // Group issues by project for fast same-project iteration
  const issuesByProject = new Map();
  for (const i of issues) {
    const arr = issuesByProject.get(i.project_id) || [];
    arr.push(i);
    issuesByProject.set(i.project_id, arr);
  }

  db.prepare('DELETE FROM transcription_issue_links').run();
  const insert = db.prepare(
    'INSERT OR REPLACE INTO transcription_issue_links (transcription_id, issue_id, confidence, link_method) VALUES (?, ?, ?, ?)'
  );
  const insertMany = db.transaction((links) => {
    for (const l of links) insert.run(l.transcription_id, l.issue_id, l.confidence, l.link_method);
  });

  const MAX_LINKS_PER_T = 5;
  const THRESHOLD = 0.4;

  const allLinks = [];

  for (const t of transcriptions) {
    const tags = parseTags(t.tags);
    const folderKey = normalize(t.project_folder);

    // Candidate issues: prefer same-project, include cross-project with tag overlap
    const candidateProjectIds = new Set();
    if (folderKey && folderToProject.has(folderKey)) candidateProjectIds.add(folderToProject.get(folderKey));
    // Also via tags: any tag that matches a project name/identifier
    for (const tag of tags) {
      const k = normalize(tag);
      if (folderToProject.has(k)) candidateProjectIds.add(folderToProject.get(k));
    }

    // Score each candidate issue
    const scored = [];
    const pushScored = (issue, projectMatch) => {
      const titleSim = similarity(t.title, issue.name);
      const days = daysBetween(t.date, t.time, issue.created_at);
      const summaryLower = (t.executive_summary || '').toLowerCase();
      const transcriptLower = (t.raw_transcript || '').toLowerCase();
      const words = String(issue.name || '').toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      let contentOverlap = 0;
      if (words.length) {
        const text = summaryLower + ' ' + transcriptLower;
        const hits = words.filter((w) => text.includes(w)).length;
        contentOverlap = hits / words.length;
      }

      let score = 0;
      const methods = [];
      if (projectMatch) { score += 0.3; methods.push('project'); }
      if (titleSim >= 0.2) { score += titleSim * 0.5; methods.push(`title:${titleSim.toFixed(2)}`); }
      if (contentOverlap >= 0.3) { score += contentOverlap * 0.3; methods.push(`content:${contentOverlap.toFixed(2)}`); }
      if (days < 1) { score += 0.25; methods.push('date:1d'); }
      else if (days < 7) { score += 0.15; methods.push('date:7d'); }
      else if (days < 30) { score += 0.05; methods.push('date:30d'); }

      if (score >= THRESHOLD) {
        scored.push({ issue_id: issue.id, confidence: Math.min(1, Math.round(score * 100) / 100), method: methods.join('+') });
      }
    };

    // Same-project candidates
    for (const pid of candidateProjectIds) {
      const projIssues = issuesByProject.get(pid) || [];
      for (const issue of projIssues) pushScored(issue, true);
    }

    // Cross-project fallback: only strong title matches (less common)
    if (scored.length < MAX_LINKS_PER_T) {
      for (const issue of issues) {
        if (candidateProjectIds.has(issue.project_id)) continue;
        const titleSim = similarity(t.title, issue.name);
        if (titleSim >= 0.45) {
          scored.push({
            issue_id: issue.id,
            confidence: Math.round(titleSim * 100) / 100,
            method: `title-only:${titleSim.toFixed(2)}`,
          });
        }
      }
    }

    // Keep top K by confidence
    scored.sort((a, b) => b.confidence - a.confidence);
    for (const s of scored.slice(0, MAX_LINKS_PER_T)) {
      allLinks.push({
        transcription_id: t.id,
        issue_id: s.issue_id,
        confidence: s.confidence,
        link_method: s.method,
      });
    }
  }

  insertMany(allLinks);
  return allLinks.length;
}

module.exports = { correlateAll, similarity };
