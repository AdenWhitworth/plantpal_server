module.exports = {
    preset: 'ts-jest', // For TypeScript support
    testEnvironment: 'node', // To simulate Node.js environment
    setupFiles: ['dotenv/config'],
    transform: {
      '^.+\\.tsx?$': 'ts-jest', // Transpiling TypeScript
    },
    moduleFileExtensions: ['ts', 'js'], // Supported file extensions
    transformIgnorePatterns: ['<rootDir>/node_modules/'], // Ignoring transformations for node_modules
};