#!/usr/bin/env node

/**
 * Script pour tester la récupération des informations utilisateur Slack
 * Usage: node scripts/test-slack-user-info.js
 */

console.log('🧪 Test de récupération des informations utilisateur Slack...\n');

async function testSlackUserInfo() {
  const config = {
    supabaseUrl: 'https://zcyalwewcdgbftaaneet.supabase.co',
    functionName: 'slack-webhook',
  };

  // Utiliser le vrai Channel ID de la base de données
  const realChannelId = 'C09DEU6GRDK';

  // Simuler un événement file_shared avec un utilisateur réaliste
  const mockSlackEvent = {
    type: 'event_callback',
    event: {
      type: 'file_shared',
      channel: realChannelId,
      user: 'U1234567890', // ID utilisateur Slack
      file: {
        id: 'F1234567890',
        name: 'test-user-info.jpg',
        title: 'Test User Info',
        mimetype: 'image/jpeg',
        filetype: 'jpg',
        pretty_type: 'JPEG',
        user: 'U1234567890',
        size: 1024000,
        url_private:
          'https://files.slack.com/files-pri/T1234567890-F1234567890/test-user-info.jpg',
        url_private_download:
          'https://files.slack.com/files-pri/T1234567890-F1234567890/download/test-user-info.jpg',
        permalink:
          'https://workspace.slack.com/files/U1234567890/F1234567890/test-user-info.jpg',
        permalink_public:
          'https://slack-files.com/T1234567890-F1234567890-test-user-info.jpg',
        is_external: false,
        is_public: false,
        public_url_shared: false,
        display_as_bot: false,
        username: 'testuser', // Ancien username (sera remplacé par les vraies infos)
        timestamp: Math.floor(Date.now() / 1000),
      },
      ts: Math.floor(Date.now() / 1000).toString(),
    },
  };

  console.log(
    "📤 Envoi de l'événement avec récupération des infos utilisateur..."
  );
  console.log('Channel ID:', mockSlackEvent.event.channel);
  console.log('User ID:', mockSlackEvent.event.user);
  console.log('File:', mockSlackEvent.event.file.name);

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
      console.log(
        "💡 Les informations utilisateur devraient maintenant être récupérées via l'API Slack"
      );
    } else {
      console.log('❌ Erreur:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('\n📋 Nouvelles fonctionnalités ajoutées :');
  console.log("✅ Récupération du vrai nom de l'utilisateur Slack");
  console.log('✅ Récupération du prénom et nom complet');
  console.log("✅ Récupération de l'email et de l'avatar");
  console.log("✅ Fallback vers les anciennes données si l'API échoue");
  console.log('');
  console.log('💡 Pour tester avec un vrai utilisateur :');
  console.log('1. Partagez un fichier dans le channel C09DEU6GRDK');
  console.log(
    "2. Vérifiez que le nom affiché est le vrai nom de l'utilisateur"
  );
  console.log('3. Vérifiez les métadonnées dans la base de données');
}

testSlackUserInfo().catch(console.error);
