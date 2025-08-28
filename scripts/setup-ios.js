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
  
  // Check if we're on macOS
  if (process.platform !== 'darwin') {
    console.error('❌ iOS development requires macOS.');
    return false;
  }
  
  // Check Xcode
  try {
    const xcodeVersion = execSync('xcodebuild -version', { encoding: 'utf8' });
    console.log('✅ Xcode found');
  } catch (error) {
    console.error('❌ Xcode not found. Please install Xcode from the Mac App Store.');
    return false;
  }
  
  // Check if iOS Simulator is available
  try {
    execSync('xcrun simctl list devices', { encoding: 'utf8' });
    console.log('✅ iOS Simulator available');
  } catch (error) {
    console.warn('⚠️  iOS Simulator not available. You may need to install additional Xcode components.');
  }
  
  return true;
}

async function setupIOS() {
  console.log('🚀 Memento iOS Setup\n');
  console.log('This script will help you set up an iOS app wrapper for your Memento PWA using Capacitor.\n');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    console.log('\n❌ Prerequisites not met. Please install the required tools and try again.');
    process.exit(1);
  }
  
  // Get app details
  const appName = await question('Enter your app name (default: Memento): ') || 'Memento';
  const packageId = await question('Enter your iOS bundle identifier (e.g., com.yourdomain.memento): ');
  const productionUrl = await question('Enter your production PWA URL (e.g., https://yourdomain.com): ');
  
  if (!productionUrl.startsWith('https://')) {
    console.error('❌ Production URL must use HTTPS');
    process.exit(1);
  }
  
  // Install Capacitor
  console.log('\n📦 Installing Capacitor...');
  execCommand('npm install @capacitor/core @capacitor/cli');
  
  // Initialize Capacitor
  console.log('\n🔧 Initializing Capacitor...');
  execCommand(`npx cap init "${appName}" "${packageId}"`);
  
  // Add iOS platform
  console.log('\n📱 Adding iOS platform...');
  execCommand('npx cap add ios');
  
  // Create capacitor.config.ts
  console.log('\n📝 Creating Capacitor configuration...');
  const capacitorConfig = `import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: '${packageId}',
  appName: '${appName}',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: '${new URL(productionUrl).hostname}',
    allowNavigation: [
      '${productionUrl}/*',
      'https://*.supabase.co/*'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0a',
      showSpinner: true,
      spinnerColor: '#ffffff'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;`;
  
  writeFileSync('capacitor.config.ts', capacitorConfig);
  console.log('✅ Capacitor configuration created');
  
  // Install essential plugins
  console.log('\n🔌 Installing essential plugins...');
  const plugins = [
    '@capacitor/camera',
    '@capacitor/push-notifications',
    '@capacitor/status-bar',
    '@capacitor/splash-screen'
  ];
  
  for (const plugin of plugins) {
    execCommand(`npm install ${plugin}`);
  }
  
  // Sync plugins
  execCommand('npx cap sync ios');
  
  // Build the app
  console.log('\n🏗️  Building the app...');
  execCommand('npm run build');
  
  // Copy assets to iOS
  console.log('\n📋 Copying assets to iOS...');
  execCommand('npx cap copy ios');
  
  // Create Info.plist template
  console.log('\n📄 Creating Info.plist template...');
  const infoPlistTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- App Transport Security -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
        <key>NSExceptionDomains</key>
        <dict>
            <key>${new URL(productionUrl).hostname}</key>
            <dict>
                <key>NSExceptionAllowsInsecureHTTPLoads</key>
                <false/>
                <key>NSExceptionMinimumTLSVersion</key>
                <string>TLSv1.2</string>
                <key>NSExceptionRequiresForwardSecrecy</key>
                <true/>
            </dict>
            <key>supabase.co</key>
            <dict>
                <key>NSExceptionAllowsInsecureHTTPLoads</key>
                <false/>
                <key>NSExceptionMinimumTLSVersion</key>
                <string>TLSv1.2</string>
                <key>NSExceptionRequiresForwardSecrecy</key>
                <true/>
            </dict>
        </dict>
    </dict>
    
    <!-- Permissions -->
    <key>NSCameraUsageDescription</key>
    <string>${appName} needs camera access to take photos for family posts.</string>
    
    <key>NSPhotoLibraryUsageDescription</key>
    <string>${appName} needs photo library access to select images for family posts.</string>
    
    <key>NSMicrophoneUsageDescription</key>
    <string>${appName} needs microphone access for video recording.</string>
    
    <key>NSLocalNetworkUsageDescription</key>
    <string>${appName} needs network access to sync with your family.</string>
</dict>
</plist>`;
  
  const infoPlistPath = join(process.cwd(), 'ios', 'App', 'App', 'Info.plist');
  if (existsSync(infoPlistPath)) {
    // Backup original
    const originalContent = readFileSync(infoPlistPath, 'utf8');
    writeFileSync(infoPlistPath + '.backup', originalContent);
    
    // Create template file
    writeFileSync('Info.plist.template', infoPlistTemplate);
    console.log('✅ Info.plist template created (Info.plist.template)');
    console.log('⚠️  Please manually update ios/App/App/Info.plist with the template content');
  }
  
  // Setup instructions
  console.log('\n🎉 iOS setup complete!\n');
  console.log('Next steps:');
  console.log('1. Open the project in Xcode: npx cap open ios');
  console.log('2. Configure app icons in Xcode');
  console.log('3. Set up your Apple Developer Team');
  console.log('4. Update Info.plist with the template content');
  console.log('5. Test on iOS Simulator: npx cap run ios');
  console.log('6. Test on physical device');
  console.log('7. Archive and upload to App Store Connect');
  
  console.log('\n📚 For detailed instructions, see IOS-CAPACITOR.md');
  console.log('📚 For quick reference, see IOS-QUICK-START.md');
  
  rl.close();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

// Run the setup
setupIOS().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
