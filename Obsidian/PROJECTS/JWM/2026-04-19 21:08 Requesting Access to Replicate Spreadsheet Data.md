---
title: "Requesting Access to Replicate Spreadsheet Data"
date: 2026-04-19
time: 21:08
duration_mins: 37
tags:
  - voice-note
  - plaud
  - jwm
source: plaud
project_folder: "JWM"
---

# Requesting Access to Replicate Spreadsheet Data

**Date:** 2026-04-19
**Time:** 21:08
**Duration:** 37 minutes
**Pipeline:** Whisper large-v3 → Claude Sonnet 4.5
**Classification:** This recording is entirely focused on JWM's production management system, with Chris Ball (COO of JWM) walking through their Google Sheets-based ERP system for architectural and processing divisions, discussing their production scheduling, engineering workflows, and the custom replacement system being built.

---

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

---

<details>
<summary>Raw Transcript</summary>

No, no, no. Hold on. Can I get a screenshot of that? Is that possible or not? I can take it. I just want to ask first. I can just give you access if you want. Well, if you give me access, then I'm warning you that we'll be able to literally replicate and pull out exactly what we need and build it into the new solution. It'll probably be done by the end of the week. I mean, I told you, I think it was all runs of this sheet. But as long as you don't change any of the data, you can just, you can go file. I will not touch a single thing. Yeah. I can export the almost data and you can just do it from there. That would be better. Sorry. I'd prefer not to have production access to a live business. That is a step too far for me even. That is really pushing the punches. Remember, I'm the brakes. I'm going to have to be the brakes. Sorry. I'll give it to you. There's two raw files that can invite everything. So this is... This is where my operations side of my architectural side of the business runs. And this is what really gave me visibility into it was the HPM then has their own dashboard and all of these things that is coming from... Did I not show you this? No, no, no. I've never seen this. This is... I showed someone else's version you did. Okay. So HPM has their own dashboard and then each project has its own dashboard and the project is built out of a schedule. Budget, change of the request log, change of the budget, full cost, production, the project charter which is all the information from the climate tract. Do you want to record this? Are you recording this? I'm going to stick it on a second. Just find the thing. Do you want me to start again? No, you're good. You're good. Okay. So each project has... And this is where it really started. I wanted a project schedule. So the budget, change of the request log, change of the budget, full cost, production, project charter, everything else rolls up on here from somewhere. Yeah. Like the project schedule. So we have distinct areas and I have a template and the PMs have to go in and change it and it's a garden chart. You can go creating a garden and it'll show you when your clashes are and whatever. And we have green and red to see if it's on track. Okay. But when we do... So the green and red... Yeah. The green and red, I take it there's formulas. Basically, is it formula driven to derive the statuses or how does it get them? Yeah. Can you see the formula? Okay. So it's literally formulas embedded. Okay. Got you. So without stating the obvious, we would reverse engineer that and we would basically convert the formulas into code. That's ultimately what it looks like. Yeah. And that's based on these dates here. The PM is supposed to put in the task ID here. Yeah. And then pulls it into a master schedule. And these schedules are like field, shop, and engineering, but it's not a live schedule. It is, well, my field maybe is, but the shop and the engineering are like, this is what we expect to happen when we build out these project schedules. What the real live schedule that we have is this ERF document, which is what we spoke about the engineering request form. Yeah. Which is this document. So the PM now says, okay, I'm going to do a job and this is the job number. It's 26052. Okay. Why didn't that, whatever. That job, he's got, this is the parameters. He goes through, it's the release number and he fills in all this information, right? Mm-hmm. That, once you hit submit, I had all these things in the way here. There we go. Once you hit submit, it goes into our production. Mm-hmm. And this is what I'm really trying to replace. Production schedule. As well as the others as well though, right? Yeah. Oh, okay. Right. This is the- This is the meeting of characters with architectural division. So it starts here and I categorize and these cards go through, but this is really just a spreadsheet. It's a monster fucking spreadsheet. Yeah. And we're reflecting what we want to see. And we have offload and we have an archive and we have everything, but it's a card. And every card, so they can move these cards through production. And so we have engineering, right? Which is a separate thing. So the shop doesn't care about engineering. Engineering doesn't care about the shop. I mean, they do, but you know, the shop schedule- They don't break each other. Which is, say again? They don't break each other, right? They are mutually exclusive. For the, for the shop to start engineering, you have to figure it out. Yeah. Yeah. Yeah. So you start engineering, you have to finish. Okay. Yeah. But okay. Got it. Yeah. And- So you can't have, you can't have a card in engineering and in the shop because that means you're making something that hasn't finished going through engineering. That's the handover you spoke about earlier. Got it. Okay. So that's a kind of, the real, I mean, the handover is from sales to the job's a job. It goes to engineering first and then goes to the shop floor. If engineering is a one step and they just rubber stamp it and then move it on, it still has to go get a rubber stamp. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. I'm just trying to get more of a full picture because I feel like I'm giving you kind of a half picture. Yeah, this is massively helpful compared to what I've seen so far. This is the real one, yeah. So this is architectural. They move the tabs through. So let's say they go from programming and then they're going to decide, okay, this is going to go from CNC programming. It's going to go onto the axis 34 foot. And they'll pull it here or second shift or whatever. This is the scheduling. What Drew is doing is he's taking the data from here and he's putting it into that Excel sheet and then updating the Excel sheet to try and schedule a workout to actually because here it doesn't matter if this one's on top or that one's on top or that one's on top. It didn't matter, right? So there's no flow that it's like I have 100 cards. What the fuck do I do first? So Drew is telling them what to do first. Prioritization would be a good feature to have. Would you be able to? Is there a logic to the prioritization that we could derive or not? Just it's tribal knowledge. I'd say through determining with conversations with the PM is what's more important because every PM thinks their stuff's the most important, right? Okay. And I mean typically would most important be based on at least something like profitability or materials availability or machine availability There's so many things. Okay. Are we under liquidated damages? Do we have a contract that has liquidated damages? And this is on the operational side. Like on the processing side, have we been late before? But all of those things, I know they might sound a bit random, but we can at a minimum, we could use all of those variables and prioritize them almost like in a soft way. So the human in the loop kind of thing where he would still obviously have ultimate control to do that. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. Yeah. I mean, he obviously has ultimate control to do what he needs to. But he would kind of have them pre groomed based on at least some criteria, which it might give you sort of t-shirt sizing. That make sense. It's pretty much what I did with the plured notes workflow, where it doesn't just grab the stuff and stick it in a folder. It now is smart enough to sort of look at all of the different notes and work out where everything should go. And ultimately, if it cannot find a pattern, it just leaves it in the root, if that makes sense. move it and once you do it learns for the next one yeah so this is all based off these stations so if i exported this i could put this into a grid and i could export it to you and you just prioritize it all stations so this is once an erf has been submitted so but this is architectural right yeah so just a couple questions we're walking slightly fast that's a lot of items is do do you do archiving or without using fancy yeah so after a while they drop off once they get to the end here okay so you've got that many jobs running in parallel every single day and this is our potential processing is way more and how typically how big or long would each of those items run for roughly uh the runtime for the i mean what we mean from start to finish what is the lifespan of a ticket ultimately it's supposed to be six to eight weeks um but sometimes it can be longer we don't have the material it can be shorter if it's uh so yeah i'd say less than 10 weeks and then employee counts just just as a ballpark given that how many tickets are there 180 employees and we have uh three sub contractors who have 15 people each in the shop and then we have a phenomenal that is that's a small number of humans for that number of tasks maybe that's why we're cracking that is well just at face value that that's that's a significant number of that's a lot of work that i can see in front of my eyes so my thinking is what we want to do is over here have engineering and shop floor okay so you can have a schedule for engineering you have a schedule for shop floor yeah and so it's going to be the first one maybe it goes project management engineering shop floor or it's an architectural project management processing project management engineering shop floor because engineering in the shop floor is shared between the two okay that's a critical piece of information because if we define clearly the menu items we can then obviously that's the hierarchy we then get to slots everything in and bold it accordingly and we know what is shared and it's the difference between where the data sits and what what is a view and what is actually split data or functionality so maybe so maybe i should share this where i did this nice check you out absolutely look at that very cool um i i don't know what we're gonna call that but yeah i hadn't even defined that engineering was shared but i mean when trying to put it on this side i was there i said something that made me think it was on this side did you export that that ball that ball didn't you cut that out Yeah, I'm going to tweak it a little bit. Sorry, I know it's wizardry when it spits something out, but it's got to still actually be checked. Yeah, I need to tweak that because inventory is screwed. Okay. Even though we have different types of inventory. That sort of rough... Okay, so now that I've seen this, it's a total game changer, but just flipping back to the other one, does that kind of color coordination type of approach, the RAG status and all that, is that kind of going in the right direction or...? Which one? This. That. Yeah, it looks awesome. Okay. And I like how you've put it into each station and things. I mean, I think if you look here, you've got your annual schedule per workstation. Yeah, and that's real data now that's in there. Yeah, so you have a schedule per workstation and the annual... You'll have a master schedule that pulls the whole thing together. Yeah. And maybe you'll have... So you'll have your flat lasers, and then you'll have one, two, and then you'll have tube lasers that you can do combined, and then you can separate tube laser one, tube laser two. Okay, so you just nailed a really important point. That, in the fullness of time, and again, coming out notwithstanding, hopefully we get to do it, anyone that can explain those relationships and what are ultimately rules, all of that will be... literally codified into the system, and it will be contextually aware of looking at the different job areas and working out who actually should get what. It'll basically do a very smart way of either doing the actual work or providing a guide to whoever does the actual distribution of the work, if that makes sense. So if two machines are busy, it'll look ahead, knowing what's coming, and they'll be able to smart... Distribute everything. Okay, cheers. Okay, are there... a few questions. Am I going to get into trouble if I show real data in the demo? No. Okay. Good. Are there any other workstations to be aware of? Because that... I mean, I've never actually physically been there, or we've never really got into the detail. Is that a good... Is it good enough for the demo for now type of thing? Yeah. Cover the breadth of machines, the schedule, the workstations? Yeah, I mean, I think if you could include inventory here somewhere, it'd be a good idea. Okay. We can certainly do that. I mean, ultimately... Sorry, I'm just trying to get my brain to work. I'm number three in the company, as I think you know. The owner is number one, the president is number two, but he's a CFO, he's 65 years old, and I'm the third person. So then everyone else kind of takes my lead. So you're not going to get any pushback in this meeting. Okay. Like, what I want to get is them to buy in as much as I am, because they were bought... So I told you on the call how this all came about. On Friday, I walked into a meeting, and I was like, I'm going to throw a wrench in this, and we kind of about turned, and I wanted to speak to you about how to host. So they're all operating on the, oh, we're just looking for someone to help us host what we wanted to do. Right? So then I kind of turned... We can do that too, just for fun, on the side. Yeah, we're having this meeting, and all I said was, look at Frappe.ai, and I think now they're all like, okay, what the fuck is Chris doing now? So the goal is not to get approval, because we're good. We're going ahead. But the goal is to get team buy-in to see how it can be. So like Drew's schedule, he's going to be very, because he built it, he's going to be protective of making sure the schedule is the way he wants it. That's the planner, right, or the schedule at the top? The schedule at the top. That one, okay. And sorry, not to nitpick, but what you just said, this is the crux of the whole thing, and like Claude's been giving me all of this, you know, reams of fucking information about who to speak to and all that, but all that, that's just nonsense. Where the rubber hits the road is showing someone something that they can immediately relate to in a positive way. If I didn't even change that, would that at least land half well? Would they have more questions, like? Honestly, I don't know how to answer that, because I haven't engaged much in his schedule. I know everyone loves his schedule. The one that you showed me with all the cards? Yeah, no, no, no, the tea shop production schedule, the one I sent you on Saturday at 1.46. Oh, right, okay, yup, got you, okay. So just for context, we call these divisions three different things, 10.40 and 10.10. 10.40 is processing, 10.10 is octet. 10.40 is architectural. T-sharp is 10.40, which is processing. T-sharp. T-sharp, yeah. A-sharp is, because it started with a tube laser, so they call it T-sharp. Right. A-sharp is architectural, and 10.10. So you'll hear people talking about 10.10, 10.40, A-sharp, or architectural. Okay. Dude, this, literally, what you just said now, batches of that type of information is what actually brings it to life for me. That's why. I'm building based on the documentation, and it looks okay, but I feel like the more we, the deeper we go, I'm losing traction. I'll let you say to Claude now, I need this literally explained to me like I'm five years old, because I didn't want to miss any of the context. Like this, you, I mean, I sent this to you on Saturday, which is your schedule. Yes, yes, yes, that was massively helpful. Yup, that's where we got all the information from that I used to build all the templates. So this is what he is going to feel like, if we can show him something that he can relate to that's similar to this, with the input material and all that, this is what he's going to... Then the other guy, which is, what's his name, Collin. Notes. Ooh, notes. Evil. Free text is evil, but yes, we will accommodate that for now. What do you mean? Over here? Yeah. Dropdowns or, anyway, that's a small thing for now. The efficiency page, I showed you that, right? Anyway, but I think you got it handled, because... The efficiency, I think I did a great job, because it's very... Now the efficiency is in. Yeah. I saw that and I was like, this is pretty awesome. Yeah, and the graph, I mean, but that's the kind of stuff that the AI tools are very good at, because by that stage in the stack, if you want to call it, there's so much data in the system that it's just pretty graphs and looking for patterns. That's the kind of stuff that people show normally. It's actually understanding the business rules and figuring out how to make it the same as what you have, but better. Yeah, so I think we're good. But yeah, if we could, maybe on the side here, have architecture project manager, and we can say still building, and then processing project, or even 10, 10 PM, 10.40 PM. Would you mind, terribly, if I ask you one favor? Could you write down, just in words... Could you write down, just in words, with the nesting, what the menu should look like? Because then it'll make it much easier for me to slot everything in. Yeah. I can do that. If you literally just do that, that will help, because otherwise I'm going to keep guessing. And also, the sequence from top to bottom of what you want first. So, should dashboard be at the top as a global dashboard? That's what I wanted to say as well. Sorry. I know you can do the breaks, but quality inspections are important. Yeah. And inspection checklists. They have... Oh, I don't know where they've moved it. Okay, that's been used. So, ACM panel inspections. Let's see here. Form... Form... What I'm almost thinking, and I know this is wild for me to say out loud, the UI seems so far to be looking so much more sexy than the backend ERP, that I don't even know if I sent you the text that I wanted. I sent you the text that I sent. Actually, I think I didn't send it. I was trying to write sort of a very simple summary of what was going on. This is obviously fine, but we can run the ERP headless. In other words, the sexy frontend that we're building, you can only ever need the sexy frontend that people see. All the ERP sits in the backend. You never even log into it. Well, you can. You know, I think we didn't even show... Like, we can bring this up on your screen and say this is what's driving it, but I think we focus here. It's cool. I just... For me, just as a... Sorry, I'm very... I'm pedantic about verified on trust. Doing an integration to an ERP is not normally something done in five seconds. It really, genuinely is not. So, to evidence that we've used productionized data in the core system, in this custom UI, that is quite a powerful message for me. I just obviously don't want to waste my time telling you guys that if they don't care. But, did I mention that at all? Or... I mean, we've talked about this in passing. As long as you get that it is... That is a big statement. That's all I need to know. I think I'd see how the conversation goes. If they ask a question that you think is... Honestly, I don't know the level of knowledge all these guys have in terms of asking the right questions. So, I don't think you need to volunteer. Okay, that's fine. If they ask a question that is unpointed, it becomes a... the conversation goes, I would say go wherever the conversation goes but let them lead that's cool, I mean respectfully, normally the way that most businesses are is that everybody builds and learns their process over time and that's what they're accustomed to they don't normally know the art of the possible, that's half of the problem in my life, is that I can't convince the bank for example to change they do not want to change so that's why this is such a strange conversation is, I'm not used to being the brakes, I'm used to being the accelerator, so new territory yeah, okay so you want me to tell you how to lay this out, just the menu would be super cool because that basically, that's the most relatable thing at the highest level, everyone sees where they go and then whatever they see inside where they go that we can work on but if if they don't see where their home is it's already a bit of a fail yeah, okay brilliant, okay, well while we've been on this call, let me just check how my machine is going yeah, you said it was building something while we were talking yeah, okay well, you have live access to the demo, so what you see there is is live you obviously use Chrome, hey? yeah, okay, so I'm just asking because some of the browsers don't automatically actually update I haven't managed to test your user, I have tested mine but the passwordless authentic login should work, it sounds like they wouldn't give two shits about that now but at least you know that is for me a big deal so that is also fixed and working well, it was for me let me know if you can see that I can impersonate and log in as you, but I can't physically capture a passkey for you, I don't know if it'll work for you I don't know if it'll work for you, I don't know if it'll work for you you to do that? I just clicked on the same button I did last time to get in. Okay, do me a favor, look if it doesn't work don't worry to skip it but you can whenever you try next click on that single sign-on thing and see it should it's gonna ask you to capture a fingerprint. Do you have a fingerprint on your laptop? Okay don't worry about it for now, just don't worry about it for now we can sort that out later but that part is working that's what I spent some of the afternoon doing but the productionized data that you sent in that recent thing is in there so if you could do the menu that would help and if if you want to remembering that whatever you send me will physically be put into this is not really a demo this is it's kind of all of a working system if you send me that spreadsheet I will I'll do that. I will pull I'll import all of that data in a clean format and make it work that's quite a big task because there's quite a lot of extra fields that we need to add that's not a problem it just it's just work that needs to get done but that makes it more relatable and real rather than you know these guys okay so fine with that for now then but I could export the current engineering and architectural workload for the prf afterwards that document you know that production sheet that I showed you yeah that's it look whatever you send me I will I will work out what to do with an import in the correct manner so I mean short of this is probably certainly not for tonight but if you were able to export epicor as a as like the entire database we could pull the whole of epicor in that would be in theory the the full physical migration in time of your erp off epicore onto this one yeah so i don't know what file they allow you to pull because you know these guys are all protective boys for sure look i don't know do you have admin access to that or not uh honestly so what happened was they entered they put it because the guy who was in charge of that division wanted it he got fired um for calls i got put over operations of a division but not only areas i pulled a move when my boss who had hired me we me and him became equals and i took over the architectural division and he kept the processing division even though he used to be in charge of the architectural division and now he works for me and so now i'm over both divisions again but now the guy who used to be my boss is my employee so that isn't awkward at all no in fact on friday i had to tell him that even if we shut down processing because they are profitably uh struggling and that i would keep him which obviously was quite an interesting conversation i can imagine well finally the same has happened to me i took over a team of seven people where all seven of them were literally like the walk on water good seniors so funny one of my best mates up anyway la la la okay business is business senior senior production schedule use the station as your the line that says what station is in as the point and it'll give you all cards again if you want to do that um yeah okay i'll send you uh uh what i think that she should look like but don't worry about the pm side we also have a a deep tab for pm right now for boys so rolling forward because i'm both equally excited and shaking in my boots because i've got to actually show this tomorrow um i've written out a run through a run book can i send you the run book just to have a look at on your way to work and then just send me a voice note or chat call me whatever you want just to tweak it and then i'll kind of know what to show otherwise i'd basically be taking the menu that you're going to send me i'll basically just show them we land here we log in we use the colors and all that i mean just i don't know should i even bother explaining how i built it or just skip straight and just log in and show them the stuff i don't think we just show them and let the conversation go and then they'll start telling you what they want and you'd be like i'm going to record this and they will and we're just going to tab by tab and they can say i like this i don't like this let's do this you're missing that and just go into full-on that would be absolutely insane i mean oh we can't do this by the end of the week this isn't this is this is space grade stuff um you know we're planning a core banking transformation for the bank and we have a three-year window to do it in just a lift and shift of what we have today literally take the system export it into a new system which is a three-year process that we haven't even started yet we already delayed it by two years and getting to where we are now it will take five years to migrate that that excludes any of the payment rails and all of the money part of it and it excludes any of the integrations data cleanup literally everything else that needs to happen it's about 20 of the project it will take them three years do you understand now that we are 48 hours since we spoke so typical we had a two-year rollout period and it never fully rolled out so we've done this all erp over years and it's it's we spent two million dollars in epical all in with all the training and everything that's it we're doing 23 million um on this banking project alone it's stupid it is stupid it is stupid but that's that's why you're doing so well because you don't do what everyone else just does by following their nose at the you know the standard pace that we're all just mind numbingly accustomed to that's why these australian dudes gave me the gig 45 minutes the guy literally after 45 minutes said please come you need to think about it oh and i don't need to think about it pull trigger so okay very interesting very interesting i'll see you i don't know if it didn't know but i'm going to send you a quick list um look at the production schedule uh there's a one stage that shifts from engineering to um from engineering to shop which would be um after program yeah there's actually it's called release to shop so program complete and then it goes release to show um yeah everything else is so uncategorized evaluating float layout layout check sketch sketch check correction cnc programming laser programming punch programming program complete and then release to shop and everything else after that is okay that's another question would it help at some point at some on some screen to have almost a cradle to grave of the production process for a project you'd almost have like lines and balls and you can see where it is in the manufacturing process and you could click on each one like basically you could click on a ball and it could expand it or it could drill in in the screen but it just gives you a visual along the top of whenever you're looking at a piece of work or project where it actually is so from the first time that you create whatever the work package or the project is it would then you know give you that pipeline view so it's not just sales it would be the whole thing the one other thing that i was thinking about in the processing side is then they'll have a part that they make it's a tube laser or flat laser form weld it then goes in as a stock part and they take four parts together and it goes into an assembly and the final assembly is always shipping out and selling but we have to make sub parts to make that part and that's something like they were struggling with so if that sounds easy to you that's good so one of the ways that we can do that this n8n thing have you ever heard of n8n if you just put n8n in your browser trust me you'll get a million hits just look at an image of it it's a workflow tool it's the sort of latest and greatest in the world everybody's using it it's open source it is the thing that is running these workflows behind the scenes that are built to make this work so the reason that i use it above all because you can just do all that stuff quote in code the problem is it's not visual you can't actually see you have to trust blindly what's going on and i have a massive issue with that so it basically would show a b c and then d could be a fork into multiple different parts and you actually see and it can also build a bespoke one of those once you expect the project it would build a bespoke workflow knowing all the different components that it's going to be using they call it they call that a router for the shop well you've probably seen that word everywhere so the work thing is like a router so when they when they estimate a job they determine the path it's going to take that i guess is the workflow sorry the leg of it the i don't know if they're routes or routers if it's a route would that be is it a priest same route quick bypass in australia i said router and a router there is someone that shagged sheep so i know yeah i knew that okay i didn't know that it was a long ago but still i guess i like the ice cream australia so it makes sense that i knew that all right oh hectic small world well um so other routes routes routers whatever you want to call them is that a predefined set of different templates or could they be bespoke to every job it's defined and estimated okay so it's defined but that means that it could be bespoke per project yeah because it depends on which stations it needs to go to exactly okay no i mean it makes to me it makes sense it might need to go from laser to breast break to weld or it might go laser well press break you know so yeah exactly and next last final question i'll let you go so are there any eventualities where things go wrong so it would go from whatever from welding to the next process they have a problem and they've got to send it back and then it continues again because that is something that could also give you a again the visual for me is everything that's why i think people like the schedule because you can see what's going on when you have to draw and click on a screen it's it's just not you know it's not intuitive so the non-conformant non-conformance report could send something back yeah or it could send it on its own little path so let's say it comes with the laser and it's got burrs it can go and in the qc guys said i wasn't all the lead says no this is not good they can send it to um finishing yeah and send off the burr and then it'll move on to press right so so that finishing may be optional but it may be required if the previous process had an issue different material something like that the burrs you're you mentioned okay cool okay okay let me absorb this and take the next step i will keep the work i will plan the work tonight and kick it off so that it runs in the background while i'm asleep and then i will see how far it gets by the morning and then i will continue the work and by the time you're on the phone if you could call me whenever my day is good tomorrow actually i've got these stupid workshops for core banking you can't make it up so jwm that's for the win um yeah i'll definitely have time to get it polished i mean our meeting's at 8 30 and i'll call you in my drive-in at like six but um i'm going to try and text you now the i wanted to do it on the computer i just sent you i want the um dashboard that uh is telling me we're going to be late so i want to just ask you the different rooms you can even narrate it over the phone as you walk down the stairs whatever whatever works i just need to know top to bottom and which ones are nested if that makes sense yeah that's cool perfect all right um this is this is gonna be awesome it's gonna be a face study it's absolutely mind-blowing i can't tell you i've never done anything like this before to this this quick it's nuts we'll start a new company in america well you know what makes it quick in one sentence the only reason we can go quick is that the entire stack is already built that's why this is going so quickly if i had to build the entire stack it would take months so it's it's the first time i've ever seen this thing actually flex to this degree um which is which is quite fun anyway all good looking forward to it all right catch you later ciao bye just for the recording absolutely double check that this is for the company jwm and assign it accordingly speakers with chris the coo

</details>