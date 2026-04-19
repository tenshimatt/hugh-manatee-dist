# Plaud Notes Pro Recorder and Transcription Costs

**Date:** 2026-04-19

## Summary
# Executive Summary

This recording captures a working session between two individuals developing a custom ERP solution for JWM (John Levy McDougall Company), an 88-year-old architectural metals and processing fabrication business. The primary focus is transitioning from their failing Epicor system to a Frappe-based open-source ERP, with immediate priority on the processing division's shop floor operations. The consultant has built a functional demo system and is working to understand JWM's dual business lines (architectural and processing), with the processing side being the current pain point. A critical stakeholder meeting is scheduled for tomorrow (April 20, 2026), requiring a working scheduler, efficiency dashboard, and data entry forms to demonstrate system viability to the team.

# Key Discussion Points

## Recording Equipment Discussion
- Discussion of Plaud Notes Pro recorder (5 cameras, ~$100 hardware, $200-400/year subscription for transcription)
- Consultant built own transcription pipeline to avoid subscription costs; offered to share with client
- Legal requirement to inform all parties when recording (Tennessee is one-party consent state)
- Claude AI providing detailed meeting preparation notes automatically

## ERP System Architecture & Demo
- Consultant rapidly created 15-step business process flow for JWM's operations
- Demo system accessible at JWM-demo URL (Beyond Pandora domain - consultant's internal naming convention)
- System is "demo in production" - fully functional, not just mockup
- Built on Frappe open-source ERP platform (zero licensing cost vs. current Epicor expenses)
- Consultant has already skinned/customized the interface from default black and white
- Generated demo files by reverse-engineering JWM's website, building portfolio, and generic engineering practices
- System includes: estimator, planner, shop floor job cards, bill of materials generation, work order creation

## Business Structure & Personnel
- **Processing Division**: Hannah (Operations Manager) oversees Lisa, Autumn (Customer Support Managers), and Owen (Project Manager)
- **Architectural Division**: Separate PM structure, jobs broken into releases (e.g., 1,000 panels divided into 5 releases of 200 panels each)
- Engineering Request Form (ERF) drives architectural workflow with drawings and specifications
- Processing side works from quotes containing complete job specifications

## Current Pain Points & Requirements
- **Immediate priority**: Processing division shop floor system that works and earns team trust
- **Core needs**: Scheduling, inventory management, work-in-progress (WIP) tracking, material placement
- **Data quality**: Identified as biggest current problem - "if you don't have data, get better data"
- **Epicor failure**: Described as "colossal failure" - trying to force manufacturing workflows into construction-oriented system
- **Accounting complexity**: WIP accounting challenge - can only invoice when product leaves facility, but construction accounting recognizes revenue by percentage complete
- **System trust**: Team needs to trust the system before expanding to other modules

## Workflow & Process Definition
- **Starting point agreed**: Quote/Purchase Order entry as system trigger (not estimating, CRM, or accounting initially)
- **Architectural workflow**: ERF submission → engineering processing → 200-panel releases → drawings/specifications
- **Processing workflow**: Quote with complete specifications → dump into system → production
- **Current state**: Estimating jobs outside system initially; file import once job is won
- **Sales tax complexity**: Interstate sales tax mentioned (Avalara, TaxJar, Vertex as potential solutions)
- Payroll to remain with current provider (ERP doesn't handle out-of-box)

## Technical Approach & AI Integration
- **Claude AI models hierarchy**: Haiku (does what it's told) → Sonnet (knows what to do) → Opus (knows what you meant)
- **Opus 4.7**: Most lateral thinking, better inference, but consumes credits faster
- **Model accuracy**: Base models ~60% accurate, but "harness" (toolkit/framework) brings to ~95% through multiple validation passes
- **Command line requirement**: Actual building/implementation requires command line Claude, not web app (security sandbox limitations)
- **Industry shift**: Moving from "buy and customize" to "build on open foundation" - consultant's position reversed from one year ago
- **Data sovereignty**: Strong preference to avoid giving data to third parties regardless of assurances

## Notable Projects & Company Background
- JWM fabricated every panel for Epcot globe at Disney (first major Asian job in America)
- Company is 88 years old, well-respected in market
- Owner (John McDougall) insists on full company name, not abbreviations
- Portfolio includes high-end architectural metalwork described as "art"

## Consultant's Context
- Day job at bank described as "pedestrian affair" - system-dictated work
- Former CIO seeking work with direct influence on outcomes
- Finds AI/ERP development "more addictive than crack" - would do for free
- Moving from current location June 26, 2026 (end of work commitment)

## Third-Party Contact Suggestion
- Gretchen (neighbor): Retired PepsiCo VP of Supply Chain, now SAP consultant
- Relevant experience: Led SAP implementation at PepsiCo with two approaches (full customization vs. workflow adaptation)
- Workflow adaptation approach succeeded; heavy customization still struggling after 2 years
- Client to facilitate introduction for consultant

# Decisions Made

1. **System starting point**: Quote/Purchase Order entry will be the trigger point for the ERP system, explicitly excluding estimating, CRM, and accounting modules initially (agreed by both parties)

2. **Processing division priority**: Focus exclusively on processing division shop floor operations before expanding to architectural side or other modules (client decision)

3. **Frappe ERP platform**: Implicit decision to proceed with Frappe open-source ERP as foundation (consultant recommendation, client acceptance indicated by continued development discussion)

4. **Demo deliverables for tomorrow's meeting**: Scheduler, efficiency dashboard, and data entry forms to be ready for team presentation (consultant commitment)

5. **Phased approach**: Build core shop floor trust first, then expand to other modules over time (mutual agreement)

# Action Items

| # | Action | Owner | Due | Priority |
|---|--------|-------|-----|----------|
| 1 | Review processing quotes sent via email and tailor demo system accordingly | Consultant | April 19, 2026 (evening) | High |
| 2 | Build working scheduler matching reference schedule previously sent | Consultant | April 20, 2026 (before meeting) | High |
| 3 | Create efficiency dashboard with same look/functionality as reference | Consultant | April 20, 2026 (before meeting) | High |
| 4 | Develop data entry form for efficiency dashboard | Consultant | April 20, 2026 (before meeting) | High |
| 5 | Grant client access to ERP system for exploration | Consultant | April 19, 2026 (evening) | Medium |
| 6 | Send ERP system access link to client | Consultant | April 19, 2026 (evening) | Medium |
| 7 | Provide command line Claude installation instructions for Windows | Consultant | Not specified | Low |
| 8 | Facilitate introduction between consultant and Gretchen (PepsiCo/SAP contact) | Client | Not specified | Low |
| 9 | Meet early morning before stakeholder meeting to review demo | Both | April 20, 2026 (early AM) | High |

# People & Organisations Mentioned

## JWM Company Personnel
- **Hannah**: Operations Manager for Processing Division - oversees customer support and project management
- **Lisa**: Customer Support Manager (Processing)
- **Autumn**: Customer Support Manager (Processing)
- **Owen**: Project Manager (Processing)
- **John McDougall**: Company owner, insists on full company name usage

## External Contacts
- **Gretchen**: Retired PepsiCo VP of Supply Chain, currently SAP consultant, lives in client's neighborhood, relevant experience with ERP implementations

## Companies & Systems
- **JWM (John Levy McDougall Company)**: 88-year-old architectural metals and processing fabrication company
- **Epicor**: Current ERP system, described as "colossal failure"
- **Spectrum**: Construction-oriented accounting software currently in use
- **Frappe**: Open-source ERP platform being implemented
- **Anthropic (Claude)**: AI platform being used for development
- **SAP**: Enterprise software (context: Gretchen's consulting work)
- **PepsiCo**: Reference for ERP implementation case study
- **Avalara, TaxJar, Vertex**: Sales tax software solutions mentioned
- **Disney/Epcot**: Client for globe fabrication project

# Key Figures & Data

## Financial & Business Metrics
- **Plaud Notes Pro cost**: ~$100 hardware, $200-400/year subscription
- **Frappe licensing cost**: $0 (open-source, would save entirety of Epicor costs)
- **Company age**: 88 years (established 1938)

## Project Examples
- **Typical architectural job structure**: 1,000 panels divided into 5 releases of 200 panels each
- **Epcot globe project**: Every panel fabricated by JWM (first major Asian job in America)

## Technical Specifications
- **Plaud Notes Pro**: 5 cameras for enhanced audio capture
- **AI model accuracy**: Base models ~60%, with harness/toolkit ~95%
- **ERP process steps**: 15 steps mapped for business process
- **Claude usage limits**: Weekly credit allocation (specific numbers not mentioned)

## Timeline
- **Recording date**: April 19, 2026, 15:08
- **Stakeholder meeting**: April 20, 2026 (tomorrow)
- **Consultant's move date**: June 26, 2026 (end of current work commitment)
- **SAP implementation reference**: 2-year timeframe mentioned for PepsiCo project

# Risks & Dependencies

## Technical Risks
- **Data quality**: Identified as "one of the biggest problems" - system effectiveness depends on quality input data
- **Third-party data exposure**: Strong concern about giving data to external parties (Claude, ChatGPT) regardless of security assurances
- **Command line complexity**: Client will need to learn command line tools for full system customization (learning curve dependency)
- **Demo file compatibility**: Some uploaded files not being read correctly by system (technical debugging needed)

## Business Risks
- **Team trust**: System must earn team trust before expansion - failure at this stage could derail entire initiative
- **Customization vs. standardization**: Historical evidence (PepsiCo case) shows heavy customization can fail while workflow adaptation succeeds - balance needed
- **Information availability**: All current information is architectural-focused; processing division data still being gathered
- **Stakeholder meeting pressure**: Tomorrow's demo is critical for team buy-in - incomplete or non-functional features could damage credibility

## Dependencies
- **Processing quotes**: Consultant needs actual processing quotes to properly configure system (sent but not yet reviewed)
- **Schedule reference**: Previous schedule sent by client needed for scheduler build
- **Efficiency metrics**: Reference efficiency dashboard needed for replication
- **Client access setup**: Security/permissions configuration required before client can explore system
- **Consultant availability**: Moving in ~2 months (June 26) - timeline constraint for implementation
- **Gretchen introduction**: Potential valuable input from SAP/supply chain expert pending introduction

## Operational Constraints
- **WIP accounting complexity**: Can only invoice when product leaves facility, but need percentage-complete revenue recognition
- **Interstate sales tax**: Multi-state operations require sophisticated tax handling
- **Dual business lines**: Architectural and processing divisions have different workflows requiring separate handling
- **Legacy system migration**: Transitioning from Epicor while maintaining business continuity

# Follow-Up Questions

1. **What specific efficiency metrics** are tracked on the reference dashboard that needs to be replicated for tomorrow's meeting?

2. **What is the exact workflow** for the processing division from quote acceptance to final delivery? (15 steps mapped but validation needed)

3. **How is WIP currently tracked** in Spectrum, and what are the specific accounting requirements for the new system?

4. **What data fields** are included in a typical processing quote vs. architectural ERF?

5. **What are the specific pain points** with Epicor that led to it being a "colossal failure"? (Important for avoiding same mistakes)

6. **How many concurrent jobs** does the processing division typically handle, and what is the average job duration?

7. **What is the material procurement process**, and how does it integrate with scheduling?

8. **Who are the other stakeholders** attending tomorrow's meeting, and what are their specific concerns/requirements?

9. **What is the current state** of data migration from Epicor - what historical data needs to be preserved?

10. **What are the specific security/permissions requirements** for different user roles in the shop floor system?

11. **How does the architectural division's release-based workflow** integrate with overall company scheduling and resource allocation?

12. **What is the timeline expectation** for full system implementation given the consultant's June 26 departure date?

# Next Steps

The consultant will spend the remainder of April 19 reviewing the processing quotes sent via email and tailoring the demo system to match JWM's actual workflows. By evening, the client will receive access credentials to explore the ERP system independently. 

The consultant must deliver three critical components before tomorrow's stakeholder meeting: a functional scheduler matching the previously provided reference, an efficiency dashboard with equivalent look and functionality, and data entry forms for efficiency tracking. These deliverables are essential for demonstrating system viability and earning team trust.

Both parties will meet early morning on April 20 before the stakeholder presentation to review the updated demo and align on messaging. The meeting strategy focuses on demonstrating the processing division's shop floor capabilities rather than attempting to showcase the full ERP suite - the goal is building foundational trust before expanding scope.

Following the stakeholder meeting, the development approach will be iterative: refine the core quote-to-production workflow based on team feedback, ensure data quality processes are established, and only then expand to peripheral modules like estimating, CRM, and accounting integration. The consultant will also facilitate an introduction between the client and Gretchen (PepsiCo/SAP expert) for additional strategic perspective on ERP implementation approaches.

The underlying strategy represents a significant philosophical shift from traditional "buy and customize" ERP implementations to "build on open foundation" - leveraging Frappe's zero-cost base while maintaining complete customization control. Success depends on demonstrating immediate value to the processing team while establishing the data quality and workflow discipline necessary for long-term system effectiveness.

## Action Items
- [ ] **Review processing quotes and tailor demo system** (Consultant) — due 2026-04-19
  Review the processing quotes sent via email and customize the ERP demo system to accurately reflect JWM's actual processing workflows and requirements.
- [ ] **Build working scheduler for demo** (Consultant) — due 2026-04-20
  Create a functional scheduler that matches the reference schedule previously provided by the client, ready for tomorrow's stakeholder meeting demonstration.
- [ ] **Create efficiency dashboard** (Consultant) — due 2026-04-20
  Develop an efficiency dashboard with the same look and functionality as the reference dashboard provided, for use in tomorrow's stakeholder presentation.
- [ ] **Develop data entry form for efficiency tracking** (Consultant) — due 2026-04-20
  Create a data entry form that shop floor leads can use to fill in efficiency data for the dashboard, to be demonstrated to the team tomorrow.
- [ ] **Grant client system access to ERP** (Consultant) — due 2026-04-19
  Provide the client with login credentials and access to the Frappe-based ERP system so they can independently explore and test all modules and functionality.
- [ ] **Send ERP system access link** (Consultant) — due 2026-04-19
  Email the client the access link to the JWM-demo ERP system on the Beyond Pandora domain with login instructions.
- [ ] **Early morning pre-meeting review** (Both parties) — due 2026-04-20
  Meet with client early on April 20th before the stakeholder meeting to review the updated demo system, validate deliverables, and align on key talking points for the presentation.
- [ ] **Facilitate introduction to Gretchen** (Client)
  Arrange introduction between consultant and Gretchen (retired PepsiCo VP of Supply Chain, now SAP consultant) to provide strategic perspective on ERP implementation approaches based on her experience.
- [ ] **Provide Claude command line installation instructions** (Consultant)
  Send client instructions for installing and configuring command line Claude on Windows, including the specific installation string and setup steps needed for full system customization capabilities.
