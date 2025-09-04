#!/usr/bin/env node

/**
 * Script pour corriger le service PDF Railway
 * Usage: node scripts/fix-pdf-service.js
 */

const { execSync } = require('child_process');

console.log('🔧 Correction du service PDF Railway...\n');

try {
  // 1. Vérifier le statut Railway
  console.log('1. 📊 Vérification du statut Railway...');
  execSync('railway status', { stdio: 'inherit' });

  // 2. Redéployer le service
  console.log('\n2. 🚀 Redéploiement du service PDF...');
  execSync('railway up', { stdio: 'inherit' });

  // 3. Attendre un peu pour que le service démarre
  console.log('\n3. ⏳ Attente du démarrage du service...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // 4. Tester le service
  console.log('\n4. 🧪 Test du service...');
  const testUrl = 'https://memento-production-5f3d.up.railway.app/health';

  try {
    const response = await fetch(testUrl);
    const data = await response.json();
    console.log('✅ Service opérationnel:', data);
  } catch (error) {
    console.log('❌ Erreur de test:', error.message);
  }

  console.log('\n✅ Correction terminée !');
} catch (error) {
  console.error('❌ Erreur lors de la correction:', error.message);
  process.exit(1);
}
