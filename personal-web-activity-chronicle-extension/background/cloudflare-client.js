import { saveLog } from '../lib/idb-manager.js';

export async function pingServer(workerUrl, authToken) {
  const pingUrl = `${workerUrl.replace(/\/+$/, '')}/ping`;
  console.log('[Client] Attempting to ping:', pingUrl);
  try {
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: { 'X-Auth-Token': authToken }
    });
    console.log('[Client] Ping response status:', response.status);
    return { success: response.ok, status: response.status };
  } catch (err) {
    console.error('[Client] Ping fetch error:', err);
    return { success: false, error: err.message };
  }
}

// --- SHA-256 Hashing Utilities ---
// Function to convert ArrayBuffer to hex string
async function bufferToHex(buffer) {
  const hashArray = Array.from(new Uint8Array(buffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Function to calculate SHA-256 hash of text
async function calculateHash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  // Use crypto.subtle (available in background service workers)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}
// --- End Hashing Utilities ---

// Renamed function, no longer exported directly
async function attemptToSendLog(workerUrl, authToken, logPayload) {
  const logUrl = `${workerUrl.replace(/\/+$/, '')}/log`;
  console.log('[Client] Attempting to send log data to:', logUrl);

  // Calculate content hash if textContent is present
  // This check should ideally happen before calling attemptToSendLog,
  // ensuring logPayload consistently has contentHash if textContent was present.
  // For now, keeping it here to match original structure of sendLogData.
  if (logPayload.textContent && !logPayload.contentHash) { // Added check for existing contentHash
    try {
      logPayload.contentHash = await calculateHash(logPayload.textContent);
      console.log('[Client] Added contentHash:', logPayload.contentHash);
    } catch (hashError) {
      console.error('[Client] Failed to calculate content hash:', hashError);
    }
  } else if (!logPayload.textContent) {
    console.warn('[Client] logPayload is missing textContent, cannot calculate hash.');
  } else if (logPayload.contentHash) {
    console.log('[Client] contentHash already present in logPayload:', logPayload.contentHash);
  }

  console.log('[Client] Log Payload being sent:', logPayload);
  try {
    const response = await fetch(logUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': authToken
      },
      body: JSON.stringify(logPayload)
    });
    console.log('[Client] Log response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Client] Log error response body:', errorText);
      return { success: false, status: response.status, error: `Server responded with ${response.status}: ${errorText}` };
    }
    return { success: true, status: response.status, storedOffline: false };
  } catch (err) {
    console.error('[Client] Log fetch error:', err);
    return { success: false, error: err.message, type: err.name }; // Include error type
  }
}

export async function sendActivityLog(workerUrl, authToken, logPayload) {
  console.log(`[Client] sendActivityLog called for log ID: ${logPayload.id}. Online: ${navigator.onLine}`);

  // Ensure contentHash is calculated if textContent is present and hash isn't already there.
  // This belongs here or in activity-tracker before calling sendActivityLog.
  // To keep attemptToSendLog focused, let's ensure it's done before attempting to send.
  if (logPayload.textContent && !logPayload.contentHash) {
    try {
      logPayload.contentHash = await calculateHash(logPayload.textContent);
      console.log('[Client] Calculated contentHash for sendActivityLog:', logPayload.contentHash);
    } catch (hashError) {
      console.error('[Client] Failed to calculate content hash in sendActivityLog:', hashError);
      // Potentially return error or send without, depending on desired strictness
    }
  }

  if (!navigator.onLine) {
    console.log('[Client] App is offline. Saving log to IDB directly.');
    try {
      await saveLog(logPayload);
      return { success: true, storedOffline: true, message: 'Log saved offline.' };
    } catch (idbError) {
      console.error('[Client] Failed to save log to IDB while offline:', idbError);
      return { success: false, storedOffline: false, error: 'Failed to save log offline: ' + idbError.message };
    }
  }

  // If online, attempt to send
  const result = await attemptToSendLog(workerUrl, authToken, logPayload);

  if (!result.success) {
    console.warn(`[Client] attemptToSendLog failed for log ID: ${logPayload.id}. Error: ${result.error}, Type: ${result.type}, Status: ${result.status}`);
    // Conditions to save to IDB: TypeError (often network related) or server errors (5xx)
    if (result.type === 'TypeError' || (result.status && result.status >= 500)) {
        console.log('[Client] Network or server error during send. Saving log to IDB.');
        try {
            await saveLog(logPayload);
            // Modify the original result to indicate it was stored offline
            return { ...result, success: true, storedOffline: true, message: `Log send attempt failed, but successfully saved offline. Original error: ${result.error}` };
        } catch (idbError) {
            console.error('[Client] Failed to save log to IDB after send attempt failed:', idbError);
            // Return the original send error, and note the IDB save also failed
            return { ...result, storedOffline: false, idbSaveError: idbError.message };
        }
    }
  }
  return result; // Return the original result if successful or if failure wasn't one that triggers offline save
}

export async function searchLogs(workerUrl, authToken, query, topK = 10) {
  const searchUrl = `${workerUrl.replace(/^\/+|\/+$/g, '')}/search`;
  console.log(`[Client] Attempting to search logs with query: "${query}", topK: ${topK} at ${searchUrl}`);

  if (!navigator.onLine) {
    console.warn('[Client] App is offline. Cannot perform search.');
    return { success: false, error: 'Application is offline. Search unavailable.', results: [] };
  }

  try {
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': authToken
      },
      body: JSON.stringify({ query, topK })
    });

    console.log('[Client] Search response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Client] Search error response body:', errorText);
      return { success: false, status: response.status, error: `Server responded with ${response.status}: ${errorText}`, results: [] };
    }
    const data = await response.json();
    return { success: true, status: response.status, ...data }; // data should contain { results: [...] }

  } catch (err) {
    console.error('[Client] Search fetch error:', err);
    return { success: false, error: err.message, type: err.name, results: [] };
  }
}
