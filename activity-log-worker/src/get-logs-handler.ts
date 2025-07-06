// No need to import Request, use the global one from workers-types
import { Env } from './types';

export async function getLogsHandler(request: Request, env: Env): Promise<Response> {
  console.log('[Get Logs Handler] Received request');

  try {
    // Parse query parameters
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const domain = url.searchParams.get('domain');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    // Build query with filters
    let query = `SELECT id, url, title, startTimestamp, timeSpentSeconds, maxScrollPercent, tagsJson, processedAt
                 FROM logs`;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (domain) {
      conditions.push(`url LIKE ?`);
      params.push(`%${domain}%`);
    }
    
    if (startDate) {
      conditions.push(`startTimestamp >= ?`);
      params.push(parseInt(startDate));
    }
    
    if (endDate) {
      conditions.push(`startTimestamp <= ?`);
      params.push(parseInt(endDate));
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY startTimestamp DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    console.log('[Get Logs Handler] Query:', query);
    console.log('[Get Logs Handler] Params:', params);
    
    const stmt = env.ACTIVITY_LOG_DB.prepare(query).bind(...params);
    const { results } = await stmt.all();
    
    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM logs`;
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const countStmt = env.ACTIVITY_LOG_DB.prepare(countQuery).bind(...params.slice(0, -2)); // exclude limit and offset
    const { results: countResults } = await countStmt.all();
    const total = countResults[0]?.total || 0;

    return new Response(JSON.stringify({ 
      logs: results,
      total,
      limit,
      offset 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[Get Logs Handler] Error fetching logs:', error);
    return new Response(JSON.stringify({ error: 'Error fetching logs', details: error.message }), { 
      headers: { 'Content-Type': 'application/json' },
      status: 500 
    });
  }
}
