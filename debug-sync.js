// Debug script to check what's in IndexedDB
// Run this in the extension's background page console

async function debugIndexedDB() {
  const DB_NAME = 'WebChronicleDB';
  const LOG_STORE_NAME = 'activityLogs';
  
  const request = indexedDB.open(DB_NAME);
  
  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(LOG_STORE_NAME, 'readonly');
    const store = transaction.objectStore(LOG_STORE_NAME);
    const getAllRequest = store.getAll();
    
    getAllRequest.onsuccess = () => {
      const logs = getAllRequest.result;
      console.log(`Found ${logs.length} logs in IndexedDB`);
      
      if (logs.length > 0) {
        console.log('First log structure:', logs[0]);
        console.log('Fields in first log:', Object.keys(logs[0]));
        
        // Check for textContent field
        const hasTextContent = logs.filter(log => log.textContent).length;
        console.log(`Logs with textContent: ${hasTextContent}/${logs.length}`);
        
        // Check for other potential field names
        const hasScrapedText = logs.filter(log => log.scrapedText).length;
        console.log(`Logs with scrapedText: ${hasScrapedText}/${logs.length}`);
      }
    };
  };
}

debugIndexedDB();