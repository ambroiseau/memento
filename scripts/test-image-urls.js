#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1MzM3NSwiZXhwIjoyMDcxNjI5Mzc1fQ.HxEQ8tkvuL32WgnxIVhGS8LXEIuzS6otqDqi0qyqlWA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testImageUrls() {
  try {
    console.log('🔍 Testing image URL generation...');

    // Test 1: Check if post-images bucket exists
    console.log('\n1. Checking post-images bucket...');
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }

    const postImagesBucket = buckets.find(b => b.name === 'post-images');
    if (!postImagesBucket) {
      console.error('❌ post-images bucket not found!');
      console.log(
        'Available buckets:',
        buckets.map(b => b.name)
      );
      return;
    }

    console.log('✅ post-images bucket found');

    // Test 2: List some files in the bucket
    console.log('\n2. Listing files in post-images bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from('post-images')
      .list('', { limit: 10 });

    if (filesError) {
      console.error('❌ Error listing files:', filesError);
      return;
    }

    console.log('Files/folders found:', files.length);
    files.forEach(file => {
      console.log(
        `  - ${file.name} (${file.metadata?.size || 'unknown size'}) - isFolder: ${file.metadata?.isFolder || false}`
      );
    });

    // Test 2b: Explore the family folder if it exists
    const familyFolder = files.find(f => f.name === 'family');
    if (familyFolder) {
      console.log('\n2b. Exploring family folder...');
      const { data: familyFiles, error: familyError } = await supabase.storage
        .from('post-images')
        .list('family', { limit: 10 });

      if (familyError) {
        console.error('❌ Error listing family files:', familyError);
      } else {
        console.log('Family files found:', familyFiles.length);
        familyFiles.forEach(file => {
          console.log(
            `  - family/${file.name} (${file.metadata?.size || 'unknown size'})`
          );
        });

        // Use the first family file for testing
        if (familyFiles.length > 0) {
          files.length = 0; // Clear the array
          files.push({ name: `family/${familyFiles[0].name}` }); // Add the family file
        }
      }
    }

    if (filesError) {
      console.error('❌ Error listing files:', filesError);
      return;
    }

    console.log('Files found:', files.length);
    files.forEach(file => {
      console.log(
        `  - ${file.name} (${file.metadata?.size || 'unknown size'})`
      );
    });

    // Test 3: Try to create a signed URL for the first file
    if (files.length > 0) {
      console.log('\n3. Testing signed URL generation...');
      const testFile = files[0];

      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('post-images')
        .createSignedUrl(testFile.name, 3600);

      if (urlError) {
        console.error('❌ Error creating signed URL:', urlError);
        return;
      }

      console.log('✅ Signed URL created successfully');
      console.log('URL:', signedUrl.signedUrl);

      // Test 4: Try to fetch the image
      console.log('\n4. Testing image fetch...');
      try {
        const response = await fetch(signedUrl.signedUrl);
        console.log('Response status:', response.status);
        console.log(
          'Response headers:',
          Object.fromEntries(response.headers.entries())
        );

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          console.log(
            '✅ Image fetched successfully, size:',
            buffer.byteLength,
            'bytes'
          );
        } else {
          console.error('❌ Failed to fetch image');
        }
      } catch (fetchError) {
        console.error('❌ Error fetching image:', fetchError);
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testImageUrls();
