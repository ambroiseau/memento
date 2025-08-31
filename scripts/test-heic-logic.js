#!/usr/bin/env node

console.log('🧪 Testing HEIC Detection Logic...\n');

// Test the HEIC detection logic without importing heic2any
function testHEICDetection() {
  console.log('🔍 Testing HEIC detection logic...');

  const testFiles = [
    { name: 'photo.heic', type: 'image/heic', expected: true },
    { name: 'photo.HEIC', type: 'image/heic', expected: true },
    { name: 'photo.heif', type: 'image/heif', expected: true },
    { name: 'photo.HEIF', type: 'image/heif', expected: true },
    { name: 'photo.jpg', type: 'image/jpeg', expected: false },
    { name: 'photo.png', type: 'image/png', expected: false },
    { name: 'photo.webp', type: 'image/webp', expected: false },
    { name: 'document.pdf', type: 'application/pdf', expected: false },
  ];

  let passed = 0;
  let total = testFiles.length;

  testFiles.forEach(file => {
    const isHEIC =
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif');

    const status = isHEIC === file.expected ? '✅ PASS' : '❌ FAIL';
    if (isHEIC === file.expected) passed++;

    console.log(
      `   ${status} ${file.name} (${file.type}): ${isHEIC ? 'HEIC' : 'Not HEIC'}`
    );
  });

  console.log(`\n📊 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All HEIC detection tests passed!');
  } else {
    console.log('❌ Some tests failed - check the logic');
  }
}

// Test supported format detection
function testSupportedFormats() {
  console.log('\n📸 Testing supported format detection...');

  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
  ];

  const supportedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.heic',
    '.heif',
  ];

  const testFiles = [
    { name: 'photo.jpg', type: 'image/jpeg' },
    { name: 'photo.png', type: 'image/png' },
    { name: 'photo.heic', type: 'image/heic' },
    { name: 'photo.pdf', type: 'application/pdf' },
  ];

  testFiles.forEach(file => {
    const extension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));
    const isSupported =
      supportedTypes.includes(file.type) ||
      supportedExtensions.includes(extension);

    const status = isSupported ? '✅ Supported' : '❌ Not supported';
    console.log(`   ${status} ${file.name} (${file.type})`);
  });
}

testHEICDetection();
testSupportedFormats();

console.log('\n📝 Next Steps for Testing:');
console.log('   1. Open http://localhost:3001 in browser');
console.log('   2. Try to upload a HEIC file');
console.log('   3. Check browser console for conversion logs');
console.log('   4. Verify the converted image appears');
console.log('   5. Test error handling with unsupported files');

console.log('\n⚠️ IMPORTANT: Test in browser before deploying!');
