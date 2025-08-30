#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1MzM3NSwiZXhwIjoyMDcxNjI5Mzc1fQ.HxEQ8tkvuL32WgnxIVhGS8LXEIuzS6otqDqi0qyqlWA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkImageStructure() {
  try {
    console.log('🔍 Checking image structure in database...');

    // Test 1: Check posts with images
    console.log('\n1. Checking posts with images...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(
        `
        id,
        content_text,
        created_at,
        post_images (
          id,
          storage_path
        )
      `
      )
      .not('post_images', 'is', null)
      .limit(5);

    if (postsError) {
      console.error('❌ Error fetching posts:', postsError);
      return;
    }

    console.log('Posts with images found:', posts.length);
    posts.forEach(post => {
      console.log(`\nPost ${post.id}:`);
      console.log(`  Content: ${post.content_text?.substring(0, 50)}...`);
      console.log(`  Created: ${post.created_at}`);
      console.log(`  Images: ${post.post_images?.length || 0}`);

      if (post.post_images) {
        post.post_images.forEach(img => {
          console.log(`    - ID: ${img.id}`);
          console.log(`    - Storage path: ${img.storage_path}`);
        });
      }
    });

    // Test 2: Try to get a specific family's posts
    if (posts.length > 0) {
      console.log('\n2. Testing RPC function...');

      // Get the first post's family_id
      const { data: postWithFamily, error: familyError } = await supabase
        .from('posts')
        .select('family_id')
        .eq('id', posts[0].id)
        .single();

      if (familyError) {
        console.error('❌ Error getting family_id:', familyError);
        return;
      }

      console.log('Testing with family_id:', postWithFamily.family_id);

      // Test the RPC function
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'get_family_posts_with_images',
        {
          p_family_id: postWithFamily.family_id,
          p_start_date: '2024-01-01',
          p_end_date: '2024-12-31',
        }
      );

      if (rpcError) {
        console.error('❌ Error calling RPC:', rpcError);
        return;
      }

      console.log('RPC result:', rpcResult.length, 'posts');
      if (rpcResult.length > 0) {
        const firstPost = rpcResult[0];
        console.log('First post from RPC:');
        console.log('  Content:', firstPost.content);
        console.log('  Images:', firstPost.images?.length || 0);
        if (firstPost.images && firstPost.images.length > 0) {
          console.log(
            '  First image storage_path:',
            firstPost.images[0].storage_path
          );
        }
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkImageStructure();
