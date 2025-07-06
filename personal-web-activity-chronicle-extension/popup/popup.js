import { STORAGE_KEYS } from '../lib/constants.js';

document.addEventListener('DOMContentLoaded', async () => {
  const statusElement = document.getElementById('status');
  const syncStatusElement = document.getElementById('sync-status');
  const queueCountElement = document.getElementById('queue-count');
  const lastSyncElement = document.getElementById('last-sync');
  const todayStatsElement = document.getElementById('today-stats');
  const settingsLink = document.getElementById('settings-link');
  
  // Make settings link open in new tab
  settingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
  });
  
  // Check if extension is properly configured
  const config = await chrome.storage.local.get([STORAGE_KEYS.WORKER_URL, STORAGE_KEYS.AUTH_TOKEN]);
  if (!config[STORAGE_KEYS.WORKER_URL] || !config[STORAGE_KEYS.AUTH_TOKEN]) {
    statusElement.textContent = 'Not configured';
    statusElement.className = 'status-error';
    syncStatusElement.textContent = 'Please configure in settings';
    return;
  }
  
  // Get sync status from background
  chrome.runtime.sendMessage({ type: 'GET_SYNC_STATUS' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting sync status:', chrome.runtime.lastError);
      syncStatusElement.textContent = 'Error checking status';
      return;
    }
    
    if (response) {
      // Update online/offline status
      if (response.isOnline) {
        syncStatusElement.textContent = '🟢 Online';
        syncStatusElement.className = 'sync-online';
      } else {
        syncStatusElement.textContent = '🔴 Offline';
        syncStatusElement.className = 'sync-offline';
      }
      
      // Update queue count
      if (response.queueCount > 0) {
        queueCountElement.textContent = `${response.queueCount} logs queued`;
        queueCountElement.className = 'queue-pending';
      } else {
        queueCountElement.textContent = 'All synced';
        queueCountElement.className = 'queue-empty';
      }
      
      // Update last sync time
      if (response.lastSyncTime) {
        const lastSync = new Date(response.lastSyncTime);
        const now = new Date();
        const minutesAgo = Math.floor((now - lastSync) / 60000);
        
        if (minutesAgo < 1) {
          lastSyncElement.textContent = 'Last sync: just now';
        } else if (minutesAgo < 60) {
          lastSyncElement.textContent = `Last sync: ${minutesAgo}m ago`;
        } else {
          const hoursAgo = Math.floor(minutesAgo / 60);
          lastSyncElement.textContent = `Last sync: ${hoursAgo}h ago`;
        }
      } else {
        lastSyncElement.textContent = 'Last sync: never';
      }
      
      // Update today's stats
      if (response.todayStats) {
        const { sitesVisited, totalTime } = response.todayStats;
        const hours = Math.floor(totalTime / 3600);
        const minutes = Math.floor((totalTime % 3600) / 60);
        
        let timeStr = '';
        if (hours > 0) {
          timeStr = `${hours}h ${minutes}m`;
        } else {
          timeStr = `${minutes}m`;
        }
        
        todayStatsElement.innerHTML = `
          <div class="stat">
            <span class="stat-value">${sitesVisited}</span>
            <span class="stat-label">sites today</span>
          </div>
          <div class="stat">
            <span class="stat-value">${timeStr}</span>
            <span class="stat-label">active time</span>
          </div>
        `;
      }
    }
  });
  
  // Check if currently tracking
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.runtime.sendMessage({ 
        type: 'IS_TRACKING_TAB', 
        tabId: tabs[0].id 
      }, (response) => {
        if (response && response.isTracking) {
          statusElement.textContent = 'Tracking this site';
          statusElement.className = 'status-active';
        } else if (response && response.reason) {
          statusElement.textContent = response.reason;
          statusElement.className = 'status-inactive';
        }
      });
    }
  });
});