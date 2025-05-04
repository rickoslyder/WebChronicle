document.addEventListener('DOMContentLoaded', () => {
    const logContainer = document.getElementById('log-container');
    // TODO: Replace with your actual worker URL
    const workerUrl = 'https://activity-log-worker.rickoslyder.workers.dev'; 
    const logsEndpoint = `${workerUrl}/logs`;
    // TODO: Replace with your actual auth token (consider secure ways to handle this in a real app)
    const authToken = 'f3a1d2b4e5c6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2'; 

    async function fetchLogs() {
        if (!logContainer) return;
        logContainer.innerHTML = '<p>Loading logs...</p>'; // Show loading message

        try {
            const response = await fetch(logsEndpoint, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.logs && data.logs.length > 0) {
                displayLogs(data.logs);
            } else {
                logContainer.innerHTML = '<p>No log entries found.</p>';
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            logContainer.innerHTML = '<p>Error loading logs. Check the console for details.</p>';
        }
    }

    function displayLogs(logs) {
        if (!logContainer) return;
        logContainer.innerHTML = ''; // Clear loading message

        logs.forEach(log => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'log-entry';
            entryDiv.dataset.logId = log.id; // Store ID for summary fetching

            const title = log.title || 'No Title';

            // Add checkbox for comparison
            const checkboxId = `compare-${log.id}`;

            const url = log.url ? `<a href="${log.url}" target="_blank">${log.url}</a>` : 'No URL';
            const startTime = new Date(log.startTimestamp).toLocaleString();
            const timeSpent = log.timeSpentSeconds ? `${log.timeSpentSeconds}s` : 'N/A';
            const scroll = log.maxScrollPercent ? `${log.maxScrollPercent}%` : 'N/A';
            const processedAt = log.processedAt ? new Date(log.processedAt).toLocaleString() : 'N/A';
            const tagsHtml = generateTagsHtml(log.tagsJson);

            entryDiv.innerHTML = `
                <input type="checkbox" class="log-checkbox" id="${checkboxId}" data-log-id="${log.id}">
                <label for="${checkboxId}" class="log-label"> 
                 <h2>${title}</h2>
                 <p><strong>URL:</strong> ${url}</p>
                 <p><strong>Visited:</strong> ${startTime}</p>
                 <p><strong>Time Spent:</strong> ${timeSpent} | <strong>Max Scroll:</strong> ${scroll}</p>
                 <p><strong>Processed:</strong> ${processedAt}</p>
                 <div class="log-tags">${tagsHtml}</div>
                 <button class="summary-button">Show Summary</button>
                 <div class="log-summary"></div>
                </label>
            `;

            // Add event listener for the summary button
            const summaryButton = entryDiv.querySelector('.summary-button');
            const summaryDiv = entryDiv.querySelector('.log-summary');
            if (summaryButton && summaryDiv) {
                summaryButton.addEventListener('click', () => fetchAndDisplaySummary(log.id, summaryButton, summaryDiv));
            }

            logContainer.appendChild(entryDiv);
        });

        // Add event listeners for checkboxes *after* they are added to the DOM
        addCheckboxListeners();
    }

    function generateTagsHtml(tagsJson) {
        if (!tagsJson) return '';
        try {
            const tags = JSON.parse(tagsJson);
            if (!Array.isArray(tags)) return '';
            return tags.map(tag => `<span>${tag}</span>`).join('');
        } catch (e) {
            console.error('Error parsing tags JSON:', e);
            return '';
        }
    }

    async function fetchAndDisplaySummary(logId, button, summaryContainer) {
        const summaryEndpoint = `${workerUrl}/logs/${logId}/summary`;
        button.textContent = 'Loading Summary...';
        button.disabled = true;

        try {
            const response = await fetch(summaryEndpoint, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                 if (response.status === 404) {
                    throw new Error('Summary not found.');
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            const data = await response.json();
            summaryContainer.textContent = data.summary || 'No summary available.';
            summaryContainer.style.display = 'block';
            button.textContent = 'Hide Summary'; // Toggle button text
            button.disabled = false;
            // Toggle visibility on subsequent clicks
            button.onclick = () => toggleSummary(button, summaryContainer);

        } catch (error) {
            console.error('Error fetching summary:', error);
            summaryContainer.textContent = `Error loading summary: ${error.message}`;
            summaryContainer.style.display = 'block';
            button.textContent = 'Summary Error';
            // Don't disable button on error, allow retry?
        }
    }

    function toggleSummary(button, summaryContainer) {
        const isVisible = summaryContainer.style.display === 'block';
        summaryContainer.style.display = isVisible ? 'none' : 'block';
        button.textContent = isVisible ? 'Show Summary' : 'Hide Summary';
    }

    function addCheckboxListeners() {
        const checkboxes = logContainer.querySelectorAll('.log-checkbox');
        const compareButton = document.getElementById('compare-button');

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const checkedCount = logContainer.querySelectorAll('.log-checkbox:checked').length;
                compareButton.disabled = checkedCount !== 2;
                compareButton.textContent = checkedCount === 2 ? 'Compare Selected' : `Compare Selected (Select ${2 - checkedCount})`;
            });
        });

        if (compareButton) {
            compareButton.addEventListener('click', () => {
                const checkedBoxes = logContainer.querySelectorAll('.log-checkbox:checked');
                if (checkedBoxes.length === 2) {
                    const logId1 = checkedBoxes[0].dataset.logId;
                    const logId2 = checkedBoxes[1].dataset.logId;
                    // Construct URL for diff page
                    const diffUrl = `diff.html?log1=${logId1}&log2=${logId2}`;
                    // Navigate
                    window.location.href = diffUrl;
                } else {
                    // Should not happen if button is enabled correctly, but just in case
                    alert('Please select exactly two log entries to compare.');
                }
            });
        }
    }

    // Initial fetch
    fetchLogs();
});