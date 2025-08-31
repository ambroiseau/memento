#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
);

async function debugAlbumGeneration() {
  console.log('🔍 Debugging Album Generation...\n');

  try {
    // Step 1: Get real family and user data
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
    console.log(`✅ Family: ${family.name}`);
    console.log(`   ID: ${family.id}`);
    console.log(`   ID type: ${typeof family.id}`);
    console.log(`   ID length: ${family.id.length}`);

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
    console.log(`✅ User: ${user.name}`);
    console.log(`   ID: ${user.user_id}`);
    console.log(`   ID type: ${typeof user.user_id}`);
    console.log(`   ID length: ${user.user_id.length}`);

    // Step 3: Check if UUIDs are valid
    console.log('\n3. Validating UUIDs...');
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const isFamilyIdValid = uuidRegex.test(family.id);
    const isUserIdValid = uuidRegex.test(user.user_id);

    console.log(`   Family ID valid: ${isFamilyIdValid}`);
    console.log(`   User ID valid: ${isUserIdValid}`);

    if (!isFamilyIdValid || !isUserIdValid) {
      console.log('❌ Invalid UUIDs detected!');
      return;
    }

    // Step 4: Test PDF generation with real data
    console.log('\n4. Testing PDF generation with real data...');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const start = startOfMonth.toISOString().split('T')[0];
    const end = endOfMonth.toISOString().split('T')[0];

    const requestData = {
      family_id: family.id,
      start,
      end,
      requested_by: user.user_id,
    };

    console.log('   Request data:');
    console.log('   ', JSON.stringify(requestData, null, 2));

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
      console.log('   Response data:');
      console.log('   ', JSON.stringify(renderData, null, 2));

      if (renderData.ok) {
        console.log('✅ PDF generation successful!');
      } else {
        console.log(`❌ PDF generation failed: ${renderData.error}`);
      }
    } else {
      const errorText = await renderResponse.text();
      console.log(`❌ HTTP ${renderResponse.status}: ${errorText}`);
    }

    console.log('\n📋 SUMMARY:');
    console.log(
      'The debug shows the exact data being sent to the PDF service.'
    );
    console.log('If the UUIDs are valid and the request data looks correct,');
    console.log('the issue might be in the PDF service itself.');
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAlbumGeneration();
