-- Migration: Ajout du support Slack (version corrigée)
-- Date: 2025-09-04
-- Description: Ajoute 'slack' aux contraintes source_type

-- 1. Mettre à jour la contrainte CHECK pour external_data_sources
ALTER TABLE external_data_sources 
DROP CONSTRAINT IF EXISTS external_data_sources_source_type_check;

ALTER TABLE external_data_sources 
ADD CONSTRAINT external_data_sources_source_type_check 
CHECK (source_type IN ('telegram', 'whatsapp', 'email', 'slack'));

-- 2. Mettre à jour la contrainte CHECK pour external_posts (si elle existe)
ALTER TABLE external_posts 
DROP CONSTRAINT IF EXISTS external_posts_source_type_check;

ALTER TABLE external_posts 
ADD CONSTRAINT external_posts_source_type_check 
CHECK (source_type IN ('telegram', 'whatsapp', 'email', 'slack'));

-- 3. Mettre à jour la contrainte CHECK pour post_images source
ALTER TABLE post_images 
DROP CONSTRAINT IF EXISTS post_images_source_check;

ALTER TABLE post_images 
ADD CONSTRAINT post_images_source_check 
CHECK (source IN ('APP_UPLOAD', 'TELEGRAM', 'WHATSAPP', 'EMAIL', 'SLACK', 'API', 'IMPORT'));

-- 4. Ajouter un commentaire pour documenter
COMMENT ON CONSTRAINT external_data_sources_source_type_check ON external_data_sources 
IS 'Source types supported: telegram, whatsapp, email, slack';

COMMENT ON CONSTRAINT post_images_source_check ON post_images 
IS 'Image sources: APP_UPLOAD, TELEGRAM, WHATSAPP, EMAIL, SLACK, API, IMPORT';
