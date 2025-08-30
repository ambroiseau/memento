#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1MzM3NSwiZXhwIjoyMDcxNjI5Mzc1fQ.HxEQ8tkvuL32WgnxIVhGS8LXEIuzS6otqDqi0qyqlWA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugImageData() {
  try {
    console.log('🔍 Debugging image data structure...');

    // Test the RPC function
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'get_family_posts_with_images',
      {
        p_family_id: '3d546976-eef8-4b17-81cf-717408ec003d',
        p_start_date: '2025-01-01',
        p_end_date: '2025-12-31',
      }
    );

    if (rpcError) {
      console.error('❌ Error calling RPC:', rpcError);
      return;
    }

    console.log('✅ RPC result:', rpcResult.length, 'posts');

    if (rpcResult.length > 0) {
      const firstPost = rpcResult[0];
      console.log('\n📝 First post structure:');
      console.log(JSON.stringify(firstPost, null, 2));

      if (firstPost.images && firstPost.images.length > 0) {
        const firstImage = firstPost.images[0];
        console.log('\n🖼️ First image structure:');
        console.log(JSON.stringify(firstImage, null, 2));

        // Check if storage_path contains base64 data
        if (firstImage.storage_path) {
          console.log('\n🔍 Storage path analysis:');
          console.log('Length:', firstImage.storage_path.length);
          console.log(
            'Starts with data:image:',
            firstImage.storage_path.startsWith('data:image')
          );
          console.log(
            'Contains base64:',
            firstImage.storage_path.includes('base64')
          );

          if (firstImage.storage_path.startsWith('data:image')) {
            console.log('✅ This is a base64 image!');
            console.log('MIME type:', firstImage.storage_path.split(';')[0]);
          } else {
            console.log('❌ This is not a base64 image');
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugImageData();
