/// <reference types="@cloudflare/workers-types" />

import { processTextWithAI } from './ai-processor';
import type { LogDataPayload } from './types';
import { SimHash, Comparator } from './simhash-util';

// Define Env interface for better type safety
interface Env {
  AI: any; // AI Gateway binding
  ACTIVITY_SUMMARIES_BUCKET: R2Bucket; // R2 binding
  ACTIVITY_LOG_DB: D1Database; // D1 binding
  AUTH_TOKEN: string; // Secret
}

// Helper function to convert ArrayBuffer to hex string (for SHA-256 hash)
async function bufferToHex(buffer: ArrayBuffer): Promise<string> {
  const hashArray = Array.from(new Uint8Array(buffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Function to calculate SHA-256 hash of text
async function calculateHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

// Define Simhash threshold (adjust as needed)
const SIMHASH_THRESHOLD = 5;

export async function logHandler(request: Request, env: Env) {
  let logData: (LogDataPayload & { id: string, processedAt: number }) | null = null; // Add id/processedAt, init to null

  try {
    const receivedData: Omit<LogDataPayload, 'id' | 'processedAt'> & { id?: string, processedAt?: number } = await request.json();
    console.log('[Log Handler] Received Data:', JSON.stringify(receivedData).slice(0, 200) + '...'); // Log truncated

    // Validate required fields from extension
    if (!receivedData.url || !receivedData.startTimestamp || !receivedData.textContent) {
      console.error('[Log Handler] Bad Request - Missing required fields');
      return new Response('Bad Request', { status: 400 });
    }

    // Add server-side generated fields
    logData = {
      ...receivedData,
      id: receivedData.id || crypto.randomUUID(), // Use extension ID or generate new one
      processedAt: Date.now()
    };

    console.log(`[Log Handler] Processing log ID: ${logData.id}`);

    // --- Deduplication Logic --- 
    const contentHash = await calculateHash(logData.textContent);
    console.log(`[Log Handler] Calculated content hash: ${contentHash} for log ID: ${logData.id}`);

    const checkStmt = env.ACTIVITY_LOG_DB.prepare(
      `SELECT id FROM logs WHERE contentHash = ?1 LIMIT 1`
    ).bind(contentHash);
    
    const existingLog = await checkStmt.first();

    if (existingLog) {
      console.log(`[Log Handler] Duplicate content hash found (existing log ID: ${existingLog.id}). Skipping processing for new log ID: ${logData.id}.`);
      // Optionally, update the timestamp of the existing log here
      return new Response(JSON.stringify({ message: 'Duplicate content, skipped processing.', existingLogId: existingLog.id }), {
        status: 200, // Or 202 Accepted, or maybe even 409 Conflict?
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // --- End Deduplication Logic ---

    // --- Simhash Check ---
    const simHasher = new SimHash(); // Use default options (kshingles=4, maxFeatures=128)
    const newSimhashInt = simHasher.hash(logData.textContent); // Returns a 32-bit unsigned number
    const newSimhashString = newSimhashInt.toString(16).padStart(8, '0'); // Convert to 8-char hex string for storage/comparison

    const previousLogStmt = env.ACTIVITY_LOG_DB.prepare(
      'SELECT id, contentSimhash FROM logs WHERE url = ? ORDER BY endTimestamp DESC LIMIT 1'
    );
    const previousLog = await previousLogStmt.bind(logData.url).first<{ id: string; contentSimhash: string | null }>();

    if (previousLog?.contentSimhash) {
      try {
        const previousSimhashString = previousLog.contentSimhash; // Already stored as hex
        const distance = Comparator.hammingDistance(newSimhashString, previousSimhashString);

        console.log(`[Log Handler] URL: ${logData.url}, New Simhash: ${newSimhashString}, Prev Simhash: ${previousLog.contentSimhash}, Distance: ${distance}`);

        if (distance <= SIMHASH_THRESHOLD) {
          console.log(`[Log Handler] Simhash duplicate detected for URL ${logData.url} (Distance: ${distance}). Skipping insert.`);
          // Option B: Simply skip insert for now
          return new Response('Log received (Simhash duplicate detected).', { status: 200 });
          // TODO: Optionally implement Option A: Update existing log's endTimestamp
        }
      } catch (simhashError) {
        console.error(`[Log Handler] Error during Simhash comparison for URL ${logData.url}:`, simhashError);
        // Proceed with insert on comparison error
      }
    }
    // --- End Simhash Check ---

    // 1. Process with AI
    let aiResult = await processTextWithAI(env.AI, logData.textContent);
    if (!aiResult) {
      // Error logged within processTextWithAI, use fallback values
      console.warn(`[Log Handler] AI processing failed for log ID: ${logData.id}. Using fallback.`);
      // Use truncated text as summary, empty tags
      aiResult = { summary: logData.textContent.slice(0, 200) + '... (AI processing failed)', tagsJson: '[]' };
    }
    const { summary, tagsJson } = aiResult;

    // 2. Store summary in R2
    const summaryR2Key = `${logData.id}-summary.txt`;
    console.log(`[Log Handler] Storing summary in R2 with key: ${summaryR2Key}`);
    try {
      await env.ACTIVITY_SUMMARIES_BUCKET.put(summaryR2Key, summary);
      console.log(`[Log Handler] Successfully stored summary in R2 for log ID: ${logData.id}`);
    } catch (r2Error) {
      console.error(`[Log Handler] Failed to store SUMMARY in R2 for log ID: ${logData.id}:`, r2Error);
      // Potentially return an error response, or just continue without summary?
      // For now, log and continue
    }

    // 3. Store full text content in R2
    const contentR2Key = `${logData.id}-content.txt`;
    try {
      await env.ACTIVITY_SUMMARIES_BUCKET.put(contentR2Key, logData.textContent);
      console.log(`[Log Handler] Successfully stored content in R2 for log ID: ${logData.id}`);
    } catch (err) {
      console.error(`[Log Handler] Failed to store CONTENT in R2 for log ID: ${logData.id}:`, err);
      // If content fails to store, we probably shouldn't proceed with D1 insert
      return new Response('Failed to store essential content data in R2', { status: 500 });
    }

    // 4. Store metadata in D1
    console.log(`[Log Handler] Storing metadata in D1 for log ID: ${logData.id}`);
    const stmt = env.ACTIVITY_LOG_DB.prepare(
      `INSERT INTO logs (id, url, title, startTimestamp, endTimestamp, timeSpentSeconds, maxScrollPercent, tagsJson, summaryR2Key, contentR2Key, processedAt, contentHash, contentSimhash)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`
    );

    try {
      const d1Result = await stmt.bind(
        logData.id,
        logData.url,
        logData.title || null, // Handle optional title
        logData.startTimestamp,
        logData.endTimestamp || null, // Handle optional endTimestamp
        logData.timeSpentSeconds || null, // Handle optional timeSpentSeconds
        logData.maxScrollPercent || 0, // Default to 0 if missing
        tagsJson,
        summaryR2Key,
        contentR2Key,
        logData.processedAt,
        contentHash,
        newSimhashString // Store the new Simhash
      ).run();

      if (d1Result.success) {
        console.log(`[Log Handler] Successfully stored metadata in D1 for log ID: ${logData.id}`);
        return new Response('Log received', { status: 201 }); // 201 Created
      } else {
        console.error(`[Log Handler] D1 Insert failed for log ID: ${logData.id}`, d1Result.error);
        // Attempt to clean up R2 object if D1 fails? Maybe not necessary.
        return new Response('Failed to store log metadata', { status: 500 });
      }
    } catch (d1Error) {
      console.error(`[Log Handler] D1 Bind/Run error for log ID: ${logData.id}`, d1Error);
      return new Response('Database error', { status: 500 });
    }

  } catch (err: any) {
    if (err instanceof SyntaxError) {
      console.error('[Log Handler] Invalid JSON received:', err);
      return new Response('Invalid JSON', { status: 400 });
    }
    console.error('[Log Handler] Unhandled error in /log handler:', err);
    // Add logData id to error if available
    const logId = logData ? logData.id : 'unknown';
    console.error(`[Log Handler] Error occurred processing log ID: ${logId}`);
    return new Response('Internal Server Error', { status: 500 });
  }
}
