#!/bin/bash
# Build script for Cloudflare Pages deployment

echo "Building WebChronicle Next.js UI for Cloudflare Pages..."

# Change to the web-chronicle-ui directory
cd web-chronicle-ui || exit 1

# Install dependencies
npm install

# Build with Cloudflare Pages adapter
npx @cloudflare/next-on-pages@1

echo "Build complete!"