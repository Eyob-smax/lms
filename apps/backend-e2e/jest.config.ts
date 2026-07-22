export default {
  displayName: 'backend-e2e',
  preset: '../../jest.preset.js',
  globalSetup: '<rootDir>/src/support/global-setup.ts',
  globalTeardown: '<rootDir>/src/support/global-teardown.ts',
  setupFilesAfterEnv: ['<rootDir>/src/support/test-setup.ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^better-auth/adapters/prisma$': '<rootDir>/../backend/src/test/mocks/better-auth-prisma.mock.ts',
    '^better-auth/node$': '<rootDir>/../backend/src/test/mocks/better-auth-node.mock.ts',
    '^better-auth$': '<rootDir>/../backend/src/test/mocks/better-auth.mock.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/backend-e2e',
};
