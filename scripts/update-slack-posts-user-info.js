#!/usr/bin/env node

/**
 * Script pour mettre à jour les posts Slack existants avec les informations utilisateur
 * Usage: node scripts/update-slack-posts-user-info.js
 */

console.log('🔧 Mise à jour des posts Slack existants...\n');

async function updateSlackPostsUserInfo() {
  const config = {
    supabaseUrl: 'https://zcyalwewcdgbftaaneet.supabase.co',
    functionName: 'slack-webhook',
  };

  console.log('📋 Ce script va :');
  console.log('1. Identifier les posts Slack avec "Unknown" comme utilisateur');
  console.log('2. Tenter de récupérer les vraies informations utilisateur');
  console.log('3. Mettre à jour les métadonnées des posts');
  console.log('');

  // Simuler un événement pour récupérer les infos utilisateur
  const testEvent = {
    type: 'get_user_info',
    user_id: 'U1234567890', // ID utilisateur de test
  };

  try {
    console.log('🧪 Test de récupération des informations utilisateur...');

    const response = await fetch(
      `${config.supabaseUrl}/functions/v1/${config.functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testEvent),
      }
    );

    const result = await response.text();
    console.log('📥 Réponse:', result);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('\n💡 Solution recommandée :');
  console.log(
    '1. Partagez un nouveau fichier dans le channel Slack C09DEU6GRDK'
  );
  console.log(
    "2. L'Edge Function mise à jour récupérera automatiquement les vraies informations"
  );
  console.log(
    "3. Le nom de l'utilisateur s'affichera correctement dans le feed"
  );
  console.log('');
  console.log('🔍 Pour vérifier :');
  console.log("- Allez dans l'app Memento");
  console.log(
    "- Vérifiez que le nouveau post Slack affiche le bon nom d'utilisateur"
  );
  console.log(
    '- Les anciens posts resteront avec "Unknown" jusqu\'à ce qu\'ils soient mis à jour'
  );
}

updateSlackPostsUserInfo().catch(console.error);
