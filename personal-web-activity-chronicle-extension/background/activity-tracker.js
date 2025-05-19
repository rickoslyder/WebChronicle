import { STORAGE_KEYS } from '../lib/constants.js';
import { sendActivityLog } from './cloudflare-client.js';

// --- State ---
let activeTabId = null;
let activeTabInfo = null; // { url, title, startTimestamp }
let lastActivityTimestamp = Date.now();
let isWindowFocused = true; // Assume focused initially

// --- Constants ---
const MIN_TIME_SPENT_SECONDS = 5; // Ignore visits shorter than this
const INACTIVE_TIMEOUT_MINUTES = 15; // Consider session ended after this inactivity

// --- Default Settings ---
const DEFAULT_URL_BLACKLIST = ['localhost:', 'chrome://', 'file://']; // Example default blacklist
const DEFAULT_MIN_DURATION_SECONDS = 5; // Default minimum time

// --- Functions ---

async function handleTabEnd(endedTabId, endedTabInfo) {
  if (!endedTabInfo || !endedTabInfo.startTimestamp) return;
  // Ensure tabId is treated as a number for API calls
  const numericTabId = Number(endedTabId);

  const endTimestamp = Date.now();
  const timeSpentSeconds = Math.round((endTimestamp - endedTabInfo.startTimestamp) / 1000);

  try {
    // 1. Get ALL settings from storage (Worker, Auth, Filters)
    const settings = await chrome.storage.local.get([
      STORAGE_KEYS.WORKER_URL,
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.URL_BLACKLIST,
      STORAGE_KEYS.MIN_DURATION
    ]);
    const workerUrl = settings[STORAGE_KEYS.WORKER_URL];
    const authToken = settings[STORAGE_KEYS.AUTH_TOKEN];
    const urlBlacklist = settings[STORAGE_KEYS.URL_BLACKLIST] || DEFAULT_URL_BLACKLIST;
    const minDurationSeconds = settings[STORAGE_KEYS.MIN_DURATION] ?? DEFAULT_MIN_DURATION_SECONDS; // Use ?? for 0 case

    // --- Filtering Checks ---
    // Check 1: Minimum duration
    if (timeSpentSeconds < minDurationSeconds) {
      console.log(`[Tracker] Skipping log for tab ${endedTabId} - Duration (${timeSpentSeconds}s) less than minimum (${minDurationSeconds}s).`);
      return;
    }

    // Check 2: URL Blacklist
    if (urlBlacklist.some(pattern => endedTabInfo.url.includes(pattern))) {
      console.log(`[Tracker] Skipping log for tab ${endedTabId} - URL (${endedTabInfo.url}) matches blacklist.`);
      return;
    }
    // --- End Filtering Checks ---

    if (!workerUrl || !authToken) {
      console.warn('[Tracker] Worker URL or Auth Token not configured. Skipping log send.');
      return;
    }

    // Now safe to proceed with getting text and scroll data
    // 2a. Execute scraper script to trigger text extraction
    let textContent = ''; // Initialize textContent
    try {
      console.log(`[Tracker] Executing scraper script in tab ${numericTabId} to trigger message sending.`);
      // Promise to wait for the scraper result message
      const scraperResultPromise = new Promise((resolveScraperResult, rejectScraperResult) => {
        const listener = (message, sender, sendResponse) => {
          // Check if the message is from the correct tab and is the scraper result
          if (message.type === 'SCRAPER_RESULT' && sender.tab && sender.tab.id === numericTabId) {
            const receivedText = message.textContent || '';
            console.log(`[Tracker] Received SCRAPER_RESULT from tab ${numericTabId}. Length: ${receivedText.length}. Preparing to resolve promise with this text.`);
            chrome.runtime.onMessage.removeListener(listener); // Clean up listener
            resolveScraperResult(receivedText); // Resolve with the text content
            return false; // Indicate no further response from this listener
          }
          // Listen for SCRAPER_ERROR as well
          if (message.type === 'SCRAPER_ERROR' && sender.tab && sender.tab.id === numericTabId) {
            console.warn(`[Tracker] Received SCRAPER_ERROR from tab ${numericTabId}:`, message.error);
            chrome.runtime.onMessage.removeListener(listener); // Clean up listener
            resolveScraperResult(''); // Resolve with empty string on scraper error
            return false;
          }
          return false; // Important for other listeners
        };
        chrome.runtime.onMessage.addListener(listener);

        // Timeout for waiting for the scraper message
        setTimeout(() => {
          chrome.runtime.onMessage.removeListener(listener); // Clean up listener on timeout
          console.warn(`[Tracker] Timeout waiting for SCRAPER_RESULT or SCRAPER_ERROR from tab ${numericTabId}`);
          // Resolve with empty string on timeout, so await scraperResultPromise doesn't throw an unhandled rejection
          resolveScraperResult('');
        }, 5000); // 5-second timeout (adjust as needed)
      });

      // Execute the scraper script
      const scriptResults = await chrome.scripting.executeScript({
        target: { tabId: numericTabId },
        files: ['dist/content.js'], // Execute the bundled scraper
      });

      // Log the result of the script injection/execution attempt, but don't gate textContent on it.
      if (!scriptResults || scriptResults.length === 0 || scriptResults[0].result === undefined) {
        console.warn(`[Tracker] Scraper script injection may have failed or returned no definite result (undefined) for tab ${numericTabId}. Result:`, scriptResults);
      } else if (scriptResults[0].result === null) {
        console.warn(`[Tracker] Scraper script returned null (possibly due to premature page close) for tab ${numericTabId}.`);
      } else if (scriptResults[0].result === false) {
        console.warn(`[Tracker] Scraper script in tab ${numericTabId} explicitly returned false (indicated an internal error).`);
      } else {
        console.log(`[Tracker] Scraper script injection appears successful (returned ${scriptResults[0].result}) for tab ${numericTabId}.`);
      }

      // Primary way to get textContent is now via the message listener and scraperResultPromise
      console.log(`[Tracker] Awaiting text content from SCRAPER_RESULT message for tab ${numericTabId}.`);
      textContent = await scraperResultPromise;
      console.log(`[Tracker] After awaiting scraperResultPromise for tab ${numericTabId}, final textContent length: ${textContent?.length ?? 0}.`);

    } catch (err) {
      console.error(`[Tracker] Error during scraper script execution or message handling for tab ${numericTabId}:`, err);
      textContent = ''; // Default to empty on any overarching error
    }

    // 2b. Request scroll data from the other content script
    let maxScrollPercent = 0;
    try {
      console.log(`[Tracker] Requesting scroll data from tab ${numericTabId}`);
      const scrollResult = await chrome.tabs.sendMessage(numericTabId, { type: 'REQUEST_SCROLL_DATA' });
      if (scrollResult && typeof scrollResult.maxScrollPercent === 'number') {
        maxScrollPercent = scrollResult.maxScrollPercent;
        console.log(`[Tracker] Received max scroll percent from tab ${numericTabId}: ${maxScrollPercent}%`);
      } else {
        console.warn(`[Tracker] Invalid or no scroll result received from tab ${numericTabId}. Result:`, scrollResult);
      }
    } catch (err) {
      console.error(`[Tracker] Error requesting scroll data from tab ${numericTabId}:`, err);
      // Proceed with 0 scroll if message fails
    }

    // 3. Construct payload
    const logPayload = {
      id: crypto.randomUUID(), // Generate unique ID for the log entry
      url: endedTabInfo.url,
      title: endedTabInfo.title,
      startTimestamp: endedTabInfo.startTimestamp,
      endTimestamp,
      timeSpentSeconds,
      maxScrollPercent: maxScrollPercent,
      textContent: typeof textContent === 'string' ? textContent : '', // Ensure it's a string
      processedAt: 0 // Placeholder, Worker will set this
      // tagsJson will be added by the worker
      // summaryR2Key will be added by the worker
    };

    // 4. Send payload to logHandler
    console.log(`[Tracker] Sending log data for tab ${endedTabId}`);
    const sendResult = await sendActivityLog(workerUrl, authToken, logPayload);

    if (sendResult.success && !sendResult.storedOffline) {
      console.log(`[Tracker] Successfully sent log data for tab ${endedTabId} to worker.`);
    } else if (sendResult.success && sendResult.storedOffline) {
      console.log(`[Tracker] Failed to send log data for tab ${endedTabId} to worker, but it was successfully stored offline. Message: ${sendResult.message}`);
    } else {
      console.error(`[Tracker] Failed to send log data for tab ${endedTabId} and failed to store offline:`, sendResult.error, sendResult.idbSaveError);
    }

  } catch (error) {
    // Handle errors like tab not found, content script not responding, network errors, storage errors
    console.error(`[Tracker] Error during handleTabEnd for tab ${endedTabId}:`, error);
  }
}

async function handleTabStart(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    // Ignore non-http(s) URLs and incomplete tabs
    if (!tab || !tab.url || !tab.url.startsWith('http') || tab.status !== 'complete') {
      return;
    }

    const newActiveTabInfo = {
      url: tab.url,
      title: tab.title,
      startTimestamp: Date.now(),
    };

    // End the previous tab's session if there was one
    if (activeTabId && activeTabInfo) {
      handleTabEnd(activeTabId, activeTabInfo);
    }

    // Start the new tab's session
    activeTabId = tabId;
    activeTabInfo = newActiveTabInfo;
    lastActivityTimestamp = Date.now();
    console.log('[Tracker] Tab Start:', { tabId, info: activeTabInfo });
  } catch (error) {
    // Tab might have been closed before we could get it
    console.warn(`[Tracker] Error getting tab ${tabId}:`, error);
    if (activeTabId === tabId) {
       handleTabEnd(activeTabId, activeTabInfo); // End session if it was the active one
       activeTabId = null;
       activeTabInfo = null;
    }
  }
}

// --- Event Listeners ---

// Tab Activated (User switches tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log('[Tracker] Tab Activated:', activeInfo.tabId);
  await handleTabStart(activeInfo.tabId);
});

// Tab Updated (URL changes in the same tab, title changes)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // We only care about URL changes for the *active* tab
  if (tabId === activeTabId && changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
     console.log('[Tracker] Active Tab Updated:', { tabId, url: tab.url, title: tab.title });
    // Treat URL change as the start of a new 'page visit'
    await handleTabStart(tabId);
  } else if (tabId === activeTabId && changeInfo.title && activeTabInfo) {
    // Update title if only title changed
    activeTabInfo.title = changeInfo.title;
    console.log('[Tracker] Active Tab Title Updated:', { tabId, title: activeTabInfo.title });
  }
});

// Window Focus Changed
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  lastActivityTimestamp = Date.now();
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Lost focus (switched to another app)
    isWindowFocused = false;
    console.log('[Tracker] Window Lost Focus');
    if (activeTabId && activeTabInfo) {
      await handleTabEnd(activeTabId, activeTabInfo); // End current session
      // Keep activeTabId and activeTabInfo so we can resume if focus returns
    }
  } else {
    // Gained focus
    isWindowFocused = true;
    console.log('[Tracker] Window Gained Focus');
    // If focus returns to a window, check which tab is active *in that window*
    // and potentially start/resume its session.
    try {
       const [currentTab] = await chrome.tabs.query({ active: true, windowId: windowId });
       if (currentTab && currentTab.id !== activeTabId) {
           console.log(`[Tracker] Focus returned, starting session for tab ${currentTab.id}`);
           await handleTabStart(currentTab.id); // Start new session if different tab
       } else if (currentTab && currentTab.id === activeTabId && activeTabInfo) {
           // Resume session for the same tab
           activeTabInfo.startTimestamp = Date.now(); // Reset start time for the focused period
           console.log(`[Tracker] Focus returned, resuming session for tab ${activeTabId}`);
       }
    } catch (error) {
        console.error('[Tracker] Error querying active tab on focus gain:', error);
    }
  }
});

// TODO: Add listener for chrome.idle API if more precise inactivity detection is needed.
// TODO: Add listener for chrome.runtime.onSuspend to handle extension shutdown.

console.log('Activity tracker initialized');
