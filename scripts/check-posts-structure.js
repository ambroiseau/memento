#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1MzM3NSwiZXhwIjoyMDcxNjI5Mzc1fQ.HxEQ8tkvuL32WgnxIVhGS8LXEIuzS6otqDqi0qyqlWA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPostsStructure() {
  try {
    console.log('🔍 Checking posts table structure...');

    // Test 1: Check posts table directly
    console.log('\n1. Checking posts table directly...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(3);

    if (postsError) {
      console.error('❌ Error fetching posts:', postsError);
      return;
    }

    console.log('Posts found:', posts.length);
    if (posts.length > 0) {
      console.log('First post structure:');
      console.log(JSON.stringify(posts[0], null, 2));
    }

    // Test 2: Check if there are posts with the family_id we found earlier
    console.log(
      '\n2. Checking posts for family_id: 3d546976-eef8-4b17-81cf-717408ec003d'
    );
    const { data: familyPosts, error: familyError } = await supabase
      .from('posts')
      .select('*')
      .eq('family_id', '3d546976-eef8-4b17-81cf-717408ec003d')
      .limit(5);

    if (familyError) {
      console.error('❌ Error fetching family posts:', familyError);
      return;
    }

    console.log('Family posts found:', familyPosts.length);
    if (familyPosts.length > 0) {
      console.log('First family post:');
      console.log(JSON.stringify(familyPosts[0], null, 2));
    }

    // Test 3: Check the RPC function with correct parameters
    if (familyPosts.length > 0) {
      console.log('\n3. Testing RPC function with correct parameters...');
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'get_family_posts_with_images',
        {
          p_family_id: '3d546976-eef8-4b17-81cf-717408ec003d',
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
        console.log('First RPC result:');
        console.log(JSON.stringify(rpcResult[0], null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkPostsStructure();
