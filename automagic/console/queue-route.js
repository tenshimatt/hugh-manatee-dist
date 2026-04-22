// Queue route — surfaces the CT 107 drops directory state to the UI.
// Runs a short bash-over-ssh query against root@10.90.10.7 that emits JSON.

const { spawn } = require('child_process');

const DROPS_HOST = process.env.AUTOMAGIC_DROPS_HOST || 'root@10.90.10.7';
const DROPS_DIR = process.env.AUTOMAGIC_DROPS_REMOTE_DIR || '/opt/PLAUD_NOTES/_drops/';

const REMOTE_SCRIPT = `
python3 - <<'PY'
import json, os, time
from pathlib import Path

base = Path(${JSON.stringify(DROPS_DIR.replace(/\/$/, ''))})
lock = Path("/tmp/automagic_drops.lock")
audio_exts = {".mp3",".m4a",".wav",".ogg",".flac",".webm",".mp4",".aac",".opus"}

def ls(d, max_n, with_err=False, with_result=False):
    if not d.is_dir(): return []
    items = []
    for p in d.iterdir():
        if not p.is_file(): continue
        if p.suffix.lower() not in audio_exts: continue
        st = p.stat()
        row = {"name": p.name, "size": st.st_size, "mtime": int(st.st_mtime)}
        if with_err:
            err_path = d / (p.name + ".error.txt")
            if err_path.exists():
                try: row["error"] = err_path.read_text(encoding="utf-8")[:1000]
                except Exception: pass
        if with_result:
            sc = d / (p.name + ".result.json")
            if sc.exists():
                try: row["result"] = json.loads(sc.read_text(encoding="utf-8"))
                except Exception: pass
        items.append(row)
    items.sort(key=lambda x: x["mtime"], reverse=True)
    return items[:max_n]

awaiting = ls(base, 50)
awaiting.sort(key=lambda x: x["mtime"])
processed = ls(base / "_processed", 30, with_result=True)
errored = ls(base / "_errored", 30, with_err=True)

current = None
if lock.exists():
    try: pid = int(lock.read_text().strip())
    except Exception: pid = None
    alive = False
    if pid:
        try: os.kill(pid, 0); alive = True
        except Exception: pass
    if alive and awaiting:
        current = awaiting[0]
        awaiting = awaiting[1:]
    elif alive:
        current = {"name": "(processor active)", "size": 0, "mtime": int(time.time())}

out = {
    "now": int(time.time()),
    "host": "${DROPS_HOST}",
    "dir": ${JSON.stringify(DROPS_DIR)},
    "current": current,
    "awaiting": awaiting,
    "processed": processed,
    "errored": errored,
    "counts": {
        "awaiting": len(awaiting) + (1 if current else 0),
        "processed": len(processed),
        "errored": len(errored),
    },
}
print(json.dumps(out))
PY
`;

// Safe filename: no slashes, no traversal, must be an audio filename.
const SAFE_NAME_RE = /^[^\/\\\x00]+\.(mp3|m4a|wav|ogg|flac|webm|mp4|aac|opus)$/i;
const VALID_BUCKETS = new Set(['awaiting', 'errored', 'processed']);
const BUCKET_DIRS = {
  awaiting: '',
  errored: '_errored/',
  processed: '_processed/',
};

function runRemote(script, cb) {
  const child = spawn(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=5', DROPS_HOST, 'bash', '-s'],
    { timeout: 15000 }
  );
  let out = '';
  let err = '';
  child.stdout.on('data', (d) => { out += d.toString(); });
  child.stderr.on('data', (d) => { err += d.toString(); });
  child.on('error', (e) => cb(e, null, ''));
  child.on('close', (code) => cb(code === 0 ? null : new Error(`exit ${code}`), out, err));
  child.stdin.end(script);
}

function actionScript(kind, bucket, name) {
  const base = DROPS_DIR.replace(/\/$/, '');
  const dir = `${base}/${BUCKET_DIRS[bucket] || ''}`.replace(/\/$/, '');
  const fn = name.replace(/'/g, "'\\''");
  const dirQ = dir.replace(/'/g, "'\\''");
  const baseQ = base.replace(/'/g, "'\\''");

  if (kind === 'delete') {
    return `
python3 - <<'PY'
import json, os
from pathlib import Path
d = Path('${dirQ}')
name = '${fn}'
removed = []
for suffix in ['', '.error.txt', '.result.json']:
    p = d / (name + suffix)
    if p.exists() and p.is_file():
        p.unlink()
        removed.append(str(p))
print(json.dumps({"ok": True, "removed": removed}))
PY
`;
  }
  if (kind === 'retry') {
    return `
python3 - <<'PY'
import json, shutil
from pathlib import Path
src = Path('${dirQ}/${fn}')
dst = Path('${baseQ}/${fn}')
if not src.exists():
    print(json.dumps({"ok": False, "error": "source not found"}))
else:
    # remove any leftover .error.txt before re-queuing
    err_path = src.parent / (src.name + '.error.txt')
    if err_path.exists(): err_path.unlink()
    shutil.move(str(src), str(dst))
    print(json.dumps({"ok": True, "requeued": str(dst)}))
PY
`;
  }
  throw new Error(`unknown action ${kind}`);
}

function handleAction(kind) {
  return (req, res) => {
    const { name, bucket } = req.body || {};
    if (!name || typeof name !== 'string' || !SAFE_NAME_RE.test(name)) {
      return res.status(400).json({ error: 'invalid or missing filename' });
    }
    const b = bucket || (kind === 'retry' ? 'errored' : 'errored');
    if (!VALID_BUCKETS.has(b)) {
      return res.status(400).json({ error: 'invalid bucket' });
    }
    const script = actionScript(kind, b, name);
    runRemote(script, (e, out, errText) => {
      if (e) return res.status(502).json({ error: 'remote action failed', detail: e.message, stderr: (errText || '').slice(0, 500) });
      try { res.json(JSON.parse(out)); }
      catch (parseErr) { res.status(502).json({ error: 'bad JSON', raw: out.slice(0, 500) }); }
    });
  };
}

function registerQueueRoute(app) {
  app.get('/api/queue', (req, res) => {
    runRemote(REMOTE_SCRIPT, (e, out, errText) => {
      if (e) return res.status(502).json({ error: 'queue query failed', detail: e.message, stderr: (errText || '').slice(0, 1000) });
      try { res.json(JSON.parse(out)); }
      catch (parseErr) { res.status(502).json({ error: 'bad JSON from remote', detail: parseErr.message, raw: out.slice(0, 500) }); }
    });
  });

  app.post('/api/queue/retry', handleAction('retry'));
  app.post('/api/queue/delete', handleAction('delete'));
}

module.exports = { registerQueueRoute };
