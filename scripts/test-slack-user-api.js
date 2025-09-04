#!/usr/bin/env node

/**
 * Script pour tester directement l'API Slack users.info
 * Usage: node scripts/test-slack-user-api.js
 */

console.log("🧪 Test direct de l'API Slack users.info...\n");

async function testSlackUserAPI() {
  // Utiliser le bot token depuis les secrets Supabase
  const botToken = process.env.SLACK_BOT_TOKEN;

  if (!botToken) {
    console.log(
      "❌ SLACK_BOT_TOKEN non configuré dans les variables d'environnement"
    );
    console.log('💡 Ce script doit être exécuté avec les secrets Supabase');
    return;
  }

  // Test avec un ID utilisateur réaliste (remplacez par un vrai ID de votre workspace)
  const testUserId = 'U1234567890'; // ID utilisateur de test

  try {
    console.log("📤 Test de l'API Slack users.info...");
    console.log('User ID:', testUserId);
    console.log('Bot Token:', botToken.substring(0, 10) + '...');

    const response = await fetch('https://slack.com/api/users.info', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: testUserId,
      }),
    });

    const result = await response.json();
    console.log('📥 Réponse Slack API:', JSON.stringify(result, null, 2));

    if (result.ok) {
      console.log('✅ API Slack accessible');
      console.log('User info:', {
        real_name: result.user.real_name,
        display_name: result.user.profile?.display_name,
        name: result.user.name,
        email: result.user.profile?.email,
      });
    } else {
      console.log('❌ Erreur API Slack:', result.error);
      console.log('💡 Vérifiez que le bot a les permissions users:read');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('\n📋 Pour tester avec un vrai utilisateur :');
  console.log('1. Récupérez un vrai User ID depuis votre workspace Slack');
  console.log('2. Remplacez U1234567890 par ce vrai ID');
  console.log('3. Relancez le script');
  console.log('');
  console.log('🔍 Comment récupérer un User ID :');
  console.log('- Allez dans Slack');
  console.log('- Clic droit sur un utilisateur → "Copy member ID"');
  console.log("- Ou utilisez l'URL du profil utilisateur");
}

testSlackUserAPI().catch(console.error);
