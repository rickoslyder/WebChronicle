#!/bin/bash

# WebChronicle UI Deployment Script

echo "🚀 Starting WebChronicle UI deployment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found!"
    echo "Please copy .env.example to .env.local and configure it."
    exit 1
fi

# Build the application for Cloudflare Pages
echo "📦 Building Next.js application for Cloudflare Pages..."
npx @cloudflare/next-on-pages

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Deploy to Cloudflare Pages
echo "☁️  Deploying to Cloudflare Pages..."
npx wrangler pages deploy .vercel/output/static \
    --project-name=web-chronicle-next \
    --branch=main

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your UI should be available at: https://web-chronicle-next.pages.dev/"
else
    echo "❌ Deployment failed!"
    exit 1
fi