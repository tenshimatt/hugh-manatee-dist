# JWM Demo — Infrastructure Reference

## LiteLLM Gateway (LIVE, tested)
- Public: `https://jwm-ai.beyondpandora.com`
- Internal: `http://10.90.10.23:4000`
- JWM virtual key: `sk-vwrcwMBaJjdNI_Lbv9ZPbA`
- Admin key: `sk-admin-1234` (on CT 123)
- Models available: `anthropic/claude-sonnet-4-6`, `mistral-small3.2:24b`, `qwen3-32k:latest`, `gpt-oss:20b`
- Limits: 60 rpm / 100k tpm / $50 budget
- Host: CT 123 (`ai-gateway`), config `/opt/docker/litellm/`
- ✅ Claude works, ✅ Ollama works

## Frappe ERPNext (IN PROGRESS — backend agent still running)
- Host: CT 171 (10.90.10.71)
- Existing site preserved: `frontend`
- New site target: `jwm-erp.beyondpandora.com`
- Backend container: `frappe_docker-backend-1`
- Port 8080

## Next.js Demo Shell (IN PROGRESS — shell agent still running)
- Local dev: `/Users/mattwright/pandora/jwm-demo/shell/`
- Target deployment: CT 171 alongside Frappe, or sibling CT
- Target URL: `jwm-demo.beyondpandora.com`

## Routing
- Traefik: CT 103 (`/etc/traefik/conf.d/proxy-*.yml`)
- Cloudflared tunnel: CT 113 (token-based, dashboard-managed)
- Wildcard Let's Encrypt cert for `*.beyondpandora.com`

## Estimate PDFs (DONE)
Location: `/Users/mattwright/pandora/jwm-demo/estimates/`
- `estimate-001-architectural-stair.pdf` (Music City Center, ~$260K, 27 items)
- `estimate-002-processing-brackets.pdf` (Southeast HVAC, ~$21K, 16 items)
- `estimate-003-mixed-facade.pdf` (Vanderbilt, ~$87K, 23 items)

## Brand (DONE)
- Logo: `/tmp/jwm-brand/logo-master.svg`
- Navy: `#064162`
- Gold: `#e69b40`
- Tagline: "A Better Way to Build Since 1938"
