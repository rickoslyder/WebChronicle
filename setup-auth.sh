#!/bin/bash

echo "🔐 WebChronicle Authentication Setup"
echo "===================================="
echo ""

# Generate a secure token
TOKEN=$(openssl rand -hex 32)
echo "Generated secure token: $TOKEN"
echo ""

echo "To complete setup:"
echo ""
echo "1. Set the token as a secret in your worker:"
echo "   cd activity-log-worker"
echo "   npx wrangler secret put AUTH_TOKEN"
echo "   (paste the token when prompted)"
echo ""
echo "2. Update activity-log-ui/config.js:"
echo "   Replace 'REPLACE_WITH_YOUR_SECURE_TOKEN' with:"
echo "   '$TOKEN'"
echo ""
echo "3. Update your Chrome extension settings with the same token"
echo ""
echo "4. Redeploy the UI:"
echo "   npm run deploy:ui"
echo ""
echo "Save this token securely - you'll need it for all components!"