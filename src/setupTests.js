import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { TextEncoder, TextDecoder } from 'util';

// Extend Vitest's expect method with methods from react-testing-library
// expect.extend(matchers); // matchers are not default exported? checking..
// actually @testing-library/jest-dom/matchers might not be available or compatible directly without install.
// The user has @testing-library/dom and react.
// Let's stick to basic polyfills first to fix the reported error.

Object.assign(global, { TextDecoder, TextEncoder });

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});
