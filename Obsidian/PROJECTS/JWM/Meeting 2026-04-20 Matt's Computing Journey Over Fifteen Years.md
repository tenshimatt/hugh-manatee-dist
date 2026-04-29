# Matt's Computing Journey Over Fifteen Years

**Date:** 2026-04-20

## Summary
# Executive Summary

On April 20, 2026, Chris hosted a demonstration meeting with Matt (a software engineer and longtime friend with expertise in coding and AI) to present a custom-built ERP replacement system developed over a single weekend. The solution aims to replace Epicor, Spectrum, and SmartSheets at zero cost, running on JWM's own servers with full data sovereignty. Matt demonstrated a comprehensive command center/dashboard built from JWM's documentation and website data, featuring AI-powered voice interaction, real-time shop floor management, efficiency tracking, and integrated inventory management. The system is built on open-source Frappe ERP with a custom front-end interface, biometric authentication, and an AI gateway for data security. The team expressed strong enthusiasm for the solution's potential to streamline operations across both architectural and processing divisions, with plans to prioritize shop scheduling and efficiency features before expanding to inventory and other modules.

## Key Discussion Points

• **Personal Background & Relationship Context**
- Chris and Matt have known each other for approximately 15 years, meeting through their dogs/wives
- Matt previously built a successful forex trading algorithm that continues to run and generate profit
- Matt's day job involves enterprise AI implementation with focus on organizational AI safety and governance

• **Project Genesis & Timeline**
- Following a Friday meeting, Chris contacted Matt about hosting solutions
- Within 4 hours, Matt proposed an alternative comprehensive solution
- Over the weekend (approximately 48 hours), Matt built a functional demo while Chris provided data
- System was built from documentation Chris provided plus data scraped from JWM's website

• **Core Technology Architecture**
- Solution combines three components: (1) Frappe ERP/Next ERP as backend database/source of truth, (2) integrated accounting to replace Spectrum, (3) custom dashboard interface to replace SmartSheets
- Built on open-source foundation, legally free to extend and customize
- Designed for maximum competitive advantage and rapid customization capability
- All data hosted on JWM's own servers (currently on Matt's personal server as proof-of-concept)
- System architecture supports running multiple active-active instances across locations for high availability

• **Security & Authentication Features**
- Passwordless biometric authentication (fingerprints, facial recognition, selfies)
- Multiple security layers protecting access
- AI Gateway built-in to prevent data leakage and ensure compliance
- All AI prompts filtered through gateway that strips personal/financial information and blocks unauthorized requests
- Complete audit trail of all AI interactions with cost tracking (approximately $0.002 per call)
- Data sovereignty emphasized as critical competitive advantage

• **AI Integration & Capabilities**
- Voice-activated system allowing users to speak queries and receive audio responses
- AI chatbot provides recommendations based on real-time ERP data, updated hourly or daily
- Prompts built from actual organizational data, not generic internet information
- Multiple AI models available (OpenAI/ChatGPT, Anthropic/Claude, local models)
- Different teams can be assigned specific AI models optimized for their workflows
- System can perform automated image analysis for quality control and anomaly detection
- Multi-language support with automatic translation capabilities
- AI can analyze historical data for trends, anomalies, profitability insights

• **User Interface & Experience**
- Custom command center/dashboard styled with JWM branding and colors
- Real-time indicators showing which pages are integrated with live ERP data vs. local data
- Hyperlinked elements allowing drill-down into detailed information
- Drag-and-drop functionality for work order management
- Filters for switching between A-shop and T-shop, project managers, severity types
- Multiple view options (card view with drag-and-drop, grid view)
- Recommended deployment on iPads for maximum screen real estate and touch/audio input

• **Shop Floor Management Features**
- Real-time dashboard showing active work orders across both divisions
- Anomaly detection and issue identification with ability to create work orders directly
- Scheduler displaying all assembly lines/processes with visual timeline
- Drag-and-drop scheduling capability
- Filters for identifying late/behind-schedule work
- Work station-specific views (flat laser, etc.) showing 6+ jobs per station
- Operators can click start/stop on jobs, mark completion, or deviate to different stations
- Deviation workflow allows sending to finishing, quality inspection, or other processes without "lying to the system"
- Photo upload capability for documentation and automated quality analysis

• **Efficiency & Performance Tracking**
- Comprehensive efficiency snapshot across all production lines
- Drill-down capability by operation, operator, shop, workstation
- Comparison of estimates vs. actuals for all jobs
- Efficiency event logging with AI-powered naming suggestions
- Parts history tracking
- Scrap tracking and documentation
- Downtime and inefficiency tracking capabilities

• **Route Management & Process Flow**
- Visual route builder showing manufacturing process steps
- Ability to skip steps or repeat processes (e.g., send back to machining after polishing)
- Configurable routes with drag-and-drop reordering
- Architectural division: routes determined by job requirements
- Processing division: estimates based on predetermined routes
- System can auto-populate routes from estimate data when available

• **Estimating & Work Order Generation**
- Document upload capability for estimates
- AI agents analyze uploaded documents and extract bill of materials automatically
- System populates work orders from estimate data
- Work orders can be released directly to shop floor or through engineering
- Repeat jobs can be automated with "human in the loop" approval process
- Monthly recurring jobs can auto-schedule with one-click approval or full automation

• **Data Integration & Historical Records**
- Real customer data from Chris's files already loaded in demo
- System can import all historical digital records (entire company history where digitally captured)
- No storage limitations due to modern technology cost improvements
- Algorithms can analyze historical data for trends, anomalies, profitability patterns
- Integration with existing systems like Panel Tracker (free CNC software with barcodes)

• **Inventory Management**
- Native ERP inventory module as core functionality
- Real-time stock checking
- Finished goods tracking
- Multi-level assembly tracking (20+ parts per assembly)
- Automatic inventory deduction when top-level assembly claimed
- Material cost tracking (e.g., sheet costs, square footage calculations)
- Cost calculation for panels and remakes

• **Forecasting & Planning Capabilities**
- "What-if" scenario planning for large jobs being quoted
- Impact analysis on schedule and capacity
- Predictive analytics for resource planning

• **Quality Control & Documentation**
- Quality control module planned (not yet built in demo)
- Photo documentation with automatic tagging and analysis
- Audit history of all quality events
- System learns expected appearance and identifies anomalies
- Deviation tracking from standard processes

• **Additional Modules Identified**
- Safety management (planned, not built)
- Maintenance tracking (planned, not built)
- Fleet management (inputs received, to be built)
- Shipping dashboard (1000+ jobs loaded, needs classification refinement)
- Leads/CRM (customer data loaded, interface not complete)

• **Development & Iteration Process**
- Changes can be implemented in 1-2 hours, not weeks/months
- Screen mockups created in meetings, automatically logged as tasks
- Tasks auto-generated and pushed to production build rapidly
- Team can draw over screens or verbally describe changes in meetings
- "If you can explain it in words, we can build it in hours"

• **Infrastructure & Deployment Considerations**
- Current demo hosted on Matt's personal server
- Can be moved to JWM's existing server infrastructure (needs assessment)
- JWM has significant server capacity (multiple terabytes, primarily for camera systems)
- Recommendation to install AI GPU card for local AI processing (one-time cost, then free forever)
- Starlink backup option for remote locations to maintain operations during connectivity issues
- Split system capability with batch uploads for offline operation

• **Cost & Budget Impact**
- Zero cost solution (eliminates Epicor, Spectrum, and SmartSheets expenses)
- All three software budgets return to JWM for other uses
- AI processing costs approximately $0.002 per call
- Only hardware cost would be AI GPU card for local processing
- Open-source foundation means no licensing fees

• **Team Feedback & Enthusiasm**
- Strong positive reception from JWM team
- Recognition that system addresses needs not met by out-of-box software
- Excitement about voice-activated assistance for operators and PMs
- Appreciation for "not lying to the system" deviation workflow
- Acknowledgment that solution combines everything they were trying to build separately

• **Implementation Strategy Discussion**
- Agreement to "put it in a box" and phase implementation
- Priority: Shop scheduling, efficiencies, and core operational features first for both architectural and processing divisions
- Inventory management identified as key to initial phase
- Emphasis on keeping data input simple
- Recognition of rapid learning curve about AI integration over past 5 days
- Need to assess existing server infrastructure before deployment

## Decisions Made

• **Decision to proceed with Matt's custom ERP solution** - Made implicitly by Chris and team based on enthusiastic reception and alignment with needs. No formal approval vote recorded, but clear consensus to move forward with phased implementation.

• **Prioritization of features: Shop floor operations first, then expand** - Made collaboratively by Chris and team. Shop scheduling, efficiency tracking, and inventory management to be implemented before safety, maintenance, fleet, and other modules.

• **Data input approach: Keep it simple** - Agreed by Chris and team to ensure user adoption and practical implementation on shop floor.

• **Deployment platform: iPads for shop floor** - Recommended by Matt, accepted by team for screen size, touch interface, photo capability, and audio input.

• **Human-in-the-loop for automated recurring jobs** - Agreed approach to balance automation with oversight, particularly when drawings may have changed.

• **Use of AI Gateway for security/compliance** - Matt's recommendation, implicitly accepted as part of solution architecture.

• **Data sovereignty approach: On-premise hosting** - Agreed principle that JWM will host on own servers rather than external cloud.

## Action Items

| # | Action | Owner | Due | Priority |
|---|--------|-------|-----|----------|
| 1 | Assess JWM's existing server infrastructure for capacity and AI GPU compatibility | Matt / Chris | Not specified | High |
| 2 | Build out grid view drag-and-drop functionality (currently only in card view) | Matt | Not specified | Medium |
| 3 | Recalibrate workstation display to show more job cards per section (similar to scheduler view) | Matt | Not specified | High |
| 4 | Add filtering logic to scheduler to prioritize jobs (by time to completion, financials, or other variables to be determined) | Matt | Not specified | High |
| 5 | Build auto-balancing workload algorithm for shop scheduling | Matt | Not specified | Medium |
| 6 | Implement ability to auto-populate routes from estimate data when available | Matt | Not specified | High |
| 7 | Build estimating module interface (AI extraction already functional) | Matt | Not specified | Medium |
| 8 | Develop repeat job automation with human-in-the-loop approval workflow | Matt | Not specified | Medium |
| 9 | Implement deviation workflow allowing operators to hand off to next station or redirect (finishing, quality, etc.) | Matt | Not specified | High |
| 10 | Build out quality control module interface | Matt | Not specified | Medium |
| 11 | Develop safety management module | Matt | Not specified | Low |
| 12 | Build maintenance tracking module | Matt | Not specified | Low |
| 13 | Complete fleet management module using inputs received | Matt | Not specified | Low |
| 14 | Refine shipping dashboard classification for 1000+ loaded jobs | Matt | Not specified | Medium |
| 15 | Complete leads/CRM interface (data already loaded) | Matt | Not specified | Low |
| 16 | Integrate Panel Tracker barcode scanning functionality into ERP | Matt | Not specified | Medium |
| 17 | Build inventory cost tracking for sheets and square footage calculations | Matt | Not specified | High |
| 18 | Implement forecasting and "what-if" scenario planning for capacity analysis | Matt | Not specified | Medium |
| 19 | Fix bugs in efficiency events logging interface | Matt | Not specified | Medium |
| 20 | True up/clean loaded data (1000 jobs need proper classification) | Matt / Chris | Not specified | High |
| 21 | Determine and implement scheduling prioritization logic with team input | Chris / Matt | Not specified | High |
| 22 | Investigate AI GPU card options and costs for local AI processing | Matt | Not specified | Medium |
| 23 | Plan phased rollout starting with shop floor operations for both divisions | Chris | Not specified | High |
| 24 | Schedule follow-up meeting to review server infrastructure | Chris / Matt | Not specified | High |
| 25 | Compile complete list of next features based on demo feedback | Chris / Matt | Immediately after meeting | High |

## People & Organisations Mentioned

• **Chris** - Meeting host, JWM senior executive, primary liaison with Matt, has been providing data and documentation for system build

• **Matt** - Software engineer, AI specialist, system architect and developer; longtime friend of Chris (15 years); expertise in coding, forex trading algorithms, enterprise AI; currently building solution for Australian government; owns company providing organizational AI services; built entire demo system over one weekend

• **Drew** - JWM team member, built the original scheduling system for T-shop and A-shop that Matt's demo is based on

• **John** - JWM team member, participated in meeting, asked questions about organizational-wide AI capabilities

• **Project Managers (unnamed)** - Multiple PMs referenced in architectural division who manage different projects; demo shows individual PM dashboards

• **Operators** - Shop floor workers who would use iPad interfaces at workstations like flat laser

• **Frappe/Next ERP** - Open-source ERP platform provider, offers free core product with paid services (JWM would not use paid services)

• **Epicor** - Current ERP system to be replaced

• **Spectrum** - Current accounting system to be replaced

• **SmartSheets** - Current project management/tracking system to be replaced

• **Panel Tracker** - Free software provided with CNC machines for ACM product tracking using barcodes; experiencing functionality issues

• **OpenAI/ChatGPT** - AI model provider, one of several integrated into system

• **Anthropic/Claude** - AI model provider, alternative to ChatGPT

• **Australian Government** - Current client of Matt's for AI screening solution

• **Nissan** - Customer referenced in demo data showing active project

## Key Figures & Data

• **15 years** - Length of friendship between Chris and Matt

• **10 years** - Initial estimate of friendship length (corrected to 15)

• **4 hours** - Time it took Matt to develop initial solution concept after Friday meeting

• **1 weekend** - Total development time for functional demo system

• **Zero cost** - Total cost of proposed solution (eliminates three software expenses)

• **3 systems replaced** - Epicor, Spectrum, and SmartSheets

• **$0.002 (0.2 cents)** - Approximate cost per AI prompt/call

• **2 instances minimum** - Recommended number of active-active server instances for high availability (can run 3)

• **1-2 hours** - Typical turnaround time for implementing requested changes

• **6+ jobs** - Number of jobs displayed per workstation on shop floor interface

• **20+ parts** - Example of parts in a single assembly for inventory tracking

• **1,000+ jobs** - Number of jobs loaded in shipping dashboard requiring classification

• **24/7** - Potential operating schedule for automated repetitive jobs

• **Multiple terabytes** - Storage capacity of JWM's existing server infrastructure

• **80+ years** - Total company history (digital records would be subset of this)

• **Recording date** - April 20, 2026

• **Recording time** - 13:33

• **Meeting duration** - Approximately 45 minutes (15 minutes remaining noted near end)

## Risks & Dependencies

• **Server Infrastructure Assessment Required** - JWM's existing server capacity and compatibility with AI GPU needs evaluation before deployment; Chris acknowledged server is "a mess" and they "spend a lot of money on it"

• **Data Quality & Classification** - 1,000+ jobs in system need proper classification; demo data needs to be "trued up" before production use

• **Phased Implementation Complexity** - Risk of scope creep; team emphasized need to "put it in a box" and implement core features first before expanding

• **User Adoption Dependency** - Success depends on keeping data input simple enough for shop floor workers to use consistently

• **Connectivity Dependency** - Shop floor operations could be disrupted by network outages (mitigated by proposed Starlink backup and split-system architecture)

• **Change Management** - Replacing three established systems (Epicor, Spectrum, SmartSheets) represents significant organizational change

• **Panel Tracker Integration** - Existing CNC barcode system experiencing difficulties; integration complexity unknown

• **Historical Data Migration** - Scope and quality of historical digital records to be imported not yet assessed

• **AI Model Selection** - Need to determine optimal AI models for

## Action Items
- [ ] **Assess JWM server infrastructure for ERP deployment** (Matt)
  Evaluate existing server capacity, compatibility with AI GPU installation, and current configuration. Chris noted servers are 'a mess' with significant spend; need to determine if infrastructure can support new ERP system and AI processing.
- [ ] **Build grid view drag-and-drop functionality** (Matt)
  Currently only card view supports drag-and-drop. Need to implement same functionality in grid view for work order management.
- [ ] **Recalibrate workstation display for more job cards** (Matt)
  Increase number of job cards visible per workstation section (flat laser example). Need to match scheduler view density and add filtering for easier navigation.
- [ ] **Add scheduling prioritization logic to scheduler** (Matt)
  Implement filters and logic to prioritize jobs by time to completion, financials, or other variables. Determine with team what variables should drive prioritization.
- [ ] **Build auto-balancing workload algorithm** (Matt)
  Create algorithm to programmatically balance workload across all shop stations based on priorities and capacity.
- [ ] **Implement auto-populate routes from estimate data** (Matt)
  When estimate documents are uploaded and processed, automatically populate manufacturing routes from extracted bill of materials data.
- [ ] **Build estimating module interface** (Matt)
  Create interface for estimating module. AI extraction functionality already works; need to build the UI for document upload and work order creation.
- [ ] **Develop repeat job automation with human-in-the-loop approval** (Matt)
  Build workflow for monthly or recurring jobs that auto-schedules and sends to applicable person for one-click approval, with option for full automation if drawings haven't changed.
- [ ] **Implement deviation workflow for shop floor operations** (Matt)
  Enable operators to complete jobs with deviations (send to finishing, quality inspection, or other processes) without 'lying to the system'. Deviations should create work orders/tickets for next station.
- [ ] **Build quality control module interface** (Matt)
  Create QC module for photo documentation with automatic tagging and analysis. System should learn expected appearance and identify anomalies.
- [ ] **Develop safety management module** (Matt)
  Plan and build safety management features for shop floor tracking and compliance.
- [ ] **Build maintenance tracking module** (Matt)
  Create module to track equipment maintenance across shop floor and operations.
- [ ] **Complete fleet management module** (Matt)
  Build fleet management features using inputs already received from team.
- [ ] **Refine shipping dashboard job classification** (Matt)
  Properly classify 1000+ loaded jobs currently in shipping dashboard. Demo data needs accurate categorization before production use.
- [ ] **Complete leads/CRM interface** (Matt)
  Finish building leads and CRM interface. Customer data already loaded in ERP; need to complete the interface for interaction.
- [ ] **Integrate Panel Tracker barcode scanning** (Matt)
  Extend system to integrate barcode scanners from Panel Tracker (free CNC software). Scanners should feed data into ERP and become part of production process workflow.
- [ ] **Build inventory cost tracking for materials** (Matt)
  Implement cost tracking for sheet materials and square footage calculations. Support multi-level assembly tracking (20+ parts per assembly) and automatic inventory deduction when top-level assembly is claimed.
- [ ] **Implement forecasting and what-if scenario planning** (Matt)
  Build capability to run 'what-if' scenarios for large quoted jobs showing impact on schedule and capacity. Include predictive analytics for resource planning.
- [ ] **Fix bugs in efficiency events logging interface** (Matt)
  Resolve existing bugs in efficiency event logging UI. AI suggestion feature for naming events needs troubleshooting.
- [ ] **Clean and classify loaded demo data** (Matt)
  True up and properly classify 1000+ jobs currently in system. Demo data needs quality verification and accurate categorization before production deployment.
- [ ] **Determine scheduling prioritization logic with team** (Chris)
  Meet with Chris and shop floor team to define specific variables and business rules that should drive job scheduling prioritization (time to completion, profitability, customer priority, etc.).
- [ ] **Research and evaluate AI GPU card options** (Matt)
  Investigate AI GPU card options for local on-premise AI processing. Determine cost, compatibility with JWM servers, and performance specifications.
- [ ] **Plan phased rollout implementation** (Chris)
  Define detailed phased implementation plan starting with shop floor operations (scheduling, efficiencies, inventory) for both architectural and processing divisions before expanding to other modules.
- [ ] **Schedule follow-up server infrastructure assessment meeting** (Chris)
  Arrange meeting with Matt to physically assess JWM's server infrastructure, evaluate capacity for ERP deployment, and discuss AI GPU installation requirements.
- [ ] **Compile complete feature request list from demo feedback** (Chris) — due immediately after meeting
  Document all additional features, modifications, and requirements identified during demo meeting and team feedback. Create prioritized backlog for Matt to work on.
