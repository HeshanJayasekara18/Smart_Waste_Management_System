// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock axios globally to avoid ESM parsing in Jest environment
jest.mock('axios', () => {
  const mockAxios = {
    create: () => mockAxios,
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  };
  return mockAxios;
});

// Mock app API layer to return deterministic results during tests
jest.mock('./api/WasteSubmissionAPI', () => ({
  __esModule: true,
  default: {
    create: jest.fn(async () => ({})),
    list: jest.fn(async () => []),
    get: jest.fn(async () => ({})),
    update: jest.fn(async () => ({})),
    updateStatus: jest.fn(async () => ({})),
    remove: jest.fn(async () => ({})),
  },
}));
