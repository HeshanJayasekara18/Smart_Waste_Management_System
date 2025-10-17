export default {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/controllers/**/*.js',
    '<rootDir>/services/**/*.js',
    '<rootDir>/models/**/*.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  setupFilesAfterEnv: [],
  transform: {},
  testMatch: ['<rootDir>/tests/**/*.test.js'],
};
