#!/usr/bin/env node

/**
 * Script de déploiement pour l'Edge Function Slack
 *
 * Ce script fournit les instructions pour déployer la fonction Slack
 * et configurer le webhook dans Slack.
 */

console.log("🚀 Déploiement de l'Edge Function Slack");
console.log('=====================================\n');

console.log('📋 Étapes de déploiement :\n');

console.log("1️⃣ Déployer l'Edge Function :");
console.log('   supabase functions deploy slack-webhook --no-verify-jwt\n');

console.log('2️⃣ Configurer les secrets :');
console.log('   supabase secrets set SLACK_BOT_TOKEN=xoxb-your-bot-token');
console.log(
  '   supabase secrets set SUPABASE_URL=https://your-project.supabase.co'
);
console.log(
  '   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n'
);

console.log('3️⃣ Configurer le webhook Slack :');
console.log('   - Aller sur https://api.slack.com/apps');
console.log('   - Sélectionner votre app');
console.log('   - Aller dans "Event Subscriptions"');
console.log('   - Activer les événements');
console.log(
  '   - URL du webhook : https://your-project.functions.supabase.co/slack-webhook'
);
console.log('   - Événements à écouter :');
console.log('     • file_shared');
console.log(
  '     • message.channels (si vous voulez les messages avec fichiers)'
);
console.log('   - Sauvegarder les changements\n');

console.log('4️⃣ Tester la configuration :');
console.log('   - Partager un fichier dans le channel configuré');
console.log('   - Vérifier les logs : supabase functions logs slack-webhook\n');

console.log("🔧 Configuration dans l'app :");
console.log(
  '   - Les utilisateurs peuvent maintenant configurer Slack dans les paramètres'
);
console.log('   - Ils doivent fournir le Channel ID (ex: C1234567890)');
console.log('   - Le bot token est géré centralement\n');

console.log('✅ Déploiement terminé !');
console.log(
  "   L'intégration Slack est maintenant prête à recevoir des fichiers."
);

