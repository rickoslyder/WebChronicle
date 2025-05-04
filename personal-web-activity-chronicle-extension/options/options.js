import { STORAGE_KEYS } from '../lib/constants.js';

document.addEventListener('DOMContentLoaded', () => {
  const workerUrlInput = document.getElementById('worker-url');
  const authTokenInput = document.getElementById('auth-token');
  const urlBlacklistInput = document.getElementById('url-blacklist');
  const minDurationInput = document.getElementById('min-duration');
  const saveButton = document.getElementById('save-button');
  const testButton = document.getElementById('test-button');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  chrome.storage.local.get([
    STORAGE_KEYS.WORKER_URL,
    STORAGE_KEYS.AUTH_TOKEN,
    STORAGE_KEYS.URL_BLACKLIST,
    STORAGE_KEYS.MIN_DURATION
  ], (result) => {
    // Defaults defined in background/activity-tracker.js are used if keys don't exist
    const urlBlacklist = result[STORAGE_KEYS.URL_BLACKLIST] || []; // Use empty array if not set
    const minDuration = result[STORAGE_KEYS.MIN_DURATION] ?? 5; // Use default if not set

    if (result[STORAGE_KEYS.WORKER_URL]) {
      workerUrlInput.value = result[STORAGE_KEYS.WORKER_URL];
    }
    if (result[STORAGE_KEYS.AUTH_TOKEN]) {
      authTokenInput.value = result[STORAGE_KEYS.AUTH_TOKEN];
    }
    urlBlacklistInput.value = urlBlacklist.join('\n'); // Display array elements on new lines
    minDurationInput.value = minDuration;
  });

  // Save settings
  saveButton.addEventListener('click', (e) => {
    e.preventDefault();
    const workerUrl = workerUrlInput.value.trim();
    const authToken = authTokenInput.value.trim();
    const urlBlacklist = urlBlacklistInput.value
      .split('\n') // Split textarea content by newline
      .map(line => line.trim()) // Trim whitespace from each line
      .filter(line => line.length > 0); // Remove empty lines
    const minDuration = parseInt(minDurationInput.value, 10) || 0; // Parse as integer, default 0

    chrome.storage.local.set({
      [STORAGE_KEYS.WORKER_URL]: workerUrl,
      [STORAGE_KEYS.AUTH_TOKEN]: authToken,
      [STORAGE_KEYS.URL_BLACKLIST]: urlBlacklist,
      [STORAGE_KEYS.MIN_DURATION]: minDuration
    }, () => {
      statusDiv.textContent = 'Settings saved';
    });
  });

  // Test connection
  testButton.addEventListener('click', () => {
    statusDiv.textContent = 'Testing...';
    chrome.storage.local.get([STORAGE_KEYS.WORKER_URL, STORAGE_KEYS.AUTH_TOKEN], (result) => {
      const workerUrl = result[STORAGE_KEYS.WORKER_URL];
      const authToken = result[STORAGE_KEYS.AUTH_TOKEN];
      console.log('[Options] Sending PING_REQUEST to service worker:', { workerUrl, authToken });
      chrome.runtime.sendMessage({ type: 'PING_REQUEST', workerUrl, authToken }, (response) => {
        console.log('[Options] Received response from service worker:', response);
        if (chrome.runtime.lastError) {
          console.error('[Options] Error receiving response:', chrome.runtime.lastError);
          statusDiv.textContent = `Error: ${chrome.runtime.lastError.message}`;
          return;
        }
        if (response && response.success) {
          statusDiv.textContent = 'Connection successful';
        } else {
          statusDiv.textContent = `Connection failed: ${response?.error || 'Unknown error'}`;
        }
      });
    });
  });
});
