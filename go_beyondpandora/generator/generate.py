#!/usr/bin/env python3
"""
Generates /opt/go/index.html (the go.beyondpandora.com launcher) from:
  - services.yml         — curated metadata + section ordering
  - traefik-domains.txt  — live snapshot of subdomains routed by Traefik

Usage:
  # Refresh the Traefik snapshot (requires SSH to Proxmox):
  ssh root@10.90.10.10 "pct exec 103 -- bash -c \\
    \"grep -hoE '[a-z0-9-]+\\.beyondpandora\\.com' /etc/traefik/conf.d/*.yml | sort -u\"" \\
    > traefik-domains.txt

  # Regenerate index.html from services.yml + the snapshot:
  python3 generate.py

  # Output is written to ../index.html (deploy with deploy.sh).
"""

import json
import sys
from pathlib import Path

# Source of truth is services.yml (human-edited). The generator reads
# services.json which is a 1:1 conversion — keeps the runtime stdlib-only.
# To regenerate the JSON after editing the YAML:
#   python3 -m venv /tmp/yvenv && /tmp/yvenv/bin/pip -q install pyyaml
#   /tmp/yvenv/bin/python3 -c "import yaml,json; \
#     json.dump(yaml.safe_load(open('services.yml')), open('services.json','w'), indent=2)"

HERE = Path(__file__).parent
SERVICES_YML = HERE / "services.json"
DOMAINS_TXT = HERE / "traefik-domains.txt"
OUT_HTML = HERE.parent / "index.html"
HEAD_TPL = HERE / "head.html"      # CSS + script
FOOT_TPL = HERE / "foot.html"      # closing script + body

CDN = "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/"

# Lucide SVG inner paths (24x24, stroke-width:2, currentColor)
SVG = {
    "activity":     '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    "workflow":     '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M21 11V8a2 2 0 0 0-2-2h-6"/><path d="m15 9-3-3 3-3"/><path d="M3 13v3a2 2 0 0 0 2 2h6"/><path d="m9 21 3-3-3-3"/>',
    "network":      '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
    "flaskconical": '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
    "bookopen":     '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    "building2":    '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    "briefcase":    '<rect width="20" height="14" x="2" y="6" rx="2"/><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    "cpu":          '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
    "globe":        '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    "plug":         '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
    "messagecircle":'<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    "sparkles":     '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
    "folder":       '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    "mail":         '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    "download":     '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    "monitor":      '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
    "cogserver":    '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
    "home":         '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    "box":          '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
}

def render_logo(icon: dict) -> str:
    """Render an icon spec into a logo span."""
    if not icon:
        icon = {"svg": "box", "tone": "sky"}
    if "slug" in icon:
        slug = icon["slug"]
        return f'<span class="logo"><img src="{CDN}{slug}.png" alt="" loading="lazy" onerror="this.parentElement.innerHTML=\'<svg viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot; stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot;>{SVG["box"]}</svg>\';this.parentElement.classList.add(\'tone-sky\');"></span>'
    name = icon.get("svg", "box")
    tone = icon.get("tone", "sky")
    inner = SVG.get(name, SVG["box"])
    return f'<span class="logo tone-{tone}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{inner}</svg></span>'


def render_card(host: str, meta: dict) -> str:
    """One card."""
    href = meta.get("href", f"https://{host}")
    name = meta.get("name", host.split(".")[0].replace("-", " ").title())
    desc = meta.get("desc", "")
    icon = meta.get("icon", {})
    logo = render_logo(icon)
    desc_html = f'<div class="desc">{desc}</div>' if desc else ""
    return (
        f'    <a class="card" target="_blank" rel="noopener noreferrer" href="{href}">\n'
        f'      {logo}\n'
        f'      <div class="content"><div class="name">{name}</div>{desc_html}</div>\n'
        f'    </a>'
    )


def render_section(section: dict, hosts: list[tuple[str, dict]]) -> str:
    """One section. hosts is a list of (host, meta) tuples."""
    if not hosts:
        return ""
    cards = "\n".join(render_card(h, m) for h, m in sorted(hosts, key=lambda x: x[1].get("name", x[0]).lower()))
    return (
        f'\n<section data-group="{section["label"]}">\n'
        f'  <h2>{section["label"]}</h2>\n'
        f'  <div class="grid">\n'
        f'{cards}\n'
        f'  </div>\n'
        f'</section>'
    )


def main():
    with SERVICES_YML.open() as f:
        cfg = json.load(f)
    sections = cfg["sections"]
    services = cfg.get("services", {}) or {}
    synthetic = {s["host"] for s in (cfg.get("synthetic") or [])}
    default_section = cfg.get("default_section", "uncategorized")

    # Live Traefik domains
    if not DOMAINS_TXT.exists():
        print(f"WARNING: {DOMAINS_TXT} missing — using only services.yml hosts", file=sys.stderr)
        traefik_hosts = set()
    else:
        traefik_hosts = {l.strip() for l in DOMAINS_TXT.read_text().splitlines() if l.strip()}

    # Hosts to emit: union of (Traefik discovery) + (synthetic explicit list).
    # Anything in `services` but not in either is dropped (likely a stale entry).
    emit_hosts = traefik_hosts | synthetic
    # Drop go.beyondpandora.com itself — don't link to ourselves
    emit_hosts.discard("go.beyondpandora.com")

    # Bucket by section
    bucket: dict[str, list[tuple[str, dict]]] = {s["id"]: [] for s in sections}
    seen = set()
    for host in emit_hosts:
        meta = services.get(host, {})
        sect = meta.get("section", default_section)
        if sect not in bucket:
            bucket[default_section].append((host, meta))
        else:
            bucket[sect].append((host, meta))
        seen.add(host)

    # Stats
    total = sum(len(v) for v in bucket.values())
    in_traefik_not_in_yml = sorted(traefik_hosts - set(services.keys()) - {"go.beyondpandora.com"})
    in_yml_not_in_traefik = sorted(set(services.keys()) - traefik_hosts - synthetic - {"go.beyondpandora.com"})

    print(f"[gen] Emitted {total} cards across {len(sections)} sections")
    print(f"[gen] Traefik domains: {len(traefik_hosts)} ; synthetic: {len(synthetic)}")
    if in_traefik_not_in_yml:
        print(f"[gen] In Traefik but NOT in services.yml ({len(in_traefik_not_in_yml)}): defaulted to '{default_section}'")
        for h in in_traefik_not_in_yml:
            print(f"        - {h}")
    if in_yml_not_in_traefik:
        print(f"[gen] In services.yml but NOT in Traefik ({len(in_yml_not_in_traefik)}): SKIPPED (add to synthetic to force)")
        for h in in_yml_not_in_traefik:
            print(f"        - {h}")

    # Build sections HTML
    body_sections = "\n".join(
        render_section(s, bucket[s["id"]])
        for s in sections
        if bucket[s["id"]]  # skip empty sections
    )

    head = HEAD_TPL.read_text()
    foot = FOOT_TPL.read_text()
    html = head + body_sections + "\n" + foot

    OUT_HTML.write_text(html)
    print(f"[gen] Wrote {OUT_HTML} ({len(html):,} bytes)")


if __name__ == "__main__":
    main()
