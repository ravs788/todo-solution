/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  reporters: [
    "default",
    [
      "jest-allure2",
      {
        resultsDir: "allure-report"
      }
    ]
  ]
};
