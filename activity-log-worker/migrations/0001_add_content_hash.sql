-- Migration number: 0001 	 2025-05-03T22:57:26.729Z
ALTER TABLE logs ADD COLUMN contentHash TEXT;
CREATE INDEX IF NOT EXISTS idx_contentHash ON logs(contentHash);
