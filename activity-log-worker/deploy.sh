#!/bin/bash

# Load environment variables from .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    echo "✅ Loaded environment variables from .env.local"
else
    echo "❌ Error: .env.local file not found"
    exit 1
fi

# Deploy with wrangler
echo "🚀 Deploying worker..."
npx wrangler deploy

echo "✨ Deployment complete!"