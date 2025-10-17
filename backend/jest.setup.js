import { jest } from '@jest/globals';
jest.setTimeout(30000);

// Silence noisy console output in tests (can be adjusted per-need)
const noop = () => {};
// comment any line if you want to see that level in test output
jest.spyOn(console, 'warn').mockImplementation(noop);
jest.spyOn(console, 'info').mockImplementation(noop);
// Silence errors too to keep CI logs clean
jest.spyOn(console, 'error').mockImplementation(noop);