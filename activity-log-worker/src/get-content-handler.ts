import { Env } from './types';

export async function getContentHandler(request: Request, env: Env): Promise<Response> {
  const logId = (request as any).params?.id;

  if (!logId) {
    return new Response('Missing log ID in request path.', { status: 400 });
  }

  console.log(`[Get Content Handler] Received request for log ID: ${logId}`);

  // Construct the R2 key used for storing the content
  const contentKey = `${logId}-content.txt`;

  try {
    console.log(`[Get Content Handler] Attempting to get key: ${contentKey} from R2 bucket: ${env.ACTIVITY_SUMMARIES_BUCKET}`);
    const r2Object = await env.ACTIVITY_SUMMARIES_BUCKET.get(contentKey);

    if (r2Object === null) {
      console.log(`[Get Content Handler] Content not found for key: ${contentKey}`);
      return new Response('Content not found for the specified log ID.', { status: 404 });
    }

    console.log(`[Get Content Handler] Successfully retrieved content for key: ${contentKey}`);

    // Return the content directly
    // Set appropriate content type, assuming plain text for now
    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      // Add cache control headers if desired
      // 'Cache-Control': 'public, max-age=3600' // Example: Cache for 1 hour
    });
    return new Response(r2Object.body, { headers: headers, status: 200 });

  } catch (err) {
    console.error(`[Get Content Handler] Error retrieving content from R2 for key ${contentKey}:`, err);
    return new Response('Failed to retrieve content due to an internal error.', { status: 500 });
  }
}
