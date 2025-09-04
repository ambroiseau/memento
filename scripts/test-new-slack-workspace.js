/**
 * Test pour diagnostiquer le problème avec le nouvel espace Slack
 */

console.log('🔍 Diagnostic du nouvel espace Slack...\n');

async function testNewSlackWorkspace() {
  const webhookUrl =
    'https://zcyalwewcdgbftaaneet.supabase.co/functions/v1/slack-webhook';

  console.log('📋 Vérifications à faire :');
  console.log('1. Le webhook est-il configuré dans le nouvel espace ?');
  console.log('2. Les événements file_shared sont-ils activés ?');
  console.log('3. Le bot a-t-il les permissions files:read ?');
  console.log("4. Une source Slack est-elle configurée dans l'app ?");
  console.log('');

  // Test 1: URL Verification
  console.log('1️⃣ Test URL Verification :');
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'url_verification',
        challenge: 'test_challenge_123',
      }),
    });

    const result = await response.text();
    console.log('✅ URL Verification:', result);
  } catch (error) {
    console.log('❌ URL Verification failed:', error.message);
  }

  console.log('\n📋 Actions à effectuer :');
  console.log('1. Sur api.slack.com → Event Subscriptions');
  console.log(
    '   - URL: https://zcyalwewcdgbftaaneet.supabase.co/functions/v1/slack-webhook'
  );
  console.log(
    '   - Événements: file_shared, member_joined_channel, app_mention'
  );
  console.log('');
  console.log('2. Sur api.slack.com → OAuth & Permissions');
  console.log('   - Scopes: files:read, channels:read, users:read, chat:write');
  console.log('');
  console.log("3. Dans l'app Memento → Paramètres");
  console.log(
    '   - Ajouter une source Slack avec le Channel ID du nouvel espace'
  );
  console.log('   - Tester la connexion');
  console.log('');
  console.log('4. Partager un fichier dans le channel');
  console.log("   - Vérifier que l'événement file_shared est envoyé");
  console.log("   - Vérifier les logs de l'Edge Function");
}

testNewSlackWorkspace().catch(console.error);
