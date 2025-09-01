import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBucketsUsage() {
  console.log('🔍 Checking Supabase buckets usage with anon key...\n');

  try {
    // Note: With anon key, we can only access buckets that have public policies
    console.log('📦 Attempting to list buckets (may be limited with anon key)...');
    
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.log('ℹ️ Cannot list buckets with anon key (normal):', bucketsError.message);
        console.log('   This is expected - buckets listing requires service role key\n');
      } else {
        console.log(`✅ Found ${buckets.length} buckets:\n`);
        buckets.forEach(bucket => {
          console.log(`   - ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
        });
        console.log('');
      }
    } catch (error) {
      console.log('ℹ️ Cannot list buckets with anon key (expected)\n');
    }

    // Try to access specific buckets we know about
    const knownBuckets = [
      'post-images',
      'post-images-display', 
      'post-images-original',
      'generated-pdfs'
    ];

    console.log('🔍 Checking known buckets...\n');

    for (const bucketName of knownBuckets) {
      try {
        console.log(`📊 Bucket: ${bucketName}`);
        
        const { data: files, error: filesError } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 100 });

        if (filesError) {
          console.log(`   ❌ Error: ${filesError.message}`);
        } else {
          console.log(`   📁 Files: ${files.length}`);
          
          if (files.length > 0) {
            // Calculate total size
            let totalSize = 0;
            files.forEach(file => {
              totalSize += file.metadata?.size || 0;
            });
            
            const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
            console.log(`   💾 Total size: ${totalSizeMB} MB`);
            
            // Show some file examples
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
        console.log('');
      } catch (error) {
        console.log(`   ❌ Cannot access bucket: ${error.message}\n`);
      }
    }

    // Check database references
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
