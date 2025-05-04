**\<brainstorming\>**

**1. Goal:** Create a step-by-step plan for an AI to generate the Chrome Extension and Cloudflare Worker based on the latest specification.

**2. Core Components Identification:**
\* **Extension:** Manifest V3, Background Service Worker (`service-worker.js`), Activity Tracking (`activity-tracker.js`), Cloudflare API Client + Offline Queue (`cloudflare-client.js`, `db-queue.js`), Content Script (`content-script.js`), Scraper (`scraper.js`), Options Page (`options.html/css/js`), Constants (`constants.js`), Utils (`utils.js`).
\* **Cloudflare Backend:** Worker (`index.ts`, `ai-handler.ts`, `storage-handler.ts`, `types.ts`), `wrangler.toml` config, D1 Database Schema, R2 Bucket, AI Gateway setup.

**3. Dependencies & Logical Flow:**
\* Initial project setup (both Extension and Worker).
\* User sets up Cloudflare resources (D1, R2, AI Gateway) - this is a prerequisite for backend steps.
\* Define D1 Schema and Worker configuration (`wrangler.toml`).
\* Implement basic Worker API endpoint (`/ping`, `/log` stubs) with authentication.
\* Implement basic Extension setup (Manifest, Background script).
\* Implement Extension Options page for configuration (URL, Token) and connection testing.
\* Implement Extension data capture logic (scraping, activity tracking).
\* Implement Extension logic to *send* data to the Worker (online path).
\* Implement Worker logic to *process* data (call AI, store in D1/R2).
\* Implement Extension offline queuing mechanism (IndexedDB, queue processing logic).
\* Add robust error handling and polish.

**4. Step Granularity:** Break down features into atomic tasks. For instance, Worker implementation will be split into: basic server, auth, `/ping` endpoint, `/log` data parsing, AI call logic, storage logic. Extension implementation: basic manifest, background setup, options HTML, options JS (load/save), options JS (test connection), content script injection, scraper logic, activity tracking logic, API client (send), API client (offline queue add), API client (offline queue processing). Each step should modify a small number of files.

**5. User Instructions:** Need clear prompts for the user to perform actions outside code generation, such as:
\* Running `npm install`.
\* Setting up Cloudflare D1, R2, AI Gateway via the dashboard.
\* Updating `wrangler.toml` with resource IDs.
\* Using `wrangler secret put` for the auth token.
\* Running `wrangler d1 execute` for the schema.
\* Deploying the Worker (`wrangler deploy`).
\* Loading/reloading the extension in Chrome.

**6. Error Handling/Validation:** Incorporate these into the steps where the relevant logic is implemented (e.g., add auth check in Worker step, add offline check in Extension API client step, add try/catch blocks in Worker processing steps).

**7. Review:** Ensure all parts of the spec are covered and the flow is logical. Ensure file count per step is reasonable (target \< 10, max 20).

**(End Brainstorming)**

-----

# Implementation Plan

## Setup & Configuration

  * [ ] Step 1: Initialize Extension Project Structure

      * **Task**: Create the basic directory structure for the Chrome extension and initialize the manifest file.
      * **Files**:
          * `personal-web-activity-chronicle-extension/manifest.json`: Create with basic fields (manifest\_version: 3, name, version, description).
          * `personal-web-activity-chronicle-extension/icons/`: Create directory.
          * `personal-web-activity-chronicle-extension/background/`: Create directory.
          * `personal-web-activity-chronicle-extension/content/`: Create directory.
          * `personal-web-activity-chronicle-extension/options/`: Create directory.
          * `personal-web-activity-chronicle-extension/lib/`: Create directory.
          * `personal-web-activity-chronicle-extension/README.md`: Create basic readme.
      * **Step Dependencies**: None
      * **User Instructions**: None

  * [ ] Step 2: Initialize Cloudflare Worker Project Structure

      * **Task**: Create the basic directory structure and configuration files for the Cloudflare Worker using TypeScript.
      * **Files**:
          * `activity-log-worker/package.json`: Create basic `package.json` (e.g., with `wrangler`, `typescript`, `@cloudflare/workers-types`, `itty-router`).
          * `activity-log-worker/tsconfig.json`: Create standard tsconfig for Workers.
          * `activity-log-worker/wrangler.toml`: Create basic `wrangler.toml` (specify `name`, `main = "src/index.ts"`, `compatibility_date`).
          * `activity-log-worker/src/`: Create directory.
          * `activity-log-worker/src/index.ts`: Create empty file.
          * `activity-log-worker/src/types.ts`: Create empty file.
      * **Step Dependencies**: None
      * **User Instructions**: Run `npm install` in the `activity-log-worker` directory.

  * [ ] Step 3: Cloudflare Resource Setup (User Task)

      * **Task**: User needs to manually create the required Cloudflare resources via the Cloudflare dashboard.
      * **Files**: None (User interacts with Cloudflare Dashboard)
      * **Step Dependencies**: Step 2
      * **User Instructions**:
        1.  Log in to your Cloudflare account.
        2.  Navigate to **Workers & Pages -\> D1**. Create a new D1 database (e.g., `web-chronicle-db`). Note the **Database ID**.
        3.  Navigate to **R2**. Create a new R2 bucket (e.g., `web-chronicle-summaries`). Note the **Bucket Name**.
        4.  Navigate to **Workers & Pages -\> AI Gateway**. Create a new Gateway. Configure a default route to a Workers AI text generation model (e.g., `@cf/meta/llama-4-scout-17b-16e-instruct`). Note the **Gateway ID** and the **Gateway Endpoint URL**.
        5.  Optionally, create a specific API token with Workers, D1, R2 permissions if preferred over global API key/email.

  * [ ] Step 4: Configure Worker Bindings and Secrets

      * **Task**: Update `wrangler.toml` with resource bindings and instruct the user to set the authentication secret.
      * **Files**:
          * `activity-log-worker/wrangler.toml`: Add binding configurations for D1, R2, and potentially AI Gateway URL (or use secrets/vars for URLs). Add placeholder for `AUTH_TOKEN` secret.
            ```toml
            # Example additions to wrangler.toml
            [[d1_databases]]
            binding = "DB" # Available as env.DB in Worker
            database_name = "web-chronicle-db" # Use the name you created
            database_id = "YOUR_D1_DATABASE_ID" # ** Replace with your D1 DB ID **

            [[r2_buckets]]
            binding = "SUMMARIES_BUCKET" # Available as env.SUMMARIES_BUCKET
            bucket_name = "web-chronicle-summaries" # Use the name you created

            [vars]
            AI_GATEWAY_URL = "YOUR_AI_GATEWAY_ENDPOINT_URL" # ** Replace with your Gateway URL **

            # We will set AUTH_TOKEN as a secret
            ```
      * **Step Dependencies**: Step 3
      * **User Instructions**:
        1.  Replace placeholder values (`YOUR_D1_DATABASE_ID`, `YOUR_AI_GATEWAY_ENDPOINT_URL`) in `activity-log-worker/wrangler.toml` with the actual values from Step 3.
        2.  Generate a secure secret token (e.g., using a password manager or `openssl rand -hex 32`).
        3.  In your terminal, in the `activity-log-worker` directory, run: `npx wrangler secret put AUTH_TOKEN`. Paste your secret token when prompted.

## Cloudflare Worker Implementation

  * [ ] Step 5: Define D1 Database Schema

      * **Task**: Create the SQL schema for the `logs` table in D1 and instruct the user to apply it.
      * **Files**:
          * `activity-log-worker/schema.sql`: Create file containing the `CREATE TABLE` statement for the `logs` table as defined in the spec (using UUID `id` as PK, `url`, `title`, `startTimestamp`, `tagsJson`, `summaryR2Key`, `processedAt`, etc.).
            ```sql
            DROP TABLE IF EXISTS logs;
            CREATE TABLE logs (
                id TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                title TEXT,
                startTimestamp INTEGER NOT NULL,
                endTimestamp INTEGER,
                timeSpentSeconds INTEGER,
                maxScrollPercent INTEGER,
                tagsJson TEXT, -- Store as JSON string: '["tag1", "tag2"]'
                summaryR2Key TEXT NOT NULL,
                processedAt INTEGER NOT NULL
            );
            -- Add indexes for common queries
            CREATE INDEX IF NOT EXISTS idx_start_timestamp ON logs (startTimestamp);
            CREATE INDEX IF NOT EXISTS idx_url ON logs (url);
            ```
      * **Step Dependencies**: Step 3 (D1 DB created)
      * **User Instructions**:
        1.  Review `schema.sql`.
        2.  In your terminal, in the `activity-log-worker` directory, run: `npx wrangler d1 execute YOUR_D1_DATABASE_NAME --file ./schema.sql` (Replace `YOUR_D1_DATABASE_NAME` with the name you gave your D1 DB, e.g., `web-chronicle-db`).

  * [ ] Step 6: Implement Worker Basic Server and Auth Middleware

      * **Task**: Set up the basic Worker entry point using `itty-router`, add CORS headers, and implement authentication middleware checking the `X-Auth-Token` header against the configured secret.
      * **Files**:
          * `activity-log-worker/src/index.ts`: Implement basic router setup, CORS handling (allow requests from extension origin), and an authentication middleware function `withAuth(request, env)` that checks `request.headers.get('X-Auth-Token') === env.AUTH_TOKEN`. Reject with 401/403 if invalid.
          * `activity-log-worker/src/types.ts`: Define basic types for Env (including bindings `DB`, `SUMMARIES_BUCKET`, `AUTH_TOKEN`, `AI_GATEWAY_URL`).
      * **Step Dependencies**: Step 4 (Secrets/Bindings configured)
      * **User Instructions**: Install `itty-router`: `npm install itty-router` in `activity-log-worker`.

  * [ ] Step 7: Implement Worker `/ping` Endpoint

      * **Task**: Add a simple GET `/ping` route to the Worker for connection testing. This route should pass the auth middleware.
      * **Files**:
          * `activity-log-worker/src/index.ts`: Add a `router.get('/ping', withAuth, () => new Response('Pong!', { status: 200 }))` route definition.
      * **Step Dependencies**: Step 6
      * **User Instructions**: Deploy the worker: `npx wrangler deploy` in `activity-log-worker`. Note the deployed worker URL.

## Chrome Extension Core Implementation

  * [ ] Step 8: Configure Extension Manifest (Background, Permissions)

      * **Task**: Update `manifest.json` to declare the background service worker, required permissions, and potentially content script placeholders.
      * **Files**:
          * `personal-web-activity-chronicle-extension/manifest.json`: Add `background`, `permissions` (tabs, storage, scripting, alarms, notifications, downloads, `<all_urls>`), and potentially `content_scripts` keys. Set background `service_worker` path and `type: "module"`.
      * **Step Dependencies**: Step 1
      * **User Instructions**: None

  * [ ] Step 9: Implement Basic Background Script & Constants

      * **Task**: Create the main background service worker file and the constants file.
      * **Files**:
          * `personal-web-activity-chronicle-extension/background/service-worker.js`: Add basic setup, e.g., `console.log` on install/startup.
          * `personal-web-activity-chronicle-extension/lib/constants.js`: Define constants (e.g., `DEFAULT_SCRAPE_INTERVAL`, `DEFAULT_TRUNCATION_LENGTH`, storage keys for settings).
      * **Step Dependencies**: Step 8
      * **User Instructions**: None

  * [ ] Step 10: Implement Options Page UI (HTML/CSS)

      * **Task**: Create the HTML structure and basic CSS for the Options page, including fields for Worker URL, Auth Token, and the Test Connection button.
      * **Files**:
          * `personal-web-activity-chronicle-extension/options/options.html`: Create HTML form with inputs (`workerUrl`, `authToken` type="password"), labels, Save button, Test Connection button, status display area.
          * `personal-web-activity-chronicle-extension/options/options.css`: Create basic CSS for layout and styling.
      * **Step Dependencies**: Step 1
      * **User Instructions**: Add `options_page` or `options_ui` key to `manifest.json` pointing to `options/options.html`.

  * [ ] Step 11: Implement Options Page Logic (Load/Save Settings)

      * **Task**: Add JavaScript to the Options page to load settings from `chrome.storage.local` on startup and save them when the Save button is clicked.
      * **Files**:
          * `personal-web-activity-chronicle-extension/options/options.js`: Implement functions to get settings (`chrome.storage.local.get`), populate form fields, add event listener to Save button to read form values and save (`chrome.storage.local.set`). Use constants from `lib/constants.js` for storage keys.
          * `personal-web-activity-chronicle-extension/options/options.html`: Link `options.js`.
      * **Step Dependencies**: Step 9, Step 10
      * **User Instructions**: None

  * [ ] Step 12: Implement Extension API Client (Ping Only) & Test Connection

      * **Task**: Create the basic `cloudflare-client.js` and implement the `pingServer` function. Connect the "Test Connection" button on the Options page to call this function.
      * **Files**:
          * `personal-web-activity-chronicle-extension/background/cloudflare-client.js`: Create file. Implement `async function pingServer(url, token)` that performs a GET request to `/ping` on the provided URL with the token in `X-Auth-Token` header. Return `{ success: true }` or `{ success: false, error: message }`.
          * `personal-web-activity-chronicle-extension/options/options.js`: Add event listener to "Test Connection" button. Read URL/Token from form. Send message to background script requesting a ping. Handle response message and update status display.
          * `personal-web-activity-chronicle-extension/background/service-worker.js`: Add message listener to handle `ping-request` message from options page, call `cloudflare-client.js#pingServer`, send response message back to options page.
      * **Step Dependencies**: Step 7 (Worker deployed), Step 11
      * **User Instructions**: Load the extension into Chrome (`chrome://extensions/ -> Load unpacked`). Open options, enter deployed worker URL and AUTH\_TOKEN secret, save, and test connection.

## Data Capture Implementation (Extension)

  * [ ] Step 13: Implement Content Scraper Logic

      * **Task**: Implement the text scraping, cleaning, and truncation logic.
      * **Files**:
          * `personal-web-activity-chronicle-extension/content/scraper.js`: Implement `scrapeVisibleText()` function using `document.body.innerText`, basic sanitization (whitespace), and truncation based on `constants.DEFAULT_TRUNCATION_LENGTH`.
          * `personal-web-activity-chronicle-extension/lib/constants.js`: Ensure `DEFAULT_TRUNCATION_LENGTH` is defined.
      * **Step Dependencies**: Step 9
      * **User Instructions**: None

  * [ ] Step 14: Implement Content Script (Injection, Scroll, Communication)

      * **Task**: Implement the content script to inject the scraper, listen for scrape requests from the background, track maximum scroll depth, and send results back.
      * **Files**:
          * `personal-web-activity-chronicle-extension/content/content-script.js`: Import `scrapeVisibleText` from `./scraper.js`. Add message listener for `REQUEST_SCRAPE`. Add debounced scroll listener to track `maxScrollDepth`. Send `SCRAPE_RESULT` message containing `textContent` and `maxScrollPercent` back to background script.
          * `personal-web-activity-chronicle-extension/manifest.json`: Configure `content_scripts` to inject `content-script.js` into `<all_urls>` (or based on permissions). Potentially set `"run_at": "document_idle"`. Add `scripting` permission if not already present (needed for programmatic injection if used later).
          * `personal-web-activity-chronicle-extension/lib/utils.js`: Add a simple `debounce` utility function if needed.
      * **Step Dependencies**: Step 13
      * **User Instructions**: Reload the extension in Chrome.

  * [ ] Step 15: Implement Activity Tracking Logic

      * **Task**: Implement the logic to track active tabs, session start/end times, focus changes, visibility, and calculate time spent. This step focuses only on tracking, *not* yet sending data.
      * **Files**:
          * `personal-web-activity-chronicle-extension/background/activity-tracker.js`: Implement session state management (in-memory object), event listeners (`tabs.onActivated`, `tabs.onUpdated`, `tabs.onRemoved`, `windows.onFocusChanged`), time accumulation logic, blacklist/whitelist check (reading from `chrome.storage.local`), and the `finalizeSession` function stub.
          * `personal-web-activity-chronicle-extension/background/service-worker.js`: Import and initialize activity tracking logic. Register the necessary browser event listeners, delegating to `activity-tracker.js`.
      * **Step Dependencies**: Step 9
      * **User Instructions**: None

## End-to-End Data Flow (Online Path)

  * [ ] Step 16: Implement Extension API Client (Send Log - Online Path)

      * **Task**: Implement the `sendActivityLog` function in `cloudflare-client.js` to handle the online path: sending the `logData` object to the Worker API. Implement `attemptToSend`.
      * **Files**:
          * `personal-web-activity-chronicle-extension/background/cloudflare-client.js`: Implement `async function sendActivityLog(logData)` which checks `navigator.onLine` and calls `attemptToSend` if online. Implement `async function attemptToSend(logData, workerUrl, authToken)` which performs the `Workspace POST` to `/log`. Handle response status.
      * **Step Dependencies**: Step 12
      * **User Instructions**: None

  * [ ] Step 17: Connect Activity Tracker to API Client

      * **Task**: Update the `finalizeSession` function in `activity-tracker.js` to gather final metadata, request the final scrape, and upon receiving the result, call `cloudflare-client.js#sendActivityLog` with the complete data.
      * **Files**:
          * `personal-web-activity-chronicle-extension/background/activity-tracker.js`: Modify `finalizeSession` to orchestrate final scrape request (using `chrome.tabs.sendMessage` or `chrome.scripting.executeScript`) and call `sendActivityLog` upon receiving `SCRAPE_RESULT`. Handle cases where scrape result might not arrive (e.g., tab closed too quickly).
          * `personal-web-activity-chronicle-extension/background/service-worker.js`: Add message listener for `SCRAPE_RESULT` if needed to correlate with `finalizeSession`.
      * **Step Dependencies**: Step 15, Step 16
      * **User Instructions**: Reload the extension. Basic online logging should now function (data sent to Worker, but Worker doesn't process/store it fully yet).

  * [ ] Step 18: Implement Worker Log Handler (Parsing & Stub Response)

      * **Task**: Update the Worker's POST `/log` handler to correctly parse the incoming `logData` payload and validate required fields. Return a success response without actual processing yet.
      * **Files**:
          * `activity-log-worker/src/index.ts`: Enhance the POST `/log` handler within the `try` block: `const logData = await request.json()`, add checks for essential fields like `url`, `scrapedText`, `startTimestamp`. Log received data for debugging. Return `200 OK`.
          * `activity-log-worker/src/types.ts`: Define `LogDataPayload` interface matching the structure sent by the extension.
      * **Step Dependencies**: Step 7
      * **User Instructions**: `npx wrangler deploy`. Test Browse briefly and check Worker logs (`wrangler tail`) to see if data arrives correctly.

  * [ ] Step 19: Implement Worker AI Handler

      * **Task**: Implement the logic in the Worker to call the AI Gateway / Workers AI for summarization and tagging.
      * **Files**:
          * `activity-log-worker/src/ai-handler.ts`: Create `async function processWithAI(text, url, title, env)` which constructs prompts, makes `Workspace` call to `env.AI_GATEWAY_URL`, parses response into `{ summary: string, tags: string[] }`, handles potential AI errors.
          * `activity-log-worker/src/index.ts`: Import and call `processWithAI` from the `/log` handler. Log the results.
      * **Step Dependencies**: Step 18
      * **User Instructions**: Ensure `AI_GATEWAY_URL` is correctly set in `wrangler.toml` or environment variables. `npx wrangler deploy`. Test again, check logs for summary/tags.

  * [ ] Step 20: Implement Worker Storage Handler (R2/D1)

      * **Task**: Implement the logic in the Worker to store the summary in R2 and the metadata (including tags and R2 key) in D1.
      * **Files**:
          * `activity-log-worker/src/storage-handler.ts`: Create `async function storeData(entryId, logData, summary, tags, env)` which generates R2 key, calls `env.SUMMARIES_BUCKET.put()`, prepares and executes `env.DB.prepare().bind().run()` D1 INSERT statement. Handle storage errors.
          * `activity-log-worker/src/index.ts`: Generate `entryId` (UUID). Import and call `storeData` after `processWithAI`. Ensure the final success response is only sent after storage completes.
      * **Step Dependencies**: Step 5 (Schema applied), Step 19
      * **User Instructions**: `npx wrangler deploy`. Test end-to-end logging. Check D1 and R2 via Cloudflare dashboard or `wrangler d1 execute / wrangler r2 object get` to verify data storage.

## Offline Queuing Implementation (Extension)

  * [ ] Step 21: Implement IndexedDB Queue Wrapper

      * **Task**: Implement the IndexedDB helper functions for managing the offline queue.
      * **Files**:
          * `personal-web-activity-chronicle-extension/lib/db-queue.js`: Implement `initQueueDB`, `addToQueue`, `getQueuedItems` (e.g., get oldest N pending), `deleteFromQueue`, `updateQueueItemRetryCount` (optional). Define DB name and store name.
      * **Step Dependencies**: Step 9
      * **User Instructions**: None

  * [ ] Step 22: Integrate Offline Queueing into API Client

      * **Task**: Modify `cloudflare-client.js#sendActivityLog` to use the offline detection and call `addToQueue` when offline.
      * **Files**:
          * `personal-web-activity-chronicle-extension/background/cloudflare-client.js`: Update `sendActivityLog` to check `navigator.onLine` and call `dbQueue.addToQueue({ payload: logData, status: 'pending_upload', createdAt: Date.now() })` if offline. Ensure `db-queue.js` functions are imported/used correctly.
      * **Step Dependencies**: Step 16, Step 21
      * **User Instructions**: None

  * [ ] Step 23: Implement Offline Queue Processing Logic

      * **Task**: Implement the `processOfflineQueue` function and set up a periodic alarm to trigger it.
      * **Files**:
          * `personal-web-activity-chronicle-extension/background/cloudflare-client.js`: Implement `async function processOfflineQueue()` which checks `navigator.onLine`, gets items via `dbQueue.getQueuedItems()`, calls `attemptToSend` for each, and calls `dbQueue.deleteFromQueue()` on success. Add basic retry limiting (e.g., don't retry indefinitely, maybe use `retryCount`).
          * `personal-web-activity-chronicle-extension/background/service-worker.js`: Use `chrome.alarms.create` to set up a recurring alarm (e.g., 'queue-processor', every 5 minutes). Add `chrome.alarms.onAlarm` listener that checks alarm name, checks `navigator.onLine`, and calls `processOfflineQueue`.
      * **Step Dependencies**: Step 22
      * **User Instructions**: Reload the extension. Test offline queuing: disconnect internet, browse a page, reconnect, wait for alarm, check Worker logs/D1/R2 for data.

## Finalization & Error Handling

  * [ ] Step 24: Implement Robust Error Handling in Worker

      * **Task**: Add comprehensive try/catch blocks and error logging within the Worker for auth, payload parsing, AI calls, R2 puts, and D1 inserts. Return meaningful error responses (500 for server errors, 4xx for client errors).
      * **Files**:
          * `activity-log-worker/src/index.ts`
          * `activity-log-worker/src/ai-handler.ts`
          * `activity-log-worker/src/storage-handler.ts`
      * **Step Dependencies**: Step 20
      * **User Instructions**: `npx wrangler deploy`.

  * [ ] Step 25: Implement Robust Error Handling in Extension

      * **Task**: Add error handling for API calls (`attemptToSend`), IndexedDB operations (`db-queue`), and background tasks. Implement user feedback for critical errors (e.g., invalid auth token from options, persistent inability to sync queue).
      * **Files**:
          * `personal-web-activity-chronicle-extension/background/cloudflare-client.js`
          * `personal-web-activity-chronicle-extension/lib/db-queue.js`
          * `personal-web-activity-chronicle-extension/options/options.js`: Improve feedback on connection test failures.
          * `personal-web-activity-chronicle-extension/background/service-worker.js`: Potentially use `chrome.notifications` or update badge text for persistent errors.
      * **Step Dependencies**: Step 23
      * **User Instructions**: Reload the extension. Test various failure scenarios (bad token, worker down, offline queue errors).

  * [ ] Step 26: Final Code Cleanup and Review

      * **Task**: Review all code for clarity, consistency, comments, potential optimizations, and adherence to the specification. Remove console logs used for debugging.
      * **Files**: All project files.
      * **Step Dependencies**: Step 25
      * **User Instructions**: Perform final testing of all features.

-----

**Summary and Key Considerations:**

This plan provides a structured approach to building the Chrome Extension and its Cloudflare backend. Key considerations include:

  * **User Actions:** Several steps require manual actions from the user (Cloudflare setup, running Wrangler commands, loading the extension). These are critical prerequisites.
  * **Cloudflare Costs:** Remind the user that running the Worker, AI Gateway, Workers AI, D1, and R2 involves costs beyond the free tiers.
  * **Security:** The use of a static auth token is basic; for higher security, more robust methods (e.g., Cloudflare Access, JWT) could be considered later. The token must be kept secret.
  * **Error Handling:** Robust error handling and user feedback (especially for configuration errors like a bad auth token) are crucial for usability.
  * **Testing:** Thorough testing in various scenarios (online, offline, reconnection, different websites, Worker errors) is essential.
  * **Iteration:** This plan provides a solid foundation. Further features (like a log viewer UI within the extension reading from a Worker endpoint, semantic search, etc.) can be built upon this base in subsequent phases.