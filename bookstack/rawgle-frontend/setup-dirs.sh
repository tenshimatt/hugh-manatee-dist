#!/bin/bash

# Create directory structure
mkdir -p src/{app,components,lib,hooks,types,styles,utils,store,services}
mkdir -p src/app/{auth,dashboard,onboarding,api}
mkdir -p src/app/auth/{sign-in,sign-up,verify}
mkdir -p src/app/dashboard/{pets,feeding,health,analytics,settings}
mkdir -p src/components/{ui,layout,features,shared}
mkdir -p src/components/features/{auth,pets,feeding,health,chat,maps}
mkdir -p src/services/{api,cloudflare,openai}
mkdir -p src/store/{auth,pets,feeding,chat}
mkdir -p public/{images,icons,fonts}
mkdir -p tests/{e2e,unit}
mkdir -p .storybook

echo "✅ Directory structure created"
