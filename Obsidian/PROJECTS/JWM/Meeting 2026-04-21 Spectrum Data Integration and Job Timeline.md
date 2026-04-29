# Spectrum Data Integration and Job Timeline

**Date:** 2026-04-21

## Summary
# Structured Meeting Note — 2026-04-21 at 15:10

## Executive Summary

This was a technical planning session between a development consultant and a client (JWN project) focused on system integration, data migration, and infrastructure setup. The consultant provided a detailed walkthrough of the development methodology, project management approach, and documentation structure being used to build a custom system that will integrate with the client's existing ERP, Spectrum, and Smartsheet platforms. Key outcomes include agreement to establish secure server access via Tailscale, create a Microsoft Teams account for the consultant, implement LiteLLM gateway for AI usage management, and begin structured data migration from Epico exports. The client revealed significant infrastructure complexity with numerous redundant servers requiring cleanup and consolidation.

## Key Discussion Points

• **Three Outstanding Technical Requirements Identified:**
  - Need to determine how to integrate spectrum data into jobs
  - Two additional items mentioned but not specified in detail
  - Client has capacity to address these given progress to date

• **Development Methodology & Transparency:**
  - Consultant is providing complete access to all development processes, documentation, and project management tools
  - Described as "opening the kimono" — full transparency on every component being built
  - Client will receive comprehensive documentation enabling them to replicate the entire system independently if needed
  - Educational component emphasized: client expected to learn significantly through the process

• **API Development Approach:**
  - APIs (Application Programming Interfaces) are the core building blocks being created
  - Each API connects front-end screens/buttons to back-end systems
  - APIs function as services that wait for specific field inputs (e.g., first name, middle name, last name, mobile, address) and return requested data
  - Yellow summary block in documentation provides high-level overview to avoid getting lost in technical details

• **Data Migration from Epico:**
  - Epico export will provide approximately 90% of required data
  - Client performs daily dumps from "Apple" (likely Epico) to Smartsheet
  - Client did not previously provide export due to OneDrive access issues
  - Security concerns raised about email transmission of sensitive data
  - Need structured approach to data transfer rather than ad-hoc methods

• **Data Organization Issues:**
  - Data currently in wrong locations across processing, architectural, and engineering categories
  - Need to create prioritized instruction list for data cleanup
  - Safety data identified as "phase two" but characterized as quick win ("one and done")
  - Client being "peppered with a million different things" — need to focus and prioritize

• **Project Management Structure:**
  - Using visual task board with "Done," "In Progress," and "To Do" columns
  - 39 remaining tasks, expected to progress quickly once data blockers resolved
  - Tasks generated from meeting transcripts and converted into structured build requirements
  - All tasks traceable from original transcript through to implementation
  - Some task owner names are placeholders/fabricated where actual owners weren't specified

• **Documentation Architecture:**
  - "JWN project folder" contains all building, planning, and system documentation
  - Comprehensive documentation includes decisions, data models, system architecture, and build specifications
  - Documentation designed to enable complete system replication: "if I get hit by a bus you take the documents...and you could build and replicate the entire system"
  - Documentation currently stored locally but will be migrated to client server

• **Development Workflow:**
  - Three-stage process: Documentation → Task Creation → Build Execution
  - Uses "dark factory" (specialized workflow building tool) to accelerate development
  - Enables rapid iteration and deployment
  - Client will receive copy of the dark factory system upon completion

• **Future Bug/Feature Request Process:**
  - Two options for submitting requests: Slack channel or embedded form in system itself
  - Requests flow through automated steps to preserve context
  - Direct correlation between request and implementation prevents miscommunication
  - All changes deployed separately with full version history via Git repository
  - Ability to revert changes or iterate incrementally

• **System Structure Recommendation:**
  - Propose using existing menu hierarchy as organizational framework
  - Menu provides logical sequence and hierarchy (executive dashboard/management at top)
  - Each menu category becomes a folder; each subcategory becomes a page with specific features
  - Enables targeted deployments (e.g., "deploy new feature to engineering line")
  - Direct correlation between documentation, tasks, and actual system pages
  - Generic bundle planned for core infrastructure/foundations/plumbing

• **Task Tracking Integration:**
  - Future state: paste page link into Slack, describe issue, creates task automatically
  - Task links back to original Slack message and specific system page
  - Every code change commits to Git with full history
  - Complete traceability from initial request through implementation

• **Server Infrastructure Assessment:**
  - Client has extensive server infrastructure (described as "a lot of freaking servers")
  - Visual server map shown with large black server (192.168.2.2) in client office
  - Multiple physical servers with numerous virtual servers
  - Significant redundancy identified: "so much redundant shit in there I'm really not happy about it"
  - Servers appear to have accumulated without clear decommissioning process
  - Consultant philosophy: "less is more from a security and management point of view"
  - People typically don't delete servers due to uncertainty about dependencies

• **Secure Access via Tailscale:**
  - Tailscale creates secure tunnel between consultant and client servers
  - Client would install application on physical server(s)
  - Consultant accepts connection on their side
  - Enables consultant to access servers securely for assessment and maintenance
  - Requires installation on actual server machines, not laptops
  - Would enable consultant to assess current state and provide recommendations

• **Current Technology Stack:**
  - ERP, Spectrum, and Smartsheet (some/all cloud-based)
  - Extensive on-premise server infrastructure
  - Consultant questioning necessity of maintaining so much infrastructure given cloud alternatives

• **Post-Meeting Actions from Previous Day:**
  - Client encouraged team to "get called" (context unclear)
  - Paul informed about "command line problem" which has him thinking
  - Client expressed gratitude to team for support and emigration efforts (context unclear)

• **LiteLLM Gateway Implementation:**
  - Consultant can deploy LiteLLM gateway on client server as part of bundled services
  - Non-intrusive deployment that won't disrupt business operations
  - Phased rollout: Paul and client as initial guinea pigs before broader deployment
  - Provides centralized logging of all AI prompts and usage
  - Warning: all prompts will be visible to administrators — users should be mindful of what they submit

• **Claude/Anthropic Business Account Strategy:**
  - Recommend single business account rather than individual accounts
  - Claude Business: $20/person/month, minimum 5 people
  - Centralized key management: no individual users get API keys
  - All access managed through browser with LiteLLM handling backend
  - Benefits: risk management, content masking/blocking, cost transparency, usage analytics, model selection by team/role
  - Currently client likely lacks detailed cost visibility
  - Enables identification of who needs more/less access
  - Can assign appropriate AI models to different teams based on needs

• **Communication Platform:**
  - Initial assumption was Slack access
  - Client uses Microsoft Teams as primary chat application
  - Consultant requested Teams account creation (approximately $10/month if paid tier)
  - Teams access will enable clean content delivery into client environment
  - Will facilitate appropriate permission management for server work

## Decisions Made

1. **Data Migration Approach** (Consultant recommendation, client agreement implied): Use Epico export as primary data source, which will provide ~90% of needed data. Security protocols to be established rather than email transmission.

2. **Documentation Structure** (Consultant recommendation, client agreement implied): Organize system documentation and tasks according to existing menu hierarchy, with folders per category and pages per subcategory.

3. **Server Access Method** (Consultant recommendation, pending client implementation): Use Tailscale for secure server access rather than alternative methods.

4. **Communication Platform** (Joint decision): Use Microsoft Teams rather than Slack for collaboration and content sharing.

5. **LiteLLM Deployment Strategy** (Consultant recommendation, client agreement implied): Phased rollout starting with Paul and client as test users before broader team deployment.

6. **AI Account Structure** (Consultant recommendation, client agreement pending): Implement single Claude Business account with centralized key management through LiteLLM rather than individual user accounts.

## Action Items

| # | Action | Owner | Due | Priority |
|---|--------|-------|-----|----------|
| 1 | Provide Epico export data (daily dump from Apple to Smartsheet) | Client | Not specified | High |
| 2 | Establish secure data transfer mechanism (not email) | Consultant + Client | Not specified | High |
| 3 | Create prioritized instruction list for data cleanup (processing, architectural, engineering categories) | Consultant | Not specified | High |
| 4 | Install Tailscale on physical server(s) to enable secure access | Client IT team | Not specified | Medium |
| 5 | Create Microsoft Teams account for consultant | Client admin | Within a day (implied) | High |
| 6 | Provide OneDrive access to consultant | Client | Not specified | Medium |
| 7 | Share JWN project folder documentation with client | Consultant | Not specified | Medium |
| 8 | Migrate project documentation to client server | Consultant | Not specified | Low |
| 9 | Clean up and reorganize existing tasks in project board by menu hierarchy | Consultant | Not specified | Medium |
| 10 | Deploy LiteLLM gateway on client server | Consultant | After server access established | Medium |
| 11 | Set up Claude Business account (minimum 5 users at $20/person/month) | Client | Before LiteLLM deployment | Medium |
| 12 | Configure LiteLLM integration with Claude Business account | Consultant | After account setup | Medium |
| 13 | Test LiteLLM with Paul and client as initial users | Paul + Client | After LiteLLM deployment | Medium |
| 14 | Coordinate with IT team on LiteLLM rollout requirements | Client | Before broad deployment | Low |
| 15 | Conduct server infrastructure assessment and provide recommendations | Consultant | After Tailscale access established | Medium |
| 16 | Provide appropriate server permissions for consultant work | Client | As needed | Medium |
| 17 | Review and address redundant server infrastructure | Client IT team | Not specified | Low |
| 18 | Walk through automated feature request process together | Consultant + Client | When system ready | Low |

## People & Organisations Mentioned

• **Paul** — Client team member; informed about "command line problem" after previous meeting; will be initial guinea pig for LiteLLM testing alongside client

• **Client/Primary Contact** — Senior stakeholder leading JWN project; has server access and administrative authority; will be first LiteLLM test user

• **Client IT Team** — Responsible for server infrastructure management; will need to coordinate on LiteLLM deployment and configuration changes

• **Consultant/Developer** — Leading system development; providing full-stack development, documentation, and infrastructure services; emphasizes security and transparency

• **Client Team (general)** — Encouraged to "get called" and thanked for support and "emigration" efforts after previous meeting

## Key Figures & Data

• **90%** — Estimated percentage of required data that Epico export will provide

• **39 tasks** — Number of remaining tasks in project management system (expected to progress quickly once data blockers resolved)

• **192.168.2.2** — IP address of large black server in client office (physical infrastructure)

• **192.168.2.1** — Another server IP address mentioned in infrastructure discussion

• **$20/person/month** — Cost of Claude Business account

• **5 people** — Minimum number of users required for Claude Business account

• **~$10/month** — Estimated cost of Microsoft Teams paid account

• **Daily** — Frequency of data dumps from Apple/Epico to Smartsheet

• **2026-04-21 at 15:10** — Meeting date and time

• **Phase Two** — Timeline designation for safety data migration (characterized as quick win despite later phase)

## Risks & Dependencies

• **Data Security Risk:** Current ad-hoc approach to sensitive data transfer (email) is inadequate; requires structured secure transfer mechanism before Epico export can be shared

• **Server Infrastructure Complexity:** Extensive redundant server infrastructure creates security and management risks; "a lot of freaking servers" with unclear dependencies preventing decommissioning

• **Data Quality Blocker:** Data currently in wrong locations across processing, architectural, and engineering categories; blocking progress on 39 remaining tasks

• **Access Dependencies:** Multiple access requirements blocking progress:
  - OneDrive access needed for data sharing
  - Server access needed for LiteLLM deployment and infrastructure assessment
  - Microsoft Teams account needed for collaboration
  - Tailscale installation needed for secure server access

• **Knowledge Retention Risk:** Consultant acknowledged with "if I get hit by a bus" scenario — comprehensive documentation intended to mitigate this risk

• **AI Usage Visibility:** Once LiteLLM deployed, all prompts visible to administrators — potential privacy/sensitivity concern for users who may not realize this

• **Phased Rollout Dependency:** LiteLLM broad deployment depends on successful testing with Paul and client first; IT team coordination required before organization-wide rollout

• **Cloud vs. On-Premise Tension:** Client maintains extensive on-premise infrastructure while also using cloud services (ERP, Spectrum, Smartsheet); potential inefficiency and cost implications

## Follow-Up Questions

• What are the other two items (beyond spectrum data integration) that "need to figure out"? Only one of three was specified.

• What is the "command line problem" that Paul is now thinking about?

• What do "get called" and "emigration" references mean in the context of the team encouragement?

• What is "Apple" in the context of daily dumps to Smartsheet? (Assumed to be Epico but not confirmed)

• Which specific physical servers should have Tailscale installed for optimal access?

• What is the current monthly cost of AI tool usage across the organization?

• How many users would be included in the initial Claude Business account?

• What is the timeline for server infrastructure cleanup/consolidation?

• Are there specific compliance or regulatory requirements affecting data transfer methods?

• What permissions/access levels should the consultant have in Microsoft Teams?

• What is the current server maintenance and management workload for the IT team?

## Next Steps

**Immediate priorities** focus on establishing foundational access and security infrastructure. The client needs to create a Microsoft Teams account for the consultant within approximately one day to enable proper collaboration and content sharing. Simultaneously, the client should provide the Epico export data through a secure mechanism (not email) — this is critical as it will unblock approximately 90% of data requirements and enable progress on the 39 remaining tasks.

**Infrastructure setup** follows once access is established. The client IT team should install Tailscale on the physical server(s) to create a secure tunnel for the consultant to assess the current infrastructure and provide recommendations on consolidating the extensive redundant server environment. The consultant will then conduct a comprehensive server assessment and provide guidance on reducing complexity while improving security and manageability.

**AI governance implementation** represents the medium-term priority. The client should establish a Claude Business account (minimum 5 users at $20/person/month) with centralized key management. Once server access is available, the consultant will deploy the LiteLLM gateway in a non-intrusive manner, with Paul and the client serving as initial test users. After successful testing and IT team coordination, the system can be rolled out organization-wide to provide cost transparency, usage analytics, risk management, and appropriate model selection by team.

**Documentation and process refinement** continues in parallel. The consultant will reorganize the existing 39 tasks according to the agreed menu hierarchy structure, creating clear correlation between documentation, tasks, and actual system pages. The JWN project folder will be shared with the client and eventually migrated to the client's server environment. The consultant will also create the prioritized instruction list for cleaning up data currently in wrong locations across processing, architectural, and engineering categories.

**Long-term workflow optimization** will be addressed once the core system is functional. The automated feature request process (via Teams or embedded system form) will be tested collaboratively to ensure proper integration between user requests, task creation, and development workflow. This will establish the sustainable maintenance model with full traceability from initial request through Git commits and deployment.

## Action Items
- [ ] **Provide Epico export data** (Client)
  Provide daily dump from Apple/Epico to Smartsheet. This export will provide approximately 90% of required data and unblock progress on 39 remaining tasks.
- [ ] **Establish secure data transfer mechanism**
  Set up structured, secure method for transferring sensitive Epico export data. Email transmission is not acceptable due to security concerns. Need to determine and implement appropriate secure transfer protocol.
- [ ] **Create prioritized instruction list for data cleanup** (Consultant)
  Create prioritized instructions for reorganizing data currently in wrong locations across processing, architectural, and engineering categories. This is blocking progress on multiple tasks.
- [ ] **Create Microsoft Teams account for consultant** (Client admin) — due Within 1 day
  Create user account in Microsoft Teams for consultant to enable collaboration and content sharing. Microsoft Teams is the client's primary chat application (not Slack). Estimated cost approximately $10/month if paid tier.
- [ ] **Install Tailscale on physical server(s)** (Client IT team)
  Install Tailscale application on physical server(s) (such as 192.168.2.2 or 192.168.2.1) to create secure tunnel for consultant access. Must be installed on actual server machines, not laptops. This enables consultant to assess infrastructure and provide recommendations.
- [ ] **Provide OneDrive access to consultant** (Client)
  Grant consultant access to OneDrive to enable data sharing and collaboration. This was previously blocked and needs to be resolved.
- [ ] **Share JWN project folder documentation with client** (Consultant)
  Provide client access to JWN project folder containing all building, planning, and system documentation including decisions, data models, system architecture, and build specifications. This enables client to understand and potentially replicate the entire system.
- [ ] **Migrate project documentation to client server** (Consultant)
  Move JWN project folder documentation from consultant's local storage to client's server environment for long-term access and security.
- [ ] **Reorganize project tasks by menu hierarchy** (Consultant)
  Clean up and reorganize the 39 remaining tasks in project board according to agreed menu hierarchy structure. Each menu category becomes a folder, each subcategory becomes a page. Provide clear correlation between documentation, tasks, and actual system pages.
- [ ] **Deploy LiteLLM gateway on client server** (Consultant) — due After Tailscale access established
  Install and configure LiteLLM gateway as non-intrusive deployment that won't disrupt business operations. Provides centralized logging of all AI prompts and usage. Requires server access via Tailscale to be established first.
- [ ] **Set up Claude Business account** (Client) — due Before LiteLLM deployment
  Establish single Claude Business account with centralized key management (not individual user accounts). Cost: $20/person/month, minimum 5 users. Account will be managed through LiteLLM with no individual users receiving API keys.
- [ ] **Configure LiteLLM integration with Claude Business** (Consultant) — due After Claude Business account setup
  Set up integration between LiteLLM gateway and Claude Business account. All access managed through browser with LiteLLM handling backend. Enables cost transparency, usage analytics, risk management, and model selection by team/role.
- [ ] **Test LiteLLM with initial users** (Paul, Client) — due After LiteLLM deployment
  Conduct phased testing with Paul and client as initial guinea pigs. Verify that prompts are visible in logs and system functions correctly before broad deployment. Users should be aware that all prompts will be visible to administrators.
- [ ] **Coordinate LiteLLM rollout with IT team** (Client IT team) — due Before broad deployment
  Work with client IT team to determine infrastructure changes needed to force organization-wide traffic through LiteLLM gateway after successful testing. Plan phased rollout approach.
- [ ] **Conduct server infrastructure assessment** (Consultant) — due After Tailscale access established
  After Tailscale access is established, perform comprehensive assessment of client's server infrastructure. Provide recommendations on consolidating extensive redundant server environment. Client has significant redundancy identified as a security and management concern.
- [ ] **Review and consolidate redundant server infrastructure** (Client IT team)
  Address redundant servers across infrastructure (described as 'a lot of freaking servers'). Follow consultant recommendations from infrastructure assessment to improve security and reduce management burden. Determine safe decommissioning process for unused servers.
- [ ] **Determine remaining two outstanding technical requirements**
  Clarify the two unspecified technical requirements mentioned in discussion. Only spectrum data integration into jobs was clearly identified as one of three outstanding items.
