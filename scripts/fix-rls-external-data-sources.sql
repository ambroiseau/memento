-- Fix RLS policies for external_data_sources table
-- Allow OAuth route to create entries

-- 1. Vérifier les politiques existantes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'external_data_sources';

-- 2. Supprimer les politiques restrictives existantes
DROP POLICY IF EXISTS "Users can insert their own external data sources" ON external_data_sources;
DROP POLICY IF EXISTS "Users can view their own external data sources" ON external_data_sources;
DROP POLICY IF EXISTS "Users can update their own external data sources" ON external_data_sources;

-- 3. Créer des politiques plus permissives
-- Permettre l'insertion pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can insert external data sources" ON external_data_sources
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Permettre la lecture pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can view external data sources" ON external_data_sources
FOR SELECT 
TO authenticated
USING (true);

-- Permettre la mise à jour pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can update external data sources" ON external_data_sources
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Vérifier que RLS est activé
ALTER TABLE external_data_sources ENABLE ROW LEVEL SECURITY;
