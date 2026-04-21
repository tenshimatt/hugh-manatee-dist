---
title: Server Migration Plan — JWM on-prem + GPU
status: Draft
updated: 2026-04-21
owner: sovereign.ai
plane: JWM1451-116
---

# Server Migration Plan — JWM on-prem hosting + local AI GPU

Chris's 2026-04-20 ask:

> "What you could install is an AI GPU. It's basically the card that you have on your server. And then all of your AI processing happens locally on site."

Chris mentioned JWM has a ~130 TB server on-site already. This doc is the plan to migrate today's Beyond-Pandora-hosted demo infra to JWM-owned hardware, with optional local GPU for LLM inference.

## Today's hosting (Beyond Pandora, Matt's lab)

| Role | CT | Host | Specs |
|---|---|---|---|
| Shell (Next.js) | CT 120 | Proxmox 10.90.10.10 | 4 vCPU / 8 GB / 40 GB |
| ERPNext (Frappe 15 Docker) | CT 171 | Proxmox 10.90.10.10 | 6 vCPU / 16 GB / 200 GB, MariaDB + Redis |
| Authentik SSO | CT 105 | Proxmox | 2 vCPU / 4 GB |
| LiteLLM gateway | CT 123 | Proxmox | 2 vCPU / 4 GB |
| Traefik / Cloudflared | CT 103 / 113 | Proxmox | minimal |

All LLM inference routes out through LiteLLM to Anthropic / OpenAI. Whisper transcription is OpenAI.

## Target JWM-side hosting

### Option A — physical migration (recommended)

JWM owns the hardware. Matt's lab is a dev/staging + failover peer.

1. **Audit existing 130 TB server** — CPU generation, RAM, existing workload, hypervisor (VMware / Proxmox / bare-metal Windows Server?), free disk.
2. **Provision 5 LXC containers** (or VMs if VMware) matching the specs above. Attach 500 GB from the 130 TB pool for ERPNext growth.
3. **Restore pipeline**: ERPNext database backup → MariaDB on the new CT. Shell and ancillary services deploy fresh.
4. **DNS cutover**: `jwm-erp.jwmcd.com` + `jwm-app.jwmcd.com` point at JWM's edge. Beyond Pandora instance becomes read-only staging.
5. **Backup topology**: nightly Frappe DB backup → JWM NAS + encrypted off-site copy (AWS S3 Glacier / Backblaze B2).

### Option B — managed hosting (fallback)

If JWM's server is too old or committed elsewhere: spin new bare-metal at a regional colo (Nashville / Atlanta). ~$300–500/mo per host, 99.99% SLA.

### Option C — Beyond Pandora continues

Keep Matt's lab as production indefinitely. Simplest, but JWM doesn't own the stack end-to-end — violates the sovereignty thesis.

## AI GPU — local LLM inference

### Why

- Eliminates per-token API cost for John chatbot + future AI features
- Shop-floor data never leaves premises (supports the sovereignty story)
- Zero dependency on Anthropic / OpenAI availability
- Offline operation possible

### What

| Card | Price | Perf for us | Verdict |
|---|---|---|---|
| Nvidia RTX 4090 (24 GB) | ~$1,800 | Runs 13B-30B models at interactive latency | Good dev target |
| Nvidia RTX 6000 Ada (48 GB) | ~$7,000 | Runs 70B quantised at interactive latency | **Sweet spot** — quality comparable to Claude Sonnet for shop-floor queries |
| 2× RTX 6000 Ada | ~$14,000 | 405B quantised → Claude Opus-equivalent for on-prem reasoning | Bleeding edge; wait for real need |
| Nvidia H100 (80 GB) | ~$30,000 | Overkill; not recommended for JWM's scale | No |

### Stack on the GPU host

- **Inference**: Ollama (simplest) OR vLLM (higher throughput at scale). Both sit behind LiteLLM — existing chat code requires zero change.
- **Models to start**: `llama-3.3-70b-instruct-Q4_K_M` (shop-floor quality), `qwen2.5-coder-32b` (code / structured-output), a small embedding model for future RAG.
- **Whisper** for transcription: `whisper.cpp` or `faster-whisper` — local replaces OpenAI for the PLAUD pipeline + future shop-voice queries.

### Safety gate

Keep the LiteLLM gateway (CT 123 today → whatever CT on JWM host) as the single egress. Gateway enforces:
- PII/financial redaction before any cloud call
- Cost caps per API key
- Full audit log of every prompt
- Model routing: local-first, cloud-fallback on overflow

## Cutover sequence (8 weeks)

1. **Week 1** — audit + hardware order (GPU if going local). Network work (VLAN for the ERP subnet, TLS cert, tunnel back to Matt's lab as warm standby).
2. **Week 2** — provision CTs/VMs on JWM server, restore ERPNext to new host, DNS target sovereign.ai staging URLs.
3. **Week 3** — parallel run: Beyond Pandora stays primary, JWM-host is shadow. Compare outputs for a week.
4. **Week 4** — flip DNS. JWM instance becomes primary. Beyond Pandora becomes read-only disaster recovery. Cut over during a weekend maintenance window.
5. **Weeks 5–6** — install GPU host if in scope. Deploy Ollama + Llama 3.3 70B. LiteLLM routes 80% of John's queries to local.
6. **Weeks 7–8** — monitor, tune, document hand-over runbook for JWM IT.

## Costs

| Item | Capex | Opex/mo |
|---|---|---|
| 5 CT/VM footprint on existing server | 0 | 0 (already paid for) |
| RTX 6000 Ada GPU (optional) | $7,000 | $60 (extra power) |
| Off-site backup (Backblaze B2, ~500 GB) | 0 | $3 |
| Nashville colo if Option B | 0 | $400 (pair of servers) |

## Open questions for Chris

1. What OS / hypervisor on the 130 TB server today? Are we provisioning LXC / VM on Proxmox? ESXi? Windows with Hyper-V?
2. Is the server rack-mounted with 1G or 10G NICs? Fast disk (SSD / NVMe) or spinning?
3. Who at JWM administers the server today? We need a co-op partner for the cutover.
4. Cloudflare / Cloudflare Tunnel to Matt's lab remains OK as the edge, or does JWM want to terminate TLS themselves?
5. GPU investment — approved pre-Phase-2 or staged?

## Related

- [[deployment]] — current deploy topology
- [[../30-decisions/004-litellm-gateway]] — gateway rationale
- [[ha-active-active-plan]] — redundancy topology once on-prem
