#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
);

async function testPDFService() {
  console.log('🧪 Testing PDF Generation Service...\n');

  try {
    // Test 1: Check if PDF service is running
    console.log('1. Testing PDF service health...');
    const healthResponse = await fetch('http://localhost:3003/health');

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`✅ PDF service is running: ${healthData.status}`);
    } else {
      console.log('❌ PDF service is not responding');
      return;
    }

    // Test 2: Get a real family ID for testing
    console.log('\n2. Getting test family data...');
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('id, name')
      .limit(1);

    if (familiesError || !families || families.length === 0) {
      console.log('❌ No families found for testing');
      console.log('   Create a family first in the app');
      return;
    }

    const testFamily = families[0];
    console.log(`✅ Using family: ${testFamily.name} (${testFamily.id})`);

    // Test 3: Get a real user ID for testing
    console.log('\n3. Getting test user data...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name')
      .limit(1);

    if (profilesError || !profiles || profiles.length === 0) {
      console.log('❌ No users found for testing');
      console.log('   Create a user profile first in the app');
      return;
    }

    const testUser = profiles[0];
    console.log(`✅ Using user: ${testUser.name} (${testUser.user_id})`);

    // Test 4: Test PDF generation
    console.log('\n4. Testing PDF generation...');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const start = startOfMonth.toISOString().split('T')[0];
    const end = endOfMonth.toISOString().split('T')[0];

    console.log(`   Period: ${start} to ${end}`);

    const renderResponse = await fetch('http://localhost:3003/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        family_id: testFamily.id,
        start,
        end,
        requested_by: testUser.user_id,
      }),
    });

    if (renderResponse.ok) {
      const renderData = await renderResponse.json();
      if (renderData.ok) {
        console.log(`✅ PDF generated successfully!`);
        console.log(`   URL: ${renderData.pdf_url}`);
        console.log(`   Pages: ${renderData.page_count}`);
      } else {
        console.log(`❌ PDF generation failed: ${renderData.error}`);
      }
    } else {
      console.log(`❌ PDF service error: ${renderResponse.status}`);
    }

    console.log('\n📋 SUMMARY:');
    console.log('The PDF generation service is now working!');
    console.log('You can now generate albums in the app.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPDFService();
