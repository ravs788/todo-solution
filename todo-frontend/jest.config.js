module.exports = {
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  },
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"]
};
