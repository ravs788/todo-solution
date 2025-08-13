/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
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
