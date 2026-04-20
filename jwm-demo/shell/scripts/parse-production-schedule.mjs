#!/usr/bin/env node
// Re-generates lib/canned/production-schedule.json from the JWM Production Schedule xlsx.
// We shell out to python3 + openpyxl to avoid adding xlsx as a runtime Node dependency.
//
// Usage: node scripts/parse-production-schedule.mjs
//
// The python block mirrors what was run on 2026-04-19 to seed the demo board.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "../lib/canned/production-schedule.json");
const xlsx = path.resolve(
  here,
  "../../../Obsidian/PLAUD/PROJECTS/JWM/attachments/Production Schedule_new.xlsx",
);

const py = `
import json, hashlib
from openpyxl import load_workbook
wb = load_workbook(${JSON.stringify(xlsx)}, read_only=True, data_only=True)
ws = wb['Production Schedule']
rows = list(ws.iter_rows(values_only=True))
headers = rows[0]
STAGE_KEYS = ['uncategorized','evaluating','float','layout','layout_check','sketch','sketch_check','correction','cnc_prog','laser_prog','punch_prog','prog_complete','release_shop']
WEIGHTS = {'uncategorized':4,'evaluating':6,'float':8,'layout':10,'layout_check':7,'sketch':10,'sketch_check':6,'correction':5,'cnc_prog':9,'laser_prog':6,'punch_prog':5,'prog_complete':7,'release_shop':12}
def has(v): return v not in (None,'',0,'-','N/A','na',False)
def clean(v):
    if v is None: return None
    s = str(v).strip()
    return s if s and s.lower() not in ('none','no hold','na') else None
def iso(v):
    if v is None: return None
    if hasattr(v,'isoformat'): return v.isoformat()
    return str(v)
cards = []
for r in rows[1:]:
    rec = dict(zip(headers, r))
    jid = rec.get('ID')
    if not jid: continue
    if has(rec.get('Released to Shop Actual')): stage='release_shop'
    elif has(rec.get('Prog Complete')) or has(rec.get('Date Programming Complete')): stage='prog_complete'
    elif has(rec.get('Punch Prog By')): stage='punch_prog'
    elif has(rec.get('Laser Prog By')): stage='laser_prog'
    elif has(rec.get('AXYZ Prog By')): stage='cnc_prog'
    elif has(rec.get('Correction By')): stage='correction'
    elif has(rec.get('Sketch Check By')): stage='sketch_check'
    elif has(rec.get('Sketch By')): stage='sketch'
    elif has(rec.get('LO Check By')): stage='layout_check'
    elif has(rec.get('LO By')): stage='layout'
    elif has(rec.get('Evaluation By')): stage='evaluating'
    else: stage='uncategorized'
    rp = rec.get('Ranked Priority')
    try: rpn = float(rp) if rp not in (None,'') else None
    except: rpn = None
    if rpn is None: priority='info'
    elif rpn <= 10: priority='high'
    elif rpn <= 30: priority='med'
    else: priority='low'
    dept = str(rec.get('Department') or '')
    division = 'A' if dept.startswith('1010') else ('T' if dept.startswith('1040') else 'A')
    assignees = []
    for k in ['PM','Responsible','Eng Manager','Inhouse Drafter','Inhouse Checker','Program Lead']:
        v = clean(rec.get(k))
        if v:
            for part in v.split(','):
                p = part.strip()
                if p and p not in assignees: assignees.append(p)
        if len(assignees) >= 3: break
    cards.append({
        'id': str(jid),
        'jobName': clean(rec.get('Job Name')) or '',
        'pm': clean(rec.get('PM')) or '',
        'stage': stage, 'priority': priority, 'rankedPriority': rpn,
        'division': division, 'department': dept,
        'assignees': assignees[:3],
        'materialType': clean(rec.get('Material Type')) or '',
        'releaseType': clean(rec.get('Release Type')) or '',
        'description': clean(rec.get('Description')) or '',
        'miscMaterials': clean(rec.get('Misc Materials')) or '',
        'address': clean(rec.get('Job Address')) or '',
        'productionFolder': clean(rec.get('Production Folder')) or '',
        'shipTarget': iso(rec.get('Ship Target')),
        'releaseToShopTarget': iso(rec.get('Release To Shop Target')),
        'releasedToShopActual': iso(rec.get('Released to Shop Actual')),
        'station': clean(rec.get('Station')) or '',
        'draftingHours': rec.get('Drafting Hours'),
        'shopHours': rec.get('Shop Hours'),
        'requiredProcesses': clean(rec.get('Required Processes')) or '',
        'latestComment': clean(rec.get('Latest Comment')) or '',
        'engManager': clean(rec.get('Eng Manager')) or '',
        'drafter': clean(rec.get('Inhouse Drafter')) or '',
        'checker': clean(rec.get('Inhouse Checker')) or '',
        'weekToShip': clean(rec.get('Week to Ship')) or '',
    })
def h(s): return int(hashlib.md5(str(s).encode()).hexdigest(),16)
cards.sort(key=lambda c: h(c['id']))
total = sum(WEIGHTS.values())
targets = {k: int(round(len(cards)*w/total)) for k,w in WEIGHTS.items()}
buckets = {k: [] for k in STAGE_KEYS}
for c in cards:
    if c['stage'] not in ('release_shop','uncategorized'):
        buckets[c['stage']].append(c)
leftovers = [c for c in cards if c['stage'] in ('release_shop','uncategorized')]
need = []
for s in STAGE_KEYS:
    need.extend([s] * max(0, targets[s] - len(buckets[s])))
for c, s in zip(leftovers, need):
    c['stage'] = s; buckets[s].append(c)
for c in leftovers[len(need):]:
    c['stage'] = 'release_shop'; buckets['release_shop'].append(c)
for c in cards:
    if h(c['id']) % 5 == 0:
        c['division'] = 'T'; c['department'] = '1040'
open(${JSON.stringify(out)},'w').write(json.dumps(cards, default=str))
print('wrote', ${JSON.stringify(out)}, 'cards=', len(cards))
`;

const r = spawnSync("python3", ["-c", py], { stdio: "inherit" });
process.exit(r.status ?? 1);
