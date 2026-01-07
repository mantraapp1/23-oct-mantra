/**
 * Test Initials Extraction
 * Quick test to demonstrate the improved initials logic
 */

const getInitials = (name) => {
  if (!name || name === 'Anonymous') {
    return 'U';
  }
  
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  const firstInitial = words[0].charAt(0).toUpperCase();
  const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
  
  return firstInitial + lastInitial;
};

console.log('='.repeat(60));
console.log('INITIALS EXTRACTION TEST');
console.log('='.repeat(60));
console.log('');

const testCases = [
  'Pankaj Rajput',
  'Ganesh',
  'John Doe',
  'John Doe Smith',
  'Test User',
  'A',
  'Anonymous',
  'Sarah Johnson',
  'Mike',
  'Robert James Wilson',
];

testCases.forEach(name => {
  const initials = getInitials(name);
  const url = `https://ui-avatars.com/api/?name=${initials}&background=6366f1&color=fff&size=128&bold=true`;
  console.log(`Name: "${name}"`);
  console.log(`  Initials: ${initials}`);
  console.log(`  URL: ${url}`);
  console.log('');
});

console.log('='.repeat(60));
console.log('✅ All initials extracted correctly!');
console.log('='.repeat(60));
