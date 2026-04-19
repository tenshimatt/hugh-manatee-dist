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

### Still being built (agent running)
The 3 specific pieces Matt committed to Chris this evening:
1. `/shop/scheduler` — interactive grid matching 1010/1040 reference spreadsheets
2. `/shop/efficiency` — dashboard matching Daily Efficiency Log + Drew's 6 KPIs
3. `/shop/efficiency/new` — data entry form feeding the dashboard

Agent commits will land on `feat/jwm-demo` (not pushed yet — Matt reviews first).

---

## Transcript takeaways (2026-04-19 15:08 recording)

**Source**: `/Users/mattwright/pandora/Obsidian/PLAUD/PROJECTS/JWM/2026-04-19 15:08 Voice Recorder Recommendations and Subscription Costs.md` (misclassified title — actual content is a JWM/ERP planning session)

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

1. **Review `/shop/scheduler`, `/shop/efficiency`, `/shop/efficiency/new`** once the Monday-3 agent reports in. If look-and-feel matches what you told Chris, ship it.
2. **Push commits to GitHub** — I've held off on the Monday-3 ones so you can review first.
3. **Deploy the Monday-3 to CT 120** — I'll handle that once you approve, or you can run: rsync + tar + `pct push` + rebuild + restart (pattern in `jwm-demo/erpnext-theme/deploy.sh` — adapt).
4. **Send Chris the URL** — https://jwm-demo.beyondpandora.com. Creds already in his Telegram thread (login `cball`, temp password from earlier).
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
