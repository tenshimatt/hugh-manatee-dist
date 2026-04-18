---
title: "ERP Implementation Strategy: Custom Development vs Native Build Options"
date: 2026-04-17
time: 18:40
duration_mins: 8
tags:
  - voice-note
  - plaud
  - jwm
source: plaud
project_folder: "JWM"
---

# ERP Implementation Strategy: Custom Development vs Native Build Options

**Date:** 2026-04-17  
**Time:** 18:40  
**Duration:** 8 minutes  
**Pipeline:** Whisper large-v3 → Claude Haiku 4.5

---

# BUSINESS INTELLIGENCE NOTE
**Recording Date:** 2026-04-17 | **Time:** 18:40

---

## Executive Summary

A technical architect presented two strategic options for building enterprise software infrastructure: native custom development or leveraging Frappe, an open-source ERP platform with built-in AI capabilities and biometric authentication. The discussion emphasised data sovereignty, security risks from cloud hosting, and the critical importance of implementing an AI gateway to prevent unauthorised data exposure. The speaker advocated strongly for on-premises hosting with local data management, citing recent security breaches and the imminent release of powerful AI models that should not have access to company data.

---

## Key Discussion Points

- **Two Primary Development Pathways Presented:**
  - **Option A (Native Custom Development):** Build functionality from scratch. Requires specification of basic functionality; speaker can size requirements and calculate costs in credits/tokens for AI components. Acknowledged that AI development carries costs but these are not prohibitive.
  - **Option B (Frappe Open-Source ERP):** Full enterprise resource planning platform with integrated stock management, accounting, CRM, passwordless biometric authentication, and AI-native design. Described as providing ~70% of core functionality immediately, with customisation available. Speaker noted it is so feature-rich that removal of unnecessary modules is more practical than addition of features.

- **Hosting Architecture & Data Sovereignty:**
  - Cloud hosting (AWS and competitors) costs 30–50% more than self-hosted solutions
  - Strong recommendation against cloud hosting due to data security risks and emerging AI model capabilities
  - Anthropic's "Mythos Preview" model described as so powerful it will not be released publicly; characterised as "literally a weapon"
  - Data sovereignty is critical: "you don't want your data on the Internet"
  - Local hosting is now technically straightforward and not complex as commonly perceived

- **On-Premises Infrastructure Options:**
  - Distributed redundancy possible: two servers in sync across multiple office locations, encrypted over internet
  - Can achieve "literally a hundred percent uptime"
  - Server described colloquially as "a box"
  - Speaker has implemented on-premises data management for their own organisation

- **Nextcloud as Microsoft Stack Replacement:**
  - Open-source platform replacing entire Microsoft Teams ecosystem (chat, file storage, office applications, video conferencing)
  - Optional; can integrate with existing Teams if preferred
  - Part of broader stack the speaker can demonstrate

- **AI Gateway as Critical Infrastructure:**
  - Described as "paramount" and "right over that"
  - Prevents unauthorised data exposure through employee use of free/public AI tools (e.g., ChatGPT)
  - Example cited: executives using free ChatGPT versions inadvertently uploading company data to the internet
  - Gateway allows selection and integration of multiple AI models without training on company data
  - Biometric and key-based authentication (no passwords) across entire network
  - Unified security model across mobile, laptop, office, and remote connections (Starlink, fibre, etc.)

- **Security Landscape & Recent Incidents:**
  - Standard Bank breach cited as recent international news event
  - Emphasis that security breaches result in reputational damage ("you don't want to be in the news")
  - Password-based authentication insufficient against current threat models

- **AI Model Selection & Integration:**
  - No requirement to use only latest models (e.g., "Fraud Opus 4.7")
  - Multiple basic services available that do not train on user data
  - Models can be plugged into AI gateway for flexible selection
  - Copilot dismissed as inadequate ("not even in the same universe")

- **Demonstration & Proof of Concept:**
  - Speaker has existing infrastructure physically running and available for demonstration
  - Frappe platform can be shown on screen with all modules visible
  - Frappe configuration not yet advanced due to its vast feature set
  - Comparative analysis possible between current state and proposed solutions

---

## Decisions Made

| Decision | Owner | Conditions/Notes |
|----------|-------|------------------|
| Pursue demonstration of proposed stack | Speaker (Technical Architect) | Requires scheduling call with more time; visual walkthrough of infrastructure planned |
| Evaluate Frappe as primary ERP option | Implied (Recipient/Chris) | Conditional on demonstration; speaker to show all modules and configuration options |
| Prioritise AI gateway implementation | Speaker (Strong Recommendation) | Framed as non-negotiable; critical for data security |
| Consider on-premises hosting over cloud | Implied (Recipient/Chris) | Recommended based on cost (30–50% savings) and security rationale |

---

## Action Items

| # | Action | Owner | Due | Priority |
|---|--------|-------|-----|----------|
| 1 | Schedule detailed demonstration call with visual walkthrough of proposed stack (Frappe, Nextcloud, AI gateway, on-premises architecture) | Speaker | TBD (to be scheduled) | High |
| 2 | Prepare specification of basic functionality requirements for custom development cost estimation | Recipient (Chris) | Before demonstration call | High |
| 3 | Review Frappe platform modules and features on screen during demonstration | Speaker | During scheduled call | High |
| 4 | Compare current infrastructure/processes against proposed solutions | Speaker & Recipient | During/after demonstration | High |
| 5 | Evaluate AI gateway implementation requirements and integration points | Speaker | TBD | High |
| 6 | Assess on-premises hosting feasibility (redundancy, distributed locations, encryption) | Speaker | TBD | Medium |
| 7 | Investigate Nextcloud as Microsoft Teams replacement option | Speaker | TBD | Medium |

---

## People & Organisations Mentioned

| Name | Role/Context | Relevance |
|------|--------------|-----------|
| **Chris** | Recipient/Decision-maker (implied executive or senior stakeholder) | Primary audience; responsible for evaluating and deciding on infrastructure approach |
| **Paul** | Colleague/Associate of Chris | Referenced as someone who should be shown the proposed solutions ("Paul is honest Letty AD show you the stuff") |
| **Speaker** | Technical Architect/Solutions Provider | Presenting infrastructure options; has built and deployed similar systems; advocates for data sovereignty and on-premises hosting |
| **Anthropic** | AI Model Developer | Developing "Mythos Preview" model; decision not to release publicly cited as evidence of model power/risk |
| **Standard Bank** | Financial Institution | Recent security breach cited as cautionary example (international news) |

---

## Key Figures & Data

| Metric | Value | Context |
|--------|-------|---------|
| Core Functionality Coverage (Frappe) | ~70% | Immediate availability; remaining 30% requires customisation |
| Cloud Hosting Cost Premium | 30–50% more expensive | Compared to self-hosted solutions (AWS and competitors) |
| Uptime Target | 100% | Achievable through distributed redundancy architecture |
| Recording Date | 2026-04-17 | Timestamp: 18:40 |
| Standard Bank Breach | Recent (international news) | Timeline: unspecified but recent enough to be current reference point |

---

## Risks & Dependencies

| Risk/Dependency | Description | Severity |
|-----------------|-------------|----------|
| **Data Exposure via Employee AI Tool Use** | Executives/staff using free ChatGPT or similar tools inadvertently upload company data to internet; cited as common occurrence | High |
| **Anthropic Mythos Preview Release** | Powerful new AI model may be released; implications for data security if company data accessible to such models | High |
| **Frappe Feature Complexity** | Platform is so feature-rich that configuration requires removal rather than addition of modules; risk of over-engineering or scope creep | Medium |
| **Distributed Infrastructure Synchronisation** | Multi-location on-premises hosting requires reliable encryption and sync mechanisms; dependency on network reliability | Medium |
| **AI Gateway Integration Complexity** | Requires careful selection and integration of multiple AI models; dependency on availability of models that do not train on user data | Medium |
| **Organisational Change Management** | Transition from cloud/Microsoft stack to on-premises/Nextcloud requires staff training and process change | Medium |
| **Specification Clarity** | Recipient (Chris) must articulate detailed functional requirements for accurate cost estimation and solution design | High |

---

## Follow-Up Questions

1. **Specification & Scope:** What are the specific functional requirements Chris's organisation needs? (Required for custom development cost estimation and Frappe configuration scope)

2. **Current Infrastructure:** What is the current technology stack and infrastructure that will be replaced or integrated with?

3. **Team Readiness:** Is Chris's team prepared to adopt AI tools? What is the current AI tool usage policy?

4. **Distributed Locations:** How many office locations require infrastructure redundancy? What are the geographic distribution and network connectivity requirements?

5. **Compliance & Regulatory:** Are there industry-specific compliance requirements (e.g., financial services, healthcare) that affect data sovereignty and hosting decisions?

6. **Budget & Timeline:** What is the budget allocation for this infrastructure project, and what is the implementation timeline?

7. **Nextcloud Adoption:** Is there appetite to replace Microsoft Teams stack entirely, or should integration with existing Teams be prioritised?

8. **AI Model Preferences:** Which AI models or model families does the organisation prefer or require? Are there specific use cases driving AI tool adoption?

9. **Frappe Customisation Capacity:** Does the organisation have internal development capacity to customise Frappe, or will external support be required?

10. **Mythos Preview Implications:** What is the timeline for Anthropic's Mythos Preview release, and how should this influence current infrastructure decisions?

---

## Next Steps

1. **Immediate:** Chris should document functional requirements and share with the speaker to enable accurate cost estimation and solution sizing.

2. **Short-term (1–2 weeks):** Schedule detailed demonstration call with speaker. Allocate sufficient time for visual walkthrough of:
   - Frappe ERP platform (all modules, configuration options)
   - Nextcloud stack (Teams replacement capabilities)
   - AI gateway architecture and integration points
   - On-premises hosting infrastructure (redundancy, encryption, distributed sync)

3. **During Demonstration:** Conduct comparative analysis between current infrastructure/processes and proposed solutions. Identify gaps and customisation requirements.

4. **Post-Demonstration:** 
   - Evaluate Frappe as primary ERP option based on feature coverage and customisation effort
   - Assess on-premises hosting feasibility (cost, redundancy, geographic distribution)
   - Determine AI gateway implementation approach and model selection strategy
   - Evaluate Nextcloud adoption vs. Teams integration

5. **Decision Point:** Based on demonstration and evaluation, Chris should make go/no-go decision on proposed infrastructure approach. If proceeding, initiate detailed project planning (budget, timeline, resource allocation, change management).

6. **Risk Mitigation:** Regardless of infrastructure decision, implement AI gateway immediately to prevent unauthorised data exposure through employee use of public AI tools.

---

**Note:** This recording reflects a technical architecture discussion with strong advocacy for data sovereignty and on-premises hosting. The speaker's recommendations are driven by security concerns (recent breaches, emerging AI model capabilities) and cost considerations (cloud hosting premium). Chris should evaluate recommendations against organisational risk tolerance, compliance requirements, and technical capacity before committing to any approach.

---

<details>
<summary>Raw Transcript</summary>

So, I can actually do you even one better, well, you can choose. So depending on the breadth and depth of your requirements, just honest answer, there are two options. One, in the past, custom dev was like the antichrist. You would always try not to do custom dev for all those millions of reasons. That has flipped on its head completely. Yeah. So two options and you can't make this stuff up. So option A, of course, we can build it natively yourself. Absolutely no question there. We would, of course, want to go through, you know, you would need to just explain to me what the basic functionality is and I can spec it, size it. I can basically tell you how many credits and tokens and all that it would actually cost to build because the AI stuff isn't free, but that's not a limiting factor, it's just so that you know. And then option B, depending on what your scenario is, there's actually an open source software package called Flow. It's called Frappe, which you can have a look at. It is a full ERP with stock management, with accounting, CRM. If you can name it, it's built into this thing. And it's open source, so you could, we could take it and then basically use that as a base and then modify and adapt it to whatever you want. I mention that because it's got all of the passwordless biometric authentication built in. It's got AI native, you know, design. You can skin it. You can do whatever you like. So between those two things, at a minimum, you're really like a good 70% of the way there in terms of core functionality. And then from there, you've always got sort of choices. The one, of course, you could host with AWS. And look, I'm not trying to be a scam-monger here. That's not my aim. But what people don't often tell you is that AWS and the others are actually at least 30 to 50% more expensive than hosting yourself. That is just a cost thing. But honestly, hand on heart with the way that this stuff is going, and especially, I don't know if you've seen, but they're about to launch Mythos Preview. Have you heard of that? Very simply, the new model that Anthropica's got is so powerful that they've decided to not release it to the public because it's too powerful. Like, it's literally a weapon. So, like, you don't basically want your data on the Internet. You want your data sovereign and all that stuff. And your data won't be huge. There's really very little reason why you can't host this stuff locally nowadays. And it's not remotely as complicated as people might think. The server is a word for a box. And you can have two boxes that keep perfectly in sync, you can have one in the one office and one in another office distributed over the Internet, you know, encrypted and all that stuff. there's a myriad of things that we could do to give you literally a hundred percent uptime plus that the key thing is that you desperately do want your data on sites if you can because it only takes one event and you are dead it's there's no do-overs anymore in this new world so I wouldn't say paranoid but like I've brought all of our data on sites we've got something called next cloud which is also open source it's a full replacement for the entire Microsoft team stack from chats to file storage to the office apps to video conferencing you name it again you don't have to use that you can plug into teams or whatever you use but my kind of points I can show you on a call like when we've got a bit more time I'll visually show you the stack this is what this 70 yeah yeah absolutely absolutely I mean I'd love to work with you you the weird answer honestly I literally cannot think of something that I almost don't already have physically running that I can show you on a screen or we could build you know as and when you need and assuming your team is going to use AI tools at some point it's all bolts into these you know these various things natively okay very much so I mean no disrespect to copilot but it's it's just not it's not even in the same universe and you don't have to just quote use you know fraud opus 4.7 the new thing that is categorically not what you need to do there are a bunch of basic services out there that do not train on your data and they plug in a whole lot of different models you know the ones that you choose and you could plug that into your your AI gateway but that this AI gateway thing Chris is if I can only sort of persuade you to do one thing it would be that it is it is paramount and it's right over that the companies have this yeah I mean thinking aloud have you ever seen one of your you know execs use a free version of chat GPT about a year or two ago you know in error or intentionally that data is on the internet effectively so that's why this is so important and again I'm not not you know saying anything untoward it's it's just just the way it is exactly it doesn't matter about that basically the sort of in a couple of sentences what I've built is exactly what you would typically use and that's why I built it this way whether it's on your mobile phone or your laptop or anything your entire network is it's it's just one big private network no matter what development is it's just one big private network no matter what development you're on where you are if you're on Starlink fiber your phone in the office it's all the same security it's all encrypted it there are no passwords at all that exist in this world it's all biometric and keys and it's the only way that you can actually protect yourself against the models that are out there I mean standard bank was hacked last week okay standard bank like it's made international news so you don't want to be in the news um yeah but cool sounds exciting I mean okay yeah I know Paul is honest Letty AD show you the stuff because if then you can compare what you were doing now and I mean this frappe thing I took me a long time to find it I can show you it's in a screen I can show you all the modules you can see all the screens I haven't gone any further in configuring it because it is so vast that it's so that you would need to remove half the features to make it suit you rather than add. You could run a global telco on this thing. It's absolutely bananas, like it's bananas. It's bananas. Flexible around you, totally. I mean, this stuff takes priority because work is second at the moment and yeah.

</details>