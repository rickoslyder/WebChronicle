-- D1 Database schema for logs table
DROP TABLE IF EXISTS logs;
CREATE TABLE logs (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT,
    startTimestamp INTEGER NOT NULL,
    endTimestamp INTEGER,
    timeSpentSeconds INTEGER,
    maxScrollPercent INTEGER,
    tagsJson TEXT,
    summaryR2Key TEXT NOT NULL,
    processedAt INTEGER NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_logs_startTimestamp ON logs(startTimestamp);
CREATE INDEX IF NOT EXISTS idx_logs_url ON logs(url);
CREATE INDEX IF NOT EXISTS idx_logs_processedAt ON logs(processedAt);