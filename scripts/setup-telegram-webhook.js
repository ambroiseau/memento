#!/usr/bin/env node

/**
 * Script pour configurer automatiquement le webhook Telegram
 * Usage: node scripts/setup-telegram-webhook.js <bot_token> <webhook_url>
 */

import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

async function setupTelegramWebhook() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('❌ Usage: node scripts/setup-telegram-webhook.js <bot_token> <webhook_url>');
    console.log('Example: node scripts/setup-telegram-webhook.js 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz https://your-project.supabase.co/functions/v1/telegram-webhook');
    process.exit(1);
  }

  const [botToken, webhookUrl] = args;
  
  console.log('🔧 Configuration du webhook Telegram');
  console.log('====================================');
  console.log(`Bot Token: ${botToken.substring(0, 10)}...`);
  console.log(`Webhook URL: ${webhookUrl}`);
  console.log('');

  try {
    // Test 1: Vérifier que le bot est valide
    console.log('1️⃣ Vérification du bot...');
    const botInfo = await getBotInfo(botToken);
    console.log(`✅ Bot valide: ${botInfo.first_name} (@${botInfo.username})`);
    console.log(`   ID: ${botInfo.id}`);
    console.log(`   Can join groups: ${botInfo.can_join_groups ? 'Oui' : 'Non'}`);
    console.log(`   Can read all group messages: ${botInfo.can_read_all_group_messages ? 'Oui' : 'Non'}`);

    // Test 2: Obtenir les informations actuelles du webhook
    console.log('\n2️⃣ Vérification du webhook actuel...');
    const currentWebhook = await getWebhookInfo(botToken);
    
    if (currentWebhook.url) {
      console.log(`📡 Webhook actuel: ${currentWebhook.url}`);
      console.log(`   Dernière erreur: ${currentWebhook.last_error_message || 'Aucune'}`);
      console.log(`   Dernière mise à jour: ${new Date(currentWebhook.last_error_date * 1000).toLocaleString('fr-FR')}`);
    } else {
      console.log('📡 Aucun webhook configuré');
    }

    // Test 3: Configurer le nouveau webhook
    console.log('\n3️⃣ Configuration du nouveau webhook...');
    const webhookResult = await setWebhook(botToken, webhookUrl);
    
    if (webhookResult.ok) {
      console.log('✅ Webhook configuré avec succès !');
    } else {
      throw new Error(`Échec de la configuration: ${webhookResult.description}`);
    }

    // Test 4: Vérifier la nouvelle configuration
    console.log('\n4️⃣ Vérification de la nouvelle configuration...');
    const newWebhook = await getWebhookInfo(botToken);
    
    if (newWebhook.url === webhookUrl) {
      console.log('✅ Webhook configuré correctement !');
      console.log(`   URL: ${newWebhook.url}`);
      console.log(`   Statut: ${newWebhook.pending_update_count} mises à jour en attente`);
    } else {
      throw new Error('La configuration du webhook a échoué');
    }

    console.log('\n🎉 Configuration terminée avec succès !');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Envoyez un message avec média dans votre chat Telegram');
    console.log('2. Vérifiez les logs dans Supabase Dashboard > Functions');
    console.log('3. Vérifiez que les médias apparaissent dans votre app Memento');

  } catch (error) {
    console.error('\n💥 Erreur lors de la configuration:', error.message);
    process.exit(1);
  }
}

/**
 * Obtient les informations du bot
 */
async function getBotInfo(botToken) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }

  return data.result;
}

/**
 * Obtient les informations du webhook actuel
 */
async function getWebhookInfo(botToken) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }

  return data.result;
}

/**
 * Configure le webhook
 */
async function setWebhook(botToken, webhookUrl) {
  const webhookData = {
    url: webhookUrl,
    allowed_updates: ['message', 'edited_message', 'channel_post'],
    drop_pending_updates: true,
    max_connections: 40,
  };

  const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(webhookData),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }

  return data;
}

/**
 * Supprime le webhook (fonction utilitaire)
 */
async function deleteWebhook(botToken) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
    const data = await response.json();
    
    if (data.ok) {
      console.log('🗑️ Webhook supprimé');
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du webhook:', error);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesse rejetée non gérée:', reason);
  process.exit(1);
});

// Exécuter la configuration
setupTelegramWebhook();
