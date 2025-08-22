import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  workers: process.env.CI ? 1 : 5,
  testDir: path.join(__dirname, 'tests'),
  outputDir: path.join(__dirname, 'test-results'),
  reporter: [
    ['list'],
    [
      'html',
      { outputFolder: path.join(__dirname, 'pw-html-report'), open: 'never' }
    ],
    [
      'junit',
      { outputFile: path.join(__dirname, 'test-results', 'results.xml') }
    ]
  ],
  retries: 0,
  timeout: 30000,
  use: {
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retry-with-video'
  },
  projects: process.env.CI
    ? [{ name: 'chromium', use: { browserName: 'chromium' } }]
    : [
        { name: 'chromium', use: { browserName: 'chromium' } },
        { name: 'firefox', use: { browserName: 'firefox' } },
        { name: 'webkit', use: { browserName: 'webkit' } }
      ]
});
