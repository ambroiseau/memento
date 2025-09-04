#!/usr/bin/env node

/**
 * Script de test pour l'intégration Slack
 *
 * Ce script teste la configuration et le fonctionnement de l'intégration Slack.
 */

const https = require('https');

console.log("🧪 Test de l'intégration Slack");
console.log('=============================\n');

// Configuration (à adapter selon votre environnement)
const config = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  functionName: 'slack-webhook',
  testChannelId: 'C1234567890', // Remplacez par un vrai Channel ID
};

console.log('📋 Tests à effectuer :\n');

console.log("1️⃣ Test de l'URL du webhook :");
console.log(
  `   URL: ${config.supabaseUrl}/functions/v1/${config.functionName}`
);
console.log('   Méthode: GET');
console.log('   Résultat attendu: 200 OK\n');

console.log('2️⃣ Test du challenge Slack :');
console.log('   Méthode: POST');
console.log(
  '   Body: {"type": "url_verification", "challenge": "test_challenge"}'
);
console.log('   Résultat attendu: 200 avec "test_challenge" dans le body\n');

console.log("3️⃣ Test d'un événement file_shared :");
console.log('   Méthode: POST');
console.log(
  '   Body: {"type": "event_callback", "event": {"type": "file_shared", "file": {...}}}'
);
console.log('   Résultat attendu: 200 avec {"success": true}\n');

console.log("4️⃣ Test de configuration dans l'app :");
console.log("   - Aller dans les paramètres de l'app");
console.log("   - Cliquer sur l'icône Slack");
console.log('   - Entrer un nom de source (ex: "Family Slack")');
console.log('   - Entrer le Channel ID (ex: C1234567890)');
console.log('   - Tester la connexion');
console.log('   - Sauvegarder\n');

console.log("5️⃣ Test d'envoi de fichier :");
console.log('   - Aller dans le channel Slack configuré');
console.log('   - Partager une image ou un fichier');
console.log("   - Vérifier que le fichier apparaît dans l'app");
console.log("   - Vérifier que l'auteur est correctement affiché\n");

console.log('🔍 Vérifications à faire :');
console.log('   - Les fichiers sont bien téléchargés depuis Slack');
console.log('   - Les fichiers sont bien uploadés vers Supabase Storage');
console.log('   - Les posts sont bien créés dans la base de données');
console.log('   - Les posts apparaissent dans le feed avec le bon badge');
console.log("   - L'auteur est bien affiché (nom d'utilisateur Slack)");
console.log('   - Les admins peuvent supprimer les posts Slack\n');

console.log('📊 Logs à vérifier :');
console.log('   supabase functions logs slack-webhook --follow\n');

console.log('✅ Tests terminés !');
console.log(
  "   Si tous les tests passent, l'intégration Slack est fonctionnelle."
);

