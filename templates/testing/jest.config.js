/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/__test__/**/*.test.js", "**/*.test.js"],
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.js", "!src/**/*.test.js"],
};
