-- Rollback: Suppression des tables d'intégration Telegram
-- Date: 2024-12-19
-- Description: Annulation de la migration 001_create_telegram_integration_tables.sql

-- Supprimer les triggers
DROP TRIGGER IF EXISTS update_external_data_sources_updated_at ON external_data_sources;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Supprimer les tables (dans l'ordre pour respecter les contraintes de clés étrangères)
DROP TABLE IF EXISTS external_media;
DROP TABLE IF EXISTS external_data_sources;

-- Note: Les extensions et index seront supprimés automatiquement avec les tables
