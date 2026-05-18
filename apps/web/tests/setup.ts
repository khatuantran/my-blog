import { afterAll, afterEach, beforeAll } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { resetMswHandlers, startMswServer, stopMswServer } from './_helpers/msw-server';

beforeAll(() => startMswServer());
afterEach(() => resetMswHandlers());
afterAll(() => stopMswServer());

// jsdom polyfills cho upload flow (URL.createObjectURL không có default)
if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:mock';
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {};
}
