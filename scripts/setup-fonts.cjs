#!/usr/bin/env node

/**
 * Script pour configurer les polices pour Memento
 */

const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '..', 'assets', 'fonts');
const caprasimoPath = path.join(fontsDir, 'Caprasimo-Regular.ttf');

function main() {
  console.log('🎨 Configuration des polices pour Memento\n');
  
  // Créer le dossier fonts s'il n'existe pas
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
    console.log(`✅ Dossier créé: ${fontsDir}`);
  } else {
    console.log(`📁 Dossier existe: ${fontsDir}`);
  }
  
  // Vérifier si la police existe
  if (fs.existsSync(caprasimoPath)) {
    console.log('✅ Police Caprasimo trouvée !');
  } else {
    console.log('❌ Police Caprasimo manquante');
    console.log('\n📥 Pour télécharger la police Caprasimo :');
    console.log('1. Allez sur https://fonts.google.com/specimen/Caprasimo');
    console.log('2. Cliquez sur "Download family"');
    console.log('3. Extrayez le fichier .ttf');
    console.log(`4. Renommez-le en "Caprasimo-Regular.ttf"`);
    console.log(`5. Placez-le dans: ${fontsDir}`);
    console.log('\nOu utilisez cette commande curl :');
    console.log(`curl -o "${caprasimoPath}" "https://github.com/google/fonts/raw/main/ofl/caprasimo/Caprasimo-Regular.ttf"`);
  }
  
  console.log('\n🔧 Configuration terminée !');
  console.log('La police sera utilisée dans les PDFs générés.');
}

if (require.main === module) {
  main();
}
