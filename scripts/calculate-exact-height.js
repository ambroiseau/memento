#!/usr/bin/env node

console.log('🧮 Calculating Exact Heights...\n');

// Simulate the exact layout calculations
function calculateExactHeights() {
  const containerWidth = 400; // Approximate container width
  const gap = 8; // 2px gap = 8px in Tailwind

  // Calculate dimensions for 2-column grid
  const columnWidth = (containerWidth - gap) / 2;

  // Right column: 2 square images + gap
  const squareHeight = columnWidth; // aspect-square = width = height
  const rightColumnHeight = squareHeight * 2 + gap;

  console.log('📏 Exact Calculations:');
  console.log(`Container width: ${containerWidth}px`);
  console.log(`Column width: ${columnWidth}px`);
  console.log(`Gap: ${gap}px`);
  console.log(`Square height: ${squareHeight}px`);
  console.log(`Right column height: ${rightColumnHeight}px`);
  console.log(`   = ${squareHeight} + ${gap} + ${squareHeight}`);
  console.log(`   = ${rightColumnHeight}px`);

  console.log('\n🎯 Solution:');
  console.log(`First image should be: h-[${rightColumnHeight}px]`);
  console.log(`Instead of: h-[400px]`);

  return rightColumnHeight;
}

const exactHeight = calculateExactHeights();

console.log('\n✅ Recommendation:');
console.log(`Change h-[400px] to h-[${exactHeight}px]`);
console.log(
  'This will make the first image exactly match the height of the right column'
);
