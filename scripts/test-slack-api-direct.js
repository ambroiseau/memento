/**
 * Test direct de l'API Slack users.info
 * Ce script teste l'API Slack directement (nécessite le bot token)
 */

console.log("🧪 Test direct de l'API Slack users.info...\n");

async function testSlackAPIDirect() {
  const userId = 'UEB5RHGGZ'; // Votre User ID Slack

  console.log("📋 Test de l'API Slack users.info :");
  console.log('User ID:', userId);
  console.log('');

  console.log('⚠️  Ce script nécessite le SLACK_BOT_TOKEN');
  console.log("💡 Pour tester l'API Slack directement :");
  console.log('');
  console.log('1. Récupérez le Bot User OAuth Token depuis api.slack.com');
  console.log('2. Utilisez curl ou Postman pour tester :');
  console.log('');
  console.log('curl -X POST https://slack.com/api/users.info \\');
  console.log("  -H 'Authorization: Bearer xoxb-YOUR-BOT-TOKEN' \\");
  console.log("  -H 'Content-Type: application/json' \\");
  console.log('  -d \'{"user":"UEB5RHGGZ"}\'');
  console.log('');
  console.log("3. Vérifiez que le bot a la permission 'users:read'");
  console.log("4. Vérifiez que l'User ID est correct");
  console.log('');
  console.log('🔧 Alternative : Partagez un fichier dans Slack');
  console.log("- L'Edge Function va logger les détails de l'appel API");
  console.log('- Vérifiez les logs sur Supabase Dashboard');
}

testSlackAPIDirect().catch(console.error);
