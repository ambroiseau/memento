#!/usr/bin/env node

/**
 * Script de diagnostic de l'intégration Slack
 * Usage: node scripts/diagnose-slack.js
 */

import https from 'https';

console.log('🔍 Diagnostic de l\'intégration Slack...\n');

async function testSlackIntegration() {
  const config = {
    supabaseUrl: 'https://zcyalwewcdgbftaaneet.supabase.co',
    functionName: 'slack-webhook',
  };

  console.log('📋 Tests à effectuer :\n');

  // Test 1: URL Verification
  console.log('1️⃣ Test de l\'URL du webhook :');
  try {
    const response = await fetch(`${config.supabaseUrl}/functions/v1/${config.functionName}`, {
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

  // Test 2: Test Connection (avec un Channel ID factice)
  console.log('\n2️⃣ Test de connexion (Channel ID factice) :');
  try {
    const response = await fetch(`${config.supabaseUrl}/functions/v1/${config.functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'test_connection',
        channel_id: 'C1234567890',
      }),
    });

    const result = await response.json();
    console.log('✅ Test Connection:', result);
  } catch (error) {
    console.log('❌ Test Connection failed:', error.message);
  }

  // Test 3: Health Check
  console.log('\n3️⃣ Test de santé de l\'Edge Function :');
  try {
    const response = await fetch(`${config.supabaseUrl}/functions/v1/${config.functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: 'ping',
      }),
    });

    const result = await response.text();
    console.log('✅ Health Check:', result);
  } catch (error) {
    console.log('❌ Health Check failed:', error.message);
  }

  console.log('\n📋 Checklist de configuration :');
  console.log('- [ ] App Slack créée sur api.slack.com');
  console.log('- [ ] Webhook configuré avec l\'URL correcte');
  console.log('- [ ] Événements file_shared activés');
  console.log('- [ ] Bot User OAuth Token récupéré');
  console.log('- [ ] Secret SLACK_BOT_TOKEN configuré dans Supabase');
  console.log('- [ ] Channel ID récupéré et configuré dans l\'app');
  console.log('- [ ] Test de connexion réussi');
  console.log('- [ ] Test avec un fichier partagé');

  console.log('\n🔧 Pour corriger les problèmes :');
  console.log('1. Vérifiez la configuration Slack sur api.slack.com');
  console.log('2. Vérifiez les secrets Supabase : supabase secrets list');
  console.log('3. Testez avec un vrai Channel ID dans l\'app');
  console.log('4. Partagez un fichier dans le channel Slack configuré');
}

testSlackIntegration().catch(console.error);
