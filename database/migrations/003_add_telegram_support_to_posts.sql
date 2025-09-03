-- Migration: Add Telegram support to posts table
-- Date: 2025-09-02

-- Add source_type column to identify external sources (telegram, app, etc.)
ALTER TABLE posts 
ADD COLUMN source_type TEXT DEFAULT 'app';

-- Add metadata column to store additional information (JSONB for flexibility)
ALTER TABLE posts 
ADD COLUMN metadata JSONB DEFAULT '{}';

-- Add index on source_type for better performance
CREATE INDEX idx_posts_source_type ON posts(source_type);

-- Add index on metadata for JSON queries
CREATE INDEX idx_posts_metadata ON posts USING GIN (metadata);

-- Update existing posts to have source_type = 'app'
UPDATE posts 
SET source_type = 'app' 
WHERE source_type IS NULL;

-- Add comment to explain the new columns
COMMENT ON COLUMN posts.source_type IS 'Source of the post: app, telegram, etc.';
COMMENT ON COLUMN posts.metadata IS 'Additional metadata as JSON (e.g., Telegram message info)';

