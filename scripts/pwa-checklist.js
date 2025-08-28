#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function checkFileExists(path, description) {
  const exists = existsSync(path);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${exists ? 'Found' : 'Missing'}`);
  return exists;
}

function checkManifest() {
  console.log('\n📋 Checking Manifest...');
  
  const manifestPath = 'public/manifest.webmanifest';
  if (!checkFileExists(manifestPath, 'Manifest file')) return false;
  
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    
    const requiredFields = ['name', 'short_name', 'start_url', 'scope', 'display', 'theme_color', 'background_color'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    console.log('✅ All required fields present');
    
    // Check icons
    if (!manifest.icons || manifest.icons.length === 0) {
      console.log('❌ No icons defined');
      return false;
    }
    
    const has192 = manifest.icons.some(icon => icon.sizes === '192x192');
    const has512 = manifest.icons.some(icon => icon.sizes === '512x512');
    const hasMaskable = manifest.icons.some(icon => icon.purpose && icon.purpose.includes('maskable'));
    
    console.log(`${has192 ? '✅' : '❌'} 192x192 icon: ${has192 ? 'Present' : 'Missing'}`);
    console.log(`${has512 ? '✅' : '❌'} 512x512 icon: ${has512 ? 'Present' : 'Missing'}`);
    console.log(`${hasMaskable ? '✅' : '❌'} Maskable icon: ${hasMaskable ? 'Present' : 'Missing'}`);
    
    return has192 && has512 && hasMaskable;
  } catch (error) {
    console.log(`❌ Invalid JSON in manifest: ${error.message}`);
    return false;
  }
}

function checkServiceWorker() {
  console.log('\n🔧 Checking Service Worker...');
  
  const swPath = 'public/service-worker.js';
  if (!checkFileExists(swPath, 'Service Worker file')) return false;
  
  try {
    const swContent = readFileSync(swPath, 'utf8');
    
    // Check for version management
    const hasVersion = swContent.includes('VERSION') || swContent.includes('version');
    console.log(`${hasVersion ? '✅' : '❌'} Version management: ${hasVersion ? 'Present' : 'Missing'}`);
    
    // Check for cache strategies
    const hasCacheStrategy = swContent.includes('cache') || swContent.includes('Cache');
    console.log(`${hasCacheStrategy ? '✅' : '❌'} Cache strategy: ${hasCacheStrategy ? 'Present' : 'Missing'}`);
    
    // Check for offline support
    const hasOffline = swContent.includes('offline') || swContent.includes('Offline');
    console.log(`${hasOffline ? '✅' : '❌'} Offline support: ${hasOffline ? 'Present' : 'Missing'}`);
    
    return hasVersion && hasCacheStrategy && hasOffline;
  } catch (error) {
    console.log(`❌ Error reading service worker: ${error.message}`);
    return false;
  }
}

function checkIcons() {
  console.log('\n🖼️  Checking Icons...');
  
  const iconDir = 'public/icons';
  if (!checkFileExists(iconDir, 'Icons directory')) return false;
  
  const requiredIcons = [
    'icon-192x192.png',
    'icon-512x512.png',
    'icon-maskable-192x192.png',
    'icon-maskable-512x512.png'
  ];
  
  let allPresent = true;
  requiredIcons.forEach(icon => {
    const iconPath = join(iconDir, icon);
    const exists = existsSync(iconPath);
    console.log(`${exists ? '✅' : '❌'} ${icon}: ${exists ? 'Present' : 'Missing'}`);
    if (!exists) allPresent = false;
  });
  
  return allPresent;
}

function checkIndexHTML() {
  console.log('\n📄 Checking index.html...');
  
  const indexPath = 'index.html';
  if (!checkFileExists(indexPath, 'index.html file')) return false;
  
  try {
    const htmlContent = readFileSync(indexPath, 'utf8');
    
    // Check for manifest link
    const hasManifest = htmlContent.includes('rel="manifest"');
    console.log(`${hasManifest ? '✅' : '❌'} Manifest link: ${hasManifest ? 'Present' : 'Missing'}`);
    
    // Check for service worker registration
    const hasSWRegistration = htmlContent.includes('serviceWorker') || htmlContent.includes('service-worker');
    console.log(`${hasSWRegistration ? '✅' : '❌'} Service Worker registration: ${hasSWRegistration ? 'Present' : 'Missing'}`);
    
    // Check for PWA meta tags
    const hasPWA = htmlContent.includes('apple-mobile-web-app-capable') || htmlContent.includes('theme-color');
    console.log(`${hasPWA ? '✅' : '❌'} PWA meta tags: ${hasPWA ? 'Present' : 'Missing'}`);
    
    return hasManifest && hasSWRegistration && hasPWA;
  } catch (error) {
    console.log(`❌ Error reading index.html: ${error.message}`);
    return false;
  }
}

function checkPackageJSON() {
  console.log('\n📦 Checking package.json...');
  
  const packagePath = 'package.json';
  if (!checkFileExists(packagePath, 'package.json file')) return false;
  
  try {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    
    // Check for PWA-related scripts
    const scripts = packageJson.scripts || {};
    const hasPWAScripts = scripts['pwa:test'] || scripts['pwa:generate-icons'];
    console.log(`${hasPWAScripts ? '✅' : '❌'} PWA scripts: ${hasPWAScripts ? 'Present' : 'Missing'}`);
    
    // Check for build script
    const hasBuild = scripts.build;
    console.log(`${hasBuild ? '✅' : '❌'} Build script: ${hasBuild ? 'Present' : 'Missing'}`);
    
    return hasPWAScripts && hasBuild;
  } catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
    return false;
  }
}

async function runPWAChecklist() {
  console.log('🚀 Memento PWA Checklist\n');
  console.log('This script will check your PWA setup and provide recommendations.\n');
  
  let allChecksPassed = true;
  
  // Run all checks
  const manifestOk = checkManifest();
  const swOk = checkServiceWorker();
  const iconsOk = checkIcons();
  const htmlOk = checkIndexHTML();
  const packageOk = checkPackageJSON();
  
  if (!manifestOk || !swOk || !iconsOk || !htmlOk || !packageOk) {
    allChecksPassed = false;
  }
  
  console.log('\n📊 Summary:');
  console.log(`Manifest: ${manifestOk ? '✅' : '❌'}`);
  console.log(`Service Worker: ${swOk ? '✅' : '❌'}`);
  console.log(`Icons: ${iconsOk ? '✅' : '❌'}`);
  console.log(`index.html: ${htmlOk ? '✅' : '❌'}`);
  console.log(`package.json: ${packageOk ? '✅' : '❌'}`);
  
  if (allChecksPassed) {
    console.log('\n🎉 All basic PWA checks passed!');
    console.log('\nNext steps:');
    console.log('1. Run `npm run pwa:test` for detailed testing');
    console.log('2. Deploy to production and test on real devices');
    console.log('3. Run Lighthouse audit for performance scores');
    console.log('4. Test offline functionality');
  } else {
    console.log('\n⚠️  Some PWA checks failed. Please review the issues above.');
    console.log('\nRecommendations:');
    console.log('1. Fix the missing or incorrect files');
    console.log('2. Run this checklist again');
    console.log('3. See PWA-CHECKLIST.md for detailed guidance');
  }
  
  // Ask if user wants to run additional tests
  const runAdditional = await question('\nWould you like to run additional PWA tests? (y/n): ');
  
  if (runAdditional.toLowerCase() === 'y') {
    console.log('\n🔍 Running additional tests...');
    
    try {
      // Check if dev server is running
      console.log('Checking development server...');
      execSync('curl -s http://localhost:3000 > /dev/null', { stdio: 'pipe' });
      console.log('✅ Development server is running');
      
      // Check if build works
      console.log('Testing build process...');
      execSync('npm run build', { stdio: 'pipe' });
      console.log('✅ Build process works');
      
      console.log('\n🎉 Additional tests completed successfully!');
    } catch (error) {
      console.log('❌ Additional tests failed. Please check your setup.');
    }
  }
  
  rl.close();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

// Run the checklist
runPWAChecklist().catch((error) => {
  console.error('❌ Checklist failed:', error);
  process.exit(1);
});
