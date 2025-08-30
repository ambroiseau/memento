#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1MzM3NSwiZXhwIjoyMDcxNjI5Mzc1fQ.HxEQ8tkvuL32WgnxIVhGS8LXEIuzS6otqDqi0qyqlWA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateImagesToStorage() {
  try {
    console.log('🚀 Starting image migration to Supabase Storage...');

    // 1. Get all posts with base64 images
    console.log('\n1. Fetching posts with base64 images...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(
        `
        id,
        family_id,
        post_images (
          id,
          storage_path,
          created_at
        )
      `
      )
      .not('post_images', 'is', null);

    if (postsError) {
      console.error('❌ Error fetching posts:', postsError);
      return;
    }

    console.log(`Found ${posts.length} posts with images`);

    let totalImages = 0;
    let migratedImages = 0;
    let skippedImages = 0;

    // 2. Process each post
    for (const post of posts) {
      if (!post.post_images || post.post_images.length === 0) continue;

      console.log(
        `\n📝 Processing post ${post.id} (${post.post_images.length} images)`
      );

      for (const image of post.post_images) {
        totalImages++;

        // Check if image is already migrated (not base64)
        if (
          !image.storage_path ||
          !image.storage_path.startsWith('data:image')
        ) {
          console.log(`  ⏭️  Skipping already migrated image ${image.id}`);
          skippedImages++;
          continue;
        }

        try {
          // 3. Extract image data from base64
          const base64Match = image.storage_path.match(
            /^data:image\/(\w+);base64,(.+)$/
          );
          if (!base64Match) {
            console.log(`  ❌ Invalid base64 format for image ${image.id}`);
            continue;
          }

          const [, format, base64Data] = base64Match;
          const imageBuffer = Buffer.from(base64Data, 'base64');

          // 4. Generate unique filename
          const filename = `${uuidv4()}.${format}`;
          const storagePath = `images/${filename}`;

          console.log(
            `  📤 Uploading image ${image.id} as ${storagePath} (${imageBuffer.length} bytes)`
          );

          // 5. Upload to Supabase Storage
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from('post-images')
              .upload(storagePath, imageBuffer, {
                contentType: `image/${format}`,
                upsert: false,
              });

          if (uploadError) {
            console.error(
              `  ❌ Upload failed for image ${image.id}:`,
              uploadError
            );
            continue;
          }

          // 6. Get image metadata
          const { data: metadata } = await supabase.storage
            .from('post-images')
            .list('images', {
              search: filename,
            });

          // 7. Update database record
          const { error: updateError } = await supabase
            .from('post_images')
            .update({
              storage_path: storagePath,
              file_size: imageBuffer.length,
              mime_type: `image/${format}`,
              migrated_at: new Date().toISOString(),
            })
            .eq('id', image.id);

          if (updateError) {
            console.error(
              `  ❌ Database update failed for image ${image.id}:`,
              updateError
            );
            // Try to delete the uploaded file
            await supabase.storage.from('post-images').remove([storagePath]);
            continue;
          }

          console.log(
            `  ✅ Successfully migrated image ${image.id} to ${storagePath}`
          );
          migratedImages++;
        } catch (error) {
          console.error(`  ❌ Error processing image ${image.id}:`, error);
        }
      }
    }

    // 8. Summary
    console.log('\n📊 Migration Summary:');
    console.log(`  Total images found: ${totalImages}`);
    console.log(`  Successfully migrated: ${migratedImages}`);
    console.log(`  Skipped (already migrated): ${skippedImages}`);
    console.log(`  Failed: ${totalImages - migratedImages - skippedImages}`);

    if (migratedImages > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('Next steps:');
      console.log('1. Update your application to use signed URLs');
      console.log('2. Test the new image serving system');
      console.log('3. Consider cleaning up old base64 data after verification');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
migrateImagesToStorage();
