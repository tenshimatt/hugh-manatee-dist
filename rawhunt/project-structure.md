# Rawgle Platform Project Structure

```
rawgle-platform/
├── apps/
│   ├── web/                    # Next.js frontend
│   ├── mobile/                 # React Native app
│   └── admin/                  # Admin dashboard
├── packages/
│   ├── api/                    # Cloudflare Workers API
│   ├── database/               # Supabase schemas & migrations
│   ├── ui/                     # Shared UI components
│   ├── matching-engine/        # Dog-food matching logic
│   └── analytics/              # Tracking & metrics
├── services/
│   ├── chat/                   # Durable Objects chat
│   ├── reviews/                # Review system
│   ├── education/              # Content management
│   ├── commerce/               # E-commerce engine
│   └── notifications/          # Push notifications
├── infrastructure/
│   ├── cloudflare/            # Workers, KV, R2 configs
│   ├── supabase/              # Database setup
│   ├── aws/                   # Lambda functions
│   └── n8n/                   # Workflow definitions
└── tools/
    ├── scripts/               # Automation scripts
    └── monitoring/            # Observability setup
```
