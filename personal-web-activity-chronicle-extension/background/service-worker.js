import './activity-tracker.js';
import { pingServer } from './cloudflare-client.js';

console.log('Background service worker initialized');

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
