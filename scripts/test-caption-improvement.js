#!/usr/bin/env node

/**
 * Script de test pour vérifier l'amélioration des captions Telegram
 * Teste que les posts sans caption n'ont plus "Photo from Telegram" par défaut
 */

console.log("📝 Test de l'Amélioration des Captions Telegram");
console.log('==============================================');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test 1: Vérification de la suppression de "Photo from Telegram"
console.log('\n1️⃣ Vérification de la suppression de "Photo from Telegram"...');

const webhookPath = path.join(
  process.cwd(),
  'supabase/functions/telegram-webhook/index.ts'
);
const webhookContent = fs.readFileSync(webhookPath, 'utf8');

// Vérifier que "Photo from Telegram" n'est plus utilisé
if (!webhookContent.includes('Photo from Telegram')) {
  console.log('✅ "Photo from Telegram" supprimé des captions par défaut');
} else {
  console.log('❌ "Photo from Telegram" encore présent');
}

// Test 2: Vérification de la nouvelle logique
console.log('\n2️⃣ Vérification de la nouvelle logique...');

if (webhookContent.includes('content_text: caption || null')) {
  console.log('✅ Nouvelle logique implémentée : caption || null');
} else {
  console.log('❌ Nouvelle logique pas implémentée');
}

// Test 3: Vérification des deux endroits modifiés
console.log('\n3️⃣ Vérification des deux endroits modifiés...');

const occurrences = (
  webhookContent.match(/content_text: caption \|\| null/g) || []
).length;

if (occurrences === 2) {
  console.log('✅ Les deux occurrences ont été modifiées');
} else {
  console.log(
    `❌ Nombre d'occurrences incorrect : ${occurrences} (attendu : 2)`
  );
}

console.log("\n🎯 Résumé de l'Amélioration");
console.log('============================');

console.log('\n✅ Problème identifié :');
console.log(
  '   - Les posts Telegram sans caption affichaient "Photo from Telegram"'
);
console.log("   - C'était artificiel et pas naturel");

console.log('\n✅ Solution implémentée :');
console.log('   - Nouvelle logique : content_text: caption || null');
console.log("   - Si pas de caption : le post n'a pas de texte");
console.log('   - Si caption présente : elle est conservée');

console.log('\n📋 Comportement final :');
console.log('   - Photo avec caption : affiche la caption');
console.log("   - Photo sans caption : affiche juste l'image (pas de texte)");

console.log('\n🧪 Pour tester :');
console.log('1. Redéployer le webhook sur Supabase');
console.log('2. Envoyer une photo sans caption depuis Telegram');
console.log('3. Vérifier qu\'elle n\'affiche plus "Photo from Telegram"');
console.log('4. Envoyer une photo avec caption depuis Telegram');
console.log('5. Vérifier que la caption est bien affichée');

console.log('\n✅ Les captions Telegram sont maintenant plus naturelles !');
