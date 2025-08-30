#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1MzM3NSwiZXhwIjoyMDcxNjI5Mzc1fQ.HxEQ8tkvuL32WgnxIVhGS8LXEIuzS6otqDqi0qyqlWA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentStatus() {
  try {
    console.log('📊 Checking current image status (before migration)...');

    // 1. Check total images
    const { data: totalImagesData, error: totalError } = await supabase
      .from('post_images')
      .select('id');

    if (totalError) {
      console.error('❌ Error counting total images:', totalError);
      return;
    }

    const totalImages = totalImagesData.length;

    // 2. Check base64 images
    const { data: base64ImagesData, error: base64Error } = await supabase
      .from('post_images')
      .select('id')
      .like('storage_path', 'data:image%');

    if (base64Error) {
      console.error('❌ Error counting base64 images:', base64Error);
      return;
    }

    const base64Images = base64ImagesData.length;

    // 3. Check storage bucket
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

    // 4. Summary
    console.log('\n📈 Current Status Summary:');
    console.log(`  Total images in database: ${totalImages}`);
    console.log(`  Base64 images (to migrate): ${base64Images}`);
    console.log(`  Other images: ${totalImages - base64Images}`);

    // 5. Sample of base64 images
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
          const format =
            img.storage_path.match(/data:image\/(\w+)/)?.[1] || 'unknown';
          console.log(
            `  - ID: ${img.id}, Format: ${format}, Size: ${size} chars, Created: ${img.created_at}`
          );
        });
      }
    }

    // 6. Sample of other images
    const { data: otherImages, error: otherError } = await supabase
      .from('post_images')
      .select('id, storage_path, created_at')
      .not('storage_path', 'like', 'data:image%')
      .limit(3);

    if (!otherError && otherImages && otherImages.length > 0) {
      console.log('\n📋 Sample of non-base64 images:');
      otherImages.forEach(img => {
        console.log(
          `  - ID: ${img.id}, Path: ${img.storage_path}, Created: ${img.created_at}`
        );
      });
    }

    // 7. Recommendations
    console.log('\n💡 Next Steps:');
    if (base64Images > 0) {
      console.log(
        `  1. 🗄️  Run SQL migration: sql/migrate-post-images-table.sql`
      );
      console.log(
        `  2. 🚀 Run migration script: node scripts/migrate-images-to-storage.js`
      );
      console.log(`  3. 📊 ${base64Images} images will be migrated to storage`);
    } else {
      console.log('  ✅ No base64 images found!');
    }
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run check
checkCurrentStatus();
