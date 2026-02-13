import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

Object.assign(globalThis, { TextDecoder, TextEncoder });

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});
