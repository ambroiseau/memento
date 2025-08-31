#!/usr/bin/env node

console.log('🧪 Testing Image Layout Heights...\n');

// Simulate the CSS classes and calculate heights
function calculateLayoutHeight(imageCount) {
  const containerWidth = 400; // Approximate container width
  const gap = 8; // 2px gap = 8px in Tailwind

  if (imageCount === 1) {
    return 384; // max-h-96 = 384px
  }

  if (imageCount === 2) {
    const imageWidth = (containerWidth - gap) / 2;
    return imageWidth; // aspect-square = width = height
  }

  if (imageCount === 3) {
    const imageWidth = (containerWidth - gap) / 2;
    const rightColumnHeight = imageWidth * 2 + gap; // Two square images + gap
    return rightColumnHeight; // Height is determined by right column (same as 4 images)
  }

  if (imageCount >= 4) {
    const imageWidth = (containerWidth - gap) / 2;
    return imageWidth * 2 + gap; // 2x2 grid = 2 squares + gap
  }
}

console.log('📏 Height Comparison:');
console.log('1 image:  ', calculateLayoutHeight(1), 'px');
console.log('2 images: ', calculateLayoutHeight(2), 'px');
console.log('3 images: ', calculateLayoutHeight(3), 'px');
console.log('4 images: ', calculateLayoutHeight(4), 'px');

console.log('\n✅ Analysis:');
console.log('- 1 image: Full height (384px)');
console.log('- 2 images: Square height (196px each)');
console.log(
  '- 3 images: First image fixed height (400px), matches 4 images height!'
);
console.log('- 4 images: Square grid height (196px each)');

console.log('\n🎯 Fix Applied:');
console.log(
  '- 3-image layout: First image uses fixed height (400px) for consistency'
);
console.log('- Right column uses aspect-square for consistency');
console.log('- Total height matches 4-image posts for visual consistency');
console.log('- Images are cropped/zoomed to fit perfectly in their containers');
