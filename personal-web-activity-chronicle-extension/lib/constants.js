export const DEFAULT_SCRAPE_INTERVAL = 60 * 1000; // 1 min
export const DEFAULT_TRUNCATION_LENGTH = 10000; // chars
export const STORAGE_KEYS = {
  WORKER_URL: 'workerUrl',
  AUTH_TOKEN: 'authToken',
  URL_BLACKLIST: 'urlBlacklist', // Array of strings
  MIN_DURATION: 'minDurationSeconds' // Number
};

// For offline log synchronization
export const SYNC_ALARM_NAME = 'syncOfflineLogsAlarm';
export const SYNC_INTERVAL_MINUTES = 5; // Sync every 5 minutes
