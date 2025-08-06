import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // All test files live under e2e
  testDir: "./e2e",

  // Each test must finish in 30 s
  timeout: 30 * 1000,

  // Fail the build on first test failure in CI.
  forbidOnly: !!process.env.CI,

  // Retry failed tests in CI (set to 0 locally if you prefer)
  retries: process.env.CI ? 2 : 0,

  // Opt-in to parallelism
  workers: process.env.CI ? 1 : undefined,

  // Shared settings for all the projects below.
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    trace: "on-first-retry",
  },

  // Configure projects for major browsers.
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
