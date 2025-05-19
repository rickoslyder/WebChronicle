const DB_NAME = 'WebChronicleDB';
const LOG_STORE_NAME = 'activityLogs';
const DB_VERSION = 1;

let dbPromise = null;

function initDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('[IDB] Database error:', event.target.error);
      reject('Database error: ' + event.target.error);
    };

    request.onsuccess = (event) => {
      console.log('[IDB] Database opened successfully.');
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      console.log('[IDB] Database upgrade needed.');
      const db = event.target.result;
      if (!db.objectStoreNames.contains(LOG_STORE_NAME)) {
        const store = db.createObjectStore(LOG_STORE_NAME, { keyPath: 'id' });
        // Optionally, create indexes if needed for querying, e.g., by timestamp
        // store.createIndex('timestamp', 'startTimestamp', { unique: false });
        console.log(`[IDB] Object store '${LOG_STORE_NAME}' created.`);
      }
    };
  });
  return dbPromise;
}

export async function saveLog(logData) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LOG_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(LOG_STORE_NAME);
    const request = store.put(logData); // put will add or update

    request.onsuccess = () => {
      console.log(`[IDB] Log saved with ID: ${logData.id}`);
      resolve(request.result);
    };
    request.onerror = (event) => {
      console.error(`[IDB] Error saving log ID: ${logData.id}:`, event.target.error);
      reject(event.target.error);
    };
  });
}

export async function getUnsyncedLogs() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LOG_STORE_NAME, 'readonly');
    const store = transaction.objectStore(LOG_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      console.log(`[IDB] Retrieved ${request.result.length} unsynced logs.`);
      resolve(request.result);
    };
    request.onerror = (event) => {
      console.error('[IDB] Error getting all logs:', event.target.error);
      reject(event.target.error);
    };
  });
}

export async function deleteLog(logId) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LOG_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(LOG_STORE_NAME);
    const request = store.delete(logId);

    request.onsuccess = () => {
      console.log(`[IDB] Log deleted with ID: ${logId}`);
      resolve();
    };
    request.onerror = (event) => {
      console.error(`[IDB] Error deleting log ID: ${logId}:`, event.target.error);
      reject(event.target.error);
    };
  });
}

// Initialize DB on load if needed or upon first call
initDB().catch(err => console.error("[IDB] Initial DB open failed:", err));
