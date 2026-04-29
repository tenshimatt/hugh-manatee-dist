---
title: "Spectrum Data Integration and Job Timeline Discussion"
date: 2026-04-21
time: 15:10
duration_mins: 20
tags:
  - voice-note
  - plaud
  - jwm
  - automagic
source: plaud
project_folder: "JWM"
---

# Spectrum Data Integration and Job Timeline Discussion

**Date:** 2026-04-21
**Time:** 15:10
**Duration:** 20 minutes
**Pipeline:** Whisper large-v3 → Claude Sonnet 4.5
**Classification:** This is clearly a JWM project meeting discussing Epicor integration, Spectrum data, and system development with a client, with mentions of the consultant's 'dark factory' (Archon) workflow tool being used to build the solution.

---

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

---

<details>
<summary>Raw Transcript</summary>

and then the other thing we need to figure out is how to get the spectrum data into the jobs so those are the three cool yeah look i mean i don't want to say we've gone fast another time but we've we've i think we've got plenty of time relative to how much we've done so far maybe this was my take but i don't know would you say yeah okay so this is the one and what you will see there's a very very long list of stuff but i think it's quite so you don't really need to worry about all of the the long list that just basically shows you all of the different things that we've built a thing is generally an api okay it really just means that if there's a screen or a button or a thing the api is the thing that we've built that actually connects to the back-end system to to work so we're actually building apis that that's kind of what it is what does api stand for application application programming interface it's a fancy weighing of way of saying the system almost has like a service that that waits for information and it'll have for example five fields first name middle name last name mobile address and if you send those five pieces of information it'll fit into it and it can go and get them and send them back so it's it's basically matching all the fields for what we want to get and what we send to get it but the the yellow block at the top is the more kind of important summary so yeah i try to make it simple for you to say if and when we get an export of epico it'll probably get us 90 of the way there and you won't have to worry about all the detail because i think you can get a bit lost in the detail i can get you an export because every live job in fact we do a dump from apple going to smartsheet every day i just didn't have the okay one drive access and i should have probably got it to you already that's cool so again uh so maybe just to say that is the thing that we need how and when we get it and the security and the mechanisms and all that maybe we need to spend a slight little bit more of time on that and work out how are we going to do that i'd prefer not to sort of email across something like that that's not ideal so that's just what we need to do is get kind of structured and i think right now i'm just peppering you with a million different things and i don't need to write a list of like it's yeah a list of like for example architectural you there's data that's from processing and architectural and engineering these data in the wrong places we need to just yeah kind of put instructions and this is what we're going to attack right now and they don't even start like on the easy stuff which i get safety safety is the one and done you can just knock it out yeah i know that's phase two but it would be like a small one you know no i tell you can you see my screen yeah okay so let's just slow down for five whole seconds this is really where everything is happening so if you see under done there's a long list of things and i'll cut you access to this so look there's no this is not a job that i'm doing for a client i'm i'm basically completely opening in kimono every nut bolt screw you'll get to see and more the reason to do it apart from transparency is i hope that you will learn a hell of a lot in the process not that i'm going anywhere i feel quite strongly of empowering everybody as part of the process so this is the thing and a couple of starters done these are already done and then you can see what we did and all this sort of techy stuff you'll see that everything you'll start to connect all the dots and see how all the words and the way the things are described all connect for example this came from the transcript and then i converted it into tasks from the transcript and now i've been being able to build so quickly is that we've given it really good quality information and memories and all that stuff and it puts it together so that's on the duns these are the ones we're obviously working on now and you'll see no surprise we are busy putting the data into the erp and then these are the there's not a lot okay they're 39 tasks but they will go quite quickly because some of them are blocked with the the missing data so that's not an issue it's just that it's more to evidence that this is how i'm actually building and evidencing what we've built it's not just a black box that you get at the end it's structured tasks um yeah so this is you know project management some of the names i don't know where you got the names from some of the name would be made up just because it needed to put something against them um and give me half another second i have mike okay i will yeah i haven't done much qc as you can probably tell let's do this one quickly okay so you can see this as well so on the left hand side let's just close them for a second this is this jw jwn project folder this is what you will basically get at the end in addition obviously to the to the system this is all of the building and planning and as you can see that there's look there's reams of stuff in here okay this is how this this this stuff works um we've got decisions okay i mean you can read pretty much everything in here is where all the data goes first and we create the plans and all of the documentation about how the system works what it is how it's architected everything you can imagine is documented in here and from here we then move into creating tasks based on the architecture and what we want and those go into that project management tool and then they get built and then the documentation for the build gets slotted in there if i get hit by a bus you take the documents that you see in here okay all of this stuff like data model for example and you would not one button but you can kill the people with one button on the door Order colocarly if you think that would be put on here in here you could start a CRT account and then subsequently you could build and replicate the entire system from this documentation that's why this is so important okay so i'll share this with you as well we must just we must actually maybe um okay i can't move it onto your server yet because i kind of need it in you know locally but i also want you to see five on the list if you got through the long list of numbers. A little bit of server maintenance is the wrong word but... Oh refresh, let's have a look. Yeah. In fact to that end there is something I can physically show you on the screen. Okay just we'll get to that in two seconds. So this is the documentation, then we move into tasks, then we actually use the tools to build and let me just see if I can... So I cannot find it right now. Okay there's basically a very complicated building, it's called a dark factory okay, it's just the name. It's the thing that allows us to build workflows that are used to build the system. So that's why we can do it so quickly. So I will basically give you a copy of that system when we get there. So you'll effectively land up with from Slack or if you prefer you can have and or both. In Slack you could have a channel for new bugs or features or you can have a button with a little form that's embedded in the system itself. Where someone can click, say what you want and it'll basically go through a bunch of steps and actually come out the other side and you know we'd build it that way. So you don't lose any context, that's the important bit. So it's whatever you actually asked for gets built rather than you tell someone who tells someone and then it's different and we've got to keep iterating. So that's one thing. Okay. I'll probably run only the second one then on Slack video. Cool. Then the next one to quickly show you... Oh let me just actually bring it up. One second. And we're keeping like obviously all processing files and all architectural files are going to be separate even though from the project management side. Like when I open the shop it becomes one but... Okay so that was another point. Okay let's tackle that quick. My recommendation and you should tell me almost just agree or disagree. I think that's why I asked about the menu. The menu is a really good logical way of breaking down and structuring your sequence and the hierarchy of what you do. So we know that there's a sequence and then we know that there's a hierarchy with the sort of exec dashboard or you know the management stuff at the top. What I would recommend and now I'm clicking on... Let me just show you that again. No man you're good. You're good. You're good. I like this. This is... It's like it's like catnip for me really. It's good. Am I sharing the right thing? Yeah. So we would have almost a folder or a sort of a thing for each of these things on the left and then each of the sub categories would be a page with its own features and requirements. So we could say let's deploy a new feature or an upgrade to the engineering line and we would be able to come straight into the exact page and we could describe whatever we wanted to do and it's a direct correlation between the actual thing and what we're going to do. So it's not just random documentation sort of trying to float all over the place. So that's a way that I recommend we'll structure the tasks in the board and the ones that are done are done but I'll clean it up and basically nest them under each other so that you can see per thing how it was built and then they'll most likely be almost like a generic bundle for sort of the core stuff, the foundations, the plumbing. Does that make sense? When you drag and drop something to someone it doesn't disappear from that card. Aha see so what you just described now in future you will go into Slack and say ideally paste the link of the page you literally click this, copy so copy paste in Slack on this page this xyz doesn't work enter and that'll create a task into the project management system and then again we can we'll work on how we automate or just manually trigger the thing to go and build. It's a bit more to do around that. It'll build the feature and then you can iterate no I don't my sweetheart it's over there somewhere. Yeah but then you'll have a direct correlation between when you log the thing in Slack. And then you'll have a direct correlation between when you log the thing in Slack linked all the way through the task to the basically when it builds something it commits it to git fancy word of saying it copies it to a code repository and that's where you get that that history so if you don't like it you could revert one back or you can keep it and then make another you know you can keep iterating kind of thing but every single change is deployed separately. Once we get that pad maybe we can run through one together just to make sure that I'm doing it right. Yeah I know I'm gonna show me one so I'll get it done but when you're telling me no no no listen bump the brakes we are not lacking speed at the moment so I think we're good on that. I'll quickly show you one more thing because it is quite important well for me anyway I mean me and my boring security stuff this is something called tail scale and it's a very it's an application that basically it creates a very secure tunnel between the two places so if you would install this little thing on your server whichever one it is I will then accept on my side and then we will have a physical tunnel like your server will show up here in this list as a thing that I can get to if you so choose I will then be able to log on of course very carefully and then just kind of give you a you know report summary of what I see what we could do differently on the server it's got to be on the actual machine where the stuff is if you put it on your laptop then I would only be able to get to a laptop which is probably not where I want to be if I can see my screen yeah yeah go for it go for it so yeah I'm almost doing the shortcuts always called server shortcuts yep so where would I talk okay is there how are all those servers created those are virtual servers I'm guessing let me stop sharing anything on my screen this is a map of our servers all right that big black one at the top is that is that in your office somewhere yeah so that one 192.168.2.2 yeah so no I can't do that so quick Oh yeah Between the first one and the first one no in simple terms that one 192.168.2.1 whatever it was I would need access to each of those servers the physical ones that you there are on the screen not the reams of ones that are on your on your screen there if you gave me access to one or more of those physical ones I should depending upon how it's set up be able to jump to the other ones and have a look that's a lot of freaking servers though man that's a lot a lot lot hard copy so you can get an idea of how fucked up the system is well i'm just thinking you run erp spectrum and smart sheets which all or some of that lives in the cloud that's a hell of a lot of stuff to maintain and you know more is not really better less is kind of better well that's what i figured too but there are so much redundant shit in there i'm really not happy about it i think they just yeah really simply less is more from a security and management point of view and stuff that stuff that just sort of people normally don't want to delete stuff because they're not quite sure how it works or what it is that that's why it stays but that's yeah so after our meeting yesterday i encourage everyone to get called and also i said to um paul about the command line problem which is that he's got his mind spinning and everything um your family maybe used the wrong word but i think it's an um and we are going to get started but at the same time i want to thank all of you for being here and for your for your full support and just making sure you continue to emigrate to go out and get your stuff so thank you to all of you if you guys have any questions you can always send them to me at edwards underscore lights llm gateway we can install that if you give me access to a server i can as part of this bundled in yeah i'll deploy lights llm for you and set it up it will be non-intrusive so it will not blow up the business we can on a case-by-case basis you can get paul yourself as the first guinea pigs to basically point your thing at lights llm you'll start to see the logs and all your prompts going through remember that you will see them so don't forget to subscribe okay for what you put through there and once you're comfortable we can discuss with your it team the changes that need to get made to sort of force everyone's stuff to go through there so don't get clawed yet we'll rather the way to do it is you get one business account and in fact yeah one business account for anthropic or clawed actually doesn't matter which one because you're not going to really be doing like hardcore dev stuff on day one you can always get have both we get a clawed business account it's $20 a person a month minimum five people we plug that into lights llm no one gets the clawed keys right no one gets them they just get access to to the browser and all the rest is magically done in the background and managed and transparent and you can all log into lights llm and see all the logs you can see everything it's not that you won't be able to see it's that you don't need to manage clawed or any of the other stuff that's the beauty of it it's just simplified into just use it well this will manage your risk it'll restrict things in the right way it'll mask things it'll block things it'll show you your transparency on the costs because at the moment you probably don't have to worry about really have that much detail on the cost it'll show you how much you're using it who needs to use it more or less you can pick the appropriate model for various different teams and people to use etc etc etc so it's it's it's a very big part of what we do I've got to jump on a call them in one minute sorry to be rude that's fine cool sign for you you feel that length so I can just talk to you and start going through these processes and fix them yes yes yes yes we'll do how's the slack access coming is that possible I think an admin will need MIT thing so I mean I'll but in a day I'll tell you what we're going to do with slack okay do you guys not use it is that not your main chat app you could also give me access somehow to your team's environment you could create a user for me okay it's a team team's fine okay yeah it doesn't have to be slack that's just an example but if you create me a you know account a team in Microsoft it's if it's paid I mean it's probably like ten dollars a month or something perfect that's perfect and that will that'll also help because then I can push all the content directly into the your environment cleanly and all the rest of it and it'll also help because you could give me the right permissions at the right time to do your server work and set the stuff up amazing catch you in a bit cheers man bye

</details>