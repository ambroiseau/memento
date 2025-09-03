#!/usr/bin/env node

/**
 * Script pour corriger automatiquement les imports cassés dans les composants UI
 * Supprime les versions spécifiques des imports qui causent des erreurs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_DIR = path.join(__dirname, '../src/components/ui');

// Patterns d'imports à corriger
const IMPORT_PATTERNS = [
  // class-variance-authority
  {
    pattern: /from\s+["']class-variance-authority@[^"']+["']/g,
    replacement: 'from "class-variance-authority"'
  },
  // lucide-react
  {
    pattern: /from\s+["']lucide-react@[^"']+["']/g,
    replacement: 'from "lucide-react"'
  },
  // @radix-ui packages
  {
    pattern: /from\s+["']@radix-ui\/[^"']+@[^"']+["']/g,
    replacement: (match) => {
      const packageName = match.match(/@radix-ui\/[^@]+/)[0];
      return `from "${packageName}"`;
    }
  },
  // Autres packages avec versions
  {
    pattern: /from\s+["']([^"']+)@[0-9]+\.[0-9]+\.[0-9]+["']/g,
    replacement: 'from "$1"'
  }
];

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Appliquer tous les patterns de correction
    IMPORT_PATTERNS.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });

    // Écrire le fichier si des changements ont été faits
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function fixAllUIComponents() {
  console.log('🔧 Fixing UI component imports...\n');

  try {
    const files = fs.readdirSync(UI_DIR);
    let fixedCount = 0;

    files.forEach(file => {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const filePath = path.join(UI_DIR, file);
        if (fixImportsInFile(filePath)) {
          fixedCount++;
        }
      }
    });

    console.log(`\n🎉 Fixed ${fixedCount} files!`);
    
    if (fixedCount > 0) {
      console.log('\n📋 Next steps:');
      console.log('1. Restart the dev server: npm run dev');
      console.log('2. Check that the app loads without import errors');
      console.log('3. Test the Telegram integration in settings');
    } else {
      console.log('\n✨ No files needed fixing!');
    }

  } catch (error) {
    console.error('❌ Error reading UI directory:', error.message);
  }
}

// Exécuter le script
fixAllUIComponents();
