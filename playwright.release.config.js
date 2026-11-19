import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3018';
const localPreview = !process.env.BASE_URL;
const phones = ['iPhone SE', 'iPhone 14', 'iPhone 14 Pro Max', 'Pixel 5'];

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  outputDir: 'release-test-results',
  reporter: [['list'], ['html', { outputFolder: 'release-playwright-report', open: 'never' }]],
  use: {
    baseURL,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: localPreview ? {
    command: 'python3 -m http.server 3018 --bind 127.0.0.1 --directory _site',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  } : undefined,
  projects: [
    ...phones.map((name) => ({
      name: `Watchdog: ${name}`,
      testMatch: '**/mobile-layout.spec.js',
      use: { ...devices[name] },
    })),
    { name: 'Release: desktop', testMatch: '**/release/*.spec.js', use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } } },
    { name: 'Release: tablet', testMatch: '**/release/*.spec.js', use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } } },
    { name: 'Release: mobile Safari', testMatch: '**/release/*.spec.js', use: { ...devices['iPhone SE'] } },
  ],
});
