# Activity Log UI

A modern web interface for viewing and searching your WebChronicle activity logs.

> **Note**: The UI has been enhanced with modern features including dark mode, analytics dashboard, and semantic search capabilities. The original simple UI is preserved as `index-original.html`.

## Setup

### Local Development

1. **Create Configuration File**
   ```bash
   cp config.template.js config.js
   ```

2. **Edit config.js**
   - Set your Cloudflare Worker URL
   - Add your authentication token (same as configured in your Worker)
   - For local development, you can override the URL

### Production Deployment

The UI uses environment variables for secure configuration in production.

#### Netlify

1. Push code to GitHub
2. Connect repository to Netlify
3. Set environment variables in Netlify UI:
   - `WORKER_URL`: Your Cloudflare Worker URL
   - `AUTH_TOKEN`: Your authentication token
4. Deploy will automatically generate config.js

#### Vercel

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables:
   - `WORKER_URL`: Your Cloudflare Worker URL
   - `AUTH_TOKEN`: Your authentication token
4. Deploy

#### Cloudflare Pages

1. Create a build script that sets environment variables
2. Configure build command: `node build-config.js`
3. Set environment variables in Pages settings

#### Manual Deployment

For other hosting services:
1. Set `WORKER_URL` and `AUTH_TOKEN` environment variables
2. Run `node build-config.js` before uploading files
3. Upload all files except `config.template.js`

## Security Notes

- **NEVER** commit `config.js` to version control
- The auth token should match the one configured in your Cloudflare Worker
- Consider using environment variables for production deployments

## Features

### Core Features
- View activity logs with AI-generated summaries and tags
- Compare content between two log entries
- Real-time search across titles, URLs, summaries, and tags
- Dark/Light mode with system preference detection

### Enhanced Features
- **Modern Dashboard**: Card-based layout with rich activity previews
- **Analytics View**: Visual charts showing browsing patterns and domain statistics
- **Smart Filtering**: Sort by recent, time spent, domain, or scroll depth
- **Tag Navigation**: Click tags to filter activities
- **Responsive Design**: Works seamlessly on desktop and mobile

### Coming Soon
- Semantic search using AI embeddings
- Knowledge graph visualization
- AI-powered insights and recommendations
- Export capabilities

## Development

For local development:
1. Update `config.js` to point to `http://localhost:8787`
2. Run your Worker locally with `npm run dev`
3. Open `index.html` in your browser