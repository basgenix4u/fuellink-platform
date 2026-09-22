/**
 * Integration tests. These run against a REAL PostgreSQL database
 * (TEST_DATABASE_URL), not mocks — the point is to exercise constraints,
 * transactions and concurrency, which mocks cannot verify.
 */
module.exports = {
  displayName: "integration",
  testEnvironment: "node",
  rootDir: "..",
  testRegex: "test/.*\\.e2e-spec\\.ts$",
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json", isolatedModules: true }] },
  moduleFileExtensions: ["ts", "js", "json"],
  globalSetup: "<rootDir>/test/global-setup.ts",
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  testTimeout: 30_000,
  maxWorkers: 1, // shared database — run serially
  clearMocks: true,
};
