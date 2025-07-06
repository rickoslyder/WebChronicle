# WebChronicle

A privacy-first personal web activity tracking system with AI-powered insights.

## Overview

WebChronicle consists of three main components:

1. **Chrome Extension** - Captures browsing activity, content, and scroll behavior
2. **Cloudflare Worker** - Backend API for processing, storing, and searching activity logs
3. **Activity Log UI** - Modern React-based web interface for viewing and analyzing logged activities

## Features

### Core Features
- 🔍 **Advanced Search**: Three search modes - AI semantic search, full-text search, and advanced query syntax
- 🌓 **Dark/Light Mode**: Automatic theme detection with manual toggle
- 📊 **Analytics Dashboard**: Comprehensive insights with heatmaps, productivity scoring, and domain network visualization
- 🔄 **Offline Sync**: Queue activities when offline, sync when reconnected
- 🤖 **AI Summaries**: Automatic content summarization and tagging
- 🔐 **Privacy-First**: All data stored in your own Cloudflare infrastructure

### New in Phase 4
- 📈 **Advanced Analytics**:
  - GitHub-style activity heatmap
  - Hourly activity distribution
  - Reading speed and engagement metrics
  - Productivity scoring by content type
  - Weekly/monthly reports with trends
  - Domain relationship network graph
- 🔎 **Enhanced Search**:
  - Advanced query syntax (field:value, AND/OR/NOT operators)
  - Date range filters (after:7d, before:2024-01-01)
  - Time spent filters (time:>300)
  - Tag and domain filtering
- 📁 **Smart Collections**: 
  - Automatic activity grouping by patterns
  - 8 predefined collections (Work, Learning, Entertainment, etc.)
  - AI-suggested collections based on your browsing
- 📱 **Progressive Web App**:
  - Install as desktop/mobile app
  - Offline functionality
  - Background sync
  - App shortcuts
- 🎯 **Additional Features**:
  - Batch operations for multiple activities
  - Data export (JSON, CSV, Markdown)
  - Activity comparison view
  - Screenshot preview support
  - Keyboard shortcuts
  - Real-time updates

## Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account with Workers, D1, R2, and Vectorize access
- Chrome browser for the extension

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rickoslyder/WebChronicle.git
cd WebChronicle
```

2. Install dependencies:
```bash
npm install
```

### Configuration

1. **Worker Configuration**:
   - Copy `activity-log-worker/.env.local.example` to `activity-log-worker/.env.local`
   - Add your Cloudflare API token

2. **UI Configuration** (New React UI):
   - Navigate to `web-chronicle-ui/`
   - Copy `.env.example` to `.env.local`
   - Update with your worker URL and auth token
   
   For legacy vanilla JS UI:
   - Copy `activity-log-ui/config.template.js` to `activity-log-ui/config.js`
   - Update with your worker URL and auth token

3. **Extension Configuration**:
   - Load the extension in Chrome as an unpacked extension
   - Configure the worker URL and auth token in the extension options

## Deployment

### Deploy Everything
```bash
npm run deploy:all
```

### Deploy Individual Components
```bash
# Deploy the worker
npm run deploy:worker

# The UI deploys automatically via GitHub Pages/Cloudflare Pages
npm run deploy:ui
```

## Development

### Run Worker Locally
```bash
npm run dev:worker
```

### Open UI Locally
```bash
npm run dev:ui
```

### Build Extension
```bash
npm run build:extension
```

## Project Structure

```
WebChronicle/
├── activity-log-worker/      # Cloudflare Worker backend
│   ├── src/                  # TypeScript source files
│   ├── schema.sql           # D1 database schema
│   └── wrangler.toml        # Cloudflare configuration
├── activity-log-ui/         # Legacy vanilla JS interface
│   ├── index.html          # Enhanced UI with dark mode
│   ├── script.js           # UI logic with semantic search
│   └── style.css           # Modern styling
├── web-chronicle-ui/        # Modern React UI (NEW)
│   ├── app/                # Next.js app router pages
│   ├── components/         # React components
│   ├── lib/                # Utilities and API client
│   └── package.json        # Dependencies and scripts
└── personal-web-activity-chronicle-extension/  # Chrome extension
    ├── background/         # Service worker and tracking
    ├── content/           # Content scripts
    └── manifest.json      # Extension configuration
```

## Technologies Used

- **Frontend**: 
  - **New UI**: Next.js 15, React 19, TypeScript, TanStack Query, Zustand, Tailwind CSS v4
  - **Legacy UI**: Vanilla JavaScript, Chart.js, CSS3
- **Backend**: Cloudflare Workers, TypeScript, Itty Router
- **Storage**: D1 (metadata), R2 (content), Vectorize (embeddings)
- **AI**: Cloudflare AI (Llama model for summarization)
- **Extension**: Chrome Extension Manifest V3

## Deployment

The system runs on Cloudflare's global edge network:

- **Backend Worker**: `https://activity-log-worker.*.workers.dev`
  - Deploy: `cd activity-log-worker && npm run deploy`
- **Legacy UI**: `https://web-chronicle-ui.*.workers.dev` (Production)
  - Deploy: `npm run deploy:ui`
- **New UI**: `https://web-chronicle-next.pages.dev` (Experimental)
  - Deploy: `cd web-chronicle-ui && ./deploy.sh`

See [CLAUDE.md](CLAUDE.md) for detailed deployment instructions.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Cloudflare's edge computing platform
- Uses Readability.js for content extraction
- Inspired by the need for privacy-conscious web tracking