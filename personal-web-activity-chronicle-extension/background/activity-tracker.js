import { STORAGE_KEYS, DEFAULT_PERIODIC_SCRAPE_INTERVAL_MINUTES, IDLE_DETECTION_INTERVAL_SECONDS, IDLE_TIMEOUT_SECONDS } from '../lib/constants.js';
import { sendActivityLog } from './cloudflare-client.js';

// --- State ---
let activeTabId = null;
let activeTabInfo = null; // { url, title, startTimestamp, textContent, maxScrollPercent }
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
  // Clear any periodic scrape alarm for this tab
  chrome.alarms.clear('periodic-scrape-' + endedTabId, (wasCleared) => {
    if (wasCleared) console.log(`[Tracker] Cleared periodic scrape alarm for tab ${endedTabId}`);
  });

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
      STORAGE_KEYS.MIN_DURATION,
      'trackingPaused'
    ]);
    const workerUrl = settings[STORAGE_KEYS.WORKER_URL];
    const authToken = settings[STORAGE_KEYS.AUTH_TOKEN];
    const urlBlacklist = settings[STORAGE_KEYS.URL_BLACKLIST] || DEFAULT_URL_BLACKLIST;
    const minDurationSeconds = settings[STORAGE_KEYS.MIN_DURATION] ?? DEFAULT_MIN_DURATION_SECONDS; // Use ?? for 0 case
    const trackingPaused = settings.trackingPaused || false;

    // --- Filtering Checks ---
    // Check 0: Tracking paused
    if (trackingPaused) {
      console.log(`[Tracker] Skipping log for tab ${endedTabId} - Tracking is paused.`);
      return;
    }

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
    // This final scrape ensures we have the absolute latest data.
    // The result will update activeTabInfo.textContent and activeTabInfo.maxScrollPercent.
    // The payload sent will use these updated values.
    try {
      console.log(`[Tracker] Executing final scraper script in tab ${numericTabId} to trigger message sending.`);
      // Promise to wait for the scraper result message
      const scraperResultPromise = new Promise((resolveScraperResult, rejectScraperResult) => {
        const listener = (message, sender, sendResponse) => {
          // Check if the message is from the correct tab and is the scraper result
          if (message.type === 'SCRAPER_RESULT' && sender.tab && sender.tab.id === numericTabId) {
            activeTabInfo.textContent = message.textContent || ''; // Update activeTabInfo
            activeTabInfo.maxScrollPercent = message.maxScrollPercent || 0; // Update activeTabInfo
            console.log(`[Tracker] Received FINAL SCRAPER_RESULT from tab ${numericTabId}. Length: ${activeTabInfo.textContent.length}, Scroll: ${activeTabInfo.maxScrollPercent}%. Preparing to resolve promise.`);
            chrome.runtime.onMessage.removeListener(listener); // Clean up listener
            resolveScraperResult({ textContent: activeTabInfo.textContent, maxScrollPercent: activeTabInfo.maxScrollPercent });
            return false; // Indicate no further response from this listener
          }
          // Listen for SCRAPER_ERROR as well
          if (message.type === 'SCRAPER_ERROR' && sender.tab && sender.tab.id === numericTabId) {
            console.warn(`[Tracker] Received FINAL SCRAPER_ERROR from tab ${numericTabId}:`, message.error);
            chrome.runtime.onMessage.removeListener(listener); // Clean up listener
            // Resolve with current activeTabInfo content (might be from periodic scrape)
            resolveScraperResult({ textContent: activeTabInfo.textContent, maxScrollPercent: activeTabInfo.maxScrollPercent }); 
            return false;
          }
          return false; // Important for other listeners
        };
        chrome.runtime.onMessage.addListener(listener);

        // Send message to content script to start scraping
        chrome.tabs.sendMessage(numericTabId, { type: 'REQUEST_SCRAPE_AND_SCROLL' })
          .catch(err => {
            console.warn(`[Tracker] Error sending REQUEST_SCRAPE_AND_SCROLL to tab ${numericTabId} (final scrape):`, err);
            // If sendMessage fails (e.g., tab closed, no content script), resolve with existing data
            chrome.runtime.onMessage.removeListener(listener);
            resolveScraperResult({ textContent: activeTabInfo.textContent, maxScrollPercent: activeTabInfo.maxScrollPercent });
          });

        // Set a timeout for the scraper response
        setTimeout(() => {
          chrome.runtime.onMessage.removeListener(listener);
          console.warn(`[Tracker] Timeout waiting for FINAL scraper result from tab ${numericTabId}. Using potentially stale data.`);
          resolveScraperResult({ textContent: activeTabInfo.textContent, maxScrollPercent: activeTabInfo.maxScrollPercent });
        }, 10000); // 10 seconds timeout
      });

      // 2b. Await the scraper result
      const scrapeData = await scraperResultPromise;

      const logPayload = {
        id: crypto.randomUUID(), // Generate a unique ID for this log entry for IDB
        url: endedTabInfo.url,
        title: endedTabInfo.title,
        startTimestamp: endedTabInfo.startTimestamp,
        endTimestamp,
        timeSpentSeconds,
        textContent: scrapeData.textContent, // Use data from activeTabInfo (updated by scrape)
        maxScrollPercent: scrapeData.maxScrollPercent, // Use data from activeTabInfo
        // contentHash will be calculated by cloudflare-client.js if textContent is present
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
      console.error(`[Tracker] Error during scraper script execution or message handling for tab ${numericTabId}:`, error);
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
      textContent: '', // Initialize
      maxScrollPercent: 0 // Initialize
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

    // Create a periodic scrape alarm for this tab
    const settings = await chrome.storage.local.get(STORAGE_KEYS.PERIODIC_SCRAPE_INTERVAL_MINUTES);
    const intervalMinutes = settings[STORAGE_KEYS.PERIODIC_SCRAPE_INTERVAL_MINUTES] || DEFAULT_PERIODIC_SCRAPE_INTERVAL_MINUTES;
    
    chrome.alarms.create('periodic-scrape-' + tabId, { 
      delayInMinutes: intervalMinutes, // Initial delay before first scrape
      periodInMinutes: intervalMinutes 
    });
    console.log(`[Tracker] Created periodic scrape alarm for tab ${tabId} with interval ${intervalMinutes} minutes.`);

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

async function handlePeriodicScrapeAlarm(alarm) {
  // Chrome passes an alarm object with a 'name' property
  const alarmName = alarm.name;
  if (!alarmName || !alarmName.startsWith('periodic-scrape-')) return;

  const tabIdStr = alarmName.substring('periodic-scrape-'.length);
  const tabId = parseInt(tabIdStr, 10);

  if (isNaN(tabId) || !activeTabInfo || activeTabId !== tabId || !isWindowFocused) {
    console.log(`[Tracker] Periodic scrape for tab ${tabId} skipped (inactive, not focused, or no longer tracked).`);
    // Optionally clear the alarm if the tab is no longer truly active for scraping
    // chrome.alarms.clear(alarmName);
    return;
  }

  console.log(`[Tracker] Periodic scrape triggered for active tab ${tabId}`);
  try {
    // Re-use or adapt the scraping logic. We need to ensure this updates activeTabInfo.
    // This is a simplified call; actual scraping logic is more complex in handleTabEnd.
    // We need a way to request scrape and get results back to update activeTabInfo here.
    // For now, let's assume a function requestAndUpdateScrapeData(tabId) exists.
    await requestAndUpdateScrapeData(tabId);
  } catch (error) {
    console.error(`[Tracker] Error during periodic scrape for tab ${tabId}:`, error);
  }
}

async function requestAndUpdateScrapeData(tabId) {
  if (activeTabId !== tabId || !activeTabInfo) return;

  console.log(`[Tracker] Requesting scrape data for tab ${tabId} (periodic update)`);
  return new Promise(async (resolve, reject) => {
    try {
      const numericTabId = Number(tabId);
      // This replicates part of handleTabEnd's scrape initiation.
      // We need to listen for 'SCRAPER_RESULT' or 'SCRAPER_ERROR'
      const scraperListener = (message, sender, sendResponse) => {
        if (sender.tab && sender.tab.id === numericTabId) {
          if (message.type === 'SCRAPER_RESULT') {
            chrome.runtime.onMessage.removeListener(scraperListener);
            activeTabInfo.textContent = message.textContent || '';
            activeTabInfo.maxScrollPercent = message.maxScrollPercent || 0;
            console.log(`[Tracker] Periodic scrape for tab ${tabId} updated activeTabInfo. Text length: ${activeTabInfo.textContent.length}, Scroll: ${activeTabInfo.maxScrollPercent}%`);
            resolve();
            return false;
          } else if (message.type === 'SCRAPER_ERROR') {
            chrome.runtime.onMessage.removeListener(scraperListener);
            console.warn(`[Tracker] Periodic scrape error for tab ${tabId}:`, message.error);
            resolve(); // Resolve anyway, don't let periodic update fail everything
            return false;
          }
        }
        return false;
      };
      chrome.runtime.onMessage.addListener(scraperListener);

      // Send message to content script to start scraping
      await chrome.tabs.sendMessage(numericTabId, { type: 'REQUEST_SCRAPE_AND_SCROLL' });
      console.log(`[Tracker] Sent REQUEST_SCRAPE_AND_SCROLL to tab ${numericTabId} for periodic update.`);

      // Timeout for scraper response
      setTimeout(() => {
        chrome.runtime.onMessage.removeListener(scraperListener);
        console.warn(`[Tracker] Timeout waiting for periodic scrape result from tab ${tabId}`);
        resolve(); // Resolve to not block, even if timeout
      }, 10000); // 10 seconds timeout

    } catch (error) {
      console.error(`[Tracker] Error in requestAndUpdateScrapeData for tab ${tabId}:`, error);
      reject(error); // This will be caught by handlePeriodicScrapeAlarm's catch
    }
  });
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

// Alarm Listener
chrome.alarms.onAlarm.addListener(handlePeriodicScrapeAlarm);

// Chrome Idle API setup for better inactivity detection
chrome.idle.setDetectionInterval(IDLE_DETECTION_INTERVAL_SECONDS);

// Idle state change listener
chrome.idle.onStateChanged.addListener(async (newState) => {
    console.log(`[Tracker] Idle state changed to: ${newState}`);
    
    if (newState === 'active') {
        // User is active again
        lastActivityTimestamp = Date.now();
        
        // If we had a tab that was being tracked before idle, the normal
        // focus/activation flow will handle resuming it
        
    } else if (newState === 'idle' || newState === 'locked') {
        // User is idle or locked the screen
        console.log(`[Tracker] User is ${newState}. Ending active session if any.`);
        
        if (activeTabId && activeTabInfo) {
            // End the current active session
            await handleTabEnd(activeTabId, activeTabInfo);
            // Note: We keep activeTabId and activeTabInfo so we can potentially resume
            // when the user becomes active again
        }
    }
});

// Query initial idle state
chrome.idle.queryState(IDLE_TIMEOUT_SECONDS, (state) => {
    console.log(`[Tracker] Initial idle state: ${state}`);
    if (state === 'idle' || state === 'locked') {
        // If starting in idle state, ensure we're not tracking
        isWindowFocused = false;
    }
});

// Export function for graceful shutdown
export async function gracefulShutdown() {
    console.log('[Tracker] Performing graceful shutdown...');
    
    // End any active tab session
    if (activeTabId && activeTabInfo) {
        await handleTabEnd(activeTabId, activeTabInfo);
    }
    
    // Clear all periodic scrape alarms
    const alarms = await chrome.alarms.getAll();
    for (const alarm of alarms) {
        if (alarm.name.startsWith('periodic-scrape-')) {
            await chrome.alarms.clear(alarm.name);
            console.log(`[Tracker] Cleared alarm: ${alarm.name}`);
        }
    }
}

// TODO: Add listener for chrome.runtime.onSuspend to handle extension shutdown.

console.log('Activity tracker initialized with Chrome Idle API');

export { handlePeriodicScrapeAlarm }; 
