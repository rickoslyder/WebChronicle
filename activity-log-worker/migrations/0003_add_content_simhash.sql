-- Add contentSimhash column and index for similarity checks
ALTER TABLE logs ADD COLUMN contentSimhash TEXT;

-- Index for efficient lookup of the latest log for a given URL
-- Needed for Simhash comparison
CREATE INDEX IF NOT EXISTS idx_logs_url_simhash_lookup ON logs (url, endTimestamp DESC);
