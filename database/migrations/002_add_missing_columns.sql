-- Migration: Ajout des colonnes manquantes à external_data_sources
-- Date: 2024-12-19
-- Description: Ajoute les colonnes manquantes pour la compatibilité avec le code

-- 1. Ajouter la colonne created_by si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'external_data_sources' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE external_data_sources 
        ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Column created_by added to external_data_sources';
    ELSE
        RAISE NOTICE 'Column created_by already exists in external_data_sources';
    END IF;
END $$;

-- 2. Ajouter la colonne source_type si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'external_data_sources' 
        AND column_name = 'source_type'
    ) THEN
        ALTER TABLE external_data_sources 
        ADD COLUMN source_type TEXT CHECK (source_type IN ('telegram', 'whatsapp', 'email'));
        
        RAISE NOTICE 'Column source_type added to external_data_sources';
    ELSE
        RAISE NOTICE 'Column source_type already exists in external_data_sources';
    END IF;
END $$;

-- 3. Si la colonne 'type' existe, migrer les données vers 'source_type' et la supprimer
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'external_data_sources' 
        AND column_name = 'type'
    ) THEN
        -- Migrer les données de 'type' vers 'source_type'
        UPDATE external_data_sources 
        SET source_type = type 
        WHERE source_type IS NULL;
        
        -- Supprimer la colonne 'type'
        ALTER TABLE external_data_sources DROP COLUMN type;
        
        RAISE NOTICE 'Data migrated from type to source_type and type column dropped';
    ELSE
        RAISE NOTICE 'Column type does not exist, no migration needed';
    END IF;
END $$;

-- 4. Ajouter les colonnes manquantes à post_images si elles n'existent pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'post_images' 
        AND column_name = 'source'
    ) THEN
        ALTER TABLE post_images 
        ADD COLUMN source TEXT DEFAULT 'APP_UPLOAD' CHECK (source IN ('APP_UPLOAD', 'TELEGRAM', 'WHATSAPP', 'EMAIL', 'API', 'IMPORT'));
        
        RAISE NOTICE 'Column source added to post_images';
    ELSE
        RAISE NOTICE 'Column source already exists in post_images';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'post_images' 
        AND column_name = 'external_post_id'
    ) THEN
        ALTER TABLE post_images 
        ADD COLUMN external_post_id UUID;
        
        RAISE NOTICE 'Column external_post_id added to post_images';
    ELSE
        RAISE NOTICE 'Column external_post_id already exists in post_images';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'post_images' 
        AND column_name = 'family_id'
    ) THEN
        ALTER TABLE post_images 
        ADD COLUMN family_id UUID REFERENCES families(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Column family_id added to post_images';
    ELSE
        RAISE NOTICE 'Column family_id already exists in post_images';
    END IF;
END $$;

-- 5. Créer la table external_posts si elle n'existe pas
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

-- 6. Ajouter les index manquants
CREATE INDEX IF NOT EXISTS idx_external_data_sources_family_id ON external_data_sources(family_id);
CREATE INDEX IF NOT EXISTS idx_external_data_sources_source_type ON external_data_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_external_data_sources_active ON external_data_sources(is_active);

CREATE INDEX IF NOT EXISTS idx_external_posts_family_id ON external_posts(family_id);
CREATE INDEX IF NOT EXISTS idx_external_posts_source_id ON external_posts(source_id);
CREATE INDEX IF NOT EXISTS idx_external_posts_source_type ON external_posts(source_type);
CREATE INDEX IF NOT EXISTS idx_external_posts_imported_at ON external_posts(imported_at);

CREATE INDEX IF NOT EXISTS idx_post_images_source ON post_images(source);
CREATE INDEX IF NOT EXISTS idx_post_images_external_post_id ON post_images(external_post_id);
CREATE INDEX IF NOT EXISTS idx_post_images_family_id ON post_images(family_id);

-- 7. Vérifier et activer RLS si pas déjà fait
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'external_data_sources' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE external_data_sources ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on external_data_sources';
    ELSE
        RAISE NOTICE 'RLS already enabled on external_data_sources';
    END IF;
END $$;

-- 8. Ajouter les policies RLS si elles n'existent pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'external_data_sources' 
        AND policyname = 'Users can view external data sources of their family'
    ) THEN
        CREATE POLICY "Users can view external data sources of their family" ON external_data_sources
            FOR SELECT USING (
                family_id IN (
                    SELECT family_id FROM family_members 
                    WHERE user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Policy "Users can view external data sources of their family" created';
    ELSE
        RAISE NOTICE 'Policy "Users can view external data sources of their family" already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'external_data_sources' 
        AND policyname = 'Family admins can manage external data sources'
    ) THEN
        CREATE POLICY "Family admins can manage external data sources" ON external_data_sources
            FOR ALL USING (
                family_id IN (
                    SELECT family_id FROM family_members 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
        RAISE NOTICE 'Policy "Family admins can manage external data sources" created';
    ELSE
        RAISE NOTICE 'Policy "Family admins can manage external data sources" already exists';
    END IF;
END $$;

-- 9. Afficher un résumé des modifications
SELECT 
    'Migration completed successfully!' as status,
    'Check the logs above for details' as details;

