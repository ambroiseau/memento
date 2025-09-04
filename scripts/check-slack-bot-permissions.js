/**
 * Vérification des permissions du bot Slack
 * Ce script teste si le bot a les bonnes permissions
 */

console.log('🔍 Vérification des permissions du bot Slack...\n');

async function checkSlackBotPermissions() {
  const webhookUrl =
    'https://zcyalwewcdgbftaaneet.supabase.co/functions/v1/slack-webhook';

  console.log('📋 Permissions requises pour le bot Slack :');
  console.log('✅ files:read - Pour télécharger les fichiers');
  console.log('✅ channels:read - Pour accéder aux informations du channel');
  console.log('✅ users:read - Pour récupérer les infos utilisateur (NOUVEAU)');
  console.log('✅ chat:write - Pour répondre aux mentions');
  console.log('');

  // Test 1: URL Verification (vérifie que l'Edge Function est accessible)
  console.log("1️⃣ Test de l'Edge Function :");
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
    console.log(
      '✅ Edge Function accessible:',
      result === 'test_challenge_123' ? 'OUI' : 'NON'
    );
  } catch (error) {
    console.log('❌ Edge Function non accessible:', error.message);
  }

  // Test 2: Test de connexion avec un Channel ID factice
  console.log('\n2️⃣ Test de connexion (Channel ID factice) :');
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'test_connection',
        channel_id: 'C1234567890', // Channel ID factice
      }),
    });

    const result = await response.json();
    console.log('📥 Réponse:', result);

    if (result.success) {
      console.log('✅ Test de connexion réussi');
    } else {
      console.log('❌ Test de connexion échoué:', result.error);
    }
  } catch (error) {
    console.log('❌ Erreur test de connexion:', error.message);
  }

  console.log('\n📋 Actions à effectuer sur api.slack.com :');
  console.log('1. Allez sur https://api.slack.com/apps');
  console.log('2. Sélectionnez votre app Memento');
  console.log("3. Cliquez sur 'OAuth & Permissions'");
  console.log("4. Dans 'Scopes > Bot Token Scopes', vérifiez :");
  console.log('   - files:read');
  console.log('   - channels:read');
  console.log("   - users:read ← IMPORTANT pour les noms d'utilisateurs");
  console.log('   - chat:write');
  console.log("5. Si 'users:read' manque, ajoutez-le et réinstallez l'app");
  console.log("6. Vérifiez que l'URL du webhook est correcte :");
  console.log(
    '   https://zcyalwewcdgbftaaneet.supabase.co/functions/v1/slack-webhook'
  );

  console.log('\n🧪 Pour tester avec un vrai utilisateur :');
  console.log('1. Partagez un fichier dans le channel C09DEU6GRDK');
  console.log('2. Ou utilisez un vrai User ID dans les scripts de test');
  console.log("3. Vérifiez que le nom s'affiche correctement dans l'app");
}

checkSlackBotPermissions().catch(console.error);
