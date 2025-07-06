# WebChronicle UI

Modern React-based interface for viewing and analyzing your personal web activity logs.

## Overview

WebChronicle UI is the frontend component of the WebChronicle system, providing a powerful interface for browsing, searching, and analyzing your web activity history. Built with Next.js 15 and React 19, it offers advanced features like semantic search, smart collections, and comprehensive analytics.

## Features

### Core Features
- **Timeline View**: Browse your activity history with infinite scroll
- **Advanced Search**: Three search modes (semantic, full-text, advanced query)
- **Smart Collections**: Automatic activity grouping by patterns
- **Analytics Dashboard**: Comprehensive insights and visualizations
- **Activity Details**: View full content, tags, and metadata
- **Dark/Light Mode**: Automatic theme detection with manual toggle
- **Responsive Design**: Works on desktop, tablet, and mobile

### Phase 4 Features
- **Advanced Analytics**:
  - GitHub-style activity heatmap
  - Hourly activity distribution
  - Reading speed and engagement metrics
  - Productivity scoring by content type
  - Weekly/monthly reports with trends
  - Domain relationship network graph
- **Enhanced Search**:
  - Advanced query syntax (field:value, AND/OR/NOT operators)
  - Date range filters (after:7d, before:2024-01-01)
  - Time spent filters (time:>300)
  - Tag and domain filtering
- **Smart Collections**: 
  - 8 predefined collections (Work, Learning, Entertainment, etc.)
  - AI-suggested collections based on your browsing
- **Progressive Web App**:
  - Install as desktop/mobile app
  - Offline functionality
  - Background sync
  - App shortcuts
- **Additional Features**:
  - Batch operations for multiple activities
  - Data export (JSON, CSV, Markdown)
  - Activity comparison view
  - Screenshot preview support
  - Keyboard shortcuts
  - Real-time updates

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Data Fetching**: TanStack Query v5
- **Charts**: Recharts
- **Utilities**: 
  - date-fns (date formatting)
  - clsx (class names)
  - radix-ui (accessible components)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- WebChronicle backend (Cloudflare Worker) deployed and configured

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rickoslyder/WebChronicle.git
cd WebChronicle/web-chronicle-ui
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your configuration:
```env
NEXT_PUBLIC_API_URL=https://your-worker.workers.dev
NEXT_PUBLIC_AUTH_TOKEN=your-auth-token
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Build

Create a production build:

```bash
npm run build
```

### Deployment

#### Cloudflare Pages (Recommended)

1. Push your code to GitHub
2. Connect repository to Cloudflare Pages
3. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `out`
4. Set environment variables in Cloudflare Pages dashboard

#### Vercel

The app can also be deployed to Vercel:

```bash
npx vercel
```

## Project Structure

```
web-chronicle-ui/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Timeline (home) page
│   ├── search/            # Search page
│   ├── analytics/         # Analytics dashboard
│   ├── collections/       # Smart collections
│   ├── compare/           # Activity comparison
│   ├── export/            # Export page
│   └── settings/          # Settings page
├── components/            # React components
│   ├── activity-*.tsx     # Activity-related components
│   ├── analytics/         # Analytics components
│   ├── filters/           # Filter components
│   ├── search/            # Search components
│   ├── ui/                # Base UI components
│   └── *.tsx             # Other components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and helpers
│   ├── api.ts            # API client
│   ├── auth.ts           # Authentication
│   ├── export-utils.ts   # Export utilities
│   └── utils.ts          # General utilities
├── stores/               # Zustand stores
├── types/                # TypeScript types
└── docs/                 # Documentation
    ├── ADVANCED_SEARCH.md
    ├── SMART_COLLECTIONS.md
    └── PWA_INSTALLATION.md
```

## Configuration

### Environment Variables

- `NEXT_PUBLIC_API_URL`: Your Cloudflare Worker URL
- `NEXT_PUBLIC_AUTH_TOKEN`: Authentication token for API access

### Theme Configuration

The app automatically detects system theme preferences but can be manually toggled via the settings page.

### Search Configuration

Configure default search mode and filters in the settings page.

## Features Documentation

### Advanced Search

See [docs/ADVANCED_SEARCH.md](docs/ADVANCED_SEARCH.md) for detailed query syntax documentation.

### Smart Collections

See [docs/SMART_COLLECTIONS.md](docs/SMART_COLLECTIONS.md) for information about automatic activity grouping.

### PWA Installation

See [docs/PWA_INSTALLATION.md](docs/PWA_INSTALLATION.md) for installation instructions across platforms.

## Keyboard Shortcuts

- `/` - Focus search
- `cmd/ctrl + k` - Quick search
- `t` - Toggle theme
- `g h` - Go to home
- `g s` - Go to search
- `g a` - Go to analytics
- `g c` - Go to collections
- `?` - Show shortcuts help

## API Integration

The UI communicates with the Cloudflare Worker backend via REST API:

- `GET /search` - Search activities
- `GET /search/semantic` - Semantic search
- `GET /search/fulltext` - Full-text search
- `GET /activity/{id}` - Get activity details
- `POST /activities/batch` - Batch operations
- `GET /analytics` - Analytics data
- `GET /collections` - Smart collections

All requests require authentication via `X-Auth-Token` header.

## Performance

- Server-side rendering for fast initial load
- React Server Components for optimal performance
- Intelligent data caching with TanStack Query
- Virtual scrolling for large datasets
- Optimistic UI updates
- Progressive enhancement

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
