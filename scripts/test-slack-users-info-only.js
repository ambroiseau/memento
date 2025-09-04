/**
 * Test simple de l'API Slack users.info
 * Ce script teste directement l'Edge Function avec un événement minimal
 */

console.log("🧪 Test de l'API Slack users.info uniquement...\n");

async function testSlackUsersInfo() {
  const webhookUrl =
    'https://zcyalwewcdgbftaaneet.supabase.co/functions/v1/slack-webhook';

  // Événement minimal pour tester users.info
  const testEvent = {
    type: 'event_callback',
    event: {
      type: 'file_shared',
      channel: 'C09DEU6GRDK', // Votre vrai channel ID
      user: 'UEB5RHGGZ', // Vrai User ID Slack
      file: {
        id: 'F1234567890',
        name: 'test.jpg',
        user: 'UEB5RHGGZ', // Même user ID
        username: 'test.user', // Username de fallback
        filetype: 'jpg',
        size: 1024,
        url_private: 'https://example.com/test.jpg',
        url_private_download: 'https://example.com/test.jpg',
        permalink: 'https://example.com/test.jpg',
        permalink_public: 'https://example.com/test.jpg',
        is_external: false,
        is_public: false,
        created: Math.floor(Date.now() / 1000),
        timestamp: Math.floor(Date.now() / 1000),
      },
    },
  };

  console.log("📤 Test de l'API users.info...");
  console.log('User ID:', testEvent.event.user);
  console.log('Username fallback:', testEvent.event.file.username);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEvent),
    });

    const result = await response.text();
    console.log('📥 Réponse:', result);

    if (response.ok) {
      console.log('✅ Requête envoyée avec succès');
    } else {
      console.log('❌ Erreur:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('\n💡 Ce test va :');
  console.log("1. Appeler l'Edge Function avec un événement file_shared");
  console.log("2. L'Edge Function va tenter d'appeler l'API Slack users.info");
  console.log("3. Si l'API échoue, elle utilisera le username de fallback");
  console.log('4. Le fichier ne sera pas téléchargé (normal pour un test)');
  console.log('\n🔧 Pour un test complet :');
  console.log('- Remplacez U09DEU6GRDK par un vrai User ID de votre workspace');
  console.log('- Partagez un vrai fichier dans le channel C09DEU6GRDK');
}

testSlackUsersInfo().catch(console.error);
