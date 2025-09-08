-- Migration: Add Google Drive support
-- Date: 2025-09-07
-- Description: Extend allowed source types to include 'gdrive'

-- 1) Update CHECK constraint for external_data_sources.source_type
ALTER TABLE external_data_sources 
DROP CONSTRAINT IF EXISTS external_data_sources_source_type_check;

ALTER TABLE external_data_sources 
ADD CONSTRAINT external_data_sources_source_type_check 
CHECK (source_type IN ('telegram', 'whatsapp', 'email', 'slack', 'gdrive'));

-- 2) Update CHECK constraint for external_posts.source_type (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'external_posts') THEN
        ALTER TABLE external_posts 
        DROP CONSTRAINT IF EXISTS external_posts_source_type_check;

        ALTER TABLE external_posts 
        ADD CONSTRAINT external_posts_source_type_check 
        CHECK (source_type IN ('telegram', 'whatsapp', 'email', 'slack', 'gdrive'));
        
        RAISE NOTICE 'Updated external_posts source_type constraint to include gdrive';
    ELSE
        RAISE NOTICE 'external_posts table does not exist, skipping constraint update';
    END IF;
END $$;

-- 3) Update post_images.source constraint to include GDRIVE
ALTER TABLE post_images 
DROP CONSTRAINT IF EXISTS post_images_source_check;

ALTER TABLE post_images 
ADD CONSTRAINT post_images_source_check 
CHECK (source IN ('APP_UPLOAD', 'TELEGRAM', 'WHATSAPP', 'EMAIL', 'SLACK', 'GDRIVE', 'API', 'IMPORT'));

-- 4) Check if posts table has source_type and update it too (for shared posts table)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'source_type'
    ) THEN
        -- No direct constraint on posts.source_type usually, but we can add a comment
        COMMENT ON COLUMN posts.source_type IS 'Source of the post: app, telegram, whatsapp, email, slack, gdrive, etc.';
        RAISE NOTICE 'Updated posts.source_type column comment to include gdrive';
    ELSE
        RAISE NOTICE 'posts table does not have source_type column';
    END IF;
END $$;

-- 5) Comments
COMMENT ON CONSTRAINT external_data_sources_source_type_check ON external_data_sources 
IS 'Source types supported: telegram, whatsapp, email, slack, gdrive';

COMMENT ON CONSTRAINT post_images_source_check ON post_images 
IS 'Image sources: APP_UPLOAD, TELEGRAM, WHATSAPP, EMAIL, SLACK, GDRIVE, API, IMPORT';

-- 6) Summary
SELECT 'Google Drive support migration completed!' as status;