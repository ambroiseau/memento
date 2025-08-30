#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting PDF Renderer Service...\n');

// Check if renderer directory exists
const rendererPath = path.join(__dirname, '..', 'renderer');
if (!fs.existsSync(rendererPath)) {
  console.error('❌ Renderer directory not found. Please run this from the project root.');
  process.exit(1);
}

// Check if .env file exists in renderer
const envPath = path.join(rendererPath, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found in renderer directory.');
  console.log('📝 Please create one from env.example:');
  console.log(`   cp ${path.join(rendererPath, 'env.example')} ${envPath}`);
  console.log('   Then configure SUPABASE_URL and SUPABASE_SERVICE_KEY\n');
}

// Change to renderer directory
process.chdir(rendererPath);

// Check if node_modules exists
if (!fs.existsSync(path.join(rendererPath, 'node_modules'))) {
  console.log('📦 Installing dependencies...');
  const install = spawn('npm', ['install'], { stdio: 'inherit' });
  
  install.on('close', (code) => {
    if (code === 0) {
      startDevServer();
    } else {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  startDevServer();
}

function startDevServer() {
  console.log('🔄 Starting development server...\n');
  
  const dev = spawn('npm', ['run', 'dev'], { 
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });
  
  dev.on('close', (code) => {
    console.log(`\n📴 PDF Renderer service stopped with code ${code}`);
  });
  
  dev.on('error', (error) => {
    console.error('❌ Failed to start PDF renderer service:', error.message);
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping PDF renderer service...');
    dev.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping PDF renderer service...');
    dev.kill('SIGTERM');
  });
}
