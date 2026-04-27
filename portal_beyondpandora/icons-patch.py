#!/usr/bin/env python3
"""Inject logo support into Beyond Pandora portal index.html."""
import sys
import re

INFILE  = "/tmp/portal-full.html"
OUTFILE = "/tmp/portal-patched.html"

with open(INFILE, "r", encoding="utf-8") as f:
    html = f.read()

# 1) CSS block — added inside the existing <style> immediately before </style>
CSS_BLOCK = """
/* === Logo injection === */
.service-card { display:flex; flex-direction:row; align-items:center; gap:10px; }
.service-card .logo { flex:0 0 auto; width:32px; height:32px; border-radius:8px; background:rgba(255,255,255,0.04); display:inline-flex; align-items:center; justify-content:center; overflow:hidden; }
.service-card .logo img { width:100%; height:100%; object-fit:contain; padding:4px; display:block; }
.service-card .logo svg { width:18px; height:18px; }
.service-card .logo.tone-sky  { background:rgba(97,165,194,0.16); color:#61a5c2; }
.service-card .logo.tone-teal { background:rgba(82,182,154,0.16); color:#52b69a; }
.service-card .logo.tone-gold { background:rgba(255,191,105,0.18); color:#ffbf69; }
.service-card .info { min-width:0; flex:1; display:flex; flex-direction:column; gap:2px; }
.service-card .name { font-weight:600; font-size:0.95rem; }
.service-card .url { font-size:0.7rem; color:var(--text-dim); word-break:break-all; }
"""

# 2) Script — appended just before </body>
JS_BLOCK = r"""
<script>
// === Service-card logo injector ===
(function() {
  const CDN = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/';
  // Lucide SVG inner paths (all 24x24, stroke-width:2, currentColor)
  const SVG = {
    activity:    '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    globe:       '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    cloud:       '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    briefcase:   '<rect width="20" height="14" x="2" y="6" rx="2"/><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    cogserver:   '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
    plug:        '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
    box:         '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  };
  function svg(name, tone) {
    const inner = SVG[name] || SVG.box;
    return `<span class="logo tone-${tone || 'sky'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg></span>`;
  }
  function img(slug) {
    return `<span class="logo"><img src="${CDN}${slug}.png" alt="" loading="lazy" onerror="this.parentElement.outerHTML='${svg('box','sky').replace(/'/g, '&#39;')}';"></span>`;
  }
  // Subdomain → { slug } (use dashboard-icon name) OR { svg, tone } (custom Lucide)
  const MAP = {
    'ai-gateway':     { svg: 'plug',       tone: 'teal' },
    'portal':         { svg: 'activity',   tone: 'sky'  },
    'rawgle':         { svg: 'globe',      tone: 'gold' },
    'cloudaio':       { svg: 'cloud',      tone: 'sky'  },
    'crm':            { svg: 'briefcase',  tone: 'teal' },
    'supercrm':       { svg: 'briefcase',  tone: 'teal' },
    'superops':       { svg: 'cogserver',  tone: 'gold' },
    // Slug overrides where hostname ≠ dashboard-icons slug
    'openwebui':      { slug: 'open-webui'        },
    'comfy':          { slug: 'comfyui'           },
    'draw':           { slug: 'excalidraw'        },
    'project':        { slug: 'plane'             },
    'search':         { slug: 'searxng'           },
    'wiki':           { slug: 'bookstack'         },
    'kumo':           { slug: 'nextcloud'         },
    'supercloud':     { slug: 'nextcloud'         },
    'stream':         { slug: 'plex'              },
    'signin':         { slug: 'authentik'         },
    'collabora':      { slug: 'collabora-online'  },
    'wordpress-yld':  { slug: 'wordpress'         },
    'code':           { slug: 'code-server'       },
    'n8n-ops':        { slug: 'n8n'               },
    'n8n-ops-mcp':    { slug: 'n8n'               },
    'n8nsamco':       { slug: 'n8n'               },
    'n8nsovrein':     { slug: 'n8n'               },
    'n8nsuperluxe':   { slug: 'n8n'               },
    'n8nyld':         { slug: 'n8n'               },
  };
  function logoFor(href) {
    let host;
    try { host = new URL(href).hostname; } catch (e) { return svg('box'); }
    const sub = host.split('.')[0];
    const m = MAP[sub];
    if (m && m.svg) return svg(m.svg, m.tone);
    if (m && m.slug) return img(m.slug);
    return img(sub);
  }
  function inject() {
    const cards = document.querySelectorAll('a.service-card');
    cards.forEach(card => {
      if (card.querySelector('.logo')) return;  // idempotent
      // Wrap existing .name + .url in an <span class="info"> so the flex row reads:
      //   [logo]  [info: name / url]
      const name = card.querySelector('.name');
      const url  = card.querySelector('.url');
      if (!name) return;
      const info = document.createElement('span');
      info.className = 'info';
      info.appendChild(name.cloneNode(true));
      if (url) info.appendChild(url.cloneNode(true));
      // Build new content
      card.innerHTML = logoFor(card.href);
      card.appendChild(info);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
</script>
"""

# Inject CSS before the final </style> tag (last occurrence)
idx = html.rfind("</style>")
if idx == -1:
    print("FAIL: no </style> in input", file=sys.stderr); sys.exit(1)
html = html[:idx] + CSS_BLOCK + html[idx:]

# Inject script before </body>
idx2 = html.rfind("</body>")
if idx2 == -1:
    print("FAIL: no </body> in input", file=sys.stderr); sys.exit(1)
html = html[:idx2] + JS_BLOCK + html[idx2:]

with open(OUTFILE, "w", encoding="utf-8") as f:
    f.write(html)

print(f"OK: wrote {OUTFILE} ({len(html)} bytes)")
