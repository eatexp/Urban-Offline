// Simple test to verify vitest works
// Using globals instead of imports since vite.config.js has globals: true
console.log('TEST FILE LOADED');

describe('Test Suite', () => {
  console.log('DESCRIBE CALLED');
  
  it('should work', () => {
    console.log('TEST CALLED');
    expect(true).toBe(true);
  });
});