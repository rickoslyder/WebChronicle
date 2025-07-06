# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebChronicle is a personal web activity tracking system consisting of:
- **Chrome Extension**: Captures browsing activity, content, and scroll behavior
- **Cloudflare Worker**: Backend API for processing, storing, and searching activity logs
- **Activity Log UI**: Web interface for viewing logged activities

## Essential Commands

### Chrome Extension (`personal-web-activity-chronicle-extension/`)
```bash
npm install          # Install dependencies
npm run build        # Build content scripts with esbuild
```

### Cloudflare Worker (`activity-log-worker/`)
```bash
npm install          # Install dependencies
npm run dev          # Start local development server
npm run build        # Build the worker
npm run deploy       # Deploy using automated script (recommended)
npx wrangler deploy  # Deploy manually
npx wrangler tail    # View production logs
```

### Quick Deploy (from root directory)
```bash
npm run deploy:worker  # Deploy Cloudflare Worker
npm run deploy:ui      # Info about UI deployment
npm run deploy:all     # Deploy everything
```

## Architecture & Key Design Patterns

### Offline-First with Sync
The extension uses IndexedDB to queue activity logs when offline, automatically syncing when reconnected. Key files:
- `background/cloudflare-client.js`: Manages API communication and offline queue
- `lib/db-manager.js`: IndexedDB operations for offline storage

### Content Processing Pipeline
1. **Content Script** (`content-script.js`) extracts page content using Readability.js
2. **Activity Tracker** (`background/activity-tracker.js`) monitors tab activity and scroll depth
3. **Service Worker** coordinates data collection and API submission
4. **Worker** processes with AI for summarization and semantic search

### Deduplication Strategy
- SHA-256 hashing for exact content matching
- Simhash for near-duplicate detection (activity-log-worker/src/index.ts:362-386)

### Authentication
Bearer token authentication implemented in:
- Extension: Stored in Chrome storage, configurable via options page
- Worker: AUTH_TOKEN secret verified in activity-log-worker/src/index.ts:68-77

## Database Schema

### D1 Tables (activity-log-worker/schema.sql)
- `activity_logs`: Core activity records with metadata
- `log_tags`: AI-generated tags for activities
- `content_hashes`: Deduplication tracking

### Storage Strategy
- **D1**: Metadata, tags, and searchable fields
- **R2**: Full HTML content and AI summaries
- **Vectorize**: Semantic search embeddings

## Development Tips

### Testing API Changes Locally
```bash
# In worker directory
npm run dev
# Update extension options to point to http://localhost:8787
```

### Debugging Extension
- Use Chrome DevTools for service worker debugging
- Check IndexedDB in Application tab for offline queue status
- Monitor alarms in chrome://extensions for sync timing

### Adding New Features
- Extension changes require rebuilding content scripts
- Worker changes auto-reload in dev mode
- Schema changes need migration files in `activity-log-worker/migrations/`

## Recent Additions
- Semantic search via Vectorize integration
- Offline sync with improved queue management
- Popup interface (in development)
- Enhanced UI with dark mode and modern design
- AI-powered "Find Similar" feature
- Analytics dashboard with Chart.js visualizations

## Deployment

### Worker Deployment
The worker now has an automated deployment script that handles environment variables:
```bash
cd activity-log-worker
npm run deploy  # Uses ./deploy.sh script
```

The script automatically:
- Loads CLOUDFLARE_API_TOKEN from `.env.local`
- Deploys to production with all bindings configured
- Shows deployment URL and version ID

### UI Deployment
The Activity Log UI deploys automatically via GitHub push:
- **Production URL**: https://web-chronicle-ui.pages.dev/
- **Source**: `activity-log-ui/` directory in main branch
- **Build**: No build step required (static files)
- **Cache**: Controlled via `_headers` file

To update the UI:
1. Make changes to files in `activity-log-ui/`
2. Commit and push to GitHub
3. Cloudflare Pages automatically deploys within ~45 seconds

### Environment Variables
Set these in respective platforms:
- **Worker**: Use `.env.local` file (not committed)
- **UI (Cloudflare Pages)**: Set in dashboard
  - `WORKER_URL`: Your worker URL
  - `AUTH_TOKEN`: Authentication token
- **UI (Local)**: Edit `config.js` directly

## Configuration Files
- **Extension**: `manifest.json`, `lib/constants.js`
- **Worker**: `wrangler.toml` (Cloudflare bindings), `tsconfig.json`, `.env.local`
- **Database**: `schema.sql`, migration files
- **UI**: `config.js` (generated from template), `_headers` (cache control)