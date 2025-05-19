import { Env, Vector } from './types';
import { generateEmbedding } from './ai-processor';

interface BackfillResult {
  totalLogsFetched: number;
  summariesFound: number;
  embeddingsGenerated: number;
  vectorsUpserted: number;
  errors: string[];
}

// Define a type for the rows we expect from D1 for backfilling
interface D1LogRecord {
  id: string;
  summaryR2Key: string | null;
  // Add other fields you might want to log or inspect, but these are key for backfill
  title: string | null;
  url: string;
}

export async function backfillHandler(_request: Request, env: Env): Promise<Response> {
  console.log('[Backfill] Starting embedding backfill process...');
  const results: BackfillResult = {
    totalLogsFetched: 0,
    summariesFound: 0,
    embeddingsGenerated: 0,
    vectorsUpserted: 0,
    errors: [],
  };

  try {
    // 1. Fetch all log entries from D1 that have a summaryR2Key
    //    and potentially haven't been vectorized yet (though upsert is idempotent)
    //    For simplicity, fetching all with summaryR2Key for now.
    //    Adjust with a WHERE clause if you add a 'vectorized_at' field later.
    const { results: logRecords, success: d1Success, error: d1Error } = await env.ACTIVITY_LOG_DB
      .prepare('SELECT id, summaryR2Key, title, url FROM logs WHERE summaryR2Key IS NOT NULL')
      .all<D1LogRecord>();

    if (!d1Success) {
      console.error('[Backfill] Failed to fetch logs from D1:', d1Error);
      results.errors.push(`D1 query failed: ${d1Error}`);
      return new Response(JSON.stringify(results), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    if (!logRecords || logRecords.length === 0) {
      results.errors.push('No log records with summaryR2Key found in D1 to process.');
      console.log('[Backfill] No suitable log records found.');
      return new Response(JSON.stringify(results), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    results.totalLogsFetched = logRecords.length;
    console.log(`[Backfill] Fetched ${results.totalLogsFetched} log records from D1.`);

    const vectorsToUpsert: Vector[] = [];

    // 2. For each log entry...
    for (const record of logRecords) {
      if (!record.summaryR2Key) {
        // This shouldn't happen due to WHERE clause, but good to check
        console.warn(`[Backfill] Skipping record ${record.id} as it has no summaryR2Key.`);
        continue;
      }

      try {
        // 2a. Fetch summary text from R2
        const summaryObject = await env.ACTIVITY_SUMMARIES_BUCKET.get(record.summaryR2Key);
        if (!summaryObject) {
          const errMsg = `Summary not found in R2 for key: ${record.summaryR2Key} (log ID: ${record.id})`;
          console.warn(`[Backfill] ${errMsg}`);
          results.errors.push(errMsg);
          continue;
        }
        const summaryText = await summaryObject.text();
        results.summariesFound++;

        // 2b. Generate embedding
        const embeddingValues = await generateEmbedding(env.AI, summaryText);
        if (!embeddingValues) {
          const errMsg = `Failed to generate embedding for summary of log ID: ${record.id}`;
          console.warn(`[Backfill] ${errMsg}`);
          results.errors.push(errMsg);
          continue;
        }
        results.embeddingsGenerated++;

        // 2c. Prepare vector for upsert
        vectorsToUpsert.push({
          id: record.id, // Use D1 log ID as vector ID
          values: embeddingValues,
          // Optionally, include metadata if your Vectorize index is configured for it
          // metadata: { title: record.title, url: record.url }
        });

      } catch (e: any) {
        const errMsg = `Error processing record ${record.id}: ${e.message}`;
        console.error(`[Backfill] ${errMsg}`, e);
        results.errors.push(errMsg);
      }
    } // end for loop

    // 3. Upsert vectors in batches (Vectorize supports up to 1000 vectors or 2MB per request)
    // For simplicity, we'll do it in chunks of 100 here.
    const batchSize = 100;
    for (let i = 0; i < vectorsToUpsert.length; i += batchSize) {
      const batch = vectorsToUpsert.slice(i, i + batchSize);
      if (batch.length > 0) {
        try {
          console.log(`[Backfill] Upserting batch of ${batch.length} vectors to Vectorize... (Batch ${i / batchSize + 1})`);
          const upsertResponse = await env.VECTORIZE.upsert(batch);
          console.log('[Backfill] Vectorize upsert response:', upsertResponse);
          results.vectorsUpserted += batch.length; // Assuming all in batch were processed if no error
        } catch (e: any) {
          const errMsg = `Error upserting batch to Vectorize: ${e.message}`;
          console.error(`[Backfill] ${errMsg}`, e);
          results.errors.push(errMsg);
          // Potentially stop or skip to next batch depending on error type
        }
      }
    }

    console.log('[Backfill] Backfill process completed.');
    return new Response(JSON.stringify(results), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('[Backfill] Unhandled error during backfill process:', error);
    results.errors.push(`Unhandled error: ${error.message}`);
    return new Response(JSON.stringify(results), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
