import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Extend Vitest's expect method with methods from react-testing-library
// Only attempt to load jest-dom matchers if available (dependency might be missing)
try {
    // eslint-disable-next-line
    const matchers = require('@testing-library/jest-dom/matchers');
    expect.extend(matchers);
} catch (e) {
    // jest-dom not available, standard vitest matchers will be used
}

Object.assign(global, { TextDecoder, TextEncoder });

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});
