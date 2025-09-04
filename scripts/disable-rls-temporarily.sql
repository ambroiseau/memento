-- ATTENTION: Désactiver RLS temporairement pour tester
-- À réactiver après les tests !

-- Désactiver RLS sur external_data_sources
ALTER TABLE external_data_sources DISABLE ROW LEVEL SECURITY;

-- Vérifier que RLS est désactivé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'external_data_sources';

-- Pour réactiver RLS plus tard :
-- ALTER TABLE external_data_sources ENABLE ROW LEVEL SECURITY;
