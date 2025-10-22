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
  projects: process.env.CI
    ? [
        {
          name: 'chromium',
          use: {
            browserName: 'chromium',
            trace: 'on',
            screenshot: 'only-on-failure',
            video: 'retry-with-video'
          }
        },
        { name: 'firefox', use: { browserName: 'firefox' } },
        { name: 'api', testDir: './api-tests', use: {}, workers: 1 },
        { name: 'ui', testDir: './ui-tests', use: {} }
      ]
    : [
        {
          name: 'chromium',
          use: {
            browserName: 'chromium',
            trace: 'on',
            screenshot: 'only-on-failure',
            video: 'retry-with-video'
          }
        },
        {
          name: 'firefox',
          use: {
            browserName: 'firefox',
            trace: 'on',
            screenshot: 'only-on-failure',
            video: 'retry-with-video'
          }
        },
        {
          name: 'webkit',
          use: {
            browserName: 'webkit',
            trace: 'on',
            screenshot: 'only-on-failure',
            video: 'retry-with-video'
          }
        },
        { name: 'api', testDir: './api-tests', use: {}, workers: 1 },
        { name: 'ui', testDir: './ui-tests', use: {} }
      ]
});
