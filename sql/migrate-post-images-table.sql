-- Migration: Add metadata columns to post_images table
-- This migration adds columns for file metadata and migration tracking

-- Add new columns for image metadata
ALTER TABLE post_images 
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS width INTEGER,
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Add comments for documentation
COMMENT ON COLUMN post_images.file_size IS 'File size in bytes';
COMMENT ON COLUMN post_images.mime_type IS 'MIME type of the image (e.g., image/jpeg)';
COMMENT ON COLUMN post_images.width IS 'Image width in pixels';
COMMENT ON COLUMN post_images.height IS 'Image height in pixels';
COMMENT ON COLUMN post_images.migrated_at IS 'Timestamp when image was migrated from base64 to storage';
COMMENT ON COLUMN post_images.original_filename IS 'Original filename before migration';

-- Create index on migrated_at for performance
CREATE INDEX IF NOT EXISTS idx_post_images_migrated_at ON post_images(migrated_at);

-- Create index on file_size for analytics
CREATE INDEX IF NOT EXISTS idx_post_images_file_size ON post_images(file_size);

-- Add check constraint to ensure storage_path is not empty
ALTER TABLE post_images 
ADD CONSTRAINT check_storage_path_not_empty 
CHECK (storage_path IS NOT NULL AND storage_path != '');

-- Update existing records to mark them as not migrated
UPDATE post_images 
SET migrated_at = NULL 
WHERE migrated_at IS NULL;

-- Create a view for easy querying of migrated vs non-migrated images
CREATE OR REPLACE VIEW post_images_migration_status AS
SELECT 
  id,
  storage_path,
  CASE 
    WHEN storage_path LIKE 'data:image%' THEN 'base64'
    WHEN migrated_at IS NOT NULL THEN 'migrated'
    ELSE 'unknown'
  END as migration_status,
  file_size,
  mime_type,
  migrated_at,
  created_at
FROM post_images;

-- Grant permissions
GRANT SELECT ON post_images_migration_status TO authenticated;
GRANT SELECT ON post_images_migration_status TO anon;
