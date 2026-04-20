# Monday Pre-Meeting Prep — 2026-04-20

> Working notes from the 2026-04-19 session. Matt is away; this is the end-of-day status.
> Meeting is Monday AM with Chris + team. Matt to meet Chris early AM to review demo.

---

## What's live right now

- **Demo shell**: https://jwm-demo.beyondpandora.com
- **ERPNext backend**: https://jwm-erp.beyondpandora.com (admin creds in `jwm-demo/docs/credentials.md`, gitignored)
- **Users provisioned in Authentik**: Chris Ball (cball), Mark Slingsby (mslingsby), Asaf Shaked (ashaked)

## What was built today

### Shop-focused overhaul (DEPLOYED)
Phase 1 complete, live on jwm-demo. 7 commits on `feat/jwm-demo` (pushed).

- **Sidebar reorder**: Shop → ERF → Dashboard → Estimator → Planner → QC → Admin
- **Post-login lands on `/shop`** (not `/dashboard`) — shop-first narrative
- **`/shop`** — workstation grid, anomaly inbox, critical path
- **`/shop/lead`** — stub page for Phase-2 Gantt
- **`/shop/[workstation]`** — thickened kiosk with handoff modal + 5s polling
- **`/erf`, `/erf/new`, `/erf/[id]`** — Engineering Request Form surfaces, canned store
- **Anomaly bell in TopBar** — persistent floor-level surface, not just exec
- Runbook updated (`jwm-demo/docs/demo-runbook.md`) with the new narrative

### LiteLLM → OpenAI Whisper migration (LIVE)
Local whisper on PCT 146 (fragile, OOM'd losing Chris's recording) replaced with LiteLLM-routed OpenAI Whisper.

- OpenAI key added to CT 123 `/opt/docker/litellm/.env`
- `whisper-1` + `whisper-deepgram` models registered in LiteLLM config
- Dedicated `plaud-pipeline` virtual key with $50/30d budget
- n8n WF-1a Whisper Transcribe node rewritten to call `http://10.90.10.23:4000/v1/audio/transcriptions`
- **Verified: the 41-min JWM recording that failed earlier today transcribed successfully at 17:22 via the new path**

### Monday-3 deliverables (BUILT + DEPLOYED + LIVE)
All 3 pieces Matt committed to Chris this evening are live at jwm-demo.beyondpandora.com:

1. **`/shop/scheduler`** — Excel-like grid reading JWM's actual 1010/1040 column structure. Job rows × workstation columns. Status-coloured cells (green on track / amber at risk / red behind). Division filter tabs. CSV export. Drag-to-reschedule stubbed (Phase 2 — button labelled, disabled).
2. **`/shop/efficiency`** — 4 KPI cards (today's overall efficiency, best operator, worst workstation, variance from baseline), 14-day trend chart, **Drew's 6 KPI tabs** (By Operation / By Material / By Operator / Est vs Actual Labour / Est vs Actual Material / Part History), sortable today-entries table, filters.
3. **`/shop/efficiency/new`** — operator data entry form with live efficiency % preview, AI-suggest-cause heuristic (stub — Phase 2 for real LLM), submits back to dashboard instantly.

**Commits pushed**: `7d4740f`, `98f589b`, `94726bf`, `adbddf8` on `feat/jwm-demo`.
**Deployment**: CT 120, systemd `jwm-demo` service restarted, all routes verified 200.
**Screenshots**: `jwm-demo/shell/screenshots/monday-3/*.png`.

---

## Transcript takeaways (2026-04-19 15:08 recording)

**Source**: `/Users/mattwright/pandora/Obsidian/PROJECTS/JWM/50-research/2026-04-19-voice-recorder-costs.md` (misclassified title — actual content is a JWM/ERP planning session)

### JWM personnel surfaced in conversation
- **Hannah** — Operations Manager, Processing Division (oversees Lisa, Autumn, Owen)
- **Lisa** — Customer Support Manager, Processing
- **Autumn** — Customer Support Manager, Processing
- **Owen** — Project Manager, Processing
- **John McDougall** — Company owner (insists on full company name, not abbreviations)

### Business clarifications
- **Processing division is the acute priority** — shop floor that works + earns team trust
- **Architectural division** uses ERF → engineering → **releases** (e.g., 1,000 panels → 5 releases of 200)
- **Processing workflow**: quote with full specs → dump into system → production
- **Quote/PO entry is agreed as the system trigger** (not estimating, CRM, or accounting — those come later)
- **Data quality** is the biggest current pain point
- **Spectrum is construction-oriented**, JWM has to shoehorn manufacturing into it (confirms keep-Spectrum-for-now decision; Phase 5 replacement option still valid)
- **WIP accounting nuance**: can only invoice when product leaves the facility, but construction-accounting recognizes revenue by % complete. This is a real friction for JWM.

### Explicit Monday deliverables Matt committed to
| # | Deliverable | Status |
|---|---|---|
| 1 | Working scheduler matching reference | Agent building now |
| 2 | Efficiency dashboard matching reference | Agent building now |
| 3 | Data entry form for efficiency dashboard | Agent building now |
| 4 | Review processing quotes sent via email | Matt to do |
| 5 | Grant client access to ERP system | Already live, share URL |
| 6 | Send ERP system access link to client | Matt to send |
| 7 | Meet Chris early AM before stakeholder meeting | Matt to schedule |

### External contact flagged
- **Gretchen** — neighbor, retired PepsiCo VP Supply Chain, now SAP consultant. Relevant: led SAP implementation with 2 approaches (full customization vs workflow adaptation — the adaptation side succeeded, the customization side is still struggling after 2 years). Chris to facilitate intro.

### Business-background tidbits to use in demo
- JWM fabricated every panel for the EPCOT globe at Disney
- 88 years old (est. 1938)
- "Colossal failure" was Chris's word for Epicor
- Industry shift Matt named: "buy and customize" → "build on open foundation"

---

## What Matt needs to do when back

1. **Pull up the demo on your laptop**: https://jwm-demo.beyondpandora.com → click Sign in with sovereign.ai (or use stub). Walk through: `/shop` → `/shop/scheduler` → `/shop/efficiency` → open a kiosk at `/shop/flat-laser-2` → `/erf`. If anything reads off, tell me and we iterate.
2. **Send Chris the URL** — https://jwm-demo.beyondpandora.com. Creds already in his Telegram thread (login `cball`, temp password from earlier). He can poke around before the Monday AM meeting.
5. **Add Hannah / Lisa / Autumn / Owen to Authentik** if Chris wants them to log in too — pattern is documented, same as the Chris/Mark/Asaf provisioning.
6. **Schedule the early-AM review with Chris.**
7. **Consider following up on Gretchen introduction** — her "workflow adaptation succeeded, heavy customization stuck at 2yrs" anecdote is a great sovereignty-talk anchor.

## PLAUD pipeline status

- Local whisper on PCT 146 is deprecated — kept running as backup but no longer in the n8n flow
- OpenAI Whisper via LiteLLM is primary (verified with today's stalled recording)
- Deepgram placeholder stanza exists in config — add key later to enable fallback
- Cost observed: ~$0.006/min → ~$0.25 for today's 41-min recording
- Lock-cleanup pattern: if PLAUD jams again, delete `/opt/PLAUD_NOTES/.processing.lock` on CT 107 + the file gets retried on next cron

## Known risks for Monday

- **ElevenLabs free-tier quota** — 10k chars/mo, ~33 demo responses. Swap for paid key before tomorrow if Chris is going to hammer John chat.
- **WIP accounting objection** — Chris may ask how we handle the "invoice on ship vs % complete" nuance. We haven't built this yet. Answer: Phase 3 (Sales/Customer/Quoting) will add a construction-billing mode to Sales Invoice that holds revenue in WIP and recognizes on % complete per SOV. Not in the demo.
- **Scheduler drag-to-reschedule** — may be stubbed (click-only) by the Monday-3 agent. Matt should decide if that's OK for Monday or if he wants drag live (probably fine stubbed — talk through the interaction).
- **Hannah/Lisa/Autumn/Owen as named users** — seeded in the new efficiency data but their actual login accounts don't exist. Chris might ask "can they log in too?" — answer yes, 10 min to provision each.

## Links

- [[FEATURES_WORKING]] — clickable feature inventory (pre-today; Monday-3 additions to be appended)
- [[DEMO_GUIDE]] — 12-minute narration, updated for shop-first
- [[BUSINESS_WORKFLOW]] — 15-step end-to-end flow
- [[council/SYNTHESIS_v2]] — commercial posture
- [[2026-04-19 15:08 Voice Recorder Recommendations and Subscription Costs]] — today's transcript (misclassified title)
- [[2026-04-18 17:02 Engineering Request Form Workflow System Integration]] — Chris's ERF conversation
