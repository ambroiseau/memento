#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

async function setupAllEnv() {
  console.log('🔧 Setting up all environment variables...\n');

  try {
    // Supabase configuration
    const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';
    const anonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU';

    // Main app .env
    const mainEnvPath = path.join(process.cwd(), '.env');
    const mainEnvContent = `# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${anonKey}

# App Configuration
VITE_APP_NAME=Memento App
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_PWA=true
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_PUSH_NOTIFICATIONS=false

# Development
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info

# Storage Configuration
VITE_STORAGE_BUCKET=family-photos
VITE_MAX_FILE_SIZE=10485760

# API Configuration
VITE_API_TIMEOUT=30000
VITE_MAX_RETRIES=3

# PDF Renderer Service
VITE_PDF_RENDERER_URL=http://localhost:3002
`;

    fs.writeFileSync(mainEnvPath, mainEnvContent);
    console.log('✅ Main app .env configured');

    // Renderer .env
    const rendererEnvPath = path.join(process.cwd(), 'renderer', '.env');
    const rendererEnvContent = `# Supabase Configuration
SUPABASE_URL=${supabaseUrl}
SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# Server Configuration
PORT=3001

# Storage Configuration
STORAGE_BUCKET=generated-pdfs
`;

    fs.writeFileSync(rendererEnvPath, rendererEnvContent);
    console.log('✅ Renderer .env configured');

    console.log();
    console.log('🎉 Environment setup completed!');
    console.log();
    console.log(
      '⚠️  IMPORTANT: You still need to configure the service role key:'
    );
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to Settings > API');
    console.log('   4. Copy the "service_role" key (not the anon key)');
    console.log('   5. Replace YOUR_SERVICE_ROLE_KEY_HERE in renderer/.env');
    console.log();
    console.log('📁 Files configured:');
    console.log('   - .env (main app)');
    console.log('   - renderer/.env (PDF service)');
    console.log();
    console.log('🔑 Supabase URL:', supabaseUrl);
    console.log('🔑 Anon Key: Configured');
    console.log('🔑 Service Key: Needs to be configured manually');
    console.log();
  } catch (error) {
    console.error('❌ Failed to setup environment:', error.message);
  }
}

setupAllEnv();
