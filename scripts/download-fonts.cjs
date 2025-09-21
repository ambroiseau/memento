#!/usr/bin/env node

/**
 * Script pour télécharger les polices nécessaires pour Memento
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '..', 'assets', 'fonts');

// Créer le dossier fonts s'il n'existe pas
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// URL de la police Caprasimo depuis Google Fonts
const caprasimoUrl = 'https://fonts.gstatic.com/s/caprasimo/v1/0ybgGDoxxrvZ1o2_sSc8umwQ.ttf';
const caprasimoPath = path.join(fontsDir, 'Caprasimo-Regular.ttf');

function downloadFont(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download font: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Police téléchargée: ${path.basename(filePath)}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Supprimer le fichier partiel
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log('🎨 Téléchargement des polices pour Memento...');
    
    // Vérifier si la police existe déjà
    if (fs.existsSync(caprasimoPath)) {
      console.log('ℹ️  La police Caprasimo existe déjà');
    } else {
      await downloadFont(caprasimoUrl, caprasimoPath);
    }
    
    console.log('✨ Toutes les polices sont prêtes !');
    console.log(`📁 Dossier: ${fontsDir}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { downloadFont };
