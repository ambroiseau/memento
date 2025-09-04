/**
 * Test direct de l'API Slack users.info avec un vrai User ID
 * Ce script simule exactement ce que fait l'Edge Function
 */

console.log("🧪 Test direct de l'API Slack users.info...\n");

async function testSlackUserInfoDirect() {
  const webhookUrl =
    'https://zcyalwewcdgbftaaneet.supabase.co/functions/v1/slack-webhook';
  const realUserId = 'UEB5RHGGZ'; // Vrai User ID Slack

  // Événement réaliste avec le vrai User ID
  const testEvent = {
    type: 'event_callback',
    event: {
      type: 'file_shared',
      channel: 'C09DEU6GRDK', // Votre channel ID
      user: realUserId,
      file: {
        id: 'F1234567890',
        name: 'test-photo.jpg',
        user: realUserId,
        username: 'fallback.username', // Username de fallback
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

  console.log('📤 Test avec le vrai User ID Slack :');
  console.log('User ID:', realUserId);
  console.log('Channel ID:', testEvent.event.channel);
  console.log('Username fallback:', testEvent.event.file.username);
  console.log('');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEvent),
    });

    const result = await response.text();
    console.log("📥 Réponse de l'Edge Function :");
    console.log(result);
    console.log('');

    if (response.ok) {
      console.log('✅ Événement traité avec succès');
      console.log('');
      console.log('🔍 Analyse :');
      console.log("1. L'Edge Function a reçu l'événement");
      console.log("2. Elle a tenté d'appeler l'API Slack users.info");
      console.log("3. Si l'API fonctionne → Vrai nom dans les logs");
      console.log("4. Si l'API échoue → Username de fallback");
      console.log("5. Le fichier n'est pas téléchargé (normal pour un test)");
    } else {
      console.log('❌ Erreur:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log("\n💡 Pour voir les détails de l'API users.info :");
  console.log("1. Vérifiez les logs de l'Edge Function sur Supabase");
  console.log('2. Ou partagez un vrai fichier dans le channel C09DEU6GRDK');
  console.log("3. L'Edge Function va logger les détails de l'appel API");
}

testSlackUserInfoDirect().catch(console.error);
