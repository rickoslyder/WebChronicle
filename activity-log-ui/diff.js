document.addEventListener('DOMContentLoaded', () => {
    const diffOutputContainer = document.getElementById('diff-output');
    const loadingMessage = document.getElementById('loading-message');
    const originalContent1 = document.getElementById('original-content-1');
    const originalContent2 = document.getElementById('original-content-2');
    const originalContentContainer = document.querySelector('.original-content-container');

    // --- Config (Same as script.js - TODO: Centralize this) ---
    const workerUrl = 'https://activity-log-worker.rickoslyder.workers.dev'; 
    const authToken = 'f3a1d2b4e5c6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2'; 
    // -------------------------------------------------------

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
            // Fetch both contents concurrently
            const [content1, content2] = await Promise.all([
                fetchContent(logId1),
                fetchContent(logId2)
            ]);

            // Store original content (optional display)
            originalContent1.textContent = content1;
            originalContent2.textContent = content2;
            // uncomment below to show originals by default
            // originalContentContainer.style.display = 'block'; 

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

        } catch (error) {
            loadingMessage.textContent = `Error loading or comparing content: ${error.message}`;
            loadingMessage.style.color = 'red';
            console.error('[Diff] Comparison failed:', error);
        }
    }

    // Start the process
    loadAndCompare();
});
