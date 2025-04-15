// packages/shared/jest.config.ts
import type { Config } from "jest";

const config: Config = {
  // Use the node environment for backend testing
  testEnvironment: "node",

  // Use standard ts-jest preset
  preset: "ts-jest",

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // A map from regular expressions to module names or arrays of module names
  // This maps the '@/' alias used in your imports to the 'src' directory
  moduleNameMapper: {
    // Map .js imports in ESM Node16/Next modules back to their TS source
    "^(.{1,2}/.*).js$": "$1", // No longer needed for CommonJS -> Now needed for NodeNext/ESM
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // The root directory that Jest should scan for tests and modules within
  rootDir: ".", // Assumes jest.config.ts is in the package root

  // A list of paths to directories that Jest should use to search for files in
  // Adjust if your tests are not directly inside the root or in a 'test' folder
  roots: ["<rootDir>"], // Scan the whole package directory

  // Test spec file matching patterns, including .tsx
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)",
  ],

  // Module file extensions for importing modules
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  // A list of paths to modules that run some code to configure or set up the
  // testing environment before each test file in the suite is executed.
  // Use setupFiles to run BEFORE the test framework is installed.
  setupFiles: ["<rootDir>/jest.setup.ts"], // Point to the setup file created above

  // Increase timeout for tests involving external services like LocalStack
  testTimeout: 30000,

  testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/"],
};

module.exports = config;
