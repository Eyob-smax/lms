export default {
  displayName: 'backend',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^better-auth/adapters/prisma$': '<rootDir>/src/test/mocks/better-auth-prisma.mock.ts',
    '^better-auth/node$': '<rootDir>/src/test/mocks/better-auth-node.mock.ts',
    '^better-auth$': '<rootDir>/src/test/mocks/better-auth.mock.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/backend',
};
