/// <reference types="@cloudflare/workers-types" />

import { generateEmbedding } from './ai-processor';
import type { Env, LogDataPayload } from './types'; // Assuming LogDataPayload might be useful for result structure

interface SearchQueryPayload {
  query: string;
  topK?: number;
}

// Define a type for the items returned in search results
interface SearchResultItem extends Omit<LogDataPayload, 'textContent'> {
  id: string; // Ensure id is part of the result
  summary?: string; // We'll try to fetch this if available
  score?: number; // Similarity score from Vectorize
  tagsJson?: string; // Include tags if available
  processedAt: number; // Ensure processedAt is part of the result
  summaryR2Key?: string | null; // Field from D1 for the R2 summary object key
  // Omit textContent to keep payload smaller, client can fetch if needed
}


export async function searchHandler(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let payload: SearchQueryPayload;
  try {
    payload = await request.json();
  } catch (e) {
    return new Response('Invalid JSON payload', { status: 400 });
  }

  const { query, topK = 10 } = payload;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return new Response('Search query is missing or empty', { status: 400 });
  }

  console.log(`[Search Handler] Received search query: "${query}", topK: ${topK}`);

  // 1. Generate embedding for the search query
  let queryEmbedding: number[] | null;
  try {
    console.log(`[Search Handler] Generating embedding for query: "${query}"`);
    queryEmbedding = await generateEmbedding(env.AI, query);
    if (!queryEmbedding) {
      console.error('[Search Handler] Failed to generate embedding for the search query.');
      return new Response('Failed to process search query (embedding generation failed)', { status: 500 });
    }
    console.log(`[Search Handler] Query embedding generated. Dimensions: ${queryEmbedding.length}`);
  } catch (error) {
    console.error('[Search Handler] Error generating query embedding:', error);
    return new Response('Error processing search query', { status: 500 });
  }

  // 2. Query Vectorize index
  let vectorMatches: any[]; // From VectorizeMatches.matches
  try {
    console.log(`[Search Handler] Querying Vectorize index with topK: ${topK}`);
    const results = await env.VECTORIZE.query(queryEmbedding, { topK, returnValues: false }); // Don't need values back here
    vectorMatches = results.matches;
    console.log(`[Search Handler] Vectorize returned ${vectorMatches.length} matches.`);
  } catch (error) {
    console.error('[Search Handler] Error querying Vectorize index:', error);
    return new Response('Error searching content', { status: 500 });
  }

  if (!vectorMatches || vectorMatches.length === 0) {
    return new Response(JSON.stringify({ message: 'No results found.', results: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Extract IDs and scores from Vectorize results
  const resultIds = vectorMatches.map(match => match.id);
  const scoresMap = new Map(vectorMatches.map(match => [match.id, match.score]));

  console.log(`[Search Handler] Fetching details from D1 for ${resultIds.length} IDs.`);

  // 4. Fetch corresponding full log entries from D1
  // Constructing the IN clause for the SQL query
  // D1 prepare statements don't directly support arrays for IN clauses in a simple way other than binding each separately or creating placeholders.
  // For a manageable number of IDs (like topK=10-20), creating placeholders is feasible.
  const placeholders = resultIds.map(() => '?').join(',');
  const sql = `
    SELECT id, url, title, startTimestamp, endTimestamp, timeSpentSeconds, maxScrollPercent, tagsJson, summaryR2Key, processedAt 
    FROM logs 
    WHERE id IN (${placeholders})
  `;
  
  let d1Results: SearchResultItem[];
  try {
    const stmt = env.ACTIVITY_LOG_DB.prepare(sql).bind(...resultIds);
    const { results } = await stmt.all<SearchResultItem>(); // Make sure this matches the expected row type
    d1Results = results || [];
    console.log(`[Search Handler] D1 returned ${d1Results.length} full entries.`);
  } catch (error) {
    console.error('[Search Handler] Error fetching from D1:', error);
    return new Response('Error retrieving search result details', { status: 500 });
  }

  // 5. Attempt to fetch summaries from R2 (optional, could be slow for many results)
  //    For simplicity in this step, we'll rely on the client to fetch summaries if needed,
  //    or assume the D1 record might eventually store a short summary directly if performance becomes an issue.
  //    However, for a richer experience, we can fetch them here.

  const searchResultsWithSummaries: SearchResultItem[] = [];
  for (const item of d1Results) {
      let summaryText: string | undefined = undefined;
      if (item.summaryR2Key) { 
          try {
              const r2Object = await env.ACTIVITY_SUMMARIES_BUCKET.get(item.summaryR2Key);
              if (r2Object) {
                  summaryText = await r2Object.text();
              }
          } catch (r2Error) {
              console.warn(`[Search Handler] Failed to fetch summary from R2 for key ${item.summaryR2Key}:`, r2Error);
          }
      }
      searchResultsWithSummaries.push({
          ...item,
          summary: summaryText,
          score: scoresMap.get(item.id.toString()) // Ensure ID is string for map lookup if it isn't already
      });
  }
  
  // Preserve the order from Vectorize (most similar first)
  searchResultsWithSummaries.sort((a, b) => (scoresMap.get(b.id.toString()) || 0) - (scoresMap.get(a.id.toString()) || 0));


  console.log(`[Search Handler] Returning ${searchResultsWithSummaries.length} results.`);
  return new Response(JSON.stringify({ results: searchResultsWithSummaries }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
