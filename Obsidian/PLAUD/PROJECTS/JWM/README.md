# JWM Production System — Project Index

> **Monday 2026-04-20** — meeting with Chris Ball to replace Archer's Smartsheet proposal.

---

## Start here

| Doc | Use when |
|---|---|
| [[FEATURES_WORKING]] | You want to know **what actually clicks and responds**. Start here. |
| [[DEMO_GUIDE]] | You're about to run the demo. Narration, timing, fallback moves. |
| [[PRD_ADDENDUM_built_state]] | Bridges the PRD to the running demo. Mapping table. |
| [[JWM_Production_System_PRD_v0.2]] | The formal PRD. The contract basis. |
| [[REBUILD_GUIDE]] | How to recreate this whole thing from scratch. |
| [[STACK_INVENTORY]] | Where everything lives. Credentials pointer. |

---

## Live URLs

- 🎯 **Demo:** https://jwm-demo.beyondpandora.com
- 🛠 **ERPNext:** https://jwm-erp.beyondpandora.com (`Administrator` / `JWMdemo2026!`)
- 🤖 **AI Gateway:** https://jwm-ai.beyondpandora.com

## Demo content (drop into the demo)

- [[demo-content/estimate-001-architectural-stair.pdf]] — **hero demo** ($260K Music City Center)
- [[demo-content/estimate-002-processing-brackets.pdf]] — Processing division ($21K)
- [[demo-content/estimate-003-mixed-facade.pdf]] — mixed ($87K Vanderbilt)

## Archer's doc (for reference)

- `JWM Phase 1 Deliverables. 4.14.26.pdf` — their 20-page Smartsheet proposal

---

## Doc tree

```
JWM/
├── README.md                       ← you are here
├── FEATURES_WORKING.md             ← what clicks
├── DEMO_GUIDE.md                   ← Monday narration
├── PRD_ADDENDUM_built_state.md     ← built vs PRD
├── JWM_Production_System_PRD_v0.2.md
├── REBUILD_GUIDE.md                ← rebuild from scratch
├── STACK_INVENTORY.md              ← every component
├── JWM Phase 1 Deliverables. 4.14.26.pdf  (Archer)
├── jw_logo_blue_gold.1.svg
└── demo-content/
    ├── estimate-001-architectural-stair.pdf
    ├── estimate-002-processing-brackets.pdf
    ├── estimate-003-mixed-facade.pdf
    └── jwm-logo.svg
```

---

## Status snapshot (2026-04-17)

- ✅ Demo URL live + tested
- ✅ ERPNext seeded with 20 WOs, 12 Workstations, NCR/CAR/RMA/Overrun
- ✅ 4 AI flows wired to real Claude (chat, estimator, NCR, anomaly)
- ✅ Voice in/out working (ElevenLabs + Web Speech API)
- ✅ JWM branding throughout, 20 real projects in marquee
- ✅ Public TLS via Cloudflare + Traefik wildcard
- ✅ Authentik SSO wired (stub fallback available)
- ✅ Reset demo button + ⌘+Shift+R shortcut
- ✅ Demo runbook + rebuild docs in this folder

Ready for Chris.
