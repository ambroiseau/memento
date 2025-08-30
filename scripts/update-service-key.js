#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

async function updateServiceKey() {
  console.log('🔧 Updating service role key...\n');

  try {
    const rendererEnvPath = path.join(process.cwd(), 'renderer', '.env');
    
    // Service role key provided by user
    const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1MzM3NSwiZXhwIjoyMDcxNjI5Mzc1fQ.HxEQ8tkvuL32WgnxIVhGS8LXEIuzS6otqDqi0qyqlWA';
    
    const envContent = `# Supabase Configuration
SUPABASE_URL=https://zcyalwewcdgbftaaneet.supabase.co
SUPABASE_SERVICE_KEY=${serviceKey}

# Server Configuration
PORT=3001

# Storage Configuration
STORAGE_BUCKET=generated-pdfs
`;

    fs.writeFileSync(rendererEnvPath, envContent);
    
    console.log('✅ Service role key updated successfully!');
    console.log('📁 File updated: renderer/.env');
    console.log('🔑 Service key: Configured');
    console.log();

  } catch (error) {
    console.error('❌ Failed to update service key:', error.message);
  }
}

updateServiceKey();
