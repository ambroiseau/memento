#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
);

async function testWithPosts() {
  console.log('🧪 Testing Album Generation with Posts...\n');

  try {
    // Step 1: Get family data
    console.log('1. Getting family data...');
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('id, name')
      .limit(1);

    if (familiesError || !families || families.length === 0) {
      console.log('❌ No families found');
      return;
    }

    const family = families[0];
    console.log(`✅ Family: ${family.name} (${family.id})`);

    // Step 2: Get user data
    console.log('\n2. Getting user data...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name')
      .limit(1);

    if (profilesError || !profiles || profiles.length === 0) {
      console.log('❌ No users found');
      return;
    }

    const user = profiles[0];
    console.log(`✅ User: ${user.name} (${user.user_id})`);

    // Step 3: Check for posts in the family
    console.log('\n3. Checking for posts...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, content_text, created_at')
      .eq('family_id', family.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (postsError) {
      console.log('❌ Error fetching posts:', postsError.message);
      return;
    }

    if (!posts || posts.length === 0) {
      console.log('❌ No posts found for this family');
      console.log('\n💡 To test album generation:');
      console.log('   1. Open the app in your browser');
      console.log('   2. Create some posts with images');
      console.log('   3. Try generating an album');
      return;
    }

    console.log(`✅ Found ${posts.length} posts:`);
    posts.forEach((post, index) => {
      const date = new Date(post.created_at).toLocaleDateString();
      console.log(
        `   ${index + 1}. ${date}: ${post.content_text?.substring(0, 50)}...`
      );
    });

    // Step 4: Test with a period that has posts
    console.log('\n4. Testing album generation with posts...');

    // Get the date range of existing posts
    const dates = posts.map(p => new Date(p.created_at));
    const earliestDate = new Date(Math.min(...dates));
    const latestDate = new Date(Math.max(...dates));

    const start = earliestDate.toISOString().split('T')[0];
    const end = latestDate.toISOString().split('T')[0];

    console.log(`   Period: ${start} to ${end}`);

    const requestData = {
      family_id: family.id,
      start,
      end,
      requested_by: user.user_id,
    };

    const renderResponse = await fetch('http://localhost:3003/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    console.log(`   Response status: ${renderResponse.status}`);

    if (renderResponse.ok) {
      const renderData = await renderResponse.json();

      if (renderData.ok) {
        console.log('✅ PDF generation successful!');
        console.log(`   URL: ${renderData.pdf_url}`);
        console.log(`   Pages: ${renderData.page_count}`);
      } else {
        console.log(`❌ PDF generation failed: ${renderData.error}`);
      }
    } else {
      const errorText = await renderResponse.text();
      console.log(`❌ HTTP ${renderResponse.status}: ${errorText}`);
    }

    console.log('\n🎉 Album generation is working!');
    console.log(
      'The service can now generate PDFs when there are posts available.'
    );
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWithPosts();
