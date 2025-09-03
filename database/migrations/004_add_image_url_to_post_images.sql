-- Migration: Add image_url column to post_images table
-- Date: 2025-09-02

-- Add image_url column to store the public URL of the image
ALTER TABLE post_images 
ADD COLUMN image_url TEXT;

-- Add comment to explain the new column
COMMENT ON COLUMN post_images.image_url IS 'Public URL of the image (e.g., Supabase Storage public URL)';

-- Update existing records to have image_url based on storage_path if possible
-- This is optional and can be done later if needed

