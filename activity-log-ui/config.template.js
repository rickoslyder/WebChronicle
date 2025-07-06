// Configuration template for Activity Log UI
// Copy this file to config.js and fill in your values
// NEVER commit config.js to version control

const config = {
    // Your Cloudflare Worker URL
    workerUrl: 'https://your-worker.workers.dev',
    
    // Your authentication token
    // Generate a secure token using: openssl rand -hex 32
    authToken: 'YOUR_AUTH_TOKEN_HERE',
    
    // Optional: Override for development
    // workerUrl: 'http://localhost:8787',
};

// Export for use in other scripts
window.APP_CONFIG = config;