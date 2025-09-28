# 🔐 PANDORA/TENSHIMATT & SUPERLUXE CREDENTIALS OVERVIEW

## 🏗️ INFRASTRUCTURE SEPARATION

### 1️⃣ **PANDORA/TENSHIMATT/BEYOND PANDORA (90% Deployed)**
- **Primary Stack** - Main production infrastructure
- **Files:**
  - `.env.production` - Core Proxmox/n8n/Grafana configuration
  - `.env.pandora-extended` - Extended API keys and services
  - `env-manager.sh` - Management utilities

### 2️⃣ **SUPERLUXE (Company-Specific)**
- **Separate Stack** - Isolated company infrastructure
- **Files:**
  - `.env.superluxe` - SUPERLUXE-only credentials
  - `superluxe-manager.sh` - SUPERLUXE management utilities

---

## 📦 PANDORA/TENSHIMATT SERVICES

### Container Infrastructure
| Container | Service | Credentials |
|-----------|---------|-------------|
| 204 | n8n | Admin: Tenshimatt@gmail.com / wekged-febdet-0Nijmu |
| 201 | Ollama | Password: p=KEyRh3"1h3 |
| - | Proxmox PVE | root / 1Thisismydell! |

### Google Services
- **GCP OAuth Client**: 908464485194-5ou66udhjobnnrspcq8bgf3v6ufgsjui
- **Google Places API**: AIzaSyAaitGKLzY7PuyYYWLNifeQEqxfaWzncfg

### AI Services
- **OpenAI**: Multiple keys configured
- **Anthropic**: sk-ant-api03-L0F9SjbU60KL_3TXzMzpMyAQXSGHy1uD-X6cLxn1FzDsNBKpR8krPwlefOYlE5GMp_D9e65LoNVyJNU6u82uDQ
- **ElevenLabs**: sk_df69034e4fea5762e15978a7000eee89e33e647cef6f1623

### Database & Backend
- **Supabase**: qfkohfzfxfvynesobaks.supabase.co
- **HubSpot PAT**: Configured

### Development Tools
- **GitHub (locrawl)**: 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
- **Mapbox**: pk.eyJ1IjoibG9jcmF3bCIsImEiOiJjbWI0czFiMWMwNTZoMmpyMzBsdXZ3OTM2In0
- **Vercel**: Multiple tokens configured

### Blockchain
- **Solana Wallet**: 5E9LL97tyxGytJAKnXrMB5rw2KNsEZTnN4FM4qjV6Va4
- **Solflare**: Oshun111!

### CloudFlare (Pandora/rawgle.com)
- **Account ID**: 3e02a16d99fcee4a071c58d876dbc4ea
- **API Key**: k_yCjW8XugZzMGfima2AkMjgJptkrk4wMHpu7XFd

---

## 🏢 SUPERLUXE SERVICES

### Core APIs
- **CloudFlare**: mzGFpxAhhA9lteBreghSnijRjujNPWIHXmHUdB8t ✅ Verified Active
- **Vercel**: b4eZ1wKpdGEu5LcN1Z6MoHky
- **GitHub PAT**: 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
- **Repository**: https://github.com/SUPERLUXE/tradeart

---

## 🔒 SECURITY NOTES

1. **File Permissions**: All environment files secured at 600
2. **Git Protection**: All credential files excluded from version control
3. **Backup Strategy**: Separate backup directories for each stack
4. **Access Control**: Stack-specific management utilities

---

## 🛠️ MANAGEMENT COMMANDS

### Pandora/Tenshimatt Stack
```bash
./env-manager.sh validate       # Validate Pandora environment
./secrets-manager.sh audit      # Security audit
./deploy-environment.sh         # Deploy to containers
```

### SUPERLUXE Stack
```bash
./superluxe-manager.sh validate # Validate SUPERLUXE environment
./superluxe-manager.sh backup   # Backup SUPERLUXE credentials
```

---

## ⚠️ IMPORTANT NOTES

- **NEVER** mix credentials between stacks
- **ALWAYS** use the correct manager script for each stack
- **Pandora Pass**: strangeplanetthemovie
- **Bitnami SSH**: SUPERLUXE-WEB01-5Feb2025 @ 52.16.73.28

---

*Last Updated: September 28, 2025*
*Managed by: Claude Automation System*