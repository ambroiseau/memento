// Test simple pour vérifier que la police Caprasimo fonctionne
const fs = require('fs');
const path = require('path');

const fontPath = path.join(
  __dirname,
  'assets',
  'fonts',
  'Caprasimo-Regular.ttf'
);

console.log('🎨 Test de la police Caprasimo');
console.log(`📁 Chemin: ${fontPath}`);
console.log(`📊 Taille: ${fs.statSync(fontPath).size} octets`);
console.log(`✅ Fichier existe: ${fs.existsSync(fontPath)}`);

// Test de lecture du fichier
try {
  const fontBuffer = fs.readFileSync(fontPath);
  console.log(`📖 Lecture réussie: ${fontBuffer.length} octets lus`);
  console.log('✨ La police Caprasimo est prête à être utilisée !');
} catch (error) {
  console.error('❌ Erreur de lecture:', error.message);
}
