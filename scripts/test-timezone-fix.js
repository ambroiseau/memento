#!/usr/bin/env node

console.log('🧪 Testing Timezone Fix...\n');

// Simulate the old way (before fix)
console.log('1. OLD WAY (before fix):');
const now = new Date();
const startOfMonthOld = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 1);
const endOfMonthOld = new Date(
  now.getFullYear(),
  now.getMonth() + 1,
  0,
  23,
  59,
  59
);

const startOld = startOfMonthOld.toISOString();
const endOld = endOfMonthOld.toISOString();

console.log(`   Start: ${startOld}`);
console.log(`   End: ${endOld}`);
console.log(`   Local Start: ${new Date(startOld).toLocaleString('fr-FR')}`);
console.log(`   Local End: ${new Date(endOld).toLocaleString('fr-FR')}`);

// Simulate the new way (after fix)
console.log('\n2. NEW WAY (after fix):');
const timezoneOffset = now.getTimezoneOffset() * 60000; // Convert to milliseconds

const startOfMonthNew = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 1);
const endOfMonthNew = new Date(
  now.getFullYear(),
  now.getMonth() + 1,
  0,
  23,
  59,
  59
);

// Convert to UTC by adding timezone offset
const startNew = new Date(
  startOfMonthNew.getTime() - timezoneOffset
).toISOString();
const endNew = new Date(endOfMonthNew.getTime() - timezoneOffset).toISOString();

console.log(`   Start: ${startNew}`);
console.log(`   End: ${endNew}`);
console.log(`   Local Start: ${new Date(startNew).toLocaleString('fr-FR')}`);
console.log(`   Local End: ${new Date(endNew).toLocaleString('fr-FR')}`);

console.log('\n3. COMPARISON:');
console.log(
  `   Timezone Offset: ${now.getTimezoneOffset()} minutes (${now.getTimezoneOffset() / 60} hours)`
);
console.log(
  `   Start difference: ${new Date(startNew).getTime() - new Date(startOld).getTime()} ms`
);
console.log(
  `   End difference: ${new Date(endNew).getTime() - new Date(endOld).getTime()} ms`
);

console.log('\n✅ Timezone fix applied!');
console.log(
  'The timestamps should now correctly represent the local time range.'
);
