-- D1 Database schema for logs table
DROP TABLE IF EXISTS logs;
CREATE TABLE logs (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT,
    startTimestamp INTEGER NOT NULL,
    endTimestamp INTEGER,
    timeSpentSeconds INTEGER,
    maxScrollPercent REAL,
    tagsJson TEXT,
    summaryR2Key TEXT NOT NULL,
    processedAt INTEGER NOT NULL,
    contentHash TEXT NOT NULL, -- SHA-256 hash of textContent for deduplication
    contentSimhash TEXT, -- Simhash fingerprint for content similarity
    contentR2Key TEXT, -- Key for the full text content stored in R2
    textContent TEXT NOT NULL, -- Store the raw text for potential reprocessing?
    tagsJson TEXT, -- JSON array of tags from AI
    processedAt INTEGER NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_logs_startTimestamp ON logs(startTimestamp);
CREATE INDEX IF NOT EXISTS idx_logs_url ON logs(url);
CREATE INDEX IF NOT EXISTS idx_logs_processedAt ON logs(processedAt);
CREATE INDEX IF NOT EXISTS idx_contentHash ON logs(contentHash);
CREATE INDEX IF NOT EXISTS idx_logs_url_timestamp ON logs (url, endTimestamp);
CREATE INDEX IF NOT EXISTS idx_logs_content_hash ON logs (contentHash);
CREATE INDEX IF NOT EXISTS idx_logs_url_simhash_lookup ON logs (url, endTimestamp DESC);
