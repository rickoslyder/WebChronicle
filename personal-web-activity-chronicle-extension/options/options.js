import { STORAGE_KEYS } from '../lib/constants.js';
import { searchLogs } from '../background/cloudflare-client.js';

document.addEventListener('DOMContentLoaded', () => {
  const workerUrlInput = document.getElementById('worker-url');
  const authTokenInput = document.getElementById('auth-token');
  const urlBlacklistInput = document.getElementById('url-blacklist');
  const minDurationInput = document.getElementById('min-duration');
  const saveButton = document.getElementById('save-button');
  const testButton = document.getElementById('test-button');
  const statusDiv = document.getElementById('status');

  const searchQueryInput = document.getElementById('search-query');
  const searchButton = document.getElementById('search-button');
  const searchResultsDiv = document.getElementById('search-results');

  searchResultsDiv.textContent = 'Enter a query above and click Search to see results.';

  chrome.storage.local.get([
    STORAGE_KEYS.WORKER_URL,
    STORAGE_KEYS.AUTH_TOKEN,
    STORAGE_KEYS.URL_BLACKLIST,
    STORAGE_KEYS.MIN_DURATION
  ], (result) => {
    const urlBlacklist = result[STORAGE_KEYS.URL_BLACKLIST] || []; 
    const minDuration = result[STORAGE_KEYS.MIN_DURATION] ?? 5; 

    if (result[STORAGE_KEYS.WORKER_URL]) {
      workerUrlInput.value = result[STORAGE_KEYS.WORKER_URL];
    }
    if (result[STORAGE_KEYS.AUTH_TOKEN]) {
      authTokenInput.value = result[STORAGE_KEYS.AUTH_TOKEN];
    }
    urlBlacklistInput.value = urlBlacklist.join('\n'); 
    minDurationInput.value = minDuration;
  });

  saveButton.addEventListener('click', (e) => {
    e.preventDefault();
    const workerUrl = workerUrlInput.value.trim();
    const authToken = authTokenInput.value.trim();
    const urlBlacklist = urlBlacklistInput.value
      .split('\n') 
      .map(line => line.trim()) 
      .filter(line => line.length > 0); 
    const minDuration = parseInt(minDurationInput.value, 10) || 0; 

    chrome.storage.local.set({
      [STORAGE_KEYS.WORKER_URL]: workerUrl,
      [STORAGE_KEYS.AUTH_TOKEN]: authToken,
      [STORAGE_KEYS.URL_BLACKLIST]: urlBlacklist,
      [STORAGE_KEYS.MIN_DURATION]: minDuration
    }, () => {
      statusDiv.textContent = 'Settings saved';
    });
  });

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

  searchButton.addEventListener('click', async () => {
    const query = searchQueryInput.value.trim();
    searchResultsDiv.innerHTML = ''; 

    if (!query) {
      searchResultsDiv.textContent = 'Please enter a search query.';
      return;
    }

    searchResultsDiv.textContent = 'Searching...';

    chrome.storage.local.get([STORAGE_KEYS.WORKER_URL, STORAGE_KEYS.AUTH_TOKEN], async (config) => {
      if (chrome.runtime.lastError) {
        console.error('Error retrieving storage for search:', chrome.runtime.lastError);
        searchResultsDiv.textContent = 'Error: Could not retrieve worker configuration.';
        return;
      }

      const workerUrl = config[STORAGE_KEYS.WORKER_URL];
      const authToken = config[STORAGE_KEYS.AUTH_TOKEN];

      if (!workerUrl || !authToken) {
        searchResultsDiv.textContent = 'Worker URL or Auth Token is not configured. Please set them in options and save.';
        return;
      }

      try {
        console.log(`[Options] Calling searchLogs with query: "${query}"`);
        const searchData = await searchLogs(workerUrl, authToken, query);
        displaySearchResults(searchData, searchResultsDiv);
      } catch (error) {
        console.error('[Options] Error during searchLogs call:', error);
        searchResultsDiv.textContent = `Search failed: ${error.message}`;
      }
    });
  });
});

function displaySearchResults(data, container) {
  container.innerHTML = ''; 

  if (!data) {
    container.textContent = 'Search failed: No response data received.';
    return;
  }

  if (!data.success) {
    container.textContent = data.error || 'Search failed or returned an error.';
    if (data.results && data.results.length === 0) { 
    } else if (data.status === 401) {
        container.textContent = 'Search failed: Unauthorized. Check your Auth Token.';
    } else if (data.status === 404 && data.error && data.error.includes("Not Found")) {
         container.textContent = 'Search failed: Search endpoint not found on worker. (Is it deployed correctly?)';
    } 
    return;
  }

  if (!data.results || data.results.length === 0) {
    container.textContent = 'No results found for your query.';
    return;
  }

  const ul = document.createElement('ul');
  ul.style.listStyleType = 'none';
  ul.style.paddingLeft = '0';

  data.results.forEach(item => {
    const li = document.createElement('li');
    li.style.marginBottom = '15px';
    li.style.padding = '10px';
    li.style.border = '1px solid #eee';
    li.style.borderRadius = '4px';
    li.style.backgroundColor = '#f9f9f9';

    const titleLink = document.createElement('a');
    titleLink.href = item.url;
    titleLink.textContent = item.title || 'No Title Provided';
    titleLink.target = '_blank';
    titleLink.rel = 'noopener noreferrer';
    titleLink.style.fontSize = '1.2em';
    titleLink.style.fontWeight = 'bold';
    titleLink.style.color = '#007bff';
    titleLink.style.textDecoration = 'none';
    titleLink.addEventListener('mouseover', () => titleLink.style.textDecoration = 'underline');
    titleLink.addEventListener('mouseout', () => titleLink.style.textDecoration = 'none');

    const titleHeader = document.createElement('h3');
    titleHeader.style.marginTop = '0';
    titleHeader.style.marginBottom = '5px';
    titleHeader.appendChild(titleLink);
    li.appendChild(titleHeader);

    if (item.summary) {
      const summaryP = document.createElement('p');
      summaryP.textContent = item.summary;
      summaryP.style.fontSize = '0.9em';
      summaryP.style.color = '#555';
      summaryP.style.margin = '5px 0';
      li.appendChild(summaryP);
    }

    const detailsDiv = document.createElement('div');
    detailsDiv.style.fontSize = '0.8em';
    detailsDiv.style.color = '#777';
    detailsDiv.style.marginTop = '8px';

    if (typeof item.score === 'number') {
      const scoreSpan = document.createElement('span');
      scoreSpan.textContent = `Similarity: ${item.score.toFixed(4)}`;
      scoreSpan.style.marginRight = '15px';
      detailsDiv.appendChild(scoreSpan);
    }

    if (item.processedAt) {
      const dateSpan = document.createElement('span');
      dateSpan.textContent = `Logged: ${new Date(item.processedAt).toLocaleString()}`;
      detailsDiv.appendChild(dateSpan);
    }
    li.appendChild(detailsDiv);

    if (item.tagsJson) {
      try {
        const tags = JSON.parse(item.tagsJson);
        if (Array.isArray(tags) && tags.length > 0) {
          const tagsP = document.createElement('p');
          tagsP.style.fontSize = '0.8em';
          tagsP.style.color = '#333';
          tagsP.style.marginTop = '5px';
          tagsP.innerHTML = '<strong>Tags:</strong> ' + tags.map(tag => 
            `<span style="background-color: #e9ecef; padding: 2px 5px; border-radius: 3px; margin-right: 5px;">${tag}</span>`).join('');
          li.appendChild(tagsP);
        }
      } catch (e) {
        console.warn("[Options] Could not parse tagsJson:", item.tagsJson, e);
      }
    }
    ul.appendChild(li);
  });
  container.appendChild(ul);
}
