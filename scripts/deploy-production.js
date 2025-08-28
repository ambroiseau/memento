#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
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

async function deployProduction() {
  console.log('🚀 Memento Production Deployment\n');
  console.log('This script will help you deploy your Memento PWA to production.\n');
  
  // Check if we're ready for production
  console.log('🔍 Checking production readiness...\n');
  
  // Check if .env exists
  if (!existsSync('.env')) {
    console.error('❌ .env file not found. Please create one with your Supabase credentials.');
    process.exit(1);
  }
  
  // Check if build works
  console.log('🏗️  Testing build process...');
  try {
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ Build successful');
  } catch (error) {
    console.error('❌ Build failed. Please fix build errors before deploying.');
    process.exit(1);
  }
  
  // Choose deployment platform
  console.log('\n📋 Choose your deployment platform:');
  console.log('1. Vercel (Recommended)');
  console.log('2. Netlify');
  console.log('3. Firebase Hosting');
  console.log('4. Manual deployment');
  
  const platform = await question('Enter your choice (1-4): ');
  
  switch (platform) {
    case '1':
      await deployToVercel();
      break;
    case '2':
      await deployToNetlify();
      break;
    case '3':
      await deployToFirebase();
      break;
    case '4':
      await manualDeployment();
      break;
    default:
      console.log('❌ Invalid choice');
      process.exit(1);
  }
  
  rl.close();
}

async function deployToVercel() {
  console.log('\n🚀 Deploying to Vercel...\n');
  
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('📦 Installing Vercel CLI...');
    execCommand('npm install -g vercel');
  }
  
  // Create vercel.json if it doesn't exist
  if (!existsSync('vercel.json')) {
    console.log('📝 Creating vercel.json configuration...');
    const vercelConfig = {
      "buildCommand": "npm run build",
      "outputDirectory": "dist",
      "framework": "vite",
      "rewrites": [
        {
          "source": "/(.*)",
          "destination": "/index.html"
        }
      ],
      "headers": [
        {
          "source": "/manifest.webmanifest",
          "headers": [
            {
              "key": "Content-Type",
              "value": "application/manifest+json"
            }
          ]
        },
        {
          "source": "/service-worker.js",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-cache"
            }
          ]
        }
      ]
    };
    
    writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    console.log('✅ vercel.json created');
  }
  
  // Deploy
  console.log('\n🚀 Deploying to Vercel...');
  execCommand('vercel --prod');
  
  console.log('\n✅ Deployment complete!');
  console.log('\nNext steps:');
  console.log('1. Set up environment variables in Vercel dashboard');
  console.log('2. Configure custom domain (if needed)');
  console.log('3. Test PWA functionality');
  console.log('4. Run Lighthouse audit');
}

async function deployToNetlify() {
  console.log('\n🚀 Deploying to Netlify...\n');
  
  // Check if Netlify CLI is installed
  try {
    execSync('netlify --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('📦 Installing Netlify CLI...');
    execCommand('npm install -g netlify-cli');
  }
  
  // Create netlify.toml if it doesn't exist
  if (!existsSync('netlify.toml')) {
    console.log('📝 Creating netlify.toml configuration...');
    const netlifyConfig = `[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/manifest.webmanifest"
  [headers.values]
    Content-Type = "application/manifest+json"

[[headers]]
  for = "/service-worker.js"
  [headers.values]
    Cache-Control = "no-cache"`;
    
    writeFileSync('netlify.toml', netlifyConfig);
    console.log('✅ netlify.toml created');
  }
  
  // Build and deploy
  console.log('\n🏗️  Building for production...');
  execCommand('npm run build');
  
  console.log('\n🚀 Deploying to Netlify...');
  execCommand('netlify deploy --prod --dir=dist');
  
  console.log('\n✅ Deployment complete!');
  console.log('\nNext steps:');
  console.log('1. Set up environment variables in Netlify dashboard');
  console.log('2. Configure custom domain (if needed)');
  console.log('3. Test PWA functionality');
  console.log('4. Run Lighthouse audit');
}

async function deployToFirebase() {
  console.log('\n🚀 Deploying to Firebase...\n');
  
  // Check if Firebase CLI is installed
  try {
    execSync('firebase --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('📦 Installing Firebase CLI...');
    execCommand('npm install -g firebase-tools');
  }
  
  // Initialize Firebase if not already done
  if (!existsSync('firebase.json')) {
    console.log('📝 Initializing Firebase...');
    execCommand('firebase init hosting');
  }
  
  // Build and deploy
  console.log('\n🏗️  Building for production...');
  execCommand('npm run build');
  
  console.log('\n🚀 Deploying to Firebase...');
  execCommand('firebase deploy');
  
  console.log('\n✅ Deployment complete!');
  console.log('\nNext steps:');
  console.log('1. Set up environment variables in Firebase console');
  console.log('2. Configure custom domain (if needed)');
  console.log('3. Test PWA functionality');
  console.log('4. Run Lighthouse audit');
}

async function manualDeployment() {
  console.log('\n📋 Manual Deployment Instructions\n');
  
  console.log('1. Build your app:');
  console.log('   npm run build');
  
  console.log('\n2. Upload the contents of the "dist" folder to your hosting provider');
  
  console.log('\n3. Configure your hosting provider:');
  console.log('   - Set up SPA routing (rewrite all routes to /index.html)');
  console.log('   - Configure proper headers for manifest and service worker');
  console.log('   - Set up environment variables');
  
  console.log('\n4. Test your deployment:');
  console.log('   - Check PWA installation');
  console.log('   - Test offline functionality');
  console.log('   - Run Lighthouse audit');
  
  console.log('\n📚 See PRODUCTION-DEPLOYMENT.md for detailed instructions');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

// Run the deployment
deployProduction().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});
