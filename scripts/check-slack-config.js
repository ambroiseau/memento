#!/usr/bin/env node

/**
 * Script pour vérifier la configuration Slack dans la base de données
 * Usage: node scripts/check-slack-config.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ5NzQ4MDAsImV4cCI6MjA0MDU1MDgwMH0.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlackConfig() {
  console.log('🔍 Vérification de la configuration Slack...\n');

  try {
    // 1. Vérifier les sources Slack configurées
    console.log('1️⃣ Sources Slack configurées :');
    const { data: slackSources, error: slackError } = await supabase
      .from('external_data_sources')
      .select('*')
      .eq('source_type', 'slack');

    if (slackError) {
      console.log('❌ Erreur:', slackError.message);
      return;
    }

    if (slackSources && slackSources.length > 0) {
      console.log(`✅ ${slackSources.length} source(s) Slack trouvée(s) :`);
      slackSources.forEach((source, index) => {
        console.log(`   ${index + 1}. ${source.name}`);
        console.log(`      - ID: ${source.id}`);
        console.log(`      - Family ID: ${source.family_id}`);
        console.log(
          `      - Config: ${JSON.stringify(source.config, null, 2)}`
        );
        console.log(`      - Active: ${source.is_active}`);
        console.log('');
      });
    } else {
      console.log('❌ Aucune source Slack configurée');
      console.log("💡 Configurez une source Slack dans l'app Memento");
    }

    // 2. Vérifier les médias Slack récents
    console.log('2️⃣ Médias Slack récents :');
    const { data: slackMedia, error: mediaError } = await supabase
      .from('external_media')
      .select('*')
      .eq('source_type', 'slack')
      .order('created_at', { ascending: false })
      .limit(5);

    if (mediaError) {
      console.log('❌ Erreur:', mediaError.message);
      return;
    }

    if (slackMedia && slackMedia.length > 0) {
      console.log(`✅ ${slackMedia.length} média(s) Slack trouvé(s) :`);
      slackMedia.forEach((media, index) => {
        console.log(`   ${index + 1}. ${media.filename || 'Sans nom'}`);
        console.log(`      - ID: ${media.id}`);
        console.log(`      - Source ID: ${media.source_id}`);
        console.log(
          `      - Créé: ${new Date(media.created_at).toLocaleString()}`
        );
        console.log('');
      });
    } else {
      console.log('❌ Aucun média Slack trouvé');
      console.log('💡 Partagez un fichier dans votre channel Slack configuré');
    }

    // 3. Vérifier les familles
    console.log('3️⃣ Familles disponibles :');
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('id, name')
      .limit(10);

    if (familiesError) {
      console.log('❌ Erreur:', familiesError.message);
      return;
    }

    if (families && families.length > 0) {
      console.log(`✅ ${families.length} famille(s) trouvée(s) :`);
      families.forEach((family, index) => {
        console.log(`   ${index + 1}. ${family.name} (ID: ${family.id})`);
      });
    } else {
      console.log('❌ Aucune famille trouvée');
    }
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

checkSlackConfig().catch(console.error);
