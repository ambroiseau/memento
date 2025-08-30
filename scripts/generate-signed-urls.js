#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1MzM3NSwiZXhwIjoyMDcxNjI5Mzc1fQ.HxEQ8tkvuL32WgnxIVhGS8LXEIuzS6otqDqi0qyqlWA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateSignedUrls() {
  try {
    console.log('🔗 Testing signed URL generation for migrated images...');

    // 1. Get migrated images
    console.log('\n1. Fetching migrated images...');
    const { data: images, error: imagesError } = await supabase
      .from('post_images')
      .select('id, storage_path, mime_type, file_size')
      .not('migrated_at', 'is', null)
      .limit(5);

    if (imagesError) {
      console.error('❌ Error fetching images:', imagesError);
      return;
    }

    console.log(`Found ${images.length} migrated images`);

    // 2. Generate signed URLs for each image
    for (const image of images) {
      console.log(`\n📸 Processing image ${image.id}:`);
      console.log(`  Storage path: ${image.storage_path}`);
      console.log(`  MIME type: ${image.mime_type}`);
      console.log(`  File size: ${image.file_size} bytes`);

      try {
        // Generate signed URL (10 minutes expiry)
        const { data: signedUrl, error: urlError } = await supabase.storage
          .from('post-images')
          .createSignedUrl(image.storage_path, 600); // 10 minutes

        if (urlError) {
          console.error(`  ❌ Error generating signed URL:`, urlError);
          continue;
        }

        console.log(`  ✅ Signed URL generated:`);
        console.log(`     ${signedUrl.signedUrl}`);

        // Test the URL
        console.log(`  🔍 Testing URL...`);
        const response = await fetch(signedUrl.signedUrl);

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          console.log(`  ✅ URL works! Downloaded ${buffer.byteLength} bytes`);

          // Verify file size matches
          if (buffer.byteLength === image.file_size) {
            console.log(`  ✅ File size matches database record`);
          } else {
            console.log(
              `  ⚠️  File size mismatch: DB=${image.file_size}, Downloaded=${buffer.byteLength}`
            );
          }
        } else {
          console.error(
            `  ❌ URL test failed: ${response.status} ${response.statusText}`
          );
        }
      } catch (error) {
        console.error(`  ❌ Error processing image ${image.id}:`, error);
      }
    }

    // 3. Test with a specific image
    if (images.length > 0) {
      console.log('\n🎯 Testing with specific image...');
      const testImage = images[0];

      // Generate URL with different expiry times
      const expiryTimes = [60, 300, 600, 3600]; // 1min, 5min, 10min, 1hour

      for (const expiry of expiryTimes) {
        const { data: signedUrl, error: urlError } = await supabase.storage
          .from('post-images')
          .createSignedUrl(testImage.storage_path, expiry);

        if (!urlError) {
          console.log(
            `  ✅ ${expiry}s expiry URL: ${signedUrl.signedUrl.substring(0, 100)}...`
          );
        }
      }
    }

    console.log('\n🎉 Signed URL generation test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
generateSignedUrls();
