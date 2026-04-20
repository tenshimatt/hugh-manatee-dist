# JWM Council — Synthesis

> **Convened:** 2026-04-19 (midnight-early).
> **Question on the table:** quote full Epicor replacement for JWM, anchored on the running Phase-1 demo.
> **Trigger:** Drew Adams's Friday-noon email raising 5 concerns, Collin's reply adding more, and three operational workbooks (80 sheets, 177 max columns) landing in `/attachments`.

Four Council seats filed. Each addressed a different angle. This note is the top-of-stack summary; the four detailed deliverables are linked at the bottom.

---

## The one sentence

**$195,000 fixed over 11 months retires Epicor by 2027-03-31, eliminates JWM's hand-rolled Excel MES, delivers the 6 KPIs Drew asked for that Archer can't, and lets Chris sign Monday for just Phase 1+2 ($95K) with Phases 3+4 optioned at prior-phase acceptance.**

## The five things we now know that we didn't on Friday

1. **Drew Adams is the hidden decision-maker.** He owns Master Scheduling + Inventory Control — the two modules Archer is weakest on. Win Drew, win the room. *(Seat 1, §Participants)*
2. **The Friday silence-is-consent gate broke.** Both Collin and Drew filed written concerns inside Chris's 48-hour window. The Archer "approval" is not actually clean. *(Seat 1, §TL;DR)*
3. **JWM is running a hand-rolled MES inside Excel on top of Epicor.** 3 workbooks, 80 sheets, 177 max columns, 2.5 years of schedule data. The `Uses Workaround` flag with `Corrected PEM/OS Start` dates is literally Epicor scheduling bugs baked into Excel logic. *(Seat 2, §TL;DR)*
4. **Drew's 6 KPIs all live in the Daily Efficiency Log data already** — just not surfaced. One new DocType (Efficiency Event) + 3 charts + 1 report covers all six. Archer's D-10 explicitly punts on specific metrics. *(Seat 2, §Drew's KPI audit + Seat 1, §Wanted KPIs)*
5. **Epicor retirement is ambiguous even to the JWM team.** Drew and Collin independently asked the same question in the thread. Pre-committing to a cutover scenario (Seat 3 picks Scenario C — parallel run Phase 2–3, hard cut Phase 4) removes the biggest uncertainty in our quote. *(Seat 1, §Epicor exit)*

## The commercial frame

| | Archer (Smartsheet path) | sovereign.ai (this quote) |
|---|---|---|
| Year-1 build cost | $18K discovery + TBD Phase 1 | $95K for Phase 1+2 committed Monday, $195K full program at JWM's option |
| Go-live | Jan 2027 (per Archer's doc) | Phase 1 already live · Phase 2 July 2026 · full cutover March 2027 |
| Epicor retired? | ❌ No — Archer scope excludes Epicor integration | ✅ Yes, by end of Phase 4 |
| Year-2+ recurring | Smartsheet Biz + Control Center + Work Apps + Data Shuttle + Data Mesh licenses, indefinitely (~$200K+/yr at 100 users per Seat 4 §9) | $24K/yr maintenance + AI gateway ops |
| 2-year program total | **$430K–550K+** (Seat 4 §9) | **$230K** |
| Platform ownership | JWM pays Smartsheet forever | JWM owns ERPNext (MIT license) |
| Data export | Via Smartsheet's API (per-row throttle, Data Shuttle extract) | Standard SQL dump, no lock-in |

## The technical shape

Confirmed from spreadsheet reverse-engineering (Seat 2):
- **6 new DocTypes** needed for parity: Job Release, Production Hold, Efficiency Event, Machine Downtime, Engineering Assignment, Scheduling Override
- **~50 custom fields** across Work Order, Sales Order, Item, BOM
- **~40 Operation master records** (laser cut families, brake forms, weld types, etc.)
- **Subcontracting module** is Heavy + painful in Epicor — dedicated supplier tabs (AAA/AZZ/TGS/COLBERT/DACODA/GLC) + a "Missed Outsource Receipts" tab
- **Integration surface extends** beyond Spectrum+Paycor to EasyPost (carriers/LTL), Avalara (tax), CAD/CAM file-drop (AXYZ, laser nesting), scanning/label printing

None of this is in Archer's scope. *(Seat 3, §Module-by-module)*

## The political shape

Chris's four-stage plan (Feb 23 email) locks him to Archer politically. Our move:
- **Don't attack Archer** — offer Chris a *safer* path that preserves his narrative (Phase 1 delivers operational value on time, Phase 2+ retires Epicor).
- **Answer Drew and Collin by name** — their specific concerns are addressed in Seat 4, §10. Drew wants KPIs, we're giving him the 6 in Phase 1 at no price change. Collin wants Phase 2 timing clarity, we're removing the gap.
- **One-page engagement letter for Monday** — commits to $95K (Phases 1+2 only). Minimises political cost of signing. *(Seat 4, §13)*

## Gaps from existing memory this Council closed

- `project_jwm_demo.md` referenced Phase 1 only. **Updated** in this pass to cover the broader program.
- `feedback_authentik_app_slug.md` and `feedback_nextauth_v5_signin.md` don't intersect here — unchanged.
- `feedback_proxmox_host_load_cascades.md` — still relevant; the Epicor replacement doubles infra footprint, so host tuning is pre-requisite.

## The four deliverables

| Seat | Focus | File | Words |
|---|---|---|---|
| 1 | Email thread analysis | [[01-email-analysis]] | ~3,000 |
| 2 | Spreadsheet data model reverse-engineer | [[02-data-model-analysis]] | ~7,500 |
| 3 | Epicor → ERPNext replacement scope | [[03-epicor-scope]] | ~5,000 |
| 4 | **Commercial quote (client-ready)** | [[04-commercial-quote]] | ~3,800 |

## What happens next

1. **Matt reads 04-commercial-quote.md in full** and adjusts tone/numbers to taste before Monday
2. **Chris's meeting Monday 2026-04-20** — we lead with live demo (runbook in `DEMO_GUIDE`), close with the quote
3. If Chris signs Phase 1+2 Monday → kickoff Tuesday 2026-04-22, Phase 2 lead time starts
4. If Chris wants the full program paper first → leave him 04-commercial-quote.md as a PDF, follow up within 72 hours

## Risks that didn't make it into the headline number

- **Matt's Australia departure 26 June** — this quote assumes a named onsite Frappe dev by Phase 2 kickoff. Recruiting that role **should have started yesterday**. Flag to Matt: if dev isn't hired by Phase 1 handover, Phase 2 slips.
- **ZFS arc_prune issue on Proxmox host** (not yet capped) — if JWM loads grows under Phase 3's inventory throughput, this will bite. Address before Phase 3 cutover. *(see `feedback_proxmox_host_load_cascades.md`)*
- **Option B ($17.5K/mo SaaS)** requires us to carry infra + Anthropic API cost for 11 months before any revenue on Phase 3+. Cash-flow risk on our side; either pass it forward at 15% margin or prefer Option A.

---

Linked: [[../DEMO_GUIDE]] · [[../PRD_ADDENDUM_built_state]] · [[../JWM_Production_System_PRD_v0.2]] · [[../STACK_INVENTORY]] · [[../CHANGELOG]]
