#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1MzM3NSwiZXhwIjoyMDcxNjI5Mzc1fQ.HxEQ8tkvuL32WgnxIVhGS8LXEIuzS6otqDqi0qyqlWA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMigrationStatus() {
  try {
    console.log('📊 Checking image migration status...');

    // 1. Check total images
    const { data: totalImages, error: totalError } = await supabase
      .from('post_images')
      .select('id', { count: 'exact' });

    if (totalError) {
      console.error('❌ Error counting total images:', totalError);
      return;
    }

    // 2. Check base64 images
    const { data: base64Images, error: base64Error } = await supabase
      .from('post_images')
      .select('id', { count: 'exact' })
      .like('storage_path', 'data:image%');

    if (base64Error) {
      console.error('❌ Error counting base64 images:', base64Error);
      return;
    }

    // 3. Check migrated images
    const { data: migratedImagesData, error: migratedError } = await supabase
      .from('post_images')
      .select('id')
      .not('migrated_at', 'is', null);

    if (migratedError) {
      console.error('❌ Error counting migrated images:', migratedError);
      return;
    }

    const migratedImages = migratedImagesData.length;

    // 4. Check storage bucket
    console.log('\n1. Checking storage bucket...');
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
    } else {
      const postImagesBucket = buckets.find(b => b.name === 'post-images');
      if (postImagesBucket) {
        console.log('✅ post-images bucket found');

        // Count files in storage
        const { data: storageFiles, error: storageError } =
          await supabase.storage
            .from('post-images')
            .list('images', { limit: 1000 });

        if (storageError) {
          console.error('❌ Error listing storage files:', storageError);
        } else {
          console.log(`📁 Storage contains ${storageFiles.length} image files`);
        }
      } else {
        console.log('❌ post-images bucket not found');
      }
    }

    // 5. Summary
    console.log('\n📈 Migration Status Summary:');
    console.log(`  Total images in database: ${totalImages}`);
    console.log(`  Base64 images (to migrate): ${base64Images}`);
    console.log(`  Migrated images: ${migratedImages}`);
    console.log(
      `  Unknown status: ${totalImages - base64Images - migratedImages}`
    );

    // 6. Sample of base64 images
    if (base64Images > 0) {
      console.log('\n📋 Sample of base64 images:');
      const { data: sampleBase64, error: sampleError } = await supabase
        .from('post_images')
        .select('id, storage_path, created_at')
        .like('storage_path', 'data:image%')
        .limit(3);

      if (!sampleError && sampleBase64) {
        sampleBase64.forEach(img => {
          const size = img.storage_path.length;
          console.log(
            `  - ID: ${img.id}, Size: ${size} chars, Created: ${img.created_at}`
          );
        });
      }
    }

    // 7. Sample of migrated images
    if (migratedImages > 0) {
      console.log('\n📋 Sample of migrated images:');
      const { data: sampleMigrated, error: sampleError } = await supabase
        .from('post_images')
        .select('id, storage_path, file_size, mime_type, migrated_at')
        .not('migrated_at', 'is', null)
        .limit(3);

      if (!sampleError && sampleMigrated) {
        sampleMigrated.forEach(img => {
          console.log(
            `  - ID: ${img.id}, Path: ${img.storage_path}, Size: ${img.file_size} bytes, Type: ${img.mime_type}`
          );
        });
      }
    }

    // 8. Recommendations
    console.log('\n💡 Recommendations:');
    if (base64Images > 0) {
      console.log(
        `  🚀 Run migration script: node scripts/migrate-images-to-storage.js`
      );
      console.log(`  📊 ${base64Images} images need to be migrated`);
    } else {
      console.log('  ✅ All images are migrated!');
    }

    if (migratedImages > 0) {
      console.log(
        `  🔗 Test signed URLs: node scripts/generate-signed-urls.js`
      );
    }
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run check
checkMigrationStatus();
