#!/usr/bin/env node

/**
 * Script pour vérifier la configuration du webhook Slack
 * Usage: node scripts/check-slack-webhook-config.js
 */

console.log('🔍 Vérification de la configuration webhook Slack...\n');

async function checkSlackWebhookConfig() {
  const config = {
    supabaseUrl: 'https://zcyalwewcdgbftaaneet.supabase.co',
    functionName: 'slack-webhook',
  };

  console.log('📋 Configuration attendue :');
  console.log(
    `✅ URL du webhook : ${config.supabaseUrl}/functions/v1/${config.functionName}`
  );
  console.log(
    '✅ Événements : file_shared, member_joined_channel, app_mention'
  );
  console.log('✅ Bot Token : Configuré dans Supabase secrets');
  console.log('');

  // Test 1: URL Verification (test standard Slack)
  console.log('1️⃣ Test URL Verification (standard Slack) :');
  try {
    const response = await fetch(
      `${config.supabaseUrl}/functions/v1/${config.functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'url_verification',
          challenge: 'test_challenge_123',
        }),
      }
    );

    const result = await response.text();
    console.log('✅ URL Verification:', result);

    if (result === 'test_challenge_123') {
      console.log('✅ Webhook URL correctement configuré !');
    } else {
      console.log('❌ Webhook URL mal configuré');
    }
  } catch (error) {
    console.log('❌ URL Verification failed:', error.message);
  }

  // Test 2: Vérifier que l'Edge Function est accessible
  console.log("\n2️⃣ Test d'accessibilité de l'Edge Function :");
  try {
    const response = await fetch(
      `${config.supabaseUrl}/functions/v1/${config.functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: 'ping',
        }),
      }
    );

    const result = await response.text();
    console.log('✅ Edge Function accessible:', result);
  } catch (error) {
    console.log('❌ Edge Function non accessible:', error.message);
  }

  console.log('\n📋 Actions à vérifier sur api.slack.com :');
  console.log('1. Allez dans votre app Slack sur api.slack.com');
  console.log('2. Cliquez sur "Event Subscriptions"');
  console.log("3. Vérifiez que l'URL du webhook est :");
  console.log(`   ${config.supabaseUrl}/functions/v1/${config.functionName}`);
  console.log('4. Vérifiez que les événements sont activés :');
  console.log('   - file_shared');
  console.log('   - member_joined_channel');
  console.log('   - app_mention');
  console.log('5. Vérifiez que le bot a les bonnes permissions :');
  console.log('   - files:read');
  console.log('   - channels:read');
  console.log('   - chat:write');

  console.log('\n🔧 Si le webhook pointe vers localhost :');
  console.log("1. Mettez à jour l'URL sur api.slack.com");
  console.log('2. Sauvegardez la configuration');
  console.log('3. Testez avec un fichier partagé');
}

checkSlackWebhookConfig().catch(console.error);
