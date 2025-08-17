#!/bin/bash

# Rawgle Backend Setup Script
# Sets up Cloudflare resources for the Rawgle backend

set -e

echo "🐾 Setting up Rawgle Backend..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "❌ Please login to Cloudflare first:"
    echo "wrangler login"
    exit 1
fi

echo "✅ Wrangler CLI is ready"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "🗄️ Note: Using existing Rawgle D1 database with 9000+ supplier records"
echo "   Make sure to update wrangler.toml with the correct database_id"

# Create KV namespace for sessions and caching
echo "🔑 Creating KV namespace for sessions..."
KV_OUTPUT=$(wrangler kv:namespace create "KV")
KV_ID=$(echo "$KV_OUTPUT" | grep -o 'id = "[^"]*"' | sed 's/id = "//' | sed 's/"//')

echo "📝 KV Namespace created: $KV_ID"

# Create KV preview namespace
echo "🔑 Creating KV preview namespace..."
KV_PREVIEW_OUTPUT=$(wrangler kv:namespace create "KV" --preview)
KV_PREVIEW_ID=$(echo "$KV_PREVIEW_OUTPUT" | grep -o 'preview_id = "[^"]*"' | sed 's/preview_id = "//' | sed 's/"//')

echo "📝 KV Preview Namespace created: $KV_PREVIEW_ID"

# Create R2 bucket for media storage
echo "🪣 Creating R2 bucket for media..."
wrangler r2 bucket create rawgle-media || echo "Bucket may already exist"

# Create R2 preview bucket
echo "🪣 Creating R2 preview bucket..."
wrangler r2 bucket create rawgle-media-dev || echo "Preview bucket may already exist"

# Create queue for background tasks
echo "⚡ Creating queue for background processing..."
wrangler queues create rawgle-background-tasks || echo "Queue may already exist"

# Update wrangler.toml with generated IDs
echo "📝 Updating wrangler.toml with generated resource IDs..."

# Create backup of wrangler.toml
cp wrangler.toml wrangler.toml.backup

# Update KV namespace IDs
sed -i.tmp "s/id = \"TBD\"/id = \"$KV_ID\"/" wrangler.toml
sed -i.tmp "s/preview_id = \"TBD\"/preview_id = \"$KV_PREVIEW_ID\"/" wrangler.toml

# Clean up temp files
rm -f wrangler.toml.tmp

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update wrangler.toml with your existing Rawgle D1 database ID"
echo "2. Set environment variables (JWT_SECRET, etc.)"
echo "3. Test the setup: npm run dev"
echo "4. Deploy to production: npm run deploy"
echo ""
echo "🔧 Resources created:"
echo "   KV Namespace: $KV_ID"
echo "   KV Preview: $KV_PREVIEW_ID"
echo "   R2 Bucket: rawgle-media"
echo "   R2 Preview: rawgle-media-dev"
echo "   Queue: rawgle-background-tasks"
echo ""
echo "⚠️  Important: Make sure to:"
echo "   - Update the database_id in wrangler.toml with your existing Rawgle database"
echo "   - Configure CORS_ORIGINS with your frontend URLs"
echo "   - Set up proper JWT_SECRET for production"
echo ""
echo "🐾 Rawgle Backend is ready to deploy!"