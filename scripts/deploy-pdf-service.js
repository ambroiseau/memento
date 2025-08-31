#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('🚀 Deploying PDF Renderer Service to Railway...\n');

async function deployPDFService() {
  try {
    // Check if we're in the right directory
    if (!existsSync('renderer/package.json')) {
      console.log('❌ Error: renderer/package.json not found');
      console.log('Please run this script from the project root directory');
      return;
    }

    // Check if Railway CLI is installed
    try {
      execSync('railway --version', { stdio: 'ignore' });
    } catch (error) {
      console.log('❌ Railway CLI not found. Installing...');
      execSync('npm install -g @railway/cli', { stdio: 'inherit' });
    }

    // Check if user is logged in to Railway
    try {
      execSync('railway whoami', { stdio: 'ignore' });
      console.log('✅ Railway CLI authenticated');
    } catch (error) {
      console.log('❌ Not logged in to Railway. Please login:');
      console.log('railway login');
      return;
    }

    // Navigate to renderer directory
    process.chdir('renderer');

    // Check if Railway project exists
    try {
      execSync('railway status', { stdio: 'ignore' });
      console.log('✅ Railway project found');
    } catch (error) {
      console.log('📦 Creating new Railway project...');
      execSync('railway init', { stdio: 'inherit' });
    }

    // Set environment variables
    console.log('🔧 Setting environment variables...');
    
    const envPath = join(process.cwd(), '.env');
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf8');
      const envVars = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      for (const envVar of envVars) {
        const [key, value] = envVar.split('=');
        if (key && value) {
          try {
            execSync(`railway variables set ${key}=${value}`, { stdio: 'ignore' });
            console.log(`   ✅ Set ${key}`);
          } catch (error) {
            console.log(`   ⚠️  Failed to set ${key} (might already exist)`);
          }
        }
      }
    }

    // Deploy to Railway
    console.log('🚀 Deploying to Railway...');
    execSync('railway up', { stdio: 'inherit' });

    // Get the deployment URL
    console.log('🔍 Getting deployment URL...');
    const urlOutput = execSync('railway domain', { encoding: 'utf8' });
    const domain = urlOutput.trim();
    
    console.log('\n🎉 PDF Renderer Service deployed successfully!');
    console.log(`🌐 URL: https://${domain}`);
    console.log('\n📝 Next steps:');
    console.log('1. Update your main app\'s VITE_PDF_RENDERER_URL environment variable');
    console.log(`   Set it to: https://${domain}`);
    console.log('2. Redeploy your main app to Vercel');
    console.log('3. Test the album generation feature');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\n💡 Alternative deployment options:');
    console.log('- Railway: railway.app');
    console.log('- Render: render.com');
    console.log('- Heroku: heroku.com');
    console.log('- DigitalOcean App Platform: digitalocean.com');
  }
}

deployPDFService();
