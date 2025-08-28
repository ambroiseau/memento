#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bump service worker version
function bumpVersion(currentVersion) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

// Update service worker file
function updateServiceWorker(newVersion) {
  const swPath = path.join(__dirname, '../public/service-worker.js');
  let content = fs.readFileSync(swPath, 'utf8');
  
  // Update version constant
  content = content.replace(
    /const CACHE_VERSION = '([^']+)'/,
    `const CACHE_VERSION = 'static-${newVersion}'`
  );
  
  // Update version comment
  content = content.replace(
    /\/\/ Version: ([^\n]+)/,
    `// Version: ${newVersion}`
  );
  
  fs.writeFileSync(swPath, content);
  console.log(`[SW] Updated service worker to version ${newVersion}`);
}

// Update sw-version.tsx file
function updateSwVersionFile(newVersion) {
  const versionPath = path.join(__dirname, '../src/utils/sw-version.tsx');
  let content = fs.readFileSync(versionPath, 'utf8');
  
  // Update SW_VERSION constant
  content = content.replace(
    /export const SW_VERSION = '([^']+)'/,
    `export const SW_VERSION = '${newVersion}'`
  );
  
  // Update version history
  const today = new Date().toISOString().split('T')[0];
  const versionHistoryMatch = content.match(/export const VERSION_HISTORY = \{([^}]+)\}/);
  
  if (versionHistoryMatch) {
    const historyContent = versionHistoryMatch[1];
    const newHistoryEntry = `\n  '${newVersion}': '${today}'`;
    const updatedHistory = `export const VERSION_HISTORY = {${historyContent}${newHistoryEntry}\n}`;
    
    content = content.replace(/export const VERSION_HISTORY = \{([^}]+)\}/, updatedHistory);
  }
  
  fs.writeFileSync(versionPath, content);
  console.log(`[SW] Updated version file to ${newVersion}`);
}

// Main function
function main() {
  try {
    // Read current version from sw-version.tsx
    const versionPath = path.join(__dirname, '../src/utils/sw-version.tsx');
    const content = fs.readFileSync(versionPath, 'utf8');
    const versionMatch = content.match(/export const SW_VERSION = '([^']+)'/);
    
    if (!versionMatch) {
      throw new Error('Could not find SW_VERSION in sw-version.tsx');
    }
    
    const currentVersion = versionMatch[1];
    const newVersion = bumpVersion(currentVersion);
    
    console.log(`[SW] Bumping version from ${currentVersion} to ${newVersion}`);
    
    // Update files
    updateServiceWorker(newVersion);
    updateSwVersionFile(newVersion);
    
    console.log(`[SW] Version bump completed successfully!`);
    
  } catch (error) {
    console.error('[SW] Version bump failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
