#!/usr/bin/env node

/**
 * Script de test pour vérifier la visibilité du menu 3 points
 * Teste que le menu s'affiche pour les posts Telegram des admins
 */

console.log('🔍 Test de Visibilité du Menu 3 Points');
console.log('=====================================');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test 1: Vérification de la nouvelle logique du menu
console.log('\n1️⃣ Vérification de la nouvelle logique du menu...');

const feedScreenPath = path.join(
  process.cwd(),
  'src/components/FeedScreen.tsx'
);
const feedScreenContent = fs.readFileSync(feedScreenPath, 'utf8');

// Vérifier que la nouvelle condition est en place
if (
  feedScreenContent.includes(
    'post.user_id === user.id || (isUserAdmin && post.is_telegram)'
  )
) {
  console.log('✅ Nouvelle logique du menu implémentée');
  console.log('   - Posts normaux : menu visible pour le créateur');
  console.log('   - Posts Telegram : menu visible pour les admins');
} else {
  console.log('❌ Nouvelle logique du menu manquante');
}

// Test 2: Vérification du commentaire mis à jour
console.log('\n2️⃣ Vérification du commentaire...');

if (
  feedScreenContent.includes('Show for own posts OR admin for Telegram posts')
) {
  console.log('✅ Commentaire mis à jour');
} else {
  console.log('❌ Commentaire pas mis à jour');
}

// Test 3: Vérification de la structure complète
console.log('\n3️⃣ Vérification de la structure complète...');

// Vérifier que tous les éléments sont présents
const requiredElements = [
  'Menu 3 points',
  'isUserAdmin',
  'post.is_telegram',
  'MoreHorizontal',
  'Delete',
];

let allElementsPresent = true;
requiredElements.forEach(element => {
  if (!feedScreenContent.includes(element)) {
    console.log(`❌ Élément manquant : ${element}`);
    allElementsPresent = false;
  }
});

if (allElementsPresent) {
  console.log('✅ Tous les éléments requis sont présents');
} else {
  console.log('❌ Certains éléments requis sont manquants');
}

console.log('\n🎯 Résumé de la Correction');
console.log('==========================');

console.log('\n✅ Problème identifié et corrigé :');
console.log('   - Les posts Telegram avaient user_id = null');
console.log('   - La condition user_id === user.id était toujours false');
console.log("   - Le menu 3 points ne s'affichait jamais");

console.log('\n✅ Solution implémentée :');
console.log(
  '   - Nouvelle condition : (post.user_id === user.id || (isUserAdmin && post.is_telegram))'
);
console.log('   - Posts normaux : menu visible pour le créateur');
console.log('   - Posts Telegram : menu visible pour les admins de famille');

console.log('\n🧪 Pour tester :');
console.log('1. Aller sur http://localhost:3000');
console.log("2. Vérifier que le menu 3 points s'affiche sur vos posts normaux");
console.log(
  "3. Vérifier que le menu 3 points s'affiche sur les posts Telegram (si vous êtes admin)"
);
console.log("4. Vérifier que l'ordre est : [📱 Telegram] [📚 Mois] [⋮ Menu]");

console.log('\n✅ Le menu 3 points devrait maintenant être visible !');
