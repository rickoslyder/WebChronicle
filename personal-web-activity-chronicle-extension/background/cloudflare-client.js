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

export async function sendLogData(workerUrl, authToken, logPayload) {
  const logUrl = `${workerUrl.replace(/\/+$/, '')}/log`;
  console.log('[Client] Attempting to send log data to:', logUrl);

  // Calculate content hash if textContent is present
  if (logPayload.textContent) {
    try {
      logPayload.contentHash = await calculateHash(logPayload.textContent);
      console.log('[Client] Added contentHash:', logPayload.contentHash);
    } catch (hashError) {
      console.error('[Client] Failed to calculate content hash:', hashError);
      // Decide how to handle: send without hash? Abort? Log error?
      // For now, we'll proceed without the hash if calculation fails.
    }
  } else {
    console.warn('[Client] logPayload is missing textContent, cannot calculate hash.');
  }

  console.log('[Client] Log Payload (with hash if available):', logPayload);
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
    return { success: true, status: response.status };
  } catch (err) {
    console.error('[Client] Log fetch error:', err);
    return { success: false, error: err.message };
  }
}
