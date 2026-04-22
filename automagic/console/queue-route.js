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

def ls(d, max_n, with_err=False):
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
        items.append(row)
    items.sort(key=lambda x: x["mtime"], reverse=True)
    return items[:max_n]

awaiting = ls(base, 50)
awaiting.sort(key=lambda x: x["mtime"])
processed = ls(base / "_processed", 30)
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

function registerQueueRoute(app) {
  app.get('/api/queue', (req, res) => {
    const child = spawn(
      'ssh',
      [
        '-o', 'BatchMode=yes',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'ConnectTimeout=5',
        DROPS_HOST,
        'bash', '-s',
      ],
      { timeout: 15000 }
    );

    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { err += d.toString(); });
    child.on('error', (e) => {
      if (!res.headersSent) res.status(502).json({ error: 'ssh spawn failed', detail: e.message });
    });
    child.on('close', (code) => {
      if (code !== 0) {
        return res.status(502).json({ error: 'queue query failed', code, stderr: err.slice(0, 1000) });
      }
      try {
        res.json(JSON.parse(out));
      } catch (e) {
        res.status(502).json({ error: 'bad JSON from remote', detail: e.message, raw: out.slice(0, 500) });
      }
    });

    child.stdin.end(REMOTE_SCRIPT);
  });
}

module.exports = { registerQueueRoute };
