#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting PDF Renderer Service (Simple)...\n');

// Check if renderer directory exists
const rendererPath = path.join(process.cwd(), 'renderer');
if (!fs.existsSync(rendererPath)) {
  console.error(
    '❌ Renderer directory not found. Please run this from the project root.'
  );
  process.exit(1);
}

// Change to renderer directory
process.chdir(rendererPath);

// Check if .env exists
const envPath = path.join(rendererPath, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ No .env file found in renderer directory.');
  console.log('   Please run: node scripts/setup-all-env.js');
  process.exit(1);
}

// Check if node_modules exists
if (!fs.existsSync(path.join(rendererPath, 'node_modules'))) {
  console.log('📦 Installing dependencies...');
  const install = spawn('npm', ['install'], { stdio: 'inherit' });

  install.on('close', code => {
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

  // Set environment variables
  const env = {
    ...process.env,
    SUPABASE_URL: 'https://zcyalwewcdgbftaaneet.supabase.co',
    SUPABASE_SERVICE_KEY:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1MzM3NSwiZXhwIjoyMDcxNjI5Mzc1fQ.HxEQ8tkvuL32WgnxIVhGS8LXEIuzS6otqDqi0qyqlWA',
    PORT: '3002',
    STORAGE_BUCKET: 'generated-pdfs',
    FORCE_COLOR: '1',
  };

  const dev = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env,
  });

  dev.on('close', code => {
    console.log(`\n📴 PDF Renderer service stopped with code ${code}`);
  });

  dev.on('error', error => {
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
