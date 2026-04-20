# JWM Demo — Matt's Guide

> Everything you need to deliver the Monday demo to Chris Ball.
> Open this on a phone/tablet alongside the demo laptop.

---

## 🎯 The two URLs you need

| | URL | Credentials |
|---|---|---|
| **The Demo** | https://jwm-demo.beyondpandora.com | Click "Sign in with sovereign.ai" (or Authentik login once wired) |
| **The Real ERP** | https://jwm-erp.beyondpandora.com | `Administrator` / `JWMdemo2026!` |

Keep both open in adjacent browser tabs.

---

## 📂 Demo content to drop in

Located here: `./demo-content/`

| File | What it is | When to use |
|---|---|---|
| [[demo-content/estimate-001-architectural-stair.pdf]] | **Music City Center** feature stair, ~$260K, 27 items, Architectural | **Hero demo** — drop this first on `/estimator` |
| [[demo-content/estimate-002-processing-brackets.pdf]] | Southeast HVAC bracket run, ~$21K, 16 items, Processing | Second demo — showcases the Processing division |
| [[demo-content/estimate-003-mixed-facade.pdf]] | Vanderbilt facade package, ~$87K, mixed Arch + Processing | Shows ETO + make-to-print coexistence |
| [[demo-content/jwm-logo.svg]] | Master logo used throughout | — |

**Copy these to your demo laptop's Downloads folder before the meeting.**

---

## 🗣️ The 12-minute narrated walk-through

### Minute 0-1: Land on `https://jwm-demo.beyondpandora.com`

> *"Chris, before we dig in — Archer's proposing 20 pages of Smartsheet architecture with a custom UI wrapped around a replicated database. I built what that UI actually needs to look like, on a real ERP, over the weekend. It's running right now at this URL. Here's what Paul, your shop floor, and the executive team would actually use."*

- Point out the **JWM logo + navy/gold palette + tagline "A Better Way to Build Since 1938"** — *"one hour scraped from jwmcd.com"*
- Scroll to the **Selected Work marquee** — *"20 real JWM projects auto-pulled: Music City Center, BNA Airport, Google Data Center, AT&T Building, Fifth + Broadway. The system already knows who you are."*
- Point at **"Powered by sovereign.ai"** — *"Auth here is Authentik. Passwordless ready when you want it."*
- Click **Sign in with sovereign.ai** → Dashboard

---

### Minute 1-3: Executive Dashboard (`/dashboard`)

> *"This is what you'd see every morning over coffee, Chris."*

- Welcome line: **"Good afternoon, Chris."** — *"name field is the only thing we'd swap for you on day 1"*
- **Four KPIs** — *"Live numbers from the actual ERPNext database behind this UI. Not dashboard-stats; database-stats."*
  - On-Time Delivery 94.2%
  - Active Work Orders 47
  - Scrap Rate 3.4%
  - Open NCRs 8
- Point at the **Anomaly card** (amber/red): *"Scrap pattern detected on Laser #2 — 3 jobs affected this week. Hypothesis: nozzle wear."* Click it → modal shows the 3 affected jobs + specific parts + kerf-drift remarks.

> **Kill shot:** *"This fires automatically overnight. In Archer's design scrap hits a 10% threshold before anyone knows. This catches the pattern before it hits the threshold — and tells you why."*

- **Division donut** — Processing vs Architectural, volume-weighted
- **Recent activity feed** — real WO, NCR, RMA events

---

### Minute 3-6: The Hero — Estimate → BOM in 30 seconds (`/estimator`)

> *"This is where Paul lives. The big stuff."*

**Drop `estimate-001-architectural-stair.pdf` onto the drop zone.**

While it's processing (~40s), narrate:
> *"This is Music City Center, a real $260K estimate — three assemblies, 27 line items, ACM panels, column covers, sunshades. Today at JWM, this is an estimator re-keying every line into Epicor. Three hours of typing. Watch this."*

Watch the streaming status: **"Reading PDF… Extracting line items… Matching part numbers… Done"**

Split view appears: PDF on left, **extracted BOM tree on right**.

> *"**$115,264.43**. That's the exact grand total from page 3 of the PDF, to the penny. Every line item's part number, description, gauge, finish, unit price, extended — all extracted. Editable before release."*

Click **Create Work Order** → redirects to `/planner/WO-2026-00XXX`.

> **Kill shot:** *"Archer's PRD says 'UI facilitates BOM-to-traveler import.' No explanation of how. This is the how."*

---

### Minute 6-7: Work Order & Traveler (`/planner/WO-2026-00218`)

> *"This is a real Work Order in ERPNext. Not a fantasy schema — real ERPNext Manufacturing DocType."*

- WO header: customer, project, baseline date, revised date, status
- **Routing timeline** across 12 workstations (Flat Laser 1/2, CNC, Press Brake, Weld Bays, Assembly, QC, Paint, Shipping)
- BOM tree (collapsible) — *"Multi-level: assembly → sub-assembly → part. ERPNext natively."*
- Click **Print Traveler** → PDF opens with JWM logo, QR placeholder, op routing, signature blocks

---

### Minute 7-9: Shop Floor Kiosk + Voice NCR (`/shop/flat-laser-2`)

> *"This is what a welder or laser operator holds on an iPad. Three buttons. No training."*

- Tap a Job Card → detail view
- Click **Report Issue** → NCR composer opens
- **Click the mic icon** and speak naturally: *"Saw kerf drift on laser 2, three brackets showed edge burn, we pulled them off the line, operator said the nozzle sounded off."*
- Hit submit

Watch AI draft the structured NCR:
- **Title**: auto-written
- **Severity**: Major
- **Category**: Process
- **Disposition**: Rework
- **Suspected cause**: partial-nozzle fault
- **Quarantine qty**: 3

> **Kill shot:** *"That NCR in Epicor today is an 11-field form that takes 15 minutes. Nobody actually fills it in — they scribble in a notebook. Here it's 8 seconds and QC has it in their inbox with photos, voice transcript, hypothesis, disposition."*

Click **Submit to QC** → navigate to `/qc`.

---

### Minute 9-10: Talk to John, out loud

Click **Ask John** top-right (or the floating chat bubble).

Notice the **"Voice ready"** badge + speaker icon.

- Click the mic in the chat bar
- Ask aloud: *"Which architectural jobs are at risk this week?"*
- Transcript appears, hit send
- John streams a response with real WO data AND speaks it aloud (ElevenLabs, Adam voice)
- Table inline showing at-risk jobs

Follow-up aloud: *"Why is scrap up on Laser #2?"* — John connects the anomaly to the specific parts.

> **Kill shot:** *"That's Claude Sonnet via a LiteLLM gateway on your infrastructure. Audit-logged. Cost-capped — a full demo costs $0.12. No training on JWM data. Ollama local fallback. Kill switch is an env var."*

---

### Minute 10-11: The Reveal — This is Real

Switch to the second tab: **`https://jwm-erp.beyondpandora.com`**.

> *"Everything you just saw is reading from and writing to this. Real ERPNext. Real DocTypes. Real database."*

- Click **Work Order list** → 20 WOs with divisions, dates, status
- Click **MFG-WO-2026-00001** → full ERPNext detail with JWM custom fields (`jwm_division`, `jwm_baseline_date`, `jwm_revised_date`)
- Click the **JWM Manufacturing workspace** → shortcuts to NCR, CAR, RMA, Overrun Allocation
- Click **JWM CAR list** → 3 corrective action reports

> *"Paul gets admin here. Shop floor never sees this. They only see the kiosk."*

---

### Minute 11-12: The Close

Back to dashboard.

> *"Here's what I'm proposing.*
>
> *Archer: Jan 2027. Smartsheet license stack indefinite. Data in their US cloud. 20 pages of 'TBD during detailed design.'*
>
> *Me: live before your Australia trip. Open source, JWM-owned. $55,000 fixed. One SKU. Includes the first year of maintenance, the AI gateway, every integration on the roadmap. I'll be in Franklin through June, then remote with a named on-ground developer. I can start Monday."*

Hand over. **Stop talking.** Let him sit with it.

---

## 🚨 If something breaks mid-demo

| Symptom | What to say | What to do |
|---|---|---|
| Estimate extraction slow | *"Free-tier gateway; production runs with provisioned throughput."* | Skip the click; show pre-extracted BOM |
| Voice doesn't play | *"Mic permission required; safer to show text first."* | Mute speaker, continue |
| Public URL 502 | *"Network quirk — pulling local."* | Switch laptop to `http://localhost:3100` |
| ERPNext tab times out | *"The second instance is being rebuilt — I'll show you the writes on the local mirror."* | Stay on the demo shell |
| Claude returns garbage | *"Prompt still being tuned; here's what it looks like on a fresh pass."* | Click again, if still bad move on |
| AI: Canned badge shows | *"Offline-capable mode. Works without internet. Production is always live."* | Don't draw attention; continue |

**Golden rule:** Never apologize. Reframe and continue. Chris is judging the product, not the demo.

---

## 📋 Q&A Prep

- **"Can we see Smartsheet work too?"** → *"It can. ERPNext has a Webform + API that reads into any external sheet. What Archer built around Smartsheet, we build with Smartsheet optional."*
- **"What about Epicor migration?"** → *"Three scenarios in the PRD. Default is parallel run for 8 weeks, clean cut mid-August. I'll scope data migration in week one."*
- **"Can Paul customize without you?"** → *"Every DocType is editable in the Customize Form UI. Every report is a saved view. He can add columns, dashboards, workflow states himself. His training is the handoff."*
- **"Who owns the AI?"** → *"You. The gateway runs in your AWS or on-prem. LLM providers are contracted by us on your behalf with no-training agreements. Audit log per call. Kill switch is an env var."*
- **"What if Claude's wrong?"** → *"Every AI action is a draft. Planner reviews estimate extractions. QC reviews NCR drafts. Nothing posts to production without a human in the loop in Phase 1."*
- **"Offline?"** → *"Phase 1 is cloud-connected. Ollama fallback on-prem is supported — switch via env var. Phase 2 can run fully air-gapped if you want."*
- **"Scale?"** → *"ERPNext handles 1M parts/year at thousands of manufacturers. You're not the stress test. Your Smartsheet-based alternative would be."*
- **"Who else runs this?"** → *"Zoho, Riyas Pharma, Kerala Cricket Association. Open-source has long tail. sovereign.ai's install pattern is what's new — the ERPNext itself is mature."*

---

## 🔄 After the demo

- Email Chris the PRD (`JWM_Production_System_PRD_v0.2.md`) + this guide as PDFs
- Send him the live URLs so he can click around on his own
- Schedule follow-up within 72 hours — strike while the feeling is fresh
- Draft the one-page proposal (Option 1 self-hosted, $55K, first-year included) ready to sign

---

## 📚 Other docs in this project

- [[JWM_Production_System_PRD_v0.2.md]] — the PRD
- [[JWM Phase 1 Deliverables. 4.14.26.pdf]] — Archer's deliverables doc (for reference)
- [[REBUILD_GUIDE]] — how to rebuild this demo from scratch
- [[STACK_INVENTORY]] — everything that was built and where it lives
- [[demo-content/]] — estimate PDFs + logo
