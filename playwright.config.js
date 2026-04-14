import { defineConfig, devices } from '@playwright/test';

/**
 * Mobile layout integrity tests for eldur.studio.
 *
 * Defaults to running against the live site. Override with:
 *   BASE_URL=http://localhost:4000 npx playwright test
 */
const BASE_URL = process.env.BASE_URL || 'https://eldur.studio';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // iPhone SE — narrowest common mobile viewport (375px). If layout
    // holds here, it holds on every mainstream phone.
    { name: 'iPhone SE',          use: { ...devices['iPhone SE'] } },
    { name: 'iPhone 14',          use: { ...devices['iPhone 14'] } },
    { name: 'iPhone 14 Pro Max',  use: { ...devices['iPhone 14 Pro Max'] } },
    { name: 'Pixel 5',            use: { ...devices['Pixel 5'] } },
  ],
});
