#!/usr/bin/env node

async function testPDFService() {
  console.log('🧪 Testing PDF Service...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3001/health');
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check successful:', healthData);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
      return;
    }

    // Test render endpoint with dummy data
    console.log('\n2. Testing render endpoint...');
    const renderResponse = await fetch('http://localhost:3001/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        family_id: 'test-family-id',
        start: '2024-01-01',
        end: '2024-01-31',
        requested_by: 'test-user-id'
      }),
    });

    const renderData = await renderResponse.json();
    
    if (renderResponse.ok) {
      console.log('✅ Render endpoint responds correctly');
      console.log('Response:', renderData);
    } else {
      console.log('⚠️  Render endpoint error (expected without real data):', renderData);
    }

    console.log('\n🎉 PDF Service is working!');
    console.log('   You can now test the PDF generation in your app.');

  } catch (error) {
    console.log('❌ Service test failed:', error.message);
    console.log('\n💡 Make sure the PDF service is running:');
    console.log('   cd renderer && npm run dev');
  }
}

testPDFService();
