// Upload route for Automagic Console — appended to server.js.
// Accepts audio file + title, saves locally, scp's to CT 107 /opt/PLAUD_NOTES/_drops/.
// n8n WF-1c polls that directory every minute.

const multer = require('multer');
const fs = require('fs');
const fsp = require('fs/promises');
const pathLib = require('path');
const { execFile } = require('child_process');
const crypto = require('crypto');

const UPLOAD_DIR = process.env.AUTOMAGIC_UPLOAD_DIR || '/opt/console/uploads';
const DROPS_HOST = process.env.AUTOMAGIC_DROPS_HOST || 'root@10.90.10.7';
const DROPS_REMOTE_DIR = process.env.AUTOMAGIC_DROPS_REMOTE_DIR || '/opt/PLAUD_NOTES/_drops/';
const MAX_BYTES = parseInt(process.env.AUTOMAGIC_UPLOAD_MAX_BYTES || '524288000', 10); // 500 MB

const ALLOWED_EXT = new Set(['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.webm', '.mp4', '.aac', '.opus']);

try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (_) {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = crypto.randomBytes(4).toString('hex');
    const ext = (pathLib.extname(file.originalname) || '').toLowerCase();
    cb(null, `tmp-${Date.now()}-${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = (pathLib.extname(file.originalname) || '').toLowerCase();
    if (!ALLOWED_EXT.has(ext)) return cb(new Error(`Unsupported extension: ${ext || 'none'}`));
    cb(null, true);
  },
});

function sanitize(s) {
  return String(s || '')
    .replace(/[\/\\:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function scpToRemote(localPath, remoteFilename) {
  return new Promise((resolve, reject) => {
    const remote = `${DROPS_HOST}:${DROPS_REMOTE_DIR}${remoteFilename}`;
    execFile(
      'scp',
      ['-o', 'StrictHostKeyChecking=no', '-o', 'BatchMode=yes', localPath, remote],
      { timeout: 120000 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(`scp failed: ${stderr || err.message}`));
        resolve({ stdout, stderr });
      }
    );
  });
}

function registerUploadRoute(app) {
  app.post('/api/upload', (req, res) => {
    upload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ ok: false, error: err.message });
      if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded' });

      const localPath = req.file.path;
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}`;
      const titleRaw = sanitize(req.body.title) || sanitize(pathLib.parse(req.file.originalname).name) || 'drop';
      const ext = (pathLib.extname(req.file.originalname) || '').toLowerCase();
      const dropId = crypto.randomBytes(6).toString('hex');
      const remoteFilename = `${dateStr} ${timeStr} ${titleRaw}__${dropId}${ext}`;

      try {
        await scpToRemote(localPath, remoteFilename);
      } catch (e) {
        console.error('[upload] scp failed:', e.message);
        await fsp.unlink(localPath).catch(() => {});
        return res.status(502).json({ ok: false, error: `Ship to CT 107 failed: ${e.message}` });
      }

      // Archive local copy so we don't keep everything in uploads/
      const archivedName = `shipped-${dropId}${ext}`;
      const archivedPath = pathLib.join(UPLOAD_DIR, 'shipped', archivedName);
      try {
        await fsp.mkdir(pathLib.dirname(archivedPath), { recursive: true });
        await fsp.rename(localPath, archivedPath);
      } catch (_) {
        await fsp.unlink(localPath).catch(() => {});
      }

      res.json({
        ok: true,
        dropId,
        remoteFilename,
        title: titleRaw,
        sizeBytes: req.file.size,
        shippedTo: `${DROPS_HOST}:${DROPS_REMOTE_DIR}${remoteFilename}`,
      });
    });
  });

  // Recent drops, for UI to show pipeline progress
  app.get('/api/drops/recent', async (req, res) => {
    try {
      const shippedDir = pathLib.join(UPLOAD_DIR, 'shipped');
      let entries = [];
      try {
        entries = await fsp.readdir(shippedDir);
      } catch (_) {}
      const recent = entries
        .slice(-20)
        .map((name) => ({ name, id: name.replace(/^shipped-/, '').replace(/\.[^.]+$/, '') }));
      res.json({ recent });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

module.exports = { registerUploadRoute };
