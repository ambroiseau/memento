#!/usr/bin/env node

/**
 * Script pour tester un événement Slack avec le vrai Channel ID
 * Usage: node scripts/test-real-slack-event.js
 */

console.log("🧪 Test d'événement Slack avec le vrai Channel ID...\n");

async function testRealSlackEvent() {
  const config = {
    supabaseUrl: 'https://zcyalwewcdgbftaaneet.supabase.co',
    functionName: 'slack-webhook',
  };

  // Utiliser le vrai Channel ID de la base de données
  const realChannelId = 'C09DEU6GRDK';

  // Simuler un événement file_shared
  const mockSlackEvent = {
    type: 'event_callback',
    event: {
      type: 'file_shared',
      channel: realChannelId,
      user: 'U1234567890',
      file: {
        id: 'F1234567890',
        name: 'test-image.jpg',
        title: 'Test Image',
        mimetype: 'image/jpeg',
        filetype: 'jpg',
        pretty_type: 'JPEG',
        user: 'U1234567890',
        size: 1024000,
        url_private:
          'https://files.slack.com/files-pri/T1234567890-F1234567890/test-image.jpg',
        url_private_download:
          'https://files.slack.com/files-pri/T1234567890-F1234567890/download/test-image.jpg',
        permalink:
          'https://workspace.slack.com/files/U1234567890/F1234567890/test-image.jpg',
        permalink_public:
          'https://slack-files.com/T1234567890-F1234567890-test-image.jpg',
        is_external: false,
        is_public: false,
        public_url_shared: false,
        display_as_bot: false,
        username: 'testuser',
        timestamp: Math.floor(Date.now() / 1000),
      },
      ts: Math.floor(Date.now() / 1000).toString(),
    },
  };

  console.log("📤 Envoi de l'événement simulé...");
  console.log('Channel ID:', mockSlackEvent.event.channel);
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
    } else {
      console.log('❌ Erreur:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('\n💡 Prochaines étapes :');
  console.log('1. Vérifiez que le bot Memento a accès au channel C09DEU6GRDK');
  console.log('2. Partagez un vrai fichier dans ce channel Slack');
  console.log("3. Vérifiez que le fichier apparaît dans l'app Memento");
}

testRealSlackEvent().catch(console.error);
