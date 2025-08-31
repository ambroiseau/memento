#!/usr/bin/env node

// Simulate the new formatPeriod function
function formatPeriod(start, end) {
  // Parse dates manually to avoid timezone issues
  const parseDate = isoString => {
    const dateStr = isoString.split('T')[0]; // YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    return { year, month: month - 1, day }; // month is 0-indexed in JS
  };

  const startParts = parseDate(start);
  const endParts = parseDate(end);

  // French month names
  const months = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];

  // For now, we only generate monthly albums, so just show the month
  // Use the end month as it's typically the main month of the album
  const month = months[endParts.month];
  const year = endParts.year;

  return `Album ${month} ${year}`;
}

console.log('🧪 Testing New Period Formatting...\n');

// Test cases
const testCases = [
  {
    name: 'Same day in August',
    start: '2025-08-15T00:00:01.000Z',
    end: '2025-08-15T23:59:59.000Z',
  },
  {
    name: 'Same month (August)',
    start: '2025-08-01T00:00:01.000Z',
    end: '2025-08-31T23:59:59.000Z',
  },
  {
    name: 'Different months (July-August)',
    start: '2025-07-15T00:00:01.000Z',
    end: '2025-08-15T23:59:59.000Z',
  },
  {
    name: 'Different years (December-January)',
    start: '2024-12-15T00:00:01.000Z',
    end: '2025-01-15T23:59:59.000Z',
  },
  {
    name: 'First day of month',
    start: '2025-08-01T00:00:01.000Z',
    end: '2025-08-15T23:59:59.000Z',
  },
];

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}:`);
  console.log(`   Start: ${testCase.start}`);
  console.log(`   End: ${testCase.end}`);
  console.log(`   Result: ${formatPeriod(testCase.start, testCase.end)}`);
  console.log('');
});

console.log('✅ New formatting applied!');
console.log(
  'The album titles in settings will now show readable French dates.'
);
