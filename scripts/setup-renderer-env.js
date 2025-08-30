#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

async function setupRendererEnv() {
  console.log('🔧 Setting up PDF Renderer environment...\n');

  try {
    const rendererEnvPath = path.join(process.cwd(), 'renderer', '.env');

    // Supabase configuration (from the project)
    const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';

    // Note: You'll need to get the service role key from Supabase dashboard
    // This is different from the anon key and has more permissions
    const serviceKeyPlaceholder = 'YOUR_SERVICE_ROLE_KEY_HERE';

    const envContent = `# Supabase Configuration
SUPABASE_URL=${supabaseUrl}
SUPABASE_SERVICE_KEY=${serviceKeyPlaceholder}

# Server Configuration
PORT=3001

# Storage Configuration
STORAGE_BUCKET=generated-pdfs
`;

    fs.writeFileSync(rendererEnvPath, envContent);

    console.log('✅ Environment file created successfully!');
    console.log();
    console.log('⚠️  IMPORTANT: You need to configure the service role key:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to Settings > API');
    console.log('   4. Copy the "service_role" key (not the anon key)');
    console.log('   5. Replace YOUR_SERVICE_ROLE_KEY_HERE in renderer/.env');
    console.log();
    console.log('📁 File location: renderer/.env');
    console.log('🔑 Current SUPABASE_URL:', supabaseUrl);
    console.log();
  } catch (error) {
    console.error('❌ Failed to setup environment:', error.message);
  }
}

setupRendererEnv();
