#!/usr/bin/env node

/**
 * Script simple pour vérifier la configuration Slack
 * Usage: node scripts/check-slack-simple.js
 */

console.log('🔍 Vérification de la configuration Slack...\n');

// Configuration Supabase (utilise les mêmes valeurs que l'app)
const SUPABASE_URL = 'https://zcyalwewcdgbftaaneet.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ5NzQ4MDAsImV4cCI6MjA0MDU1MDgwMH0.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K';

async function checkSlackConfig() {
  try {
    // 1. Vérifier les sources Slack configurées
    console.log('1️⃣ Sources Slack configurées :');
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/external_data_sources?source_type=eq.slack&select=*`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.log('❌ Erreur API:', response.status, response.statusText);
      return;
    }

    const slackSources = await response.json();

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
    const mediaResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/external_media?source_type=eq.slack&select=*&order=created_at.desc&limit=5`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (mediaResponse.ok) {
      const slackMedia = await mediaResponse.json();

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
        console.log(
          '💡 Partagez un fichier dans votre channel Slack configuré'
        );
      }
    } else {
      console.log(
        '❌ Erreur API médias:',
        mediaResponse.status,
        mediaResponse.statusText
      );
    }
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

checkSlackConfig().catch(console.error);
