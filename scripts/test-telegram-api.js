#!/usr/bin/env node

/**
 * Script de test pour l'API Telegram
 * Usage: node scripts/test-telegram-api.js <bot_token> <chat_id>
 */

import { externalDataApi } from '../src/utils/external-data-api.js';

async function testTelegramAPI() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('❌ Usage: node scripts/test-telegram-api.js <bot_token> <chat_id>');
    console.log('Example: node scripts/test-telegram-api.js 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz -1001234567890');
    process.exit(1);
  }

  const [botToken, chatId] = args;
  
  console.log('🧪 Test de l\'API Telegram');
  console.log('========================');
  console.log(`Bot Token: ${botToken.substring(0, 10)}...`);
  console.log(`Chat ID: ${chatId}`);
  console.log('');

  try {
    // Test 1: Validation du token du bot
    console.log('1️⃣ Test de validation du token du bot...');
    const botValid = await externalDataApi.validateTelegramBotToken(botToken);
    
    if (botValid) {
      console.log('✅ Token du bot valide');
    } else {
      console.log('❌ Token du bot invalide');
      process.exit(1);
    }

    // Test 2: Informations du chat
    console.log('\n2️⃣ Test d\'accès au chat...');
    const chatInfo = await externalDataApi.getTelegramChatInfo(botToken, chatId);
    
    if (chatInfo.success) {
      console.log('✅ Accès au chat réussi');
      console.log(`   Type: ${chatInfo.data.type}`);
      console.log(`   Titre: ${chatInfo.data.title || chatInfo.data.first_name || 'N/A'}`);
      console.log(`   Username: ${chatInfo.data.username || 'N/A'}`);
    } else {
      console.log(`❌ Impossible d'accéder au chat: ${chatInfo.error}`);
      process.exit(1);
    }

    // Test 3: Test de connexion complet
    console.log('\n3️⃣ Test de connexion complet...');
    const connectionTest = await externalDataApi.testTelegramConnection(botToken, chatId);
    
    if (connectionTest.success) {
      console.log('✅ Test de connexion réussi !');
    } else {
      console.log(`❌ Test de connexion échoué: ${connectionTest.error}`);
      process.exit(1);
    }

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('La configuration Telegram est prête à être utilisée.');

  } catch (error) {
    console.error('\n💥 Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesse rejetée non gérée:', reason);
  process.exit(1);
});

// Exécuter les tests
testTelegramAPI();
