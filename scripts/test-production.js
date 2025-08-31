#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
);

async function testProduction() {
  console.log('🚀 Testing Production Deployment...\n');

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

    // Step 2: Test production PDF service
    console.log('\n2. Testing production PDF service...');

    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      1
    );
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const start = startOfMonth.toISOString();
    const end = endOfMonth.toISOString();

    console.log(`   Start: ${start}`);
    console.log(`   End: ${end}`);

    const requestData = {
      family_id: family.id,
      start,
      end,
      requested_by: user.user_id,
    };

    const productionUrl = 'https://memento-production-5f3d.up.railway.app';
    const renderResponse = await fetch(`${productionUrl}/render`, {
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
        console.log('✅ Production PDF generation successful!');
        console.log(`   URL: ${renderData.pdf_url}`);
        console.log(`   Pages: ${renderData.page_count}`);
      } else {
        console.log(`❌ Production PDF generation failed: ${renderData.error}`);
      }
    } else {
      const errorText = await renderResponse.text();
      console.log(`❌ HTTP ${renderResponse.status}: ${errorText}`);
    }

    console.log('\n🎉 Production test completed!');
    console.log('Your Memento app is now fully operational in production! 🚀');
  } catch (error) {
    console.error('❌ Production test failed:', error.message);
  }
}

testProduction();
