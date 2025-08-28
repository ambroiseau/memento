#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
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

function execCommand(command, options = {}) {
  try {
    console.log(`\n🔄 Running: ${command}`);
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return null;
  }
}

function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...\n');
  
  // Check Node.js version
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js: ${nodeVersion}`);
  } catch (error) {
    console.error('❌ Node.js not found. Please install Node.js 16 or higher.');
    return false;
  }
  
  // Check Java
  try {
    const javaVersion = execSync('java -version 2>&1', { encoding: 'utf8' });
    console.log('✅ Java found');
  } catch (error) {
    console.error('❌ Java not found. Please install JDK 11 or higher.');
    return false;
  }
  
  // Check Android SDK (basic check)
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (androidHome) {
    console.log('✅ Android SDK found');
  } else {
    console.warn('⚠️  Android SDK not found. You may need to install Android Studio.');
  }
  
  return true;
}

async function setupTWA() {
  console.log('🚀 Memento TWA Setup\n');
  console.log('This script will help you set up an Android TWA wrapper for your Memento PWA.\n');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    console.log('\n❌ Prerequisites not met. Please install the required tools and try again.');
    process.exit(1);
  }
  
  // Get production URL
  const productionUrl = await question('Enter your production PWA URL (e.g., https://yourdomain.com): ');
  
  if (!productionUrl.startsWith('https://')) {
    console.error('❌ Production URL must use HTTPS');
    process.exit(1);
  }
  
  // Get package ID
  const packageId = await question('Enter your Android package ID (e.g., com.yourdomain.memento): ');
  
  // Install Bubblewrap CLI
  console.log('\n📦 Installing Bubblewrap CLI...');
  execCommand('npm install -g @bubblewrap/cli');
  
  // Initialize TWA project
  console.log('\n🔧 Initializing TWA project...');
  const manifestUrl = `${productionUrl}/manifest.webmanifest`;
  execCommand(`npx @bubblewrap/cli init --manifest=${manifestUrl}`);
  
  // Update twa-manifest.json
  console.log('\n📝 Updating TWA configuration...');
  const twaManifestPath = join(process.cwd(), 'twa-manifest.json');
  
  if (existsSync(twaManifestPath)) {
    const twaManifest = JSON.parse(readFileSync(twaManifestPath, 'utf8'));
    
    // Update with our custom settings
    twaManifest.packageId = packageId;
    twaManifest.host = new URL(productionUrl).hostname;
    twaManifest.name = 'Memento';
    twaManifest.launcherName = 'Memento';
    twaManifest.themeColor = '#0a0a0a';
    twaManifest.navigationColor = '#0a0a0a';
    twaManifest.backgroundColor = '#0a0a0a';
    twaManifest.enableNotifications = true;
    twaManifest.startUrl = '/';
    twaManifest.iconUrl = `${productionUrl}/icons/icon-512x512.png`;
    twaManifest.maskableIconUrl = `${productionUrl}/icons/icon-maskable-512x512.png`;
    twaManifest.monochromeIconUrl = `${productionUrl}/icons/icon-192x192.png`;
    twaManifest.shortcuts = [
      {
        name: 'Create Post',
        shortName: 'New Post',
        url: '/?screen=create-post',
        chosenIconUrl: `${productionUrl}/icons/icon-192x192.png`
      },
      {
        name: 'View Gallery',
        shortName: 'Gallery',
        url: '/?screen=gallery',
        chosenIconUrl: `${productionUrl}/icons/icon-192x192.png`
      }
    ];
    twaManifest.shareTarget = {
      action: '/?share',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
        files: [
          {
            name: 'files',
            accept: ['image/*']
          }
        ]
      }
    };
    
    writeFileSync(twaManifestPath, JSON.stringify(twaManifest, null, 2));
    console.log('✅ TWA manifest updated');
  }
  
  // Update assetlinks.json
  console.log('\n🔗 Updating Digital Asset Links...');
  const assetlinksPath = join(process.cwd(), 'public', '.well-known', 'assetlinks.json');
  
  if (existsSync(assetlinksPath)) {
    const assetlinks = JSON.parse(readFileSync(assetlinksPath, 'utf8'));
    assetlinks[0].target.package_name = packageId;
    writeFileSync(assetlinksPath, JSON.stringify(assetlinks, null, 2));
    console.log('✅ Asset links updated');
  }
  
  // Build instructions
  console.log('\n🎉 TWA setup complete!\n');
  console.log('Next steps:');
  console.log('1. Deploy your PWA to production with the updated assetlinks.json');
  console.log('2. Build the TWA: npx @bubblewrap/cli build');
  console.log('3. Test the debug APK: adb install app-debug.apk');
  console.log('4. Build for release: npx @bubblewrap/cli build --release');
  console.log('5. Upload the .aab file to Google Play Console');
  
  console.log('\n📚 For detailed instructions, see ANDROID-TWA.md');
  
  rl.close();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

// Run the setup
setupTWA().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
