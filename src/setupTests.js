import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Polyfills
import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextDecoder, TextEncoder });

// Runs a cleanup after each test case (e.g. clearing jsdom)
// afterEach is available globally due to test.globals: true in vite.config.js
afterEach(() => {
  cleanup();
});