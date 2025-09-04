#!/usr/bin/env node

/**
 * Script pour tester avec un événement Slack plus réaliste
 * Usage: node scripts/test-slack-realistic-event.js
 */

console.log("🧪 Test d'événement Slack réaliste...\n");

async function testSlackRealisticEvent() {
  const config = {
    supabaseUrl: 'https://zcyalwewcdgbftaaneet.supabase.co',
    functionName: 'slack-webhook',
  };

  // Utiliser le vrai Channel ID de la base de données
  const realChannelId = 'C09DEU6GRDK';

  // Simuler un événement file_shared avec des données plus réalistes
  const mockSlackEvent = {
    type: 'event_callback',
    event: {
      type: 'file_shared',
      channel: realChannelId,
      user: 'U09DEU6GRDK', // ID utilisateur plus réaliste (même préfixe que le channel)
      file: {
        id: 'F09DEU6GRDK123',
        name: 'family-photo.jpg',
        title: 'Family Photo',
        mimetype: 'image/jpeg',
        filetype: 'jpg',
        pretty_type: 'JPEG',
        user: 'U09DEU6GRDK',
        size: 2048000,
        url_private:
          'https://files.slack.com/files-pri/T09DEU6GRDK-F09DEU6GRDK123/family-photo.jpg',
        url_private_download:
          'https://files.slack.com/files-pri/T09DEU6GRDK-F09DEU6GRDK123/download/family-photo.jpg',
        permalink:
          'https://workspace.slack.com/files/U09DEU6GRDK/F09DEU6GRDK123/family-photo.jpg',
        permalink_public:
          'https://slack-files.com/T09DEU6GRDK-F09DEU6GRDK123-family-photo.jpg',
        is_external: false,
        is_public: false,
        public_url_shared: false,
        display_as_bot: false,
        username: 'john.doe', // Username réaliste
        timestamp: Math.floor(Date.now() / 1000),
      },
      ts: Math.floor(Date.now() / 1000).toString(),
    },
  };

  console.log("📤 Envoi de l'événement réaliste...");
  console.log('Channel ID:', mockSlackEvent.event.channel);
  console.log('User ID:', mockSlackEvent.event.user);
  console.log('File:', mockSlackEvent.event.file.name);
  console.log('Username:', mockSlackEvent.event.file.username);

  try {
    const response = await fetch(
      `${config.supabaseUrl}/functions/v1/${config.functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockSlackEvent),
      }
    );

    const result = await response.text();
    console.log('📥 Réponse:', result);

    if (response.ok) {
      console.log('✅ Événement traité avec succès');
    } else {
      console.log('❌ Erreur:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('\n💡 Analyse du problème :');
  console.log(
    "1. L'Edge Function tente de récupérer les infos utilisateur via l'API Slack"
  );
  console.log("2. Si l'API échoue, elle utilise les données de fallback");
  console.log(
    "3. Le problème peut venir des permissions du bot ou de l'ID utilisateur"
  );
  console.log('');
  console.log('🔧 Solutions :');
  console.log('1. Vérifiez que le bot a la permission "users:read"');
  console.log('2. Utilisez un vrai User ID de votre workspace Slack');
  console.log('3. Partagez un vrai fichier dans le channel pour tester');
  console.log('');
  console.log('📋 Pour vérifier les permissions du bot :');
  console.log('- Allez sur api.slack.com');
  console.log('- Sélectionnez votre app Memento');
  console.log('- OAuth & Permissions → Scopes Bot');
  console.log('- Vérifiez que "users:read" est présent');
}

testSlackRealisticEvent().catch(console.error);
