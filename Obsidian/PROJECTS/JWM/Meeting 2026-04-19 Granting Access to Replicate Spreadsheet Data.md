# Granting Access to Replicate Spreadsheet Data

**Date:** 2026-04-19

## Summary
# Executive Summary

This recording captures a detailed technical walkthrough between Chris (COO of JWM) and a software consultant building a custom ERP replacement system. Chris demonstrates JWM's current Google Sheets-based production management system for their architectural (A-shop/10.10) and processing (T-shop/10.40) divisions, revealing a complex operation managing 180+ concurrent jobs across 180 employees plus 45 subcontractors. The consultant is building a replacement system in under one week using modern tooling, with a critical stakeholder demo scheduled for the following morning at 8:30 AM. The urgency stems from a Friday meeting where Chris pivoted the company away from a hosting solution toward a full custom build. Key challenge: securing team buy-in (particularly from Drew, the production scheduler) while demonstrating the new system can replicate and improve upon their existing workflows.

---

## Key Discussion Points

• **Current Production Management System Architecture**
- JWM operates two divisions: Architectural (A-shop/10.10) and Processing (T-shop/10.40), with shared engineering and shop floor resources
- Production tracking runs entirely on Google Sheets with complex formula-driven status tracking (green/red indicators based on date formulas)
- Each project has its own dashboard containing: schedule, budget, change request log, change budget, full cost production, and project charter
- HPM (likely Head Project Manager) has separate dashboard aggregating all project data
- Project schedules use Gantt chart format with clash detection and on-track/off-track visual indicators
- PMs must manually update templates with task IDs that roll into master schedule

• **Engineering Request Form (ERF) Workflow**
- ERF document serves as the "live schedule" replacing static project schedules for shop and engineering
- PM creates job (e.g., job number 26052), fills parameters including release number, then submits
- Submission feeds into production schedule, described as "a monster fucking spreadsheet"
- Cards move through production stages with separate views for engineering vs. shop floor
- Engineering must complete before shop floor can begin (strict handover process)
- Even rubber-stamp approvals must go through engineering stage before shop floor

• **Production Scheduling Complexity**
- Current system uses card-based interface where cards move through stations (programming → CNC programming → Axis 34 foot, etc.)
- No inherent prioritization logic in card system—Drew manually transfers data to Excel to create actual schedule
- Drew determines work priority through conversations with PMs (all PMs believe their work is most important)
- Prioritization factors include: liquidated damages clauses, contract terms, past lateness, profitability, materials availability, machine availability
- Processing division has significantly more jobs than architectural (visible in card counts)

• **Workstation and Machine Structure**
- Multiple workstations including: flat lasers (1 & 2), tube lasers (1 & 2), press brake, welding, finishing
- Ability to view combined schedules or individual machine schedules required
- Stations categorized into distinct phases: uncategorized, evaluating, float, layout, layout check, sketch, sketch check, correction, CNC programming, laser programming, punch programming, program complete, release to shop
- "Release to shop" is critical handover point from engineering to shop floor
- Post-release stations are shop-floor specific

• **Quality and Non-Conformance Processes**
- Quality inspections and inspection checklists are important features
- ACM panel inspections exist as separate form/process
- Non-conformance reports (NCRs) can redirect workflow—e.g., parts with burrs sent to finishing before continuing to press brake
- QC and lead personnel can reject work and route to corrective processes
- Finishing may be optional or required depending on previous process quality

• **Routing and Assembly Complexity**
- Jobs have defined "routes" (not "routers"—Australian context noted) determined during estimation
- Routes are bespoke per job, determining which stations work passes through
- Processing division creates sub-parts that become stock parts, which combine into assemblies for final shipping
- Example: four sub-parts → assembly → final product for shipping
- Current system struggles with sub-part to assembly tracking

• **Organizational Context and Politics**
- Chris is #3 in company (Owner #1, President/CFO #2 who is 65 years old)
- Chris recently took over both divisions after complex organizational restructuring
- Former boss now reports to Chris; Chris had to inform him Friday that even if processing division shuts down (profitability struggles), he would be retained
- Drew (scheduler) will be protective of his Excel-based schedule as he built it
- Team was originally pursuing hosting solution; Chris pivoted to full custom build on Friday
- Goal is team buy-in, not approval (Chris has authority to proceed)

• **Technical Implementation Approach**
- Consultant reverse-engineering Google Sheets formulas into code
- Using n8n (open-source workflow tool) for visual workflow representation and execution
- Building "sexy frontend" with ERP running headless in background
- Passwordless authentication/passkey system implemented
- System using productionized data from JWM's actual operations
- Entire Epicor database could theoretically be imported for full migration

• **Timeline and Scale Context**
- Current build: 48 hours from initial conversation to working demo
- JWM's previous Epicor ERP rollout: 2-year period, never fully completed, $2M total cost
- Consultant's banking project comparison: $23M budget, 3-year timeline for lift-and-shift alone (20% of total project), already delayed 2 years
- Demo scheduled for following morning (8:30 AM meeting)
- Consultant confident of completing significant work overnight and during morning

• **Inventory Considerations**
- Inventory should be included in demo interface
- Multiple types of inventory exist (not fully detailed in conversation)
- Inventory visualization needs refinement in current diagram

• **Data Access and Security**
- Chris offered production access to Google Sheets; consultant declined ("step too far")
- Consultant prefers exported raw files to avoid touching live business data
- Chris has two raw files that contain everything
- Epicor access unclear—previous administrator was fired, access permissions uncertain

---

## Decisions Made

• **Decision to proceed with custom ERP build** (Chris, implicit authority)
- Context: Pivoted from hosting solution to full custom build on Friday
- Condition: Team buy-in desired but not required for proceeding

• **Decision to use real production data in demo** (Chris)
- Confirmed no issues showing real data to stakeholders
- Enables more relatable demonstration

• **Decision to let stakeholder conversation flow organically in demo** (Chris)
- Approach: Don't volunteer technical details unless asked
- Let team members lead with questions and feedback
- Go tab-by-tab gathering likes/dislikes/missing features

• **Decision to focus on frontend UI rather than backend ERP in demo** (Chris)
- Rationale: Frontend "so much more sexy" than backend
- Backend can run headless; stakeholders only need to see frontend

• **Decision to export current engineering and architectural workload data** (Chris)
- Will provide production sheet data for import into new system
- Enables realistic demo with actual job data

• **Decision not to prioritize PM-specific features for initial demo** (Chris)
- "Don't worry about the PM side" for now
- Focus on production scheduling and core workflows

---

## Action Items

| # | Action | Owner | Due | Priority |
|---|--------|-------|-----|----------|
| 1 | Write out menu structure with nesting and sequence (top to bottom) | Chris | Before morning drive-in (~6 AM next day) | High |
| 2 | Export current engineering and architectural workload from production sheet | Chris | Before demo (8:30 AM next day) | High |
| 3 | Review and provide feedback on consultant's demo run book | Chris | Morning drive-in (~6 AM next day) | High |
| 4 | Import production schedule data into new system in clean format | Consultant | Before demo (8:30 AM next day) | High |
| 5 | Build out menu structure based on Chris's specifications | Consultant | Before demo (8:30 AM next day) | High |
| 6 | Add inventory visualization to demo interface | Consultant | Before demo (8:30 AM next day) | Medium |
| 7 | Polish demo interface and test all functionality | Consultant | Before demo (8:30 AM next day) | High |
| 8 | Plan overnight work and kick off background processes | Consultant | Immediately after call | High |
| 9 | Call Chris during morning drive-in for final alignment | Consultant | ~6 AM next day | High |
| 10 | Record stakeholder demo meeting for feedback capture | Chris | During 8:30 AM meeting | Medium |
| 11 | Test passwordless authentication with Chris's user account | Chris | When convenient | Low |

---

## People & Organisations Mentioned

• **Chris** - COO of JWM, #3 in company, recently took over both architectural and processing divisions, driving the ERP replacement initiative

• **Drew** - Production scheduler who built the current Excel-based scheduling system, will be protective of his work, needs to be convinced of new solution value

• **Collin** - Team member associated with notes functionality (context limited)

• **Owner** - #1 in JWM company hierarchy (name not mentioned)

• **President/CFO** - #2 in company, 65 years old (name not mentioned)

• **HPM (Head Project Manager)** - Has own dashboard in current system aggregating project data

• **Former boss** - Previously Chris's superior, now reports to Chris after organizational restructuring, was informed Friday about job security even if processing division closes

• **Previous administrator** - Managed Epicor system, was fired for cause, created access permission uncertainty

• **QC personnel** - Quality control staff who can reject work and redirect to corrective processes

• **Lead personnel** - Shop leads who can identify quality issues (e.g., burrs) and redirect work

• **Australian colleagues** - Gave consultant banking project role after 45-minute conversation

• **JWM (Company)** - Manufacturing company with architectural and processing divisions, 180 employees plus 45 subcontractors (3 firms with 15 people each), currently doing work volume requiring sophisticated production management

• **Epicor** - Current ERP vendor, 2-year rollout that never fully completed, $2M total investment

• **Frappe** - Technology platform Chris directed team to investigate (Frappe.ai)

---

## Key Figures & Data

• **180 employees** - JWM direct workforce

• **45 subcontractors** - 3 subcontracting firms with 15 people each working in shop

• **180+ concurrent jobs** - Visible in production card system at time of recording

• **6-8 weeks** - Standard project lifespan from start to finish

• **<10 weeks** - Maximum typical project duration (can be shorter with materials available, longer without)

• **$2 million** - Total Epicor ERP investment including training and implementation

• **2 years** - Epicor rollout period (never fully completed)

• **$23 million** - Banking core transformation project budget (consultant's comparison project)

• **3 years** - Timeline for banking lift-and-shift (20% of total project)

• **5 years** - Total elapsed time for banking project including 2-year delay before starting 3-year migration

• **48 hours** - Time elapsed from initial conversation to current working demo state

• **45 minutes** - Length of interview before Australian firm offered consultant the banking role

• **2026-04-19 21:08** - Recording timestamp

• **8:30 AM (next day)** - Scheduled stakeholder demo meeting

• **~6:00 AM (next day)** - Planned call during Chris's morning drive-in

• **Job number example: 26052** - Sample job number format shown in ERF demonstration

• **Division codes:**
- 10.10 = Architectural (A-shop)
- 10.40 = Processing (T-shop)

---

## Risks & Dependencies

• **Drew's buy-in critical** - As builder of current scheduling system, Drew may resist change; his acceptance crucial for production scheduling adoption

• **Incomplete understanding of all workstations** - Consultant has never physically visited facility; relying on remote descriptions may miss critical workflow details

• **Epicor access uncertainty** - Previous administrator fired; unclear who has admin access or ability to export full database for migration

• **Processing division profitability struggles** - Division facing potential shutdown, creating organizational uncertainty that may affect project prioritization

• **Aggressive timeline risk** - Building production-ready ERP replacement in under one week is unprecedented; potential for overlooked requirements or technical debt

• **Team knowledge gaps** - Chris uncertain about team members' technical knowledge levels to ask appropriate questions in demo, making feedback quality unpredictable

• **Tribal knowledge in prioritization** - No codified logic for work prioritization; relies on Drew's conversations and judgment, making automation challenging

• **Data export dependencies** - Demo quality depends on Chris providing menu structure and production data exports before morning meeting

• **Integration complexity underestimated** - While consultant confident, typical ERP integrations take months/years; compressed timeline may reveal unforeseen technical challenges

• **Organizational change management** - Recent leadership restructuring (Chris's former boss now reporting to him) creates potential resistance or political complications

• **Multiple inventory types undefined** - Inventory requirements mentioned but not detailed; may require significant additional work

• **Sub-part to assembly tracking gaps** - Current system struggles with this; new system must solve without full requirements understanding

---

## Follow-Up Questions

• **What is the complete list of workstations beyond those mentioned?** - Consultant asked if current list covers breadth adequately; Chris confirmed sufficient for demo but complete list may be needed for production

• **What are the specific types of inventory that need tracking?** - Multiple inventory types mentioned but not detailed

• **What is the exact logic/algorithm Drew uses for prioritization?** - Described as tribal knowledge based on multiple factors; needs codification for automation

• **Who currently has admin access to Epicor?** - Previous administrator fired; access permissions unclear

• **What is the full sub-part to assembly workflow?** - Processing division creates sub-parts → stock parts → assemblies → final products; detailed workflow not fully mapped

• **What are all the quality inspection types and their triggers?** - ACM panel inspections mentioned; complete quality process not detailed

• **What determines when finishing is optional vs. required?** - NCR can route to finishing; decision logic not fully explained

• **How many PMs are there and what are their specific responsibilities?** - Multiple PMs mentioned competing for priority; organizational structure not detailed

• **What is the complete route/routing template library?** - Routes defined at estimation; full catalog of possible routes not provided

• **What happens to archived jobs and for how long are they retained?** - Cards "drop off" after completion; retention policy and archive structure not specified

---

## Next Steps

**Immediate (Tonight/Overnight):**
The consultant will plan and initiate overnight background processes to build out the demo system, focusing on importing production data and constructing the menu structure once Chris provides specifications. Work will continue running while consultant sleeps to maximize progress.

**Early Morning (Next Day ~6:00 AM):**
Chris will call consultant during morning drive-in to review the demo run book, provide menu structure specifications, and align on demo approach. Consultant will incorporate any final feedback and complete polishing of the interface.

**Demo Meeting (8:30 AM):**
Chris will present the working system to stakeholders, allowing conversation to flow organically. The team will go tab-by-tab through the interface, with stakeholders providing feedback on what they like, dislike, and what's missing. The meeting will be recorded to capture all feedback. Key focus will be securing Drew's buy-in on the scheduling functionality and demonstrating the system can replicate and improve upon existing workflows.

**Post-Demo:**
Based on stakeholder feedback, the consultant will refine the system, prioritizing features that address gaps identified during the demo. Chris will export additional production data as needed. The team will work toward full production deployment, with the aggressive timeline continuing based on the unprecedented development velocity demonstrated in the first 48 hours.

## Action Items
- [ ] **Write menu structure with nesting and sequence** (Chris) — due 2026-04-20 06:00
  Document the complete menu hierarchy for the new ERP system, specifying top-to-bottom sequence and which items are nested under others. Should include divisions (10.10 Architectural/A-shop and 10.40 Processing/T-shop), shared resources (Engineering, Shop Floor), and functional areas. Can narrate over phone or provide written document.
- [ ] **Export current engineering and architectural workload data** (Chris) — due 2026-04-20 08:30
  Export production sheet data for both architectural (10.10/A-shop) and processing (10.40/T-shop) divisions in clean format. This includes all current ERF submissions, job cards, and production scheduling information needed to populate the demo with real, relatable data.
- [ ] **Call consultant during morning drive-in for demo alignment** (Chris) — due 2026-04-20 06:00
  Chris to call consultant around 6:00 AM during morning commute to review demo run book, confirm menu structure, address any final questions, and align on demo approach before 8:30 AM stakeholder meeting.
- [ ] **Import production schedule data in clean format** (Consultant) — due 2026-04-20 08:30
  Import exported production sheet data (both divisions) into new ERP system in properly formatted structure. This is significant work requiring handling of extra fields and proper data mapping. Data must be clean and relatable for demo.
- [ ] **Build out menu structure based on Chris's specifications** (Consultant) — due 2026-04-20 08:30
  Once Chris provides menu structure document, implement the nested menu hierarchy with proper sequencing in the demo interface. Structure should reflect division organization, shared engineering resources, and functional groupings.
- [ ] **Plan overnight work and kick off background processes** (Consultant) — due 2026-04-19 23:59
  Consultant to plan and initiate overnight background build processes that will run while sleeping. System should be building/processing data imports and interface improvements through the night to maximize progress by morning.
- [ ] **Add inventory visualization to demo interface** (Consultant) — due 2026-04-20 08:30
  Include inventory display somewhere on the interface diagram. Note that multiple types of inventory exist but specific types not detailed. Inventory visualization should show the different categories appropriately.
- [ ] **Polish demo interface and test all functionality** (Consultant) — due 2026-04-20 08:30
  Complete final polish of demo interface. Test all visible functionality, ensure charts/graphs render correctly, verify passwordless authentication works, and confirm data displays properly. System should be production-ready for presentation.
- [ ] **Review demo run book** (Chris) — due 2026-04-20 06:00
  Chris to review consultant's demo run book/script on morning drive-in (~6 AM). Provide feedback on approach and confirm whether to focus on UI rather than explaining technical build details.
- [ ] **Record stakeholder demo meeting** (Chris) — due 2026-04-20 08:30
  Record the 8:30 AM stakeholder meeting to capture all feedback, questions, and responses. This recording will be used to identify likes/dislikes/missing features and guide subsequent refinement work.
- [ ] **Test passwordless authentication with Chris's user account** (Consultant)
  Test the passkey/fingerprint single sign-on authentication system with Chris's user account. Consultant has tested own access but needs to verify it works for Chris when convenient. May require capturing Chris's fingerprint on laptop.
- [ ] **Verify demo shows real production data** (Chris) — due 2026-04-20 06:00
  Confirm with Chris that it is acceptable to show real production data (with actual job numbers and operational information) in the stakeholder demo. Chris has confirmed there are no issues with this.
- [ ] **Prepare to demonstrate production schedule visualization** (Consultant) — due 2026-04-20 08:30
  Demo should show how the new system replicates Drew's current Excel scheduling, including visual representation of cards moving through stations. Focus on making it relatable to Drew's existing system to secure his buy-in.
- [ ] **Prepare to demonstrate RAG status and workstation scheduling** (Consultant) — due 2026-04-20 08:30
  Demo should include the color-coded status indicators (red/amber/green) by workstation and the ability to view combined and individual machine schedules (e.g., flat laser 1, flat laser 2 combined or separate, tube lasers, etc.).
