// No need to import Request, use the global one from workers-types
import { Request } from 'itty-router'; // Use the Request type exported by itty-router
import { Env } from './types';

export async function getSummaryHandler(request: Request, env: Env): Promise<Response> {
  const logId = request.params?.id;
  console.log(`[Get Summary Handler] Received request for log ID: ${logId}`);

  if (!logId) {
    return new Response('Missing log ID parameter', { status: 400 });
  }

  try {
    const summaryKey = `${logId}-summary.txt`; // Construct the R2 key

    console.log(`[Get Summary Handler] Attempting to get key: ${summaryKey} from R2 bucket: ${env.ACTIVITY_SUMMARIES_BUCKET}`);
    const summaryObject = await env.ACTIVITY_SUMMARIES_BUCKET.get(summaryKey);

    if (summaryObject === null) {
      console.warn(`[Get Summary Handler] Summary not found in R2 for key: ${summaryKey}`);
      return new Response(JSON.stringify({ error: 'Summary not found' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    console.log(`[Get Summary Handler] Successfully retrieved summary for key: ${summaryKey}`);

    // Assuming the summary is stored as plain text
    const summaryText = await summaryObject.text();

    return new Response(JSON.stringify({ summary: summaryText }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[Get Summary Handler] Error fetching summary for log ID ${logId}:`, error);
    return new Response('Error fetching summary', { status: 500 });
  }
}
