import './activity-tracker.js';
import { gracefulShutdown } from './activity-tracker.js';
import { pingServer, attemptToSendLog } from './cloudflare-client.js';
import { loadSettings } from './settings-manager.js';
import { getUnsyncedLogs, deleteLog } from '../lib/idb-manager.js';
import { SYNC_ALARM_NAME, SYNC_INTERVAL_MINUTES, STORAGE_KEYS } from '../lib/constants.js';

console.log('Background service worker initialized');

// --- Sync Offline Logs --- //
async function syncOfflineLogs() {
  console.log('[Service Worker] Attempting to sync offline logs...');
  const settings = await loadSettings([STORAGE_KEYS.WORKER_URL, STORAGE_KEYS.AUTH_TOKEN]);
  const workerUrl = settings[STORAGE_KEYS.WORKER_URL];
  const authToken = settings[STORAGE_KEYS.AUTH_TOKEN];

  if (!workerUrl || !authToken) {
    console.warn('[Service Worker] Worker URL or Auth Token not configured. Skipping sync.');
    return;
  }

  // Check server reachability first
  try {
    const pingResult = await pingServer(workerUrl, authToken);
    if (!pingResult.success) {
      console.warn('[Service Worker] Ping failed. Server might be unreachable. Skipping sync.', pingResult);
      return;
    }
    console.log('[Service Worker] Server is reachable. Proceeding with sync.');
  } catch (pingError) {
    console.error('[Service Worker] Error during pre-sync ping:', pingError);
    return; // Don't proceed if ping itself errors
  }

  const logs = await getUnsyncedLogs();
  if (logs.length === 0) {
    console.log('[Service Worker] No offline logs to sync.');
    return;
  }

  console.log(`[Service Worker] Found ${logs.length} logs to sync.`);
  for (const log of logs) {
    console.log(`[Service Worker] Syncing log ID: ${log.id}`);
    try {
      // Use attemptToSendLog which only tries to send, doesn't re-queue on its own.
      // The syncOfflineLogs itself is the retry mechanism (via alarms/online events).
      const result = await attemptToSendLog(workerUrl, authToken, log);
      
      if (result.success) {
        console.log(`[Service Worker] Log ID: ${log.id} synced successfully using attemptToSendLog. Deleting from IDB.`);
        await deleteLog(log.id);
        lastSyncTime = Date.now();
      } else {
        console.warn(`[Service Worker] attemptToSendLog failed for log ID: ${log.id}. Error: ${result.error}, Status: ${result.status}. Will retry later.`);
        // Log remains in IDB for the next sync attempt.
      }
    } catch (error) {
      console.error(`[Service Worker] Error syncing log ID: ${log.id}:`, error);
      // Keep log in IDB for next attempt
    }
  }
  console.log('[Service Worker] Finished sync attempt.');
}

// --- Alarm & Event Listeners for Sync --- //
function createSyncAlarm() {
  chrome.alarms.get(SYNC_ALARM_NAME, (existingAlarm) => {
    if (!existingAlarm) {
        chrome.alarms.create(SYNC_ALARM_NAME, { 
            delayInMinutes: 1, // Delay initial run slightly
            periodInMinutes: SYNC_INTERVAL_MINUTES 
        });
        console.log('[Service Worker] Sync alarm created.');
    } else {
        console.log('[Service Worker] Sync alarm already exists.');
    }
  });
}

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Service Worker] onInstalled event. Reason:', details.reason);
  createSyncAlarm();
  // Optionally, trigger an immediate sync if appropriate for your logic
  // Consider network state before just firing it off
  if (navigator.onLine) {
    syncOfflineLogs();
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[Service Worker] onStartup event.');
  createSyncAlarm();
  // Run sync on startup if online
  if (navigator.onLine) {
    syncOfflineLogs();
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM_NAME) {
    console.log('[Service Worker] Sync alarm triggered.');
    syncOfflineLogs();
  }
});

// Listen for online event to trigger sync
self.addEventListener('online', () => {
  console.log('[Service Worker] Browser is online. Triggering log sync.');
  syncOfflineLogs();
});

// Track last sync time
let lastSyncTime = null;

// --- Existing Message Listener --- //
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING_REQUEST') {
    console.log('[Service Worker] Received PING_REQUEST:', message);
    pingServer(message.workerUrl, message.authToken).then(result => {
      console.log('[Service Worker] Sending response back to options:', result);
      sendResponse(result);
    }).catch(error => {
      console.error('[Service Worker] Error in pingServer promise:', error);
      sendResponse({ success: false, error: error.message || 'Ping server promise rejected'});
    });
    return true;
  }
  
  // Handle sync status request from popup
  if (message.type === 'GET_SYNC_STATUS') {
    (async () => {
      try {
        // Get queue count
        const unsyncedLogs = await getUnsyncedLogs();
        const queueCount = unsyncedLogs.length;
        
        // Get today's stats
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStats = await getTodayStats(todayStart.getTime());
        
        sendResponse({
          isOnline: navigator.onLine,
          queueCount: queueCount,
          lastSyncTime: lastSyncTime,
          todayStats: todayStats
        });
      } catch (error) {
        console.error('[Service Worker] Error getting sync status:', error);
        sendResponse({
          isOnline: navigator.onLine,
          queueCount: 0,
          lastSyncTime: lastSyncTime,
          error: error.message
        });
      }
    })();
    return true;
  }
  
  // Handle tracking status check
  if (message.type === 'IS_TRACKING_TAB') {
    (async () => {
      try {
        const settings = await loadSettings([STORAGE_KEYS.URL_BLACKLIST]);
        const blacklist = settings[STORAGE_KEYS.URL_BLACKLIST] || [];
        
        // Get tab info
        const tab = await chrome.tabs.get(message.tabId);
        
        // Check if URL is blacklisted
        const isBlacklisted = blacklist.some(pattern => {
          try {
            const regex = new RegExp(pattern.replace('*', '.*'));
            return regex.test(tab.url);
          } catch (e) {
            return tab.url.includes(pattern);
          }
        });
        
        if (isBlacklisted) {
          sendResponse({ isTracking: false, reason: 'Site is blacklisted' });
        } else if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
          sendResponse({ isTracking: false, reason: 'Not a web page' });
        } else {
          sendResponse({ isTracking: true });
        }
      } catch (error) {
        console.error('[Service Worker] Error checking tracking status:', error);
        sendResponse({ isTracking: false, reason: 'Error checking status' });
      }
    })();
    return true;
  }

  // SCRAPE_RESULT is now handled directly by activity-tracker.js for its specific requests.
  // if (message.type === 'SCRAPE_RESULT') {
  //   console.log('[Service Worker] Received SCRAPE_RESULT:', message.textContent.length, message.maxScrollPercent);
  //   // Process scrape result later
  // }
});

// Helper function to get today's stats
async function getTodayStats(startOfDay) {
  try {
    // This is a simplified version - you might want to implement proper stats tracking
    const logs = await getUnsyncedLogs();
    const todayLogs = logs.filter(log => log.startTimestamp >= startOfDay);
    
    const uniqueSites = new Set(todayLogs.map(log => new URL(log.url).hostname));
    const totalTime = todayLogs.reduce((sum, log) => sum + (log.timeSpentSeconds || 0), 0);
    
    return {
      sitesVisited: uniqueSites.size,
      totalTime: totalTime
    };
  } catch (error) {
    console.error('[Service Worker] Error calculating today stats:', error);
    return { sitesVisited: 0, totalTime: 0 };
  }
}

// Chrome runtime onSuspend handler for graceful shutdown
chrome.runtime.onSuspend.addListener(() => {
  console.log('[Service Worker] Extension is being suspended/unloaded');
  
  // Perform graceful shutdown
  gracefulShutdown().then(() => {
    console.log('[Service Worker] Graceful shutdown completed');
  }).catch(error => {
    console.error('[Service Worker] Error during graceful shutdown:', error);
  });
  
  // Note: Chrome gives us limited time in onSuspend, so we should complete quickly
  // The gracefulShutdown function should be designed to complete within a few seconds
});
