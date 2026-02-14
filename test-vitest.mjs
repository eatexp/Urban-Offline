// Simple test to verify vitest works
import { describe, it, expect } from 'vitest';

console.log('TEST FILE LOADED');

describe('Test Suite', () => {
  console.log('DESCRIBE CALLED');
  
  it('should work', () => {
    console.log('TEST CALLED');
    expect(true).toBe(true);
  });
});