#!/usr/bin/env node

/**
 * Script de test pour vérifier les améliorations du FeedScreen
 * Teste les modifications apportées à l'affichage des posts
 */

console.log('🧪 Test des Améliorations du FeedScreen');
console.log('=====================================');

// Test 1: Vérification des modifications du composant
console.log('\n1️⃣ Vérification des modifications du composant FeedScreen...');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const feedScreenPath = path.join(
  process.cwd(),
  'src/components/FeedScreen.tsx'
);
const feedScreenContent = fs.readFileSync(feedScreenPath, 'utf8');

// Vérifier que font-medium est ajouté
if (feedScreenContent.includes('font-medium')) {
  console.log("✅ font-medium ajouté au nom de l'utilisateur");
} else {
  console.log('❌ font-medium manquant');
}

// Vérifier que le tag du mois est dynamique
if (
  feedScreenContent.includes('toLocaleDateString') &&
  feedScreenContent.includes("month: 'long'")
) {
  console.log('✅ Tag du mois dynamique implémenté');
} else {
  console.log('❌ Tag du mois encore en dur');
}

// Vérifier que le tag Telegram est à côté du mois
if (
  feedScreenContent.includes('{/* Telegram tag */}') &&
  feedScreenContent.includes('post.is_telegram')
) {
  console.log('✅ Tag Telegram déplacé à côté du mois');
} else {
  console.log('❌ Tag Telegram pas trouvé à côté du mois');
}

// Test 2: Vérification des modifications du webhook
console.log('\n2️⃣ Vérification des modifications du webhook Telegram...');

const webhookPath = path.join(
  process.cwd(),
  'supabase/functions/telegram-webhook/index.ts'
);
const webhookContent = fs.readFileSync(webhookPath, 'utf8');

// Vérifier que les informations de l'expéditeur sont extraites
if (
  webhookContent.includes('sender_name') &&
  webhookContent.includes('sender_username')
) {
  console.log("✅ Extraction des informations de l'expéditeur implémentée");
} else {
  console.log("❌ Extraction des informations de l'expéditeur manquante");
}

// Test 3: Vérification de l'API
console.log("\n3️⃣ Vérification de l'API...");

const apiPath = path.join(process.cwd(), 'src/utils/supabase-api.tsx');
const apiContent = fs.readFileSync(apiPath, 'utf8');

// Vérifier que l'API utilise sender_name
if (apiContent.includes('metadata.sender_name')) {
  console.log('✅ API utilise sender_name pour les posts Telegram');
} else {
  console.log("❌ API n'utilise pas sender_name");
}

console.log('\n🎯 Résumé des Tests');
console.log('==================');

console.log('\n📋 Modifications à tester manuellement :');
console.log("1. Démarrer l'app : npm run dev");
console.log('2. Aller sur http://localhost:3000');
console.log("3. Vérifier que les noms d'utilisateurs sont en font-medium");
console.log(
  '4. Vérifier que les tags du mois sont corrects (pas "August" en dur)'
);
console.log('5. Vérifier que les tags Telegram sont à côté du mois');

console.log('\n⚠️  Note importante :');
console.log(
  'Les modifications du webhook nécessitent un redéploiement sur Supabase'
);
console.log(
  'pour que les vrais noms des utilisateurs Telegram soient affichés.'
);

console.log('\n✅ Tests de code terminés !');
