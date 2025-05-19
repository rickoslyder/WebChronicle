import './activity-tracker.js';
import { pingServer, sendActivityLog } from './cloudflare-client.js';
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
      const result = await sendActivityLog(workerUrl, authToken, log);
      // If the log was successfully sent to the server (not just re-saved offline by sendActivityLog itself)
      if (result.success && (result.storedOffline === false || result.storedOffline === undefined) ) {
        console.log(`[Service Worker] Log ID: ${log.id} synced successfully. Deleting from IDB.`);
        await deleteLog(log.id);
      } else if (result.success && result.storedOffline === true) {
        // This case means sendActivityLog itself decided to re-queue it (e.g. was online but fetch failed and it re-saved)
        // So we don't delete it from IDB yet.
        console.log(`[Service Worker] Log ID: ${log.id} was re-queued by sendActivityLog. Will retry later.`);
      } else {
        console.warn(`[Service Worker] Failed to sync log ID: ${log.id}. Error: ${result.error}. Will retry later.`);
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

  if (message.type === 'SCRAPE_RESULT') {
    console.log('[Service Worker] Received SCRAPE_RESULT:', message.textContent.length, message.maxScrollPercent);
    // Process scrape result later
  }
});

// Future listeners for chrome.alarms, etc., will be added here by feature implementations.
