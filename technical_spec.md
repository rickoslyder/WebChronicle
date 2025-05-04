# Personal Web Activity Chronicle Technical Specification (Cloudflare Approach - Self-Contained)

## 1. System Overview

* **Core purpose and value proposition:** To provide a power user with a private, comprehensive, and automatically generated log of their web Browse activity. Leverages cloud infrastructure (Cloudflare) for processing (summarization, tagging via AI), storage (metadata, summaries), and enables potential remote access and advanced analysis features, while minimizing local resource impact.
* **Key workflows:**
    * Automatic detection and logging of page visits including metadata (URL, title, timestamps, time spent, scroll depth) by the browser extension.
    * Scraping of visible text content upon page navigation or periodically by the extension.
    * Sending scraped text and metadata to a Cloudflare Worker API endpoint.
    * Cloudflare Worker orchestrates:
        * Calls Cloudflare Workers AI (via AI Gateway) for summarization and tagging.
        * Stores metadata (URL, title, timestamp, tags, R2 key) in Cloudflare D1.
        * Stores generated summary in Cloudflare R2.
    * Offline Handling: Extension queues scraped data locally (IndexedDB) when offline and syncs with the Cloudflare Worker upon reconnection.
    * User configuration of extension behavior (e.g., scrape frequency, Worker endpoint/auth) via an options page.
    * Data accessible via Cloudflare infrastructure, enabling potential future remote access or analysis tools.
* **System architecture:**
    * **Browser Extension (Manifest V3):**
        * **Content Scripts:** Inject into pages for DOM scraping, scroll depth tracking.
        * **Background Service Worker:** Manages activity tracking, orchestrates scraping, handles communication with the Cloudflare Worker API, manages the offline queue. Must handle MV3's non-persistent nature; state must be reconstructible or stored persistently.
        * **Options Page:** Configures extension settings (scrape frequency, Worker endpoint/auth token).
        * **Local Storage:** Uses IndexedDB *only* for the offline data upload queue. Settings stored via `chrome.storage.local`.
    * **Cloudflare Backend:**
        * **Cloudflare Worker (`activity-log-worker`):** API endpoint receiving data from the extension. Orchestrates AI processing and data storage. Contains core backend logic.
        * **AI Gateway:** Manages requests to Workers AI, provides logging, caching (optional), rate limiting.
        * **Workers AI:** Provides LLM models for summarization and tagging.
        * **Cloudflare D1:** SQL database storing structured metadata (URL, title, timestamp, tags, R2 key).
        * **Cloudflare R2:** Object storage for larger text data (e.g., generated summaries).
        * **(Future)** Cloudflare Vectorize: For semantic search capabilities.

## 2. Project Structure

**A. Browser Extension (`personal-web-activity-chronicle-extension/`)**
```
├── manifest.json                   # Extension manifest (MV3, "type": "module" for SW)
├── icons/                          # Extension icons (16x16, 48x48, 128x128)
│   ├── icon16.png ...
├── background/
│   ├── service-worker.js           # Main background script (MV3 Service Worker)
│   ├── activity-tracker.js      # Manages active tab states, timers, time spent
│   └── cloudflare-client.js      # Handles API calls to CF Worker, offline queue logic
├── content/
│   ├── content-script.js           # Core content script logic
│   └── scraper.js                  # DOM scraping implementation
├── options/
│   ├── options.html
│   ├── options.css
│   └── options.js
├── lib/                            # Shared frontend libraries
│   ├── db-queue.js                 # IndexedDB wrapper for offline queue
│   ├── utils.js                   # Common utility functions
│   └── constants.js               # Shared constants (DB name, stores, default settings)
└── README.md
```
* **Note:** `manifest.json` must include `"type": "module"` in the `background` section for ES6 imports in `service-worker.js`. Permissions required: `tabs`, `storage`, `scripting`, `notifications`, `alarms`, `downloads`, potentially `activeTab`, and host permissions (`<all_urls>`).

**B. Cloudflare Worker (`activity-log-worker/`)**
```
├── wrangler.toml                   # Worker configuration (bindings to D1, R2, AI Gateway, Secrets)
├── src/
│   ├── index.ts                    # Worker entry point (handles requests)
│   ├── ai-handler.ts               # Logic for calling AI Gateway/Workers AI
│   ├── storage-handler.ts          # Logic for interacting with D1 and R2
│   └── types.ts                    # TypeScript type definitions
├── package.json
└── tsconfig.json
```

## 3. Feature Specification

### 3.1 Activity Detection and Session Tracking (`extension/background/activity-tracker.js`)

* **User story:** As a user, I want the extension to automatically know when I start and stop actively viewing a specific web page, applying filters, so it can log the duration and trigger data capture accurately.
* **Requirements:** Detect tab activation, updates, closure, and window focus changes. Track start/end times and accumulated active duration for valid pages. Apply domain whitelisting/blacklisting from settings. Handle service worker restarts gracefully.
* **Implementation Steps:**
    1.  Maintain an in-memory object mapping `tabId` to session data: `{ url, title, startTimestamp, lastActivityTimestamp, windowIsFocused, visibilityState, timeAccumulatedMs }`.
    2.  Listen to browser events: `chrome.tabs.onActivated`, `chrome.tabs.onUpdated` (filtering for `status === 'complete'` and URL/title changes), `chrome.tabs.onRemoved`, and `chrome.windows.onFocusChanged` to manage session lifecycles.
    3.  **Whitelist/Blacklist Check:** Before initiating tracking for any `tabId`, retrieve `blacklist` and `whitelist` from `chrome.storage.local`. If `url` matches `blacklist`, ignore. If `whitelist` is non-empty, only proceed if `url` matches `whitelist`. Otherwise (empty whitelist), proceed if not blacklisted.
    4.  **Time Calculation:** Increment `timeAccumulatedMs` periodically (e.g., `setInterval`) only when the tab's window is focused (`windowIsFocused`) AND the tab is visible (`visibilityState === 'visible'`). Pause accumulation otherwise.
    5.  **(Optional) Visibility:** Content script can monitor `document.visibilityState` and message the background script to update the `visibilityState` flag.
    6.  **Finalization Action (`finalizeSession(tabId)`):** When a session ends (navigation, close), calculate final `timeSpentSeconds = Math.round(timeAccumulatedMs / 1000)`, gather final metadata, request a final scrape from the content script, and upon receiving the `SCRAPE_RESULT`, trigger the process to send the complete data packet to the Cloudflare Worker via `cloudflare-client.js`. Remove `tabId` from active tracking and clear related alarms.
    7.  **Service Worker Restart Handling:** On service worker startup, attempt to reconstruct active session state by querying `chrome.tabs` and potentially reading transient state helpers from `chrome.storage.session`. Accept potential minor gaps if termination was abrupt.

### 3.2 Content Scraping (`extension/content/`)

* **User story:** As a user, I want the extension to capture the visible text content from web pages so it can be sent for processing and storage.
* **Requirements:** Extract visible text reasonably perceived by a user. Exclude script, style, and non-visible elements. Handle common web structures. Measure maximum scroll depth percentage reached during the session. Truncate excessively long text.
* **Implementation Steps:**
    1.  **Content Script (`content-script.js`):**
        * Listen for `REQUEST_SCRAPE` messages from the background script.
        * Track scroll events (debounced, e.g., 200ms) using `document.addEventListener('scroll', ...)`. Calculate `currentScroll = window.scrollY`, `totalHeight = document.documentElement.scrollHeight - window.innerHeight`. Maintain the maximum `scrollDepth = totalHeight > 0 ? (currentScroll / totalHeight) * 100 : 0` reached during the session in a variable `maxScrollDepth`.
    2.  **Scraper Logic (`scraper.js`):**
        * Implement `scrapeVisibleText()`:
            * **Primary Strategy:** Use `document.body.innerText` for simplicity and broad capture.
            * **Sanitization:** Clean the extracted text (trim whitespace, collapse multiple spaces/newlines).
            * **(Future Refinement):** Consider DOM traversal checking computed styles for visibility if `innerText` proves insufficient on key sites. Explicitly ignore `<script>`, `<style>`, etc.
    3.  **Response Preparation:**
        * On `REQUEST_SCRAPE`: Call `scrapeVisibleText()`, get the final `maxScrollDepth`.
        * **Truncation:** Check if `scrapedText.length` exceeds `constants.DEFAULT_TRUNCATION_LENGTH` (e.g., 50,000). If so, truncate: `textContent = textContent.substring(0, constants.DEFAULT_TRUNCATION_LENGTH) + '... [Truncated]'`.
        * Send results message to background: `chrome.runtime.sendMessage({ type: 'SCRAPE_RESULT', textContent: truncatedText, maxScrollPercent: maxScrollDepth })`.
* **Error Handling:** Catch errors during DOM access. Handle pages where injection might be blocked (CSP). Log failures. Send an error indication back if scraping fails.

### 3.3 Periodic Logging & Change Detection (`extension/background/`)

* **User story:** As a user, I want the extension to periodically capture the current state (text, scroll depth) of a page if I remain on it, ensuring the final logged version sent to the cloud is up-to-date.
* **Requirements:** Periodically trigger content scrapes for active, focused tabs using a configurable interval. Update the *in-memory representation* of the current session's state. Send data to the Cloudflare Worker *only* upon session finalization.
* **Implementation Steps:**
    1.  When an active session starts (`activity-tracker.js`), set a `chrome.alarms` named like `periodic-update-${tabId}` using the configured interval (`constants.DEFAULT_SCRAPE_INTERVAL`).
    2.  Implement `chrome.alarms.onAlarm` listener in `service-worker.js`.
    3.  When the alarm fires for a tracked tab that is still active/focused:
        * Request a scrape from the content script (`REQUEST_SCRAPE`).
        * On receiving `SCRAPE_RESULT`: Update the corresponding session data stored *in the background script's memory* (`activity-tracker.js`'s state object) with the new `scrapedText` and `maxScrollPercent`. **Do not** call the Cloudflare API at this point.
        * Reset the alarm for the next interval.
    4.  When a session is finalized (navigation, tab close), ensure the corresponding alarm is cleared using `chrome.alarms.clear()`.

### 3.4 Metadata Logging (`extension/background/`, `worker/src/`)

* **User story:** As a user, I want key metadata logged alongside the content.
* **Requirements:** Capture URL, Page Title, Start Timestamp, End Timestamp, Time Spent (seconds), Maximum Scroll Depth (%).
* **Implementation Steps:**
    * **Extension (`activity-tracker.js`):** Captures URL/Title from `chrome.tabs` objects. Records `startTimestamp`. Calculates `endTimestamp` and `timeSpentSeconds` during session finalization. Receives `maxScrollPercent` from the content script. Packages all this metadata along with `scrapedText` into the `logData` object.
    * **Cloudflare Worker (`storage-handler.ts`):** Receives the `logData` object. Extracts relevant metadata fields and inserts them into the appropriate columns in the D1 `logs` table.

### 3.5 Cloudflare API Interaction & Offline Queue (`extension/background/cloudflare-client.js`, `extension/lib/db-queue.js`)

* **User story:** As a user, I want the extension to reliably send my activity data to the cloud service, queueing data locally if I'm offline and sending it automatically when I'm back online.
* **Requirements:**
    * Send `logData` packets (metadata + scraped text) via `Workspace` POST request to the configured Cloudflare Worker endpoint.
    * Include authentication (e.g., a secret token configured by the user) in request headers.
    * Detect browser online/offline status using `navigator.onLine`.
    * If offline, reliably store the `logData` packet in a local IndexedDB queue.
    * Periodically check for online status and attempt to send queued items to the Worker.
    * Remove items from the local queue only after successful confirmation from the Worker (e.g., HTTP 200 OK).
    * Handle network and API errors during transmission.
* **Implementation Steps:**
    1.  **`cloudflare-client.js` - `sendActivityLog(logData)` function:**
        * Retrieve Worker endpoint URL (`workerUrl`) and auth token (`authToken`) from `chrome.storage.local`. If not configured, log an error and potentially notify user.
        * Check `navigator.onLine`.
        * **If Online:** Call `attemptToSend(logData, workerUrl, authToken)`.
        * **If Offline:** Call `db-queue.js` -> `addToQueue({ payload: logData, status: 'pending_upload', createdAt: Date.now() })`. Log indication that item was queued.
    2.  **`cloudflare-client.js` - `attemptToSend(logData, workerUrl, authToken)` function (async):**
        * Construct JSON payload from `logData`.
        * Use `Workspace(workerUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Auth-Token': authToken /* Or 'Authorization: Bearer ...' */ }, body: JSON.stringify(logData) })`.
        * `await` the response. Check `response.ok` (status 200-299).
        * **Return `true` on success.**
        * **On Failure:** Log the error (status code, network error). Return `false`. Handle specific statuses if needed (e.g., 401 Unauthorized - notify user of bad token?).
    3.  **`cloudflare-client.js` - `processOfflineQueue()` function (async):**
        * Called periodically by a `chrome.alarms` listener (e.g., every 5 minutes). The listener itself should check `navigator.onLine` before calling this.
        * Retrieve `workerUrl` and `authToken`. If missing, exit.
        * Fetch items from queue: `const items = await db-queue.js.getQueuedItems(5);` (Process in small batches).
        * For each `item` in `items`:
            * `const success = await attemptToSend(item.payload, workerUrl, authToken);`
            * If `success`: `await db-queue.js.deleteFromQueue(item.id);`
            * Else: Log failure. Optionally implement retry limits by updating a `retryCount` field on the item in the queue via `db-queue.js`.
    4.  **`db-queue.js`:** Implements IndexedDB helper functions (`initQueueDB`, `addToQueue`, `getQueuedItems`, `deleteFromQueue`, potentially `updateQueueItemRetryCount`) for the `offline_queue` object store defined in Section 4.
* **Error Handling:** Robustly handle fetch network errors, non-OK HTTP responses from the Worker, missing configuration, and potential IndexedDB errors. Provide user feedback (e.g., via `chrome.notifications` or badge text) for persistent failures like invalid auth tokens or inability to reach the Worker after multiple attempts.

### 3.6 Cloudflare Worker Logic (`worker/src/`)

* **User story:** (Implied) The cloud backend must securely receive data, orchestrate AI processing via Workers AI/AI Gateway, store results in R2/D1, and provide feedback.
* **Requirements:**
    * Expose an HTTP POST endpoint (e.g., `/log`).
    * Authenticate requests using a secret token passed in headers.
    * Validate and parse the incoming JSON payload (`logData`).
    * Construct appropriate prompts and call the configured Workers AI model via the AI Gateway for summarization and tagging.
    * Parse the AI response.
    * Generate a unique identifier (UUID) for the log entry.
    * Store the generated summary text in R2 using the UUID as part of the key.
    * Store the metadata (URL, title, timestamps, tags as JSON, R2 key, etc.) in the D1 database, using the UUID as the primary key.
    * Handle errors gracefully during AI calls, R2 writes, or D1 writes.
    * Return `HTTP 200 OK` on success, appropriate error codes (400, 401, 403, 500) on failure.
* **Implementation Steps (`worker/src/index.ts`, `ai-handler.ts`, `storage-handler.ts`):**
    1.  **Setup (`wrangler.toml`):** Define bindings for D1 (`DB`), R2 (`SUMMARIES_BUCKET`), and necessary secrets (`AUTH_TOKEN`, `AI_GATEWAY_URL`).
    2.  **Worker Entry (`index.ts`):**
        * Use a router (e.g., `itty-router`) for the `POST /log` route.
        * **Authentication Middleware/Check:** Verify `request.headers.get('X-Auth-Token') === env.AUTH_TOKEN`. Reject with 401/403 if invalid.
        * **Request Handling:** Parse JSON body (`await request.json()`). Perform basic validation on required fields (`url`, `scrapedText`, `startTimestamp`). Reject with 400 if invalid.
        * Generate `const entryId = crypto.randomUUID();`.
        * Call AI Handler: `const { summary, tags } = await processWithAI(logData.scrapedText, logData.url, logData.title, env);`
        * Call Storage Handler: `await storeData(entryId, logData, summary, tags, env);`
        * Return `new Response('Log processed', { status: 200 });`
        * Wrap core logic in `try...catch` to handle errors and return 500 responses with logged details.
    3.  **AI Processing (`ai-handler.ts` - `processWithAI` function):**
        * Construct prompts for summarization and tagging (requesting structured output like JSON or comma-separated tags).
        * Make `Workspace` call to `env.AI_GATEWAY_URL` (or directly to Workers AI endpoint if Gateway not used initially), passing the prompt and any required auth/headers for the AI service.
        * Await and parse the AI response. Extract `summary` (string) and `tags` (ensure parsed into `string[]`).
        * Return `{ summary, tags }`. Handle AI API errors (throw specific errors).
    4.  **Storage (`storage-handler.ts` - `storeData` function):**
        * Define R2 key: `const r2Key = `${entryId}-summary.txt`;`
        * **R2 Write:** `await env.SUMMARIES_BUCKET.put(r2Key, summary);`
        * **D1 Write:** Use prepared statements: `const stmt = env.DB.prepare("INSERT INTO logs (id, url, title, startTimestamp, ..., tagsJson, summaryR2Key, processedAt) VALUES (?, ?, ?, ?, ..., ?, ?, ?)"); await stmt.bind(entryId, logData.url, ..., JSON.stringify(tags), r2Key, Date.now()).run();`
        * Handle R2/D1 errors (throw specific errors).
* **Error Handling:** Implement robust error handling for invalid auth, bad payloads, AI API failures (timeouts, rate limits, errors), R2 put failures, D1 query/constraint errors. Log errors effectively using Worker logging.

### 3.7 User Interface & Configuration (`extension/options/`)

* **User story:** As a user, I need a simple interface to configure essential settings like the Worker endpoint, authentication token, and basic behavior.
* **Requirements:** Options page accessible via extension settings. Allow configuration of Cloudflare Worker URL, Authentication Token, Scrape Interval (seconds), Blacklist/Whitelist Domains. Store settings securely. Provide connection testing functionality.
* **Implementation Steps:**
    1.  **HTML (`options.html`):** Create form with input fields:
        * `workerUrl` (type="url", required)
        * `authToken` (type="password", required)
        * `scrapeIntervalSeconds` (type="number", min="60")
        * `blacklistDomains` (type="textarea", one domain per line)
        * `whitelistDomains` (type="textarea", one domain per line)
        * "Save Settings" button.
        * "Test Connection" button and a status display area.
    2.  **JavaScript (`options.js`):**
        * On load, fetch current settings from `chrome.storage.local` and populate the form. Use defaults from `constants.js` if no settings exist.
        * "Save Settings": Read form values, validate URL format, construct settings object, save using `chrome.storage.local.set()`. Show success/error message.
        * "Test Connection": Read URL/Token from form. Send a simple GET or POST request (e.g., to a `/ping` endpoint on the Worker) with the auth token. Display "Success" or "Failed: [Error Message]" in the status area based on the response.
    3.  **Constants (`constants.js`):** Define defaults (e.g., `DEFAULT_SCRAPE_INTERVAL = 300`).
* **Error Handling:** Validate user input (URL format, numeric interval). Handle errors during storage access. Provide clear feedback on save/test operations.

## 4. Database Schema

**A. Browser Extension IndexedDB Schema**

* **Database Name:** `PersonalWebActivityChronicleQueueDB` (from `constants.js`)
* **Version:** `1`
* **Object Stores:**
    * **`offline_queue`**: Stores `logData` packets awaiting upload to the Cloudflare Worker.
        * **Primary Key:** `id` (auto-incrementing integer).
        * **Fields:**
            * `id`: `INTEGER` (PK, autoIncrement)
            * `payload`: `JSON` (The full `logData` object intended for the Worker)
            * `status`: `TEXT` ('pending_upload')
            * `createdAt`: `INTEGER` (Unix ms)
            * `retryCount`: `INTEGER` (Default 0, increment on failed send attempts)
        * **Indexes:**
            * `idx_status`: On `status` field (To easily find pending items).

**B. Cloudflare D1 Schema**

* **Database Name:** (User-defined in Cloudflare dashboard)
* **Table Name:** `logs`
* **Columns:**
    * `id`: `TEXT` (Primary Key - UUID generated by Worker)
    * `url`: `TEXT NOT NULL`
    * `title`: `TEXT`
    * `startTimestamp`: `INTEGER NOT NULL` (Unix timestamp ms, from extension)
    * `endTimestamp`: `INTEGER` (Unix timestamp ms, from extension)
    * `timeSpentSeconds`: `INTEGER` (From extension)
    * `maxScrollPercent`: `INTEGER` (From extension)
    * `tagsJson`: `TEXT` (Stored as JSON array of strings, e.g., `'["tag1", "tag2"]'`)
    * `summaryR2Key`: `TEXT NOT NULL` (Key pointing to the summary object in R2)
    * `processedAt`: `INTEGER NOT NULL` (Unix timestamp ms, set by Worker)
* **Indexes:** Create indexes for efficient querying, e.g., on `startTimestamp`, `url`, `processedAt`.

**C. Cloudflare R2 Usage**

* **Bucket Name:** (User-defined in Cloudflare dashboard, e.g., `web-activity-summaries`)
* **Object Key Structure:** Recommend using the D1 `id` (UUID) for easy correlation, e.g., `${id}-summary.txt`.
* **Object Content:** The plain text summary generated by the Workers AI model.

## 5. Cloudflare Worker Actions & Extension Logic

### 5.1 Cloudflare Worker (`worker/src/`)

* **Handle `POST /log`**: Main request handler. Orchestrates authentication, validation, AI processing (`ai-handler.ts`), and storage (`storage-handler.ts`).
* **(Optional) Handle `GET /ping`**: Simple endpoint for the extension's "Test Connection" button. Checks auth header and returns 200 OK if valid.

### 5.2 Extension Background Script (`extension/background/`)

* **`activity-tracker.js`**: Manages session state, calculates metadata, triggers `sendActivityLog`.
* **`cloudflare-client.js`**: Implements `sendActivityLog` (checks online status, calls Worker API or queues), `processOfflineQueue` (sends queued items when online), `attemptToSend` (performs actual fetch call).
* **`service-worker.js`**: Listens to browser events (forwarding to `activity-tracker`), listens to `chrome.alarms` (triggering `processOfflineQueue`).

## 6. Design System (UI Components)

* **Extension Options Page:** Functional interface using standard HTML elements (`<input>`, `<button>`, `<textarea>`, `<label>`). Minimal CSS for layout and clarity. Must include fields for Worker URL and Auth Token. Include status display for connection test.
* **Visual Style:** Clean, simple. Default browser styles preferred, perhaps with minor adjustments for spacing and consistency.

## 7. Component Architecture (Extension & Worker)

* **Extension (Client - Options Page):** Vanilla JavaScript interacting with DOM and `chrome.storage.local`. Sends test requests via background script messaging if needed, or directly if permissions allow.
* **Extension (Background):** MV3 Service Worker using ES6 Modules. Manages browser events, transient session state, persistent offline queue (IndexedDB), network requests to CF Worker.
* **Cloudflare Worker:** TypeScript/JavaScript environment. Handles HTTP requests stateless-ly. Interacts with Cloudflare bindings (D1, R2, Secrets) and external APIs (AI Gateway/Workers AI) via `Workspace`. Structured into handlers/modules for clarity.

## 8. Data Flow

1.  **Capture:** Browser Extension (`content-script`, `activity-tracker`) monitors Browse, scrapes text, gathers metadata.
2.  **Send / Queue:** Extension (`activity-tracker` -> `cloudflare-client`) checks online status.
    * **Online:** `Workspace POST /log` request with `logData` payload and Auth header sent to **Cloudflare Worker**.
    * **Offline:** `logData` saved to **Extension IndexedDB Queue** (`db-queue.js`).
3.  **Cloudflare Processing (Online Path):**
    * **Worker** receives request -> Authenticates -> Validates -> Calls **AI Gateway** -> **Workers AI** -> Gets summary/tags -> Stores summary in **R2** -> Stores metadata + R2 key in **D1** -> Returns `HTTP 200` to Extension.
4.  **Sync (Offline Catch-up):**
    * Extension (`service-worker` alarm -> `cloudflare-client` -> `processOfflineQueue`) detects online status.
    * Fetches item from **IndexedDB Queue** -> Executes step 3 (Online Path) for the queued item.
    * On `HTTP 200` success from Worker -> Deletes item from **IndexedDB Queue**.