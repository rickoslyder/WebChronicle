import { STORAGE_KEYS, DEFAULT_PERIODIC_SCRAPE_INTERVAL_MINUTES } from '../lib/constants.js';
import { searchLogs } from '../background/cloudflare-client.js';
import { getUnsyncedLogs } from '../lib/idb-manager.js';

document.addEventListener('DOMContentLoaded', () => {
  // Form elements
  const workerUrlInput = document.getElementById('worker-url');
  const authTokenInput = document.getElementById('auth-token');
  const urlBlacklistInput = document.getElementById('url-blacklist');
  const minDurationInput = document.getElementById('min-duration');
  const periodicScrapeIntervalInput = document.getElementById('periodic-scrape-interval');
  const saveButton = document.getElementById('save-button');
  const testButton = document.getElementById('test-button');
  const statusDiv = document.getElementById('status');

  // Search elements
  const searchQueryInput = document.getElementById('search-query');
  const searchButton = document.getElementById('search-button');
  const searchResultsDiv = document.getElementById('search-results');
  const toggleFiltersButton = document.getElementById('toggle-filters');
  const filtersPanel = document.getElementById('search-filters-panel');
  const filterDateFrom = document.getElementById('filter-date-from');
  const filterDateTo = document.getElementById('filter-date-to');
  const filterDomain = document.getElementById('filter-domain');

  // Tab elements
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  // Quick action buttons
  const exportSettingsButton = document.getElementById('export-settings');
  const importSettingsButton = document.getElementById('import-settings');
  const importFileInput = document.getElementById('import-file-input');
  const pauseTrackingButton = document.getElementById('pause-tracking');
  const clearDataButton = document.getElementById('clear-data');

  // Password toggle
  const togglePasswordButton = document.querySelector('.toggle-password');
  const eyeOpen = togglePasswordButton.querySelector('.eye-open');
  const eyeClosed = togglePasswordButton.querySelector('.eye-closed');

  // Pattern test button
  const testPatternButton = document.getElementById('test-pattern');

  // Initialize tabs
  initializeTabs();

  // Initialize password toggle
  initializePasswordToggle();

  // Load settings
  loadSettings();

  // Load statistics
  loadStatistics();

  // Update version info
  updateVersionInfo();

  // Tab switching functionality
  function initializeTabs() {
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        switchTab(targetTab);
      });
    });
  }

  function switchTab(tabName) {
    // Update active button
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update active content
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
  }

  // Password toggle functionality
  function initializePasswordToggle() {
    togglePasswordButton.addEventListener('click', () => {
      const type = authTokenInput.type === 'password' ? 'text' : 'password';
      authTokenInput.type = type;
      eyeOpen.style.display = type === 'password' ? 'block' : 'none';
      eyeClosed.style.display = type === 'text' ? 'block' : 'none';
    });
  }

  // Load settings from storage
  function loadSettings() {
    chrome.storage.local.get([
      STORAGE_KEYS.WORKER_URL,
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.URL_BLACKLIST,
      STORAGE_KEYS.MIN_DURATION,
      STORAGE_KEYS.PERIODIC_SCRAPE_INTERVAL_MINUTES
    ], (result) => {
      const urlBlacklist = result[STORAGE_KEYS.URL_BLACKLIST] || [];
      const minDuration = result[STORAGE_KEYS.MIN_DURATION] ?? 5;
      const periodicScrapeInterval = result[STORAGE_KEYS.PERIODIC_SCRAPE_INTERVAL_MINUTES] ?? DEFAULT_PERIODIC_SCRAPE_INTERVAL_MINUTES;

      if (result[STORAGE_KEYS.WORKER_URL]) {
        workerUrlInput.value = result[STORAGE_KEYS.WORKER_URL];
      }
      if (result[STORAGE_KEYS.AUTH_TOKEN]) {
        authTokenInput.value = result[STORAGE_KEYS.AUTH_TOKEN];
      }
      urlBlacklistInput.value = urlBlacklist.join('\n');
      minDurationInput.value = minDuration;
      periodicScrapeIntervalInput.value = periodicScrapeInterval;
    });
  }

  // Save settings
  saveButton.addEventListener('click', async (e) => {
    e.preventDefault();
    const workerUrl = workerUrlInput.value.trim();
    const authToken = authTokenInput.value.trim();
    const urlBlacklist = urlBlacklistInput.value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    const minDuration = parseInt(minDurationInput.value, 10) || 0;
    const periodicScrapeInterval = parseInt(periodicScrapeIntervalInput.value, 10) || DEFAULT_PERIODIC_SCRAPE_INTERVAL_MINUTES;

    // Show saving state
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    chrome.storage.local.set({
      [STORAGE_KEYS.WORKER_URL]: workerUrl,
      [STORAGE_KEYS.AUTH_TOKEN]: authToken,
      [STORAGE_KEYS.URL_BLACKLIST]: urlBlacklist,
      [STORAGE_KEYS.MIN_DURATION]: minDuration,
      [STORAGE_KEYS.PERIODIC_SCRAPE_INTERVAL_MINUTES]: periodicScrapeInterval
    }, () => {
      // Reset button state
      saveButton.disabled = false;
      saveButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V2a1 1 0 00-1-1H9.5a1 1 0 00-1 1v7.293l2.646-2.647a.5.5 0 01.708.708l-3.5 3.5a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L7.5 9.293V2a2 2 0 012-2H14a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V2a2 2 0 012-2z"/></svg> Save Settings';
      
      // Show success status
      showStatus('Settings saved successfully', 'success');
    });
  });

  // Test connection
  testButton.addEventListener('click', () => {
    testButton.disabled = true;
    testButton.textContent = 'Testing...';
    
    chrome.storage.local.get([STORAGE_KEYS.WORKER_URL, STORAGE_KEYS.AUTH_TOKEN], (result) => {
      const workerUrl = result[STORAGE_KEYS.WORKER_URL];
      const authToken = result[STORAGE_KEYS.AUTH_TOKEN];
      
      if (!workerUrl || !authToken) {
        testButton.disabled = false;
        testButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 01.5.5v3a.5.5 0 01-.5.5H5.5a.5.5 0 010-1H8V4.5A.5.5 0 018 4zM8 0a8 8 0 100 16A8 8 0 008 0zM1 8a7 7 0 1114 0A7 7 0 011 8z"/></svg> Test Connection';
        showStatus('Please configure Worker URL and Auth Token first', 'warning');
        return;
      }
      
      chrome.runtime.sendMessage({ type: 'PING_REQUEST', workerUrl, authToken }, (response) => {
        testButton.disabled = false;
        testButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 01.5.5v3a.5.5 0 01-.5.5H5.5a.5.5 0 010-1H8V4.5A.5.5 0 018 4zM8 0a8 8 0 100 16A8 8 0 008 0zM1 8a7 7 0 1114 0A7 7 0 011 8z"/></svg> Test Connection';
        
        if (chrome.runtime.lastError) {
          showStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
          return;
        }
        
        if (response && response.success) {
          showStatus('Connection successful', 'success');
        } else {
          showStatus(`Connection failed: ${response?.error || 'Unknown error'}`, 'error');
        }
      });
    });
  });

  // Search functionality
  searchButton.addEventListener('click', performSearch);
  searchQueryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  toggleFiltersButton.addEventListener('click', () => {
    const isVisible = filtersPanel.style.display !== 'none';
    filtersPanel.style.display = isVisible ? 'none' : 'flex';
    toggleFiltersButton.classList.toggle('active', !isVisible);
  });

  async function performSearch() {
    const query = searchQueryInput.value.trim();
    searchResultsDiv.innerHTML = '';

    if (!query) {
      searchResultsDiv.innerHTML = '<p class="search-hint">Please enter a search query.</p>';
      return;
    }

    searchResultsDiv.innerHTML = '<div class="loading"></div> Searching...';
    searchButton.disabled = true;

    chrome.storage.local.get([STORAGE_KEYS.WORKER_URL, STORAGE_KEYS.AUTH_TOKEN], async (config) => {
      if (chrome.runtime.lastError) {
        searchResultsDiv.innerHTML = '<p class="search-hint">Error: Could not retrieve worker configuration.</p>';
        searchButton.disabled = false;
        return;
      }

      const workerUrl = config[STORAGE_KEYS.WORKER_URL];
      const authToken = config[STORAGE_KEYS.AUTH_TOKEN];

      if (!workerUrl || !authToken) {
        searchResultsDiv.innerHTML = '<p class="search-hint">Worker URL or Auth Token not configured. Please configure in Settings tab.</p>';
        searchButton.disabled = false;
        return;
      }

      try {
        const searchData = await searchLogs(workerUrl, authToken, query);
        displaySearchResults(searchData, searchResultsDiv);
      } catch (error) {
        searchResultsDiv.innerHTML = `<p class="search-hint">Search failed: ${error.message}</p>`;
      } finally {
        searchButton.disabled = false;
      }
    });
  }

  // Quick actions
  exportSettingsButton.addEventListener('click', exportSettings);
  importSettingsButton.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', importSettings);
  pauseTrackingButton.addEventListener('click', togglePauseTracking);
  clearDataButton.addEventListener('click', clearAllData);

  // Pattern testing
  testPatternButton.addEventListener('click', testUrlPattern);

  // Export settings function
  async function exportSettings() {
    chrome.storage.local.get(null, (items) => {
      const dataStr = JSON.stringify(items, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `webchronicle-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showStatus('Settings exported successfully', 'success');
    });
  }

  // Import settings function
  async function importSettings(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const settings = JSON.parse(event.target.result);
        chrome.storage.local.set(settings, () => {
          loadSettings();
          showStatus('Settings imported successfully', 'success');
        });
      } catch (error) {
        showStatus('Error importing settings: Invalid file format', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  }

  // Toggle pause tracking
  let isPaused = false;
  async function togglePauseTracking() {
    isPaused = !isPaused;
    // Store pause state
    chrome.storage.local.set({ trackingPaused: isPaused });
    
    if (isPaused) {
      pauseTrackingButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4.754a3.246 3.246 0 100 6.492 3.246 3.246 0 000-6.492zM5.754 8a2.246 2.246 0 114.492 0 2.246 2.246 0 01-4.492 0z"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 01-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 01-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 01.52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 011.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 011.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 01.52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 01-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 01-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 002.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 001.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 00-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 00-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 00-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 001.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 003.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 002.692-1.115l.094-.319z"/></svg> Resume Tracking';
      showStatus('Tracking paused', 'warning');
    } else {
      pauseTrackingButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 3.5A1.5 1.5 0 017 5v6a1.5 1.5 0 01-3 0V5a1.5 1.5 0 011.5-1.5zm5 0A1.5 1.5 0 0112 5v6a1.5 1.5 0 01-3 0V5a1.5 1.5 0 011.5-1.5z"/></svg> Pause Tracking';
      showStatus('Tracking resumed', 'success');
    }
  }

  // Clear all data
  async function clearAllData() {
    if (!confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      return;
    }

    try {
      // Clear IndexedDB
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        indexedDB.deleteDatabase(db.name);
      }
      
      // Clear storage
      chrome.storage.local.clear(() => {
        showStatus('All data cleared successfully', 'success');
        // Reload settings to show empty state
        loadSettings();
      });
    } catch (error) {
      showStatus('Error clearing data: ' + error.message, 'error');
    }
  }

  // Test URL pattern
  function testUrlPattern() {
    const patterns = urlBlacklistInput.value.split('\n').filter(p => p.trim());
    const testUrl = prompt('Enter a URL to test against blacklist patterns:');
    
    if (!testUrl) return;
    
    const isBlacklisted = patterns.some(pattern => {
      try {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(testUrl);
      } catch (e) {
        return testUrl.includes(pattern);
      }
    });
    
    if (isBlacklisted) {
      showStatus(`URL "${testUrl}" is BLACKLISTED (will not be tracked)`, 'warning');
    } else {
      showStatus(`URL "${testUrl}" is NOT blacklisted (will be tracked)`, 'success');
    }
  }

  // Load statistics
  async function loadStatistics() {
    try {
      // Get stats from service worker
      chrome.runtime.sendMessage({ type: 'GET_SYNC_STATUS' }, async (response) => {
        if (response && response.todayStats) {
          document.getElementById('stat-today-sites').textContent = response.todayStats.sitesVisited || '0';
          document.getElementById('stat-today-time').textContent = formatTime(response.todayStats.totalTime || 0);
        }
        
        // Get total logs count
        const logs = await getUnsyncedLogs();
        document.getElementById('stat-total-logs').textContent = logs.length;
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  // Update version info
  function updateVersionInfo() {
    const manifest = chrome.runtime.getManifest();
    document.getElementById('version').textContent = manifest.version;
    document.getElementById('last-updated').textContent = new Date().toLocaleDateString();
  }

  // Helper function to format time
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '< 1m';
    }
  }

  // Show status message
  function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status show ${type}`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 3000);
  }
});

function displaySearchResults(data, container) {
  container.innerHTML = '';

  if (!data) {
    container.innerHTML = '<p class="search-hint">Search failed: No response data received.</p>';
    return;
  }

  if (!data.success) {
    let errorMessage = data.error || 'Search failed or returned an error.';
    if (data.status === 401) {
      errorMessage = 'Search failed: Unauthorized. Check your Auth Token.';
    } else if (data.status === 404 && data.error && data.error.includes("Not Found")) {
      errorMessage = 'Search failed: Search endpoint not found on worker.';
    }
    container.innerHTML = `<p class="search-hint">${errorMessage}</p>`;
    return;
  }

  if (!data.results || data.results.length === 0) {
    container.innerHTML = '<p class="search-hint">No results found for your query.</p>';
    return;
  }

  // Display results
  data.results.forEach(item => {
    const resultItem = document.createElement('div');
    resultItem.className = 'search-result-item';

    // Title link
    const titleLink = document.createElement('a');
    titleLink.href = item.url;
    titleLink.className = 'search-result-title';
    titleLink.textContent = item.title || 'Untitled';
    titleLink.target = '_blank';
    titleLink.rel = 'noopener noreferrer';
    resultItem.appendChild(titleLink);

    // URL
    const urlDiv = document.createElement('div');
    urlDiv.className = 'search-result-url';
    urlDiv.textContent = item.url;
    resultItem.appendChild(urlDiv);

    // Summary/snippet
    if (item.summary) {
      const snippetDiv = document.createElement('div');
      snippetDiv.className = 'search-result-snippet';
      snippetDiv.textContent = item.summary;
      resultItem.appendChild(snippetDiv);
    }

    // Metadata
    const metaDiv = document.createElement('div');
    metaDiv.className = 'search-result-meta';
    
    if (typeof item.score === 'number') {
      const scoreSpan = document.createElement('span');
      scoreSpan.textContent = `Relevance: ${Math.round(item.score * 100)}%`;
      metaDiv.appendChild(scoreSpan);
    }

    if (item.processedAt) {
      const dateSpan = document.createElement('span');
      dateSpan.textContent = new Date(item.processedAt).toLocaleDateString();
      metaDiv.appendChild(dateSpan);
    }
    
    resultItem.appendChild(metaDiv);

    // Tags
    if (item.tagsJson) {
      try {
        const tags = JSON.parse(item.tagsJson);
        if (Array.isArray(tags) && tags.length > 0) {
          const tagsDiv = document.createElement('div');
          tagsDiv.className = 'search-result-tags';
          tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'search-result-tag';
            tagSpan.textContent = tag;
            tagsDiv.appendChild(tagSpan);
          });
          resultItem.appendChild(tagsDiv);
        }
      } catch (e) {
        console.warn('Could not parse tags:', e);
      }
    }

    container.appendChild(resultItem);
  });
}