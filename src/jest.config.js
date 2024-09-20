module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['dotenv/config'],
    transform: {
      '^.+\\.tsx?$': 'ts-jest', 
    },
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1'
    },
    moduleFileExtensions: ['ts', 'js'], 
    transformIgnorePatterns: ['<rootDir>/node_modules/'], 
};