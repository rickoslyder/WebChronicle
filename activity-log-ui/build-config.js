#!/usr/bin/env node

// Build script to generate config.js from environment variables
// This is used for production deployments on Netlify, Vercel, etc.

const fs = require('fs');

const workerUrl = process.env.WORKER_URL || 'https://activity-log-worker.workers.dev';
const authToken = process.env.AUTH_TOKEN;

if (!authToken) {
  console.error('ERROR: AUTH_TOKEN environment variable is required');
  process.exit(1);
}

const configContent = `// Auto-generated configuration
// DO NOT EDIT - This file is generated during build
const config = {
    workerUrl: '${workerUrl}',
    authToken: '${authToken}'
};

window.APP_CONFIG = config;
`;

fs.writeFileSync('config.js', configContent);
console.log('Generated config.js from environment variables');