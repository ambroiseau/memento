#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
);

async function testFullTimestamps() {
  console.log('🧪 Testing Album Generation with Full Timestamps...\n');

  try {
    // Step 1: Get family and user data
    console.log('1. Getting family and user data...');
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

    // Step 2: Test with full timestamps (like the app does)
    console.log('\n2. Testing with full timestamps...');

    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      1
    ); // First day at 00:00:01
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    ); // Last day at 23:59:59

    const start = startOfMonth.toISOString(); // Full ISO timestamp
    const end = endOfMonth.toISOString(); // Full ISO timestamp

    console.log(`   Start: ${start}`);
    console.log(`   End: ${end}`);

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

    console.log('\n🎉 Full timestamp test completed!');
    console.log('The album generation should now work in the app.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFullTimestamps();
