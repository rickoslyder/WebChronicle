# CORS Configuration Guide

## Overview

The Activity Log Worker implements strict CORS (Cross-Origin Resource Sharing) policies to ensure only authorized origins can access the API.

## Configuration

Edit `src/config.ts` to add your allowed origins:

```typescript
allowedOrigins: [
  // Chrome Extension (get ID from chrome://extensions)
  'chrome-extension://abcdefghijklmnopqrstuvwxyz123456',
  
  // Your UI domains
  'https://your-app.netlify.app',
  'https://your-app.vercel.app',
  'https://your-custom-domain.com',
  
  // Development
  'http://localhost:3000',
  'http://localhost:8080'
]
```

## Finding Your Chrome Extension ID

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Find your WebChronicle extension
4. Copy the ID below the extension name

## Security Best Practices

1. **Never use wildcard (*) in production** - Always specify exact origins
2. **Use HTTPS** for all production domains
3. **Minimize allowed origins** - Only add domains you control
4. **Regular audits** - Review and remove unused origins

## Testing CORS

```bash
# Test from allowed origin
curl -H "Origin: https://your-app.netlify.app" \
     -H "X-Auth-Token: your-token" \
     -I https://your-worker.workers.dev/ping

# Should see: Access-Control-Allow-Origin: https://your-app.netlify.app

# Test from disallowed origin
curl -H "Origin: https://evil-site.com" \
     -H "X-Auth-Token: your-token" \
     -I https://your-worker.workers.dev/ping

# Should NOT see Access-Control-Allow-Origin header
```

## Troubleshooting

- **CORS errors in browser console**: Check that your origin is in the allowed list
- **Extension not working**: Make sure you added the correct extension ID
- **Local development issues**: Verify localhost ports match your dev server