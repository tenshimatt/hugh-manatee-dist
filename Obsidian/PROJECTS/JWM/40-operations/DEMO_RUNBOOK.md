# JWM Demo Runbook — Monday 2026-04-20 08:30 CT

> **Attendees:** Chris Ball (COO), Matt presenting.
> **Goal:** team relatability, not persuasion. Business is already won (Chris: *"The goal is not to get approval because we're good. We're going ahead."*).
> **Chris's posture:** *"I'm the brakes. Don't let them lead — let the conversation go where it goes."* He will record the session so every reaction becomes the backlog.
> **Golden rule:** real data, real workflows, the screens they already recognise. No pitching. Let the product do the talking.

Linked: [[MENU_ORDER]] · [[SMARTSHEET_REFERENCE]] · [[BUILD_PLAN_2026-04-20]] · [[2026-04-19 22-25 JWM Deep Dive Menu Routers and Demo Scope]]

---

## 1. Pre-call checklist — 06:00 CT, coffee in hand

Run this while driving to work / on the phone to Chris. Everything here is a hard-reload Chrome tab.

- [ ] Open Chrome. Navigate to **`https://jwm-demo.beyondpandora.com`** → sign in with Authentik (fingerprint). Land on `/dashboard`.
- [ ] Hard-reload (Cmd+Shift+R) each of the live pages below. This picks up the new favicon and the anomaly modal JS bundle.
- [ ] Click through in narrative order (table below). If any page 500s, restart dev server on CT 120 — but Matt's laptop is the presenter, so the public URL matters.
- [ ] Open chat drawer. Ask John: *"How is IAD181 tracking on budget?"* → expect the 61% / $1.553M / 24% margin answer.
- [ ] Confirm **"Voice ready"** badge is green. Click speaker icon once — expect Brian (ElevenLabs). If it falls back to native male voice, that's fine; don't flag it.
- [ ] Test Authentik login on Chris's account (already enrolled). If anyone else needs to log in and fingerprint enrolment hasn't landed, be ready to impersonate-as-Matt. Per prior memory note, this is acceptable.
- [ ] Open second tab to **`https://jwm-erp.beyondpandora.com`** → confirm favicon + login page render. Admin creds `JWMdemo2026!` in back pocket. **Do not open this during the demo unless asked.**
- [ ] Open third tab to **`https://n8n.beyondpandora.com`** → confirm public URL loads without Authentik (removed tonight). LAN backup `http://10.90.10.7:5678`.
- [ ] Resize Chrome to ~1440px wide. Check `/engineering/pipeline` and `/shop/scheduler` render full-bleed (they're the full-width ones).
- [ ] Quick mobile sanity check — Chris may screenshare from iPad. Open `/dashboard` + `/arch/projects/25071-IAD181` in responsive mode.
- [ ] Watch for Chris's SMS with the final menu nesting. If it arrives, adjust the sidebar in-flight — not a blocker for the demo itself.

### Live URL map (narrative order)

| # | URL | What it shows |
|---|---|---|
| 1 | `/dashboard` | Global home (Chris-approved). Greeting + "As of" stamp auto-localised to CDT |
| 2 | `/exec/arch` | Executive Current Contracts (Sales / Pipeline / Backlog / Margin tiles) — live tile count from ERPNext |
| 3 | `/arch/pm` | PMO index — 4 real PMs from Production Schedule |
| 4 | `/arch/pm/cole-norona` | Cole's "My Projects" — 6 real projects, Quick Links, Forms buttons, tasks, budget |
| 5 | `/arch/projects/25071-IAD181` | IAD181 Fitout replica — 61%, $1.553M, 24% margin, Field Install progression. **Embedded cradle-to-grave pipeline at the top** |
| 6 | `/engineering/pipeline` | Engineering Kanban — 316 real jobs × 13 stages (real stages + statuses after Phase-2 derivation), click → drawer |
| 7 | `/engineering/routes` | **NEW.** List of 3 live Routes in ERPNext. Click ROUTE-24060-BM01 for the NCR demo |
| 8 | `/engineering/routes/ROUTE-24060-BM01` | **NEW.** Router editor. NCR finishing side-branch visible. Drag the grip handle to reorder steps (top = do first) |
| 9 | `/shop/scheduler` | Drew's grid schedule — rows × workstations, colour-coded (full-bleed) |
| 10 | `/shop/ship-schedule` | **NEW.** Drew's ship-date bottleneck view (🔴 5+ / 🟡 3–4 / ⚪ 1–2). Calendar heatmap + grouped list |
| 11 | `/shop/efficiency` | Per-operator efficiency (Chris-approved verbatim) |
| 12 | `/shop/flat-laser-2` | Kiosk with **clickable** active anomaly (ANOM-2026-0042). Qty + Scrap now accept typed numbers |
| 13 | `/erf` (alias `/arch/erf`) | ERF form — field-parity with the Smartsheet form |
| 14 | `/qc` | Quality Control |
| 15 | `/estimator/quick-quote` | Tshop Estimator Excel replacement |

---

## 2. Demo narrative — minute-by-minute

Timing is a suggestion. Let the conversation drift; the runbook's job is to keep you oriented when it does. Chris will moderate — follow his lead.

### T+0 → T+3 — Land (`/dashboard`)

Soft open. You log in, Authentik hands off, you land on the global dashboard. **Do not narrate.** Let Chris frame the demo for his team. If silence stretches: *"This is your global home — everything rolls up here."* Then stop.

*Chris will notice:* navy + gold palette, JWM branding, his own team's names.
*If they ask "is this data real?"* — *"Yes. Real production schedule, real PMs, real projects. We'll walk through it."*

**Pivot trigger:** if anyone immediately asks about ERPNext/backend, jump to T+20 (IAD181 Project Dashboard) and let the ERP reveal land there naturally.

---

### T+3 → T+7 — Executive view (`/exec/arch`)

Click **Executive → Architectural** in sidebar.

*"This is Architectural Current Contracts — Sales, Pipeline, Backlog, combined margin. Same tiles as the Smartsheet exec board Chris built, just faster."*

Point (don't click) at the four KPI tiles. Don't make the "single pane of glass" pitch — let them feel it. If KPI numbers look like placeholder, don't flinch — Chris knows the real data is rolling in.

*Chris will notice:* the rail on the left — Dashboard Links, per-role sub-dashboards. He built these in Smartsheet over years.

**Pivot trigger:** if someone asks "where does this data come from?" — this is the moment for the soft headless-ERP line (see cheat-sheet §3). Otherwise, keep moving.

---

### T+7 → T+12 — PMO home (`/arch/pm/cole-norona`)

Click **Architectural → Project Managers → Cole Norona**.

*"This is what a PM sees on Monday morning — their live project book, not a spreadsheet. Six active projects, progress bars, quick-links to the forms they fire every day."*

Scroll. Point at:
- The 6-row Projects table with progress bars
- The **Dashboard Quick Links** rail (Panel Dashboard, Production Schedule, 3D Production Schedule, Procurement Log…)
- The **Forms** row — Job Info, 3D Request, Schedule It. *"Each of these is an ERF-style form. One click, structured data in, no more emailed spreadsheets."*
- Upcoming Tasks table, Budget Overview strip

*Chris will notice:* this is the Matt Rasmussen PMO dashboard from his screen-share, but with Cole's real 6 projects.

**Pivot trigger:** if anyone asks "who else has a dashboard like this?" — answer: *"Every PM, every FM, every FX. Role-based. Phase 2 builds out the rest."*

---

### T+12 → T+20 — THE key moment (`/arch/projects/25071-IAD181`)

Click any row in Cole's projects table → lands on the IAD181 Fitout dashboard.

> **This is the single most important page of the demo.** It's their IAD181 Smartsheet dashboard in a better UI. If they recognise it instantly, the room shifts.

Narrate slowly:
- *"Job 25071, IAD181 Fitout. 61% complete. $1.553M contract, 24% margin, $1,852 budget remaining."* Point at the green health dots.
- **Point at the horizontal pipeline at the top.** *"Cradle-to-grave — every station this job will pass through. Green balls done, yellow in progress, white pending. Click any of them and I'll land on that step."* This is the Router viz Chris asked for on Sunday; it's now live.
- *"Field Install progression — every install stage tracked: Layout, Single Skin, Panel Install, QC Shipping, Crating, Shipped, QC Final, Rolled Up, Sealed."* That column set is the one from their real Smartsheet.
- *"Change Order Budget summary is zero today — structure's in place for when orders come in."*
- *"Project Links rail — Budget, Change Order Request Log, Forecast, Production, Project Charter, ROM, Field Daily Report."*

Let Chris react. He spent the call Sunday night walking Matt through this exact screen.

**Pivot trigger:** if they ask about the Gantt, scroll to bottom (if visible) or say *"Gantt comes from ERPNext's native Project view — wired up, not expanded on tonight."* Don't open the ERP to prove it unless pushed.

---

### T+20 → T+26 — Engineering pipeline (`/engineering/pipeline`)

Click **Engineering → Pipeline** in sidebar.

*"316 real Architectural jobs across 13 stages. This is the card view Drew opens when he's triaging."*

Walk left to right across stages: Uncategorized → Evaluation → Float → LO → LO Check → Sketch → Sketch Check → Correction → CNC Programming → Laser Programming → Punch Programming → Program Complete → Release to Shop.

Click a card → side drawer opens with the full 177-column record.

Filter by **Cole Norona** or **Marc Ribar** — show that the board respects PM ownership. (Drew will recognise this filter; he filters by PM every morning.)

*"Priority bars on the left edge are soft-prioritisation — material availability, machine availability, LD risk, profitability. Human-in-the-loop; Drew keeps the override."*

**Pivot trigger:** if the board feels slow with 316 cards, apologise, filter to one PM immediately. Do not re-render without a filter.

---

### T+26 → T+30 — Routes + NCR branching (`/engineering/routes/ROUTE-24060-BM01`)

Click **Engineering → Routes**, then open **ROUTE-24060-BM01** (Loves Blacksburg).

*"Every job gets a Route — the sequence of stations it passes through. Defined at estimate time, bespoke per project."*

Walk the pipeline viz at the top. Point at the **orange finishing node** branching off Flat Laser 2.

*"QC flagged burrs on the laser output. The router doesn't fail the job — it side-branches through Finishing, and rejoins at Press Brake. That's NCR loopback, the conversation Chris and I had Sunday about what happens when things don't go right."*

Demo the interaction:
- Drag the grip handle on one main step to reorder it. *"Top = do first. Step numbers renumber automatically."*
- Click the status dropdown on any step. *"In Progress / Complete / NCR Loopback. Shop lead flips this as the job moves."*

*Chris will notice:* the viz matches the "lines and balls" he described verbatim on the Sunday call.

**Pivot trigger:** if someone asks "where does the router live?" — *"ERPNext. Route is a real DocType, linked from every Work Order. Three seeded tonight; add more from this screen."* Don't open the ERP.

---

### T+30 → T+34 — Shop scheduler (`/shop/scheduler`)

Click **Shop Floor → Scheduler**.

*"This is the view Drew opens every morning. Rows × workstations. Colour-coded cells for status."* Full-bleed grid.

Point at a few cells. Show a cluster on Flat Laser 2 (setup for T+34 beat). Don't over-narrate — Drew built the current version in Excel, and this IS the current version, just live-wired.

*Chris will notice:* bottom-tabs style layout, per-workstation columns. The Missed Outsource Receipts, MX, PXL, PBM, FAB, GRINDING, QC, SLAB, SHIP tabs from Drew's Excel are recognisable as column groups.

**Pivot trigger:** if Drew-proxy pushback arrives ("that's not how I do it") — don't defend. *"This is draft. Chris said you'd want the final word on layout. What would you move?"* Note it in the backlog table.

**Then pivot right**: click **Ship Schedule** in the sidebar (new).

*"Same data, different cut. Every upcoming ship date, colour-coded for bottleneck. Red = five or more jobs that day. Yellow = three or four. This is the view Drew builds in Excel every Friday — automated."*

Hover a red cell → tooltip shows top jobs. Click → side panel with the full job list. 286 jobs, 138 unique ship dates.

*Chris will notice:* his team never had this auto-flagged before. Drew does it manually.

---

### T+34 → T+38 — The anomaly payoff (`/shop/flat-laser-2`)

Click any cell on Flat Laser 2, or navigate directly.

Workstation kiosk loads. **Clickable active anomaly banner** at top: **ANOM-2026-0042** — scrap pattern, nozzle-wear hypothesis.

**Click the banner.** Modal opens:
- Evidence: 3 affected jobs, $3,940 scrap
- Hypothesis: partial-nozzle fault
- Recommended actions: pull nozzle, verify kerf on test plate, re-queue affected jobs

*"This fires automatically. Operator, lead, and exec all see the same anomaly — with the reasoning. No mystery HOLD cards."*

This is the "AI in the shop" moment. Don't oversell. Let them process.

**Pivot trigger:** if they say "how did it know?" — one sentence: *"Claude reads the scrap pattern via the efficiency pipeline overnight. Audit-logged, cost-capped, no training on JWM data."* Move on.

---

### T+38 → T+42 — Floor open

Stop leading. Hand the floor:

*"That's the walk-through. Where would you go next?"*

Prepare chat prompts for John in case conversation lulls:
- *"Show me the engineering pipeline."*
- *"Why is scrap up on Laser #2?"*
- *"Who's carrying the biggest project book right now?"*
- *"How is IAD181 tracking on budget?"*

If Drew asks about scheduling → back to `/shop/scheduler`.
If a PM asks about their view → `/arch/pm/cole-norona`.
If anyone asks about QC → `/qc`.
If ERP / real database comes up → see cheat-sheet §3 item 2.

---

### T+42 → T+45 — Wrap

*"Chris has been recording — every reaction becomes the backlog. What's the one thing you'd want to see next?"*

Close laptop. Stop talking.

---

## 3. Cheat-sheet — exact things to say

Four callouts, drop verbatim where the moment lands.

### The router line (if asked about workflow — or unprompted when landing on IAD181)

> *"That path through the stations — laser, press brake, weld, and the side-branches when NCR hits — that's what Chris called a 'router' on Sunday night. ERPNext plus this UI can now show you the router live, per job, cradle to grave. The coloured balls at the top of the Project Dashboard are that router for IAD181."*

### The real-ERP line (only if asked)

> *"3,948 real schedule lines, 92 customers, 2,197 items, 52 workstations, 3 live routes, 430 daily efficiency rows — all in a live ERPNext behind this UI. Phase 1 migration is already in. You're not looking at mockups."*

### The headless-ERP framing

> *"The sexy front-end is what your team sees. ERPNext sits behind it, headless. Paul or Chris can log into the admin if they want to, but your shop floor, your PMs, your execs never need to. This is the surface."*

### The soft close — backlog capture

> *"Chris is recording this. Everything you flag today — 'I like this / I don't / we're missing X' — goes straight into the backlog for this week. So don't hold back."*

---

## 4. Failure modes + fallbacks

| Symptom | Say this | Do this |
|---|---|---|
| Authentik login fails for a team member | *"Fingerprint enrolment is still rolling out — jumping in as myself."* | Impersonate-as-Matt. Don't dwell. |
| Voice cuts mid-sentence | nothing — just keep going | Click speaker-off in chat tray |
| `/engineering/pipeline` slow (316 cards) | *"Filtering to one PM — the full board is a stress test."* | Immediately filter by division or PM |
| ERPNext requested but slow | *"Not going to open the backend — it's a safety net today, not a stop on the tour."* | Stay in the demo shell. `jwm-erp.beyondpandora.com` is optional. |
| John gives a weird answer | *"Prompt's still being tuned on that one."* | Click again or move on |
| Public URL 502 | *"Network hiccup — pulling local."* | `http://localhost:3100` fallback (Matt's laptop only) |
| Anomaly modal doesn't open | *"Hard-refresh picks it up."* | Cmd+Shift+R, re-click |
| Chris's menu SMS arrives mid-demo | nothing | Note the change, adjust sidebar after the call |

---

## 5. Backlog catcher

Fill this in live. Chris is recording audio; this is the written shadow.

| When | Who | Feedback / reaction | What they want |
|---|---|---|---|
| T+ | | | |
| T+ | | | |
| T+ | | | |
| T+ | | | |
| T+ | | | |
| T+ | | | |
| T+ | | | |
| T+ | | | |

---

## Credentials quick-ref

- **Demo shell:** `https://jwm-demo.beyondpandora.com` — Authentik SSO
- **ERPNext:** `https://jwm-erp.beyondpandora.com` — Administrator / `JWMdemo2026!`
- **n8n (public, no Authentik as of tonight):** `https://n8n.beyondpandora.com` — `matt@beyondpandora.com` / `JWMdemo2026!`
- **n8n LAN backup:** `http://10.90.10.7:5678`
- **Localhost fallback (Matt's laptop):** `http://localhost:3100`

---

## Post-demo (T+45 onwards)

- [ ] Pull Chris's recording → transcribe → backlog items → Plane
- [ ] Merge live backlog table (§5) with recording
- [ ] Send Chris the updated PRD reflecting Monday's feedback
- [ ] Schedule follow-up within 72 hours
- [ ] If menu SMS arrived: refactor sidebar, redeploy, tell Chris
