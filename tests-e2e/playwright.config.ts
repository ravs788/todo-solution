import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  workers: process.env.CI ? 1 : 3,
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
  timeout: 60000,
  // webServer: [
  //   {
  //     command: 'cmd /c "cd ..\\todo-backend && mvn -q spring-boot:run -Dspring.profiles.active=h2"',
  //     port: 8081,
  //     reuseExistingServer: true,
  //     timeout: 180000
  //   },
  //   {
  //     command: 'cmd /c "cd ..\\todo-frontend && npm start"',
  //     port: 3000,
  //     reuseExistingServer: true,
  //     timeout: 180000
  //   }
  // ],
  projects: process.env.CI
    ? [
        {
          name: 'chromium',
          use: {
            browserName: 'chromium',
            trace: 'on',
            screenshot: 'only-on-failure',
            video: 'retry-with-video',
            headless: false // Run in headed mode for debugging
          }
        },
        { name: 'firefox', use: { browserName: 'firefox' } },
        { name: 'api', testDir: './api-tests', use: {}, workers: 1 },
        { name: 'ui', testDir: './ui-tests', use: {} },
        { name: 'ui-mobile', testDir: './ui-tests', use: { browserName: 'chromium', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, actionTimeout: 10000, navigationTimeout: 30000 } },
        { name: 'ui-tablet', testDir: './ui-tests', use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } } },
        { name: 'ui-desktop', testDir: './ui-tests', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } }
      ]
    : [
        {
          name: 'chromium',
          use: {
            browserName: 'chromium',
            trace: 'on',
            screenshot: 'only-on-failure',
            video: 'retry-with-video',
            headless: false // Run in headed mode for debugging
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
        { name: 'ui', testDir: './ui-tests', use: {} },
        { name: 'ui-mobile', testDir: './ui-tests', use: { browserName: 'chromium', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, actionTimeout: 15000, navigationTimeout: 30000 } },
        { name: 'ui-tablet', testDir: './ui-tests', use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } } },
        { name: 'ui-desktop', testDir: './ui-tests', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } }
      ]
});
