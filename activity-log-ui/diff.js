document.addEventListener('DOMContentLoaded', () => {
    const diffOutputContainer = document.getElementById('diff-output');
    const loadingMessage = document.getElementById('loading-message');
    const metadataComparison = document.getElementById('metadata-comparison');
    const metadata1 = document.getElementById('metadata-1');
    const metadata2 = document.getElementById('metadata-2');
    const viewControls = document.querySelector('.view-controls');
    const sideBySideContainer = document.getElementById('side-by-side');
    const content1Panel = document.getElementById('content-1');
    const content2Panel = document.getElementById('content-2');
    
    let logData1 = null;
    let logData2 = null;

    // Check if config is loaded
    if (!window.APP_CONFIG) {
        loadingMessage.textContent = 'Configuration not found. Please create a config.js file from config.template.js';
        loadingMessage.style.color = 'red';
        return;
    }
    
    const workerUrl = window.APP_CONFIG.workerUrl;
    const authToken = window.APP_CONFIG.authToken;

    async function fetchContent(logId) {
        const contentEndpoint = `${workerUrl}/log-content/${logId}`;
        console.log(`[Diff] Fetching content for log ${logId} from ${contentEndpoint}`);
        try {
            const response = await fetch(contentEndpoint, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Content not found (404) for log ID ${logId}`);
                } else {
                    throw new Error(`HTTP error! status: ${response.status} for log ID ${logId}`);
                }
            }
            return await response.text(); // Return plain text content
        } catch (error) {
            console.error(`[Diff] Error fetching content for log ${logId}:`, error);
            throw error; // Re-throw to be caught by the main comparison logic
        }
    }
    
    async function fetchLogMetadata(logId) {
        const logsEndpoint = `${workerUrl}/logs`;
        try {
            const response = await fetch(logsEndpoint, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch logs: ${response.status}`);
            }
            const data = await response.json();
            // Find the specific log by ID
            return data.logs.find(log => log.id === logId);
        } catch (error) {
            console.error(`[Diff] Error fetching metadata for log ${logId}:`, error);
            return null;
        }
    }
    
    function displayMetadata(metadata, container) {
        if (!metadata) {
            container.innerHTML = '<div class="metadata-item">Metadata not available</div>';
            return;
        }
        
        const formatDate = (timestamp) => {
            return new Date(timestamp).toLocaleString();
        };
        
        const formatDuration = (seconds) => {
            if (!seconds) return 'N/A';
            if (seconds < 60) return `${seconds}s`;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds}s`;
        };
        
        container.innerHTML = `
            <div class="metadata-item">
                <span class="metadata-label">Title:</span>
                <span class="metadata-value">${metadata.title || 'No title'}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">URL:</span>
                <span class="metadata-value"><a href="${metadata.url}" target="_blank">${metadata.url}</a></span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Visited:</span>
                <span class="metadata-value">${formatDate(metadata.startTimestamp)}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Duration:</span>
                <span class="metadata-value">${formatDuration(metadata.timeSpentSeconds)}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Scroll Depth:</span>
                <span class="metadata-value">${metadata.maxScrollPercent || 0}%</span>
            </div>
        `;
    }

    async function loadAndCompare() {
        // Get log IDs from URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const logId1 = urlParams.get('log1');
        const logId2 = urlParams.get('log2');

        if (!logId1 || !logId2) {
            loadingMessage.textContent = 'Error: Missing log IDs in URL.';
            loadingMessage.style.color = 'red';
            return;
        }

        try {
            // Show loading message
            loadingMessage.textContent = 'Fetching log data...';
            
            // Fetch metadata and content concurrently
            const [metadata1Data, metadata2Data, content1, content2] = await Promise.all([
                fetchLogMetadata(logId1),
                fetchLogMetadata(logId2),
                fetchContent(logId1),
                fetchContent(logId2)
            ]);
            
            // Store metadata
            logData1 = metadata1Data;
            logData2 = metadata2Data;
            
            // Display metadata
            if (metadata1Data || metadata2Data) {
                displayMetadata(metadata1Data, metadata1);
                displayMetadata(metadata2Data, metadata2);
                metadataComparison.style.display = 'block';
            }
            
            loadingMessage.textContent = 'Comparing content...';

            // Store content in side-by-side panels
            content1Panel.textContent = content1;
            content2Panel.textContent = content2; 

            // Perform the diff (using line diff for better readability)
            const diff = Diff.diffLines(content1, content2);

            // Display the diff
            const fragment = document.createDocumentFragment();
            diff.forEach((part) => {
                const span = document.createElement('span');
                span.textContent = part.value;
                if (part.added) {
                    span.style.backgroundColor = '#d4ffd4'; // Green background for added
                    span.style.color = '#008000';
                } else if (part.removed) {
                    span.style.backgroundColor = '#ffd4d4'; // Red background for removed
                    span.style.color = '#a00000';
                } else {
                    // Unchanged lines
                    span.style.color = '#555'; 
                }
                fragment.appendChild(span);
            });

            diffOutputContainer.innerHTML = ''; // Clear previous content if any
            diffOutputContainer.appendChild(fragment);
            loadingMessage.style.display = 'none'; // Hide loading message
            viewControls.style.display = 'flex'; // Show view controls

        } catch (error) {
            loadingMessage.textContent = `Error loading or comparing content: ${error.message}`;
            loadingMessage.style.color = 'red';
            console.error('[Diff] Comparison failed:', error);
        }
    }

    // Add view toggle functionality
    document.querySelectorAll('.view-toggle').forEach(button => {
        button.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            
            // Update active button
            document.querySelectorAll('.view-toggle').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // Toggle views
            if (view === 'diff') {
                diffOutputContainer.style.display = 'block';
                sideBySideContainer.style.display = 'none';
            } else {
                diffOutputContainer.style.display = 'none';
                sideBySideContainer.style.display = 'grid';
            }
        });
    });
    
    // Start the process
    loadAndCompare();
});
