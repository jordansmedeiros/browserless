// Test server action directly
console.log('Testing server action import...');

try {
  // Test if we can at least import the module
  const module = await import('./app/actions/pje.ts');
  console.log('✅ Module imported successfully');
  console.log('Exported functions:', Object.keys(module));
} catch (error) {
  console.error('❌ Error importing module:', error.message);
  console.error(error.stack);
}
