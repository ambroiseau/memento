#!/usr/bin/env node

/**
 * Script pour corriger automatiquement les imports utils dans les composants UI
 * Change "./utils" vers "../../lib/utils"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_DIR = path.join(__dirname, '../src/components/ui');

function fixUtilsImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remplacer "./utils" par "../../lib/utils"
    const newContent = content.replace(
      /from\s+["']\.\/utils["']/g,
      'from "../../lib/utils"'
    );
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed utils import: ${path.basename(filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function fixAllUIUtilsImports() {
  console.log('🔧 Fixing UI utils imports...\n');

  try {
    const files = fs.readdirSync(UI_DIR);
    let fixedCount = 0;

    files.forEach(file => {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const filePath = path.join(UI_DIR, file);
        if (fixUtilsImportsInFile(filePath)) {
          fixedCount++;
        }
      }
    });

    console.log(`\n🎉 Fixed ${fixedCount} files!`);
    
    if (fixedCount > 0) {
      console.log('\n📋 Next steps:');
      console.log('1. Restart the dev server: npm run dev');
      console.log('2. Check that the login page loads with inputs');
      console.log('3. Test the Telegram integration in settings');
    } else {
      console.log('\n✨ No files needed fixing!');
    }

  } catch (error) {
    console.error('❌ Error reading UI directory:', error.message);
  }
}

// Exécuter le script
fixAllUIUtilsImports();
