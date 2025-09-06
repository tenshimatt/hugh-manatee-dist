#!/bin/bash

# Initialize Git repository and make first commit

echo "🔧 Initializing Git repository for RAWGLE Frontend"
echo "=================================================="

# Initialize git if not already initialized
if [ ! -d .git ]; then
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    cat > .gitignore << 'EOL'
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build
/dist

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# PWA
/public/sw.js
/public/workbox-*.js
/public/worker-*.js
/public/sw.js.map
/public/workbox-*.js.map
/public/worker-*.js.map

# Cloudflare
.wrangler
.dev.vars

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Cache
.cache
.parcel-cache
EOL
    echo "✅ .gitignore created"
fi

# Add all files
git add .

# Create initial commit
echo ""
echo "Creating initial commit..."
git commit -m "🚀 Initial commit - RAWGLE Frontend

- Complete Next.js 14 setup with TypeScript
- Tailwind CSS with custom RAWGLE theme
- Landing page implementation
- PWA configuration
- Cloudflare Pages deployment ready
- Core UI components (Button, Card)
- Project documentation

Stack:
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand for state management
- React Hook Form + Zod
- Framer Motion animations
- Solana Web3 integration ready
- NextAuth.js configured
"

echo "✅ Initial commit created"

# Set up remote (optional - uncomment and modify)
# echo ""
# echo "Setting up GitHub remote..."
# git remote add origin https://github.com/yourusername/rawgle-frontend.git
# echo "✅ Remote added"

echo ""
echo "✨ Git setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a repository on GitHub"
echo "2. Add remote: git remote add origin <your-repo-url>"
echo "3. Push to GitHub: git push -u origin main"
echo "4. Set up Cloudflare Pages or Vercel deployment"
echo ""
echo "Commit every 30 minutes as per your workflow! ⏰"
