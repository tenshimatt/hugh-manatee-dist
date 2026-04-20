# JWM Council — Synthesis v2 (post-challenge)

> **Round:** 2 — Challenge round included.
> **Seats:** 1 (Email), 2 (Data Model), 3 (Epicor Scope), 4 (Commercial v1), 5 (Dissent), 6 (Reference Architecture).
> **Supersedes:** [[SYNTHESIS]] (v1).
> **Date:** 2026-04-19.

v1 was a consolidation. v2 is a resolution — the Council actually argued.

---

## The one sentence, revised

**$165K fixed + $25K named contingency, 11 months, Epicor retired 2027-03-31, Spectrum stays with a visible Phase 5 replacement option — built by Matt @ 40% + fractional SRE + cutover contractor + Claude + Paul-as-internal-admin, on a single-suite Frappe architecture (ERPNext + Frappe CRM + Frappe Insights) with the Next.js shell we already built as the everyday UI and ERPNext Desk reserved for admins.**

---

## What v1 got wrong (and why the quote now reads differently)

### 1. The "named senior Frappe dev" line was $30–50K of unchallenged padding
- v1 (Seat 3/4): priced a senior Frappe dev 100% for Phases 2–4, at an implicit $700–900/day = ~$90K of the $195K.
- Matt's rebuttal: **Phase 1 was built by Claude agents orchestrated by Matt. No dev touched the code. The pattern scales.** What genuinely needs a human isn't Frappe code — it's domain translation, exec relationship, 2am incident response, internal admin training.
- Seat 5 resolution: replace the dev line with (a) fractional SRE 15% for on-call + backup operator, (b) ~4-week cutover contractor during Phase 3/4, (c) Matt @ 40% through the program. Net staffing is **~$75–95K of honest labour cost** instead of $153K implied. **Program drops from $195K → ~$165K** with a **$25K contingency** at $1,200/dev-day to grow back to $190K if evidence demands it. *(Seat 5 §Dissent 1.)*

### 2. Spectrum replacement was "included" when it should be "visible but optional"
- v1 (Seat 3): treated accounting replacement as potential Phase 4 work, ~$40-60K.
- Seat 5 pushback: **construction accounting (AIA G702/G703, retainage, SOV, certified payroll) is where ERPNext is genuinely weak.** Caitlin Moi's team knows Spectrum. Year-end-close audit risk during migration is real. A $60-100K Phase 5 for recurring savings of $150-300K/yr is a better future engagement than baking it into Year 1.
- Resolution: **Spectrum stays through Year 1.** Phase 5 becomes an explicit, quoted, optional add that Chris can trigger on evidence (Phase 3 success, audit comfort, team readiness). Better cash flow, lower political risk, keeps Caitlin out of the Phase 1-4 firing line. *(Seat 5 §Dissent 2.)*

### 3. Phase 2 should lead with Inventory, not Sales
- v1: Phase 2 = Sales/Customer/Quoting. Phase 3 = Supply Chain/Inventory/Subcontracting.
- Seat 5 pushback: **Drew Adams owns Master Scheduling + Inventory Control.** He's the hidden decision-maker (Seat 1). Phase 2 = Inventory + Subcontracting wins him on day one, before any Archer re-compete. Sales/Quoting is less political — Paul and the estimators are already aligned.
- Resolution: **swap Phase 2 ↔ Phase 3**. Phase 2 = Inventory, subcontracting, purchasing, perpetual stock. Phase 3 = Sales, customer master, quoting, estimating. Explicitly ask Chris Monday whether he agrees with this sequencing — don't pre-commit unilaterally. *(Seat 5 §Dissent 3.)*

## What v1 got right (survives challenge)

- **Drew as hidden decision-maker.** *(Seat 1.)* Unchallenged.
- **6 KPIs Drew wants are in the Efficiency Log data already.** *(Seat 2.)* One new DocType + 3 charts + 1 report covers all six. Unchallenged.
- **Subcontracting is operationally painful in Epicor.** *(Seat 3.)* Supplier tabs + "Missed Outsource Receipts" as proof. Unchallenged.
- **13 concrete things Smartsheet cannot do.** *(Seat 3.)* Unchallenged — this is the competitive kill shot.
- **Single-suite Frappe is the right architecture.** *(Seat 6.)* ERPNext backbone + Frappe CRM + Frappe Insights + Next.js custom shell. Unchallenged.
- **Preserve the Next.js shell as the everyday UI.** *(Seat 6 §4.)* Non-negotiable client requirement; architecturally sound because Desk stays available for admin work.
- **Archer 2yr TCO headline $430-550K was speculative** but directionally right — Smartsheet's license stack + re-engagement fees at each gate vs our $230K fixed-known number is still materially cheaper. Soften the number to "$250-450K depending on Archer's undisclosed discount" in the client-facing doc.

## The new architecture, in one diagram (see Seat 6 for full)

```
        ┌──────────────────── users ────────────────────┐
        │ Chris · George · Paul · Drew · Josh · Operators │
        └────────────────────────┬───────────────────────┘
                                 │
              ┌──────────────────▼──────────────────┐
              │     Next.js SHELL (jwm-demo)        │  ← everyday UI
              │  • Executive Dashboard              │
              │  • Estimator / Planner / Shop Floor │
              │  • QC / John (AI Chat + Voice)      │
              └──┬────────────────────────────────┬──┘
                 │ REST + token                   │ SSE
       ┌─────────▼────────────┐         ┌─────────▼────────┐
       │  ERPNext + jwm_mfg   │         │   LiteLLM        │
       │  (backbone)          │         │   (AI gateway)   │
       │  • Manufacturing     │         │   → Claude       │
       │  • Inventory         │         │   → Ollama local │
       │  • Sales / Purchase  │         └──────────────────┘
       │  • Projects + HR-basic│
       │  + Frappe CRM         │ ← Phase 3
       │  + Frappe Insights    │ ← Phase 3 (for Chris's KPIs)
       │  + Frappe Helpdesk    │ ← Phase 4 (internal IT tickets)
       └──┬────────────────┬───┘
          │                │
          ▼                ▼
  ┌───────────────┐  ┌───────────────┐
  │    n8n        │  │  Paperless-ngx│ ← kept (OCR inbound)
  │ (workflows)   │  │               │
  └───┬───────────┘  └───────────────┘
      │
      ▼ SFTP / file-drop / API
 ┌────────────────────────────────────────────┐
 │ External SaaS:                             │
 │ • Spectrum (kept; Phase 5 option to move)  │
 │ • Paycor (kept; PR flag)                   │
 │ • Avalara (new; Phase 3 — tax)             │
 │ • EasyPost (new; Phase 3 — carriers/LTL)   │
 │ • Epicor (parallel run Phases 2-3, off P4) │
 └────────────────────────────────────────────┘

 Identity: Authentik OIDC everywhere.  Hosting: cloud → on-prem at P3.
```

## The 4-phase program, v2

| Phase | Scope | Dollars | Duration | Go-live target |
|---|---|---|---|---|
| **1 — Production Layer (LIVE)** | What's running now: shell + ERPNext site + 4 AI flows + voice + custom DocTypes + seed + brand. Plus **6 additional DocTypes** (Efficiency Event + Job Release + Production Hold + Machine Downtime + Engineering Assignment + Scheduling Override) and **Drew's 6 KPIs** bundled in at no price change. | **$55K** committed | 6-10 weeks | Late July 2026 |
| **2 — Inventory + Subcontracting + Purchasing** (swapped up) | Perpetual inventory, subcontracting module, supplier portal, receiving, stock movements, Stock Ledger. **This is where Archer dead-ends.** On-prem migration begins end of Phase 2. | **$55K** | 10-12 weeks | Sept 2026 |
| **3 — Sales + Customer + Quoting + AI Insights** | Full Sales Order cycle, Customer master consolidated, Quotation flow, Frappe CRM deployed, Frappe Insights configured for exec dashboards, Avalara + EasyPost integrations live. | **$40K** | 8-10 weeks | Dec 2026 |
| **4 — Hardening + Epicor decommission** | Full parallel-run validation complete, Epicor read-only archive, Frappe Helpdesk for internal tickets, runbooks delivered, Paul certified as internal admin, named cutover contractor completes and departs. | **$15K** | 6-8 weeks | Mar 2027 |
| **TOTAL Year 1** | | **$165K fixed** + **$25K contingency** | 11 months | |

**Phase 5 (optional, visible):** ERPNext Accounting replaces Spectrum. +$60-100K fixed. Recurring savings $150-300K/yr after cutover. Chris decides at Phase 4 close based on Caitlin's comfort + Phase 3 success.

## Team shape, v2 (the controversial one)

Matt's pushback accepted. Revised team:

| Role | FTE equivalent | Cost share | Source |
|---|---|---|---|
| **Matt Wright** — embedded PM, domain translator, exec relationship, on-site for phase boundaries | 40% over 11 months | ~$55K | sovereign.ai |
| **Claude** — build capacity, orchestrated by Matt via the pattern proven in Phase 1 | n/a (no labour cost) | $0 | Anthropic API metered through LiteLLM — budgeted at $300/mo × 12 = **$3.6K** |
| **Fractional SRE / backup human operator** — on-call for incidents, can run Claude's commands during Matt's off-hours, covers Matt's Australia period 26 June onward | 15% | ~$18K | Named from Asaf / Mark / hire |
| **Cutover contractor** — senior Frappe/ERPNext specialist engaged for 4 weeks during Phase 3 cutover + 2 weeks Phase 4 decommission | short burst | ~$22K | Frappe Partner network |
| **Paul Roberts (JWM internal)** | 20% through Year 1 | JWM-absorbed | Trained by sovereign.ai |
| **Drew Adams (JWM internal)** | 10% during Phase 2 | JWM-absorbed | Key Phase 2 collaborator |
| **Caitlin Moi (JWM internal)** | 5% cross-phase | JWM-absorbed | Only loaded in if Phase 5 triggers |

Total sovereign.ai-borne labour: **~$95K**. Plus platform + AI + hosting + tooling fees: **~$30K**. Plus margin/risk: ~$40K. **Program: $165K + $25K contingency.**

## Three commercial options (v2)

**Option A — Stage-gated (Chris's safest path).** $55K now (Phase 1 retained) + Phase 2 $55K on Phase 1 acceptance + Phase 3 $40K on Phase 2 acceptance + Phase 4 $15K on Phase 3 acceptance. Total $165K + contingency. Chris can walk at any gate. **Recommended to Chris Monday.**

**Option B — Full program, 9% committed discount.** $150K fixed for all 4 phases, signed Monday. Lets us remove re-compete risk at each gate; JWM gets the lower anchor. Best if Chris is ready to commit.

**Option C — Monthly SaaS with hosting.** $15K/mo × 12 = $180K Year 1. Covers hosting, maintenance, AI budget, program delivery. Single invoice. 12-month commitment, month-to-month after. Appeals if JWM wants OpEx-only.

My lean: **Option A** — matches Seat 5's stage-gate recommendation, explicitly honours the "silence-is-consent gate broke" narrative (Chris doesn't have to undo Archer commitment in one move), matches PRD v0.2 Option 1 which Chris has already mentally priced.

## Where this Council materially helps Matt on Monday

- **He walks in with $165K not $195K.** That's a ~15% lower anchor than the v1 quote. Easier to say yes to.
- **He walks in with Spectrum intact.** No argument with Caitlin, no accounting migration to explain.
- **He walks in with Drew already served** — Phase 2 = Inventory + Subcontracting + the 6 KPIs. Drew stops being a blocker.
- **He walks in with radical honesty about team shape.** "Me + Claude + named backup ops + cutover specialist" is more credible than "team of engineers" — especially after Chris sees the 48-hour demo that was built this way.
- **He walks in with the full Epicor-gone promise.** Archer's proposal never retires Epicor. Ours does.

## Where this Council raises real risks

- **Matt as single-point-of-failure is still real.** The fractional SRE line addresses ops-continuity but not domain-translator continuity. If Matt is incapacitated for weeks, scope definition stalls. Mitigation: PLAUD-captured conversations in memory. Incomplete mitigation but directionally right.
- **PLAUD pipeline fragility.** Per memory, race conditions hit as recently as 2026-04-13. Needs hardening before we stake a client engagement on it. *(Seat 5 Challenge 9.)*
- **On-prem migration at Phase 3 is aggressive.** Hardware procurement + IT handoff + data migration during a live cutover compounds risk. *(Seat 6 §8.)* Recommendation: stagger by 2 weeks — no cost change, just sequencing.
- **ZFS arc_prune storm on Proxmox host (per Matt's separate analysis, 2026-04-18) not yet resolved.** The fix is known (cap `zfs_arc_max`) but not applied. If JWM scales infra use through Phase 2, this bites. *(Memory: `feedback_proxmox_host_load_cascades.md`.)*
- **Option B's 9% discount is only worth it if Chris actually commits Monday.** If he takes A, we lose nothing. Worth naming the price for B so Chris has both numbers in the room.

## Open questions that require Chris's input Monday, not Claude speculation

*(Per Seat 5 §Open questions, lightly edited:)*

1. Is January 2027 from Archer's proposal a real business trigger or Archer's pace? If it's Archer's pace, our March 2027 is fine.
2. Who does JWM name as dedicated ERP admin? Paul @ 20%? A hire? A reassignment from elsewhere?
3. Phase 2 = Inventory first (Drew wins) or Sales first (Estimators + Paul win)?
4. How attached is Caitlin to Spectrum — Phase 5 real option or political non-starter?
5. Epicor contract: annual license renewal date? Data extraction permitted? Co-operation expected from Epicor during parallel run?
6. What's JWM's capex envelope for on-prem hardware (~$18-25K one-time per Seat 3)?
7. What's Archer's actual Phase 1 build quote number (not the $18K discovery)?
8. Does JWM need a named onsite dev for AP/IT comfort, or is the sovereign.ai model acceptable?
9. Matt's Australia date range: fixed 26 June, or flexible ±2 weeks? Affects Phase 2 cutover calendar.

## Council outputs

| Seat | File | Status |
|---|---|---|
| 1 | [[01-email-analysis]] | Round 1 — unchanged |
| 2 | [[02-data-model-analysis]] | Round 1 — 6 DocTypes survive challenge |
| 3 | [[03-epicor-scope]] | Round 1 — numbers revised in v2 |
| 4 | [[04-commercial-quote]] (v1) | Round 1 — **superseded by v2 in this synthesis** |
| 5 | [[05-dissent]] | **Challenge round — drove most of v2's changes** |
| 6 | [[06-reference-architecture]] | **Architecture round — locked in suite + shell + phase boundaries** |

## What gets produced next (pending Matt's call)

- `04-commercial-quote-v2.md` — client-ready quote at **$165K + $25K contingency**, Phase 2 = Inventory, Spectrum stays, Phase 5 optional. Option A as lead.
- Update `project_jwm_demo.md` memory with revised numbers + team shape.
- Update `CHANGELOG.md` with Synthesis v2 entry.
- Commit + push.

Matt — say "go" if you want me to spin up the v2 quote now. Or flag what to adjust first.

---

Linked: [[../DEMO_GUIDE]] · [[../JWM_Production_System_PRD_v0.2]] · [[../PRD_ADDENDUM_built_state]] · [[../STACK_INVENTORY]] · [[../CHANGELOG]] · [[SYNTHESIS]] (v1 — superseded)
