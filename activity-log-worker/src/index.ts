import { Router } from 'itty-router';
import { authHandler } from './auth-handler';
import { logHandler } from './log-handler';
import { getLogsHandler } from './get-logs-handler'; // Placeholder
import { getSummaryHandler } from './get-summary-handler'; // Placeholder
import { getContentHandler } from './get-content-handler';
import { searchHandler } from './search-handler'; // Import the new search handler
import { backfillHandler } from './backfill-handler'; // Import the backfill handler
import { browserScreenshotHandler, browserExtractHandler, browserPdfHandler } from './browser-handler';
import { Env } from './types';
import { config } from './config';

// Create a new Router
const router = Router();

// Helper function to add CORS headers
function addCorsHeaders(response: Response, request: Request): Response {
  const origin = request.headers.get('Origin');
  
  // Check if the origin is allowed
  if (origin && config.cors.allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (!origin && config.cors.allowNoOrigin) {
    // Allow requests with no origin (e.g., from extensions or direct API calls)
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Token');
  
  if (config.cors.allowCredentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return response;
}

// Handle CORS preflight requests
router.options('*', (request) => {
  return addCorsHeaders(new Response(null, { status: 204 }), request);
});

/*
 * GET /ping: Simple route for testing connection and auth
 */
router.get('/ping', authHandler, () => new Response('OK', { status: 200 }));

/*
 * POST /log: Receives activity data from the extension,
 * processes it (AI summary/tags), stores summary in R2,
 * and stores metadata in D1.
 * Authentication is handled by authHandler.
 */
router.post('/log', authHandler, logHandler); // Use the new logHandler

// --- NEW API Endpoints for UI ---
// Get recent log entries
router.get('/logs', authHandler, getLogsHandler);

// Semantic search endpoint
router.post('/search', authHandler, searchHandler);

// Get summary for a specific log entry
router.get('/logs/:id/summary', authHandler, getSummaryHandler);

// GET /log-content/:id - Fetch full text content for a specific log entry
router.get('/log-content/:id', getContentHandler);

// --- End NEW API Endpoints ---

// --- Admin Endpoints ---
router.get('/admin/backfill-embeddings', authHandler, backfillHandler);

// --- Browser Rendering Endpoints ---
router.post('/browser/screenshot', authHandler, browserScreenshotHandler);
router.post('/browser/extract', authHandler, browserExtractHandler);
router.post('/browser/pdf', authHandler, browserPdfHandler);

// Catch-all for 404s
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    try {
      const response = await router.handle(request, env);
      // Add CORS headers to actual responses
      return addCorsHeaders(response, request);
    } catch (error) {
      console.error('Unhandled error:', error);
      const errorResponse = new Response('Internal Server Error', { status: 500 });
      return addCorsHeaders(errorResponse, request);
    }
  },
};
