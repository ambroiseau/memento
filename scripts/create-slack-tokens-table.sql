-- Script SQL pour créer la table slack_workspace_tokens
-- À exécuter dans l'interface Supabase SQL Editor

CREATE TABLE IF NOT EXISTS slack_workspace_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id TEXT NOT NULL UNIQUE, -- Slack team ID (ex: T1234567890)
  bot_token TEXT NOT NULL, -- Bot token pour ce workspace
  team_name TEXT, -- Nom du workspace (optionnel)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_slack_workspace_tokens_team_id ON slack_workspace_tokens(team_id);

-- RLS policies
ALTER TABLE slack_workspace_tokens ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre la lecture/écriture aux admins
CREATE POLICY "Allow admin access to slack workspace tokens" ON slack_workspace_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.user_id = auth.uid()
      AND fm.role = 'admin'
    )
  );

-- Policy pour permettre l'insertion depuis l'Edge Function (service role)
CREATE POLICY "Allow service role access to slack workspace tokens" ON slack_workspace_tokens
  FOR ALL USING (auth.role() = 'service_role');
