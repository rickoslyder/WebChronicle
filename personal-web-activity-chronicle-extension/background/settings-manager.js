import { STORAGE_KEYS } from '../lib/constants.js';

/**
 * Asynchronously loads settings from chrome.storage.local.
 * @returns {Promise<Object>} A promise that resolves to an object containing the settings.
 */
export function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([
      STORAGE_KEYS.WORKER_URL,
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.URL_BLACKLIST,
      STORAGE_KEYS.MIN_DURATION,
      // Add any other settings keys that might be needed by background scripts
    ], (result) => {
      const settings = {
        workerUrl: result[STORAGE_KEYS.WORKER_URL] || '',
        authToken: result[STORAGE_KEYS.AUTH_TOKEN] || '',
        urlBlacklist: result[STORAGE_KEYS.URL_BLACKLIST] || [],
        minDuration: result[STORAGE_KEYS.MIN_DURATION] ?? 5, // Default to 5 if not set or null
      };
      resolve(settings);
    });
  });
}

// You could also add a saveSettings function here if background scripts ever need to modify settings,
// though typically settings are user-modified via the options page.
