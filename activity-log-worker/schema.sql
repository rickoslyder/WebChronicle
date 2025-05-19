-- D1 Database schema for logs table
-- The DROP TABLE statements have been removed to prevent accidental data loss.
-- This schema is now safe to apply even if the 'logs' table already exists.

CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT,
    startTimestamp INTEGER NOT NULL, -- Unix epoch ms
    endTimestamp INTEGER,           -- Unix epoch ms
    timeSpentSeconds INTEGER,
    maxScrollPercent INTEGER DEFAULT 0, -- Changed to INTEGER
    tagsJson TEXT,                  -- JSON string of tags from AI (Removed duplicate)
    summaryR2Key TEXT NOT NULL,     -- R2 key for AI-generated summary
    contentR2Key TEXT NOT NULL UNIQUE, -- R2 key for full text content, made NOT NULL and UNIQUE
    contentHash TEXT NOT NULL UNIQUE, -- SHA-256 hash of textContent, made UNIQUE
    contentSimhash TEXT,            -- Simhash of textContent
    processedAt INTEGER NOT NULL    -- Unix epoch ms for when the worker processed it (Removed duplicate)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_logs_startTimestamp ON logs(startTimestamp);
CREATE INDEX IF NOT EXISTS idx_logs_url ON logs(url);
CREATE INDEX IF NOT EXISTS idx_logs_processedAt ON logs(processedAt);
-- CREATE INDEX IF NOT EXISTS idx_contentHash ON logs(contentHash); -- This is covered by UNIQUE constraint if D1 auto-indexes UNIQUE cols, or keep if specific non-PK index desired
CREATE INDEX IF NOT EXISTS idx_logs_url_timestamp ON logs (url, endTimestamp); -- Consider if endTimestamp or startTimestamp is better here
CREATE INDEX IF NOT EXISTS idx_logs_url_simhash_lookup ON logs (url, endTimestamp DESC);
