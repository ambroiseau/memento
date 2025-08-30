#!/usr/bin/env node

// Simple test script for the PDF renderer API
const testRenderAPI = async () => {
  const testData = {
    family_id: "test-family-id",
    start: "2024-01-01",
    end: "2024-01-31",
    requested_by: "test-user-id"
  };

  console.log('Testing PDF Renderer API...');
  console.log('Request data:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('http://localhost:3001/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.ok) {
      console.log('✅ API test successful!');
    } else {
      console.log('❌ API test failed:', result.error);
    }
  } catch (error) {
    console.log('❌ API test failed with error:', error.message);
  }
};

// Test health endpoint
const testHealthAPI = async () => {
  console.log('\nTesting health endpoint...');
  
  try {
    const response = await fetch('http://localhost:3001/health');
    const result = await response.json();
    
    console.log('Health response:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.status === 'ok') {
      console.log('✅ Health check successful!');
    } else {
      console.log('❌ Health check failed');
    }
  } catch (error) {
    console.log('❌ Health check failed with error:', error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting PDF Renderer API tests...\n');
  
  await testHealthAPI();
  await testRenderAPI();
  
  console.log('\n✨ Tests completed!');
};

runTests().catch(console.error);
