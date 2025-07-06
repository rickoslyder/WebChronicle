// Configuration for the Activity Log Worker

export const config = {
  cors: {
    // Add your allowed origins here
    // Chrome extensions use chrome-extension://EXTENSION_ID format
    allowedOrigins: [
      // Development origins
      'http://localhost:8080',
      'http://localhost:8787',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3000',
      
      // Production origins
      'https://web-chronicle-ui.pages.dev',
      'https://activity-log-ui.pages.dev',
      'https://webchronicle-ui.pages.dev',
      'https://web-chronicle-ui.rickoslyder.workers.dev',
      // Chrome extensions
      'chrome-extension://pfbcnhlgjefhmilogobgeadgkjpegedl',
    ],
    
    // Allow requests with no origin (extensions, direct API calls)
    allowNoOrigin: true,
    
    // Allow credentials in CORS requests
    allowCredentials: true
  },
  
  // Rate limiting configuration (for future implementation)
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1000
  },
  
  // Content size limits
  limits: {
    maxContentSize: 1024 * 1024, // 1MB
    maxSummaryLength: 2000,
    maxTags: 10
  }
};