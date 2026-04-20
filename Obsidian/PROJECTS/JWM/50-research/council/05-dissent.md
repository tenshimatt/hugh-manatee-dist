# Council Seat 5 — Dissent

**Author:** Seat 5 (the Dissenter)
**Date:** 2026-04-19
**Purpose:** Stress-test the prior Council's consensus before Monday's meeting. The four-seat synthesis produced a coherent $195K / 11-month program. Nobody in the room argued against it. That's a problem. This document fixes it.

**Posture:** Where Seats 1–4 are right, I'll say so. Where they glossed, I'll cut. Where Matt has a live pushback, I'll argue both sides and then pick. Where I'm guessing vs deducing, I flag it inline.

---

## TL;DR — the three things the prior Council got wrong

1. **The "named senior Frappe dev 100% for 11 months" line is the single most fragile assumption in the quote — and it's also probably wrong.** Seat 3 inserted it as a default-of-the-industry ("that's how consulting works"), Seat 4 priced it in, and nobody tested whether a Claude-plus-Matt delivery model (which is what built Phase 1 in 48 hours) continues to scale. If it does, the program is $140–160K, not $195K. If it doesn't, we should have said so explicitly instead of hiding the risk in a staffing line item. Either way the current quote is dishonest by omission.
2. **The Spectrum-stays decision was never actually made — it was inherited from the PRD and never re-tested.** Seat 3 built around it. Seat 4 priced around it. But ERPNext Accounting is a full GL/AP/AR suite with construction extensions available, and if we're asking Chris to swallow full Epicor retirement, the logical question is "why not Spectrum too?" Answer may still be "keep Spectrum" — but not interrogating it is Council malpractice. I'll argue both sides and pick.
3. **The $195K anchor is a plausible mid-point, not a derived number.** Seat 4 multiplied dev-days by a day-rate ($700–900/day) that Seat 3 invented without external benchmarking. The price could defensibly be $120K (Claude-led, no named dev, Matt + contractors) or $260K (properly loaded with real-market senior Frappe rates). "$195K fixed" sounds like diligence; it's actually splitting-the-middle under uncertainty.

---

## Dissent 1 — the named Frappe dev

### The case for Matt's model (Claude + Matt + PM, no named full-time dev)

**Evidence floor:** Phase 1 was built in roughly 48 hours by Matt + Claude agents. 6 custom DocTypes, ~50 custom fields, voice NCR via LiteLLM, dashboards, Spectrum outbound skeleton, Paycor inbound skeleton, Authentik SSO, Traefik routing, live on `jwm-erp.beyondpandora.com`. The velocity curve is already demonstrated — this isn't hypothetical.

**The delivery physics have changed.** What used to require a senior Frappe developer for code generation (DocType schemas, hooks, server scripts, custom reports, Frappe controller classes, migration scripts) is now Claude's sweet spot. The repetitive "map spreadsheet column → custom field → permission → report filter" work that consumes 60–70% of a traditional Frappe engagement is precisely what agentic coding compresses to near-zero. Seat 3's 200–260 dev-day estimate is implicitly priced against 2024-era productivity. In a 2026 Claude-4.7-with-1M-context world, that number is overstated by a factor that Seat 3 did not model.

**Matt's domain advantage is the actual bottleneck.** The scarce resource in this program is not "someone who can write Frappe code" — it's "someone who can sit with Chris, Drew, Paul, Collin, and Caitlin and understand JWM's actual operational pathology." That's Matt. Matt already holds a US visa, can fly on short notice, and has specifically committed to using the PLAUD pipeline to capture those conversations into durable project memory. Every hour spent pair-programming with a named Frappe dev is an hour Matt is NOT extracting requirements from the shop floor. The dev slot is actually **competing** with the thing that most differentiates us from Archer.

**Sovereignty pitch demands radical honesty.** We're selling JWM "own your own stack, own your own data, own your own vendor relationship." The natural extension is "you won't be locked into a specific consulting firm either — the tooling is sufficiently modern that one internal admin (Paul) plus a part-time Matt plus Claude keeps the lights on." If we quietly pad the quote with a $30–50K named-dev line, we're undermining our own thesis. The sovereign.ai narrative only coheres if the delivery model itself is post-traditional.

**Financial impact of dropping the dev line.** Rough math: a named senior Frappe dev 100% allocated across Phase 2–4 at $900/day × ~170 dev-days = **$153K** of the $195K program is implicitly dev labor. Replace with Matt @ 40% × 32 weeks × $1,200/day (architect rate) + Claude/tooling costs + 4 weeks of onsite contractor for cutover = roughly **$75–95K**. Net program floor: **$135–160K**.

### The case against (what named-dev actually buys us)

**Production incident response at 2am.** When JWM inventory posts fail during a month-end close at 11pm Nashville time and Matt is asleep in Brisbane, Claude cannot triage a stuck background worker, read `bench logs`, correlate with a Postgres lock contention, hot-fix a hook, and restart workers — not reliably, not without a human pilot. A named dev with on-call rotation is a real operational primitive, not pad.

**Frappe migration edge cases during version bumps.** ERPNext v15 → v16 will land mid-program. Migration scripts for custom DocTypes with heavy ORM dependencies sometimes break in ways that require reading Frappe core source, understanding deprecation warnings, and writing patches. Claude can do this with close supervision. "Close supervision" means Matt, who is on a plane or in a timezone offset.

**Matt is a single point of failure.** If Matt gets sick, hit by a bus, or decides to extend his Australia trip, the entire JWM program halts. A named dev is not primarily about code velocity — it's about **bus-factor ≥ 2**. Chris is signing a program that spans 11 months. "The architect gets sick" is a real and uninsured risk without a second engineer.

**Client perception of AI-built ERP.** This cuts both ways. The sovereign.ai brand sells AI-assisted delivery as a feature. But Chris signing $195K — a non-trivial capex decision he has to defend to Wylie McDougall and George Holland — needs cover. "We hired sovereign.ai, they have a named onsite engineer working out of Nashville for cutover weeks" is easier to defend to a board than "we hired an AI-forward architect who flies in from Australia and the rest is Claude." The optics tax is real even if the engineering substance is fine.

**Cutover weekends specifically need human hands.** Phase 3's 3-day shop shutdown (physical inventory count + Epicor freeze + ERPNext go-live) is genuinely a 4-person job: one on database, one on shop floor with scanners, one in warehouse coordinating counts, one on escalation. Claude cannot walk the floor. This is non-negotiable human labor for ~2 weeks of the program.

### Verdict

**Restructure, don't keep-as-is and don't drop entirely.**

Replace "named senior Frappe dev 100% allocation for 11 months" with three separate, smaller, more-honest line items:

1. **On-call Frappe SRE (contract, fractional)** — 10 hrs/week average across Phase 2–4, spike coverage for cutover weeks. ~$18–25K total. Purpose: bus-factor ≥ 2, production incident response, version-bump migration safety. This is the insurance policy, not the delivery spine.
2. **Cutover contractor (onsite Nashville)** — 4 weeks total across Phase 3 cutover + Phase 4 close. $20–28K. Purpose: physical hands, shop-floor partnership during inventory count, finance handoff pair with Caitlin.
3. **Matt @ 40–50% architect rate** — up from the original 30%. $40–55K. Purpose: requirements extraction via PLAUD pipeline, pair-with-Claude on non-trivial DocType and integration work, client trust surface.

**Program floor becomes ~$155K** (vs $195K) with honest staffing and preserved insurance. **Or**, keep the $195K headline and increase scope to include things we punted (Phase 5 customer portal? EDI spike? Real Epicor-to-ERPNext historical migration depth?). My recommendation: **drop the price to $165K and win on trust.** A smaller-and-more-honest quote reads better to Chris than a bigger-and-padded one.

**Caveat worth saying out loud:** if Matt's Australia departure moves from "visiting on demand" to "multi-month immersion" the math flips and the named dev returns. The fractional-SRE model only works if Matt is genuinely reachable within ~6 hours for escalation. Confirm that before quoting.

---

## Dissent 2 — Spectrum stays or goes

### The case for replacing Spectrum with ERPNext Accounting

**Single system of record is the sovereignty endgame.** We're telling Chris "retire Epicor, own your data, one source of truth." The logical conclusion is one ERP suite end-to-end, not manufacturing-ERPNext-plus-accounting-Spectrum-plus-payroll-Paycor-plus-CRM-somewhere-else. Every additional system is an integration surface, a license line, a training burden, a reconciliation risk. If sovereignty is the thesis, ERPNext Accounting is the endgame.

**ERPNext Accounting is genuinely capable.** GL, AP, AR, bank reconciliation, multi-currency, tax, fixed assets, budget, cost center — all native. It's not a toy module; it's used by thousands of mid-market manufacturers in production. Construction-specific needs (AIA G702/G703 progress billing, retainage, schedule of values) are the genuine gaps — but the ERPNext community has extensions for these, and building them from scratch is ~20–25 dev-days (Seat 5 estimate, speculative — validate by querying `frappe/erpnext` GitHub issues and the `erpnext_construction` community apps).

**Recurring license savings.** Spectrum is Viewpoint's construction accounting SaaS. Public pricing is opaque but the mid-market segment runs $1,500–3,000/user/month loaded with modules (AIA, job cost, service). At even 8 users that's $150–300K/year recurring. Replacing Spectrum with ERPNext Accounting on JWM-owned infra takes recurring accounting license cost to **zero**. Payback on a $50–80K Phase 4.5 extension is 4–8 months.

**Stronger sovereignty pitch narrative for Chris's board.** "We replaced three systems with one" is a cleaner story than "we replaced Epicor with ERPNext and kept Spectrum and kept Paycor." Wylie and George see a simpler org chart of systems and a simpler vendor relationship.

**Audit trail cohesion.** When a job cost posting to Spectrum's GL diverges from the underlying ERPNext work order actuals, reconciliation is a nightmare and it happens quarterly. Unified ledger eliminates this class of problem entirely.

### The case for keeping Spectrum

**JWM's customer base is general contractors on construction jobs.** The three workbooks analyzed (Seat 2) show customers like Titans Stadium, Gass State Lab, Disney, Vanderbilt, LSU. These are GC-managed construction projects. The accounting workflows that matter — AIA G702/G703 pay apps, retainage withholding, schedule-of-values billing, lien waivers, prevailing wage compliance, certified payroll — are deeply specific and Spectrum has been doing them for 30 years. ERPNext's construction extensions are not at feature parity and the gap is larger than "20–25 dev-days" would suggest once edge cases appear. My 20–25 day estimate is speculative; actual floor is probably 40–60 days plus a real audit-prep sprint before the first year-end close on the new system.

**Caitlin Moi's team is trained on Spectrum.** Manufacturing operators get retrained; finance teams change accounting systems roughly once a career. There's a significant human cost and material risk to forcing a finance migration concurrent with a manufacturing migration. The probability of a botched Q4 2027 close if Spectrum goes away in 2027 is materially non-zero.

**Migration risk is asymmetric.** If we botch Epicor → ERPNext on the manufacturing side, the failure mode is "Drew can't see his efficiency numbers for a week" — painful, recoverable. If we botch Spectrum → ERPNext on the finance side, the failure modes are "missed pay app to GC, missed tax filing, mis-stated revenue in audit, misapplied retention release" — those failures end relationships with customers and create SEC-adjacent liability in audited financials. The two migrations are not equivalent risks.

**Year-end close and audit during migration window is a nightmare.** JWM's fiscal year likely ends Dec 31. A Spectrum replacement going live in 2027 would cross JWM's first post-migration year-end and auditors will want to trace every balance back through both systems. This is 3–6 months of accounting team overtime. It is not free.

**Why gamble?** Spectrum works. Nobody at JWM is complaining about it in the email thread. Caitlin hasn't been Cc'd on a complaint. The pain we're replacing is Epicor's, not Spectrum's. Solving a non-problem during a real-problem migration is classic scope creep.

### Verdict

**Keep Spectrum in Phase 1–4. Surface "ERPNext Accounting replacement" as an explicitly-priced Phase 5 option in the quote, but do not lead with it and do not discount for it.**

Specifically, add a single paragraph to Section 8 ("What's excluded or priced separately") of the current quote reading roughly:

> **Spectrum replacement (Phase 5, optional, not quoted):** ERPNext has a full accounting suite (GL, AP, AR, bank rec, fixed assets, multi-currency). Replacing Spectrum would consolidate JWM onto a single ERP and eliminate recurring Spectrum license cost. This is credible scope but it carries first-year-end-close risk on the accounting side and requires AIA G702/G703 / retainage / SOV extensions that Spectrum does natively. sovereign.ai recommends evaluating this as a standalone engagement after 12 months of stable ERPNext operation, not during the Epicor retirement window. Indicative effort: 60–100 dev-days, $60–100K. Recurring savings: $150–300K/year of Spectrum license, payback 4–8 months.

**Why keep it optional-and-visible rather than silent:** (a) it shows Chris we've thought about it, (b) it seeds a future engagement worth more than the Phase 4 program in total, (c) it lets him defer without feeling railroaded. Not quoting it at all is a lost seed; quoting it into the main program is a scope-creep risk we shouldn't accept.

**Quote impact:** zero change to $195K (or revised $165K). Adds an optional Phase 5 at $60–100K visible but not committed.

---

## Ten smaller challenges

### 1. The $195K total program price

**Assumed:** $195K is the right anchor for full Epicor retirement.

**What's wrong:** It's a mid-point, not a derived number. Floor and ceiling weren't stress-tested. Floor (Claude-led, fractional staffing, honest estimate of 2026 agentic-coding productivity): **~$135–160K**. Ceiling (properly loaded with real-market senior Frappe rates at $180/hr, full-time named dev, contingency for item master migration blowing out, auditor-demanded extra month of Spectrum-side reconciliation work): **~$260–300K**. "$195K fixed" implies diligence we didn't do.

**Revised position:** lead with **$165K fixed** built on the restructured staffing model (Dissent 1). Include a named contingency line ("if item master migration exceeds 25 dev-days the change-order rate applies") so we can grow into $195–220K on evidence, not on spec-padding. This reads more honest, is more competitive, and preserves upside.

### 2. The $700–900/day labour anchor

**Assumed:** sovereign.ai's blended fixed-price delivery rate is $700–900/day.

**What's wrong:** Seat 3 invented this number without benchmarking. US senior Frappe specialist market rate is genuinely $150–180/hr loaded = $1,200–1,440/day. Offshore (India/Ukraine) Frappe talent is $40–80/hr = $320–640/day. "$700–900" doesn't map to either pool cleanly — it reads like "slightly below US, slightly above offshore, split the difference." In a sovereign.ai-Claude-delivered model the right benchmark isn't a per-head daily rate at all — it's **output per Matt-architect-day times Claude-token-cost**, which is closer to $2,000–3,000/effective-output-day but at 3–5× the traditional output rate.

**Revised position:** stop publishing a day rate in the quote. Publish only fixed-phase prices and an explicit change-order rate of **$1,200/dev-day** (top of real market, reflects Matt's architect time and acknowledges contractor rates). The blended-$800/day number was never defensible; don't put it in writing.

### 3. "11 months to full cutover"

**Assumed:** Phase 1 live now → Phase 2 Oct 2026 → Phase 3 Jan 2027 → Phase 4 cutover March 2027 is achievable.

**What's wrong:** Matt leaves for Australia 26 June 2026. Phase 2 kickoff is August per the quote — Matt is in Australia. Phase 2 scope includes Customer Master migration (500–2,000 records from Epicor with likely dedup pain), Quotation DocType with AI-BOM-extract wired to real estimate PDFs, Project rollup, Avalara integration, ECO workflow. That's not 10 weeks of relaxed delivery when the architect is in a +14 time zone and the conversational-discovery surface (Paul, Drew, Collin, Caitlin) is all in Nashville. Phase 3's item master migration alone is 15–25 days and is the classic ERP cutover hazard — it has a fat right tail of cost and calendar.

**Revised position:** internally plan for **14 months** (end of Q2 2027), publicly commit to the 11-month schedule but explicitly name the 3-month buffer in the quote as "mutual-agreement extension to 2027-06-30 available at no additional fixed fee." Seat 4 already includes this line — **keep it and make it the default narrative, not the exception.** "Target 11 months, committed 14 months" is a more honest story to Chris than "11 months or bust."

### 4. "6 new DocTypes required"

**Assumed:** Job Release, Production Hold, Efficiency Event, Machine Downtime, Engineering Assignment, Scheduling Override — all need to be new DocTypes.

**What's wrong:** Two of the six are almost certainly over-modeled.

- **Efficiency Event** — probably correct. The cardinality (~125K rows/yr), the distinct field set (PPH est/act, men est/act, material variance), and the row-level KPI rollup requirements genuinely don't fit Job Card Time Log. Keep.
- **Production Hold** — a Work Order workflow state with a child "Hold History" table would do this. Making it a standalone DocType is over-engineering. Reduce to custom fields + child table on Work Order.
- **Machine Downtime** — correct. Separate entity, separate reporting, separate owners. Keep.
- **Job Release** — correct. The 1010 architectural release pattern (Titans 24051 → FS200, FS201, FS205…) is genuinely a different grain than Work Order. Keep.
- **Engineering Assignment** — should be a child table on Job Release, not a standalone DocType. Reduce.
- **Scheduling Override** — should be a child table on Work Order Operation, not a standalone DocType. Reduce.

**Revised position:** **3 new DocTypes + 3 child tables**, not 6 DocTypes. Saves ~5–8 dev-days and reduces long-term schema surface area by ~40%. Shouldn't affect the quote price but should be in the architectural appendix so we don't quietly over-build in Phase 1.

### 5. Subcontracting is "Heavy" risk

**Assumed:** Subcontracting is painful custom work, a major Phase 3 lift at 10–14 dev-days.

**What's wrong:** ERPNext 14+ has a first-class Subcontracting module — Subcontracting Order, Subcontracting Receipt, Subcontracting BOM, Supplied Items tracking. The 1040 workbook pattern (7 vendor tabs, OS_Lookup cross-reference, Missed Outsource Receipts tab) maps to the native module with surprisingly little friction. The real custom work is (a) the "Missed Outsource Receipts" exception report (1 day), (b) supplier tagging and the `jwm_at_os` checkbox (1 day), (c) tying outsourced Work Order operations to Subcontracting Orders (3–5 days), (d) historical open-subcontract cutover handling (2–3 days). That's 7–10 days, not 10–14.

**Revised position:** downgrade Subcontracting risk rating from **Heavy** to **Medium**. Doesn't move the quote but removes an unearned scary-line that could attract Chris's "but what if this is harder than you think" pushback. Less drama, more accuracy.

### 6. Phase ordering (Production → Sales → Inventory → Decommission)

**Assumed:** Phase 2 is Sales/Customer, Phase 3 is Inventory/Supply Chain.

**What's wrong:** Drew Adams is the hidden decision-maker (Seat 1's own finding). Drew owns inventory. Drew's #1 written concern is "what happens to inventory during Phase 1." By putting inventory in Phase 3 we are explicitly telling Drew "wait 9 months for what you care about." That's politically inverted. Phase 2 should be Inventory to win Drew immediately and anchor the program politically. Sales can be Phase 3 — the estimator team and sales can wait; the shop floor and master scheduler cannot.

**Revised position:** **strongly consider swapping Phase 2 and Phase 3.** Phase 2 = Inventory + Subcontracting (Drew's home). Phase 3 = Sales + Customer + Quoting (office/estimator home). Two objections to this swap:
- **Sales→Inventory data flow:** Sales Order drives demand signal for inventory. Doing inventory first means temporary manual demand signal. Acceptable — it's what they do today.
- **Caitlin Moi's Spectrum outbound depends on Sales Order hardening:** true, but the Spectrum invoice feed is also already a skeleton. Delay by 3 months is cost Caitlin can absorb.

Benefit of the swap: Drew votes yes on the program itself, not on a promise-to-be-delivered-later. That's worth more than any technical considerations. **Recommendation: ask Chris Monday whether he'd rather lead with Drew's priorities or his estimators'.** Don't pick for him; give him the frame.

### 7. Archer 2yr TCO $430–550K

**Assumed:** Archer's 2-year TCO is $430–550K based on Smartsheet list prices + typical Archer consulting rates.

**What's wrong:** Seat 4's math relies on Smartsheet Business list ($29/user/mo) and unverified adder costs for Control Center, Work Apps, Data Shuttle, Data Mesh. In practice:
- Smartsheet typically discounts 20–40% on 100+ seat enterprise deals.
- Archer has probably already negotiated a bundle.
- Data Shuttle and Data Mesh pricing is usage-based, not per-user, and the envelope is often less than $5K/yr at this scale.
- Archer's Phase 1 build cost of "$120–180K" was extrapolated from "typical Archer rates" — we don't actually know. It could be $80K if Archer is heavily undercutting to win the logo.

**Realistic Archer 2yr TCO floor:** $220–280K. Realistic ceiling: $450K. Our $195K is **$25–200K cheaper** depending on negotiation, not $200–320K cheaper as Seat 4 claims. Plus Epicor continues at a real but unknown cost — $60–120K/2yr is speculative on Seat 4's part, actual is more like $30–80K if JWM is on a legacy on-prem Epicor license vs hosted Kinetic.

**Revised position:** reframe the TCO comparison as **"$195K certain retirement of Epicor vs $250–400K with Epicor still running."** The delta is narrower than Seat 4 claims but the Epicor-retirement argument is still the structural win, not the dollar delta. Lead on that, not on the possibly-overstated savings number.

### 8. "One-page engagement letter for Phase 1+2 ($95K)"

**Assumed:** Signing $95K (Phases 1+2) with Phases 3+4 optioned is the lowest-risk posture for Chris.

**What's wrong:** It's also the highest re-compete risk for us. Each phase gate is an opportunity for Archer to re-enter ("you know, we've been watching sovereign.ai's Phase 1 — we'd like to quote Phase 3 for $60K"). And it's a cash-flow drag for sovereign.ai — we carry Phase 1 value creation for 4+ months before Phase 2 invoices. From JWM's side, a phased commit is comfortable; from ours, a fully-committed $195K contract with milestone payments is materially better.

**Revised position:** **offer three signing options, not one**, in clear language:
- **Option A (conservative):** Phase 1+2 only, $95K. Phases 3+4 optioned at prior-phase acceptance. Best for risk-averse Chris.
- **Option B (committed, 8% discount):** All four phases signed today, $180K fixed (vs $195K). Phases 3+4 kicked off at Phase 2 acceptance, no re-quote. Best for Chris if he wants price certainty and wants to avoid re-compete drama.
- **Option C (staged SaaS):** as already in Seat 4's quote.

My recommendation: push Option B explicitly as the preferred path and structure the discount meaningfully (not just 8%). A 12% discount ($171K) is worth it to lock the full program and eliminate re-compete risk. Don't let the one-page engagement be the default — it's the safety-net, not the target.

### 9. PLAUD pipeline dependency

**Assumed:** Matt's requirements-extraction model relies on PLAUD for conversation capture, flowing into `allmemory.md` and Obsidian notes, making him durable across his Australia relocation.

**What's wrong:** The PLAUD pipeline had a dual-pipeline race condition on 2026-04-13 (per your own MEMORY.md). WF-1a/WF-1b/WF-2/WF-3/WF-4/WF-5 are a multi-workflow chain in n8n CT107 with known fragility — sqlite locks, deduplication edge cases, Execute Workflow vs Webhook node behavior differences. And the cron on PCT 146 had to be disabled because of the race. This is not infrastructure to bet an 11-month client engagement on.

**Revised position:** PLAUD is a **productivity multiplier**, not a **delivery dependency.** Pitch the engagement as resilient to PLAUD failing — Matt carries a phone, takes notes, writes into Obsidian directly. If the pipeline is up, it accelerates. If it's down, we continue. **Before Monday's meeting:** do a 30-minute stress-test of the pipeline with a representative 20-minute voice note. If it fails, don't mention PLAUD in the quote at all. Never sell a client engagement whose delivery model depends on home-lab infra that failed 4 days ago.

### 10. "Paul as internal admin"

**Assumed:** Paul Roberts acts as internal ERP admin. PRD §3/§4.10 names him. Seat 4's training plan assumes Paul trains operators.

**What's wrong:** Paul is **Engineering & Quality Executive**. He already has two full roles: Engineering (which includes LO, sketch, prog oversight across two shops) and Quality (NCR/CAR/SNCR ownership, incoming quality manager search per Archer). Adding "ERP admin" is asking him to carry three executive-level responsibilities. Paul's email traffic in Seat 1 shows him as a *meeting scheduler* — i.e. he's already bandwidth-bound on coordination. This is not realistic.

**Revised position:** in the Monday meeting, specifically ask Chris: **"Who is JWM's dedicated ERP admin? Paul is the right champion, but he cannot be the person doing day-to-day admin at 25% time while running Engineering and Quality. Do we need to identify a dedicated part-time admin within JWM, or should sovereign.ai include an embedded admin for Year 1 at $40K?"** Frame it as Chris's staffing decision, not our scope addition. If JWM can't or won't name someone, the Year-1 managed-admin option becomes a legitimate $40K add-on that protects the go-live.

---

## Revised commercial anchor (given all dissents sustained)

### Recommended new anchor: **$165K fixed, 11-month target / 14-month committed, all four phases**

### Phase breakdown (revised)

| Phase | Revised price | Reasoning for change |
|---|---|---|
| Phase 1 — Production Layer (already live) | **$55K** | Unchanged. Committed, demonstrated, accepted. |
| Phase 2 — **Inventory + Subcontracting (swapped from Sales)** | **$55K** | Higher than original Phase 2 ($40K) because Phase 3's supply-chain content moves forward. Drew-first political move. |
| Phase 3 — **Sales + Customer + Quoting (swapped from Inventory)** | **$35K** | Lower than original Phase 3 ($80K) because the heavy work (item master migration, perpetual inventory, subcontracting) moved to Phase 2. |
| Phase 4 — Hardening, Financial Integration, Epicor Decommission | **$20K** | Unchanged. |
| **Program total Year 1** | **$165K** | Down $30K from $195K via honest staffing reshape (Dissent 1). |

**Contingency line (named, separate):** up to **$25K in change orders** at $1,200/dev-day if (a) item master migration exceeds 25 dev-days, (b) Spectrum AP journal design requires >5 dev-days of Caitlin-spec work, (c) Phase 2 cutover weekend slips beyond the committed window. **This lets us grow into $190K on evidence.** Much healthier than padding $195K up front.

**Optional Phase 5 items (visible, not committed):**
- Customer portal: +$15–20K
- EDI endpoints (per customer): +$10–15K each
- **Spectrum replacement with ERPNext Accounting: +$60–100K** — explicitly visible per Dissent 2
- Nextcloud / Teams replacement, passwordless rollout: separate engagement

**Option B committed-discount** (recommended over one-page Phase 1+2 letter): all four phases signed Monday at **$150K flat (9% discount)** to eliminate re-compete risk at each gate. Seat 4's 8% was too thin; 9–12% is the right incentive to lock.

---

## What the prior Council got RIGHT that survives this challenge

1. **Drew is the hidden decision-maker.** Seat 1's identification of Drew Adams as the linchpin is correct and under-played in the Monday plan. Every meeting tactic should triangulate toward Drew's written concerns. Keep.

2. **The six KPIs are deliverable in Phase 1 at no price change.** Seat 2's finding that the Daily Efficiency Log already contains the row-level data, and Seat 4's commitment to wire them through the new `Efficiency Event` entity, is correct and is the single strongest commercial weapon we have. Archer's D-10 explicitly punts on these; ours delivers them. This is the meeting's opening move. Keep.

3. **"BUILD IT!!!" gate broke — Archer is not actually approved.** Seat 1's observation that Collin and Drew filed concerns inside the 48-hour window (making "silence is consent" no longer operative) is correctly identified as our political opening. This framing is the reason Chris even has room to hear our pitch. Keep.

4. **The 6 new DocTypes finding (with my scope reduction in Challenge #4) is genuinely new work surfaced by Seat 2's spreadsheet reverse-engineering.** Archer hasn't done this work. Chris can see it. That's a real differentiator. Keep (with the DocType count corrected from 6 to 3 + 3 child tables).

5. **The sovereignty-pitch + MIT-license + SQL-export + on-prem-option + Epicor-retirement-commitment bundle is commercially coherent.** All four seats converged on this and it's the core product. Nothing in this dissent disturbs the core offer; I'm only fixing the staffing, price, and phase ordering around it. Keep.

6. **Option A's stage-gated structure (for Chris's risk appetite) plus Option B's committed-with-discount structure (for price certainty) is the right dual offer.** The question is only *which one is the recommended default* — Seat 4 recommends A, I recommend B. Both are legitimate; the choice is posture, not correctness.

---

## Open questions that need Chris's input Monday, not Claude speculation

1. **Is Jan 2027 a real business deadline or Archer's schedule?** Seat 1 inferred the latter. Chris should confirm. If it's driven by a customer contract, revenue recognition, or board commitment, our schedule flexibility changes materially.

2. **Who is JWM's dedicated ERP admin?** Paul is bandwidth-bound across Engineering + Quality. Direct question for Chris. Determines whether Year-1 embedded admin needs to be a sovereign.ai line item.

3. **Phase 2 ordering: Inventory-first (Drew) or Sales-first (estimators)?** Ask Chris explicitly. This is a political sequencing decision only he can make. Don't pick for him.

4. **Spectrum sentiment — is Chris attached to Spectrum or just inherited it?** If inherited, Phase 5 Spectrum replacement is a live future engagement. If Caitlin loves Spectrum, we park it permanently. Open question.

5. **Epicor contract terms — is it SaaS or perpetual? Renewal date? Data extraction rights?** Determines cutover timing, extraction method, and realistic retirement savings. Seat 3 flagged this; should be Monday's first IT question.

6. **Budget reality.** PRD §12 assumes "$40–60K working range." Our quote is $165–195K. We should ask Chris directly what the actual capex envelope is before leading with the full program number. If it's truly $60K, we lead Phase 1-only at $55K and grow in; if it's $200K, we lead with Option B committed.

7. **Wylie McDougall's and George Holland's involvement.** Both silent Ccs. Are they decision ratifiers or rubber-stampers? Changes the political surface we need to cover.

8. **Archer's actual Phase 1 quote.** Has Archer given Chris a Phase 1 build price beyond the $18K discovery? If yes, what is it? Seat 4's $120–180K estimate is speculation — the real number determines our pricing competitiveness.

9. **Named onsite Frappe engineer in Nashville — is this a requirement or a preference for Chris?** Determines whether the fractional-SRE model (Dissent 1) is acceptable or whether we need to reinstate the named-dev line and the $195K price.

10. **Is Matt's Australia schedule firm? 26 June through when?** The entire delivery model depends on this. If Matt is back in Nashville by October, the schedule risk halves. If he's in Australia until March 2027, the schedule risk doubles and named-dev becomes non-optional.

---

## Closing note

The prior Council produced a defensible quote. This dissent says: defensible is not the same as honest, and honest wins Monday more than defensible does.

The three big moves I'm recommending:
- **$165K fixed** (not $195K) on a restructured, honest staffing model.
- **Swap Phase 2 and Phase 3** to lead with Drew's priorities.
- **Make Option B the default** (committed, discounted) instead of the Phase 1+2 engagement letter.

Plus: ask ten specific questions of Chris Monday rather than arriving with answers manufactured in the absence of his input.

Nothing in this document invalidates the core sovereign.ai thesis. It sharpens it.

— Seat 5
