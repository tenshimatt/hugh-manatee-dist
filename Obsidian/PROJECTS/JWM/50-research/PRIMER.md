# JWM — Matt's Primer

> Read this if you want to actually understand what we built, in about 10 minutes.
> Not a demo script. Not a quote. Not a changelog. Just: the mental model.

---

## The two-sentence version

**We put a branded Next.js operational UI ("the shell") in front of a real ERPNext instance, wired AI flows through a LiteLLM gateway, and glued everything together with Authentik SSO, Traefik routing, and n8n for the things that need cron.** The shell is what JWM users click; ERPNext is the system of record; LiteLLM is the neutral AI broker; everything else exists to make those three talk without surprises.

If you can say that out loud, you can hold the room.

---

## The physical picture

Three things live at three URLs:

| URL | What it is | Who touches it |
|---|---|---|
| `jwm-demo.beyondpandora.com` | The shell — every screen we built | Everyone (Chris, Drew, Paul, operators) |
| `jwm-erp.beyondpandora.com` | Real ERPNext + our `jwm_manufacturing` custom app | Paul for admin; Caitlin for finance (later); Chris for "is this real" |
| `jwm-ai.beyondpandora.com` | LiteLLM gateway (shared with other BP services) | Nothing human clicks here; all AI calls route through it |

Behind those three URLs are containers on your Proxmox:

- **CT 120** runs the shell (Next.js on systemd, port 3200)
- **CT 171** runs ERPNext (Docker stack, MariaDB + Redis + Frappe)
- **CT 123** runs LiteLLM (Docker, with PostgreSQL for spend logs)
- **CT 146** has the GPU (Ollama models for fallback) — *the whisper we had here was failing, now deprecated*
- **CT 107** runs n8n (for the PLAUD pipeline + anything scheduled)
- **CT 103** (Traefik), **CT 105** (Authentik), **CT 113** (Cloudflared) do plumbing

That's the whole physical system. If someone asks "where does X live", it's one of those CTs.

---

## The shell, layer by layer

The shell has 4 kinds of screen:

**1. Entry** (landing + sign-in) — `/`

**2. Operational (the stars of the demo)**
- `/shop` — Drew's morning view. 12 workstation cards + anomaly inbox + critical path.
- `/shop/scheduler` — the Excel-alive view. Jobs × workstations grid, status-coloured cells. *This is the one that makes Drew feel seen.*
- `/shop/efficiency` — Drew's 6 KPIs, with a 14-day trend + today's entries table.
- `/shop/efficiency/new` — operator data-entry form with live efficiency % preview.
- `/shop/[workstation]` — thick operator kiosk (big buttons, swipe to start, scrap reason picker, handoff modal, voice-to-NCR).
- `/shop/lead` — **stub** (labelled Phase 2 Gantt; read this as "nothing here yet").

**3. Workflow**
- `/erf` — list of Engineering Request Forms
- `/erf/new` — submit an ERF
- `/erf/[id]` — drafting workbench (BOM builder, routing editor, release to shop)
- `/planner/[wo]` — work order detail with routing timeline + BOM tree
- `/qc` — NCR inbox
- `/estimator` — drop a PDF, get a BOM back

**4. Context / admin**
- `/dashboard` — Chris's exec view (KPIs + anomaly card + activity feed) — **demoted from hero to "supporting material" in the new narrative**
- `/admin` — demo reset button + links to raw ERPNext

**Persistent UI chrome across all screens:**
- TopBar with logo, search (cmd-K not wired yet), AI-live pill, data-live pill, anomaly bell, "Ask John" button, avatar
- Left sidebar (collapsible) with nav
- Right-side AI drawer ("John") that opens with a click and persists

That's the UI inventory. If it's not on that list, it doesn't exist.

---

## What's real vs what's canned vs what's stubbed

You will get asked this. Know where the lines are.

### Real (backed by ERPNext REST calls, live data)
- All 20 Work Orders at `/planner/[wo]`
- All 12 Workstations on `/shop`
- Job Cards per WO / workstation
- NCR list on `/qc` (3 records)
- KPI numbers on `/dashboard` (computed from live WOs + NCRs + Stock Entries)
- Estimator PDF → BOM extraction (Claude via LiteLLM, real parse)
- John chat (real streaming Claude with real context injection)
- Voice output (ElevenLabs, real TTS streaming)
- Voice input (Web Speech API, real browser STT)
- NCR voice drafting (Claude, vision-capable)
- Anomaly detection on scrap events (real Claude pattern analysis)

### Canned (data in `lib/canned/*.json`, served from stub API routes)
- ERF records (the DocType doesn't exist in ERPNext yet — this is Phase 2)
- Efficiency events (~91 records; same — ERPNext Efficiency Event DocType is Phase 2)
- Scheduler grid (24 jobs × workstation columns; backed by JSON, not live WO cells because the ERPNext Work Order DocType doesn't have per-workstation scheduled dates)
- Recent activity feed items
- Project marquee (20 JWM projects scraped from jwmcd.com once, static)

### Stubbed (button exists, action doesn't do the thing yet)
- Scheduler drag-to-reschedule (button disabled, "Phase 2")
- ERF "Help me fill this" AI button (canned pattern-match response, not a real LLM call)
- `/shop/lead` Gantt page (placeholder only)
- Command palette (⌘K in search bar — not wired)
- Reset-to-seed button on `/admin` for ERPNext side (clears demo session state; does not reset ERPNext data)

**Rule of thumb for you:** if Chris asks "does this work?", the answer is yes for everything in "Real" and "Canned" (the canned stuff *behaves* like it works, just doesn't round-trip to a real DocType yet). If he digs into a stubbed control, be straight — "that's Phase 2; the shape is here so you can see how it'll land."

---

## The AI layer in one diagram

Everything AI flows through LiteLLM. Four distinct flows:

```
┌─ /estimator drag-drop ─┐   ┌─ "Ask John" chat ──────┐
│  PDF → pdf-parse        │   │  text/voice → system  │
│  → Claude JSON extract  │   │  prompt + live context│
│  → BOM tree             │   │  → streaming markdown │
└────────┬────────────────┘   └──────────┬────────────┘
         │                               │
         ▼                               ▼
   ┌────────────────── LiteLLM gateway (CT 123) ───────────┐
   │ Provider routing · audit log · budget cap · no-train  │
   │ → Anthropic Claude Sonnet 4.6 (primary)               │
   │ → Ollama on PCT 146 (local fallback)                  │
   │ → ElevenLabs for TTS · OpenAI Whisper for STT         │
   └────────────────┬─────────────────┬────────────────────┘
                    ▲                 ▲
                    │                 │
┌───────────────────┴──┐  ┌───────────┴──────────────┐
│ Anomaly detector     │  │ Voice NCR from shop floor│
│ (n8n cron, scrap     │  │ (operator taps Report    │
│  events → Claude →   │  │  Issue, speaks, Claude   │
│  top pattern)        │  │  drafts structured NCR)  │
└──────────────────────┘  └──────────────────────────┘
```

Cost per demo run: roughly $0.12. The gateway is the sovereignty story — it's *your* broker, not Anthropic's, and if you want to cut off Anthropic tomorrow you change one env var and route to Ollama. That's the thing Chris is buying.

---

## The ERPNext layer

ERPNext ships with hundreds of DocTypes. You care about these:

**Standard ERPNext we use:** Customer, Item, BOM, Sales Order, Work Order, Job Card, Workstation, Operation, Stock Entry, Quality Inspection.

**Custom (our `jwm_manufacturing` app):**
- `NCR` — non-conformance reports
- `JWM CAR` — corrective action reports
- `RMA` — returns with disposition workflow
- `JWM Overrun Allocation` — extra parts produced
- `Project Traveler` — simpler alternative to Sales Order for quick-release jobs

**Custom fields on stock DocTypes:**
- `Work Order.jwm_division` (Processing / Architectural / Mixed)
- `Work Order.jwm_baseline_date` (immutable promise date)
- `Work Order.jwm_revised_date` (reschedulable date)
- `Stock Entry.jwm_workstation` (for the anomaly detector)
- `Customer.jwm_customer_tier`

**The branding layer** (what makes it look JWM, not stock ERPNext):
- CSS file at `jwm_manufacturing/public/css/jwm_brand.css` — navy navbar, gold accents, cream body wash
- Logo + favicon + app name set via Website Settings + Navbar Settings
- Login page reads "Login to JWM" not "Login to Frappe"

Chris clicking "View raw ERPNext" during the demo will see the JWM-themed Desk with those custom DocTypes in the sidebar. That's the "this is real" moment.

---

## Six things I can't learn for you

Things Chris might ask that need YOUR domain read, not ours:

1. **What's Archer actually quoting for Phase 1 build?** Our $430K–550K 2-year TCO number is based on Smartsheet list prices; Archer is certainly discounting. If Chris says "Archer's at $X" we need to know to compare honestly.
2. **Epicor contract renewal date + data extraction terms.** Phase 4's "Epicor decommission" presumes you can extract everything. If Epicor refuses to export schemas cleanly, our parallel-run Phase 2–3 gets messier.
3. **Caitlin's comfort with ERPNext Accounting.** We've quoted Spectrum-stays for Year 1 partly because her read matters more than ours. If she's an advocate, Phase 5 can happen sooner and cheaper.
4. **The actual cost of the processing division's $500K/month losses.** That's a scope-expanding signal — if the fix is a scheduler that doesn't miss outsource receipts, Phase 2 is *very* high-value and our quote should acknowledge it.
5. **Jan 2027 deadline reality.** If it's an Archer-imposed schedule, our March 2027 is fine. If it's a fiscal/customer trigger, we need to rethink.
6. **Authentik rollout appetite.** The passwordless / SSO-for-everyone story is a Phase 2 expansion we haven't quoted. Some clients love it, some find it alarming. Chris's read here shapes whether we lead with it or save it.

Come back from Monday with answers to as many of these as you can. They reshape the commercial quote.

---

## Questions Chris will almost certainly ask — rough answers

- **"Is this really live?"** → Open ERPNext in a second tab. Show him the JWM Manufacturing workspace. Click a Work Order. Point at the jwm_division field.
- **"What happens if Anthropic goes down?"** → LiteLLM has Ollama fallback; env-var flip, zero code change. For some flows we'd degrade gracefully (no AI anomaly detection for a day), for others we'd lose little (estimator falls back to manual entry, which is the current baseline anyway).
- **"Who supports this?"** → You. With Claude as build capacity. Named backup operator (Asaf/Mark). Paul as internal admin by end of Phase 1 training. Cutover contractor for 4 weeks during Phase 3.
- **"What data migrates from Epicor?"** → Master data on day one of Phase 2 (customers, items, BOMs). Open transactions at cutover (POs, SOs, WOs). Historical for year-over-year reports; scoped per his preference — typically 3 years of closed jobs, archive anything older.
- **"Show me a report."** → Click into ERPNext Desk → Reports → Work Order Summary / Inventory Balance / etc. Real reports, not mockups. Phase 3 adds Frappe Insights for Chris-configurable dashboards.
- **"What about AIA billing?"** → Phase 3 adds a construction-billing mode on Sales Invoice with AIA G702/G703 forms + retention field + SOV. Not in the demo yet; it's ~15-20 dev-days of work. If Chris pushes on this, tell him we specifically priced it into Phase 3.
- **"Can we integrate with X?"** (Avalara, EasyPost, CAD/CAM, whatever) → ERPNext REST API is the answer for 95% of cases. Specific integrations quoted per item.
- **"What can this *not* do?"** → Read the "Known limitations" in `FEATURES_WORKING.md`. Be honest: no offline mode yet, chat history doesn't persist across reloads, command palette is a placeholder. None are dealbreakers.

---

## The three docs you should have ready on your other monitor Monday

1. **`jwm-demo/docs/demo-runbook.md`** — minute-by-minute script. Hold it as a safety net.
2. **`Obsidian/PROJECTS/JWM/50-research/council/SYNTHESIS_v2.md`** — the commercial posture, in case the room goes to commercials faster than you expect. $165K + $25K contingency. Phase 1+2 = $95K for a one-page engagement letter Monday.
3. **`Obsidian/PROJECTS/JWM/00-meta/MONDAY_PREP.md`** — end-of-day status so you know what changed last (shop pivot + Monday-3 + PLAUD fix).

That's it. If you've read this far, you can hold the room.

---

## Linked docs (if you want to go deeper)

- [[FEATURES_WORKING]] — every feature, with "try this right now" steps. Good for onboarding Asaf/Mark.
- [[BUSINESS_WORKFLOW]] — 15-step end-to-end flow, JWM side.
- [[STACK_INVENTORY]] — every component + where it lives.
- [[REBUILD_GUIDE]] — how to recreate all of this from scratch on fresh infra.
- [[council/06-reference-architecture]] — the full architect-grade diagram + decisions (6000 words, reference doc).
- [[council/04-commercial-quote]] — v1 quote (superseded by SYNTHESIS_v2 numbers).
- [[DEMO_GUIDE]] — earlier walkthrough (some stale, still has good Q&A bank).
- [[CHANGELOG]] — chronological record of everything built.
