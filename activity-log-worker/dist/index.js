var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/itty-router/dist/itty-router.min.mjs
function e({ base: t = "", routes: n = [] } = {}) {
  return { __proto__: new Proxy({}, { get: /* @__PURE__ */ __name((e2, a, o) => (e3, ...r) => n.push([a.toUpperCase(), RegExp(`^${(t + e3).replace(/(\/?)\*/g, "($1.*)?").replace(/(\/$)|((?<=\/)\/)/, "").replace(/:(\w+)(\?)?(\.)?/g, "$2(?<$1>[^/]+)$2$3").replace(/\.(?=[\w(])/, "\\.").replace(/\)\.\?\(([^\[]+)\[\^/g, "?)\\.?($1(?<=\\.)[^\\.")}/*$`), r]) && o, "get") }), routes: n, async handle(e2, ...r) {
    let a, o, t2 = new URL(e2.url);
    e2.query = Object.fromEntries(t2.searchParams);
    for (var [p, s, u] of n) if ((p === e2.method || "ALL" === p) && (o = t2.pathname.match(s))) {
      e2.params = o.groups;
      for (var c of u) if (void 0 !== (a = await c(e2.proxy || e2, ...r))) return a;
    }
  } };
}
__name(e, "e");

// src/auth-handler.ts
async function authHandler(request, env) {
  console.log("Auth Handler - Env Keys:", Object.keys(env || {}));
  const token = request.headers.get("X-Auth-Token");
  const expectedToken = env?.AUTH_TOKEN;
  console.log("Auth Handler - Received Token:", token);
  console.log("Auth Handler - Expected Token:", expectedToken);
  const valid = token === expectedToken;
  console.log("Auth Handler - Is Valid:", valid);
  if (!valid) {
    console.log("Auth Handler - Unauthorized access attempt");
    return new Response("Unauthorized", { status: 401 });
  }
  console.log("Auth Handler - Authorized");
  return void 0;
}
__name(authHandler, "authHandler");

// src/ai-processor.ts
async function processTextWithAI(ai, textContent) {
  if (!textContent || textContent.trim().length === 0) {
    console.log("[AI Processor] No text content to process.");
    return { summary: "", tagsJson: "[]" };
  }
  const MAX_TEXT_LENGTH = 15e3;
  const truncatedText = textContent.length > MAX_TEXT_LENGTH ? textContent.slice(0, MAX_TEXT_LENGTH) : textContent;
  const prompt = `Given the following web page text content, provide a concise one-paragraph summary and suggest 2-7 relevant topic tags as a JSON array of strings.

Respond ONLY with a JSON object containing two keys: "summary" (string) and "tags" (JSON array of strings).

Example Response Format:
{
  "summary": "A concise summary of the text.",
  "tags": ["tag1", "tag2", "tag3"]
}

Text Content:
---
${truncatedText}
---

JSON Response:`;
  try {
    console.log("[AI Processor] Sending request to AI Gateway...");
    const rawAiResult = await ai.run("@cf/meta/llama-4-scout-17b-16e-instruct", { prompt });
    console.log("[AI Processor] Received AI response.");
    let parsedResponse = null;
    if (rawAiResult && typeof rawAiResult.response === "string") {
      try {
        parsedResponse = JSON.parse(rawAiResult.response.trim());
        console.log("[AI Processor] Successfully parsed AI response JSON.");
      } catch (parseError) {
        console.error("[AI Processor] Failed to parse JSON from AI response:", parseError);
        console.error("[AI Processor] Raw AI response string:", rawAiResult.response);
      }
    } else {
      console.error("[AI Processor] AI raw result did not contain a response string:", rawAiResult);
    }
    if (parsedResponse && typeof parsedResponse.summary === "string" && Array.isArray(parsedResponse.tags)) {
      const validTags = parsedResponse.tags.filter((tag) => typeof tag === "string");
      return {
        summary: parsedResponse.summary.trim(),
        tagsJson: JSON.stringify(validTags)
        // Store tags as JSON string
      };
    } else {
      console.error("[AI Processor] Parsed AI response has unexpected format or parsing failed:", parsedResponse);
      return { summary: truncatedText.slice(0, 200) + "... (AI processing failed)", tagsJson: "[]" };
    }
  } catch (error) {
    console.error("[AI Processor] Error calling AI Gateway:", error);
    return { summary: truncatedText.slice(0, 200) + "... (AI processing error)", tagsJson: "[]" };
  }
}
__name(processTextWithAI, "processTextWithAI");
async function generateEmbedding(ai, textInput) {
  if (!textInput || textInput.trim().length === 0) {
    console.log("[AI Processor - Embedding] No text content to generate embedding for.");
    return null;
  }
  const MAX_EMBEDDING_TEXT_LENGTH = 2e3;
  const text = textInput.length > MAX_EMBEDDING_TEXT_LENGTH ? textInput.slice(0, MAX_EMBEDDING_TEXT_LENGTH) : textInput;
  try {
    console.log(`[AI Processor - Embedding] Requesting embedding for text (original length: ${textInput.length}, effective length: ${text.length}).`);
    const model = "@cf/baai/bge-small-en-v1.5";
    const response = await ai.run(model, { text });
    if (response && response.data && Array.isArray(response.data) && response.data.length > 0 && Array.isArray(response.data[0]) && response.data[0].length > 0) {
      console.log(`[AI Processor - Embedding] Successfully generated embedding. Dimensions: ${response.data[0].length}`);
      return response.data[0];
    } else {
      console.error("[AI Processor - Embedding] Failed to generate embedding or AI response format is unexpected.");
      try {
        console.error("[AI Processor - Embedding] Raw AI response:", JSON.stringify(response).slice(0, 500));
      } catch (e2) {
        console.error("[AI Processor - Embedding] Raw AI response (unstringifiable):", response);
      }
      return null;
    }
  } catch (error) {
    console.error("[AI Processor - Embedding] Error calling AI Gateway for embedding:", error);
    return null;
  }
}
__name(generateEmbedding, "generateEmbedding");

// src/simhash-util.ts
var JenkinsInternal = class {
  constructor() {
    this.pc = 0;
    this.pb = 0;
  }
  static {
    __name(this, "JenkinsInternal");
  }
  // Implementation of lookup3 algorithm
  lookup3(k, pc, pb) {
    let length = k.length;
    let a, b, c;
    a = b = c = 3735928559 + length + pc;
    c += pb;
    let offset = 0;
    while (length > 12) {
      a += k.charCodeAt(offset + 0);
      a += k.charCodeAt(offset + 1) << 8;
      a += k.charCodeAt(offset + 2) << 16;
      a += k.charCodeAt(offset + 3) << 24;
      b += k.charCodeAt(offset + 4);
      b += k.charCodeAt(offset + 5) << 8;
      b += k.charCodeAt(offset + 6) << 16;
      b += k.charCodeAt(offset + 7) << 24;
      c += k.charCodeAt(offset + 8);
      c += k.charCodeAt(offset + 9) << 8;
      c += k.charCodeAt(offset + 10) << 16;
      c += k.charCodeAt(offset + 11) << 24;
      const mixed = this.mix(a, b, c);
      a = mixed.a;
      b = mixed.b;
      c = mixed.c;
      length -= 12;
      offset += 12;
    }
    switch (length) {
      // Handle remaining bytes
      case 12:
        c += k.charCodeAt(offset + 11) << 24;
      // Fall through
      case 11:
        c += k.charCodeAt(offset + 10) << 16;
      // Fall through
      case 10:
        c += k.charCodeAt(offset + 9) << 8;
      // Fall through
      case 9:
        c += k.charCodeAt(offset + 8);
      // Fall through
      case 8:
        b += k.charCodeAt(offset + 7) << 24;
      // Fall through
      case 7:
        b += k.charCodeAt(offset + 6) << 16;
      // Fall through
      case 6:
        b += k.charCodeAt(offset + 5) << 8;
      // Fall through
      case 5:
        b += k.charCodeAt(offset + 4);
      // Fall through
      case 4:
        a += k.charCodeAt(offset + 3) << 24;
      // Fall through
      case 3:
        a += k.charCodeAt(offset + 2) << 16;
      // Fall through
      case 2:
        a += k.charCodeAt(offset + 1) << 8;
      // Fall through
      case 1:
        a += k.charCodeAt(offset + 0);
        break;
      case 0:
        return { c: c >>> 0, b: b >>> 0 };
    }
    const finalMixed = this.finalMix(a, b, c);
    a = finalMixed.a;
    b = finalMixed.b;
    c = finalMixed.c;
    return { c: c >>> 0, b: b >>> 0 };
  }
  // Mixes 3 32-bit integers reversibly but fast
  mix(a, b, c) {
    a -= c;
    a ^= this.rot(c, 4);
    c += b;
    b -= a;
    b ^= this.rot(a, 6);
    a += c;
    c -= b;
    c ^= this.rot(b, 8);
    b += a;
    a -= c;
    a ^= this.rot(c, 16);
    c += b;
    b -= a;
    b ^= this.rot(a, 19);
    a += c;
    c -= b;
    c ^= this.rot(b, 4);
    b += a;
    return { a, b, c };
  }
  // Final mixing of 3 32-bit values (a,b,c) into c
  finalMix(a, b, c) {
    c ^= b;
    c -= this.rot(b, 14);
    a ^= c;
    a -= this.rot(c, 11);
    b ^= a;
    b -= this.rot(a, 25);
    c ^= b;
    c -= this.rot(b, 16);
    a ^= c;
    a -= this.rot(c, 4);
    b ^= a;
    b -= this.rot(a, 14);
    c ^= b;
    c -= this.rot(b, 24);
    return { a, b, c };
  }
  // Rotate x by k distance
  rot(x, k) {
    return x << k | x >>> 32 - k;
  }
  // Public hash function
  hash32(msg) {
    const h = this.lookup3(msg, this.pc, this.pb);
    return h.c;
  }
};
var SimHash = class {
  static {
    __name(this, "SimHash");
  }
  constructor(options) {
    this.kshingles = options?.kshingles ?? 4;
    this.maxFeatures = options?.maxFeatures ?? 128;
    this.jenkins = new JenkinsInternal();
  }
  // Tokenizes input into 'kshingles' number of tokens.
  tokenize(original) {
    const size = original.length;
    if (size <= this.kshingles) {
      return [original];
    }
    const shingles = [];
    for (let i = 0; i < size; i = i + this.kshingles) {
      shingles.push(i + this.kshingles < size ? original.slice(i, i + this.kshingles) : original.slice(i));
    }
    return shingles;
  }
  // Combine shingles
  combineShingles(shingles) {
    if (shingles.length === 0) return 0;
    if (shingles.length === 1) return shingles[0];
    shingles.sort((a, b) => a - b);
    if (shingles.length > this.maxFeatures) {
      shingles = shingles.slice(0, this.maxFeatures);
    }
    let simhash = 0;
    for (let pos = 0; pos < 32; pos++) {
      let weight = 0;
      const mask = 1 << pos;
      for (const shingle of shingles) {
        weight += (shingle & mask) !== 0 ? 1 : -1;
      }
      if (weight > 0) {
        simhash |= mask;
      }
    }
    return simhash >>> 0;
  }
  // Driver function.
  hash(input) {
    const tokens = this.tokenize(input);
    const shingles = tokens.map((token) => this.jenkins.hash32(token));
    const combinedHash = this.combineShingles(shingles);
    return combinedHash;
  }
};
var Comparator = class {
  static {
    __name(this, "Comparator");
  }
  // Calculates binary hamming distance of two base 16 integers (strings).
  static hammingDistance(x, y) {
    try {
      const n1 = parseInt(x, 16);
      const n2 = parseInt(y, 16);
      if (isNaN(n1) || isNaN(n2)) {
        console.error("Invalid hex string for Hamming distance:", x, y);
        return 32;
      }
      let xorResult = n1 ^ n2;
      let distance = 0;
      while (xorResult > 0) {
        distance++;
        xorResult &= xorResult - 1;
      }
      return distance;
    } catch (e2) {
      console.error("Error calculating Hamming distance:", e2);
      return 32;
    }
  }
  // Calculates bit-wise similarity - Jaccard index (on hex strings).
  static similarity(x, y) {
    try {
      const n1 = parseInt(x, 16);
      const n2 = parseInt(y, 16);
      if (isNaN(n1) || isNaN(n2)) return 0;
      const intersection = n1 & n2;
      const union = n1 | n2;
      const intersectionWeight = this.hammingWeight(intersection);
      const unionWeight = this.hammingWeight(union);
      return unionWeight === 0 ? 1 : intersectionWeight / unionWeight;
    } catch (e2) {
      return 0;
    }
  }
  // Calculates Hamming weight (population count) of a number.
  static hammingWeight(n) {
    let count = 0;
    while (n > 0) {
      n &= n - 1;
      count++;
    }
    return count;
  }
};

// src/log-handler.ts
async function bufferToHex(buffer) {
  const hashArray = Array.from(new Uint8Array(buffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
__name(bufferToHex, "bufferToHex");
async function calculateHash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuffer);
}
__name(calculateHash, "calculateHash");
var SIMHASH_THRESHOLD = 10;
async function logHandler(request, env) {
  let logData = null;
  try {
    const receivedData = await request.json();
    console.log("[Log Handler] Received Data:", JSON.stringify(receivedData).slice(0, 200) + "...");
    const missingFields = [];
    if (!receivedData.url) missingFields.push("url");
    if (!receivedData.startTimestamp) missingFields.push("startTimestamp");
    if (!receivedData.textContent) missingFields.push("textContent");
    if (missingFields.length > 0) {
      console.error("[Log Handler] Bad Request - Missing required fields:", missingFields);
      console.error("[Log Handler] Received fields:", Object.keys(receivedData));
      return new Response(`Bad Request: Missing required fields: ${missingFields.join(", ")}`, { status: 400 });
    }
    logData = {
      ...receivedData,
      id: receivedData.id || crypto.randomUUID(),
      // Use extension ID or generate new one
      processedAt: Date.now()
    };
    console.log(`[Log Handler] Processing log ID: ${logData.id}`);
    const contentHash = await calculateHash(logData.textContent);
    console.log(`[Log Handler] Calculated content hash: ${contentHash} for log ID: ${logData.id}`);
    const checkStmt = env.ACTIVITY_LOG_DB.prepare(
      `SELECT id FROM logs WHERE contentHash = ?1 LIMIT 1`
    ).bind(contentHash);
    const existingLog = await checkStmt.first();
    if (existingLog) {
      console.log(`[Log Handler] Duplicate content hash found (existing log ID: ${existingLog.id}). Skipping processing for new log ID: ${logData.id}.`);
      return new Response(JSON.stringify({ message: "Duplicate content, skipped processing.", existingLogId: existingLog.id }), {
        status: 200,
        // Or 202 Accepted, or maybe even 409 Conflict?
        headers: { "Content-Type": "application/json" }
      });
    }
    const simHasher = new SimHash();
    const newSimhashInt = simHasher.hash(logData.textContent);
    const newSimhashString = newSimhashInt.toString(16).padStart(8, "0");
    const previousLogStmt = env.ACTIVITY_LOG_DB.prepare(
      "SELECT id, contentSimhash FROM logs WHERE url = ? ORDER BY endTimestamp DESC LIMIT 1"
    );
    const previousLog = await previousLogStmt.bind(logData.url).first();
    if (previousLog?.contentSimhash) {
      try {
        const previousSimhashString = previousLog.contentSimhash;
        const distance = Comparator.hammingDistance(newSimhashString, previousSimhashString);
        console.log(`[Log Handler] URL: ${logData.url}, New Simhash: ${newSimhashString}, Prev Simhash: ${previousLog.contentSimhash}, Distance: ${distance}`);
        if (distance <= SIMHASH_THRESHOLD) {
          console.log(`[Log Handler] Simhash duplicate detected for URL ${logData.url} (Distance: ${distance}). Skipping insert.`);
          return new Response("Log received (Simhash duplicate detected).", { status: 200 });
        }
      } catch (simhashError) {
        console.error(`[Log Handler] Error during Simhash comparison for URL ${logData.url}:`, simhashError);
      }
    }
    let aiResult = await processTextWithAI(env.AI, logData.textContent);
    if (!aiResult) {
      console.warn(`[Log Handler] AI processing failed for log ID: ${logData.id}. Using fallback.`);
      aiResult = { summary: logData.textContent.slice(0, 200) + "... (AI processing failed)", tagsJson: "[]" };
    }
    const { summary, tagsJson } = aiResult;
    const summaryR2Key = `${logData.id}-summary.txt`;
    console.log(`[Log Handler] Storing summary in R2 with key: ${summaryR2Key}`);
    try {
      await env.ACTIVITY_SUMMARIES_BUCKET.put(summaryR2Key, summary);
      console.log(`[Log Handler] Successfully stored summary in R2 for log ID: ${logData.id}`);
    } catch (r2Error) {
      console.error(`[Log Handler] Failed to store SUMMARY in R2 for log ID: ${logData.id}:`, r2Error);
    }
    const contentR2Key = `${logData.id}-content.txt`;
    try {
      await env.ACTIVITY_SUMMARIES_BUCKET.put(contentR2Key, logData.textContent);
      console.log(`[Log Handler] Successfully stored content in R2 for log ID: ${logData.id}`);
    } catch (err) {
      console.error(`[Log Handler] Failed to store CONTENT in R2 for log ID: ${logData.id}:`, err);
      return new Response("Failed to store essential content data in R2", { status: 500 });
    }
    console.log(`[Log Handler] Storing metadata in D1 for log ID: ${logData.id}`);
    const stmt = env.ACTIVITY_LOG_DB.prepare(
      `INSERT INTO logs (id, url, title, startTimestamp, endTimestamp, timeSpentSeconds, maxScrollPercent, tagsJson, summaryR2Key, contentR2Key, processedAt, contentHash, contentSimhash)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`
    );
    try {
      const d1Result = await stmt.bind(
        logData.id,
        logData.url,
        logData.title || null,
        // Handle optional title
        logData.startTimestamp,
        logData.endTimestamp || null,
        // Handle optional endTimestamp
        logData.timeSpentSeconds || null,
        // Handle optional timeSpentSeconds
        logData.maxScrollPercent || 0,
        // Default to 0 if missing
        tagsJson,
        summaryR2Key,
        contentR2Key,
        logData.processedAt,
        contentHash,
        newSimhashString
        // Store the new Simhash
      ).run();
      if (d1Result.success) {
        console.log(`[Log Handler] Successfully stored metadata in D1 for log ID: ${logData.id}`);
        if (summary && summary.trim() !== "" && !summary.includes("(AI processing failed)") && !summary.includes("(AI processing error)")) {
          try {
            console.log(`[Log Handler - Vectorize] Generating embedding for summary of log ID: ${logData.id}`);
            const embeddingVector = await generateEmbedding(env.AI, summary);
            if (embeddingVector) {
              console.log(`[Log Handler - Vectorize] Embedding generated for log ID: ${logData.id}. Dimensions: ${embeddingVector.length}`);
              const vectorToUpsert = {
                id: logData.id,
                // Use the D1 log ID as the vector ID
                values: embeddingVector
                // metadata: { url: logData.url, title: logData.title } // Optional: add metadata if needed later
              };
              await env.VECTORIZE.upsert([vectorToUpsert]);
              console.log(`[Log Handler - Vectorize] Successfully upserted vector for log ID: ${logData.id} into Vectorize index.`);
            } else {
              console.warn(`[Log Handler - Vectorize] Embedding generation returned null for log ID: ${logData.id}. Skipping Vectorize upsert.`);
            }
          } catch (vectorizeError) {
            console.error(`[Log Handler - Vectorize] Error during embedding generation or Vectorize upsert for log ID: ${logData.id}:`, vectorizeError);
          }
        } else {
          console.log(`[Log Handler - Vectorize] Skipping embedding for log ID: ${logData.id} due to empty, placeholder, or error summary.`);
        }
        return new Response(JSON.stringify({ message: "Log received and processed.", logId: logData.id }), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      } else {
        console.error(`[Log Handler] D1 Insert failed for log ID: ${logData.id}`, d1Result.error);
        return new Response("Failed to store log metadata", { status: 500 });
      }
    } catch (d1Error) {
      console.error(`[Log Handler] D1 Bind/Run error for log ID: ${logData.id}`, d1Error);
      return new Response("Database error", { status: 500 });
    }
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error("[Log Handler] Invalid JSON received:", err);
      return new Response("Invalid JSON", { status: 400 });
    }
    console.error("[Log Handler] Unhandled error in /log handler:", err);
    const logId = logData ? logData.id : "unknown";
    console.error(`[Log Handler] Error occurred processing log ID: ${logId}`);
    return new Response("Internal Server Error", { status: 500 });
  }
}
__name(logHandler, "logHandler");

// src/get-logs-handler.ts
async function getLogsHandler(_request, env) {
  console.log("[Get Logs Handler] Received request");
  try {
    const stmt = env.ACTIVITY_LOG_DB.prepare(
      `SELECT id, url, title, startTimestamp, timeSpentSeconds, maxScrollPercent, tagsJson, processedAt
       FROM logs
       ORDER BY startTimestamp DESC
       LIMIT 20`
    );
    const { results } = await stmt.all();
    return new Response(JSON.stringify({ logs: results }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error("[Get Logs Handler] Error fetching logs:", error);
    return new Response("Error fetching logs", { status: 500 });
  }
}
__name(getLogsHandler, "getLogsHandler");

// src/get-summary-handler.ts
async function getSummaryHandler(request, env) {
  const logId = request.params?.id;
  console.log(`[Get Summary Handler] Received request for log ID: ${logId}`);
  if (!logId) {
    return new Response("Missing log ID parameter", { status: 400 });
  }
  try {
    const summaryKey = `${logId}-summary.txt`;
    console.log(`[Get Summary Handler] Attempting to get key: ${summaryKey} from R2 bucket: ${env.ACTIVITY_SUMMARIES_BUCKET}`);
    const summaryObject = await env.ACTIVITY_SUMMARIES_BUCKET.get(summaryKey);
    if (summaryObject === null) {
      console.warn(`[Get Summary Handler] Summary not found in R2 for key: ${summaryKey}`);
      return new Response(JSON.stringify({ error: "Summary not found" }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }
    console.log(`[Get Summary Handler] Successfully retrieved summary for key: ${summaryKey}`);
    const summaryText = await summaryObject.text();
    return new Response(JSON.stringify({ summary: summaryText }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error(`[Get Summary Handler] Error fetching summary for log ID ${logId}:`, error);
    return new Response("Error fetching summary", { status: 500 });
  }
}
__name(getSummaryHandler, "getSummaryHandler");

// src/get-content-handler.ts
async function getContentHandler(request, env) {
  const logId = request.params?.id;
  if (!logId) {
    return new Response("Missing log ID in request path.", { status: 400 });
  }
  console.log(`[Get Content Handler] Received request for log ID: ${logId}`);
  const contentKey = `${logId}-content.txt`;
  try {
    console.log(`[Get Content Handler] Attempting to get key: ${contentKey} from R2 bucket: ${env.ACTIVITY_SUMMARIES_BUCKET}`);
    const r2Object = await env.ACTIVITY_SUMMARIES_BUCKET.get(contentKey);
    if (r2Object === null) {
      console.log(`[Get Content Handler] Content not found for key: ${contentKey}`);
      return new Response("Content not found for the specified log ID.", { status: 404 });
    }
    console.log(`[Get Content Handler] Successfully retrieved content for key: ${contentKey}`);
    const headers = new Headers({
      "Content-Type": "text/plain; charset=utf-8"
      // Add cache control headers if desired
      // 'Cache-Control': 'public, max-age=3600' // Example: Cache for 1 hour
    });
    return new Response(r2Object.body, { headers, status: 200 });
  } catch (err) {
    console.error(`[Get Content Handler] Error retrieving content from R2 for key ${contentKey}:`, err);
    return new Response("Failed to retrieve content due to an internal error.", { status: 500 });
  }
}
__name(getContentHandler, "getContentHandler");

// src/search-handler.ts
async function searchHandler(request, env) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  let payload;
  try {
    payload = await request.json();
  } catch (e2) {
    return new Response("Invalid JSON payload", { status: 400 });
  }
  const { query, topK = 10 } = payload;
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return new Response("Search query is missing or empty", { status: 400 });
  }
  console.log(`[Search Handler] Received search query: "${query}", topK: ${topK}`);
  let queryEmbedding;
  try {
    console.log(`[Search Handler] Generating embedding for query: "${query}"`);
    queryEmbedding = await generateEmbedding(env.AI, query);
    if (!queryEmbedding) {
      console.error("[Search Handler] Failed to generate embedding for the search query.");
      return new Response("Failed to process search query (embedding generation failed)", { status: 500 });
    }
    console.log(`[Search Handler] Query embedding generated. Dimensions: ${queryEmbedding.length}`);
  } catch (error) {
    console.error("[Search Handler] Error generating query embedding:", error);
    return new Response("Error processing search query", { status: 500 });
  }
  let vectorMatches;
  try {
    console.log(`[Search Handler] Querying Vectorize index with topK: ${topK}`);
    const results = await env.VECTORIZE.query(queryEmbedding, { topK, returnValues: false });
    vectorMatches = results.matches;
    console.log(`[Search Handler] Vectorize returned ${vectorMatches.length} matches.`);
  } catch (error) {
    console.error("[Search Handler] Error querying Vectorize index:", error);
    return new Response("Error searching content", { status: 500 });
  }
  if (!vectorMatches || vectorMatches.length === 0) {
    return new Response(JSON.stringify({ message: "No results found.", results: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  const resultIds = vectorMatches.map((match) => match.id);
  const scoresMap = new Map(vectorMatches.map((match) => [match.id, match.score]));
  console.log(`[Search Handler] Fetching details from D1 for ${resultIds.length} IDs.`);
  const placeholders = resultIds.map(() => "?").join(",");
  const sql = `
    SELECT id, url, title, startTimestamp, endTimestamp, timeSpentSeconds, maxScrollPercent, tagsJson, summaryR2Key, processedAt 
    FROM logs 
    WHERE id IN (${placeholders})
  `;
  let d1Results;
  try {
    const stmt = env.ACTIVITY_LOG_DB.prepare(sql).bind(...resultIds);
    const { results } = await stmt.all();
    d1Results = results || [];
    console.log(`[Search Handler] D1 returned ${d1Results.length} full entries.`);
  } catch (error) {
    console.error("[Search Handler] Error fetching from D1:", error);
    return new Response("Error retrieving search result details", { status: 500 });
  }
  const searchResultsWithSummaries = [];
  for (const item of d1Results) {
    let summaryText = void 0;
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
      score: scoresMap.get(item.id.toString())
      // Ensure ID is string for map lookup if it isn't already
    });
  }
  searchResultsWithSummaries.sort((a, b) => (scoresMap.get(b.id.toString()) || 0) - (scoresMap.get(a.id.toString()) || 0));
  console.log(`[Search Handler] Returning ${searchResultsWithSummaries.length} results.`);
  return new Response(JSON.stringify({ results: searchResultsWithSummaries }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
__name(searchHandler, "searchHandler");

// src/backfill-handler.ts
async function backfillHandler(_request, env) {
  console.log("[Backfill] Starting embedding backfill process...");
  const results = {
    totalLogsFetched: 0,
    summariesFound: 0,
    embeddingsGenerated: 0,
    vectorsUpserted: 0,
    errors: []
  };
  try {
    const { results: logRecords, success: d1Success, error: d1Error } = await env.ACTIVITY_LOG_DB.prepare("SELECT id, summaryR2Key, title, url FROM logs WHERE summaryR2Key IS NOT NULL").all();
    if (!d1Success) {
      console.error("[Backfill] Failed to fetch logs from D1:", d1Error);
      results.errors.push(`D1 query failed: ${d1Error}`);
      return new Response(JSON.stringify(results), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    if (!logRecords || logRecords.length === 0) {
      results.errors.push("No log records with summaryR2Key found in D1 to process.");
      console.log("[Backfill] No suitable log records found.");
      return new Response(JSON.stringify(results), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    results.totalLogsFetched = logRecords.length;
    console.log(`[Backfill] Fetched ${results.totalLogsFetched} log records from D1.`);
    const vectorsToUpsert = [];
    for (const record of logRecords) {
      if (!record.summaryR2Key) {
        console.warn(`[Backfill] Skipping record ${record.id} as it has no summaryR2Key.`);
        continue;
      }
      try {
        const summaryObject = await env.ACTIVITY_SUMMARIES_BUCKET.get(record.summaryR2Key);
        if (!summaryObject) {
          const errMsg = `Summary not found in R2 for key: ${record.summaryR2Key} (log ID: ${record.id})`;
          console.warn(`[Backfill] ${errMsg}`);
          results.errors.push(errMsg);
          continue;
        }
        const summaryText = await summaryObject.text();
        results.summariesFound++;
        const embeddingValues = await generateEmbedding(env.AI, summaryText);
        if (!embeddingValues) {
          const errMsg = `Failed to generate embedding for summary of log ID: ${record.id}`;
          console.warn(`[Backfill] ${errMsg}`);
          results.errors.push(errMsg);
          continue;
        }
        results.embeddingsGenerated++;
        vectorsToUpsert.push({
          id: record.id,
          // Use D1 log ID as vector ID
          values: embeddingValues
          // Optionally, include metadata if your Vectorize index is configured for it
          // metadata: { title: record.title, url: record.url }
        });
      } catch (e2) {
        const errMsg = `Error processing record ${record.id}: ${e2.message}`;
        console.error(`[Backfill] ${errMsg}`, e2);
        results.errors.push(errMsg);
      }
    }
    const batchSize = 100;
    for (let i = 0; i < vectorsToUpsert.length; i += batchSize) {
      const batch = vectorsToUpsert.slice(i, i + batchSize);
      if (batch.length > 0) {
        try {
          console.log(`[Backfill] Upserting batch of ${batch.length} vectors to Vectorize... (Batch ${i / batchSize + 1})`);
          const upsertResponse = await env.VECTORIZE.upsert(batch);
          console.log("[Backfill] Vectorize upsert response:", upsertResponse);
          results.vectorsUpserted += batch.length;
        } catch (e2) {
          const errMsg = `Error upserting batch to Vectorize: ${e2.message}`;
          console.error(`[Backfill] ${errMsg}`, e2);
          results.errors.push(errMsg);
        }
      }
    }
    console.log("[Backfill] Backfill process completed.");
    return new Response(JSON.stringify(results), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[Backfill] Unhandled error during backfill process:", error);
    results.errors.push(`Unhandled error: ${error.message}`);
    return new Response(JSON.stringify(results), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
__name(backfillHandler, "backfillHandler");

// src/config.ts
var config = {
  cors: {
    // Add your allowed origins here
    // Chrome extensions use chrome-extension://EXTENSION_ID format
    allowedOrigins: [
      // Development origins
      "http://localhost:8080",
      "http://localhost:8787",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:8080",
      "http://127.0.0.1:3000"
      // Production origins - UPDATE THESE WITH YOUR ACTUAL DOMAINS
      // 'chrome-extension://YOUR_EXTENSION_ID',
      // 'https://your-ui-domain.netlify.app',
      // 'https://your-ui-domain.vercel.app', 
      // 'https://your-ui-domain.pages.dev',
      // 'https://your-custom-domain.com'
    ],
    // Allow requests with no origin (extensions, direct API calls)
    allowNoOrigin: true,
    // Allow credentials in CORS requests
    allowCredentials: true
  },
  // Rate limiting configuration (for future implementation)
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1e3
  },
  // Content size limits
  limits: {
    maxContentSize: 1024 * 1024,
    // 1MB
    maxSummaryLength: 2e3,
    maxTags: 10
  }
};

// src/index.ts
var router = e();
function addCorsHeaders(response, request) {
  const origin = request.headers.get("Origin");
  if (origin && config.cors.allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else if (!origin && config.cors.allowNoOrigin) {
    response.headers.set("Access-Control-Allow-Origin", "*");
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Auth-Token");
  if (config.cors.allowCredentials) {
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return response;
}
__name(addCorsHeaders, "addCorsHeaders");
router.options("*", (request) => {
  return addCorsHeaders(new Response(null, { status: 204 }), request);
});
router.get("/ping", authHandler, () => new Response("OK", { status: 200 }));
router.post("/log", authHandler, logHandler);
router.get("/logs", getLogsHandler);
router.post("/search", authHandler, searchHandler);
router.get("/logs/:id/summary", getSummaryHandler);
router.get("/log-content/:id", getContentHandler);
router.get("/admin/backfill-embeddings", authHandler, backfillHandler);
router.all("*", () => new Response("Not Found", { status: 404 }));
var index_default = {
  async fetch(request, env, _ctx) {
    try {
      const response = await router.handle(request, env);
      return addCorsHeaders(response, request);
    } catch (error) {
      console.error("Unhandled error:", error);
      const errorResponse = new Response("Internal Server Error", { status: 500 });
      return addCorsHeaders(errorResponse, request);
    }
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
