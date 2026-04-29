---
title: "Streamlining Budget Pre-Population with Excel Integration"
date: 2026-04-20
time: 13:06
duration_mins: 19
tags:
  - voice-note
  - plaud
  - jwm
source: plaud
project_folder: "JWM"
---

# Streamlining Budget Pre-Population with Excel Integration

**Date:** 2026-04-20
**Time:** 13:06
**Duration:** 19 minutes
**Pipeline:** Whisper large-v3 → Claude Sonnet 4.5
**Classification:** This recording is primarily about a custom production management system demo preparation for JWM stakeholders (Paul, Drew, Colin), discussing engineering workflows, shop floor scheduling, and integration with their architectural estimating system—clearly a JWM project conversation.

---

## Executive Summary

This recording captures a pre-demo technical walkthrough between the speaker and a development partner (likely a software developer/consultant) occurring 15 minutes before a scheduled demonstration to engineering and shop floor stakeholders. The discussion centres on a custom-built production management system designed to integrate architectural estimating, engineering workflows, shop floor scheduling, and human resource planning. Key stakeholders for the imminent demo include Paul, Drew, and Colin, with the primary focus being engineering and shop floor functionality rather than operations or client services. The system features drag-and-drop scheduling, real-time station tracking, efficiency logging, and aims to provide competitive advantage through deep customisation and scalability.

## Key Discussion Points

• **Architectural Estimator Integration**: Discussion of integrating AES (Architectural Estimating System) into a large Excel-based bill of materials tool via drag-and-drop functionality to pre-populate budgets. This is specifically for the architectural side of the business, distinct from processing workflows.

• **ERF (Engineering Release Form) Importance**: The ERF is identified as the critical document when pushing work to the shop floor. The developer has already received snapshots of the ERF form (blue forms) which were used to build system forms. Multiple emails and materials were exchanged the previous night.

• **Human Asset Planning Philosophy**: A strategic approach discussed via email to treat employees as "human assets" and plan their workflow similarly to how machine assets are scheduled on the shop floor. This represents a fundamental workflow management philosophy.

• **Route Building Workflow**: Three worked examples of routes exist in the system. Routes can be manipulated using handles (left-hand side) and up-down arrows (right-hand side) to move processes. The interface is acknowledged as "clunky" and requiring improvement. Routes include concepts like "breakouts" (terminology to be finalised).

• **Job Submission and Routing Process**: Jobs are submitted and released to Engineering via the shop ERF. Engineering is the starting point. A new tab needs to be added to the production schedule pipeline for "building the route" when jobs move from "uncategorized" to "evaluating" status.

• **Production Schedule Pipeline**: Currently displays t-sharp, a-sharp combined, and other categories. A new category for "human assets" (despite acknowledged awkwardness of the term) will be added, along with "programming queue" and two additional categories.

• **Shop Floor Overview Design Concerns**: Current card-based layout for stations deemed potentially problematic due to volume. Preference expressed for list-based view ordered by scheduled run time, with filtering capabilities similar to existing pipeline view with PM filtering at bottom.

• **Station Interaction Functionality**: Stations allow tap-to-start functionality, manual entry of items (with planned text entry to avoid repetitive clicking), voice dictation capability, and handoff to next station. System designed to run optimally on large iPads for physical hardware functionality (audio) and screen size.

• **Scheduler Drag-and-Drop**: Drag-and-drop rescheduling functionality being implemented across multiple views (pipeline, scheduler). Some functionality was being added in real-time during the call.

• **Future Automation Potential**: Discussion of "lights out" manufacturing concept - factories running with lights off using full automation. Developer noted the system architecture could extend to automate repetitive fabrication tasks if robots were introduced.

• **Ship Schedule Data Issues**: Ship schedule contains approximately 1,000 jobs, most using old archived data that should have already shipped. This requires data cleanup and context clarification. Integration with architectural PM side identified as future phase.

• **Efficiency Event Logging**: System includes efficiency tracking where users log planned vs actual performance and submit entries. Causes are suggested based on text input (e.g., "machine breakdown"). Reporting capability from this data is planned.

• **System Update Mechanics**: When updates are made, entire site rebuilds from scratch, requiring hard refresh to see changes. Updates would typically occur weekly or monthly once stable, not during active use.

• **Demo Strategy**: No PowerPoint or formal sales pitch planned. Approach will be informal introduction acknowledging weekend work, with developer explaining tailoring methodology and "upside down" approach. Trust-based decision-making emphasized as core to the partnership and rapid development speed.

• **Stakeholder Awareness**: Drew and Colin aware of weekend work (Colin received random data requests Sunday). Paul has existing relationship/trust. Colin's involvement suggests data provision role.

## Decisions Made

• **Demo focus decided**: Engineering and shop floor functionality will be the primary focus of the demonstration, not operations or client services modules. (Made collaboratively)

• **Route building tab placement**: New tab for building routes will be added at the top of the production schedule pipeline when jobs move from uncategorized to evaluating status. (Agreed during discussion)

• **Shop floor overview redesign**: Card-based station view will be changed to list-based view with filtering, similar to existing pipeline interface. (Decided based on volume concerns)

• **Phase planning approach**: Phases will be decided based on risk assessment rather than feature completeness. (Developer recommendation, accepted)

• **No system updates during demo**: Developer committed to not making live updates during the demonstration to avoid system rebuilding. (Developer decision)

• **Demo presentation style**: Informal, collaborative walkthrough without PowerPoint or formal pitch, focusing on trust and technical capability. (Mutually agreed)

## Action Items

| # | Action | Owner | Due | Priority |
|---|--------|-------|-----|----------|
| 1 | Add new tab for "building the route" at top of production schedule pipeline | Developer | Before next phase | High |
| 2 | Add new category for "human assets" to production schedule | Developer | Before next phase | Medium |
| 3 | Add "programming queue" and two additional categories to schedule | Developer | Before next phase | Medium |
| 4 | Redesign shop floor overview from cards to filtered list view | Developer | Before next phase | High |
| 5 | Implement text entry for parts addition (avoid repetitive clicking) | Developer | Not specified | Medium |
| 6 | Fix efficiency logging decimal validation issue (currently requires specific format) | Developer | Before production use | Medium |
| 7 | Fix drag-and-drop functionality on scheduler view | Developer | Before demo (attempted during call) | High |
| 8 | Clean up ship schedule data to remove archived/already-shipped jobs | Speaker/team | Before ship schedule goes live | High |
| 9 | Determine data loading process for architectural PM side updates | Both parties | Future phase planning | Medium |
| 10 | Fix suggested causes functionality in efficiency event logging | Developer | Before production use | Low |
| 11 | Review email regarding human asset workflow planning approach | Speaker | Before next discussion | Medium |
| 12 | Record the upcoming demo meeting | Speaker | During demo (6 minutes from end of call) | High |

## People & Organisations Mentioned

• **Paul** - Key stakeholder attending demo, has existing trust relationship with speaker, likely senior role in engineering or operations

• **Drew** - Stakeholder attending demo, aware of weekend development work

• **Colin** - Stakeholder attending demo, provided data requests on Sunday, likely has data/systems responsibility

• **Chris** - Mentioned at end of transcript as someone speaker "just spoke with"

• **Matt** - Identified as "the other speaker" in final transcript note

• **Developer/Consultant** (unnamed in transcript) - Building the custom system, highly technical, working at exceptional speed with speaker

## Key Figures & Data

• **~1,000 jobs** - Number of items currently in ship schedule, mostly old/archived data requiring cleanup

• **15 minutes** - Time remaining until demo at time of discussion (demo scheduled for approximately 13:21 on 2026-04-20)

• **Weekend timeline** - System development work occurred over weekend between Friday discussion and Monday 08:30 (recording at 13:06)

• **4.21 / 4.22** - Example decimal values discussed for efficiency logging (system requires specific decimal format, currently has validation issues)

• **15-year iPads** - Humorous reference to potential longevity/cost savings of iPad hardware for shop floor deployment

• **Three route examples** - Number of worked route examples currently in system

• **Two additional categories** - Number of additional categories to be added alongside programming queue

• **~1 minute** - Typical time for full site rebuild when updates are deployed

• **Weekly/monthly update frequency** - Planned update cadence once system is stable

## Risks & Dependencies

• **Data quality issues**: Ship schedule contains approximately 1,000 jobs of old/archived data that should have already shipped, requiring significant cleanup before system can be relied upon for shipping management

• **System rebuild during active use**: Any system updates trigger complete site rebuild requiring hard refresh, creating potential disruption if updates made during working hours

• **Interface usability concerns**: Route manipulation interface acknowledged as "clunky" and requiring improvement before full deployment

• **Validation bugs**: Efficiency logging has decimal validation issues that could frustrate users during data entry

• **Incomplete drag-and-drop functionality**: Scheduler drag-and-drop not fully working during walkthrough, being fixed in real-time

• **Demo timing pressure**: Only 15 minutes available for final preparation before stakeholder demonstration

• **Phase planning uncertainty**: Phases not yet defined; dependency on risk assessment methodology still to be determined

• **Data loading process undefined**: Method for loading architectural PM data to update project managers not yet established

• **Hardware dependency**: System designed for large iPad deployment; functionality (audio, screen size) depends on specific hardware procurement

• **Trust-based rapid development**: Extremely fast development pace (weekend turnaround) relies entirely on trust relationship; verification processes bypassed for speed

## Follow-Up Questions

• **Breakout terminology**: What should "breakout" processes be called in the routing system? Terminology needs to be finalized.

• **Human asset category naming**: What is the preferred term for the "human assets" category given acknowledged discomfort with the terminology?

• **Architectural PM integration timeline**: When and how will the architectural PM side be integrated with the ship schedule functionality?

• **Phase definition criteria**: What specific risk factors will determine phase boundaries and rollout sequence?

• **Update scheduling protocol**: What will be the formal process for scheduling system updates once in production to avoid disruption?

• **Hardware procurement**: What is the timeline and budget for procuring large iPads for shop floor deployment?

• **ERP integration scope**: What is the full scope of ERP-side integration mentioned in relation to architectural PM functionality?

• **"Upside down" methodology**: What does the developer mean by the "upside down" approach that will be explained in the demo?

## Next Steps

The immediate next step is the stakeholder demonstration occurring 15 minutes after this recording (approximately 13:21 on 2026-04-20) with Paul, Drew, and Colin attending. The demo will focus on engineering and shop floor functionality, presented informally and collaboratively without PowerPoint, with the developer explaining the tailoring methodology and "upside down" approach while the speaker provides business context. The meeting will be recorded for documentation purposes.

Following the demo, the team needs to define project phases based on risk assessment, prioritize the identified action items (particularly the shop floor overview redesign and route building tab addition), and address the ship schedule data cleanup issue. The architectural PM integration should be scoped as a future phase given its relative simplicity compared to the engineering/shop components.

The developer will continue fixing identified bugs (drag-and-drop, efficiency logging validation, suggested causes) while avoiding any system updates during business hours to prevent disruption. The partnership will continue operating at high speed based on the established trust relationship, with phase planning and risk assessment becoming the next strategic planning activity after stakeholder buy-in from the demo.

---

<details>
<summary>Raw Transcript</summary>

map they use. What I want to do is, for the architectural side, is actually show you that and then figure out, because if we can just drag and drop the AES into this, it's a big Excel file, and it can pre-populate the budget, would be pretty cool. Okay, so that's on the estimator for the bill of materials. Cool. Yeah. So for now, we'll just talk through that. And sorry, I don't want to put you on the spot, but you may have to kind of step in at times and just say, we're doing that- And that's for architectural. Architectural is different to processing. Yes. I mean, when we push things to the shop, it's the ERF that's really important for what we're building. And yeah, I like that you've got this. I mean, did I snapshot you the ERF form yet? Yes, you did. It's one of the blue ones. Yep, that's where they built the forms from. Sorry, I'm sorry. Sorry, last night, I kind of got into a roll. I don't even know what I sent you. I was busy building this morning, then I eventually checked my email and found it all, and then I had to rapidly ingest it, and then try not to break the system. Sorry, I should have texted you and said I'd email you. Nah, all good, all good. Yeah, this one, obviously, the day-to-day for processing is very important, but no one, the ops and client services is not going to be in this meeting, so it doesn't matter. Okay, cool. Engineering is going to be there. Right. I like what you did here, but I don't know if you, did you see the email where I said we're going to treat these employees like human assets, and then plan their workflow the similar way we planned the shop schedule with machine assets? I'll have to double check. So, I did see it. We moved quite rapidly. I will- Yeah. I will- Sorry, I think- But the routes work- Engineering is the starting point. Yeah. So, there are three different worked examples for the routes. This one, I think, is the starting point. Yeah. Yeah. This one is just a standard one. If you, on the left-hand side, and I'll demo this, you can, if you grab the handle on the left, or on the right-hand side, you use the up-down arrows, you can move the processes, not that one, sorry, down below. It is a bit clunky. I don't like the way it is at the moment, but I will fix it. So, there you go. Now, it will basically show that it's skipping that. What's a breakout? What's a breakout? And the buttons on the right, the up-down ones, you can also use those. This needs a bit of work. Again, it's more demo. This would be when the job is loaded, and they first try the... Okay, why is it saying no? If you click on the red, not that one, sorry, the other red icon, that one, yeah, it will switch it off, and then you can save the changes as well. If you then go save that, and then go back- Scroll up and back, all that, yeah. Click on the other two just to have a look. So, that is an example of one with a break out, or I don't know what we should call it. So, when do we do this? So, the job gets submitted, right? So, we're gonna use either the released to Engineering in the shop, the ERF, which are both the starts. It then comes into Engineering. The route is, then, the first step. Or you go put it in Pipeline first, and to move and res Powell? Sort of. Sort of, yeah. this is where the flow comes in. I guess when it goes from uncategorized to evaluating we're gonna have to add a tab in here for building the route. Okay perfect and you want that at the top on the production schedule pipeline. Yeah okay and we can't click and drag these. Try I don't think yet not okay I mean that definitely is something that we can do I just haven't gotten to it yet. And I can't scroll to the right so with it there's the rest of these are there. You should be able to yeah. Yeah I can yeah sorry. This is all new you know just exploring. Yeah so you've got t-sharp, a-sharp combined. Cool. Thank you I'll add another one for human assets. What do you want to add? I know people don't like being called assets but what do you call humans? Retards. People? Well no you said it but yep. Programming queue and the other ones yeah so the other two were where they took come if that's okay. Does the layout work I guess? Sorry I'm just. Yeah cool. I think it works in theory. Okay. I'm hoping okay. So shop floor overview um I mean we're going to have a lot of jobs. So I don't know if having the cards like this is the stations right? No these are stations correct? If you click into them you'll see that again they don't have all of the detail yet but this was one of them. You're having them as um cards might be a bit there's going to be too many cards I think more of like a list in order of when they're supposed to run would be better what about the way that we have some of the other ones where they're all displayed but you can filter along the top yeah right this just is going to be too many yeah yeah absolutely so again i can't actually remember the exact screen names but the one not the schedule but the could be the pipeline yeah that's the one yeah when you've got a shop t shop at the bottom and all the pms you can very quickly filter by the different criteria and that works uh where you were a second ago uh the schedule also has some filtering but before if you click two back cool um yeah i like how you tap to start so this is pretty cool okay i'm starting it now yeah um and then the handoff to the next station yeah i think that's awesome yeah that's great cool um just a question would that be manual on the on the entering of those items they would key it in on the floor right okay i have added a job it hasn't been built yet around making it a text entry so you don't have to click plus plus plus because it would take too long to add all the parts i'm assuming you could have many you know yeah oh and have done it okay brilliant i mean i knew i'd done that i just forgot that i'd done that oh you can dictate too yeah so it's it'll be ultimately you probably want to run this on a large ipad type of thing so that you get the functionality of the physical hardware like the audio and then of course the larger screen size is needed generally for this type of thing it's it doesn't work i can save how much money i'm going to pay on these things or buy i can 15 year ipads cool um happy days so then those are the stations the scheduler versions yeah um and this doesn't have scroll that way so uh that's the end that is the end i've made it full the screen i just haven't done it for all of them yet basically it says it'll it'll fit to the width of your screen um and so if it goes on hold okay you can't do that reschedule drag to reschedule yes okay see if you can do that now no no okay hold on one second the shop guy today i see it's the ibm colors hey give a what you have to say power colors nice if you quickly go back to engineering and then the pipeline then you should be able to see that these are drag and droppable now which they are great that's working brilliant see it takes hours to make things change and do them cool cool cool cool you know you can automate this whole thing eventually if you had robots doing the build on the floor it would literally just step through it and automatically do it all it's bonkers yeah if we save so much money i might be able to afford you and then i'll just hire you to come and automate our shop the system that you've built can only be extended further to add the doing of the tasks and the work that is in here if there were some basic tasks repetitive ones etc it could automate those like then have you heard of lights out chief technology obviously wonderful have you heard of lights out basically it's factories that run with a light switched off at night because they obviously don't need them so there are some you know you all know your business better than me but any fabrication tasks that were repetitive or didn't need specific things could be automated okay dude we're 15 minutes from the are we 15 minutes out from the demo is it 15 or 45 i'm not quite sure that all right it's 15 yeah okay so are you going to be able to help with some of the narration because i'm only really able to just click through the screens and explain what's here yeah it will be collaborative don't worry okay i think you're stressing more we're not like corporate so what is this ship schedule so it's what you sent me around quote ad shipping these are all the items that need to ship or be shipped and that's why i said there was a lot yeah we have to figure that out yeah and most of these i think was old data that i sent you because i just downloaded the old sheet which had everything all the archive stuff as well okay so most most of this should have been shipped already okay so again i just didn't have the context there so i mean yeah there's a thousand jobs and look almost all of them needed to be shipped in theory and and it's it's going to be really easy because i think what we're going to do is we're going to and i say really easy it's really easy because you're a genius but um once we get the erp side but like the architectural pm side it's actually going to be a breeze what i'm what i'm we're still going to be in a small um spectrum so we need to figure out the how we load that data in to update that um so the project managers can get that the same way we updated now um and i know i'm getting ahead of myself but i think phase not one can still include this yeah isn't the you will you will ultimately i would recommend we decide the phases based on risk it's as simple as that what could we do collectively if something breaks i mean we'll be look it doesn't even matter we'll be testing this before we run it out you know roll it out as the only option as you said we're running so fast right now i mean two days ago we wouldn't even well there hasn't been any there's it's 8 30 and on monday morning and where there's only been a weekend in between so yes i mean effectively no business time has passed um is there anything else you want to show me uh just the bottom ones i have added the menus but obviously they will follow i just i didn't really want to sort of finish on a damp squid by going oh the bunch the rest is just dead what should we finish on or i mean does it even matter would you guys just sort of chat about it it's going to be engineering and the shop this is where the main conversation is going to be okay the rest is we're going to add it because it's easy to add it's engineering in the shop and it's going to be the schedule and the efficiencies the efficiency is one i mean i love this if you log an efficiency event i was supposed to do this many i did this many did it you submit entry it's uh that's you know and then if i can get reports out of that if you go back to that i i click it says click on the bottom there and i suggest cause when you put text in it will or it'll it'll recommend based on what you put in yeah that that's what you need to add okay didn't say i'll go yeah machine break down yeah ah okay i'll have to fix that i think it's because i probably yeah it's big okay and i think just give me a second okay the scheduler drag and drop should now also be working just a very important point when i make updates the whole site basically rebuilds from scratch so you do need to hard refresh the page to see the the updates okay is that going to be always well it is but it normally takes about a minute and we would only do one update like once a week month you know once it's stable so it keeps telling me i need more decimals he's in a valid value and you have two nearest values or two for no one uh put 4.22 or something again i'll probably okay i'll have to fix uh just put in four maybe a 4.21 is fine so it doesn't like oh wait it's it's got it's got to be a real if you planned i'll double check but it's basically there's logic built in where the actually the actual can be more or less than the plan of course yeah so it doesn't make sense yeah okay okay but the two ones that you mentioned is engineering and shop that's all good schedule yeah this is going to be no we can no i still can't try no i see it has not done that okay it did not okay i did it too quickly i mean we were actually physically in the call while it was building and then deploying while we were demoing so maybe we shouldn't do that too often i'm not going to do it from now i don't want to blow it up okay my hands will be cool uh okay make status and i know that i can click it here but it will be totally just click that right and that is on shop scheduler i'm not going to do any powerpoint no sales pitch no like look at all these reasons and things and principles and governance and everything i'm just gonna go hi what do i say we spoke on friday or i'll just go okay cool then i'll say who you are yeah that's perfect i'll just say hey we we did you know we did some work what over the weekend i don't want to say so paul really knows uh drew and colin are going to be fresh colin knows i was asking him really random questions on sunday for data and he's like i'm guessing this is what to do with that so they know we've been working but um i'll probably have a bit of a personal interest where people know that the level of trust that i have we have with each other because i think that the trust portion is can't be as with me honestly because yesterday i i talked about why one of these podcasts i did they got they were pushing me on how i make decisions and like at the end i was like i base it purely on trust yeah well a hundred percent trust absolutely and it's also the only way that you can do it at speed otherwise you spend your whole time verifying and never actually get anywhere so is it worth i never got five minutes you maybe need a little quick break is it worth me explaining it all just a little bit about how and the tailoring and then how this is the upside down because yeah i think paul will want to know that probably true yeah okay because i think it's quite important i mean ultimately we're only doing this because it will give you the highest level of critical advantage competitive advantage that that's the reason otherwise it's just another system and it's scalable and yeah everything and i'm going to record the meeting as well please do yeah because we'll definitely want the notes i'm gonna see you in six minutes yeah perfect catch you now bye jwm just spoke with chris the other speaker is matt and we were discussing the pre-demo capabilities and features some we have updated and we'll come back to that shortly

</details>