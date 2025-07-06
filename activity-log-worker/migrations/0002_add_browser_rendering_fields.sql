-- Migration to add browser rendering fields to logs table
-- This migration adds support for storing screenshot references and browser-rendered content

-- Add screenshot reference
ALTER TABLE logs ADD COLUMN screenshotR2Key TEXT;

-- Add flag to indicate if content was browser-rendered
ALTER TABLE logs ADD COLUMN browserRendered INTEGER DEFAULT 0;

-- Add JSON field for extracted dynamic data
ALTER TABLE logs ADD COLUMN dynamicContent TEXT;

-- Create index for browser-rendered content
CREATE INDEX idx_logs_browserRendered ON logs(browserRendered);