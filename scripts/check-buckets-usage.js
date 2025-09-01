import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBucketsUsage() {
  console.log('🔍 Checking Supabase buckets usage...\n');

  try {
    // 1. List all buckets
    console.log('📦 Listing all buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }

    console.log(`✅ Found ${buckets.length} buckets:\n`);

    // 2. Analyze each bucket
    for (const bucket of buckets) {
      console.log(`📊 Bucket: ${bucket.name}`);
      console.log(`   ID: ${bucket.id}`);
      console.log(`   Public: ${bucket.public ? 'Yes' : 'No'}`);
      console.log(`   Created: ${bucket.created_at}`);
      
      try {
        // Count files in bucket
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 1000 });

        if (filesError) {
          console.log(`   ❌ Error listing files: ${filesError.message}`);
        } else {
          console.log(`   📁 Files: ${files.length}`);
          
          // Calculate total size
          let totalSize = 0;
          files.forEach(file => {
            totalSize += file.metadata?.size || 0;
          });
          
          const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
          console.log(`   💾 Total size: ${totalSizeMB} MB`);
          
          // Show some file examples
          if (files.length > 0) {
            console.log(`   📋 Sample files:`);
            files.slice(0, 3).forEach(file => {
              const sizeKB = (file.metadata?.size / 1024).toFixed(1);
              console.log(`      - ${file.name} (${sizeKB} KB)`);
            });
            if (files.length > 3) {
              console.log(`      ... and ${files.length - 3} more files`);
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ Error accessing bucket: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }

    // 3. Check database references
    console.log('🗄️ Checking database references...');
    const { data: postImages, error: postImagesError } = await supabase
      .from('post_images')
      .select('storage_path, created_at')
      .limit(10);

    if (postImagesError) {
      console.error('❌ Error checking post_images:', postImagesError);
    } else {
      console.log(`✅ Found ${postImages.length} post_images records`);
      if (postImages.length > 0) {
        console.log('📋 Sample storage paths:');
        postImages.slice(0, 3).forEach(img => {
          console.log(`   - ${img.storage_path}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkBucketsUsage().then(() => {
  console.log('✅ Bucket analysis complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
