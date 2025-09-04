-- Script SQL pour vérifier les permissions RLS de external_data_sources
-- À exécuter dans l'interface Supabase SQL Editor

-- 1. Vérifier les politiques RLS existantes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'external_data_sources';

-- 2. Vérifier si RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'external_data_sources';

-- 3. Tester l'insertion avec service_role (ce que fait l'OAuth)
-- Cette requête devrait fonctionner si les permissions sont correctes
INSERT INTO external_data_sources (
    family_id,
    source_type,
    name,
    config,
    is_active,
    created_by
) VALUES (
    NULL,
    'slack',
    'Test OAuth',
    '{"test": "oauth"}'::jsonb,
    false,
    NULL
) ON CONFLICT DO NOTHING;

-- 4. Vérifier l'insertion
SELECT * FROM external_data_sources WHERE name = 'Test OAuth';

-- 5. Nettoyer le test
DELETE FROM external_data_sources WHERE name = 'Test OAuth';
