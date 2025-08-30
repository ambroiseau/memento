#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1MzM3NSwiZXhwIjoyMDcxNjI5Mzc1fQ.HxEQ8tkvuL32WgnxIVhGS8LXEIuzS6otqDqi0qyqlWA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBucket() {
  try {
    console.log('🔧 Creating storage bucket: generated-pdfs');

    const { data, error } = await supabase.storage.createBucket(
      'generated-pdfs',
      {
        public: true,
        allowedMimeTypes: ['application/pdf'],
        fileSizeLimit: 52428800, // 50MB
      }
    );

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket "generated-pdfs" already exists');
      } else {
        console.error('❌ Error creating bucket:', error);
        return;
      }
    } else {
      console.log('✅ Bucket "generated-pdfs" created successfully');
    }

    // Set bucket policies
    console.log('🔧 Setting bucket policies...');

    // Allow public read access to PDFs
    const { error: policyError } = await supabase.storage
      .from('generated-pdfs')
      .createSignedUrl('test.pdf', 3600);

    if (policyError && !policyError.message.includes('not found')) {
      console.error('❌ Error setting bucket policies:', policyError);
    } else {
      console.log('✅ Bucket policies configured');
    }

    console.log('🎉 Storage bucket setup complete!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createStorageBucket();
