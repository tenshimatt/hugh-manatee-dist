#!/bin/bash
# Execute from the correct directory and deploy
cd /Users/mattwright/pandora/rawhunt

echo "🏗️ Deploying Hunta v2 Backend..."
cd hunta-v2/backend
wrangler deploy --env production
cd ../..

echo "🔍 Deploying Rawgle Pure Platform..."
cd rawgle-pure
wrangler deploy --env production
cd ..

echo "✅ All deployments completed!"
