-- Migration: Création des tables pour l'intégration des sources externes
-- Date: 2024-12-19
-- Description: Ajout des tables external_data_sources et external_posts, modification de post_images

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table pour configurer les sources de données externes
CREATE TABLE IF NOT EXISTS external_data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('telegram', 'whatsapp', 'email')),
    name TEXT NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT external_data_sources_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    CONSTRAINT external_data_sources_config_not_empty CHECK (jsonb_typeof(config) = 'object' AND config != '{}'::jsonb)
);

-- Table pour stocker les métadonnées des posts externes
CREATE TABLE IF NOT EXISTS external_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES external_data_sources(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('telegram', 'whatsapp', 'email')),
    caption TEXT,
    metadata JSONB DEFAULT '{}',
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT external_posts_external_id_length CHECK (char_length(external_id) >= 1 AND char_length(external_id) <= 255),
    CONSTRAINT external_posts_caption_length CHECK (caption IS NULL OR (char_length(caption) >= 1 AND char_length(caption) <= 1000)),
    UNIQUE(source_id, external_id)
);

-- Ajouter les nouvelles colonnes à post_images existant
ALTER TABLE post_images 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'APP_UPLOAD' CHECK (source IN ('APP_UPLOAD', 'TELEGRAM', 'WHATSAPP', 'EMAIL', 'API', 'IMPORT')),
ADD COLUMN IF NOT EXISTS external_post_id UUID REFERENCES external_posts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE CASCADE;

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_external_data_sources_family_id ON external_data_sources(family_id);
CREATE INDEX IF NOT EXISTS idx_external_data_sources_type ON external_data_sources(type);
CREATE INDEX IF NOT EXISTS idx_external_data_sources_active ON external_data_sources(is_active);

CREATE INDEX IF NOT EXISTS idx_external_posts_family_id ON external_posts(family_id);
CREATE INDEX IF NOT EXISTS idx_external_posts_source_id ON external_posts(source_id);
CREATE INDEX IF NOT EXISTS idx_external_posts_source_type ON external_posts(source_type);
CREATE INDEX IF NOT EXISTS idx_external_posts_imported_at ON external_posts(imported_at);

-- Index pour les nouvelles colonnes dans post_images
CREATE INDEX IF NOT EXISTS idx_post_images_source ON post_images(source);
CREATE INDEX IF NOT EXISTS idx_post_images_external_post_id ON post_images(external_post_id);
CREATE INDEX IF NOT EXISTS idx_post_images_family_id ON post_images(family_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_external_data_sources_updated_at 
    BEFORE UPDATE ON external_data_sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) pour la sécurité
ALTER TABLE external_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_posts ENABLE ROW LEVEL SECURITY;

-- Policies pour external_data_sources
CREATE POLICY "Users can view external data sources of their family" ON external_data_sources
    FOR SELECT USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Family admins can manage external data sources" ON external_data_sources
    FOR ALL USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policies pour external_posts
CREATE POLICY "Users can view external posts of their family" ON external_posts
    FOR SELECT USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Family admins can manage external posts" ON external_posts
    FOR ALL USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Commentaires pour la documentation
COMMENT ON TABLE external_data_sources IS 'Configuration des sources de données externes (Telegram, WhatsApp, etc.) pour chaque famille';
COMMENT ON TABLE external_posts IS 'Métadonnées des posts importés des sources externes, liés aux post_images';
COMMENT ON COLUMN external_data_sources.config IS 'Configuration spécifique à la source (ex: bot_token, chat_id pour Telegram)';
COMMENT ON COLUMN external_posts.external_id IS 'ID unique de la source externe (ex: message_id Telegram)';
COMMENT ON COLUMN external_posts.metadata IS 'Métadonnées additionnelles (ex: sender, timestamp, etc.)';
COMMENT ON COLUMN post_images.source IS 'Origine du média: APP_UPLOAD, TELEGRAM, WHATSAPP, EMAIL, API, IMPORT';
COMMENT ON COLUMN post_images.external_post_id IS 'Référence vers external_posts si le média vient d\'une source externe';
COMMENT ON COLUMN post_images.family_id IS 'Référence directe vers la famille pour les médias externes (sans post)';
