/** Unit tests: fast, no database. */
module.exports = {
  displayName: "unit",
  testEnvironment: "node",
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.json", isolatedModules: true }] },
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: ["**/*.ts", "!**/*.spec.ts", "!**/*.module.ts", "!main.ts"],
  coverageDirectory: "../coverage",
  clearMocks: true,
};
