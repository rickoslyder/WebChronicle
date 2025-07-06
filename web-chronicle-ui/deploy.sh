#!/bin/bash

# WebChronicle UI Deployment Script

echo "🚀 Starting WebChronicle UI deployment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found!"
    echo "Please copy .env.example to .env.local and configure it."
    exit 1
fi

# Build the application
echo "📦 Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Deploy to Cloudflare Pages
echo "☁️  Deploying to Cloudflare Pages..."
npx wrangler pages deploy out \
    --project-name=web-chronicle-ui \
    --branch=main

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your UI should be available at: https://web-chronicle-ui.pages.dev/"
else
    echo "❌ Deployment failed!"
    exit 1
fi