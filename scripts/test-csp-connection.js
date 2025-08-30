#!/usr/bin/env node

import fetch from 'node-fetch';

console.log('🔍 Testing CSP and PDF Service Connection...\n');

async function testCSP() {
  try {
    // Test 1: Check if main app is running
    console.log('1️⃣ Testing main app...');
    const mainAppResponse = await fetch('http://localhost:3001');
    console.log(`   Main app status: ${mainAppResponse.status}`);

    // Test 2: Check CSP file
    console.log('\n2️⃣ Testing CSP file...');
    const cspResponse = await fetch('http://localhost:3001/public/csp.js');
    const cspContent = await cspResponse.text();

    if (cspContent.includes('localhost:3002')) {
      console.log('   ✅ CSP includes localhost:3002');
    } else {
      console.log('   ❌ CSP does not include localhost:3002');
    }

    // Test 3: Check PDF service health
    console.log('\n3️⃣ Testing PDF service...');
    const pdfHealthResponse = await fetch('http://localhost:3002/health');
    console.log(`   PDF service health: ${pdfHealthResponse.status}`);

    if (pdfHealthResponse.ok) {
      const healthData = await pdfHealthResponse.json();
      console.log(`   Health data:`, healthData);
    }

    // Test 4: Test render endpoint with dummy data
    console.log('\n4️⃣ Testing render endpoint...');
    const renderResponse = await fetch('http://localhost:3002/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        family_id: '00000000-0000-0000-0000-000000000000',
        start: '2024-01-01',
        end: '2024-01-31',
        requested_by: '00000000-0000-0000-0000-000000000000',
      }),
    });

    console.log(`   Render endpoint status: ${renderResponse.status}`);

    if (renderResponse.ok) {
      const renderData = await renderResponse.json();
      console.log(`   Render response:`, renderData);
    } else {
      const errorData = await renderResponse.text();
      console.log(`   Error response:`, errorData);
    }

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCSP();
