// Enhanced Web Chronicle UI Script
class WebChronicle {
    constructor() {
        this.logs = [];
        this.filteredLogs = [];
        this.selectedLogs = new Set();
        this.currentView = 'timeline';
        this.charts = {};
        this.searchDebounceTimer = null;
        
        // Check config
        if (!window.APP_CONFIG) {
            this.showError('Configuration not found. Please create a config.js file.');
            return;
        }
        
        this.workerUrl = window.APP_CONFIG.workerUrl;
        this.authToken = window.APP_CONFIG.authToken;
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.setupTheme();
        this.setupKeyboardShortcuts();
        await this.loadLogs();
        this.updateStats();
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });
        
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Search
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        // Semantic search toggle
        const semanticToggle = document.getElementById('semantic-search-toggle');
        semanticToggle.addEventListener('change', () => {
            const query = searchInput.value.trim();
            if (query) {
                this.handleSearch(query);
            }
        });
        
        // Filters
        document.getElementById('date-filter').addEventListener('click', () => {
            this.showDateFilter();
        });
        
        document.getElementById('domain-filter').addEventListener('click', () => {
            this.showDomainFilter();
        });
        
        document.getElementById('tag-filter').addEventListener('click', () => {
            this.showTagFilter();
        });
        
        // Sort
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.sortLogs(e.target.value);
        });
        
        // Compare button
        document.getElementById('compare-fab').addEventListener('click', () => {
            this.compareSelected();
        });
        
        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });
    }
    
    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }
    
    updateThemeIcon(theme) {
        const sunIcon = document.querySelector('.sun-icon');
        const moonIcon = document.querySelector('.moon-icon');
        if (theme === 'dark') {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + K for search focus
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('search-input').focus();
            }
            
            // Escape to clear selection
            if (e.key === 'Escape') {
                this.clearSelection();
            }
        });
    }
    
    async loadLogs() {
        this.showLoading(true);
        
        try {
            const response = await fetch(`${this.workerUrl}/logs`, {
                headers: {
                    'X-Auth-Token': this.authToken
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.logs = data.logs || [];
            this.filteredLogs = [...this.logs];
            this.renderActivityGrid();
            
        } catch (error) {
            console.error('Error loading logs:', error);
            this.showToast('Error loading activity logs', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    renderActivityGrid() {
        const grid = document.getElementById('activity-grid');
        grid.innerHTML = '';
        
        if (this.filteredLogs.length === 0) {
            grid.innerHTML = '<div class="empty-state">No activities found</div>';
            return;
        }
        
        this.filteredLogs.forEach(log => {
            const card = this.createActivityCard(log);
            grid.appendChild(card);
        });
    }
    
    createActivityCard(log) {
        const card = document.createElement('div');
        card.className = 'activity-card';
        if (this.selectedLogs.has(log.id)) {
            card.classList.add('selected');
        }
        
        const domain = new URL(log.url).hostname;
        const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        const timeSpent = this.formatTime(log.timeSpentSeconds);
        const visitTime = new Date(log.startTimestamp).toLocaleString();
        
        // Parse tags
        let tags = [];
        try {
            tags = log.tagsJson ? JSON.parse(log.tagsJson) : [];
        } catch (e) {
            console.error('Error parsing tags:', e);
        }
        
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${log.title || 'Untitled'}</h3>
                <div class="card-url">
                    <img src="${favicon}" alt="${domain}" class="domain-favicon" onerror="this.style.display='none'">
                    <span>${domain}</span>
                </div>
                ${log.isSemanticResult ? `
                    <div class="semantic-score">
                        <div class="score-bar" style="width: ${Math.round(log.score * 100)}%"></div>
                        <span class="score-text">${Math.round(log.score * 100)}% match</span>
                    </div>
                ` : ''}
            </div>
            <div class="card-body">
                <div class="card-meta">
                    <div class="meta-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 3.5a.5.5 0 00-1 0V9a.5.5 0 00.252.434l3.5 2a.5.5 0 00.496-.868L8 8.71V3.5z"/>
                            <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm7-8A7 7 0 111 8a7 7 0 0114 0z"/>
                        </svg>
                        <span>${timeSpent}</span>
                    </div>
                    <div class="meta-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 2a.5.5 0 01.5.5v11a.5.5 0 01-1 0v-11A.5.5 0 018 2z"/>
                            <path d="M3.5 7.5A.5.5 0 014 7h8a.5.5 0 010 1H4a.5.5 0 01-.5-.5z"/>
                        </svg>
                        <span>${log.maxScrollPercent || 0}%</span>
                    </div>
                </div>
                <div class="card-summary" id="summary-${log.id}">
                    ${log.summary || 'Loading summary...'}
                </div>
                <div class="card-tags">
                    ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="card-actions">
                <button class="find-similar-btn" data-log-id="${log.id}" title="Find similar pages">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85a1.007 1.007 0 00-.115-.1zM12 6.5a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z"/>
                    </svg>
                </button>
                <input type="checkbox" class="card-checkbox" data-log-id="${log.id}" 
                    ${this.selectedLogs.has(log.id) ? 'checked' : ''}>
            </div>
        `;
        
        // Load summary if not present
        if (!log.summary) {
            this.loadSummary(log.id);
        }
        
        // Card click handler
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('card-checkbox')) {
                this.toggleSelection(log.id);
            } else if (e.target.closest('.find-similar-btn')) {
                e.stopPropagation();
                this.findSimilar(log.title || log.url);
            } else if (!e.target.classList.contains('tag')) {
                window.open(log.url, '_blank');
            }
        });
        
        // Tag click handler
        card.querySelectorAll('.tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.stopPropagation();
                this.filterByTag(tag.textContent);
            });
        });
        
        return card;
    }
    
    async loadSummary(logId) {
        try {
            const response = await fetch(`${this.workerUrl}/logs/${logId}/summary`, {
                headers: {
                    'X-Auth-Token': this.authToken
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const summaryEl = document.getElementById(`summary-${logId}`);
                if (summaryEl && data.summary) {
                    summaryEl.textContent = data.summary;
                }
            } else {
                // Show placeholder if summary not found
                const summaryEl = document.getElementById(`summary-${logId}`);
                if (summaryEl) {
                    summaryEl.textContent = 'No summary available';
                    summaryEl.style.fontStyle = 'italic';
                    summaryEl.style.opacity = '0.7';
                }
            }
        } catch (error) {
            console.error('Error loading summary:', error);
            const summaryEl = document.getElementById(`summary-${logId}`);
            if (summaryEl) {
                summaryEl.textContent = 'Failed to load summary';
                summaryEl.style.color = 'var(--color-error)';
            }
        }
    }
    
    formatTime(seconds) {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ${minutes % 60}m`;
    }
    
    toggleSelection(logId) {
        if (this.selectedLogs.has(logId)) {
            this.selectedLogs.delete(logId);
        } else {
            this.selectedLogs.add(logId);
        }
        
        // Update UI
        const card = document.querySelector(`[data-log-id="${logId}"]`).closest('.activity-card');
        card.classList.toggle('selected');
        
        // Update compare button
        const compareBtn = document.getElementById('compare-fab');
        compareBtn.disabled = this.selectedLogs.size !== 2;
        
        if (this.selectedLogs.size === 0) {
            compareBtn.querySelector('.fab-label').textContent = 'Compare';
        } else if (this.selectedLogs.size === 1) {
            compareBtn.querySelector('.fab-label').textContent = 'Select 1 more';
        } else {
            compareBtn.querySelector('.fab-label').textContent = 'Compare 2';
        }
    }
    
    clearSelection() {
        this.selectedLogs.clear();
        document.querySelectorAll('.activity-card.selected').forEach(card => {
            card.classList.remove('selected');
            card.querySelector('.card-checkbox').checked = false;
        });
        
        const compareBtn = document.getElementById('compare-fab');
        compareBtn.disabled = true;
        compareBtn.querySelector('.fab-label').textContent = 'Compare';
    }
    
    compareSelected() {
        if (this.selectedLogs.size !== 2) return;
        
        const [log1, log2] = Array.from(this.selectedLogs);
        window.location.href = `diff.html?log1=${log1}&log2=${log2}`;
    }
    
    handleSearch(query) {
        clearTimeout(this.searchDebounceTimer);
        
        this.searchDebounceTimer = setTimeout(async () => {
            const isSemanticSearch = document.getElementById('semantic-search-toggle').checked;
            
            if (query.trim() === '') {
                this.filteredLogs = [...this.logs];
                this.renderActivityGrid();
            } else if (isSemanticSearch) {
                // Perform semantic search using the API
                await this.performSemanticSearch(query);
            } else {
                // Regular text search
                const lowerQuery = query.toLowerCase();
                this.filteredLogs = this.logs.filter(log => {
                    const titleMatch = (log.title || '').toLowerCase().includes(lowerQuery);
                    const urlMatch = (log.url || '').toLowerCase().includes(lowerQuery);
                    const summaryMatch = (log.summary || '').toLowerCase().includes(lowerQuery);
                    
                    let tagMatch = false;
                    try {
                        const tags = JSON.parse(log.tagsJson || '[]');
                        tagMatch = tags.some(tag => tag.toLowerCase().includes(lowerQuery));
                    } catch (e) {}
                    
                    return titleMatch || urlMatch || summaryMatch || tagMatch;
                });
                this.renderActivityGrid();
            }
        }, 300);
    }
    
    async performSemanticSearch(query) {
        try {
            // Show loading state
            const container = document.getElementById('activity-grid');
            container.innerHTML = '<div class="loading-message">Searching with AI...</div>';
            
            const response = await fetch(`${this.workerUrl}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': this.authToken
                },
                body: JSON.stringify({
                    query: query,
                    topK: 20
                })
            });
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Map search results to match our log format
            if (data.results && data.results.length > 0) {
                this.filteredLogs = data.results.map(result => ({
                    ...result,
                    // Add score visualization
                    score: result.score,
                    isSemanticResult: true
                }));
            } else {
                this.filteredLogs = [];
            }
            
            this.renderActivityGrid();
            
        } catch (error) {
            console.error('Semantic search error:', error);
            // Fall back to regular search
            document.getElementById('semantic-search-toggle').checked = false;
            this.handleSearch(query);
            this.showToast('AI search unavailable, using regular search', 'error');
        }
    }
    
    filterByTag(tag) {
        document.getElementById('search-input').value = `tag:${tag}`;
        this.filteredLogs = this.logs.filter(log => {
            try {
                const tags = JSON.parse(log.tagsJson || '[]');
                return tags.includes(tag);
            } catch (e) {
                return false;
            }
        });
        this.renderActivityGrid();
    }
    
    findSimilar(query) {
        // Enable semantic search
        document.getElementById('semantic-search-toggle').checked = true;
        // Set search query
        document.getElementById('search-input').value = query;
        // Trigger search
        this.handleSearch(query);
        // Show notification
        this.showToast('Finding similar pages...', 'info');
    }
    
    sortLogs(sortBy) {
        switch (sortBy) {
            case 'recent':
                this.filteredLogs.sort((a, b) => b.startTimestamp - a.startTimestamp);
                break;
            case 'time-spent':
                this.filteredLogs.sort((a, b) => (b.timeSpentSeconds || 0) - (a.timeSpentSeconds || 0));
                break;
            case 'domain':
                this.filteredLogs.sort((a, b) => {
                    const domainA = new URL(a.url).hostname;
                    const domainB = new URL(b.url).hostname;
                    return domainA.localeCompare(domainB);
                });
                break;
            case 'scroll':
                this.filteredLogs.sort((a, b) => (b.maxScrollPercent || 0) - (a.maxScrollPercent || 0));
                break;
        }
        this.renderActivityGrid();
    }
    
    switchView(view) {
        this.currentView = view;
        
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Update view containers
        document.querySelectorAll('.view-container').forEach(container => {
            container.classList.toggle('active', container.id === `${view}-view`);
        });
        
        // Load view-specific content
        switch (view) {
            case 'insights':
                this.loadInsights();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'search':
                this.focusSearch();
                break;
        }
    }
    
    async loadInsights() {
        // TODO: Implement AI insights
        const container = document.querySelector('.insight-cards');
        container.innerHTML = `
            <div class="insight-card">
                <h3>🎯 Your Focus Areas</h3>
                <p>You've spent the most time researching web development and AI tools.</p>
            </div>
            <div class="insight-card">
                <h3>📈 Learning Velocity</h3>
                <p>You're reading 20% more technical content this week compared to last week.</p>
            </div>
            <div class="insight-card">
                <h3>🔍 Discovery Pattern</h3>
                <p>You tend to dive deepest into content between 2-4 PM.</p>
            </div>
        `;
    }
    
    async loadAnalytics() {
        // Prepare data for charts
        const domainStats = this.calculateDomainStats();
        const hourlyStats = this.calculateHourlyStats();
        
        // Create or update charts
        this.createDomainsChart(domainStats);
        this.createHeatmapChart(hourlyStats);
        // TODO: Add more charts
    }
    
    calculateDomainStats() {
        const stats = {};
        this.logs.forEach(log => {
            const domain = new URL(log.url).hostname;
            if (!stats[domain]) {
                stats[domain] = { count: 0, timeSpent: 0 };
            }
            stats[domain].count++;
            stats[domain].timeSpent += log.timeSpentSeconds || 0;
        });
        
        // Get top 10 domains by time spent
        return Object.entries(stats)
            .sort((a, b) => b[1].timeSpent - a[1].timeSpent)
            .slice(0, 10)
            .map(([domain, data]) => ({
                domain,
                timeSpent: data.timeSpent,
                count: data.count
            }));
    }
    
    calculateHourlyStats() {
        const hourlyData = Array(24).fill(0);
        this.logs.forEach(log => {
            const hour = new Date(log.startTimestamp).getHours();
            hourlyData[hour] += log.timeSpentSeconds || 0;
        });
        return hourlyData;
    }
    
    createDomainsChart(data) {
        const ctx = document.getElementById('domains-chart').getContext('2d');
        
        if (this.charts.domains) {
            this.charts.domains.destroy();
        }
        
        this.charts.domains = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.domain),
                datasets: [{
                    data: data.map(d => Math.round(d.timeSpent / 60)), // Convert to minutes
                    backgroundColor: [
                        '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
                        '#06b6d4', '#f97316', '#6366f1', '#84cc16', '#a855f7'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.documentElement)
                                .getPropertyValue('--text-primary')
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed;
                                return `${context.label}: ${value} minutes`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    createHeatmapChart(data) {
        const ctx = document.getElementById('heatmap-chart').getContext('2d');
        
        if (this.charts.heatmap) {
            this.charts.heatmap.destroy();
        }
        
        this.charts.heatmap = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Activity (minutes)',
                    data: data.map(seconds => Math.round(seconds / 60)),
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: getComputedStyle(document.documentElement)
                                .getPropertyValue('--text-secondary')
                        }
                    },
                    x: {
                        ticks: {
                            color: getComputedStyle(document.documentElement)
                                .getPropertyValue('--text-secondary')
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    updateStats() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        
        let todayPages = 0;
        let todayTime = 0;
        let weekPages = 0;
        
        this.logs.forEach(log => {
            const logDate = new Date(log.startTimestamp);
            if (logDate >= todayStart) {
                todayPages++;
                todayTime += log.timeSpentSeconds || 0;
            }
            if (logDate >= weekStart) {
                weekPages++;
            }
        });
        
        document.getElementById('today-pages').textContent = todayPages;
        document.getElementById('today-time').textContent = this.formatTime(todayTime);
        document.getElementById('week-pages').textContent = weekPages;
        document.getElementById('total-pages').textContent = this.logs.length;
    }
    
    focusSearch() {
        document.getElementById('search-input').focus();
    }
    
    showDateFilter() {
        // TODO: Implement date range picker
        this.showToast('Date filter coming soon!', 'info');
    }
    
    showDomainFilter() {
        // TODO: Implement domain filter
        this.showToast('Domain filter coming soon!', 'info');
    }
    
    showTagFilter() {
        // TODO: Implement tag filter
        this.showToast('Tag filter coming soon!', 'info');
    }
    
    showLoading(show) {
        const loading = document.getElementById('loading');
        loading.classList.toggle('hidden', !show);
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
        toast.innerHTML = `
            <span>${icon}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    showError(message) {
        const grid = document.getElementById('activity-grid');
        grid.innerHTML = `<div class="error">${message}</div>`;
    }
    
    // Filter modal implementations
    showDateFilter() {
        const modal = this.createModal('Filter by Date Range', `
            <div class="filter-form">
                <div class="form-group">
                    <label>From Date:</label>
                    <input type="date" id="filter-date-from" max="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>To Date:</label>
                    <input type="date" id="filter-date-to" max="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="filter-presets">
                    <button class="preset-btn" data-preset="today">Today</button>
                    <button class="preset-btn" data-preset="week">This Week</button>
                    <button class="preset-btn" data-preset="month">This Month</button>
                </div>
            </div>
        `);
        
        // Handle presets
        modal.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                const today = new Date();
                const fromInput = modal.querySelector('#filter-date-from');
                const toInput = modal.querySelector('#filter-date-to');
                
                toInput.value = today.toISOString().split('T')[0];
                
                switch(preset) {
                    case 'today':
                        fromInput.value = today.toISOString().split('T')[0];
                        break;
                    case 'week':
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        fromInput.value = weekAgo.toISOString().split('T')[0];
                        break;
                    case 'month':
                        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                        fromInput.value = monthAgo.toISOString().split('T')[0];
                        break;
                }
                
                this.applyDateFilter();
                this.closeModal(modal);
            });
        });
        
        // Apply button
        const applyBtn = modal.querySelector('.modal-apply');
        applyBtn.addEventListener('click', () => {
            this.applyDateFilter();
            this.closeModal(modal);
        });
    }
    
    showDomainFilter() {
        // Get unique domains from logs
        const domains = [...new Set(this.logs.map(log => new URL(log.url).hostname))];
        domains.sort();
        
        const modal = this.createModal('Filter by Domain', `
            <div class="filter-form">
                <input type="text" id="domain-search" placeholder="Search domains..." class="domain-search">
                <div class="domain-list">
                    ${domains.map(domain => `
                        <label class="domain-item">
                            <input type="checkbox" value="${domain}" class="domain-checkbox">
                            <span>${domain}</span>
                            <span class="domain-count">${this.logs.filter(log => new URL(log.url).hostname === domain).length}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `);
        
        // Search functionality
        const searchInput = modal.querySelector('#domain-search');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            modal.querySelectorAll('.domain-item').forEach(item => {
                const domain = item.querySelector('span').textContent.toLowerCase();
                item.style.display = domain.includes(query) ? 'flex' : 'none';
            });
        });
        
        // Apply button
        const applyBtn = modal.querySelector('.modal-apply');
        applyBtn.addEventListener('click', () => {
            const selected = [...modal.querySelectorAll('.domain-checkbox:checked')].map(cb => cb.value);
            this.applyDomainFilter(selected);
            this.closeModal(modal);
        });
    }
    
    showTagFilter() {
        // Get all unique tags
        const allTags = new Set();
        this.logs.forEach(log => {
            try {
                const tags = JSON.parse(log.tagsJson || '[]');
                tags.forEach(tag => allTags.add(tag));
            } catch (e) {}
        });
        
        const tags = [...allTags].sort();
        
        const modal = this.createModal('Filter by Tags', `
            <div class="filter-form">
                <div class="tag-cloud">
                    ${tags.map(tag => `
                        <button class="tag-filter-btn" data-tag="${tag}">
                            ${tag}
                            <span class="tag-count">${this.logs.filter(log => {
                                try {
                                    return JSON.parse(log.tagsJson || '[]').includes(tag);
                                } catch (e) { return false; }
                            }).length}</span>
                        </button>
                    `).join('')}
                </div>
                ${tags.length === 0 ? '<p class="no-tags">No tags found in your activities</p>' : ''}
            </div>
        `);
        
        // Tag click handler
        modal.querySelectorAll('.tag-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterByTag(btn.dataset.tag);
                this.closeModal(modal);
            });
        });
    }
    
    // Modal helper methods
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button class="modal-cancel">Cancel</button>
                    <button class="modal-apply">Apply</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close handlers
        modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal(modal));
        modal.querySelector('.modal-cancel').addEventListener('click', () => this.closeModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal);
        });
        
        return modal;
    }
    
    closeModal(modal) {
        modal.remove();
    }
    
    applyDateFilter() {
        const fromDate = document.getElementById('filter-date-from')?.value;
        const toDate = document.getElementById('filter-date-to')?.value;
        
        if (!fromDate && !toDate) {
            this.filteredLogs = [...this.logs];
        } else {
            const from = fromDate ? new Date(fromDate).getTime() : 0;
            const to = toDate ? new Date(toDate + 'T23:59:59').getTime() : Date.now();
            
            this.filteredLogs = this.logs.filter(log => {
                const logTime = log.startTimestamp;
                return logTime >= from && logTime <= to;
            });
        }
        
        this.renderActivityGrid();
        this.showToast(`Filtered to ${this.filteredLogs.length} activities`, 'info');
    }
    
    applyDomainFilter(domains) {
        if (domains.length === 0) {
            this.filteredLogs = [...this.logs];
        } else {
            this.filteredLogs = this.logs.filter(log => {
                const domain = new URL(log.url).hostname;
                return domains.includes(domain);
            });
        }
        
        this.renderActivityGrid();
        this.showToast(`Filtered to ${this.filteredLogs.length} activities`, 'info');
    }
    
    // Settings implementation
    showSettings() {
        const modal = this.createModal('Settings', `
            <div class="settings-form">
                <div class="settings-section">
                    <h4>Display Settings</h4>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="settings-auto-refresh" ${localStorage.getItem('autoRefresh') === 'true' ? 'checked' : ''}>
                            Auto-refresh activities every 30 seconds
                        </label>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="settings-show-summaries" ${localStorage.getItem('showSummaries') !== 'false' ? 'checked' : ''}>
                            Show AI summaries in cards
                        </label>
                    </div>
                    <div class="form-group">
                        <label>
                            Default view:
                            <select id="settings-default-view">
                                <option value="timeline" ${localStorage.getItem('defaultView') === 'timeline' ? 'selected' : ''}>Timeline</option>
                                <option value="insights" ${localStorage.getItem('defaultView') === 'insights' ? 'selected' : ''}>Insights</option>
                                <option value="search" ${localStorage.getItem('defaultView') === 'search' ? 'selected' : ''}>Search</option>
                                <option value="analytics" ${localStorage.getItem('defaultView') === 'analytics' ? 'selected' : ''}>Analytics</option>
                            </select>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>Data Management</h4>
                    <div class="form-group">
                        <button class="btn-secondary" id="export-data">Export All Data</button>
                        <button class="btn-secondary" id="clear-cache">Clear Cache</button>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>API Configuration</h4>
                    <div class="form-group">
                        <label>
                            Worker URL:
                            <input type="text" id="settings-worker-url" value="${this.workerUrl}" placeholder="https://your-worker.workers.dev">
                        </label>
                    </div>
                    <div class="form-group">
                        <label>
                            Auth Token:
                            <input type="password" id="settings-auth-token" value="${this.authToken}" placeholder="Your authentication token">
                        </label>
                    </div>
                </div>
            </div>
        `);
        
        // Export data handler
        modal.querySelector('#export-data').addEventListener('click', () => {
            this.exportData();
        });
        
        // Clear cache handler
        modal.querySelector('#clear-cache').addEventListener('click', () => {
            if (confirm('This will clear all cached data. Continue?')) {
                localStorage.removeItem('cachedLogs');
                localStorage.removeItem('cachedSummaries');
                this.showToast('Cache cleared', 'success');
            }
        });
        
        // Apply button saves settings
        const applyBtn = modal.querySelector('.modal-apply');
        applyBtn.textContent = 'Save Settings';
        applyBtn.addEventListener('click', () => {
            // Save display settings
            localStorage.setItem('autoRefresh', modal.querySelector('#settings-auto-refresh').checked);
            localStorage.setItem('showSummaries', modal.querySelector('#settings-show-summaries').checked);
            localStorage.setItem('defaultView', modal.querySelector('#settings-default-view').value);
            
            // Save API settings if changed
            const newWorkerUrl = modal.querySelector('#settings-worker-url').value;
            const newAuthToken = modal.querySelector('#settings-auth-token').value;
            
            if (newWorkerUrl !== this.workerUrl || newAuthToken !== this.authToken) {
                // Update config.js would require server-side handling
                // For now, just update in memory and localStorage
                this.workerUrl = newWorkerUrl;
                this.authToken = newAuthToken;
                localStorage.setItem('customWorkerUrl', newWorkerUrl);
                localStorage.setItem('customAuthToken', newAuthToken);
                
                // Reload logs with new settings
                this.loadLogs();
            }
            
            this.closeModal(modal);
            this.showToast('Settings saved', 'success');
            
            // Apply auto-refresh if enabled
            if (localStorage.getItem('autoRefresh') === 'true') {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });
    }
    
    exportData() {
        const data = {
            logs: this.logs,
            exportDate: new Date().toISOString(),
            totalActivities: this.logs.length,
            dateRange: {
                from: new Date(Math.min(...this.logs.map(l => l.startTimestamp))).toISOString(),
                to: new Date(Math.max(...this.logs.map(l => l.startTimestamp))).toISOString()
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `web-chronicle-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast(`Exported ${this.logs.length} activities`, 'success');
    }
    
    startAutoRefresh() {
        if (this.autoRefreshInterval) return;
        
        this.autoRefreshInterval = setInterval(() => {
            this.loadLogs();
        }, 30000); // 30 seconds
    }
    
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new WebChronicle();
});