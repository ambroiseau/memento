#!/usr/bin/env node

console.log('🧪 Testing HEIC Conversion (Simple Test)...\n');

// Test the heic2any library import
try {
  console.log('📦 Testing heic2any import...');
  const heic2any = require('heic2any');
  console.log('✅ heic2any library imported successfully');
} catch (error) {
  console.log('❌ Error importing heic2any:', error.message);
  process.exit(1);
}

// Test file format detection logic
function testFormatDetection() {
  console.log('\n🔍 Testing format detection...');

  const testCases = [
    { name: 'photo.heic', type: 'image/heic', expected: true },
    { name: 'photo.HEIC', type: 'image/heic', expected: true },
    { name: 'photo.jpg', type: 'image/jpeg', expected: false },
    { name: 'photo.png', type: 'image/png', expected: false },
  ];

  testCases.forEach(testCase => {
    const isHEIC =
      testCase.type === 'image/heic' ||
      testCase.type === 'image/heif' ||
      testCase.name.toLowerCase().endsWith('.heic') ||
      testCase.name.toLowerCase().endsWith('.heif');

    const status = isHEIC === testCase.expected ? '✅ PASS' : '❌ FAIL';
    console.log(
      `   ${status} ${testCase.name}: ${isHEIC ? 'HEIC' : 'Not HEIC'}`
    );
  });
}

testFormatDetection();

console.log('\n📝 Next Steps:');
console.log('   1. Test with real HEIC file in browser');
console.log('   2. Check if conversion works in CreatePost component');
console.log('   3. Verify error handling');
console.log('   4. Test on mobile device');

console.log('\n⚠️ IMPORTANT: Test thoroughly before deploying!');
