module.exports = {
    // Test environment
    testEnvironment: 'node',

    // Test files pattern
    testMatch: ['**/tests/**/*.test.js'],

    // Coverage configuration
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js',
        '!src/app.js'
    ],

    // Test timeout
    testTimeout: 10000,

    // Setup files
    setupFiles: ['dotenv/config'],

    // Verbose output
    verbose: true,

    // Clear mock calls between every test
    clearMocks: true,

    // Stop running tests after the first failure
    bail: false,

    // Force exit after all tests complete
    forceExit: true,

    // Automatically clear mock calls and instances between every test
    clearMocks: true,

    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: true,

    // The directory where Jest should output its coverage files
    coverageDirectory: "coverage",

    // Indicates which provider should be used to instrument code for coverage
    coverageProvider: "v8",

    // A list of reporter names that Jest uses when writing coverage reports
    coverageReporters: [
        "json",
        "text",
        "lcov",
        "clover"
    ],

    // An array of regexp pattern strings used to skip coverage collection
    coveragePathIgnorePatterns: [
        "/node_modules/"
    ],

    // A list of paths to directories that Jest should use to search for files in
    roots: [
        "<rootDir>"
    ],

    // The test environment that will be used for testing
    testEnvironment: "node",

    // The glob patterns Jest uses to detect test files
    testMatch: [
        "**/tests/**/*.test.js"
    ],

    // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
    testPathIgnorePatterns: [
        "/node_modules/"
    ]
}; 