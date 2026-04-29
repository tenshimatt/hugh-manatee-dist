---
title: "Matt the Computer Wizard Through the Years"
date: 2026-04-20
time: 13:33
duration_mins: 46
tags:
  - voice-note
  - plaud
  - jwm
  - ai-safety
  - automagic
source: plaud
project_folder: "JWM"
---

# Matt the Computer Wizard Through the Years

**Date:** 2026-04-20
**Time:** 13:33
**Duration:** 46 minutes
**Pipeline:** Whisper large-v3 → Claude Sonnet 4.5
**Classification:** This recording is primarily about a custom ERP replacement system demonstration for JWM (featuring Chris Ball and discussion of Epicor), with substantial discussion of AI safety features (AI Gateway, data security) and automation capabilities, making it clearly a JWM project conversation with relevant secondary technical topics.

---

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

---

<details>
<summary>Raw Transcript</summary>

engineering engineer not a manufacturing engineer sorry um and obviously we know and matt is a wizard in computers um i think i've told individually maybe not you but matt and me go back um just what's it like 10 15 years now maybe 10 years no longer than that i've been here so it must be 15 years yeah we became friends through our lives um and did a overnight trip together and got to know each other really well and stayed in touch over the years but matt's always coding this or doing this or building that one of the things he felt for the uh forex trading algorithm algorithm that trades forex while you sleep um it hedges bets and it made a lot of money i didn't have the balls to let it run so i failed um it's still running by the way that's a good sign yeah and still making money i'm sure um so after our meeting on friday and i'm going to try to make this short so we can get into the meeting potatoes um i called matt like we spoke about two times about um how we host what we're going to do and he was like chris you're going to host what we're going to do and i'm going to host what we're going to do and he was like chris you're going to host what we're going to do and he was like chris is kind of um serendipitous of the conversation but i think i have a better solution for you and this whole weekend well in fact within like four hours he'd really got a better solution for us um and then this weekend me and him have spent building and i said we spent i've just been throwing data at him and he's been doing something with it um and so he's going to demo what i think is going to be the erp replacement that we are going to go with um and i think he's going to replace spectrum as well long term so he runs spectrum smartsheets entirely and epicore which would free up um a lot of funds to other things so without further ado i don't know if you want to add anything before we start showing it man maybe two quick things one we actually met through our dogs because our dogs were friends and hence the wives were friends so that's some it's a little bit of fun fact yeah and then I guess on the software side we are able to actually replace all of epic or spectrum and smart sheet from a financial point of view so all three would go back into your budget it's as a zero cost the solution that we're looking at is a combination of custom code which we are now comfortably and safely able to do what you've seen now has been bought pretty rapidly and everything can run on your own servers so data sovereignty big word but going forward with the advent of all the new technologies that are coming out that's a very important thing so it's been architected from the ground up to maximize your competitive advantage in the market that is the number one tenants the software as a service history that we will come from was a very good safety net and then of course we would extend but I think we've all lived and breathed the challenges of customizing or tailoring other people's solutions and I think it lands up becoming more complex so on that note let's have a look and see yeah thanks for starting the recording Chris I'll share my screen now that's all good that's all good great oh and you have a Blue screen that looks a lot better than my face all right focus on the blue screen okay so everything that you see today has been built from the documentation that Chris provided and a few conversations we do have as mentioned quite a lot of latitude that say to go off and get the data from your actual website and then the data that Chris has sent so all of this is a very good service and then of course we are going to see quite a lot of is secure and private and it's got very specific security that chris would have seen as well to log in and authenticate you cannot just jump into this site from anywhere it's behind a number of security layers so i have to say that because that is the number one thing before we get into any functionality so on that note we've built what i would call a command center or a dashboard which ultimately is the entire front end or the system that you would see and use every day behind that sits a new potential erp solution that you could look at it goes by the name of frappe erp or next erp and the way that that works is it's a vanilla flavored out the box open source which means that it is free for us legally and genuinely to take as it is and then extend the reason that they offer it like that is that they're able to then extend or offer services that they get money for in our case we'd be doing that so the ERP is think of it as a big dashboard sorry a database that sits in the back end it has all the screens but it's ultimately the source of truth for everything that you're going to see now the second thing would be the accounting and spectrum again as in whenever that that you would like to look at introducing a replacement for that it is built directly and integrated into the ERP so I'll show you that in a second and then the third tenant would be what we're going to see today that would ultimately replace the smartsheets solution or any other visual screens and interfaces that anyone in the business would would be able to use it's been designed to maximize use of the AI technologies it can also be an is voice activated so you can talk to the system and it can provide you with information back it's not boilerplate stuff it's a system that can provide you with information back it's not boilerplate stuff from the internet it is every prompt is actually built based on the data that you have in the business and then we'll give you real answers so it's it's not a generic type of tool this is as deep as you can get into the data of your organization so I'll start off with a slightly boring part which is over here and this is the ERP this will not look particularly pretty but hopefully what you see here above everything is on the left hand side these are the dash board welcome screen we log it apologies can you see it now yeah great sorry too many windows okay so this is the ERP it does come vanilla flavored which is simply black and whites and what we've done so far over the weekend is to tailor it to look a feel a bit more like the JWM colours and then on top of that we've added some of the data we're giving to the system so it's a data that chris provided so one quick example would be in the crm if we go to the customers we have a number of customers that we've loaded and of course you can draw into each one and all the relevant data would be there the thing i'm showing you here is just to evidence that we're able to pull the data in quite rapidly and you will see this data physically shown in the new the tool that we're going to present so on that note i'm going to switch directly to the other one please let me know if it when it comes up hopefully it's up now okay great so um one quick thing before we start i absolutely love the epcot building so whoever did that that is an absolute feat of engineering brilliance so uh thank you in advance for that as part of the work we did we queried your websites and we pulled some of the information just to make it feel a bit more user-friendly for your people this blue box up here uses specific integration or security that is passwordless so there would be no passwords in your organization going forward the way that people would log in would be with biometrics fingerprints or your eyes a selfie like you have on your mobile phone so just to to show you that we're going to click on this one which for the demo purposes and this is where we land to give you a walk through the layout we start off with the user profile so we've picked on chris because we had his picture we have also then introduced an ai chatbot which you can see on the right hand side and the data that is provided is specifically enriched on a daily or hourly basis depending on how we schedule it to look at the data that's in the data in the system in the erp and provide the most likely recommended things that you would like to talk to or query so over here if i click on that one hopefully you will hear some audio popping up in a in a few seconds this is doing a real live call analyzing the data in the erp and when it responds it comes back with what you see up there here's where things stand across both divisions right now active work orders by division a shop wap highlights wo 226 okay so again all customizable we can remove the audio but it shows that in the fullness of time we can remove the audio but it shows that in the fullness of time we can remove the audio but it shows that in the fullness of time we can remove the audio but it shows that in the fullness of time we will be interacting with the systems using voice more than we would be typing main reason is that we can convey our thoughts more clearly using audio and it's much quicker to use audio than text you can then drill into any of the details here and their hyperlinks that take you to the relevant pages so i'll get that out the way for now and but thank you john for your assistance then we move to the left hand side and this is the main menu and everything that you see in here is that you see in here is what chris has recommended that we put in in terms of the the demo and day one starting point we start off with the the dashboard that your team would land on and it would give you a snapshot overview of all the operations that are going on in the business the most important one here is arguably the anomalies or any issues that have been identified you can then click directly into that for example and see what the nature of that topic is and if if you wanted to you could create a main subject work order for this particular item that would then be sent off to the floor and someone pick up that task and get it actioned if there are any questions at any point please feel free just just go for it I'm happy to stop and start as we go okay so on the executive side we split it into architecture and processing this is real data that Chris provided it does need to be what's the right word some of it is all the data so we need to just true it up but ultimately this is reading from the ERP system that I mentioned before if we look to the top right hand corner you'll see I've left that in at the moment just to evidence which pages in the demo are integrated with the ERP and which ones are using data that's held locally we did move quite quickly in one weekend see yeah any questions so far though it's Chris you're welcome are we are we on track okay good from here all of the different items that you see are of course clickable and some of them aren't ready yet because it's the demo but phase two will will bring that to light as we go and again just to highlight architecture and processing I've got different dashboards and they will obviously speak to different topics and different metrics everything that you see here can be tailored and customized very rapidly as to your needs and you can see that there's a lot of different things that you can do here if we do get into a project we would start with the screens up and we would literally draw over or talk in a meeting and explain what you wanted to change all of the changes get automatically logged into a system that I've built it creates tasks for them and then the tasks are automatically worked on and generated and then pushed into the new production build for you to actually then go and have a look at so it's the the iteration process is very very quick and let's call it in an hour or two you can normally see the actual updates that you mean that you've requested so there's no weeks and months delay for development you're talking tens of minutes or maybe an hour or two all right let me try go a bit quicker so under architectural we haven't built all of this out yet but we do start off with the different project managers hopefully those look familiar we can pick any of them and each project manager will get a snapshot overview of all the projects that they have in progress as well as the statuses the requirements etc which they can then drill into and keep drilling in as you go so as much data as we have and however you would like to see it we can we can tailor the system accordingly for that okay and I think yeah because these guys I mean as I said to you before they care about the shop and engineering so let's jump down there right so we did have a bit more update we'll skip this Chris mentioned it's an engineering the snap shot or overview shows us the key items the pipeline we have built so far and this again looks hopefully a lot like what you already have today the difference of course is that it's just a little bit you know it's actually referencing the ERP wherever we have we've added in filters so you can switch between the a shop and tea shop and then you can switch between all the p.m. and then the different severity types as well so they will always switch based on that they're all in the low the low category at the moment and again different views depending on how you'd like to see the data each of these will also give you all the sub information that you can draw into and you'll be able to modify that as well as you go and you can click and drag these as well yes same way we do yeah okay about all the grip on the grid view on the grid view is that something that we can drag those also or is that just on the card it's just on the cards at the moment but we can work away to do that as well absolutely I'll take a note of that to show you the next time great back to the overview and as you can see the the cues are coming in phase two but the routes we thought were quite important and over here this is a little bit above my pay grade this is the specialty that you guys do but in this particular instance you're able to skip or move between the different processes if you have to repeat something so for example if something was machined and there was an issue with it you could send it for polishing or finishing and then pass it back to that particular set of the process these are configurable as well so you can you can drag them around and you'll see that the the order changes and of course just save and then would do that so again this would need to be built into the actual on the shop and engineering floor but in terms of the look and feel we're able to do that in the actual on the shop and engineering floor but in terms of the look and feel we're able to do that in the actual on the shop and work items accordingly so what I'm used to now is the estimate dictates the route and knowing we can drag and drop from the estimate there and that can if the data for the rocks in there you can automatically populate okay that's where I was headed to because I found the architectural stuff we determine the route based on the job but on the processing side they estimate based on the route so yeah you can't read the estimate up when we drag and drop it in they just say yes that's right and the other cool thing and I'm gonna jump sorry Matt it's been the guys are doing in the shop and it is a requirement when he when he clicks next to send it to finishing you can do that right then but I'm sure metal so you know awesome so you change the rock two seconds I drag a file in here and then of course this would need to be basic with real data but whatever you drag in there there's a bunch of workflows and age AI agents that look at the data that you've dropped in the document and it will strip it out into the different bill of materials you can then and I appreciate this isn't your specific area but you can create a work order from there and then release it to the shop floor accordingly and that would probably be released to engineering but yeah so what our estimate we would just drop in here the completed estimate and it would take the data and then fill out the work orders and everything that's it okay yeah I mean we can build the estimating stuff yeah but yeah from the now it would be drop that is committed to a little bit of awesome well what about repeatability if I have the same uh if I have the same thing running once a month from process the route's good the drawings are done it's ready to go as soon as they release it and can go straight to the shop without dropping through engineering is that built in or is that something we can look at not only can we look at it we've already we haven't built it yet but the thinking was that they would be what they call human in the loop so we would have a work phone and um approval process where it would automatically schedule every month for every time period that you wanted it it'll be sent to the applicable person who would one click to approve it and that to your point if you'd like it automated we would just set the job to to automatically run that through I know this sounds a bit crazy but if you can explain it in words we can build it in hours I it's as crazy for me as maybe as it is for you I do I do like the human in the loop thing though if a drawing has changed when you end up there drawing it's time great cool okay let's head to the shop floor so again the the overview will show you any problems that are going on in the shop and then you would want to dig in and have a look we saw that on the the first dashboard but again you would want a quick snapshot where you can see any issues that pop up acknowledge and close them or of course dig deeper the second one that we have is the scheduler I'm just going to make it a bit wider let me know if that changes anything but over here we basically have taken all of the different assembly lines or processes and you can see a snapshot of what each of the different projects is busy doing at any time so for the Nissan one you can see what what's going on and which which potential piece they're working on at the time you can also drag and drop these up and down if you happen to want to but we can add some filtering in here as well one that might be quite useful is the work that's behind so you can very quickly jump to any of the different options to see which ones are late um et cetera it's there there are filters but quite powerful in terms of rapidly being able to see what's good and and where you need to focus on you were able to learn from all those four not surprised just again you can drill into everything and just you know see the detail behind it if you wanted to so will this um this is the shop schedule is there um logic to which ones it puts first is it just like oh I guess we could build it in however we want to really it's exactly as you said I got as far at the moment of just putting the filters in but if we could Chris and I spoke about it briefly we would just need to think about what that logic would be in terms of the scheduling it could be done on time to completion could be done on financials but any variable that you want we could definitely schedule it and it'll prioritize accordingly ultimately it's a work management application that could auto balance the workload for the whole shop in the way that you would like it to do programmatically there is the one who built that schedule that I've seen to you for the t-shop and the a shop so I'm sure you'll have a lot to say about this okay no Drew thank you thank you well what you see on the screen is what you built it's just skinned with a few extra little bits so it's exactly the way that you envisage the next phase would be how we do it yeah this is arguably the coolest thing in the whole demo let's go with its demo data right but yeah jokes aside this this is the efficiency snapshot and it will take all the data from all the different production lines and and basically show you where where you're at you can drill in by operation as you can see by the operators Etc and you'll see exactly by by person by shop by application by workstation what's going on and then the actuals and in the estimates and actuals also quite important because if you plan to do something whether you're above or below I think that's probably quite important some of the projects you might be behind but the ones that you're ahead you can get that balance you know at the at the higher levels that you're working at parts history as well we added again that was one of the inputs that we had um yeah another one you're able to log in efficiency events or over here put in your notes um if you had any scrap if the actual say was higher oh that's a bit high and then we built in a little AI suggestion which would effectively take the text in the numbers that you've got and name it for you so it was something that was intuitive when you come back to look at this as you know you work with a lot of data and it becomes a C of the same things ultimately eventually so yeah uh there's a couple of bugs here I just need to fix but uh yeah that is the efficiency events that you can log that'll that'll feed into the system this is where they would input the data so that I'll give them access to that yeah all right well this is the dashboard I've been working on building so right yeah so that's the most important part of this everything that you created we have taken sort of to the next level and the next step is to take everything in your heads and then bring it to life so I'm the builder you're the brains great yeah switching to leads um again this isn't physically built yet but um that is coming so I'm just now having to quickly look what I've got but we have included the leads also the shipping uh as you'll see here there are a thousand jobs that we haven't classified correctly yet this is a big dump but here you would see a snapshot of what's got to be shipped out and then you can group it according to the different job types so again you'll know your data better than me but um that's where we got to so far with the with the shipping all right the next one to show you is very briefly on the different workstations you can get here from the overview but this and Chris and I spoke earlier about this one we would need to recalibrate the way that we display this because there'll be too many job cards per per per section but the flat laser for example this is what it kind of could look like would probably Drew look more like your your scheduler as in it needs a lot more you know represented there on the screen and then we would have filters to make it easier and more intuitive to work with okay while we're on that very briefly one of the things we may look to do if you want to put the data in the hands of everybody in the organization is probably put this on an iPad type of device what that gives you is the largest screen because you need the real estate to see what's going on and then secondly your it will enable the touch uh easy sort of you know punching numbers in on the floor as well as audio you can speak to uh to the system which is which can be quite handy is it have an auto translator in it it actually does it can do multiple languages and languages it's the southern drawl that is that is one of the languages yeah then you'd wait and at the end you could you know you could key in I built 23 of these uh was there any scrap for and you can take a photo as well if you'd like that's where the iPad comes in as well just to make it a bit more visual um I know this might sound a little out there but any of the images that are uploaded would automatically be tagged and pulled back into the system so you would have a and audit history and it would start to learn what the things are supposed to look like and it could start to look for anomalies or do QA or quality control of what they actually put into the photograph so it's it's quite a cool feature that we could add in time so at the so at the flat laser we have an iPad and it would show this screen and it would have six jobs on it they would just click the one they're on start yeah and then stop and then it would go away when they're done that's it and that's perfect we spoke even further we're obviously not trying to disrupt things but if there are any jobs that you could do on a repetitive basis going forward maybe there's a certain part that you produce a lot of you could literally run that 24 by 7 in an automated manner and the system would actually be the the person that runs that line so obviously we need people to do some of the the complicated stuff but some of the easier stuff you could look for the future to automate as you've probably seen some of the robotics and things come in and so that is an option for the future and when we finished here if they inspect I'm sorry I might have missed you say this but no we could have seen oh there was burgers so hand off to next station and says or deviate and send to finishing or deviate into new equality inspector and then the quality guys will be like oh I've got a new ticket because the guy had a problem so we can at that point when he clicks complete deviate it somewhere else so we never have to lie to the system to get it to do what we want if we can say what actually happened that's that's it great that's where the photographs come in because that's your it's a data driven point that you can evidence what actually happened rather than I built five and there actually weren't five it would actually know and again you can tailor it to what makes practical sense on the floor yeah okay cool uh from there on it's pretty much the same for all the different workstations and I don't want to end on a downer but yeah the rest of it is mostly still to be built but we have accounted for quality control as you can see safety maintenance uh the fleet I've actually got some inputs that we'll build on that next and then inventory as well which of course would be integrated with the the ERP so most of what you've seen so far is physically in the ERP and being worked on a system displayed in the system and the ERP will always remain the source of truth above all so it is the data source that that that owns that that the business runs and then this is the way that the mechanism that you interact with that um as you go accounting and Finance again is part of the ERP just to switch to this screen quickly and where are we where are we counting but not because I have to go into this ERP except when we're trying to change something for the um the dashboard formation so the visual side everything will will operate is on the visual side not in the ERP itself that's it right yeah great of course you as the the main team would have of course have access to the ERP if that's something you felt more comfortable with there will always ultimately be the most functionality in the ERP as in all of the functionality but this system that you see here that the dashboard would be an easier way of interacting with it um that sits behind the scenes so yeah that's what we built in the weekend oh yes very well done very well done I definitely can see the potential in it to do what we need it to do where you don't see that with out-of-the-box softwares Matt let me ask you this um when we're talking about like historical numbers and historical data where is that is is that something that we're going to capture store is that something is that what you're talking about storing offline or in a cloud or yeah so excellent question I know this might sound a bit like witchcraft but in the past we had to really be quite careful about what we stored where and because of technology and cost and all that there's no reason at all that we can't bring every single data point from the entire history that you've got digitally captured to anything that you've got in a system we would bring all of that into the ERP and you would have full history right the way back probably not all 80 80 something years back but wherever you started capturing digital records we would aim to keep in here and not only just store but we would definitely I think want to run algorithms that can look into the data and see basically just anything that it can find in terms of Trends anomalies it can look for your most profitable items things like that and again I know that you know your business inside out but there are always things that are confined that we just simply cannot So all the data that you'd like to bring in would be the plan. And to push the boat further, I told Chris this, I'm very, very keen on this data sovereignty thing. So having access to your own data, not in somebody else's cloud somewhere else that you don't control. There really is no reason at all cost-wise that you could run two instances of this in two of your different locations, one production, one secondary. If the one fails, the other one takes over immediately, and it would be active-active. So effectively, it's a split system. You could even run three. So you would have a really, really high level of availability. So if there were any issues, the whole production line doesn't get stopped. You can still continue. And we can also split them per physical location as well with a batch upload at the end of the day type of thing. So you could put Starlink on top of the roof. And in the event of your connectivity. Going down or something wrong with the server, that production line or plant can continue operating. And then it would just true up with the other system later on. But we can get into that. But certainly all the data, the more data, the better. We can track things like downtime and insufficiencies that we have, inefficiencies that we have. Those are things that we'd have to be able to see. And something that I'd like to see, and I'm sure. I can do it. I just want to say it out loud, but it's basically forecasting. Like, what if we got this big job that we're quoting? What does that do to our schedule and area of planning? You know, things like that. Yeah, great question. Absolutely. That is specifically what this is all about. This is not a system that just dresses up your data in a nice screen. What you just mentioned now is the real reason that we're building this. The AI chatbot is just a very basic example of it looking at the data and seeing. What it can find. So we could definitely, we've been definitely catered for that. Yeah, I see this being a replacement for Panel Tracker because we make cut lists for all the parts to go out in the shop floor for our protection. I didn't even think about Panel Tracker because it's a free software. So our CNC's that run our ACM product, again, when we bought the CNC's, they gave us a product called Panel Tracker, which has got barcodes and they scan them through the shop. And we're having a lot of difficulties getting the program to work as advertised. Sounds like a great option. The ERP, again, natively does and it caters for that type of thing. So we would integrate, we would basically extend the system to cater for that. You could still have the barcode scanners. I take it you would want that. It would just be feeding the data into the ERP and then it would become part of this process as well. So just to be clear, like a barcode scanner is capable in this system. Absolutely is. Yeah. Awesome. I guess the only other thing that popped in my head is the inventory side of it. You know, we have we have this assembly we make that has 20 different parts that go into it. Once they claim the top level assembly, it'll take all this out of the inventory. Exactly that. It is I'm just jumping to the ERP now. That is one of the key parts of the system to switch to that tab. We don't have anything in here yet, but I think just really simply I typed in the word inventory and it comes up. It's one of the primary modules of the ERP above all. I mean, the inventory is the things that you have in stock that you're going to sell. So think production line. It's kind of where those routes, the route concept came in where you've got that A to Z. And you can see. Where everything is. An inventory would be one of them that will be calling in real time to check your stock. Awesome. Yes. He'd be able to track. We have finished goods, everything right there. Yeah. You would know what's concerned. Yeah. The kind of question. So and that's what I was. So this is exactly what I was trying to build on the Excel side. That's just it. This is what you know, this is just like a I mean, it's perfect, just like it's a combination of everything. That's so. Awesome. It's something. It's one place. Yeah. The inventory has got the cost for the sheets in it, right? I get the drafters putting square footage on parts when they put them in and calculate the actual cost of that panel when they mess it up, remake it. I think the extent we can take this is. I got ideas. We need to now put it in a box and say, we're going to bring it in. This box. First. Yeah. And then expand it because we need to get the schedule efficiencies and things to the shop for both architectural and processing done first. And then we add all the other stuff. The inventory is key to that. That we need to keep it simple for how the data gets input. If we can do that, I think we can. And I feel like we're on the right track of that, too, because I mean, just in the conversations that we've had the last five days. I feel like. People are learning so much more about AI and how it integrates with our with our abilities. Yeah, I think we all see the value in it quickly. Absolutely. So I put these at the top AI live data live. So again, we can strip these things out for production. But this was a visual aid to show what is connected and what it's actually doing. So it just takes some of that voodoo out of it and you can touch and feel and you can actually get confidence that. What you're seeing is real, not just a system. Do you have a sandbox built yet or. Yeah, this is it. This is a dedicated, secure sandbox that we can use for JWM. Yeah, both the ERP as well as this application. Yeah, currently hosted on a server literally sitting behind my head. And again, we can move it to your infrastructure as and when you like. Awesome. You know, I think I need to get you to look at my server first because I don't really know what it's been. Yeah, it's a mess. It's huge. And we spend a lot of money on it. Physically. Yeah, it's for sitting. And I mean, we are like, I mean, terabytes. I don't think terabytes. That's for the camera system. We did. Okay. One thing that might be of interest. I can just get the server. Yeah, what do you need though? Because. Yeah, one thing that might be of interest, we'll have a look at your physical server and see if it's capable of handling it. But the reason that I have this in my house is for that data sovereignty purposes. What you could install is an AI GPU. It's basically the card that you put in your server. And then all of your AI processing happens locally on site. So it's the only cost would be the cost of the GPU card itself. And then forever in its lifetime is. Free for you to run 24 by seven as much as you like. We didn't get into all the boring stuff that Chris probably warned me about, but there's something called an AI gateway. It's just simply an AI safety thing that I personally highly recommend that we use. It is physically built into this and every single AI related prompt or any activity that ever gets generated on in the organization is forced to go through this device and it does all kinds of checks. It'll strip out any personal information. Financial information, keys, you name it, you can set it the way you like. And it can either mask the data and change it to something different if someone tries to do something or it would block the request. May not sound very sexy, but we cannot in any eventuality have your data leaving the premises. So that comes pre-built into into the solution. I can show you as well another time, but it's got lots of logs. You can schedule it per team. You can get granular per call. Cost information of what the prompts cost, it's normally about 0.2 cents per call, it does add up, but again, it's full of visibility with all the governance and compliance that you would need built in. So it gives you safe AI within your organization at a hopefully very competitive price. That's kind of what I do. That's actually what I do. That's my day job. So that would be organizational-wide enterprise AI? Yeah. Think Chat GPT, but it would be. John, or whoever you pick. So one thing you didn't really touch on with this audio thing, our PMs could say, hey, I have an RFI, you can either speak and do this and write this RFI for me. Our operators could be like, what am I supposed to do next? If the laser leads are like, I don't know what I'm supposed to do, what am I supposed to do? And you ask the iPad and all that. When you're supposed to be running this, this, this, and this, and this, I think it's going to take us. From people trying to find the data to all they do is they press that audio button and they're like, I, what the fuck am I supposed to do? And it's like, well, these are your calls. Get that from them to work. I know it's just a bunch of words, but these are the actual calls that we'd used in this demo. The, this is the text that was sent. So I know I'm going very quickly, but the important bit is down the bottom, the guardrails and compliance, and you can see all of the different compliance. Um, processes that we applied to this, and you can add as many as you want, but ultimately this guarantees that no data leaves the organization. So certainly seen in other places I've worked, the execs will drag the company strategy document into chat GPT and get some information about it. That information immediately becomes part of the training of the chat GPT models, which is not what you want. So it completely stops that from happening and gives you full visibility at a, at a. Granular level. So pretty cool stuff. We're about 15 minutes left with my, you guys have any more questions for me? Did I say cost column at the top of that? Yeah, absolutely. So if I scan here, I don't know why all these failures here, I'll have to have a double check. I think it's because it ran out of cash, but this is this column here is the, the money per call that, that I've been running and there is reams and reams and pages of these things. So, yeah. There's a bunch of stuff I can show you here. One is other models. If you see here, you'll see, we've got open AI, which is chat GPT. I've got anthropic, which is Claude. Uh, this one is my local one. So you would definitely, I would recommend this one. So it runs all the models locally, but it doesn't matter what one it is. They're all completely free. Um, so there's a whole bunch. Um, I'm currently building something for an Australian government company. I'm sorry, the government. Yeah. That does screening of the text and the images for all kinds of, let's not say out loud, but you know, anything that is nefarious, it checks all of that for them as well. And then this one at the bottom open router, this isn't another kind of service that has a multitude of other models behind it. So you can pick and choose. And the way you would set it up is any of the different teams, like the guys on the floor, we would pick models specifically tuned and sized for their workflow. So in terms of speed cost and, and the nature. The nature of what it knows about, we would set all of that up. So everybody basically gets their own dedicated best of breed AI function, and it all writes through here automatically. They don't have to do or touch anything. It just, it just happens in the background. And, uh, I guess the final thing to show you, this is sort of a chat GPT interface, but you can do comparisons. So over here, we've got many, many models and you can add as many as you want. And you could put in prompts, um, you can, uh, sorry, I went way too quickly there. I should have actually selected the models, but depending on the different models that you've put in it, you can see that you get, well, we would get different answers. Um, two aren't working now. Let me stop there. I was going to take us down rabbit holes, but, uh, just to kind of evidence that there's, there's a lot of stuff behind here that I think will, will certainly help you in future. We've done ourselves in that. I'll chat to you a little bit later. Excellent. Thank you. Very nice. Nice to meet you guys. Hopefully get to meet you on the ground. I haven't been in Tennessee in quite a few years. My last trip was to Pigeon Forge. So I know that place pretty well. Uh, we turn all of us impersonation con, uh, sure. And, uh, I've never seen people get that excited about Elvis, but, uh, yeah, interesting times. Yeah. Great. Excellent. Thank you for your time. We'll speak soon. There's bye-bye. That was the JW. Demo looks like a way. Pretty good. Let's make a list of all of the actions that they recommended that we work on next for next features.

</details>