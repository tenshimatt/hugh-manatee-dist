# Speaking Improves Model Quality

**Date:** 2026-04-21

## Summary
# Executive Summary

This recording captures an AI implementation consultation between Matt (an AI consultant based in Jersey) and the JWM team (Colin, Drew, and Chris) on April 21, 2026. Matt is actively building a custom ERP system replacement for JWM using AI agents and modern development tools, demonstrating remarkable progress—approximately one month's worth of traditional development work completed in just 40 hours. The session focused on educating the team about AI agents, demonstrating live system capabilities including a fleet booking interface, and establishing next steps for data migration from their current Epicor ERP system. Matt emphasized the paradigm shift from traditional 70% commodity/30% custom software development to 70% business-specific customization, while also stressing the critical importance of AI safety and controlled implementation.

# Key Discussion Points

## Voice vs. Typing for AI Interaction
- Matt emphasized that speaking to AI models is 2.5x faster than typing and produces infinitely better quality information conveyance
- "Talking is the new typing" — a fundamental shift in how to interact with AI systems
- This applies across all AI interactions, not just specific use cases

## Definition and Capabilities of AI Agents
- **Basic definition**: Agents are combinations of workflows/tasks linked together with AI-powered decision-making capability, moving beyond traditional binary "if-this-then-that" logic
- **Key differentiator**: Agents can think through whether an action is the right thing to do, not just execute predetermined steps
- **Multi-step reasoning**: Agents can take complex, multi-chain prompts (e.g., "I like racing cars, generate a website and social media campaign") and break them into constituent tasks, then execute autonomously
- **Autonomous operation**: Unlike ChatGPT/Claude which require constant human interaction, agents can work independently and provide updates via mobile notifications (Telegram, WhatsApp, Teams, Slack)
- **Self-improvement capability**: The Hermes platform specifically checks after every action whether it can improve the process, prompting users with optimization suggestions

## Agent Platforms and Tools
- **n8n**: Primary workflow/agent building platform being used for JWM implementation (open source, unlimited usage)
- **Hermes**: Recommended agent platform for JWM due to superior safety features and self-improvement capabilities
- **OpenClaw**: Mentioned but not recommended due to security concerns
- Agents require setup with credentials, API keys, and permissions to access various systems (Epicor, databases, servers)
- Guard rails are implemented by limiting access scope—agents can only act on systems they've been explicitly given credentials for

## Current JWM System Development Progress
- **Timeline**: Approximately 40 hours of actual development time since initial conversation with Chris
- **Traditional estimate**: Would have required 4 months and $250,000 USD using conventional development approaches
- **Current status**: 16 features with "canned" (stubbed) data, some features using "seeded" data from JWM files, 22 features connected to live ERP data
- **Fleet booking system**: Demonstrated working drag-and-drop interface with real-time validation (checking driver/vehicle availability before allowing booking changes)
- **Live code modification**: Matt demonstrated making a code change in real-time during the call—fixing a bug where engineering cards weren't being removed from the pipeline when dragged to a person's schedule

## Technical Architecture and Infrastructure
- All tools being deployed will be installed on JWM's own infrastructure (data sovereignty, privacy, security)
- **GitHub**: Code repository storing all development files with version control and rollback capabilities
- **Sandbox environments**: Every change creates a separate sandbox environment for testing before production deployment (typically 2 minutes to deploy to production after approval)
- **n8n workflow example**: Matt's personal audio transcription workflow—captures audio from "Applaud" device, transcodes on local server (data sovereign), generates summaries, all automated
- **Database schema**: Critical foundation requiring careful setup of tables, fields, and relationships before data migration
- **Markdown (.MD) files**: Native language of agents—all documentation and specifications stored as text files that agents can directly understand and act upon

## Data Migration Requirements
- **Critical blocker**: Need complete export of Epicor ERP database to proceed with next development phase
- Export will enable 90% of remaining requirements to be determined
- Database schema must be reconfigured to match new system requirements
- Proper data structure example: Steel sheeting shouldn't have 17 separate records, but rather relational tables (material type → colors → dimensions)
- Once data is imported, immediate testing will reveal bugs and issues with current build

## Practical Use Cases Discussed
- **Colin's weekly reporting task**: Currently manually exports billable hours report from Epicor every Tuesday at 10am, downloads, transfers to spreadsheet for calculations, then sends to Chris—this entire workflow could be fully automated with agent sending final report directly to Chris
- **Colin's Epicor parts query**: Needed to look up all parts formed for specific jobs, gather estimated times, compile into spreadsheet—demonstrated as ideal agent use case
- **Scheduled monitoring**: Agents can run cron jobs (scheduled tasks) to check production lines, generate reports at 2am, send notifications at specified times
- **Infrastructure health checks**: Planned agent to monitor all JWM servers, generate health reports, identify optimization opportunities

## Development and Change Management Process
- Changes can be requested via Slack, Teams, or button in new system
- Requests go into project management tool (visible in Matt's demonstration)
- System reads tasks, determines if sufficient information exists (keys, IP addresses, server configs), then executes autonomously
- Every change is documented, versioned, and can be rolled back to any previous state
- Multiple changes can be tested simultaneously in separate sandbox environments
- Production deployment requires explicit approval from designated person

## AI Safety and Industry Context
- **Global adoption rate**: Less than 1% of US businesses, fraction of 1% globally operating at this level
- **Matt's career focus**: Dedicating remainder of career to AI safety
- **Anthropic's AI safety head**: Resigned 2 months ago to "spend time with family"—Matt implies ominous implications
- **Security concerns**: Same tools used for ethical purposes can be used for malicious hacking
- **Unreleased capabilities**: Anthropic hasn't released newest model version because it discovered 25-year-old bugs in systems that could "take down a bank"
- **Containment strategy**: Focus on implementing proper guardrails and systematic, methodical implementation rather than rushing
- **Learning curve danger**: Compared to "learning karate and getting badly beaten up in the beginning until you can hold your own"

## Business Model Transformation
- **Traditional software development**: 70% commodity features (login, basic functions), 20% industry-specific, 10% business differentiation
- **New AI-enabled model**: Flips ratio—10% commodity boilerplate, 70% business-specific customization
- **Competitive advantage**: Ability to spend majority of development effort on unique business differentiation rather than rebuilding standard features

## Team Learning and Adoption
- Colin has used AI for: creating NDAs, writing SOPs, organizational alignment documents, perforated panel design work
- Colin has ChatGPT subscription, has been experimenting with Codex
- Team acknowledges they didn't understand the magnitude of AI capabilities when they started
- Matt's engagement has evolved from "build a thing" to "work together and learn about AI and introduce it into the business"
- Recommendation: Team members should install Hermes agent platform locally for personal experimentation before production use

# Decisions Made

1. **Matt to deploy agent platforms on JWM infrastructure** — Made by Matt, pending Chris providing server access
2. **Use n8n as primary workflow/agent building platform** — Made by Matt based on technical requirements and open-source benefits
3. **Use Hermes as recommended agent platform for JWM team** — Made by Matt due to superior safety features and self-improvement capabilities
4. **Prioritize Epicor database export as next critical step** — Made collaboratively, identified as blocker for 90% of remaining work
5. **Implement sandbox/production separation for all changes** — Made by Matt as standard practice, accepted by team
6. **Matt will visit JWM location in person** — Made by Matt, timing to be determined (possibly next week, definitely before production deployment)
7. **Team members should experiment with agents locally before production use** — Made by Matt as recommendation for safe learning
8. **System will be named (currently unnamed, referred to as "not a demo anymore")** — Decision acknowledged but not resolved
9. **All data should ultimately be "live" (green status) in ERP, not canned or seeded** — Made by Matt as architectural principle

# Action Items

| # | Action | Owner | Due | Priority |
|---|--------|-------|-----|----------|
| 1 | Provide server access to Matt for deploying agent platforms and tools | Chris | ASAP | High |
| 2 | Generate and provide complete Epicor ERP database export | Chris/JWM IT | Within days | High |
| 3 | Send access links to all team members for viewing current system build | Matt | Next couple days | High |
| 4 | Document and submit system change requests/enhancements through new workflow | Colin, Drew, Chris | Ongoing | Medium |
| 5 | Install Hermes agent platform locally for personal experimentation | Colin (others optional) | Before production work | Medium |
| 6 | Schedule dedicated meeting for Matt to help Colin set up local agent environment | Colin & Matt | TBD via email | Medium |
| 7 | Verify Hermes compatibility with Windows OS and identify alternative if needed | Matt | Before Colin setup meeting | Medium |
| 8 | Conduct infrastructure health check on JWM servers once access provided | Matt | After server access granted | Medium |
| 9 | Decide on official name for new system (currently "not a demo anymore") | JWM team | Before production | Low |
| 10 | Schedule in-person visit to JWM location | Matt | Possibly next week, definitely before production | High |
| 11 | Provide all team member email addresses to Matt if not already shared | Chris | Next 1-2 days | Medium |
| 12 | Test and validate fleet booking system accuracy with real-world scenarios | JWM team | After data migration | Medium |
| 13 | Implement truck/van booking validation (prevent moving bookings to already-booked vehicles) | Matt/System | After validation logic defined | Medium |
| 14 | Build capacity planning into engineering schedule (time estimates on cards) | Matt/System | Future phase | Low |
| 15 | Automate Colin's weekly billable hours reporting workflow | Matt/System | Future phase | Medium |

# People & Organisations Mentioned

## People
- **Matt** — AI consultant/developer based in Jersey (between France and England), leading JWM system development, transitioning career focus to AI safety
- **Chris** — JWM team member, described as "a bit of a madman," primary contact providing server access and data, recipient of Colin's weekly reports
- **Colin** — JWM team member on the call, has ChatGPT subscription, uses AI for documents/SOPs/design work, performs weekly billable hours reporting, runs Windows OS
- **Drew** — JWM team member, slightly off camera during call, minimal participation
- **Denis Usantenko** — Example name used in engineering roster demonstration (likely test data)
- **Head of Anthropic AI Safety** — Resigned 2 months ago to spend time with family (Matt implies concerning reasons)

## Organizations
- **JWM** — Client organization, appears to be construction/engineering/manufacturing company with fleet management needs
- **Anthropic** — AI company, described as "arguably the leader in the world," developing Claude AI
- **GitHub** — Code repository platform being used for version control
- **Epicor** — Current ERP system provider for JWM

## Tools/Platforms
- **n8n** — Open-source workflow/agent building platform
- **Hermes** — Recommended agent platform with self-improvement capabilities
- **OpenClaw** — Agent platform mentioned but not recommended due to security issues
- **Applaud** (with a P) — Audio recording device Matt uses
- **Codex** — Platform Colin is experimenting with (has ChatGPT subscription)
- **Olama** — Chat model referenced in n8n demonstration
- **Slack/Teams/WhatsApp/Telegram** — Communication platforms for agent notifications

# Key Figures & Data

- **2.5x faster**: Speaking vs. typing speed for AI interaction
- **40 hours**: Actual development time invested since initial conversation with Chris
- **4 months**: Traditional development timeline estimate for equivalent work
- **$250,000 USD**: Traditional development cost estimate for first phase
- **16 features**: Currently with "canned" (stubbed) data
- **22 features**: Currently connected to live ERP data
- **~2 minutes**: Typical deployment time from approval to production
- **70/20/10 split**: Traditional software development (70% commodity, 20% industry-specific, 10% differentiation)
- **Inverted to 10/20/70**: New AI-enabled development model (10% commodity, 70% business-specific)
- **<1% in US**: Businesses operating at this AI implementation level
- **Fraction of 1% globally**: Worldwide businesses at this implementation level
- **25 years**: Age of bugs that newest Anthropic model can discover in systems
- **9 by 5 miles**: Size of Jersey island where Matt is located
- **5 mile beach**: Landmark near Matt's location (north to south of island)
- **2026-04-21 at 15:32**: Recording timestamp
- **1 a.m.**: Time Matt typically works until (mentioned working every day until 1am for last 2 years)
- **Tuesday 10am**: Colin's current weekly report generation time
- **2am**: Example time for scheduled agent tasks (infrastructure monitoring)

# Risks & Dependencies

## Critical Dependencies
- **Epicor database export**: Entire next phase of development blocked until complete export is provided—identified as enabling 90% of remaining requirements
- **Server access from Chris**: Matt cannot deploy tools, conduct infrastructure assessment, or provide team access until server credentials provided
- **Data schema accuracy**: Incorrect database structure will cause cascading issues across entire system; requires careful planning before migration

## Security Risks
- **Agent platform security**: OpenClaw specifically mentioned as having security issues; even recommended platforms require careful credential management and access controls
- **Credential sprawl**: Agents require API keys, SSH credentials, database access—improper management could create security vulnerabilities
- **Unintended system access**: Without proper guardrails, agents could access or modify systems beyond intended scope
- **Learning curve dangers**: Team members experimenting without proper understanding could inadvertently grant excessive permissions or create security holes

## Technical Risks
- **Unintended code changes**: As Colin identified, making one change could break existing functionality elsewhere in the system
- **Rapid development pace**: 40 hours producing 4 months of work creates risk of building faster than ability to validate and test
- **Context limitations**: AI doesn't have real-world business context; can build technically correct solutions that don't match actual business needs
- **Windows compatibility**: Hermes platform compatibility with Windows OS not confirmed; may require alternative solution for Colin

## Operational Risks
- **Production deployment timing**: Matt insists on being present for production deployment; scheduling delays could impact timeline
- **Two accelerators, no brakes**: Chris and Matt both described as aggressive on implementation speed; need someone to provide governance
- **Lack of systematic approach**: Risk of building too much too fast without proper validation of each component
- **Knowledge concentration**: Heavy reliance on Matt's expertise; limited knowledge transfer to JWM team evident

## Existential/Strategic Risks
- **AI safety concerns**: Matt dedicating career to AI safety, Anthropic safety head resignation, unreleased models due to dangerous capabilities—all suggest broader industry concerns about AI control
- **Competitive exposure**: Operating at <1% adoption level globally means either significant competitive advantage or being guinea pig for untested approaches
- **Legacy system dependency**: Still dependent on Epicor data and structure; migration risks if not executed properly
- **Irreversibility**: Once agents are deployed and integrated, rolling back to traditional approaches may be extremely difficult

# Follow-Up Questions

1. **What specific API keys and credentials will be required from Epicor?** — Discussed need for keys but not specific requirements or how to generate them
2. **What is the exact timeline for Matt's in-person visit?** — Mentioned "possibly next week" but no confirmed dates or duration
3. **How will the system be officially named?** — Acknowledged need to move beyond "not a demo anymore" but no naming decision made
4. **What is the complete list of data fields needed from Epicor export?** — General need discussed but specific schema requirements not detailed
5. **What are the specific security protocols for agent credential management?** — General guardrails discussed but not specific policies or procedures
6. **Who will have authority to approve production deployments?** — Process described but approval authority not explicitly assigned
7. **What is the rollback procedure if production deployment fails?** — Capability mentioned but specific procedure not documented
8. **How will machine/equipment capacity planning be integrated similar to personnel scheduling?** — Colin asked about this but implementation details not provided
9. **What training will be provided

## Action Items
- [ ] **Provide server access to Matt for platform deployment** (Chris) — due ASAP
  Chris needs to provide Matt with access to JWM's server infrastructure so he can deploy n8n, Hermes, and other agent platforms on JWM's own infrastructure for data sovereignty and security.
- [ ] **Generate and export complete Epicor ERP database** (Chris) — due Within days
  Extract full Epicor ERP database export including all tables, fields, and relationships. This is critical as it will enable 90% of remaining development requirements and allow proper database schema reconfiguration for the new system.
- [ ] **Send system access links to all team members** (Matt) — due Next couple of days
  Matt to provide access links to all team members (Colin, Drew, Chris) so they can view the current system build with 38 features (16 canned, 22 live with ERP data) and monitor ongoing development progress.
- [ ] **Schedule in-person visit to JWM location** (Matt) — due Possibly next week, definitely before production deployment
  Matt to visit JWM's physical location for hands-on system review, infrastructure assessment, and production deployment preparation. Visit is critical before going live in production.
- [ ] **Install Hermes agent platform locally for personal experimentation** (Colin) — due Before production work begins
  Colin (and optionally other team members) to install Hermes agent platform on personal laptop/computer for safe local experimentation with AI agents before production use. This is recommended as a learning exercise.
- [ ] **Verify Hermes compatibility with Windows and identify alternative if needed** (Matt) — due Before Colin's local setup meeting
  Matt to check if Hermes agent platform is compatible with Windows OS (Colin's system). If not, identify and recommend an alternative agent platform that Colin can use for local experimentation.
- [ ] **Schedule setup meeting for Colin's local agent environment** (Colin) — due TBD via email
  Colin and Matt to schedule dedicated meeting to help Colin install and configure Hermes (or alternative) agent platform locally on his Windows computer, including credential setup and basic workflow creation.
- [ ] **Provide all team member email addresses to Matt** (Chris) — due Next 1-2 days
  Chris to compile and send Matt the email addresses for Colin, Drew, and any other team members who need access to the system build links and future communications.
- [ ] **Document and submit system change requests through new workflow** (Colin, Drew, Chris) — due Ongoing
  Colin, Drew, and Chris to begin using the new change request workflow (Slack, Teams, or in-system button) to submit feature enhancements and system modifications. Changes will be tracked in project management tool and executed by agents.
- [ ] **Conduct infrastructure health check on JWM servers** (Matt) — due After server access is granted
  Once Chris provides server access, Matt to perform comprehensive health check on all JWM servers, generate reports on current state, identify optimization opportunities, and plan infrastructure improvements.
- [ ] **Automate Colin's weekly billable hours reporting workflow** (Matt) — due Future phase (after core system stable)
  Build agent workflow to automatically extract billable hours report from Epicor every Tuesday at 10am, calculate percentages in spreadsheet, and send final report directly to Chris without manual intervention.
- [ ] **Implement truck/van booking validation logic** (Matt) — due After validation requirements finalized
  Add validation to fleet booking system to prevent moving bookings to vehicles that are already booked for that time period. This prevents overbooking of specific trucks/vans.
- [ ] **Test and validate fleet booking system accuracy** (JWM team) — due After Epicor data migration complete
  JWM team to thoroughly test fleet booking system with real-world scenarios after data migration is complete, verifying driver/vehicle availability checks, drag-and-drop functionality, and booking conflict prevention work correctly.
- [ ] **Decide on official name for new system** (JWM team) — due Before production deployment
  JWM team to determine and agree on official system name to replace current reference as 'not a demo anymore'. This should be finalized before production deployment.
- [ ] **Build capacity planning into engineering schedule** (Matt) — due Future phase (after core system stable)
  Future enhancement: Add time estimate fields to engineering cards and implement machine/equipment capacity planning similar to personnel scheduling capabilities already built.
