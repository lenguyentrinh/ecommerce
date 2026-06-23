import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/*.spec.tsx', '**/*.spec.ts', '**/*.test.tsx', '**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default config;
