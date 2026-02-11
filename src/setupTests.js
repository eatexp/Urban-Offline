import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { TextEncoder, TextDecoder } from 'util';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

Object.assign(global, { TextDecoder, TextEncoder });

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});
