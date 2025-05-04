// No need to import Request, use the global one from workers-types
import { Env } from './types';

export async function getLogsHandler(_request: Request, env: Env): Promise<Response> {
  console.log('[Get Logs Handler] Received request');

  try {
    const stmt = env.ACTIVITY_LOG_DB.prepare(
      `SELECT id, url, title, startTimestamp, timeSpentSeconds, maxScrollPercent, tagsJson, processedAt
       FROM logs
       ORDER BY startTimestamp DESC
       LIMIT 20`
    );

    const { results } = await stmt.all();

    return new Response(JSON.stringify({ logs: results }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[Get Logs Handler] Error fetching logs:', error);
    return new Response('Error fetching logs', { status: 500 });
  }
}
