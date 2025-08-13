# Hunta - Elite Dog Hunting Platform

## Overview

Hunta (https://gohunta.com) is a specialized platform for dog-assisted hunting enthusiasts. Built for tracking, training, ethical hunting, and community storytelling with offline-first wilderness compatibility.

## Core Modules

1. **Pack & Profile Management** - Dog profiles, handler info, CRUD operations
2. **Hunt Route Planner** - GPS integration, route planning, offline maps
3. **Trial & Event Listings** - Community events, competitions, training trials
4. **Gear Reviews & Loadouts** - Equipment reviews, loadout configurations
5. **Ethics Knowledge Base** - Hunting ethics, best practices, guidelines
6. **Brag Board & Journal** - Photo sharing, hunt stories, training logs

## Tech Stack

- **Backend**: Cloudflare Workers + D1 + R2 + KV
- **Frontend**: Vite + PWA + Mobile-first design
- **Testing**: Cucumber/Gherkin BDD
- **Dev Automation**: Tmux-Orchestrator

## Development

```bash
# Setup project
npm run setup

# Start development environment
npm run tmux:start

# Individual services
npm run dev:frontend    # Vite dev server
npm run dev:backend     # Wrangler dev
npm run test:bdd        # Cucumber tests

# Deploy
npm run deploy:dev      # Development deployment
npm run deploy:prod     # Production deployment
```

## Project Structure

```
hunta/
├── frontend/           # Vite PWA application
│   ├── src/           # Source components
│   ├── public/        # Static assets
│   └── components/    # UI components
├── backend/           # Cloudflare Workers
│   ├── workers/       # Worker scripts
│   ├── schemas/       # D1 database schemas
│   └── migrations/    # Database migrations
├── tests/             # Cucumber BDD tests
│   ├── features/      # Gherkin feature files
│   ├── steps/         # Step definitions
│   └── fixtures/      # Test data
├── tools/             # Automation scripts
├── logs/              # Development logs
└── docs/              # Documentation
```

## Features

- ✅ Offline-first wilderness compatibility
- ✅ GPS integration with GPX import/export
- ✅ Real-time photo tagging via AI
- ✅ Role-based authentication (hunter/trainer/admin)
- ✅ Community features with privacy controls
- ✅ Advanced search and filtering
- ✅ Push notifications for events and updates
- ✅ Responsive PWA design
- ✅ Real-time data synchronization
- ✅ Secure media storage with R2

## Security

- JWT-based authentication with role-based access
- OWASP security compliance
- Encrypted media storage
- Audit trail logging
- Privacy-first community features

Built by elite developers who understand the hunting lifestyle.