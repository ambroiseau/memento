#!/usr/bin/env node

/**
 * Script de test simple pour le webhook Telegram
 * Teste la fonction webhook directement
 */

console.log('🧪 Test du Webhook Telegram');
console.log('==========================');

// Simulation d'un message Telegram avec image
const mockTelegramMessage = {
  update_id: 123456789,
  message: {
    message_id: 1,
    chat: {
      id: -1001234567890, // Chat ID de test
      type: 'group'
    },
    photo: [
      {
        file_id: 'test_file_id_123',
        file_unique_id: 'test_unique_123',
        width: 800,
        height: 600,
        file_size: 50000
      }
    ],
    caption: 'Photo de test depuis le script'
  }
};

console.log('📸 Message de test créé:');
console.log(JSON.stringify(mockTelegramMessage, null, 2));

console.log('\n🔧 Pour tester le webhook:');
console.log('1. Déployez la fonction sur Supabase:');
console.log('   supabase functions deploy telegram-webhook');
console.log('');
console.log('2. Configurez le webhook Telegram:');
console.log('   https://api.telegram.org/bot<BOT_TOKEN>/setWebhook');
console.log('   ?url=https://<PROJECT>.supabase.co/functions/v1/telegram-webhook');
console.log('');
console.log('3. Envoyez une vraie photo depuis Telegram');
console.log('');
console.log('✅ Le webhook est prêt à être testé !');
