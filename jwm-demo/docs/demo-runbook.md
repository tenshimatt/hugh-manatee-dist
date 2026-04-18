# JWM Demo Runbook — Chris Ball meeting, Monday 2026-04-20

> **Goal:** replace Archer's Smartsheet proposal in Chris's head within 15 minutes.
> **Tone:** confident, quiet, specific. Let the product do the talking.

---

## Pre-demo checklist (5 min before)

- [ ] Open **`https://jwm-demo.beyondpandora.com`** (or `http://localhost:3100` if public URL wobbles)
- [ ] Sign in → land on Dashboard
- [ ] Confirm **top-bar pill reads "AI: Live"** (green dot). If "Canned" — env var issue, still works, mention offline-capable as a positive
- [ ] Open chat drawer once, confirm **"Voice ready"** badge is green
- [ ] Click speaker icon once to test TTS fires cleanly (close + reopen)
- [ ] Laptop volume at 60-70%, airpods out if possible (speaker = more theatrical)
- [ ] Have `estimate-001-architectural-stair.pdf` in Downloads, easy to drag
- [ ] Second tab: **`https://jwm-erp.beyondpandora.com`** (already logged in) — for the "this is a real ERP" reveal
- [ ] Third tab: this runbook, scrolled to the right section

**Emergency fallback:** if any step hangs, keep talking, say *"this is where we normally see X, here's what it renders"* and move on. The rest is still live.

---

## The 12-minute walk-through

### Minute 0-1 — The setup (no clicks yet)

> *"Before we dig in — Archer's proposing 20 pages of Smartsheet architecture with a custom UI wrapped around a replicated database. I built what that UI actually needs to look like, on a real ERP, over the weekend. It's running right now. Here's what Paul, Chris, and the shop floor would actually use."*

Land on `/` (landing page).

**Talking points:**
- JWM logo, branding, navy + gold — *"your palette, your logo, your tagline. One hour scraped from jwmcd.com"*
- Scroll down — **Selected Work marquee** — *"20 real JWM projects loaded. Convexity, Google DC, BNA, Music City Center, Fifth + Broadway. The system knows who you are."*
- **"Powered by sovereign.ai"** + SSO — *"This is where Authentik would plug in. Chris, on Monday this is a passwordless rollout to Paul and your leads."*
- Click **Sign in with sovereign.ai** → Dashboard.

---

### Minute 1-3 — The executive dashboard (Chris sees this at 7am with coffee)

Land on `/dashboard`.

**Talking points:**
- *"Good afternoon, Chris."* — personalized greeting (the only header field you'd swap for his actual name on day 1)
- Four KPIs: On-Time Delivery 94.2%, Active WOs 47, Scrap Rate 3.4%, Open NCRs 8 — *"These are real numbers from the real ERPNext instance behind this UI. Not stats on a dashboard — stats from the database of record."*
- **Anomaly card** (amber/red): *"Scrap pattern detected on Laser #2 — 3 jobs affected this week. Hypothesis: nozzle wear."* — **click it** — modal shows the 3 jobs, specific parts, kerf-drift remarks.
  - *"This fires automatically overnight. Archer's design has scrap hit a 10% threshold before anyone knows. This one catches the pattern before it hits the threshold."*
- Division mix donut — *"Processing vs Architectural. Volume-weighted, as you'd expect at $30M going to $100M."*
- Recent activity feed — real WO, NCR, RMA, release events

---

### Minute 3-6 — The hero moment: Estimate → BOM in 30 seconds

Click **Estimator** in sidebar. Land on `/estimator`.

**Drag `estimate-001-architectural-stair.pdf` onto the drop zone.**

Narrate while it's processing (~40s for Claude to extract):
- *"This is Music City Center, a real $260K estimate — three assemblies, 27 line items, ACM panels, column covers, sunshades. Today at JWM this is Paul or an estimator re-keying every line into Epicor. Three hours of typing. Look at this."*
- Show streaming status — "Reading PDF… Extracting line items… Matching part numbers… Done"
- Split view appears: PDF on left, **extracted BOM tree on right**
- Point at the total — *"$115,264.43. That's the exact grand total from page 3 of the PDF. Claude pulled it to the penny. Every line item's part number, description, gauge, finish, unit price, extended — all extracted."*
- Click **Create Work Order** → redirects to `/planner/WO-2026-00XXX`

> **Archer's line in the PRD** was "UI facilitates BOM-to-traveler import." No how. This is the how.

---

### Minute 6-7 — The Work Order / traveler

Land on `/planner/WO-2026-00218` (or whatever was just created).

**Talking points:**
- WO header: customer, project, baseline date, revised date, status, BOM
- Routing operations timeline across workstations — *"Each row here is a Job Card. A Job Card is an ERPNext standard entity. Paul does not need to configure this from scratch; it's been running at thousands of manufacturers."*
- BOM tree with assemblies / sub-assemblies / parts
- Click **Print Traveler** → PDF with JWM logo, QR placeholder, op routing, signature blocks

---

### Minute 7-9 — Shop floor kiosk + voice NCR (the "oh" moment)

Click **Shop Floor → Flat Laser 2** in sidebar. Land on `/shop/flat-laser-2`.

**Talking points:**
- *"This is what a welder or laser operator holds on an iPad. Big buttons. Your shop floor team does not log into ERPNext. They see their queue, their current job, and three buttons."*
- Tap a Job Card → detail view, big Start / Complete / Report Issue buttons
- **Click "Report Issue"** → NCR composer opens
- Type or speak: *"Saw kerf drift on laser 2, three brackets showed edge burn, we pulled them off the line, operator said the nozzle sounded off."*
- Click submit → *"AI drafting NCR…"* → structured NCR appears with:
  - Title auto-written
  - Severity: **Major**
  - Category: **Process**
  - Disposition: **Rework**
  - Suspected cause: **partial-nozzle fault**
  - Quarantine qty: **3**
- *"An operator typing that NCR in Epicor today is an 11-field form that takes 15 minutes. Nobody does it. They scribble in a notebook. Here, it's 8 seconds — and now QC has it in their inbox."*
- Click **Submit to QC** → navigate to `/qc`

---

### Minute 9-10 — Chat with John (voice)

Click **Ask John** top-right (or floating chat button).

**In the chat:**
- **Click the mic icon** → ask aloud: *"Which architectural jobs are at risk this week?"*
- Let the transcript appear, hit Send.
- John streams back a real answer (Claude reads the canned context which includes real WO-2026-00218 data) + **speaks it aloud via ElevenLabs** in a deep American male voice.
- Table inline showing the at-risk jobs with dates and deltas.

Ask a follow-up: *"Why is scrap up on Laser #2?"* — John connects the anomaly to the specific parts.

**Talking point:**
- *"That was real Claude Sonnet via a LiteLLM gateway on your infrastructure. Audit-logged. Cost-capped. No training on JWM data. Ollama fallback for the most sensitive stuff."*

---

### Minute 10-11 — The "this is real" moment

Switch to the second tab: **`https://jwm-erp.beyondpandora.com`**.

- *"Everything you just saw is writing to this. Real ERPNext. Real DocTypes. Real database."*
- Click Work Order list → 20 WOs with divisions, dates, status
- Click into MFG-WO-2026-00001 → full ERPNext detail with JWM custom fields
- Click the workspace → JWM Manufacturing module with shortcuts to NCR, CAR, RMA, Overrun
- *"Paul gets admin here. Shop floor never sees this. They only see the kiosk."*

---

### Minute 11-12 — Close

Back to dashboard.

> *"Archer's proposal: Jan 2027. Smartsheet license stack indefinite. Data in their US cloud. 20 pages of 'TBD during detailed design.'*
>
> *Mine: live before your Australia trip. Open source, JWM-owned. $55K. One SKU. Includes the first year of maintenance, the AI gateway, and every integration on the roadmap. I'll be in Franklin through June, then remote with a named on-ground developer. I can start Monday."*

Hand over. Stop talking.

---

## Common questions + crisp answers

- **"Can we see Smartsheet work too?"** — *"It can. ERPNext has a Webform + API that reads into any external sheet. What Archer built around Smartsheet, we built with Smartsheet optional."*
- **"What about Epicor migration?"** — *"Three scenarios in the PRD. Default is parallel run for 8 weeks, clean cut mid-August. I'll scope data migration in week one."*
- **"Can Chris customize without us?"** — *"Every DocType is editable in the Customize Form UI. Every Report is a saved view. He can add columns, dashboards, workflow states himself. Paul's training is the handoff."*
- **"Who owns the AI?"** — *"You. The gateway runs in your AWS or on-prem. LLM providers are contracted by us on your behalf with no-training agreements. Audit log per call. Kill switch is an env var."*
- **"What if Claude's wrong?"** — *"Every AI action is a draft. Planner reviews estimate extractions. QC reviews NCR drafts. Nothing posts to production without a human in the loop in Phase 1."*

---

## Failure modes + recovery

| Symptom | Say this | Do this |
|---|---|---|
| Estimate extraction slow | *"Free-tier gateway; your production deployment runs with provisioned throughput."* | Skip the click, show pre-extracted BOM |
| Voice doesn't play | *"Mic permission required; safer in demo to show text first."* | Mute speaker, continue |
| Public URL 502 | *"Network quirk — pulling local."* | Switch laptop to localhost:3100 |
| ERPNext tab times out | *"The second instance on CT 171 is being rebuilt — I'll show you the writes on the local mirror."* | Stay on the demo shell, don't switch tabs |
| Claude returns garbage | *"The prompt on this one is still being tuned; here's what it looks like on a fresh pass."* | Click again; if still bad, move on |

---

## After the demo

- Email Chris the PRD (v0.2) + this runbook as a PDF
- Send him the credentials + demo URL so he can click around on his own
- Schedule follow-up within 72 hours while the feeling is fresh
- Draft the one-page proposal (Option 1 self-hosted, $55K, first-year included) ready to sign

---

## Credentials quick-ref

- Shell: https://jwm-demo.beyondpandora.com (or http://localhost:3100)
- ERPNext: https://jwm-erp.beyondpandora.com · creds in `docs/credentials.md` (gitignored)
- AI Gateway: https://jwm-ai.beyondpandora.com · key in `docs/credentials.md` (gitignored)
- See `/Users/mattwright/pandora/jwm-demo/docs/credentials.md` for full set
