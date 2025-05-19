import { Router } from 'itty-router';
import { authHandler } from './auth-handler';
import { logHandler } from './log-handler';
import { getLogsHandler } from './get-logs-handler'; // Placeholder
import { getSummaryHandler } from './get-summary-handler'; // Placeholder
import { getContentHandler } from './get-content-handler';
import { searchHandler } from './search-handler'; // Import the new search handler
import { backfillHandler } from './backfill-handler'; // Import the backfill handler
import { Env } from './types';

// Create a new Router
const router = Router();

// Helper function to add CORS headers
function addCorsHeaders(response: Response): Response {
  // Allow requests from any origin for now - restrict this later!
  // TODO: Restrict to deployed Pages URL and localhost
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle CORS preflight requests
router.options('*', () => {
  return addCorsHeaders(new Response(null, { status: 204 }));
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
router.get('/logs', getLogsHandler);

// Semantic search endpoint
router.post('/search', authHandler, searchHandler);

// Get summary for a specific log entry
router.get('/logs/:id/summary', getSummaryHandler);

// GET /log-content/:id - Fetch full text content for a specific log entry
router.get('/log-content/:id', getContentHandler);

// --- End NEW API Endpoints ---

// --- Admin Endpoints ---
router.get('/admin/backfill-embeddings', authHandler, backfillHandler);

// Catch-all for 404s
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    try {
      const response = await router.handle(request, env);
      // Add CORS headers to actual responses
      return addCorsHeaders(response);
    } catch (error) {
      console.error('Unhandled error:', error);
      const errorResponse = new Response('Internal Server Error', { status: 500 });
      return addCorsHeaders(errorResponse);
    }
  },
};
