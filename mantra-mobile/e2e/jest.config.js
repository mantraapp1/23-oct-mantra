/** @type {import('jest').Config} */
module.exports = {
    maxWorkers: 1,
    testTimeout: 120000,
    rootDir: '..',
    testMatch: ['<rootDir>/e2e/**/*.e2e.ts'],
    testPathIgnorePatterns: ['/node_modules/'],
    reporters: ['detox/runners/jest/reporter'],
    globalSetup: 'detox/runners/jest/globalSetup',
    globalTeardown: 'detox/runners/jest/globalTeardown',
    testEnvironment: 'detox/runners/jest/testEnvironment',
    verbose: true,
    preset: 'ts-jest',
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
};
