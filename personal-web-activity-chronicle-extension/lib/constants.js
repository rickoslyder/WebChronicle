export const DEFAULT_SCRAPE_INTERVAL = 60 * 1000; // 1 min
export const DEFAULT_TRUNCATION_LENGTH = 10000; // chars
export const STORAGE_KEYS = {
  WORKER_URL: 'workerUrl',
  AUTH_TOKEN: 'authToken',
  URL_BLACKLIST: 'urlBlacklist', // Array of strings
  MIN_DURATION: 'minDurationSeconds', // Number
  PERIODIC_SCRAPE_INTERVAL_MINUTES: 'periodicScrapeIntervalMinutes' // Number
};

// For offline log synchronization
export const SYNC_ALARM_NAME = 'syncOfflineLogsAlarm';
export const SYNC_INTERVAL_MINUTES = 5; // Sync every 5 minutes

// For periodic scraping of active tab
export const DEFAULT_PERIODIC_SCRAPE_INTERVAL_MINUTES = 2; // Default to 2 minutes

// For Chrome idle API
export const IDLE_DETECTION_INTERVAL_SECONDS = 60; // Check idle state every 60 seconds
export const IDLE_TIMEOUT_SECONDS = 300; // Consider user idle after 5 minutes of inactivity
